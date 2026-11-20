import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';
import { useLocationContext } from '../contexts/LocationContext';
import { useAuth } from '../contexts/AuthContext';
import { buildSeatLayout, resolveSeatClasses } from '../components/theatre3d/lib/seatLayout';

const HOLD_SECONDS = 300;
const LOCK_SHOW_ID = 'show-live';
const FALLBACK_TIMES = ['11:30 AM', '02:45 PM', '06:30 PM', '09:45 PM'];

function buildDates() {
    return [0, 1, 2, 3].map((offset) => {
        const d = new Date();
        d.setDate(d.getDate() + offset);
        const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return { label, date: dateStr, full: `${label}, ${dateStr}` };
    });
}

const formatShowTime = (iso) => new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

/**
 * Shared seat-booking state for /book/:movieId (classic 2D page and 3D theatre).
 * Owns: movie, theatres, date/time, seat layout, occupied seats (api.getOccupiedSeats),
 * selection + seat locks (api.lockSeats / releaseSeats), the 5 minute hold and
 * the reservation call (api.createBooking).
 */
export function useBookingFlow(movieId) {
    const { selectedCity, openLocationModal } = useLocationContext();
    const { user, openAuthModal } = useAuth();

    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [theatres, setTheatres] = useState([]);
    const [selectedTheatre, setSelectedTheatre] = useState('');
    const dates = useMemo(() => buildDates(), []);
    const [selectedDate, setSelectedDate] = useState(() => dates[0].full);
    const [selectedTime, setSelectedTime] = useState('');
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [occupiedSeats, setOccupiedSeats] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const [holdSecondsLeft, setHoldSecondsLeft] = useState(HOLD_SECONDS);

    // Theatres (city first, then all)
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                let list = await api.getTheatres(selectedCity ? selectedCity.name : null);
                if (!list || list.length === 0) list = await api.getTheatres();
                if (!cancelled && list && list.length > 0) {
                    setTheatres(list);
                    setSelectedTheatre(list[0].name || list[0].id);
                }
            } catch (err) {
                console.warn('Failed to load theatres:', err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [selectedCity]);

    // Movie, falling back to events
    useEffect(() => {
        if (!movieId) return undefined;
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const movie = await api.getMovieById(movieId);
                if (movie) {
                    if (!cancelled) setItem(movie);
                    return;
                }
                const event = await api.getEventById(movieId);
                if (event && !cancelled) setItem(event);
            } catch (err) {
                console.warn('Failed to load item from DB:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [movieId]);

    const theatreObj = useMemo(
        () => theatres.find((t) => t.name === selectedTheatre || t.id === selectedTheatre) || null,
        [theatres, selectedTheatre],
    );

    const movieShows = useMemo(() => {
        const shows = (theatreObj?.screens || []).flatMap((s) => (s.shows || []).map((sh) => ({ ...sh, screen: s })));
        return shows.filter((sh) => !sh.isCancelled && (sh.movieId === movieId || !movieId));
    }, [theatreObj, movieId]);

    const availableShowtimes = useMemo(() => {
        if (movieShows.length > 0) return Array.from(new Set(movieShows.map((sh) => formatShowTime(sh.startTime))));
        return FALLBACK_TIMES;
    }, [movieShows]);

    useEffect(() => {
        if (availableShowtimes.length > 0 && (!selectedTime || !availableShowtimes.includes(selectedTime))) {
            setSelectedTime(availableShowtimes[0]);
        }
    }, [availableShowtimes, selectedTime]);

    // The show (if the API has one) drives screen size, format, language and pricing.
    const activeShow = useMemo(
        () => movieShows.find((sh) => formatShowTime(sh.startTime) === selectedTime) || null,
        [movieShows, selectedTime],
    );
    const activeScreen = activeShow?.screen || theatreObj?.screens?.[0] || null;

    const layout = useMemo(() => buildSeatLayout({ capacity: activeScreen?.totalCapacity }), [activeScreen?.totalCapacity]);
    const seatClasses = useMemo(() => resolveSeatClasses(activeShow?.baseTierPricing), [activeShow]);
    const seatById = useMemo(() => new Map(layout.seats.map((s) => [s.id, s])), [layout]);
    const classById = useMemo(() => new Map(seatClasses.map((c) => [c.id, c])), [seatClasses]);

    const priceForSeat = useCallback(
        (seatId) => {
            const seat = seatById.get(seatId);
            const cls = classById.get(seat?.classId || 'classic');
            return cls ? cls.price : 0;
        },
        [seatById, classById],
    );

    // Occupied seats for the chosen show
    const refreshOccupied = useCallback(async () => {
        if (!selectedTheatre || !selectedDate || !selectedTime) return [];
        const seats = (await api.getOccupiedSeats(selectedTheatre, selectedDate, selectedTime, movieId)) || [];
        setOccupiedSeats(seats);
        return seats;
    }, [selectedTheatre, selectedDate, selectedTime, movieId]);

    useEffect(() => {
        if (!selectedTheatre || !selectedDate || !selectedTime) return undefined;
        let mounted = true;
        (async () => {
            try {
                const seats = (await api.getOccupiedSeats(selectedTheatre, selectedDate, selectedTime, movieId)) || [];
                if (mounted) {
                    setOccupiedSeats(seats);
                    setSelectedSeats((prev) => prev.filter((s) => !seats.includes(s)));
                }
            } catch (err) {
                console.warn('Failed to load occupied seats:', err);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [selectedTheatre, selectedDate, selectedTime, movieId]);

    // 5 minute hold countdown while seats are selected
    useEffect(() => {
        if (selectedSeats.length === 0) {
            setHoldSecondsLeft(HOLD_SECONDS);
            return undefined;
        }
        const timer = setInterval(() => {
            setHoldSecondsLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    api.releaseSeats(LOCK_SHOW_ID, selectedSeats);
                    setSelectedSeats([]);
                    setErrorMessage('Your 5-minute seat hold expired. Please re-select your seats.');
                    return HOLD_SECONDS;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [selectedSeats]);

    /** Replaces the selection and syncs seat locks with the backend. */
    const applySelection = useCallback(
        async (next) => {
            const previous = selectedSeats;
            setErrorMessage(null);
            setSelectedSeats(next);
            try {
                if (next.length > 0) {
                    setHoldSecondsLeft(HOLD_SECONDS);
                    await api.lockSeats(LOCK_SHOW_ID, next);
                } else if (previous.length > 0) {
                    await api.releaseSeats(LOCK_SHOW_ID, previous);
                }
            } catch (err) {
                // Locks are best effort (they need a signed-in user); the booking call is authoritative.
                console.warn('Seat lock sync failed:', err instanceof Error ? err.message : err);
            }
        },
        [selectedSeats],
    );

    const occupiedSet = useMemo(() => new Set(occupiedSeats), [occupiedSeats]);

    /** Toggles a seat. Couple recliners toggle together with their partner. */
    const toggleSeat = useCallback(
        (seatId) => {
            if (occupiedSet.has(seatId)) return;
            const seat = seatById.get(seatId);
            const group = seat?.pairId
                ? layout.seats.filter((s) => s.pairId === seat.pairId && !occupiedSet.has(s.id)).map((s) => s.id)
                : [seatId];
            const isSelected = selectedSeats.includes(seatId);
            const next = isSelected
                ? selectedSeats.filter((s) => !group.includes(s))
                : [...selectedSeats, ...group.filter((s) => !selectedSeats.includes(s))];
            applySelection(next);
        },
        [occupiedSet, seatById, layout, selectedSeats, applySelection],
    );

    const subtotal = useMemo(() => selectedSeats.reduce((sum, id) => sum + priceForSeat(id), 0), [selectedSeats, priceForSeat]);

    /**
     * Reserves the selected seats via api.createBooking.
     * Returns the booking record, or null when the user still has to sign in.
     */
    const reserveSeats = useCallback(
        async ({ totalAmount, rememberPending = false }) => {
            if (selectedSeats.length === 0 || !item) return null;
            if (!user) {
                if (rememberPending) {
                    sessionStorage.setItem('tt_pending_booking', JSON.stringify({
                        movieId, theatre: selectedTheatre, date: selectedDate, time: selectedTime, seats: selectedSeats,
                    }));
                }
                setErrorMessage('Please sign in or create an account to reserve your tickets. Your seat selection is preserved.');
                openAuthModal('login');
                return null;
            }
            setIsSubmitting(true);
            setErrorMessage(null);
            try {
                const response = await api.createBooking({
                    mediaId: item.id,
                    theatreName: selectedTheatre,
                    date: selectedDate,
                    time: selectedTime,
                    seats: selectedSeats,
                    totalAmount,
                    customerName: user.fullName || user.email || 'Ticket Total Customer',
                    customerEmail: user.email || 'customer@tickettotal.com',
                });
                if (!response.success || !response.booking) throw new Error(response.error || 'Failed to confirm booking');
                sessionStorage.removeItem('tt_pending_booking');
                setOccupiedSeats((prev) => Array.from(new Set([...prev, ...selectedSeats])));
                setSelectedSeats([]);
                const b = response.booking;
                return {
                    orderId: b.orderId,
                    mediaId: b.mediaId,
                    theatreName: b.theatreName,
                    date: b.date,
                    time: b.time,
                    seats: b.seats,
                    totalAmount: b.totalAmount,
                    title: b.title || item.title,
                    posterImage: b.posterImage || item.posterImage,
                };
            } catch (err) {
                setErrorMessage(err instanceof Error ? err.message : 'An error occurred during booking');
                try {
                    await refreshOccupied();
                } catch {
                    /* keep current occupied list */
                }
                throw err;
            } finally {
                setIsSubmitting(false);
            }
        },
        [selectedSeats, item, user, movieId, selectedTheatre, selectedDate, selectedTime, openAuthModal, refreshOccupied],
    );

    return {
        movieId,
        user,
        openAuthModal,
        selectedCity,
        openLocationModal,
        item,
        loading,
        theatres,
        selectedTheatre,
        setSelectedTheatre,
        dates,
        selectedDate,
        setSelectedDate,
        availableShowtimes,
        selectedTime,
        setSelectedTime,
        activeShow,
        activeScreen,
        layout,
        seatClasses,
        seatById,
        classById,
        priceForSeat,
        occupiedSeats,
        occupiedSet,
        selectedSeats,
        toggleSeat,
        applySelection,
        subtotal,
        holdSecondsLeft,
        errorMessage,
        setErrorMessage,
        isSubmitting,
        reserveSeats,
    };
}

export function formatHoldTimer(totalSeconds) {
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}
