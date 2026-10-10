import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, MapPin, Clock, Ticket, Check, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../services/api';

export const BookingModal = ({ item, onClose }) => {
    const [theatres, setTheatres] = useState([]);
    const [selectedTheatre, setSelectedTheatre] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [occupiedSeats, setOccupiedSeats] = useState([]);
    const [step, setStep] = useState('seats');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [confirmedBooking, setConfirmedBooking] = useState(null);

    // Dynamic dates starting from today
    const dates = useMemo(() => {
        return [0, 1, 2, 3].map((offset) => {
            const d = new Date();
            d.setDate(d.getDate() + offset);
            const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            return { label, date: dateStr, full: `${label}, ${dateStr}` };
        });
    }, []);

    useEffect(() => {
        if (dates.length > 0 && !selectedDate) {
            setSelectedDate(dates[0].full);
        }
    }, [dates, selectedDate]);

    // Fetch real theatres from DB
    useEffect(() => {
        let isMounted = true;
        (async () => {
            try {
                const list = await api.getTheatres();
                if (isMounted && list && list.length > 0) {
                    setTheatres(list);
                    setSelectedTheatre(list[0].name || list[0].id);
                }
            } catch (err) {
                console.warn('Failed to load theatres:', err);
            }
        })();
        return () => {
            isMounted = false;
        };
    }, []);

    // Compute showtimes
    const showtimes = useMemo(() => {
        const theatreObj = theatres.find((t) => t.name === selectedTheatre || t.id === selectedTheatre);
        if (theatreObj?.screens) {
            const shows = theatreObj.screens.flatMap((s) => s.shows || []);
            const movieShows = shows.filter((sh) => !sh.isCancelled && (sh.movieId === item?.id || !item?.id));
            if (movieShows.length > 0) {
                return Array.from(new Set(movieShows.map((sh) => {
                    const d = new Date(sh.startTime);
                    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                })));
            }
        }
        return ['11:30 AM', '02:45 PM', '06:30 PM', '09:45 PM'];
    }, [theatres, selectedTheatre, item?.id]);

    useEffect(() => {
        if (showtimes.length > 0 && (!selectedTime || !showtimes.includes(selectedTime))) {
            setSelectedTime(showtimes[0]);
        }
    }, [showtimes, selectedTime]);

    // Fetch occupied seats on theatre, date, or time change
    useEffect(() => {
        if (!selectedTheatre || !selectedDate || !selectedTime) return;
        let isMounted = true;
        (async () => {
            try {
                const seats = await api.getOccupiedSeats(selectedTheatre, selectedDate, selectedTime);
                if (isMounted) {
                    setOccupiedSeats(seats || []);
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

    if (!item) return null;

    // 6 rows x 10 cols seat matrix
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    const cols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    const toggleSeat = (seatId) => {
        if (occupiedSeats.includes(seatId)) return;
        setErrorMessage(null);
        if (selectedSeats.includes(seatId)) {
            setSelectedSeats(selectedSeats.filter((s) => s !== seatId));
        } else {
            setSelectedSeats([...selectedSeats, seatId]);
        }
    };

    const ticketPrice = item.priceRM || item.price || 250.0;
    const totalAmount = selectedSeats.length * ticketPrice;

    const handleProceedBooking = async () => {
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
                customerName: currentUser?.fullName || 'Movie Customer',
                customerEmail: currentUser?.email || 'customer@cineverse.com',
            });
            if (response.success && response.booking) {
                setConfirmedBooking(response.booking);
                setStep('confirmed');
            } else {
                throw new Error(response.error || 'Failed to complete booking');
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Reservation failed';
            setErrorMessage(msg);
            const seats = await api.getOccupiedSeats(selectedTheatre, selectedDate, selectedTime);
            setOccupiedSeats(seats);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
            <div className="relative w-full max-w-4xl bg-[#0f1118] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[95vh]">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
                    <div className="flex items-center gap-3">
                        <span className="p-2 rounded-lg bg-[#f5a623]/10 text-[#f5a623]">
                            <Ticket className="w-5 h-5" />
                        </span>
                        <div>
                            <h3 className="text-base sm:text-lg font-heading font-bold text-white">
                                {step === 'seats' ? `Book Tickets — ${item.title}` : 'Booking Confirmed!'}
                            </h3>
                            <p className="text-xs text-neutral-400">
                                {item.formats?.join(' • ') || 'IMAX 2D'} • {item.genre}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {step === 'seats' ? (
                    <div className="p-6 space-y-6 overflow-y-auto">
                        {errorMessage && (
                            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-red-400 text-xs">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{errorMessage}</span>
                            </div>
                        )}

                        {/* Selectors: Theatre, Date, Time */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <MapPin className="w-3.5 h-3.5 text-[#f5a623]" />
                                    Select Theatre
                                </label>
                                {theatres.length > 0 ? (
                                    <select
                                        value={selectedTheatre}
                                        onChange={(e) => setSelectedTheatre(e.target.value)}
                                        className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-[#f5a623]"
                                    >
                                        {theatres.map((t) => {
                                            const name = t.name || t;
                                            return (
                                                <option key={t.id || name} value={name} className="bg-[#11131c] text-white">
                                                    {name} {t.city ? `(${t.city})` : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                ) : (
                                    <div className="p-2.5 text-xs text-neutral-400 bg-white/5 border border-white/10 rounded-xl">
                                        No theatres available
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-[#f5a623]" />
                                    Select Date
                                </label>
                                <div className="grid grid-cols-4 gap-1.5">
                                    {dates.map((d) => {
                                        const isSelected = selectedDate === d.full;
                                        return (
                                            <button
                                                key={d.date}
                                                onClick={() => setSelectedDate(d.full)}
                                                className={`py-1.5 px-1 rounded-lg text-center border text-[11px] transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'border-[#f5a623] bg-[#f5a623]/20 text-white font-semibold'
                                                        : 'border-white/10 bg-white/5 text-neutral-400 hover:border-white/20'
                                                }`}
                                            >
                                                <div className="text-[9px] text-neutral-400">{d.label}</div>
                                                <div className="font-bold text-white">{d.date}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-[#f5a623]" />
                                    Select Showtime
                                </label>
                                <div className="grid grid-cols-2 gap-1.5">
                                    {showtimes.map((time) => {
                                        const isSelected = selectedTime === time;
                                        return (
                                            <button
                                                key={time}
                                                onClick={() => setSelectedTime(time)}
                                                className={`py-2 px-2 rounded-lg text-center border text-xs transition-all cursor-pointer ${
                                                    isSelected
                                                        ? 'border-[#f5a623] bg-[#f5a623] text-black font-semibold'
                                                        : 'border-white/10 bg-white/5 text-neutral-300 hover:border-white/20'
                                                }`}
                                            >
                                                {time}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Interactive Auditorium Screen & Seat Grid */}
                        <div className="pt-4 border-t border-white/10">
                            <div className="w-1/2 mx-auto mb-6 text-center">
                                <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#f5a623] to-transparent rounded-full shadow-[0_0_12px_#f5a623]" />
                                <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 mt-1 block">
                                    SCREEN
                                </span>
                            </div>

                            <div className="flex flex-col items-center gap-2 overflow-x-auto pb-2">
                                {rows.map((row) => (
                                    <div key={row} className="flex items-center gap-1.5">
                                        <span className="w-4 text-[11px] font-mono text-neutral-500 text-center font-bold">
                                            {row}
                                        </span>
                                        <div className="flex gap-1.5">
                                            {cols.map((col) => {
                                                const seatId = `${row}${col}`;
                                                const isOccupied = occupiedSeats.includes(seatId);
                                                const isSelected = selectedSeats.includes(seatId);
                                                return (
                                                    <button
                                                        key={seatId}
                                                        disabled={isOccupied}
                                                        onClick={() => toggleSeat(seatId)}
                                                        className={`w-7 h-7 rounded-md text-[11px] font-semibold flex items-center justify-center transition-all ${
                                                            isOccupied
                                                                ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed border border-white/5'
                                                                : isSelected
                                                                ? 'bg-[#f5a623] text-black font-bold shadow-[0_0_8px_#f5a623] cursor-pointer'
                                                                : 'bg-white/10 hover:bg-white/20 text-neutral-300 border border-white/10 cursor-pointer'
                                                        }`}
                                                    >
                                                        {col}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center justify-center gap-6 mt-4 text-xs text-neutral-400">
                                <div className="flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 rounded bg-white/10 border border-white/15" />
                                    <span>Available</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 rounded bg-[#f5a623]" />
                                    <span className="text-white font-medium">Selected</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3.5 h-3.5 rounded bg-neutral-800 border border-white/5" />
                                    <span>Reserved</span>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Confirmation Bar */}
                        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                                <div className="text-xs text-neutral-400">
                                    Selected Seats:{' '}
                                    <span className="text-white font-semibold">
                                        {selectedSeats.join(', ') || 'None'}
                                    </span>
                                </div>
                                <div className="text-lg font-heading font-black text-[#f5a623] mt-0.5">
                                    ₹ {totalAmount.toFixed(2)}
                                    <span className="text-xs text-neutral-400 font-normal ml-2">
                                        ({selectedSeats.length} x ₹ {ticketPrice.toFixed(2)})
                                    </span>
                                </div>
                            </div>

                            <button
                                disabled={selectedSeats.length === 0 || isSubmitting}
                                onClick={handleProceedBooking}
                                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#f5a623] hover:bg-[#e09612] text-black font-semibold text-sm transition-all duration-200 shadow-lg shadow-[#f5a623]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Booking with API...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Confirm &amp; Pay</span>
                                        <ChevronRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-6 sm:p-10 text-center space-y-6">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                            <Check className="w-8 h-8 stroke-[2.5]" />
                        </div>

                        <div>
                            <h4 className="text-2xl font-heading font-bold text-white">
                                Tickets Booked Successfully!
                            </h4>
                            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                                Booking Reference:{' '}
                                <span className="text-[#f5a623] font-mono font-bold">
                                    {confirmedBooking?.orderId || 'CINE-MY-CONFIRMED'}
                                </span>
                            </p>
                        </div>

                        <div className="max-w-md mx-auto p-5 rounded-2xl bg-[#141722] border border-white/10 text-left space-y-3">
                            <div className="flex justify-between items-start border-b border-white/10 pb-3">
                                <div>
                                    <h5 className="font-heading font-bold text-white text-base">
                                        {confirmedBooking?.title || item.title}
                                    </h5>
                                    <p className="text-xs text-neutral-400">
                                        {confirmedBooking?.theatreName || selectedTheatre}
                                    </p>
                                </div>
                                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30">
                                    {confirmedBooking?.status || 'CONFIRMED'}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs">
                                <div>
                                    <span className="text-neutral-500 block">Date</span>
                                    <span className="text-white font-medium">
                                        {confirmedBooking?.date || selectedDate}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-neutral-500 block">Time</span>
                                    <span className="text-white font-medium">
                                        {confirmedBooking?.time || selectedTime}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-neutral-500 block">Seats</span>
                                    <span className="text-[#f5a623] font-mono font-bold text-sm">
                                        {confirmedBooking?.seats?.join(', ') || selectedSeats.join(', ')}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-neutral-500 block">Total Paid</span>
                                    <span className="text-white font-medium">
                                        ₹ {(confirmedBooking?.totalAmount || totalAmount).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl bg-[#f5a623] text-black font-semibold text-sm hover:bg-[#e09612] cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
