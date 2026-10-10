import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  Ticket, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  QrCode, 
  Eye, 
  Armchair, 
  User, 
  Mail, 
  Phone, 
  Calendar,
  X,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { api } from '../../services/api.service';

export const ManagerBookings = () => {
  const { theatre } = useOutletContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Selected Booking Inspection Modal
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await api.getTheatreBookings({
        status: statusFilter || undefined,
        search: search || undefined
      });
      setBookings(data || []);
    } catch (err) {
      console.error('Error fetching manager bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBookings();
  };

  const formatCurrency = (cents) => {
    const amount = (cents || 0) / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Metrics summary
  const totalAmount = bookings.reduce((sum, b) => b.status === 'CONFIRMED' ? sum + b.totalAmountCents : sum, 0);
  const totalSeatsBooked = bookings.reduce((sum, b) => b.status === 'CONFIRMED' ? sum + (b.seats?.length || 0) : sum, 0);
  const confirmedCount = bookings.filter(b => b.status === 'CONFIRMED').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <Ticket className="text-yellow-400" /> Box Office Bookings
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Real-time ticket ledger, gate validation status, and customer transaction details.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs font-semibold transition"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Ledger
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-[#101216] border border-white/5 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Bookings</div>
          <div className="mt-2 text-2xl font-black text-white">{bookings.length}</div>
          <div className="text-xs text-neutral-500 mt-1">
            {confirmedCount} confirmed orders
          </div>
        </div>

        <div className="bg-[#101216] border border-white/5 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Tickets Issued</div>
          <div className="mt-2 text-2xl font-black text-cyan-400">{totalSeatsBooked}</div>
          <div className="text-xs text-neutral-500 mt-1">
            Seats allocated across shows
          </div>
        </div>

        <div className="bg-[#101216] border border-white/5 rounded-2xl p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Confirmed Revenue</div>
          <div className="mt-2 text-2xl font-black text-emerald-400">{formatCurrency(totalAmount)}</div>
          <div className="text-xs text-neutral-500 mt-1">
            Gross box office transactions
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#101216] border border-white/5 flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by Reference (CV...), Customer Name, or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#181b22] border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#181b22] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
          >
            <option value="">All Statuses</option>
            <option value="CONFIRMED">Confirmed Only</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="INITIATED">Initiated</option>
          </select>

          {(search || statusFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                fetchBookings();
              }}
              className="text-xs text-yellow-400 hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="py-20 text-center text-neutral-500">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-yellow-400" />
          <p className="text-sm">Loading bookings ledger...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-[#101216] border border-white/5 rounded-2xl p-12 text-center">
          <Ticket size={48} className="mx-auto text-neutral-600 mb-3" />
          <h3 className="text-lg font-bold text-white">No Bookings Found</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mt-1">
            There are no customer ticket bookings matching your search criteria.
          </p>
        </div>
      ) : (
        <div className="bg-[#101216] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#14171d] text-neutral-400 font-semibold border-b border-white/5 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-4">Booking Ref</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Film & Audi</th>
                  <th className="py-3.5 px-4">Show Time</th>
                  <th className="py-3.5 px-4">Seats</th>
                  <th className="py-3.5 px-4">Total</th>
                  <th className="py-3.5 px-4">Gate Scan</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bookings.map((booking) => {
                  const showDate = new Date(booking.show?.startTime);
                  const timeStr = showDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = showDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const seatsList = booking.seats?.map(s => `${s.seat?.rowLabel || ''}${s.seat?.seatNumber || ''}`).join(', ') || 'N/A';

                  return (
                    <tr key={booking.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                          {booking.bookingReference}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{booking.user?.fullName || 'Guest Customer'}</div>
                        <div className="text-[11px] text-neutral-500 truncate max-w-[140px]">{booking.user?.email}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{booking.show?.movie?.title || 'Screening'}</div>
                        <div className="text-[11px] text-neutral-400">
                          {booking.show?.screen?.name || `Screen ${booking.show?.screen?.screenNumber}`} • {booking.show?.visualFormat}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-white font-medium">{dateStr}</div>
                        <div className="text-neutral-500 font-mono text-[11px]">{timeStr}</div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-300">
                        {seatsList}
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-white">
                        {formatCurrency(booking.totalAmountCents)}
                      </td>

                      <td className="py-3.5 px-4">
                        {booking.qrScanStatus === 'USED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 size={11} /> Admitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">
                            <Clock size={11} /> Unused
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {booking.status === 'CONFIRMED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Confirmed
                          </span>
                        ) : booking.status === 'CANCELLED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                            Cancelled
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {booking.status}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedBooking(booking)}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-[11px] font-medium transition"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INSPECTION MODAL */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121419] border border-white/10 rounded-2xl w-full max-w-md p-6 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Ticket className="text-yellow-400" size={20} />
                <h3 className="text-lg font-bold text-white">Booking Inspection</h3>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs">
              {/* Reference Banner */}
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-yellow-500 uppercase font-bold tracking-wider">Booking Reference</div>
                  <div className="text-lg font-mono font-black text-yellow-400">{selectedBooking.bookingReference}</div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white/10 text-white">
                  {selectedBooking.status}
                </span>
              </div>

              {/* Customer Card */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Customer Details</div>
                <div className="flex items-center gap-2 text-white">
                  <User size={13} className="text-yellow-400" />
                  <span className="font-semibold">{selectedBooking.user?.fullName || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-400">
                  <Mail size={13} className="text-neutral-500" />
                  <span>{selectedBooking.user?.email || 'N/A'}</span>
                </div>
                {selectedBooking.user?.mobileNumber && (
                  <div className="flex items-center gap-2 text-neutral-400">
                    <Phone size={13} className="text-neutral-500" />
                    <span>{selectedBooking.user?.mobileNumber}</span>
                  </div>
                )}
              </div>

              {/* Screening & Screen Details */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Show & Auditorium</div>
                <div className="text-sm font-bold text-white">{selectedBooking.show?.movie?.title}</div>
                <div className="text-neutral-400">
                  {selectedBooking.show?.screen?.name} • {selectedBooking.show?.visualFormat} • {selectedBooking.show?.languageVersion}
                </div>
                <div className="text-neutral-400">
                  {new Date(selectedBooking.show?.startTime).toLocaleString()}
                </div>
              </div>

              {/* Allocated Seats */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Allocated Seats</div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedBooking.seats?.map(s => (
                    <span
                      key={s.id}
                      className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 font-mono font-bold text-cyan-300"
                    >
                      {s.seat?.rowLabel}{s.seat?.seatNumber} ({s.seat?.tier})
                    </span>
                  ))}
                </div>
              </div>

              {/* Gate Admission Status */}
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Gate Ticket Status</div>
                <div className="flex items-center gap-2 text-white font-semibold">
                  <QrCode size={14} className="text-yellow-400" />
                  <span>{selectedBooking.qrScanStatus === 'USED' ? 'Scanned at Gate' : 'Pending Admission (Unused)'}</span>
                </div>
                {selectedBooking.scannedAt && (
                  <div className="text-[11px] text-neutral-500">
                    Scanned at: {new Date(selectedBooking.scannedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
