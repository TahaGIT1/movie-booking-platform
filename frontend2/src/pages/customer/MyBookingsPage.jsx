import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';
import { TicketQr } from '../../components/common/TicketQr';
import { 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin, 
  Film, 
  QrCode, 
  X, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle, 
  ArrowLeft,
  XCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

export const MyBookingsPage = () => {
  const { token, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'completed', 'cancelled'
  const [selectedTicket, setSelectedTicket] = useState(null); // Ticket QR modal
  const [cancelModalBooking, setCancelModalBooking] = useState(null); // Cancellation dialog
  const [cancelling, setCancelling] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    if (!token) {
      openAuthModal('login');
      return;
    }
    fetchBookings();
  }, [token]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const data = await api.getMyBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load customer bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings into 3 distinct tabs
  const filteredBookings = useMemo(() => {
    const now = new Date();
    return bookings.filter(b => {
      const showTime = new Date(b.show?.startTime);
      if (activeTab === 'cancelled') {
        return b.status === 'CANCELLED';
      }
      if (activeTab === 'completed') {
        return (b.status === 'CONFIRMED' && showTime < now) || b.qrScanStatus === 'USED';
      }
      if (activeTab === 'upcoming') {
        return b.status === 'CONFIRMED' && showTime >= now && b.qrScanStatus !== 'USED';
      }
      return true;
    });
  }, [bookings, activeTab]);

  // Handle Cancellation
  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    setCancelling(true);
    try {
      await api.cancelBooking(cancelModalBooking.id);
      setActionMessage(`Booking ${cancelModalBooking.bookingReference} was cancelled successfully. Refund initiated.`);
      setCancelModalBooking(null);
      fetchBookings();
      setTimeout(() => setActionMessage(''), 5000);
    } catch (err) {
      alert(err.message || 'Failed to cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] text-white pt-24 pb-20 font-sans">
      <div className="max-w-6xl mx-auto px-6 space-y-6">
        {/* Toast notification */}
        {actionMessage && (
          <div className="p-4 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in">
            <CheckCircle size={18} />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">
              CUSTOMER PORTAL
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Ticket className="text-yellow-500" size={28} />
              My Tickets &amp; Bookings
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              View your confirmed cinema passes, display entry QR codes, or cancel eligible tickets.
            </p>
          </div>

          <button
            onClick={fetchBookings}
            disabled={loading}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-semibold flex items-center gap-2 border border-white/10 transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-1">
          {[
            { id: 'upcoming', label: 'Upcoming Shows' },
            { id: 'completed', label: 'Past & Completed' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/20'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
            <div className="w-10 h-10 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Retrieving your bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="p-16 text-center rounded-2xl bg-neutral-900/40 border border-white/10 max-w-md mx-auto space-y-4">
            <Ticket size={48} className="text-neutral-600 mx-auto" />
            <h3 className="text-lg font-bold text-white">No {activeTab} bookings</h3>
            <p className="text-xs text-neutral-400">
              You do not have any {activeTab} bookings in your record.
            </p>
            <Link
              to="/"
              className="inline-block px-5 py-2.5 rounded-xl bg-yellow-500 text-black font-bold text-xs hover:bg-yellow-400 transition"
            >
              Discover Movies
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(b => {
              const show = b.show;
              const movie = show?.movie;
              const seatLabels = b.seats?.map(s => `${s.seat?.rowLabel}${s.seat?.seatNumber}`).join(', ');
              const showDate = new Date(show?.startTime);
              const isEligibleForCancel = b.status === 'CONFIRMED' && showDate > new Date();

              return (
                <div
                  key={b.id}
                  className="bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 rounded-2xl p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition shadow-lg"
                >
                  {/* Left: Poster & Info */}
                  <div className="flex gap-4 items-start">
                    {movie?.posterUrl ? (
                      <img
                        src={movie.posterUrl}
                        alt={movie.title}
                        className="w-16 h-24 object-cover rounded-xl border border-neutral-800 shrink-0 shadow"
                      />
                    ) : (
                      <div className="w-16 h-24 bg-neutral-950 rounded-xl flex items-center justify-center text-neutral-600 border border-neutral-800 shrink-0">
                        <Film size={24} />
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          b.status === 'CONFIRMED'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 border border-red-500/30'
                        }`}>
                          {b.status}
                        </span>
                        <span className="text-xs font-mono font-bold text-neutral-400">
                          {b.bookingReference}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white line-clamp-1">{movie?.title}</h3>

                      <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                        <MapPin size={12} className="text-yellow-500" />
                        <span>{show?.theatre?.name} • {show?.screen?.name}</span>
                      </p>

                      <p className="text-xs text-neutral-400 flex items-center gap-1.5">
                        <Calendar size={12} className="text-neutral-500" />
                        <span>{showDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span>•</span>
                        <Clock size={12} className="text-neutral-500" />
                        <span>{showDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>

                      <div className="text-xs pt-1 flex items-center gap-4">
                        <span className="text-neutral-500">
                          Seats: <strong className="text-yellow-400 font-mono">{seatLabels}</strong>
                        </span>
                        <span className="text-neutral-500">
                          Paid: <strong className="text-white">₹{b.totalAmountCents}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end border-t md:border-t-0 border-neutral-800 pt-3 md:pt-0">
                    {b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => setSelectedTicket(b)}
                        className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-2 border border-white/10 transition cursor-pointer"
                      >
                        <QrCode size={16} className="text-yellow-500" />
                        <span>View QR Ticket</span>
                      </button>
                    )}

                    {isEligibleForCancel && (
                      <button
                        onClick={() => setCancelModalBooking(b)}
                        className="px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition cursor-pointer"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================= MODAL 1: VIEW QR TICKET ================= */}
        {selectedTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#141722] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 relative shadow-2xl animate-in zoom-in-95">
              <button
                onClick={() => setSelectedTicket(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition"
              >
                <X size={18} />
              </button>

              <div className="w-12 h-12 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 flex items-center justify-center mx-auto">
                <Ticket size={24} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white line-clamp-1">
                  {selectedTicket.show?.movie?.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {selectedTicket.show?.theatre?.name} • {selectedTicket.show?.screen?.name}
                </p>
                <div className="text-xs font-mono font-bold text-yellow-500 mt-1">
                  Ref: {selectedTicket.bookingReference}
                </div>
              </div>

              {/* QR Code Graphic */}
              <div className="p-2">
                <TicketQr
                  payload={`CINEPASS|${selectedTicket.id}|${selectedTicket.bookingReference}|PAID`}
                  size={160}
                  label="GATE TURNSTILE ENTRY"
                />
              </div>

              <div className="text-xs text-neutral-400 space-y-1">
                <p>Seats: <strong className="text-white font-mono">{selectedTicket.seats?.map(s => `${s.seat?.rowLabel}${s.seat?.seatNumber}`).join(', ')}</strong></p>
                <p>Time: <strong className="text-white">{new Date(selectedTicket.show?.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</strong></p>
              </div>

              <button
                onClick={() => setSelectedTicket(null)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
              >
                Close Pass
              </button>
            </div>
          </div>
        )}

        {/* ================= MODAL 2: CANCELLATION DIALOG ================= */}
        {cancelModalBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <div className="bg-[#141722] border border-neutral-700 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center gap-3 text-red-400">
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Confirm Cancellation</h3>
                  <p className="text-xs text-neutral-400">Transparent Refund Estimation</p>
                </div>
              </div>

              <p className="text-xs text-neutral-300 leading-relaxed">
                Are you sure you want to cancel booking <strong>{cancelModalBooking.bookingReference}</strong> for <strong>{cancelModalBooking.show?.movie?.title}</strong>?
              </p>

              {/* Cancellation Breakdown */}
              <div className="p-4 rounded-xl bg-black/40 border border-neutral-800 space-y-2 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Amount Originally Paid:</span>
                  <span className="font-semibold text-white">₹{cancelModalBooking.totalAmountCents}</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Cancellation Fee (20% policy):</span>
                  <span>- ₹{Math.round(cancelModalBooking.totalAmountCents * 0.20)}</span>
                </div>
                <div className="pt-2 border-t border-neutral-800 flex justify-between font-bold text-emerald-400">
                  <span>Estimated Net Refund:</span>
                  <span>₹{Math.round(cancelModalBooking.totalAmountCents * 0.80)}</span>
                </div>
              </div>

              <p className="text-[11px] text-neutral-500 leading-relaxed">
                Releasing these tickets will immediately restore seat availability to other cinema patrons.
              </p>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelModalBooking(null)}
                  disabled={cancelling}
                  className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 font-bold text-xs transition"
                >
                  Keep Booking
                </button>
                <button
                  type="button"
                  onClick={handleConfirmCancel}
                  disabled={cancelling}
                  className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs transition active:scale-95 disabled:opacity-50"
                >
                  {cancelling ? 'Cancelling...' : 'Confirm Cancel & Refund'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
