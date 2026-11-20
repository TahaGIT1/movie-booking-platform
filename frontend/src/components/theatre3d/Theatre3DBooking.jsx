import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Play, Volume2, VolumeX } from 'lucide-react';
import { api } from '../../services/api';
import { TheatreScene } from './TheatreScene';
import { TheatreHeader } from './TheatreHeader';
import { showSubtitleParts } from './lib/showInfo';
import { SeatSidebar } from './SeatSidebar';
import { CheckoutSheet } from './CheckoutSheet';
import { TicketConfirmed } from './TicketConfirmed';
import { pickBestSeats } from './lib/seatLayout';
import { buildCheckoutSummary, formatINR } from './lib/pricing';
import { PRESET_IDS, PRESET_LABELS, buildCameraPresets, buildTourKeyframes, seatViewPreset, extractYouTubeId } from './lib/scene';

const PAYMENT_DELAY_MS = 900;
const TAP_TOAST_MS = 1800;

function useMediaQuery(query) {
    const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
    useEffect(() => {
        const mql = window.matchMedia(query);
        const onChange = (e) => setMatches(e.matches);
        mql.addEventListener('change', onChange);
        return () => mql.removeEventListener('change', onChange);
    }, [query]);
    return matches;
}

/** TMDB "original" backdrops can be 4K; a 1280px texture is plenty for the screen. */
const screenSizedImage = (url) => (typeof url === 'string' ? url.replace('/t/p/original/', '/t/p/w1280/') : url);

/**
 * Immersive seat selection for /book/:movieId. All booking state lives in `flow`
 * (useBookingFlow), so seats, prices, locks and reservations match the classic page.
 */
export default function Theatre3DBooking({ flow, onSwitchTo2D }) {
    const navigate = useNavigate();
    const { item, layout, seatClasses, seatById, occupiedSet, selectedSeats, toggleSeat, applySelection, setErrorMessage, reserveSeats, user, openAuthModal, isSubmitting } = flow;

    // Layout: full side panel on laptops / landscape tablets, a slim side panel on landscape
    // phones (too short for a bottom sheet), and a bottom sheet on portrait phones and tablets.
    const isWide = useMediaQuery('(min-width: 1024px) and (min-height: 600px)');
    const isLandscapePhone = useMediaQuery('(orientation: landscape) and (max-height: 599px) and (min-width: 560px)');
    const hasSidePanel = isWide || isLandscapePhone;
    const canHover = useMediaQuery('(hover: hover) and (pointer: fine)');
    const [sheetHeight, setSheetHeight] = useState(0);
    const floatingBottom = hasSidePanel ? 16 : sheetHeight + 12;

    // The theatre is a full-screen layer: stop the page (navbar/footer) scrolling behind it.
    useEffect(() => {
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, []);
    const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
    // Browsers only autoplay muted video; the viewer can turn the trailer sound on.
    const [isTrailerMuted, setIsTrailerMuted] = useState(true);
    // DOM layer behind the canvas where the trailer iframe is placed (see TrailerScreen).
    const [trailerLayer, setTrailerLayer] = useState(null);
    const hasTrailer = Boolean(extractYouTubeId(item.trailerUrl));

    /* ---------- camera ---------- */
    const presets = useMemo(() => buildCameraPresets(layout.bounds), [layout.bounds]);
    const initialShot = useMemo(
        () => ({ position: [-6, layout.bounds.topY + 26, layout.bounds.backZ + 26], target: [0, 2, -4] }),
        // The intro position only matters on first mount.
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );
    const shotKey = useRef(0);
    const [active, setActive] = useState('overview');
    const [shot, setShot] = useState(() => ({ key: 0, ...presets.overview }));

    const goTo = useCallback((id, seatId) => {
        shotKey.current += 1;
        const key = shotKey.current;
        if (id === 'tour') setShot({ key, tour: buildTourKeyframes(presets, layout.bounds) });
        else if (id === 'seat') setShot({ key, ...seatViewPreset(seatById.get(seatId)) });
        else setShot({ key, ...presets[id] });
        setActive(id === 'seat' ? `seat:${seatId}` : id);
    }, [presets, layout.bounds, seatById]);
    const handleTourEnd = useCallback(() => setActive('overview'), []);

    /* ---------- hover tooltip ---------- */
    const stageRef = useRef(null);
    const tooltipRef = useRef(null);
    const [hoverId, setHoverId] = useState(null);
    const handleHover = useCallback((id, nativeEvent) => {
        if (nativeEvent && nativeEvent.pointerType && nativeEvent.pointerType !== 'mouse') return;
        setHoverId((prev) => (prev === id ? prev : id));
        const el = tooltipRef.current;
        const stage = stageRef.current;
        if (el && stage && nativeEvent) {
            const rect = stage.getBoundingClientRect();
            el.style.transform = `translate(${nativeEvent.clientX - rect.left + 14}px, ${nativeEvent.clientY - rect.top + 14}px)`;
        }
    }, []);
    const hoverSeat = hoverId ? seatById.get(hoverId) : null;
    const hoverClass = hoverSeat ? seatClasses.find((c) => c.id === hoverSeat.classId) : null;

    /* ---------- selection ---------- */
    const [lastSeat, setLastSeat] = useState(null);
    const [tapToast, setTapToast] = useState(null); // { id, added } — touch feedback
    const toastTimer = useRef(null);
    useEffect(() => () => clearTimeout(toastTimer.current), []);
    const handleSelect = useCallback((id) => {
        if (occupiedSet.has(id)) return;
        const added = !selectedSeats.includes(id);
        toggleSeat(id);
        setLastSeat(id);
        if (!canHover) {
            clearTimeout(toastTimer.current);
            setTapToast({ id, added, at: Date.now() });
            toastTimer.current = setTimeout(() => setTapToast(null), TAP_TOAST_MS);
        }
    }, [occupiedSet, toggleSeat, selectedSeats, canHover]);
    const toastSeat = tapToast ? seatById.get(tapToast.id) : null;
    const toastClass = toastSeat ? seatClasses.find((c) => c.id === toastSeat.classId) : null;

    const handleBestSeats = useCallback((count) => {
        const ids = pickBestSeats(layout.seats, occupiedSet, count);
        if (ids.length === 0) {
            setErrorMessage(`Couldn't find ${count} seats together. Try a smaller group or pick seats manually.`);
            return;
        }
        applySelection(ids);
        setLastSeat(ids[Math.floor(ids.length / 2)]);
    }, [layout.seats, occupiedSet, applySelection, setErrorMessage]);

    const leftByClass = useMemo(() => {
        const selected = new Set(selectedSeats);
        const counts = Object.fromEntries(seatClasses.map((c) => [c.id, 0]));
        layout.seats.forEach((s) => {
            if (!occupiedSet.has(s.id) && !selected.has(s.id)) counts[s.classId] += 1;
        });
        return counts;
    }, [layout.seats, occupiedSet, selectedSeats, seatClasses]);

    /* ---------- checkout ---------- */
    const [step, setStep] = useState('seats'); // seats | checkout | done
    const [pane, setPane] = useState('snacks');
    const [snackQty, setSnackQty] = useState({});
    const [payMethod, setPayMethod] = useState('upi');
    const [isPaying, setIsPaying] = useState(false);
    const [confirmed, setConfirmed] = useState(null);
    const summary = useMemo(() => buildCheckoutSummary(selectedSeats, seatById, seatClasses, snackQty), [selectedSeats, seatById, seatClasses, snackQty]);

    // If the seat hold expires mid-checkout, drop back to the theatre.
    useEffect(() => {
        if (step === 'checkout' && selectedSeats.length === 0 && !isPaying) setStep('seats');
    }, [step, selectedSeats.length, isPaying]);

    const openCheckout = () => {
        setPane('snacks');
        setStep('checkout');
    };

    const handlePay = async () => {
        const snapshot = { summary, seats: [...selectedSeats] };
        setIsPaying(true);
        try {
            const booking = await reserveSeats({ totalAmount: snapshot.summary.total });
            if (!booking) return; // needs sign-in; the auth modal is open
            // Demo payment: no gateway is contacted and no payment details are collected.
            await new Promise((resolve) => setTimeout(resolve, PAYMENT_DELAY_MS));
            const record = {
                ...booking,
                // The backend maps TMDB titles onto any stored show, so the ticket must show
                // the movie the customer actually picked.
                title: item.title || booking.title,
                posterImage: item.posterImage || booking.posterImage,
                seats: booking.seats?.length ? booking.seats : snapshot.seats,
                totalAmount: snapshot.summary.total,
                customerName: user?.fullName || user?.email || 'Ticket Total Customer',
                customerEmail: user?.email || 'customer@tickettotal.com',
                createdAt: new Date().toISOString(),
                qrCodeData: `https://cinepass.my/verify/${booking.orderId}`,
                status: 'CONFIRMED',
                paymentMethod: payMethod,
            };
            await api.recordConfirmedBooking(record);
            setConfirmed(record);
            setStep('done');
        } catch {
            /* reserveSeats already surfaced the error and refreshed booked seats */
        } finally {
            setIsPaying(false);
        }
    };

    const media = useMemo(() => ({
        videoUrl: item.trailerUrl,
        imageUrl: screenSizedImage(item.backdropImage),
        fallbackImageUrl: screenSizedImage(item.posterImage),
        title: item.title,
    }), [item]);

    const subtitle = showSubtitleParts(flow).join(' · ');
    const dimmed = step !== 'seats';
    const lastSeatSelected = lastSeat && selectedSeats.includes(lastSeat);

    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-[#07080d] text-white overflow-hidden">
            <TheatreHeader flow={flow} onBack={() => navigate(-1)} onSwitchTo2D={onSwitchTo2D} />

            <div className="relative flex-1 min-h-0 flex">
                <div ref={stageRef} className="relative flex-1 min-w-0" onPointerLeave={() => setHoverId(null)}>
                    <div className={`absolute inset-0 transition-[filter,transform] duration-500 ${dimmed ? 'blur-md brightness-[0.35] scale-[1.02]' : ''}`}>
                        <div ref={setTrailerLayer} className="absolute inset-0 overflow-hidden" aria-hidden="true" />
                        <TheatreScene
                            layout={layout}
                            seatClasses={seatClasses}
                            occupiedSet={occupiedSet}
                            selectedSeats={selectedSeats}
                            hoverId={hoverId}
                            onHover={handleHover}
                            onSelect={handleSelect}
                            shot={shot}
                            onTourEnd={handleTourEnd}
                            initialShot={initialShot}
                            media={media}
                            paused={dimmed}
                            muted={isTrailerMuted || dimmed}
                            trailerLayer={trailerLayer}
                            reducedMotion={reducedMotion}
                        />
                    </div>

                    {/* Camera presets */}
                    {!dimmed && (
                        <nav aria-label="Camera views" className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 z-10 flex gap-1 p-1 rounded-full bg-black/45 border border-white/10 backdrop-blur-md max-w-[calc(100%-24px)] overflow-x-auto no-scrollbar">
                            {PRESET_IDS.map((id) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => goTo(id)}
                                    aria-pressed={active === id}
                                    className={`shrink-0 px-3 sm:px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold transition-colors cursor-pointer inline-flex items-center gap-1 ${
                                        active === id ? 'bg-white text-black' : 'text-neutral-300 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {id === 'tour' && <Play className="w-3 h-3" />}
                                    {PRESET_LABELS[id]}
                                </button>
                            ))}
                        </nav>
                    )}

                    {/* Trailer sound */}
                    {!dimmed && hasTrailer && (
                        <button
                            type="button"
                            onClick={() => setIsTrailerMuted((m) => !m)}
                            aria-pressed={!isTrailerMuted}
                            aria-label={isTrailerMuted ? 'Turn trailer sound on' : 'Mute trailer'}
                            style={{ bottom: floatingBottom }}
                            className={`absolute right-3 z-10 inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-full bg-black/55 border border-white/15 backdrop-blur-md text-white text-xs font-semibold hover:bg-black/75 transition cursor-pointer`}
                        >
                            {isTrailerMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">{isTrailerMuted ? 'Trailer sound' : 'Mute'}</span>
                        </button>
                    )}

                    {/* View from the last picked seat */}
                    {!dimmed && lastSeatSelected && (
                        <button
                            type="button"
                            onClick={() => goTo('seat', lastSeat)}
                            style={{ bottom: floatingBottom }}
                            className={`absolute left-3 z-10 inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-full bg-teal-400 text-black text-xs font-bold shadow-[0_0_20px_rgba(45,212,191,0.5)] cursor-pointer`}
                        >
                            <Eye className="w-3.5 h-3.5" /> View from {lastSeat}
                        </button>
                    )}

                    {/* Tap feedback on touch screens */}
                    {!dimmed && toastSeat && toastClass && (
                        <div key={tapToast.at} role="status" className="absolute top-14 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                            <div className={`tt-pop px-3.5 py-2 rounded-full border shadow-xl whitespace-nowrap text-xs font-bold backdrop-blur-md ${tapToast.added ? 'bg-teal-400/90 border-teal-200 text-black' : 'bg-[#0b0d16]/90 border-white/15 text-white'}`}>
                                {tapToast.added ? 'Added' : 'Removed'} {toastSeat.id} · {toastClass.name} · {formatINR(toastClass.price)}
                            </div>
                        </div>
                    )}

                    {/* Hover tooltip, positioned imperatively to avoid re-rendering on every pointer move */}
                    <div
                        ref={tooltipRef}
                        className={`pointer-events-none absolute top-0 left-0 z-20 transition-opacity duration-100 ${hoverSeat && !dimmed ? 'opacity-100' : 'opacity-0'}`}
                    >
                        {hoverSeat && hoverClass && (
                            <div className="px-3 py-2 rounded-lg bg-[#0b0d16]/95 border border-white/15 shadow-xl whitespace-nowrap">
                                <div className="text-xs font-bold text-white">
                                    Row {hoverSeat.row} · Seat {hoverSeat.number} · {hoverClass.name} · {formatINR(hoverClass.price)}
                                </div>
                                <div className={`text-[11px] ${occupiedSet.has(hoverSeat.id) ? 'text-neutral-400' : selectedSeats.includes(hoverSeat.id) ? 'text-teal-300' : 'text-emerald-400'}`}>
                                    {occupiedSet.has(hoverSeat.id) ? 'Already booked' : selectedSeats.includes(hoverSeat.id) ? 'Your pick · click to remove' : hoverSeat.recliner ? 'Couple recliner · sold in pairs' : 'Click to select'}
                                </div>
                            </div>
                        )}
                    </div>

                    {!hasSidePanel && !dimmed && (
                        <SeatSidebar variant="sheet" flow={flow} leftByClass={leftByClass} onBestSeats={handleBestSeats} onContinue={openCheckout} onViewSeat={(id) => goTo('seat', id)} onHeightChange={setSheetHeight} />
                    )}

                    {step === 'checkout' && (
                        <CheckoutSheet
                            pane={pane}
                            onPane={setPane}
                            onClose={() => setStep('seats')}
                            snackQty={snackQty}
                            onSnackChange={(id, qty) => setSnackQty((prev) => ({ ...prev, [id]: qty }))}
                            summary={summary}
                            seatIds={selectedSeats}
                            method={payMethod}
                            onMethod={setPayMethod}
                            onPay={handlePay}
                            isPaying={isPaying || isSubmitting}
                            errorMessage={flow.errorMessage}
                            needsSignIn={!user}
                            onSignIn={() => openAuthModal('login')}
                        />
                    )}
                    {step === 'done' && confirmed && <TicketConfirmed booking={confirmed} subtitle={subtitle} />}
                </div>

                {hasSidePanel && (
                    <div className={`flex transition-[filter] duration-500 ${dimmed ? 'blur-sm brightness-50 pointer-events-none' : ''}`}>
                        <SeatSidebar compact={!isWide} flow={flow} leftByClass={leftByClass} onBestSeats={handleBestSeats} onContinue={openCheckout} onViewSeat={(id) => goTo('seat', id)} />
                    </div>
                )}
            </div>
        </div>
    );
}
