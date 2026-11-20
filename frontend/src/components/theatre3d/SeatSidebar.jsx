import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Minus, Plus, Sparkles, X, Clock, AlertCircle, ChevronUp } from 'lucide-react';
import { formatHoldTimer } from '../../hooks/useBookingFlow';
import { formatINR } from './lib/pricing';

const MAX_QUICK_PICK = 10;
const SWIPE_THRESHOLD_PX = 30;

function SectionLabel({ children, right }) {
    return (
        <div className="flex items-center justify-between mb-2.5">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-400">{children}</h3>
            {right}
        </div>
    );
}

function ClassList({ seatClasses, leftByClass }) {
    return (
        <ul className="space-y-2">
            {seatClasses.map((cls) => (
                <li key={cls.id} className="flex items-stretch gap-3 rounded-xl bg-white/[0.04] border border-white/[0.06] px-3 py-2.5">
                    <span className="w-1 rounded-full shrink-0" style={{ background: cls.color, boxShadow: `0 0 10px ${cls.color}` }} />
                    <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-white leading-tight">{cls.name}</div>
                        <div className="text-[11px] text-neutral-400 truncate">{cls.description}</div>
                    </div>
                    <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-white">{formatINR(cls.price)}</div>
                        <LeftCount count={leftByClass[cls.id]} />
                    </div>
                </li>
            ))}
        </ul>
    );
}

function LeftCount({ count }) {
    return (
        <div className={`text-[11px] font-semibold ${count > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {count > 0 ? `${count} left` : 'Sold out'}
        </div>
    );
}

/** One-line, horizontally scrolling class summary for the phone sheet. */
function ClassChips({ seatClasses, leftByClass }) {
    return (
        <div className="-mx-4 px-4 flex gap-2 overflow-x-auto no-scrollbar">
            {seatClasses.map((cls) => (
                <div key={cls.id} className="shrink-0 flex items-center gap-2 rounded-xl bg-white/[0.05] border border-white/[0.08] pl-2 pr-3 py-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: cls.color, boxShadow: `0 0 8px ${cls.color}` }} />
                    <div className="leading-tight">
                        <div className="text-[11px] font-bold text-white whitespace-nowrap">{cls.name} · {formatINR(cls.price)}</div>
                        <LeftCount count={leftByClass[cls.id]} />
                    </div>
                </div>
            ))}
        </div>
    );
}

function Legend() {
    return (
        <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-neutral-400">
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#2a2c35] border border-white/20" />Booked</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-teal-300 shadow-[0_0_8px_#2dd4bf]" />Your pick</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#f5b52e]" />Couple recliners sold in pairs</span>
        </div>
    );
}

function QuickPick({ quickCount, setQuickCount, onBestSeats }) {
    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-white/15 bg-white/5">
                <button type="button" aria-label="Fewer seats" onClick={() => setQuickCount((c) => Math.max(1, c - 1))} className="w-9 h-9 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer">
                    <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-white tabular-nums">{quickCount}</span>
                <button type="button" aria-label="More seats" onClick={() => setQuickCount((c) => Math.min(MAX_QUICK_PICK, c + 1))} className="w-9 h-9 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>
            <button
                type="button"
                onClick={() => onBestSeats(quickCount)}
                className="flex-1 h-9 rounded-full bg-white text-black text-xs font-bold inline-flex items-center justify-center gap-1.5 hover:bg-neutral-200 cursor-pointer"
            >
                <Sparkles className="w-3.5 h-3.5" />
                Best {quickCount} {quickCount === 1 ? 'seat' : 'seats'}
            </button>
        </div>
    );
}

function SeatChips({ sortedSeats, onViewSeat, toggleSeat, scroll }) {
    return (
        <div className={scroll ? '-mx-4 px-4 flex gap-1.5 overflow-x-auto no-scrollbar' : 'flex flex-wrap gap-1.5'}>
            {sortedSeats.map((id) => (
                <span key={id} className="shrink-0 inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-teal-400/15 border border-teal-300/40 text-teal-200 text-xs font-bold">
                    <button type="button" onClick={() => onViewSeat(id)} title={`View from ${id}`} className="cursor-pointer hover:text-white">{id}</button>
                    <button type="button" onClick={() => toggleSeat(id)} aria-label={`Remove ${id}`} className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/15 cursor-pointer">
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}
        </div>
    );
}

function HoldTimer({ holdSecondsLeft }) {
    return (
        <div className="flex items-center gap-1.5 text-[11px] text-amber-300">
            <Clock className="w-3.5 h-3.5" />
            Held for <span className="font-mono font-bold text-white">{formatHoldTimer(holdSecondsLeft)}</span>
        </div>
    );
}

function ErrorNote({ message }) {
    return (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{message}</span>
        </div>
    );
}

/** Reports the element's height (e.g. so floating buttons can sit just above the sheet). */
function useReportedHeight(ref, onHeightChange) {
    useEffect(() => {
        const el = ref.current;
        if (!el || !onHeightChange) return undefined;
        const observer = new ResizeObserver(() => onHeightChange(el.offsetHeight));
        observer.observe(el);
        onHeightChange(el.offsetHeight);
        return () => {
            observer.disconnect();
            onHeightChange(0);
        };
    }, [ref, onHeightChange]);
}

/**
 * Seat panel in three shapes:
 *  - variant "side": right-hand column (laptops / landscape tablets); `compact` narrows it for
 *    landscape phones.
 *  - variant "sheet": bottom sheet for portrait phones and tablets — quick pick, seat chips and
 *    the total are always visible; the full class list expands on tap or swipe-up.
 */
export function SeatSidebar({ flow, leftByClass, onBestSeats, onContinue, onViewSeat, variant = 'side', compact = false, onHeightChange }) {
    const { seatClasses, selectedSeats, toggleSeat, applySelection, subtotal, holdSecondsLeft, errorMessage, seatById } = flow;
    const [quickCount, setQuickCount] = useState(2);
    const [expanded, setExpanded] = useState(false);
    const sheetRef = useRef(null);
    const touchStartY = useRef(null);
    useReportedHeight(sheetRef, variant === 'sheet' ? onHeightChange : null);

    const sortedSeats = useMemo(
        () => [...selectedSeats].sort((a, b) => (seatById.get(a)?.rowIndex ?? 0) - (seatById.get(b)?.rowIndex ?? 0) || (seatById.get(a)?.number ?? 0) - (seatById.get(b)?.number ?? 0)),
        [selectedSeats, seatById],
    );
    const ticketLabel = `${selectedSeats.length} ${selectedSeats.length === 1 ? 'ticket' : 'tickets'}`;
    const continueButton = (extraClass = '') => (
        <button
            type="button"
            disabled={selectedSeats.length === 0}
            onClick={onContinue}
            className={`py-3.5 rounded-xl bg-[#f5c518] hover:bg-[#ffd43b] text-black font-black text-xs tracking-[0.18em] uppercase shadow-lg shadow-yellow-500/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${extraClass}`}
        >
            Continue · Add snacks
        </button>
    );

    if (variant === 'sheet') {
        const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
        const onTouchEnd = (e) => {
            if (touchStartY.current === null) return;
            const dy = e.changedTouches[0].clientY - touchStartY.current;
            touchStartY.current = null;
            if (dy < -SWIPE_THRESHOLD_PX) setExpanded(true);
            else if (dy > SWIPE_THRESHOLD_PX) setExpanded(false);
        };
        return (
            <aside
                ref={sheetRef}
                className="absolute inset-x-0 bottom-0 z-20 flex flex-col rounded-t-3xl border-t border-white/10 bg-[#0d1124]/95 backdrop-blur-xl px-4 pt-1 pb-[max(12px,env(safe-area-inset-bottom))] shadow-[0_-20px_40px_rgba(0,0,0,0.5)]"
                aria-label="Seat selection"
            >
                <button
                    type="button"
                    onClick={() => setExpanded((e) => !e)}
                    onTouchStart={onTouchStart}
                    onTouchEnd={onTouchEnd}
                    className="mx-auto w-full flex items-center justify-center gap-1 py-2 text-[11px] text-neutral-400 cursor-pointer touch-none"
                    aria-expanded={expanded}
                    aria-label={expanded ? 'Show less' : 'Show seat classes and details'}
                >
                    <span className="block w-10 h-1 rounded-full bg-white/25" />
                    <ChevronUp className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>

                <div className={`min-h-0 overflow-y-auto no-scrollbar space-y-3 pb-3 ${expanded ? 'max-h-[52dvh]' : ''}`}>
                    {expanded ? (
                        <>
                            <ClassList seatClasses={seatClasses} leftByClass={leftByClass} />
                            <Legend />
                        </>
                    ) : (
                        <ClassChips seatClasses={seatClasses} leftByClass={leftByClass} />
                    )}
                    <QuickPick quickCount={quickCount} setQuickCount={setQuickCount} onBestSeats={onBestSeats} />
                    {sortedSeats.length > 0 && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <HoldTimer holdSecondsLeft={holdSecondsLeft} />
                                <button type="button" onClick={() => applySelection([])} className="text-[11px] text-neutral-400 hover:text-white cursor-pointer">Clear</button>
                            </div>
                            <SeatChips sortedSeats={sortedSeats} onViewSeat={onViewSeat} toggleSeat={toggleSeat} scroll={!expanded} />
                        </div>
                    )}
                    {errorMessage && <ErrorNote message={errorMessage} />}
                </div>

                <div className="pt-3 border-t border-white/[0.08] flex items-center gap-3">
                    <div className="shrink-0">
                        <div className="text-xl font-heading font-black text-white tabular-nums leading-none">{formatINR(subtotal)}</div>
                        <div className="text-[10px] text-neutral-400 mt-1">{ticketLabel} · excl. fees</div>
                    </div>
                    {continueButton('flex-1 min-w-0 px-3 tracking-[0.12em]')}
                </div>
            </aside>
        );
    }

    return (
        <aside
            className={`relative z-10 shrink-0 flex flex-col border-l border-white/[0.06] bg-[#0d1124]/95 backdrop-blur-xl ${
                compact ? 'w-[280px] px-4 py-3' : 'w-[340px] xl:w-[360px] px-5 py-5'
            }`}
            aria-label="Seat selection"
        >
            <div className={`flex-1 min-h-0 overflow-y-auto no-scrollbar pb-3 ${compact ? 'space-y-4' : 'space-y-5'}`}>
                <section>
                    <SectionLabel>Seat classes</SectionLabel>
                    {compact ? <ClassChipsStacked seatClasses={seatClasses} leftByClass={leftByClass} /> : <ClassList seatClasses={seatClasses} leftByClass={leftByClass} />}
                    {!compact && <div className="mt-3"><Legend /></div>}
                </section>

                <section>
                    <SectionLabel>Quick pick</SectionLabel>
                    <QuickPick quickCount={quickCount} setQuickCount={setQuickCount} onBestSeats={onBestSeats} />
                </section>

                <section>
                    <SectionLabel
                        right={selectedSeats.length > 0 && (
                            <button type="button" onClick={() => applySelection([])} className="text-[11px] text-neutral-400 hover:text-white cursor-pointer">Clear</button>
                        )}
                    >
                        Your seats
                    </SectionLabel>
                    {sortedSeats.length === 0 ? (
                        <p className="text-xs text-neutral-500">Tap any seat in the theatre, or use Quick pick.</p>
                    ) : (
                        <SeatChips sortedSeats={sortedSeats} onViewSeat={onViewSeat} toggleSeat={toggleSeat} />
                    )}
                    {selectedSeats.length > 0 && <div className="mt-3"><HoldTimer holdSecondsLeft={holdSecondsLeft} /></div>}
                </section>

                {errorMessage && <ErrorNote message={errorMessage} />}
            </div>
            <div className="pt-3 border-t border-white/[0.08] space-y-3">
                <div className="flex items-end justify-between">
                    <div>
                        <div className="text-[11px] text-neutral-400">{ticketLabel}</div>
                        <div className="text-[10px] text-neutral-500">excl. fees</div>
                    </div>
                    <div className="text-2xl font-heading font-black text-white tabular-nums">{formatINR(subtotal)}</div>
                </div>
                {continueButton('w-full')}
            </div>
        </aside>
    );
}

/** Dense class list for the narrow landscape-phone panel. */
function ClassChipsStacked({ seatClasses, leftByClass }) {
    return (
        <ul className="space-y-1.5">
            {seatClasses.map((cls) => (
                <li key={cls.id} className="flex items-center gap-2 rounded-lg bg-white/[0.04] border border-white/[0.06] px-2.5 py-1.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cls.color, boxShadow: `0 0 8px ${cls.color}` }} />
                    <span className="flex-1 min-w-0 text-xs font-bold text-white truncate">{cls.name}</span>
                    <span className="text-xs font-bold text-white">{formatINR(cls.price)}</span>
                    <span className="w-14 text-right"><LeftCount count={leftByClass[cls.id]} /></span>
                </li>
            ))}
        </ul>
    );
}
