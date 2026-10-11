import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';
import { 
  ArrowLeft, 
  Film, 
  MapPin, 
  Calendar, 
  Clock, 
  Ticket, 
  ShieldCheck, 
  CreditCard, 
  Smartphone, 
  Building, 
  Tag, 
  Check, 
  AlertCircle, 
  Lock,
  Loader2
} from 'lucide-react';

export const CheckoutPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('upi'); // upi, card, netbanking
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Dummy mock inputs for visual authenticity
  const [upiId, setUpiId] = useState('');
  const [card, setCard] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [bank, setBank] = useState('HDFC Bank');

  useEffect(() => {
    fetchBooking();
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

  const seatsCount = booking?.seats?.length || 0;
  const rawSubtotal = booking?.subtotalCents || 0;
  
  // Standard cinema convenience fee & taxes
  const convenienceFee = useMemo(() => {
    return Math.round(seatsCount * 25);
  }, [seatsCount]);

  const taxes = useMemo(() => {
    return Math.round((rawSubtotal + convenienceFee) * 0.18); // 18% GST
  }, [rawSubtotal, convenienceFee]);

  const discountAmount = useMemo(() => {
    return Math.round((rawSubtotal * discountPercent) / 100);
  }, [rawSubtotal, discountPercent]);

  const finalPayable = useMemo(() => {
    return Math.max(0, rawSubtotal + convenienceFee + taxes - discountAmount);
  }, [rawSubtotal, convenienceFee, taxes, discountAmount]);

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    const code = couponCode.trim().toUpperCase();
    if (code === 'CINEPASS20' || code === 'WELCOME20') {
      setDiscountPercent(20);
      setCouponMessage('20% Promo discount applied!');
    } else if (code === 'CINEPASS50' || code === 'SUPER50') {
      setDiscountPercent(50);
      setCouponMessage('50% Mega Promo applied!');
    } else {
      setDiscountPercent(0);
      setCouponMessage('Invalid or expired coupon code.');
    }
  };

  const handleSimulatePayment = async (status) => {
    setProcessing(true);
    setPaymentError('');

    try {
      const res = await api.mockPayment(bookingId, status);
      if (status === 'SUCCESS' && res.success) {
        navigate(`/booking/confirmation/${bookingId}`);
      } else {
        setPaymentError('Payment was simulated as FAILED. The transaction was cancelled by your bank.');
      }
    } catch (err) {
      console.error('Payment failure:', err);
      setPaymentError(err.message || 'Payment simulation failed. Your seat hold may have expired.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin" />
          <p className="text-sm text-neutral-400 font-medium">Loading checkout summary...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#060608] flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-neutral-900/60 border border-neutral-800 rounded-2xl p-8 text-center space-y-4">
          <AlertCircle size={48} className="text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">Booking Not Found</h2>
          <p className="text-sm text-neutral-400">This booking session does not exist or has expired.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-bold text-sm transition"
          >
            <ArrowLeft size={16} /> Return to Discovery
          </Link>
        </div>
      </div>
    );
  }

  const show = booking.show;
  const movie = show?.movie;

  return (
    <div className="min-h-screen bg-[#060608] text-white pt-24 pb-20 font-sans">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header Breadcrumb */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-yellow-500">
              STEP 2 OF 2 • SECURE CHECKOUT
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Review Order &amp; Payment
            </h1>
          </div>
        </div>

        {paymentError && (
          <div className="mb-6 p-4 bg-red-500/15 border border-red-500/30 text-red-300 rounded-2xl flex items-center gap-3 text-sm animate-in fade-in">
            <AlertCircle size={20} className="shrink-0 text-red-400" />
            <span>{paymentError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT 7 COLS: Order Items & Payment Simulator */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Show & Seat Review Card */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                1. Reservation Details
              </h2>

              <div className="flex gap-4 items-start">
                {movie?.posterUrl ? (
                  <img
                    src={movie.posterUrl}
                    alt={movie.title}
                    className="w-16 h-24 object-cover rounded-xl border border-neutral-800 shadow shrink-0"
                  />
                ) : (
                  <div className="w-16 h-24 bg-neutral-950 rounded-xl flex items-center justify-center text-neutral-600 border border-neutral-800">
                    <Film size={24} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-bold text-white line-clamp-1">{movie?.title}</h3>
                  <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1.5">
                    <MapPin size={13} className="text-yellow-500" />
                    <span>{show?.theatre?.name} • {show?.screen?.name}</span>
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
                    <Calendar size={13} className="text-neutral-500" />
                    <span>
                      {new Date(show?.startTime).toLocaleDateString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                    <span>•</span>
                    <Clock size={13} className="text-neutral-500" />
                    <span>
                      {new Date(show?.startTime).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </p>
                </div>
              </div>

              {/* Reserved Seats List */}
              <div className="pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-neutral-400">
                  Reserved Seats ({seatsCount}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {booking.seats?.map(bs => (
                    <span
                      key={bs.id}
                      className="px-2.5 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 font-mono font-bold"
                    >
                      {bs.seat?.rowLabel}{bs.seat?.seatNumber} ({bs.seat?.tier})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Customer Contact Details */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                2. Contact Information (Ticket Delivery)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-neutral-500 block mb-1">Customer Name</span>
                  <span className="font-semibold text-white bg-black/40 border border-neutral-800 p-2.5 rounded-xl block">
                    {user?.fullName || 'Registered Customer'}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block mb-1">Email for E-Ticket</span>
                  <span className="font-semibold text-white bg-black/40 border border-neutral-800 p-2.5 rounded-xl block">
                    {user?.email || 'customer@cineverse.com'}
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Payment Method Simulator */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  3. Select Payment Mode (Deterministic Simulator)
                </h2>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                  <ShieldCheck size={12} /> Test Adapter Active
                </span>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold cursor-pointer ${
                    paymentMethod === 'upi'
                      ? 'bg-yellow-500/15 border-yellow-500 text-yellow-400'
                      : 'bg-black/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Smartphone size={18} />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'bg-yellow-500/15 border-yellow-500 text-yellow-400'
                      : 'bg-black/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <CreditCard size={18} />
                  <span>Debit / Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-bold cursor-pointer ${
                    paymentMethod === 'netbanking'
                      ? 'bg-yellow-500/15 border-yellow-500 text-yellow-400'
                      : 'bg-black/40 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                  }`}
                >
                  <Building size={18} />
                  <span>Net Banking</span>
                </button>
              </div>

              {/* Sub-form inputs */}
              {paymentMethod === 'upi' && (
                <div className="space-y-3 pt-2">
                  <label className="text-xs text-neutral-400 block">UPI Virtual Payment Address (VPA)</label>
                  <input
                    type="text"
                    placeholder="e.g. user@okhdfcbank or user@paytm"
                    value={upiId}
                    onChange={e => setUpiId(e.target.value)}
                    className="w-full bg-black/60 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500"
                  />
                  <div className="flex gap-2">
                    {['Google Pay', 'PhonePe', 'Paytm', 'BHIM'].map(app => (
                      <button
                        key={app}
                        type="button"
                        onClick={() => setUpiId(`${app.toLowerCase().replace(/\s/g, '')}@okaxis`)}
                        className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] text-neutral-400 hover:text-white"
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="space-y-3 pt-2">
                  <input
                    type="text"
                    placeholder="Card Number (4000 1234 5678 9010)"
                    value={card.number}
                    onChange={e => setCard({ ...card, number: e.target.value })}
                    className="w-full bg-black/60 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 font-mono"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      value={card.expiry}
                      onChange={e => setCard({ ...card, expiry: e.target.value })}
                      className="w-full bg-black/60 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 font-mono"
                    />
                    <input
                      type="password"
                      placeholder="CVV"
                      maxLength={4}
                      value={card.cvc}
                      onChange={e => setCard({ ...card, cvc: e.target.value })}
                      className="w-full bg-black/60 border border-neutral-800 rounded-xl p-3 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 font-mono"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div className="space-y-3 pt-2">
                  <label className="text-xs text-neutral-400 block">Select Participating Bank</label>
                  <select
                    value={bank}
                    onChange={e => setBank(e.target.value)}
                    className="w-full bg-black/60 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-yellow-500"
                  >
                    {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra'].map(b => (
                      <option key={b} value={b} className="bg-neutral-900 text-white">{b}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Simulation Action Controls */}
              <div className="pt-4 border-t border-neutral-800 space-y-3">
                <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                  <Lock size={12} className="text-emerald-400" />
                  Deterministic CineVerse P0 Mock Payment Adapter. Select test action below:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    disabled={processing}
                    onClick={() => handleSimulatePayment('SUCCESS')}
                    className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {processing ? (
                      <Loader2 size={16} className="animate-spin text-black" />
                    ) : (
                      <Check size={16} />
                    )}
                    <span>Simulate Payment SUCCESS (₹{finalPayable})</span>
                  </button>

                  <button
                    disabled={processing}
                    onClick={() => handleSimulatePayment('FAILED')}
                    className="w-full py-3.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <span>Simulate Payment FAILURE</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: Authoritative Fare Breakdown & Coupons */}
          <div className="lg:col-span-5 space-y-6">
            {/* Promo Code Box */}
            <div className="bg-neutral-900/60 border border-neutral-800 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                <Tag size={14} className="text-yellow-500" />
                Apply Coupon / Promo Code
              </div>

              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. CINEPASS20 or WELCOME20"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  className="flex-1 bg-black/60 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-yellow-500 uppercase font-mono"
                />
                <button
                  type="submit"
                  className="bg-yellow-500/15 hover:bg-yellow-500/25 border border-yellow-500/30 text-yellow-400 text-xs px-4 py-2 rounded-xl font-bold transition"
                >
                  Apply
                </button>
              </form>
              {couponMessage && (
                <p className={`text-[11px] font-medium ${discountPercent > 0 ? 'text-emerald-400' : 'text-neutral-400'}`}>
                  {couponMessage}
                </p>
              )}
            </div>

            {/* Bill Summary */}
            <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Bill Summary
                </h3>
                <span className="text-[10px] font-mono text-neutral-500 font-bold">
                  {booking.bookingReference}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-neutral-300">
                  <span>Ticket Subtotal ({seatsCount} Seats)</span>
                  <span className="font-semibold text-white">₹{rawSubtotal}</span>
                </div>

                <div className="flex justify-between text-neutral-400">
                  <span>Convenience Fee</span>
                  <span>₹{convenienceFee}</span>
                </div>

                <div className="flex justify-between text-neutral-400">
                  <span>Integrated GST (18%)</span>
                  <span>₹{taxes}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold pt-1">
                    <span>Promo Discount ({discountPercent}%)</span>
                    <span>- ₹{discountAmount}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-neutral-800 flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-300 block">
                      Total Payable
                    </span>
                    <span className="text-[10px] text-neutral-500">Includes all applicable cinema taxes</span>
                  </div>
                  <span className="text-2xl font-black text-yellow-500 font-mono">
                    ₹{finalPayable}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  disabled={processing}
                  onClick={() => handleSimulatePayment('SUCCESS')}
                  className="w-full py-4 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/25 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  {processing ? (
                    <Loader2 size={18} className="animate-spin text-black" />
                  ) : (
                    <Lock size={16} />
                  )}
                  <span>Pay ₹{finalPayable} &amp; Generate Ticket</span>
                </button>
              </div>

              <p className="text-[10px] text-neutral-500 text-center leading-relaxed">
                By completing payment, you confirm agreement to the cinema seat booking terms and cancellation rules.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
