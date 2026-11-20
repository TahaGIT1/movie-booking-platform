import React, { useMemo, useState } from 'react';
import { Minus, Plus, Sparkles, X, Clock, AlertCircle, ChevronUp } from 'lucide-react';
import { formatHoldTimer } from '../../hooks/useBookingFlow';
import { formatINR } from './lib/pricing';

const MAX_QUICK_PICK = 10;

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
                        <div className={`text-[11px] font-semibold ${leftByClass[cls.id] > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {leftByClass[cls.id] > 0 ? `${leftByClass[cls.id]} left` : 'Sold out'}
                        </div>
                    </div>
                </li>
            ))}
        </ul>
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

/**
 * Right-hand panel (desktop) / bottom sheet (tablet): classes, legend, quick pick,
 * selected seat chips, running total and the continue button.
 */
export function SeatSidebar({ flow, leftByClass, onBestSeats, onContinue, onViewSeat, variant = 'side' }) {
    const { seatClasses, selectedSeats, toggleSeat, applySelection, subtotal, holdSecondsLeft, errorMessage, seatById } = flow;
    const [quickCount, setQuickCount] = useState(2);
    const [expanded, setExpanded] = useState(false);
    const sortedSeats = useMemo(
        () => [...selectedSeats].sort((a, b) => (seatById.get(a)?.rowIndex ?? 0) - (seatById.get(b)?.rowIndex ?? 0) || (seatById.get(a)?.number ?? 0) - (seatById.get(b)?.number ?? 0)),
        [selectedSeats, seatById],
    );
    const isSheet = variant === 'sheet';
    const showBody = !isSheet || expanded;

    const footer = (
        <div className="pt-3 border-t border-white/[0.08] space-y-3">
            <div className="flex items-end justify-between">
                <div>
                    <div className="text-[11px] text-neutral-400">{selectedSeats.length} {selectedSeats.length === 1 ? 'ticket' : 'tickets'}</div>
                    <div className="text-[10px] text-neutral-500">excl. fees</div>
                </div>
                <div className="text-2xl font-heading font-black text-white tabular-nums">{formatINR(subtotal)}</div>
            </div>
            <button
                type="button"
                disabled={selectedSeats.length === 0}
                onClick={onContinue}
                className="w-full py-3.5 rounded-xl bg-[#f5c518] hover:bg-[#ffd43b] text-black font-black text-xs tracking-[0.18em] uppercase shadow-lg shadow-yellow-500/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
                Continue · Add snacks
            </button>
        </div>
    );

    return (
        <aside
            className={
                isSheet
                    ? 'absolute inset-x-0 bottom-0 z-20 max-h-[70vh] flex flex-col rounded-t-3xl border-t border-white/10 bg-[#0d1124]/95 backdrop-blur-xl px-4 pt-2 pb-4 shadow-[0_-20px_40px_rgba(0,0,0,0.5)]'
                    : 'relative z-10 w-[340px] xl:w-[360px] shrink-0 flex flex-col border-l border-white/[0.06] bg-[#0d1124]/95 backdrop-blur-xl px-5 py-5'
            }
            aria-label="Seat selection"
        >
            {isSheet && (
                <button
                    type="button"
                    onClick={() => setExpanded((e) => !e)}
                    className="mx-auto mb-2 flex items-center gap-1 text-[11px] text-neutral-400 cursor-pointer"
                    aria-expanded={expanded}
                >
                    <span className="block w-10 h-1 rounded-full bg-white/20" />
                    <ChevronUp className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                </button>
            )}

            {showBody && (
                <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar space-y-5 pb-3">
                    <section>
                        <SectionLabel>Seat classes</SectionLabel>
                        <ClassList seatClasses={seatClasses} leftByClass={leftByClass} />
                        <div className="mt-3"><Legend /></div>
                    </section>

                    <section>
                        <SectionLabel>Quick pick</SectionLabel>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center rounded-full border border-white/15 bg-white/5">
                                <button type="button" aria-label="Fewer seats" onClick={() => setQuickCount((c) => Math.max(1, c - 1))} className="w-8 h-8 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer">
                                    <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-6 text-center text-sm font-bold text-white tabular-nums">{quickCount}</span>
                                <button type="button" aria-label="More seats" onClick={() => setQuickCount((c) => Math.min(MAX_QUICK_PICK, c + 1))} className="w-8 h-8 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer">
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
                            <div className="flex flex-wrap gap-1.5">
                                {sortedSeats.map((id) => (
                                    <span key={id} className="inline-flex items-center gap-1 pl-2.5 pr-1 py-1 rounded-full bg-teal-400/15 border border-teal-300/40 text-teal-200 text-xs font-bold">
                                        <button type="button" onClick={() => onViewSeat(id)} title={`View from ${id}`} className="cursor-pointer hover:text-white">{id}</button>
                                        <button type="button" onClick={() => toggleSeat(id)} aria-label={`Remove ${id}`} className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-white/15 cursor-pointer">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        {selectedSeats.length > 0 && (
                            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-amber-300">
                                <Clock className="w-3.5 h-3.5" />
                                Held for <span className="font-mono font-bold text-white">{formatHoldTimer(holdSecondsLeft)}</span>
                            </div>
                        )}
                    </section>

                    {errorMessage && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex gap-2 text-xs text-red-300">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}
                </div>
            )}
            {footer}
        </aside>
    );
}
