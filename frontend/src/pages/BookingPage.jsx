import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, AlertCircle, Loader2, ChevronRight, Tag, Box } from 'lucide-react';
import { api } from '../services/api';
import { useBookingFlow, formatHoldTimer } from '../hooks/useBookingFlow';
import { useImmersiveSupport } from '../hooks/useImmersiveSupport';
import { SeatGrid2D } from '../components/booking/SeatGrid2D';
import { ErrorBoundary } from '../components/ErrorBoundary';

// The 3D theatre (three.js + r3f + drei) is its own chunk so other pages never pay for it.
const Theatre3DBooking = lazy(() => import('../components/theatre3d/Theatre3DBooking'));

const VIEW_PREF_KEY = 'tt_seat_view';

function readViewPref() {
    try {
        return localStorage.getItem(VIEW_PREF_KEY);
    } catch {
        return null;
    }
}

function writeViewPref(value) {
    try {
        localStorage.setItem(VIEW_PREF_KEY, value);
    } catch {
        /* storage unavailable: preference is per-visit only */
    }
}

const Theatre3DLoading = () => (
    <div className="fixed inset-0 z-[60] bg-[#07080d] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-[#f5a623]" />
        <p className="text-xs text-neutral-400 tracking-wide">Opening the auditorium…</p>
    </div>
);

export const BookingPage = () => {
    const { movieId } = useParams();
    const navigate = useNavigate();
    const flow = useBookingFlow(movieId);
    const {
        user, openAuthModal, selectedCity, openLocationModal, item, loading, theatres, selectedTheatre, setSelectedTheatre,
        dates, selectedDate, setSelectedDate, availableShowtimes, selectedTime, setSelectedTime, layout, seatClasses,
        occupiedSet, selectedSeats, toggleSeat, subtotal, holdSecondsLeft, errorMessage, isSubmitting, reserveSeats,
    } = flow;

    const immersive = useImmersiveSupport();
    const [prefers3D, setPrefers3D] = useState(() => readViewPref() !== '2d');
    const show3D = immersive.supported && prefers3D;

    const switchView = (to3D) => {
        setPrefers3D(to3D);
        writeViewPref(to3D ? '3d' : '2d');
    };

    // Coupon state (classic flow)
    const [couponCode, setCouponCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(0);
    const [couponMessage, setCouponMessage] = useState(null);

    const discountAmount = (subtotal * appliedDiscount) / 100;
    const totalAmount = Math.max(0, subtotal - discountAmount);

    const handleApplyCoupon = async (e) => {
        e.preventDefault();
        const code = couponCode.trim().toUpperCase();
        try {
            const offers = await api.getOffers();
            const matched = offers.find((o) => o.code?.toUpperCase() === code);
            if (matched) {
                const discount = matched.discountPercentage || 20;
                setAppliedDiscount(discount);
                setCouponMessage(`✅ ${discount}% discount applied (${matched.title})!`);
            } else if (code === 'CINEPASS20') {
                setAppliedDiscount(20);
                setCouponMessage('✅ 20% discount applied!');
            } else if (code === 'WELCOME50') {
                setAppliedDiscount(50);
                setCouponMessage('🎉 50% Welcome discount applied!');
            } else {
                setAppliedDiscount(0);
                setCouponMessage('❌ Invalid coupon code.');
            }
        } catch {
            if (code === 'CINEPASS20') {
                setAppliedDiscount(20);
                setCouponMessage('✅ 20% discount applied!');
            } else {
                setAppliedDiscount(0);
                setCouponMessage('❌ Invalid coupon code.');
            }
        }
    };

    const handleConfirmBooking = async () => {
        try {
            const booking = await reserveSeats({ totalAmount, rememberPending: true });
            if (booking) navigate('/payment', { state: { booking } });
        } catch {
            /* error message is surfaced by the hook */
        }
    };

    // Auto-resume the classic flow once the user logs in
    useEffect(() => {
        if (!user || show3D) return;
        const saved = sessionStorage.getItem('tt_pending_booking');
        if (!saved) return;
        try {
            const parsed = JSON.parse(saved);
            if (parsed.movieId === movieId && selectedSeats.length > 0 && !isSubmitting) {
                sessionStorage.removeItem('tt_pending_booking');
                handleConfirmBooking();
            }
        } catch {
            sessionStorage.removeItem('tt_pending_booking');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, movieId, selectedSeats]);

    if (loading) {
        return (
            <div className="min-h-screen py-24 flex flex-col items-center justify-center text-center">
                <Loader2 className="w-10 h-10 animate-spin text-[#f5a623] mb-4" />
                <p className="text-neutral-400 text-sm">Loading details from database...</p>
            </div>
        );
    }

    if (!item) {
        return (
            <div className="min-h-screen py-24 px-4 max-w-md mx-auto text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#f5a623]">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-heading font-bold text-white">Movie Not Found</h2>
                <p className="text-xs text-neutral-400">This movie or event does not exist in the database.</p>
                <Link to="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#f5a623] text-black font-semibold text-xs transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Discovery</span>
                </Link>
            </div>
        );
    }

    if (show3D) {
        return (
            <ErrorBoundary>
                <Suspense fallback={<Theatre3DLoading />}>
                    <Theatre3DBooking flow={flow} onSwitchTo2D={() => switchView(false)} />
                </Suspense>
            </ErrorBoundary>
        );
    }

    return (
        <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-10 max-w-[1200px] mx-auto">
            {/* Top Breadcrumb */}
            <div className="mb-6 flex items-center justify-between gap-3">
                <Link to="/" className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Discovery</span>
                </Link>
                <div className="flex items-center gap-3">
                    {immersive.supported && (
                        <button
                            type="button"
                            onClick={() => switchView(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-teal-400/40 bg-teal-400/10 text-teal-300 text-[11px] font-semibold hover:bg-teal-400/20 cursor-pointer"
                        >
                            <Box className="w-3.5 h-3.5" />
                            3D theatre view
                        </button>
                    )}
                    <span className="text-xs text-neutral-500 font-mono hidden sm:inline">STEP 1 OF 2: SEATS &amp; VENUE</span>
                </div>
            </div>

            <div className="bg-[#11131c] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8">
                {/* Header Title */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30 tracking-wider">
                            CINEMA BOOKING
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-heading font-black text-white mt-1">{item.title}</h1>
                        <p className="text-xs text-neutral-400 mt-1">
                            {item.genre} • {item.formats?.join(', ') || 'Standard HD'}
                        </p>
                    </div>
                    {item.posterImage && (
                        <div className="w-16 h-24 rounded-lg overflow-hidden border border-white/10 hidden sm:block">
                            <img src={item.posterImage} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                    )}
                </div>

                {/* Seat Hold Timer Banner */}
                {selectedSeats.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs sm:text-sm">
                        <div className="flex items-center gap-2.5 text-amber-300">
                            <Clock className="w-4 h-4 animate-pulse text-[#f5a623]" />
                            <span>
                                <strong>Seats Reserved:</strong> Complete checkout within{' '}
                                <span className="font-mono font-bold text-white text-base">{formatHoldTimer(holdSecondsLeft)}</span>
                            </span>
                        </div>
                    </div>
                )}

                {/* Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-[#f5a623]" />
                                Select Cinema Theatre
                            </label>
                            <button type="button" onClick={openLocationModal} className="text-[11px] text-[#f5a623] hover:underline flex items-center gap-1 cursor-pointer">
                                <span>City: {selectedCity ? selectedCity.name : 'All'}</span>
                                <span className="opacity-70">(Change)</span>
                            </button>
                        </div>
                        {theatres.length > 0 ? (
                            <select
                                value={selectedTheatre}
                                onChange={(e) => setSelectedTheatre(e.target.value)}
                                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#f5a623]"
                            >
                                {theatres.map((t) => {
                                    const name = t.name || t;
                                    return (
                                        <option key={t.id || name} value={name} className="bg-[#11131c] text-white">
                                            {name} {t.city ? `(${t.city})` : ''}
                                        </option>
                                    );
                                })}
                            </select>
                        ) : (
                            <div className="p-3 text-xs text-neutral-400 bg-white/5 border border-white/10 rounded-xl">No theatres found in database</div>
                        )}
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-[#f5a623]" />
                            Select Date
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                            {dates.map((d) => {
                                const isSelected = selectedDate === d.full;
                                return (
                                    <button
                                        key={d.date}
                                        onClick={() => setSelectedDate(d.full)}
                                        className={`py-2 px-1 rounded-xl text-center border transition-all cursor-pointer ${
                                            isSelected
                                                ? 'border-[#f5a623] bg-[#f5a623]/20 text-white font-semibold shadow-sm shadow-[#f5a623]/10'
                                                : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/20'
                                        }`}
                                    >
                                        <div className="text-[10px] text-neutral-400">{d.label}</div>
                                        <div className="text-xs sm:text-sm font-bold text-white">{d.date}</div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Showtime Selector */}
                <div>
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#f5a623]" />
                        Select Showtime
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {availableShowtimes.map((time) => {
                            const isSelected = selectedTime === time;
                            return (
                                <button
                                    key={time}
                                    onClick={() => setSelectedTime(time)}
                                    className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold border transition-all cursor-pointer ${
                                        isSelected
                                            ? 'border-[#f5a623] bg-[#f5a623] text-black shadow-lg shadow-[#f5a623]/20'
                                            : 'border-white/15 bg-white/5 text-neutral-300 hover:border-white/30'
                                    }`}
                                >
                                    {time}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Seat map generated from the shared auditorium layout */}
                <SeatGrid2D layout={layout} seatClasses={seatClasses} occupiedSet={occupiedSet} selectedSeats={selectedSeats} onToggle={toggleSeat} />

                {/* Coupon Code Section */}
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-neutral-300">
                        <Tag className="w-4 h-4 text-[#f5a623]" />
                        <span>Promo Code (e.g. <strong>CINEPASS20</strong>, <strong>WELCOME50</strong>):</span>
                    </div>
                    <form onSubmit={handleApplyCoupon} className="flex gap-2 w-full sm:w-auto">
                        <input
                            type="text"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value)}
                            placeholder="Enter coupon"
                            className="bg-black/40 border border-white/15 focus:border-[#f5a623] rounded-lg px-3 py-1.5 text-xs text-white uppercase outline-none"
                        />
                        <button type="submit" className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition-colors cursor-pointer">
                            Apply
                        </button>
                    </form>
                </div>
                {couponMessage && <div className="text-xs px-2 text-neutral-300 font-medium">{couponMessage}</div>}

                {/* Auth & Validation Notice */}
                {errorMessage && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-xs text-red-300">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                        {!user && (
                            <button type="button" onClick={() => openAuthModal('login')} className="px-3 py-1.5 rounded-lg bg-[#f5a623] hover:bg-[#e09612] text-black font-bold text-xs shrink-0 transition-colors cursor-pointer">
                                Sign In Now
                            </button>
                        )}
                    </div>
                )}

                {!user && selectedSeats.length > 0 && !errorMessage && (
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-300">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-[#f5a623]">🔒 Sign In Required:</span>
                            <span>Please log in to finalize your seat reservation and generate your ticket.</span>
                        </div>
                        <button type="button" onClick={() => openAuthModal('login')} className="text-[#f5a623] hover:text-white font-bold underline transition-colors cursor-pointer">
                            Sign In
                        </button>
                    </div>
                )}

                {/* Checkout Bar */}
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <div className="text-xs text-neutral-400">
                            Selected Seats: <span className="text-white font-semibold">{selectedSeats.join(', ') || 'None selected'}</span>
                            {appliedDiscount > 0 && <span className="ml-2 text-emerald-400 font-bold">({appliedDiscount}% OFF Applied)</span>}
                            {user && (
                                <span className="ml-2 px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 font-medium">
                                    ✓ Booking as {user.fullName || user.email}
                                </span>
                            )}
                        </div>
                        <div className="text-xl font-heading font-black text-[#f5a623] mt-0.5 flex items-baseline gap-2">
                            <span>₹ {totalAmount.toFixed(2)}</span>
                            {appliedDiscount > 0 && <span className="text-xs text-neutral-400 line-through">₹ {subtotal.toFixed(2)}</span>}
                        </div>
                    </div>

                    <button
                        disabled={selectedSeats.length === 0 || isSubmitting}
                        onClick={handleConfirmBooking}
                        className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#f5a623] hover:bg-[#e09612] text-black font-semibold text-sm transition-all duration-200 shadow-lg shadow-[#f5a623]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Reserving with Backend...</span>
                            </>
                        ) : (
                            <>
                                <span>{user ? 'Reserve Seats & Continue to Payment' : 'Sign In to Reserve & Pay'}</span>
                                <ChevronRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};
