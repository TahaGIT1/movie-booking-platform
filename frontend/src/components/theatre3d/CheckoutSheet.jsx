import React, { useEffect } from 'react';
import { X, Minus, Plus, Smartphone, CreditCard, Wallet, Loader2, ArrowLeft, Lock, Popcorn } from 'lucide-react';
import { SNACKS, formatINR } from './lib/pricing';

const PAY_METHODS = [
    { id: 'upi', label: 'UPI', hint: 'GPay · PhonePe · Paytm', icon: Smartphone },
    { id: 'card', label: 'Card', hint: 'Visa · Mastercard · RuPay', icon: CreditCard },
    { id: 'wallet', label: 'Wallet', hint: 'Cinepass credits', icon: Wallet },
];

function Row({ label, value, muted }) {
    return (
        <div className={`flex items-center justify-between text-sm ${muted ? 'text-neutral-400' : 'text-neutral-200'}`}>
            <span>{label}</span>
            <span className="tabular-nums">{value}</span>
        </div>
    );
}

function SnacksPane({ snackQty, onChange, onNext }) {
    return (
        <>
            <p className="text-xs text-neutral-400 -mt-1 mb-4">Pre-order and skip the queue. Delivered to your seat for recliners.</p>
            <ul className="space-y-2">
                {SNACKS.map((s) => {
                    const qty = snackQty[s.id] || 0;
                    return (
                        <li key={s.id} className="flex items-center gap-3 rounded-xl bg-white/[0.04] border border-white/[0.07] px-3 py-2.5">
                            <Popcorn className="w-5 h-5 text-[#f5c518] shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold text-white truncate">{s.name}</div>
                                <div className="text-xs text-neutral-400">{formatINR(s.price)}</div>
                            </div>
                            <div className="flex items-center rounded-full border border-white/15">
                                <button type="button" aria-label={`Remove ${s.name}`} onClick={() => onChange(s.id, Math.max(0, qty - 1))} className="w-7 h-7 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer">
                                    <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-5 text-center text-sm font-bold tabular-nums">{qty}</span>
                                <button type="button" aria-label={`Add ${s.name}`} onClick={() => onChange(s.id, Math.min(9, qty + 1))} className="w-7 h-7 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer">
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        </li>
                    );
                })}
            </ul>
            <button type="button" onClick={onNext} className="mt-5 w-full py-3.5 rounded-xl bg-[#f5c518] hover:bg-[#ffd43b] text-black font-black text-xs tracking-[0.18em] uppercase cursor-pointer">
                Continue to checkout
            </button>
        </>
    );
}

function CheckoutPane({ summary, seatIds, method, onMethod, onEditSnacks, onPay, isPaying, errorMessage, needsSignIn, onSignIn }) {
    return (
        <>
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-2">
                {summary.lines.map((l) => <Row key={l.id} label={l.label} value={formatINR(l.amount)} />)}
                {summary.snackLines.map((l) => <Row key={l.id} label={l.label} value={formatINR(l.amount)} />)}
                <Row label="Convenience fee" value={formatINR(summary.convenienceFee)} muted />
                <Row label="GST on fee (18%)" value={formatINR(summary.gst)} muted />
                <div className="pt-2 mt-1 border-t border-white/[0.08] flex items-end justify-between">
                    <div>
                        <div className="text-base font-bold text-white">Total</div>
                        <div className="text-[11px] font-semibold text-emerald-400 mt-0.5">Seats: {seatIds.join(', ')}</div>
                    </div>
                    <div className="text-2xl font-heading font-black text-white tabular-nums">{formatINR(summary.total)}</div>
                </div>
            </div>
            <button type="button" onClick={onEditSnacks} className="mt-2 inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white cursor-pointer">
                <ArrowLeft className="w-3.5 h-3.5" /> Edit snacks
            </button>

            <h3 className="mt-4 mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-400">Pay with</h3>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Payment method">
                {PAY_METHODS.map((m) => {
                    const Icon = m.icon;
                    const active = method === m.id;
                    return (
                        <button
                            key={m.id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => onMethod(m.id)}
                            className={`text-left rounded-xl border p-3 transition-colors cursor-pointer ${active ? 'border-[#f5c518] bg-[#f5c518]/10' : 'border-white/10 bg-white/[0.03] hover:border-white/25'}`}
                        >
                            <Icon className={`w-4 h-4 mb-1.5 ${active ? 'text-[#f5c518]' : 'text-neutral-400'}`} />
                            <div className="text-sm font-bold text-white">{m.label}</div>
                            <div className="text-[10px] text-neutral-400 leading-tight">{m.hint}</div>
                        </button>
                    );
                })}
            </div>
            <p className="mt-2 text-[11px] text-neutral-500 flex items-center gap-1.5">
                <Lock className="w-3 h-3" /> Demo only, no real payment is taken.
            </p>

            {errorMessage && <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300">{errorMessage}</div>}

            {needsSignIn ? (
                <button type="button" onClick={onSignIn} className="mt-4 w-full py-3.5 rounded-xl bg-[#f5c518] hover:bg-[#ffd43b] text-black font-black text-sm cursor-pointer">
                    Sign in to pay {formatINR(summary.total)}
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onPay}
                    disabled={isPaying}
                    className="mt-4 w-full py-3.5 rounded-xl bg-[#f5c518] hover:bg-[#ffd43b] text-black font-black text-sm inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                    {isPaying ? <><Loader2 className="w-4 h-4 animate-spin" /> Confirming your seats…</> : `Pay ${formatINR(summary.total)}`}
                </button>
            )}
        </>
    );
}

/** Slide-in sheet over the blurred theatre: snacks, then the order summary and payment. */
export function CheckoutSheet({ pane, onPane, onClose, snackQty, onSnackChange, ...checkout }) {
    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape' && !checkout.isPaying) onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, checkout.isPaying]);

    return (
        <div className="absolute inset-0 z-30 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/40" onClick={() => !checkout.isPaying && onClose()}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label={pane === 'snacks' ? 'Add snacks' : 'Checkout'}
                onClick={(e) => e.stopPropagation()}
                className="tt-sheet-in w-full sm:w-[420px] max-h-[92vh] overflow-y-auto no-scrollbar rounded-t-3xl sm:rounded-3xl border border-white/10 bg-[#0e1020]/95 backdrop-blur-2xl p-5 sm:p-6 shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
            >
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <h2 className="font-heading font-black uppercase tracking-wide text-xl text-white">{pane === 'snacks' ? 'Add snacks' : 'Checkout'}</h2>
                        <div className="mt-1.5 flex gap-1">
                            <span className="h-1 w-7 rounded-full bg-[#f5c518]" />
                            <span className={`h-1 w-7 rounded-full ${pane === 'checkout' ? 'bg-[#f5c518]' : 'bg-white/15'}`} />
                        </div>
                    </div>
                    <button type="button" aria-label="Close" onClick={onClose} disabled={checkout.isPaying} className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:bg-white/10 hover:text-white cursor-pointer">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                {pane === 'snacks' ? (
                    <SnacksPane snackQty={snackQty} onChange={onSnackChange} onNext={() => onPane('checkout')} />
                ) : (
                    <CheckoutPane {...checkout} onEditSnacks={() => onPane('snacks')} />
                )}
            </div>
        </div>
    );
}
