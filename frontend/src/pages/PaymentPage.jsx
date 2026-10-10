import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { TicketQr } from '../components/TicketQr';
import { buildTicketPayload } from '../utils/qrGenerator';
import { ArrowLeft, MapPin, Calendar, Clock, Lock, CreditCard, Smartphone, Building2, AlertCircle, Loader2, Check, Download, Ticket as TicketIcon, } from 'lucide-react';
/** Convenience fee added for card payments, mirroring a real gateway. */
const CARD_CONVENIENCE_FEE = 1.5;
const PROCESSING_DELAY_MS = 2200;
const PAYMENT_METHODS = [
    {
        id: 'card',
        label: 'Credit / Debit Card',
        description: 'Visa, Mastercard, Amex',
        icon: CreditCard,
    },
    {
        id: 'ewallet',
        label: 'E-Wallet',
        description: 'Touch n Go, GrabPay, Boost',
        icon: Smartphone,
    },
    {
        id: 'online-banking',
        label: 'Online Banking',
        description: 'FPX, DuitNow transfer',
        icon: Building2,
    },
];
function formatCardNumber(value) {
    return value
        .replace(/\D/g, '')
        .slice(0, 16)
        .replace(/(.{4})/g, '$1 ')
        .trim();
}
/** Groups digits so the card brand can be inferred before submitting. */
function detectCardBrand(number) {
    const digits = number.replace(/\D/g, '');
    if (/^4/.test(digits))
        return 'Visa';
    if (/^(5[1-5]|2[2-7])/.test(digits))
        return 'Mastercard';
    if (/^3[47]/.test(digits))
        return 'Amex';
    return '';
}
function formatExpiry(value) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2)
        return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}
/** Validates a future expiry against the current date. */
function isExpiryValid(value) {
    const match = value.match(/^(\d{2})\/(\d{2})$/);
    if (!match)
        return false;
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    if (month < 1 || month > 12)
        return false;
    const now = new Date();
    // Expired if the last day of the card's month is already behind us.
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    return endOfMonth >= now;
}
export const PaymentPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const routerState = location.state;
    // Booking data arrives from the seat-selection step via router state.
    const booking = routerState?.booking ?? null;
    const [paymentMethod, setPaymentMethod] = useState('card');
    const [card, setCard] = useState({ number: '', name: '', expiry: '', cvc: '' });
    const [walletId, setWalletId] = useState('');
    const [bankId, setBankId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [paidBooking, setPaidBooking] = useState(null);
    // Returning directly to /payment without a booking is a dead end.
    useEffect(() => {
        if (!booking) {
            const timer = setTimeout(() => navigate('/', { replace: true }), 2200);
            return () => clearTimeout(timer);
        }
    }, [booking, navigate]);
    const convenienceFee = paymentMethod === 'card' ? CARD_CONVENIENCE_FEE : 0;
    const totalPayable = (booking?.totalAmount ?? 0) + convenienceFee;
    const cardBrand = useMemo(() => detectCardBrand(card.number), [card.number]);
    const ticketPayload = useMemo(() => {
        if (!paidBooking)
            return '';
        return buildTicketPayload({
            orderId: paidBooking.orderId,
            seats: paidBooking.seats,
            totalAmount: paidBooking.totalAmount,
            verifyUrl: paidBooking.qrCodeData,
        });
    }, [paidBooking]);
    const validatePayment = () => {
        if (!booking || booking.seats.length === 0) {
            return 'No seats reserved. Please start a new booking.';
        }
        if (paymentMethod === 'card') {
            const digits = card.number.replace(/\D/g, '');
            if (digits.length < 15)
                return 'Enter a valid card number.';
            if (!card.name.trim())
                return 'Enter the name printed on the card.';
            if (!isExpiryValid(card.expiry))
                return 'Enter a valid, unexpired date in MM/YY format.';
            if (!/^\d{3,4}$/.test(card.cvc))
                return 'Enter the 3 or 4 digit security code.';
        }
        if (paymentMethod === 'ewallet' && !walletId) {
            return 'Select a wallet to continue.';
        }
        if (paymentMethod === 'online-banking' && !bankId) {
            return 'Select your bank to continue.';
        }
        return '';
    };
    const handlePay = async () => {
        const validationError = validatePayment();
        if (validationError) {
            setErrorMessage(validationError);
            return;
        }
        if (!booking)
            return;
        setErrorMessage('');
        setIsProcessing(true);
        try {
            // Frontend-only simulation: no payment gateway is contacted and no
            // credentials leave the browser. Replace with a server-side charge and
            // webhook confirmation before handling real money.
            await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAY_MS));
            const record = {
                orderId: booking.orderId,
                mediaId: booking.mediaId,
                theatreName: booking.theatreName,
                date: booking.date,
                time: booking.time,
                seats: booking.seats,
                totalAmount: booking.totalAmount,
                customerName: 'Marcus Levin',
                customerEmail: 'marcus@example.com',
                createdAt: new Date().toISOString(),
                qrCodeData: `https://cinepass.my/verify/${booking.orderId}`,
                status: 'CONFIRMED',
                title: booking.title,
                posterImage: booking.posterImage,
            };
            setPaidBooking(record);
        }
        catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Payment could not be completed. Please try again.');
        }
        finally {
            setIsProcessing(false);
        }
    };
    const handleDownloadTicket = () => {
        if (!paidBooking)
            return;
        const lines = [
            'CINEPASS E-TICKET',
            '===================',
            `Order ID: ${paidBooking.orderId}`,
            `Title: ${paidBooking.title || 'Cinema Ticket'}`,
            `Venue: ${paidBooking.theatreName}`,
            `Date & Time: ${paidBooking.date} @ ${paidBooking.time}`,
            `Seats: ${paidBooking.seats.join(', ')}`,
            `Amount Paid: RM ${paidBooking.totalAmount.toFixed(2)}`,
            `Convenience Fee: RM ${convenienceFee.toFixed(2)}`,
            `Total Paid: RM ${totalPayable.toFixed(2)}`,
            `Status: ${paidBooking.status}`,
            `Verification: ${paidBooking.qrCodeData}`,
        ];
        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${paidBooking.orderId}-ticket.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };
    /* Guard state: direct navigation without a reserved booking. */
    if (!booking) {
        return (<div className="min-h-screen py-8 px-4 sm:px-6 lg:px-10 max-w-[1200px] mx-auto">
        <div className="bg-[#11131c] border border-white/10 rounded-2xl p-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-[#f5a623] mx-auto"/>
          <h1 className="text-xl font-heading font-bold text-white">No booking in progress</h1>
          <p className="text-xs text-neutral-400 max-w-sm mx-auto">
            Select your seats first, then continue to payment. Taking you back to the seat map...
          </p>
        </div>
      </div>);
    }
    /* Success state: receipt plus the generated ticket QR. */
    if (paidBooking) {
        return (<div className="min-h-screen py-8 px-4 sm:px-6 lg:px-10 max-w-[1100px] mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <span className="text-xs text-[#f5a623] font-semibold">PAYMENT SUCCESSFUL</span>
          <span className="text-xs font-mono text-neutral-500">{paidBooking.orderId}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
          {/* Receipt */}
          <div className="bg-[#11131c] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-[0_0_25px_rgba(16,185,129,0.3)]">
                <Check className="w-7 h-7 stroke-[2.5]"/>
              </div>
              <div>
                <h1 className="text-2xl font-heading font-black text-white">Payment Complete</h1>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Your tickets are confirmed and ready to scan.
                </p>
              </div>
            </div>

            <div className="rounded-xl bg-[#141722] border border-white/10 divide-y divide-white/5">
              {[
                { label: 'Order ID', value: paidBooking.orderId, mono: true },
                { label: 'Title', value: paidBooking.title || 'Cinema Ticket' },
                { label: 'Cinema', value: paidBooking.theatreName },
                { label: 'Date', value: paidBooking.date },
                { label: 'Showtime', value: paidBooking.time },
                { label: 'Seats', value: paidBooking.seats.join(', '), accent: true },
                { label: 'Payment Method', value: PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label || 'Card' },
                { label: 'Ticket Subtotal', value: `RM ${paidBooking.totalAmount.toFixed(2)}` },
                { label: 'Convenience Fee', value: `RM ${convenienceFee.toFixed(2)}` },
                { label: 'Total Paid', value: `RM ${totalPayable.toFixed(2)}`, accent: true },
            ].map((row) => (<div key={row.label} className="flex items-center justify-between gap-4 px-4 py-3">
                  <span className="text-xs text-neutral-500">{row.label}</span>
                  <span className={`text-xs text-right ${row.accent ? 'text-[#f5a623] font-bold' : 'text-white font-medium'} ${row.mono ? 'font-mono' : ''}`}>
                    {row.value}
                  </span>
                </div>))}
            </div>

            <p className="text-[11px] text-neutral-500 leading-relaxed">
              A confirmation has been sent to {paidBooking.customerEmail}. Present the QR code at the
              turnstile 15 minutes before showtime.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleDownloadTicket} className="flex-1 py-3 rounded-xl bg-[#f5a623] hover:bg-[#e09612] text-black font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer">
                <Download className="w-4 h-4"/>
                <span>Download Ticket</span>
              </button>
              <Link to="/bookings" className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm border border-white/10 transition-colors flex items-center justify-center">
                View Booking History
              </Link>
            </div>
          </div>

          {/* Ticket stub */}
          <div className="bg-[#141722] border border-white/10 rounded-2xl overflow-hidden lg:sticky lg:top-24">
            <div className="p-6 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-[#f5a623]">
                <TicketIcon className="w-4 h-4"/>
                <span className="text-[11px] uppercase tracking-widest font-semibold">E-Ticket</span>
              </div>

              <div className="inline-block bg-white p-3 rounded-xl shadow-inner">
                <TicketQr seed={ticketPayload} size={208}/>
              </div>

              <div>
                <p className="text-sm font-heading font-bold text-white">
                  {paidBooking.title || 'Cinema Ticket'}
                </p>
                <p className="text-xs text-neutral-400 mt-0.5">{paidBooking.theatreName}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="py-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-[10px] text-neutral-500 uppercase">Date</div>
                  <div className="text-xs font-bold text-white mt-0.5">{paidBooking.date}</div>
                </div>
                <div className="py-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-[10px] text-neutral-500 uppercase">Time</div>
                  <div className="text-xs font-bold text-white mt-0.5">{paidBooking.time}</div>
                </div>
                <div className="py-2 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-[10px] text-neutral-500 uppercase">Seats</div>
                  <div className="text-xs font-bold text-[#f5a623] mt-0.5">
                    {paidBooking.seats.join(',')}
                  </div>
                </div>
              </div>
            </div>

            {/* Perforation */}
            <div className="relative border-t border-dashed border-white/15">
              <div className="absolute -top-2 left-0 w-4 h-4 rounded-full bg-[#0a0b0e]"/>
              <div className="absolute -top-2 right-0 w-4 h-4 rounded-full bg-[#0a0b0e]"/>
            </div>

            <div className="p-5 text-center space-y-1">
              <p className="text-[11px] font-mono text-[#f5a623]">{paidBooking.orderId}</p>
              <p className="text-[10px] text-neutral-500 font-mono break-all">
                {paidBooking.qrCodeData}
              </p>
            </div>
          </div>
        </div>
      </div>);
    }
    /* Payment form */
    return (<div className="min-h-screen py-8 px-4 sm:px-6 lg:px-10 max-w-[1200px] mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-xs font-medium text-neutral-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4"/>
          <span>Back to Discovery</span>
        </Link>
        <span className="text-xs text-[#f5a623] font-semibold">STEP 2 OF 2: PAYMENT</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* Left: payment methods */}
        <div className="space-y-6">
          <div className="bg-[#11131c] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6">
            <div>
              <h1 className="text-2xl font-heading font-black text-white">Complete Your Payment</h1>
              <p className="text-xs text-neutral-400 mt-1">
                Seats are held for you. Payment confirms the booking.
              </p>
            </div>

            {errorMessage && (<div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-red-400 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0"/>
                <span>{errorMessage}</span>
              </div>)}

            {/* Method selector */}
            <div>
              <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 block">
                Payment Method
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PAYMENT_METHODS.map((method) => {
            const isSelected = paymentMethod === method.id;
            const Icon = method.icon;
            return (<button key={method.id} type="button" onClick={() => {
                    setPaymentMethod(method.id);
                    setErrorMessage('');
                }} className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${isSelected
                    ? 'border-[#f5a623] bg-[#f5a623]/10 shadow-sm shadow-[#f5a623]/10'
                    : 'border-white/10 bg-white/5 hover:border-white/25'}`}>
                      <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-[#f5a623]' : 'text-neutral-400'}`}/>
                      <div className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-neutral-300'}`}>
                        {method.label}
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{method.description}</div>
                    </button>);
        })}
              </div>
            </div>

            {/* Card form */}
            {paymentMethod === 'card' && (<div className="space-y-4 pt-4 border-t border-white/10">
                <div>
                  <label htmlFor="card-number" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
                    Card Number
                  </label>
                  <div className="relative">
                    <input id="card-number" inputMode="numeric" autoComplete="cc-number" value={card.number} onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })} placeholder="4242 4242 4242 4242" className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] rounded-xl px-4 py-3 pr-20 text-sm text-white placeholder-neutral-500 outline-none transition-all font-mono"/>
                    {cardBrand && (<span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[#f5a623] bg-[#f5a623]/15 border border-[#f5a623]/30 rounded px-2 py-1">
                        {cardBrand}
                      </span>)}
                  </div>
                </div>

                <div>
                  <label htmlFor="card-name" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
                    Name on Card
                  </label>
                  <input id="card-name" autoComplete="cc-name" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} placeholder="MARCUS LEVIN" className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-all uppercase"/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="card-expiry" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
                      Expiry (MM/YY)
                    </label>
                    <input id="card-expiry" inputMode="numeric" autoComplete="cc-exp" value={card.expiry} onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })} placeholder="12/28" className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-all font-mono"/>
                  </div>
                  <div>
                    <label htmlFor="card-cvc" className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 block">
                      CVC
                    </label>
                    <input id="card-cvc" inputMode="numeric" autoComplete="cc-csc" type="password" value={card.cvc} onChange={(e) => setCard({ ...card, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })} placeholder="123" className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition-all font-mono"/>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-500 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-500"/>
                  Demo checkout. No real charge is made and card details are not transmitted.
                </p>
              </div>)}

            {/* E-wallet */}
            {paymentMethod === 'ewallet' && (<div className="pt-4 border-t border-white/10">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 block">
                  Select Wallet
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['Touch n Go eWallet', 'GrabPay', 'Boost'].map((wallet) => (<button key={wallet} type="button" onClick={() => setWalletId(wallet)} className={`py-3 px-4 rounded-xl border text-xs font-medium transition-all cursor-pointer ${walletId === wallet
                    ? 'border-[#f5a623] bg-[#f5a623]/15 text-white'
                    : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/25'}`}>
                      {wallet}
                    </button>))}
                </div>
              </div>)}

            {/* Online banking */}
            {paymentMethod === 'online-banking' && (<div className="pt-4 border-t border-white/10">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 block">
                  Select Bank
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {['Maybank', 'CIMB', 'Public Bank', 'RHB', 'Bank Islam', 'HSBC'].map((bank) => (<button key={bank} type="button" onClick={() => setBankId(bank)} className={`py-3 px-4 rounded-xl border text-xs font-medium transition-all cursor-pointer ${bankId === bank
                    ? 'border-[#f5a623] bg-[#f5a623]/15 text-white'
                    : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/25'}`}>
                      {bank}
                    </button>))}
                </div>
              </div>)}
          </div>
        </div>

        {/* Right: order summary */}
        <div className="bg-[#141722] border border-white/10 rounded-2xl p-6 space-y-5 lg:sticky lg:top-24">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
              Order Summary
            </h2>
            <span className="text-[10px] font-mono text-neutral-500">{booking.orderId}</span>
          </div>

          {booking.posterImage && (<div className="flex items-center gap-3">
              <div className="w-14 h-20 rounded-lg overflow-hidden border border-white/10 shrink-0">
                <img src={booking.posterImage} alt="" className="w-full h-full object-cover"/>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-heading font-bold text-white truncate">
                  {booking.title || 'Cinema Ticket'}
                </p>
                <p className="text-xs text-neutral-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-[#f5a623] shrink-0"/>
                  <span className="truncate">{booking.theatreName}</span>
                </p>
              </div>
            </div>)}

          <div className="space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-neutral-400">
              <Calendar className="w-3.5 h-3.5 text-neutral-500"/>
              {booking.date}
            </div>
            <div className="flex items-center gap-2 text-neutral-400">
              <Clock className="w-3.5 h-3.5 text-neutral-500"/>
              {booking.time}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">Seats</span>
              <span className="font-mono font-bold text-[#f5a623] text-sm">
                {booking.seats.join(', ')}
              </span>
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-neutral-400">
                Tickets ({booking.seats.length} x RM {(booking.totalAmount / booking.seats.length).toFixed(2)})
              </span>
              <span className="text-white font-medium">RM {booking.totalAmount.toFixed(2)}</span>
            </div>
            {convenienceFee > 0 && (<div className="flex items-center justify-between">
                <span className="text-neutral-400">Convenience fee</span>
                <span className="text-white font-medium">RM {convenienceFee.toFixed(2)}</span>
              </div>)}
            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Total Payable
              </span>
              <span className="text-xl font-heading font-black text-[#f5a623]">
                RM {totalPayable.toFixed(2)}
              </span>
            </div>
          </div>

          <button onClick={handlePay} disabled={isProcessing} className="w-full py-3.5 rounded-xl bg-[#f5a623] hover:bg-[#e09612] active:bg-[#c9830c] text-black font-semibold text-sm transition-all duration-200 shadow-lg shadow-[#f5a623]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60">
            {isProcessing ? (<>
                <Loader2 className="w-4 h-4 animate-spin"/>
                <span>Processing Payment...</span>
              </>) : (<>
                <Lock className="w-4 h-4"/>
                <span>Pay RM {totalPayable.toFixed(2)}</span>
              </>)}
          </button>

          <p className="text-[10px] text-neutral-600 text-center leading-relaxed">
            By continuing you agree to CinePass terms of service and refund policy.
          </p>
        </div>
      </div>
    </div>);
};
