import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Clock, Film, MapPin, Sparkles, AlertCircle, ChevronLeft } from 'lucide-react';

const inr = (paise) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format((paise || 0) / 100);
const seatName = (seat) => `${seat.rowLabel}${seat.seatNumber}`;

export const MovieBookingPage = () => {
  const { movieId } = useParams();
  const { token, openAuthModal, user } = useAuth();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [shows, setShows] = useState([]);
  const [allAvailableShows, setAllAvailableShows] = useState([]);
  const [showId, setShowId] = useState('');
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ticket, setTicket] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError('');
    
    // Fetch shows for the selected movie
    const fetchShows = api.getAvailableShows(movieId)
      .then((data) => {
        setShows(data || []);
        if (data && data.length > 0) {
          setShowId(data[0].id);
          if (data[0].movie) setMovie(data[0].movie);
        }
        return data;
      })
      .catch((e) => {
        setError(e.message);
        return [];
      });

    // Also fetch movie information directly to show header even if 0 shows
    const fetchMovie = api.getMovies()
      .then((allMovies) => {
        const found = allMovies.find((m) => m.id === movieId);
        if (found) {
          setMovie((prev) => prev || found);
        }
        return found;
      })
      .catch(() => null);

    // Also fetch all available shows across system in case current movie has none
    const fetchAllShows = api.getAvailableShows()
      .then((all) => {
        setAllAvailableShows(all || []);
      })
      .catch(() => {});

    Promise.all([fetchShows, fetchMovie, fetchAllShows]).finally(() => {
      setLoading(false);
    });
  }, [movieId]);

  useEffect(() => {
    if (window.Razorpay) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onerror = () => setError('Razorpay Checkout could not load. Check your connection and try again.');
    document.body.appendChild(script);
    return () => script.remove();
  }, []);

  const loadSeats = useCallback(async () => {
    if (!showId) return;
    setSelected([]);
    try { 
      setSeats(await api.getShowSeats(showId)); 
    } catch (e) { 
      setError(e.message); 
    }
  }, [showId]);

  useEffect(() => { 
    loadSeats(); 
  }, [loadSeats]);

  const currentShow = shows.find((show) => show.id === showId);
  const total = useMemo(() => selected.reduce((sum, id) => {
    const seat = seats.find((entry) => entry.seatId === id)?.seat;
    const prices = currentShow?.baseTierPricing || {};
    return sum + Number(prices[seat?.tier] || prices.NORMAL || 250) * 100;
  }, 0), [selected, seats, currentShow]);

  const toggleSeat = (entry) => {
    if (entry.status !== 'AVAILABLE' || (entry.lockedByUserId && entry.lockedByUserId !== user?.id && new Date(entry.lockExpiresAt) > new Date())) return;
    setSelected((prev) => prev.includes(entry.seatId) ? prev.filter((id) => id !== entry.seatId) : prev.length < 10 ? [...prev, entry.seatId] : prev);
    setError('');
  };

  const beginPayment = async () => {
    if (!token) { openAuthModal('login'); return; }
    if (!selected.length) { setError('Select at least one seat.'); return; }
    setBusy(true); setError('');
    let booking;
    try {
      if (!window.Razorpay) throw new Error('Razorpay Checkout is still loading. Please try again.');
      await api.lockShowSeats(showId, selected);
      const result = await api.initiateBooking(showId, selected);
      booking = result.data;
      await new Promise((resolve, reject) => {
        const finish = async (response) => {
          try {
            const verified = await api.verifyBookingPayment(booking.id, response);
            setTicket({ ...verified.data, show: currentShow, seatNames: seats.filter((s) => selected.includes(s.seatId)).map((s) => seatName(s.seat)) });
            resolve();
          } catch (err) { reject(err); }
        };
        const checkout = new window.Razorpay({
          key: booking.razorpay.keyId,
          amount: booking.razorpay.amount,
          currency: booking.razorpay.currency,
          name: 'CineVerse',
          description: `${currentShow?.movie?.title || 'Movie Ticket'} · ${selected.length} seat(s)`,
          order_id: booking.razorpay.orderId,
          prefill: { name: user?.fullName, email: user?.email },
          theme: { color: '#ffb536' },
          handler: finish,
          modal: { ondismiss: () => { api.abandonBooking(booking.id).catch(() => {}); reject(new Error('Payment window closed. Seat hold released.')); } }
        });
        checkout.on('payment.failed', (event) => { api.abandonBooking(booking.id).catch(() => {}); reject(new Error(event.error?.description || 'Payment failed. Please try again.')); });
        checkout.open();
      });
    } catch (e) { setError(e.message); }
    finally { setBusy(false); loadSeats(); }
  };

  if (ticket) {
    return (
      <main className="min-h-screen bg-[#060608] text-white px-5 py-24">
        <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-3xl mx-auto">
            ✓
          </div>
          <h1 className="mt-4 text-3xl font-black">Booking Confirmed!</h1>
          <p className="mt-2 text-neutral-400">Payment received. Present this QR ticket at the cinema entry gate.</p>
          <div className="mx-auto my-7 inline-block rounded-2xl bg-white p-4 shadow-xl">
            <QRCodeSVG value={ticket.qrText} size={220} level="H" includeMargin />
          </div>
          <p className="font-mono text-xl font-bold text-yellow-400">{ticket.bookingReference}</p>
          <p className="mt-2 text-sm text-neutral-300 font-semibold">{ticket.show?.movie?.title} · {ticket.seatNames?.join(', ')}</p>
          <p className="mt-1 text-sm text-neutral-400">{new Date(ticket.show?.startTime).toLocaleString()}</p>
          <button onClick={() => navigate('/')} className="mt-7 rounded-xl bg-yellow-500 hover:bg-yellow-400 px-7 py-3 font-bold text-black transition shadow-lg shadow-yellow-500/20">
            Back to movies
          </button>
        </section>
      </main>
    );
  }

  // Find unique other movies that have upcoming sessions
  const otherMoviesWithShows = Array.from(
    new Map(
      allAvailableShows
        .filter((s) => s.movieId !== movieId)
        .map((s) => [s.movieId, { ...s.movie, theatreName: s.theatre?.name, nextShowTime: s.startTime }])
    ).values()
  );

  return (
    <main className="min-h-screen bg-[#060608] px-5 pb-20 pt-28 text-white font-sans">
      <section className="mx-auto max-w-6xl">
        <button onClick={() => navigate('/')} className="mb-6 text-sm text-neutral-400 hover:text-white flex items-center gap-1 transition">
          <ChevronLeft size={16} /> Back to movies
        </button>

        {/* Movie Info Header */}
        {movie && (
          <div className="mb-8 p-6 rounded-3xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {movie.posterUrl && (
              <img 
                src={movie.posterUrl} 
                alt={movie.title} 
                className="w-20 h-28 object-cover rounded-xl shadow-lg border border-white/10 shrink-0" 
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white">{movie.title}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-neutral-300">
                  {movie.censorCertificate || 'U/A'}
                </span>
              </div>
              <p className="mt-1.5 text-sm text-neutral-400">
                {movie.genres?.join(', ') || 'Feature Film'}
                {movie.durationMinutes ? ` • ${movie.durationMinutes} mins` : ''}
                {movie.originalLanguage ? ` • ${movie.originalLanguage}` : ''}
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                Select a screening session below to view auditorium seating and reserve your seats.
              </p>
            </div>
          </div>
        )}

        {!movie && (
          <div className="mb-6">
            <h1 className="text-3xl font-black">Choose a show and seats</h1>
            <p className="mt-2 text-neutral-400">Select a screening, then pick up to 10 available seats.</p>
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-neutral-400">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500 mx-auto mb-3"></div>
            <p className="text-sm">Finding scheduled screenings...</p>
          </div>
        ) : shows.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-8 text-neutral-300">
            <div className="flex items-center gap-3 text-amber-400 mb-2">
              <AlertCircle size={20} />
              <h3 className="font-bold text-lg text-white">No upcoming screenings available for this movie</h3>
            </div>
            <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
              Screenings for {movie?.title ? <strong className="text-white">{movie.title}</strong> : 'this title'} haven't been scheduled yet, or recent screening sessions have already concluded.
            </p>

            {otherMoviesWithShows.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-4 flex items-center gap-2">
                  <Sparkles size={14} /> Movies currently showing in cinemas with live tickets:
                </h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {otherMoviesWithShows.map((otherMovie) => (
                    <button
                      key={otherMovie.id}
                      onClick={() => navigate(`/book/${otherMovie.id}`)}
                      className="p-3.5 rounded-xl border border-white/10 bg-white/[0.03] hover:border-yellow-500/50 hover:bg-yellow-500/10 text-left transition flex items-center gap-3 group"
                    >
                      {otherMovie.posterUrl && (
                        <img 
                          src={otherMovie.posterUrl} 
                          alt={otherMovie.title} 
                          className="w-12 h-16 object-cover rounded-lg shrink-0 group-hover:scale-105 transition" 
                        />
                      )}
                      <div className="overflow-hidden">
                        <div className="text-sm font-bold text-white group-hover:text-yellow-400 transition truncate">
                          {otherMovie.title}
                        </div>
                        <div className="text-xs text-neutral-400 mt-1 flex items-center gap-1 truncate">
                          <MapPin size={11} className="text-yellow-400 shrink-0" />
                          <span>{otherMovie.theatreName || 'Cinema Branch'}</span>
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {new Date(otherMovie.nextShowTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(otherMovie.nextShowTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Show Session Selector */}
            <div className="mt-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
                <Clock size={15} className="text-yellow-400" /> Available Screening Sessions
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {shows.map((show) => {
                  const isSelected = showId === show.id;
                  const startTime = new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateStr = new Date(show.startTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

                  return (
                    <button
                      key={show.id}
                      onClick={() => setShowId(show.id)}
                      className={`rounded-2xl border p-4 text-left transition relative ${
                        isSelected 
                          ? 'border-yellow-500 bg-yellow-500/10 shadow-lg shadow-yellow-500/10' 
                          : 'border-white/10 bg-white/[0.03] hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-base">{show.theatre?.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-neutral-300">
                          {show.visualFormat}
                        </span>
                      </div>

                      <div className="mt-2 text-sm text-yellow-400 font-semibold flex items-center gap-1.5">
                        <Clock size={13} />
                        <span>{startTime}</span>
                        <span className="text-xs text-neutral-400 font-normal">({dateStr})</span>
                      </div>

                      <div className="mt-2 text-xs text-neutral-400 flex items-center justify-between">
                        <span>{show.screen?.name || `Screen ${show.screen?.screenNumber}`} • {show.languageVersion}</span>
                        <span className="text-neutral-500">{show.theatre?.city}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Auditorium Matrix & Seat Picker */}
            {currentShow && (
              <div className="mt-9 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">
                <div className="mb-2 text-center text-xs font-bold uppercase tracking-widest text-neutral-400">
                  {currentShow.screen?.name || 'AUDITORIUM'} — SCREEN THIS WAY
                </div>
                <div className="mx-auto mb-8 h-1.5 max-w-2xl rounded-full bg-gradient-to-r from-transparent via-yellow-400 to-transparent shadow-[0_0_20px_rgba(255,181,54,.5)]" />

                <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-2 max-h-[420px] overflow-y-auto p-2">
                  {seats.map((entry) => {
                    const held = entry.lockedByUserId && entry.lockedByUserId !== user?.id && new Date(entry.lockExpiresAt) > new Date();
                    const unavailable = entry.status !== 'AVAILABLE' || held;
                    const active = selected.includes(entry.seatId);
                    return (
                      <button
                        key={entry.seatId}
                        disabled={unavailable}
                        onClick={() => toggleSeat(entry)}
                        title={`${seatName(entry.seat)} · ${entry.seat.tier}`}
                        className={`h-9 min-w-9 rounded-t-lg px-2 text-xs font-bold transition ${
                          active
                            ? 'bg-yellow-400 text-black shadow-[0_0_12px_rgba(255,181,54,0.6)] scale-105'
                            : unavailable
                            ? 'cursor-not-allowed bg-neutral-800 text-neutral-600'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-700 hover:text-white'
                        }`}
                      >
                        {seatName(entry.seat)}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-400 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-emerald-950 border border-emerald-800/40"></span>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-yellow-400"></span>
                    <span className="text-white font-bold">Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded bg-neutral-800"></span>
                    <span>Occupied / Held</span>
                  </div>
                </div>

                <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-5 sm:flex-row">
                  <div>
                    <span className="text-lg font-black text-white">{selected.length}</span> seats selected ·{' '}
                    <span className="text-xl font-black text-yellow-400">{inr(total)}</span>
                    {selected.length > 0 && (
                      <div className="text-xs text-neutral-400 mt-1">
                        Seats: {seats.filter((s) => selected.includes(s.seatId)).map((s) => seatName(s.seat)).join(', ')}
                      </div>
                    )}
                  </div>
                  <button
                    disabled={busy || !selected.length}
                    onClick={beginPayment}
                    className="rounded-xl bg-yellow-500 hover:bg-yellow-400 px-7 py-3 font-black text-black disabled:cursor-not-allowed disabled:opacity-50 transition shadow-lg shadow-yellow-500/20"
                  >
                    {busy ? 'Opening secure payment…' : 'Continue to Razorpay'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <div role="alert" className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200 text-sm">
            {error}
          </div>
        )}

        <p className="mt-6 text-xs text-neutral-500 text-center">
          Seat holds last five minutes. Payment is confirmed by CineVerse after Razorpay verifies the signed transaction.
        </p>
      </section>
    </main>
  );
};
