import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Loader2,
  ChevronRight,
  Tag,
} from 'lucide-react';
import { api } from '../services/api';
import type { MediaItem } from '../types';
import { moviesData } from '../data/movies';
import { eventsData } from '../data/events';

export const BookingPage: React.FC = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const [item, setItem] = useState<MediaItem>(() => {
    return (
      moviesData.find((m) => m.id === movieId) ||
      eventsData.find((e) => e.id === movieId) ||
      moviesData[0]
    );
  });

  const [selectedTheatre, setSelectedTheatre] = useState('IMAX Pavilion Elite KL');
  const [selectedDate, setSelectedDate] = useState('Tomorrow, Oct 8');
  const [selectedTime, setSelectedTime] = useState('06:30 PM');
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['E7', 'E8']);
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>(['B4', 'B5', 'C6', 'C7', 'D3', 'D4', 'E4']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 5-Minute Seat Hold Countdown Timer
  const [holdSecondsLeft, setHoldSecondsLeft] = useState<number>(300);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);

  // Fetch item details from API
  useEffect(() => {
    if (!movieId) return;
    let isCancelled = false;
    (async () => {
      const movie = await api.getMovieById(movieId);
      if (movie && !isCancelled) {
        setItem(movie);
        return;
      }
      const event = await api.getEventById(movieId);
      if (event && !isCancelled) {
        setItem(event);
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [movieId]);

  // Fetch real occupied seats whenever showtime changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const seats = await api.getOccupiedSeats(selectedTheatre, selectedDate, selectedTime);
        if (isMounted) {
          setOccupiedSeats(seats);
          setSelectedSeats((prev) => prev.filter((s) => !seats.includes(s)));
        }
      } catch (err) {
        console.warn('Failed to load occupied seats:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedTheatre, selectedDate, selectedTime]);

  // Countdown timer effect when seats are selected
  useEffect(() => {
    if (selectedSeats.length === 0) {
      setHoldSecondsLeft(300);
      return;
    }

    const timer = setInterval(() => {
      setHoldSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Release hold
          api.releaseSeats('show-demo', selectedSeats);
          setSelectedSeats([]);
          setErrorMessage('Your 5-minute seat hold expired. Please re-select your seats.');
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedSeats]);

  const dates = [
    { label: 'Today', date: 'Oct 7' },
    { label: 'Tomorrow', date: 'Oct 8' },
    { label: 'Thursday', date: 'Oct 9' },
    { label: 'Friday', date: 'Oct 10' },
  ];

  const theatres = [
    'IMAX Pavilion Elite KL',
    'GSC Mid Valley Megamall',
    'TGV Sunway Pyramid',
    'Aurum Theatre The Gardens',
  ];

  const showtimes = ['11:30 AM', '02:45 PM', '06:30 PM', '09:45 PM'];

  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  const getSeatTier = (row: string): { tier: string; price: number; colorClass: string } => {
    if (row === 'A' || row === 'B') {
      return { tier: 'Standard', price: 38.0, colorClass: 'border-blue-500/30' };
    }
    if (row === 'C' || row === 'D') {
      return { tier: 'Premium', price: 48.0, colorClass: 'border-purple-500/30' };
    }
    return { tier: 'VIP Recliner', price: 65.0, colorClass: 'border-[#f5a623]/30' };
  };

  const toggleSeat = async (seatId: string) => {
    if (occupiedSeats.includes(seatId)) return;
    setErrorMessage(null);

    let updated: string[];
    if (selectedSeats.includes(seatId)) {
      updated = selectedSeats.filter((s) => s !== seatId);
    } else {
      updated = [...selectedSeats, seatId];
    }
    setSelectedSeats(updated);

    if (updated.length > 0) {
      setHoldSecondsLeft(300);
      await api.lockSeats('show-demo', updated);
    } else {
      await api.releaseSeats('show-demo', selectedSeats);
    }
  };

  // Calculate dynamic total amount based on tiers
  const subtotal = selectedSeats.reduce((sum, seatId) => {
    const row = seatId.charAt(0);
    return sum + getSeatTier(row).price;
  }, 0);

  const discountAmount = (subtotal * appliedDiscount) / 100;
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'CINEPASS20') {
      setAppliedDiscount(20);
      setCouponMessage('✅ 20% discount applied!');
    } else if (code === 'WELCOME50') {
      setAppliedDiscount(50);
      setCouponMessage('🎉 50% Welcome discount applied!');
    } else {
      setAppliedDiscount(0);
      setCouponMessage('❌ Invalid coupon code. Try CINEPASS20');
    }
  };

  const handleConfirmBooking = async () => {
    if (selectedSeats.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const currentUser = api.getCurrentUser();

    try {
      const response = await api.createBooking({
        mediaId: item.id,
        theatreName: selectedTheatre,
        date: selectedDate,
        time: selectedTime,
        seats: selectedSeats,
        totalAmount,
        customerName: currentUser?.fullName || 'Marcus Levin',
        customerEmail: currentUser?.email || 'customer@cinepass.com',
      });

      if (response.success && response.booking) {
        // Seats are now reserved server-side. Hand off to the payment step;
        // router state carries the reservation so a refresh on /payment can
        // fall back to the seat map.
        navigate('/payment', {
          state: {
            booking: {
              orderId: response.booking.orderId,
              mediaId: response.booking.mediaId,
              theatreName: response.booking.theatreName,
              date: response.booking.date,
              time: response.booking.time,
              seats: response.booking.seats,
              totalAmount: response.booking.totalAmount,
              title: response.booking.title,
              posterImage: response.booking.posterImage,
            },
          },
        });
      } else {
        throw new Error(response.error || 'Failed to confirm booking');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred during booking';
      setErrorMessage(msg);
      const seats = await api.getOccupiedSeats(selectedTheatre, selectedDate, selectedTime);
      setOccupiedSeats(seats);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-10 max-w-[1200px] mx-auto">
      {/* Top Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Discovery</span>
        </Link>
        <span className="text-xs text-neutral-500 font-mono">STEP 1 OF 2: SEATS &amp; VENUE</span>
      </div>

      <div className="bg-[#11131c] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-8">
          {/* Header Title */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div>
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30 tracking-wider">
                CINEMA BOOKING
              </span>
              <h1 className="text-2xl sm:text-3xl font-heading font-black text-white mt-1">
                {item.title}
              </h1>
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
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs sm:text-sm animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5 text-amber-300">
                <Clock className="w-4 h-4 animate-pulse text-[#f5a623]" />
                <span>
                  <strong>Seats Reserved:</strong> Complete checkout within{' '}
                  <span className="font-mono font-bold text-white text-base">
                    {formatTimer(holdSecondsLeft)}
                  </span>
                </span>
              </div>
              <span className="text-[11px] text-amber-200/70 hidden sm:inline">
                PostgreSQL Row Lock Active
              </span>
            </div>
          )}

          {/* Error notification */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#f5a623]" />
                Select Cinema Theatre
              </label>
              <select
                value={selectedTheatre}
                onChange={(e) => setSelectedTheatre(e.target.value)}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#f5a623]"
              >
                {theatres.map((t) => (
                  <option key={t} value={t} className="bg-[#11131c] text-white">
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#f5a623]" />
                Select Date
              </label>
              <div className="grid grid-cols-4 gap-2">
                {dates.map((d) => {
                  const isSelected = selectedDate === `${d.label}, ${d.date}`;
                  return (
                    <button
                      key={d.date}
                      onClick={() => setSelectedDate(`${d.label}, ${d.date}`)}
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
              {showtimes.map((time) => {
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

          {/* Interactive Seat Matrix */}
          <div className="pt-4 border-t border-white/10">
            <div className="w-3/4 max-w-md mx-auto mb-8 text-center">
              <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-[#f5a623] to-transparent rounded-full shadow-[0_0_15px_#f5a623]" />
              <span className="text-[11px] uppercase font-mono tracking-widest text-neutral-500 mt-2 block">
                AUDITORIUM SCREEN (IMAX LASER)
              </span>
            </div>

            <div className="flex flex-col items-center gap-2.5 overflow-x-auto pb-4">
              {rows.map((row) => {
                const tierInfo = getSeatTier(row);
                return (
                  <div key={row} className="flex items-center gap-2">
                    <span className="w-4 text-xs font-mono text-neutral-500 text-center font-bold">
                      {row}
                    </span>
                    <div className="flex gap-2">
                      {cols.map((col) => {
                        const seatId = `${row}${col}`;
                        const isOccupied = occupiedSeats.includes(seatId);
                        const isSelected = selectedSeats.includes(seatId);

                        return (
                          <button
                            key={seatId}
                            disabled={isOccupied}
                            onClick={() => toggleSeat(seatId)}
                            title={`${row}${col} - ${tierInfo.tier} (RM ${tierInfo.price})`}
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold flex items-center justify-center transition-all ${
                              isOccupied
                                ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed border border-white/5'
                                : isSelected
                                ? 'bg-[#f5a623] text-black shadow-[0_0_10px_#f5a623] cursor-pointer ring-2 ring-[#f5a623]/50'
                                : `bg-white/10 hover:bg-white/20 text-neutral-300 border ${tierInfo.colorClass} cursor-pointer`
                            }`}
                          >
                            {col}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Seat legend with tiers */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-white/10 border border-blue-500/40" />
                <span>Standard (RM 38)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-white/10 border border-purple-500/40" />
                <span>Premium (RM 48)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-white/10 border border-[#f5a623]/50" />
                <span>VIP Recliner (RM 65)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-[#f5a623]" />
                <span className="text-white font-medium">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded bg-neutral-800 border border-white/5" />
                <span>Booked</span>
              </div>
            </div>
          </div>

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
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/15 transition-colors cursor-pointer"
              >
                Apply
              </button>
            </form>
          </div>
          {couponMessage && (
            <div className="text-xs px-2 text-neutral-300 font-medium">{couponMessage}</div>
          )}

          {/* Checkout Bar */}
          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs text-neutral-400">
                Selected Seats:{' '}
                <span className="text-white font-semibold">
                  {selectedSeats.join(', ') || 'None selected'}
                </span>
                {appliedDiscount > 0 && (
                  <span className="ml-2 text-emerald-400 font-bold">
                    ({appliedDiscount}% OFF Applied)
                  </span>
                )}
              </div>
              <div className="text-xl font-heading font-black text-[#f5a623] mt-0.5 flex items-baseline gap-2">
                <span>RM {totalAmount.toFixed(2)}</span>
                {appliedDiscount > 0 && (
                  <span className="text-xs text-neutral-400 line-through">
                    RM {subtotal.toFixed(2)}
                  </span>
                )}
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
                  <span>Reserve Seats &amp; Continue to Payment</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };
