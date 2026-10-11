import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.service';
import { TicketQr } from '../../components/common/TicketQr';
import { 
  CheckCircle, 
  Printer, 
  ArrowLeft, 
  Film, 
  MapPin, 
  Calendar, 
  Clock, 
  Ticket, 
  Share2, 
  Download,
  AlertCircle
} from 'lucide-react';

export const BookingConfirmationPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBooking();
    window.scrollTo(0, 0);
  }, [bookingId]);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const data = await api.getBookingById(bookingId);
      setBooking(data);
    } catch (err) {
      console.error('Failed to load booking:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
          <p className="text-sm text-neutral-400 font-medium">Generating digital ticket pass...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle size={48} className="text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Ticket Not Found</h2>
          <p className="text-sm text-neutral-400">Could not retrieve confirmed ticket details.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition"
          >
            <ArrowLeft size={16} /> Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const show = booking.show;
  const movie = show?.movie;
  const seatLabels = booking.seats?.map(s => `${s.seat?.rowLabel}${s.seat?.seatNumber}`).join(', ');

  const qrPayload = `CINEPASS|${booking.id}|${booking.bookingReference}|${seatLabels}|PAID`;

  return (
    <div className="min-h-screen bg-[#060608] text-white pt-24 pb-20 font-sans print:pt-4 print:pb-4 print:bg-white print:text-black">
      <div className="max-w-3xl mx-auto px-6">
        {/* Success Header (Hidden when printing) */}
        <div className="text-center space-y-3 mb-8 print:hidden">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.3)] animate-in zoom-in">
            <CheckCircle size={36} />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            TRANSACTION SUCCESSFUL
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Booking Confirmed!
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto">
            Your e-ticket with entry QR code is ready. An email confirmation has also been dispatched.
          </p>
        </div>

        {/* ================= DIGITAL TICKET CARD ================= */}
        <div className="bg-[#12141c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl print:border-black print:bg-white print:shadow-none">
          {/* Ticket Header Banner */}
          <div className="bg-gradient-to-r from-yellow-500 to-amber-600 px-6 sm:px-8 py-4 flex items-center justify-between text-black">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-80 block">
                CINEVERSE ADMISSION PASS
              </span>
              <span className="text-lg sm:text-xl font-black tracking-tight">
                {booking.bookingReference}
              </span>
            </div>
            <span className="px-3 py-1 bg-black text-yellow-400 rounded-full text-xs font-black tracking-wider uppercase">
              CONFIRMED
            </span>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Movie & Theatre Grid */}
            <div className="flex gap-5 items-start">
              {movie?.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  className="w-20 sm:w-24 aspect-[2/3] object-cover rounded-xl border border-white/10 shrink-0 shadow-lg"
                />
              ) : (
                <div className="w-20 sm:w-24 aspect-[2/3] bg-neutral-900 rounded-xl flex items-center justify-center text-neutral-600 border border-white/10">
                  <Film size={28} />
                </div>
              )}

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                    {movie?.censorCertificate || 'U/A'}
                  </span>
                  <span className="text-xs text-neutral-400">
                    {show?.visualFormat || '2D'} • {show?.languageVersion || 'Original'}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-white print:text-black tracking-tight line-clamp-2">
                  {movie?.title}
                </h2>

                <p className="text-xs text-neutral-300 print:text-neutral-700 flex items-center gap-1.5 pt-1">
                  <MapPin size={13} className="text-yellow-500 shrink-0" />
                  <span className="line-clamp-1">{show?.theatre?.name} ({show?.theatre?.city})</span>
                </p>

                <p className="text-xs text-neutral-400 print:text-neutral-600 font-mono">
                  {show?.screen?.name || 'Screen 1'}
                </p>
              </div>
            </div>

            {/* Dashed Tear-off Divider */}
            <div className="relative -mx-6 sm:-mx-8 border-t-2 border-dashed border-neutral-700/80 my-2">
              <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-[#060608] print:hidden" />
              <div className="absolute -top-3 -right-3 w-6 h-6 rounded-full bg-[#060608] print:hidden" />
            </div>

            {/* Show Date, Seats, QR Code */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
              {/* Left Details */}
              <div className="sm:col-span-7 space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-neutral-500 uppercase text-[10px] font-bold block mb-0.5">
                      Show Date
                    </span>
                    <span className="font-bold text-white print:text-black text-sm flex items-center gap-1.5">
                      <Calendar size={14} className="text-yellow-500" />
                      {new Date(show?.startTime).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <div>
                    <span className="text-neutral-500 uppercase text-[10px] font-bold block mb-0.5">
                      Showtime
                    </span>
                    <span className="font-bold text-white print:text-black text-sm flex items-center gap-1.5">
                      <Clock size={14} className="text-yellow-500" />
                      {new Date(show?.startTime).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-neutral-500 uppercase text-[10px] font-bold block mb-0.5">
                    Assigned Seats ({booking.seats?.length})
                  </span>
                  <div className="font-mono font-black text-base text-yellow-500 tracking-wider">
                    {seatLabels}
                  </div>
                </div>

                <div>
                  <span className="text-neutral-500 uppercase text-[10px] font-bold block mb-0.5">
                    Total Amount Paid
                  </span>
                  <span className="font-black text-white print:text-black text-base">
                    ₹{booking.totalAmountCents}
                  </span>
                </div>
              </div>

              {/* Right: Scannable QR Code */}
              <div className="sm:col-span-5 flex flex-col items-center justify-center p-2 text-center">
                <TicketQr payload={qrPayload} size={150} label="VERIFIED TICKET" />
                <span className="text-[10px] text-neutral-400 mt-2 font-mono">
                  Scan at admission gate turnstiles
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. ACTION BUTTONS (Hidden when printing) */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 print:hidden">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/15 transition cursor-pointer"
          >
            <Printer size={16} />
            <span>Print E-Ticket</span>
          </button>

          <button
            onClick={() => navigate('/my-bookings')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/25 transition cursor-pointer"
          >
            <Ticket size={16} />
            <span>Go to My Bookings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
