import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Calendar, MapPin, Armchair } from 'lucide-react';
import { TicketQr } from '../TicketQr';
import { buildTicketPayload } from '../../utils/qrGenerator';
import { formatINR } from './lib/pricing';

/** Final step: the confirmed e-ticket with QR and booking reference. */
export function TicketConfirmed({ booking, subtitle }) {
    const qrSeed = useMemo(
        () => buildTicketPayload({ orderId: booking.orderId, seats: booking.seats, totalAmount: booking.totalAmount, verifyUrl: booking.qrCodeData }),
        [booking],
    );

    return (
        <div className="absolute inset-0 z-40 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
            <div role="dialog" aria-modal="true" aria-label="Booking confirmed" className="tt-ticket-in w-full max-w-[400px] my-auto">
                <div className="flex items-center justify-center gap-2 mb-4 text-emerald-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-bold uppercase tracking-[0.2em]">Booking confirmed</span>
                </div>

                <div className="rounded-3xl overflow-hidden bg-[#f7f3ea] text-[#16130f] shadow-[0_30px_80px_rgba(0,0,0,0.6)]">
                    <div className="flex gap-4 p-5">
                        {booking.posterImage ? (
                            <img src={booking.posterImage} alt="" className="w-20 h-28 rounded-xl object-cover shadow-md shrink-0" />
                        ) : (
                            <div className="w-20 h-28 rounded-xl bg-neutral-300 shrink-0" />
                        )}
                        <div className="min-w-0">
                            <h2 className="font-heading font-black uppercase text-xl leading-tight">{booking.title || 'Cinema ticket'}</h2>
                            {subtitle && <p className="text-[11px] text-neutral-600 mt-0.5">{subtitle}</p>}
                            <div className="mt-3 space-y-1.5 text-xs text-neutral-700">
                                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{booking.date} · {booking.time}</div>
                                <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /><span className="truncate">{booking.theatreName}</span></div>
                                <div className="flex items-start gap-1.5"><Armchair className="w-3.5 h-3.5 mt-0.5 shrink-0" /><span className="font-bold">{booking.seats.join(', ')}</span></div>
                            </div>
                        </div>
                    </div>

                    {/* perforation */}
                    <div className="relative h-6">
                        <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-[#07080d]" />
                        <div className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-[#07080d]" />
                        <div className="absolute left-5 right-5 top-1/2 border-t-2 border-dashed border-neutral-300" />
                    </div>

                    <div className="flex items-center gap-4 p-5 pt-3">
                        <TicketQr seed={qrSeed} size={112} className="rounded-lg shrink-0" />
                        <div className="min-w-0 text-xs">
                            <div className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Booking ref</div>
                            <div className="font-mono font-bold text-sm break-all">{booking.orderId}</div>
                            <div className="mt-2 text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Paid</div>
                            <div className="font-bold text-sm">{formatINR(booking.totalAmount)}</div>
                            <p className="mt-2 text-[10px] text-neutral-500">Show this QR at the entry 15 minutes before showtime.</p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <Link to="/bookings" className="py-3 rounded-xl bg-[#f5c518] hover:bg-[#ffd43b] text-black text-center text-sm font-bold">View tickets</Link>
                    <Link to="/" className="py-3 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-center text-sm font-semibold">Back to home</Link>
                </div>
            </div>
        </div>
    );
}
