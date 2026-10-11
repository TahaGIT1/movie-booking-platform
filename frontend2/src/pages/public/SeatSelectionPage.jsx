import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft,
  Clock,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  Footprints,
  Accessibility,
  Armchair,
  Sparkles,
  Layers,
  Info,
  RotateCcw
} from 'lucide-react';

const TIER_COLORS = {
  NORMAL: {
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300',
    hover: 'hover:border-cyan-400',
    name: 'Standard'
  },
  PREMIUM: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300',
    hover: 'hover:border-amber-400',
    name: 'Premium'
  },
  RECLINER: {
    border: 'border-purple-500/50',
    bg: 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-300',
    hover: 'hover:border-purple-400',
    name: 'VIP Recliner'
  }
};

export const SeatSelectionPage = () => {
  const { showId } = useParams();
  const navigate = useNavigate();
  const { user, token, openAuthModal } = useAuth();

  const [show, setShow] = useState(null);
  const [seatStatuses, setSeatStatuses] = useState([]);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lockExpiresAt, setLockExpiresAt] = useState(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(null);
  const [initiating, setInitiating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Cross-show / cross-theatre active hold status
  const [existingOtherHold, setExistingOtherHold] = useState(null);
  const [releasingOtherHold, setReleasingOtherHold] = useState(false);

  const timerRef = useRef(null);
  const pollRef = useRef(null);
  const selectedSeatIdsRef = useRef([]);
  const lockRequestIdRef = useRef(0);

  // Sync ref with state
  useEffect(() => {
    selectedSeatIdsRef.current = selectedSeatIds;
  }, [selectedSeatIds]);

  useEffect(() => {
    fetchShowAndSeats();
    checkActiveHold();

    // Auto-refresh seat status every 6 seconds to capture other users' holds in real time
    pollRef.current = setInterval(() => {
      refreshSeatStatuses();
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [showId]);

  const checkActiveHold = async () => {
    if (!token) return;
    try {
      const activeHold = await api.getMyActiveHold();
      if (activeHold?.hasActiveHold) {
        if (activeHold.showId !== showId) {
          setExistingOtherHold({
            otherShowId: activeHold.showId,
            otherMovie: activeHold.movieTitle || 'Another Movie',
            otherTheatre: activeHold.theatreName || 'Another Cinema',
            seatLabels: activeHold.seatLabels || [],
            lockExpiresAt: activeHold.lockExpiresAt
          });
        } else {
          // User already holds seats on THIS show, restore selection & timer
          setExistingOtherHold(null);
          if (Array.isArray(activeHold.seatIds) && activeHold.seatIds.length > 0) {
            setSelectedSeatIds(activeHold.seatIds);
            if (activeHold.lockExpiresAt) {
              setLockExpiresAt(activeHold.lockExpiresAt);
            }
          }
        }
      } else {
        setExistingOtherHold(null);
      }
    } catch (e) {
      console.warn('Failed to check active hold:', e);
    }
  };

  const fetchShowAndSeats = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const [showData, seatsData] = await Promise.all([
        api.getShowById(showId),
        api.getShowSeats(showId)
      ]);
      setShow(showData);
      setSeatStatuses(Array.isArray(seatsData) ? seatsData : []);
    } catch (err) {
      console.error('Error fetching seat map:', err);
      setErrorMessage(err.message || 'Failed to load auditorium layout');
    } finally {
      setLoading(false);
    }
  };

  const refreshSeatStatuses = async () => {
    try {
      const seatsData = await api.getShowSeats(showId);
      if (Array.isArray(seatsData)) {
        setSeatStatuses(seatsData);
      }
    } catch (e) {
      // background polling silent error
    }
  };

  // 5-minute Hold Countdown Timer
  useEffect(() => {
    if (!lockExpiresAt) {
      setTimeLeftSeconds(null);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const expiry = new Date(lockExpiresAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeftSeconds(diff);

      if (diff <= 0) {
        clearInterval(timerRef.current);
        setSelectedSeatIds([]);
        setLockExpiresAt(null);
        setErrorMessage('Your 5-minute seat hold has expired. Please re-select your seats.');
        fetchShowAndSeats();
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => clearInterval(timerRef.current);
  }, [lockExpiresAt]);

  // Pricing helper
  const pricing = useMemo(() => {
    const raw = show?.baseTierPricing || {};
    const prices = {
      NORMAL: Number(raw.NORMAL || raw.standard || 220),
      PREMIUM: Number(raw.PREMIUM || 350),
      RECLINER: Number(raw.RECLINER || 480)
    };
    if (typeof raw === 'object' && raw !== null) {
      Object.keys(raw).forEach((k) => {
        if (!isNaN(Number(raw[k]))) {
          prices[k] = Number(raw[k]);
        }
      });
    }
    return prices;
  }, [show]);

  // Fast status lookup by seatId
  const statusBySeatId = useMemo(() => {
    const map = new Map();
    seatStatuses.forEach((st) => {
      map.set(st.seatId || st.seat?.id, st);
    });
    return map;
  }, [seatStatuses]);

  // Reconstruct exact 2D seat matrix created by the manager for this screen (including full pathway rows like G & L)
  const seatGrid = useMemo(() => {
    const rawSeats = show?.screen?.seats || seatStatuses.map((s) => s.seat).filter(Boolean) || [];
    if (rawSeats.length === 0) return { rows: [], maxCols: 0, maxRows: 0 };

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let maxCols = 12;
    let maxRows = 8;

    rawSeats.forEach((s) => {
      if (s.gridX && s.gridX > maxCols) maxCols = s.gridX;
      if (s.gridY !== undefined && (s.gridY + 1) > maxRows) maxRows = s.gridY + 1;
      const letterIdx = letters.indexOf(s.rowLabel);
      if (letterIdx >= 0 && (letterIdx + 1) > maxRows) maxRows = letterIdx + 1;
    });

    if (show?.screen?.rows && show.screen.rows > maxRows) maxRows = show.screen.rows;
    if (show?.screen?.cols && show.screen.cols > maxCols) maxCols = show.screen.cols;

    // Fast coordinate lookup map: (gridY, gridX) -> seat and (rowLabel, gridX) -> seat
    const seatCoordMap = new Map();
    rawSeats.forEach((s) => {
      const r = s.gridY !== undefined ? s.gridY : letters.indexOf(s.rowLabel);
      const c = s.gridX || s.seatNumber;
      if (r >= 0 && c) {
        seatCoordMap.set(`${r}-${c}`, s);
        seatCoordMap.set(`${s.rowLabel}-${c}`, s);
      }
    });

    // Generate ALL rows from 0 to maxRows - 1 so horizontal pathway rows (like Row G and Row L) are preserved!
    const rows = [];
    for (let r = 0; r < maxRows; r++) {
      const rowLabel = letters[r] || `R${r + 1}`;
      const cells = [];
      let hasAnySeatInRow = false;

      for (let c = 1; c <= maxCols; c++) {
        const seat = seatCoordMap.get(`${r}-${c}`) || seatCoordMap.get(`${rowLabel}-${c}`);
        if (seat) {
          hasAnySeatInRow = true;
          cells.push({
            key: `${rowLabel}-${c}-${seat.id}`,
            id: seat.id,
            seatId: seat.id,
            seat,
            col: c,
            gridX: c,
            gridY: r,
            rowLabel,
            seatNumber: seat.seatNumber,
            tier: seat.tier || 'NORMAL',
            isAccessible: !!seat.isAccessible,
            isBroken: !!seat.isBroken,
            isPathway: false
          });
        } else {
          // Walking Pathway / Aisle
          cells.push({
            key: `${rowLabel}-${c}-pathway`,
            id: `pathway-${rowLabel}-${c}`,
            col: c,
            gridX: c,
            gridY: r,
            rowLabel,
            seatNumber: 0,
            isPathway: true
          });
        }
      }

      rows.push({
        rowLabel,
        gridY: r,
        isFullPathwayRow: !hasAnySeatInRow,
        cells
      });
    }

    return {
      rows,
      maxCols,
      maxRows
    };
  }, [show, seatStatuses]);

  // Calculate Subtotal
  const subtotal = useMemo(() => {
    let total = 0;
    selectedSeatIds.forEach((id) => {
      const st = statusBySeatId.get(id);
      const seat = st?.seat || show?.screen?.seats?.find((s) => s.id === id);
      if (seat) {
        const tier = seat.tier || 'NORMAL';
        total += pricing[tier] || pricing.NORMAL;
      }
    });
    return total;
  }, [selectedSeatIds, statusBySeatId, show, pricing]);

  // Release any active hold on another show/theatre and allow selecting here
  const handleReleaseOtherHoldsAndSelectCurrent = async (retrySeatId = null) => {
    setReleasingOtherHold(true);
    setErrorMessage('');
    try {
      await api.releaseAllHolds();
      setExistingOtherHold(null);
      
      // If a seat was clicked, immediately lock it
      if (retrySeatId) {
        setSelectedSeatIds([retrySeatId]);
        syncLockWithBackend([retrySeatId]);
      } else {
        await fetchShowAndSeats();
      }
    } catch (err) {
      console.error('Failed to release previous hold:', err);
      setErrorMessage(err.message || 'Failed to release existing holds. Please try again.');
    } finally {
      setReleasingOtherHold(false);
    }
  };

  // Background lock synchronization without blocking or delaying the UI
  const syncLockWithBackend = async (seatIdsToLock) => {
    const currentReqId = ++lockRequestIdRef.current;
    if (seatIdsToLock.length === 0) return;

    try {
      const res = await api.lockSeats(showId, seatIdsToLock);
      // Only apply if this request is still the most recent
      if (currentReqId === lockRequestIdRef.current) {
        if (res.lockExpiresAt) {
          setLockExpiresAt(res.lockExpiresAt);
        }
      }
    } catch (err) {
      if (currentReqId === lockRequestIdRef.current) {
        console.error('Seat hold error:', err);
        // Rollback optimistic selection on failure
        setSelectedSeatIds([]);
        setLockExpiresAt(null);

        if (err.code === 'ACTIVE_HOLD_ON_ANOTHER_SHOW') {
          setExistingOtherHold(
            err.details || {
              otherMovie: 'Another Show',
              otherTheatre: 'Another Cinema'
            }
          );
          setErrorMessage(err.message);
        } else {
          setErrorMessage(
            err.message || 'Seat unavailable or held by another customer. Please choose another.'
          );
          refreshSeatStatuses();
        }
      }
    }
  };

  // Instant 0ms Optimistic Seat Selection & Deselection (highlights in yellow instantly!)
  const handleToggleSeat = (cell) => {
    if (!token) {
      openAuthModal('login');
      return;
    }

    const seatId = cell.seatId;
    const isAlreadySelected = selectedSeatIds.includes(seatId);

    setErrorMessage('');

    // If user has an active hold on ANOTHER show/theatre, prevent selecting and prompt
    if (existingOtherHold) {
      setErrorMessage(
        `You currently have seats on hold for "${existingOtherHold.otherMovie}" at ${existingOtherHold.otherTheatre}. Please release that hold first.`
      );
      return;
    }

    if (isAlreadySelected) {
      // 1. OPTIMISTIC INSTANT DESELECTION (0ms delay)
      const newSelected = selectedSeatIds.filter((id) => id !== seatId);
      setSelectedSeatIds(newSelected);
      if (newSelected.length === 0) {
        setLockExpiresAt(null);
      }

      // 2. Background release
      api.releaseSeats(showId, [seatId]).catch((err) => {
        console.error('Failed to release seat:', err);
      });
    } else {
      // Maximum 6 seats restriction
      if (selectedSeatIds.length >= 6) {
        setErrorMessage('You can select a maximum of 6 seats at a single time.');
        return;
      }

      // 1. OPTIMISTIC INSTANT SELECTION (0ms delay - highlights in yellow immediately!)
      const newSelected = [...selectedSeatIds, seatId];
      setSelectedSeatIds(newSelected);

      // 2. Asynchronous background lock
      syncLockWithBackend(newSelected);
    }
  };

  const handleProceedToCheckout = async () => {
    if (selectedSeatIds.length === 0) return;
    if (!token) {
      openAuthModal('login');
      return;
    }

    setInitiating(true);
    setErrorMessage('');
    try {
      const bookingData = await api.initiateBooking(showId, selectedSeatIds);
      if (bookingData && bookingData.id) {
        navigate(`/checkout/${bookingData.id}`);
      } else {
        throw new Error('Failed to create booking reference');
      }
    } catch (err) {
      console.error('Checkout initiation failed:', err);
      setErrorMessage(err.message || 'Seat hold expired or unavailable. Please retry.');
      fetchShowAndSeats();
    } finally {
      setInitiating(false);
    }
  };

  const formatTimer = (secs) => {
    if (secs === null) return '0:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-[#060608] text-white pb-36 font-sans">
      {/* 1. TOP HEADER STRIP */}
      <div className="sticky top-0 z-30 bg-[#0d0e14]/90 backdrop-blur-xl border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to={show?.movieId ? `/movie/${show.movieId}/shows` : '/'}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition"
              title="Back to Showtimes"
            >
              <ArrowLeft size={18} />
            </Link>

            {show && (
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-heading font-black text-white tracking-tight line-clamp-1">
                    {show.movie?.title}
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30">
                    {show.visualFormat || '2D'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/10 text-neutral-300 border border-white/10">
                    Audi {show.screen?.screenNumber}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {show.theatre?.name} • {show.screen?.name} •{' '}
                  {new Date(show.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}{' '}
                  • {show.languageVersion || 'Original'}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Seat count badge */}
            <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-neutral-300">
              Selected: <strong className="text-yellow-400">{selectedSeatIds.length}</strong> / 6 seats max
            </div>

            {/* Hold Countdown Badge */}
            {timeLeftSeconds !== null && (
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl border text-xs font-extrabold shadow-lg ${
                  timeLeftSeconds < 60
                    ? 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse'
                    : 'bg-[#f5a623]/20 text-[#f5a623] border-[#f5a623]/40'
                }`}
              >
                <Clock size={15} />
                <span>Seat Hold: {formatTimer(timeLeftSeconds)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CROSS-SHOW ACTIVE HOLD ALERT BANNER */}
      {existingOtherHold && (
        <div className="max-w-5xl mx-auto mt-6 px-6 animate-in fade-in">
          <div className="p-4 bg-amber-500/15 border border-amber-500/30 text-amber-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm shadow-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle size={22} className="shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-bold text-amber-300 text-sm">
                  Active Seat Hold on Another Show or Theatre
                </p>
                <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                  You currently have seats on hold for{' '}
                  <strong className="text-white">"{existingOtherHold.otherMovie}"</strong> at{' '}
                  <strong className="text-white">{existingOtherHold.otherTheatre}</strong>. You cannot hold seats on multiple shows or theatres at the same time.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => handleReleaseOtherHoldsAndSelectCurrent()}
                disabled={releasingOtherHold}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RotateCcw size={13} />
                {releasingOtherHold ? 'Releasing...' : 'Release Previous Hold & Select Here'}
              </button>
              {existingOtherHold.otherShowId && (
                <Link
                  to={`/show/${existingOtherHold.otherShowId}/seats`}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition"
                >
                  Go to Active Booking
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Alert Banner */}
      {errorMessage && !existingOtherHold && (
        <div className="max-w-5xl mx-auto mt-6 px-6">
          <div className="p-4 bg-red-500/15 border border-red-500/30 text-red-300 rounded-2xl flex items-center justify-between gap-3 text-sm shadow-xl">
            <div className="flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage('')}
              className="p-1 text-red-400 hover:text-white cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 2. AUDITORIUM SCREEN & SEAT MATRIX */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
            <div className="w-10 h-10 border-4 border-[#f5a623]/20 border-t-[#f5a623] rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">Loading manager screen matrix...</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Realistic Curved Cinema Screen Header */}
            <div className="w-full max-w-4xl mx-auto text-center pt-2">
              <div className="relative">
                {/* Curved Screen Curve */}
                <div className="h-3 w-full bg-gradient-to-r from-transparent via-[#f5a623] to-transparent rounded-[50%] shadow-[0_0_25px_rgba(245,166,35,0.7)]" />
                {/* Screen Ambient Projection Beam */}
                <div className="h-16 w-full bg-gradient-to-b from-[#f5a623]/10 to-transparent pointer-events-none rounded-[50%]" />
              </div>
              <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-neutral-400 block font-bold mt-1">
                CINEMA SCREEN THIS WAY
              </span>
            </div>

            {/* SEAT MATRIX: MATCHES THE EXACT SCREEN MATRIX CREATED BY THE MANAGER (INCLUDING FULL PATHWAY ROWS) */}
            <div className="overflow-x-auto pb-6 pt-2 flex flex-col items-center select-none">
              <div className="inline-block space-y-2 min-w-max px-4 sm:px-8">
                {/* Column Number Indicators Header (1, 2, 3... 24) */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 pl-8 pr-8">
                  {Array.from({ length: seatGrid.maxCols }).map((_, cIdx) => (
                    <div
                      key={`col-${cIdx + 1}`}
                      className="w-8 sm:w-9 h-5 text-[10px] font-mono font-semibold text-neutral-500 flex items-center justify-center"
                    >
                      {cIdx + 1}
                    </div>
                  ))}
                </div>

                {/* Matrix Rows (Preserving manager's custom layout, pathways, accessible & broken seats) */}
                {seatGrid.rows.map((row) => (
                  <div key={row.rowLabel} className="flex items-center gap-2 justify-center">
                    {/* Left Row Label */}
                    <span
                      className={`w-6 text-xs font-mono font-black text-center shrink-0 ${
                        row.isFullPathwayRow ? 'text-neutral-600' : 'text-neutral-400'
                      }`}
                    >
                      {row.rowLabel}
                    </span>

                    {/* Row Cells (Seats + Walking Pathways) */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {row.cells.map((cell) => {
                        // 1. RENDER CLEAR WALKING PATHWAY / AISLE
                        if (cell.isPathway) {
                          return (
                            <div
                              key={cell.key}
                              className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-dashed border-neutral-700/70 bg-neutral-900/40 flex items-center justify-center pointer-events-none select-none transition"
                              title={`Row ${cell.rowLabel}, Col ${cell.col}: Walking Pathway / Aisle`}
                            >
                              <Footprints size={12} className="text-neutral-400/60" />
                            </div>
                          );
                        }

                        // 2. RENDER SEAT CELL
                        const st = statusBySeatId.get(cell.seatId);
                        const isSelected = selectedSeatIds.includes(cell.seatId);
                        const isHeldByOther =
                          st?.lockedByUserId &&
                          st.lockedByUserId !== user?.id &&
                          st.lockExpiresAt &&
                          new Date(st.lockExpiresAt) > new Date();
                        const isBooked = st?.status === 'BOOKED';
                        const isBroken = cell.isBroken || st?.status === 'UNAVAILABLE';
                        const tierKey = cell.tier || 'NORMAL';
                        const tierInfo = TIER_COLORS[tierKey] || TIER_COLORS.NORMAL;
                        const seatPrice = pricing[tierKey] || pricing.NORMAL;

                        const isDisabled = isBooked || isBroken || isHeldByOther;

                        return (
                          <button
                            type="button"
                            key={cell.key}
                            disabled={isDisabled}
                            onClick={() => handleToggleSeat(cell)}
                            title={`Seat ${cell.rowLabel}${cell.seatNumber} • ${tierInfo.name} (₹${seatPrice})${
                              cell.isAccessible ? ' • Wheelchair Accessible' : ''
                            }${isBroken ? ' • Out of Service' : ''}${
                              isBooked ? ' • Sold Out' : ''
                            }${isHeldByOther ? ' • On Hold by another customer' : ''}`}
                            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-[11px] font-mono font-bold flex items-center justify-center transition-all relative ${
                              isBooked
                                ? 'bg-neutral-800 text-neutral-600 border border-white/5 cursor-not-allowed'
                                : isHeldByOther
                                ? 'bg-amber-950/40 text-amber-500/50 border border-amber-500/40 cursor-not-allowed animate-pulse'
                                : isBroken
                                ? 'bg-neutral-900 text-red-500/40 border border-red-500/20 cursor-not-allowed line-through'
                                : isSelected
                                ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-black shadow-[0_0_18px_rgba(245,166,35,0.85)] ring-2 ring-yellow-400 font-black scale-105 z-10 cursor-pointer'
                                : `bg-white/[0.04] border ${tierInfo.border} ${tierInfo.bg} ${tierInfo.hover} cursor-pointer hover:scale-105 active:scale-95`
                            }`}
                          >
                            {cell.isAccessible ? (
                              <Accessibility
                                size={13}
                                className={isSelected ? 'text-black' : 'text-cyan-400'}
                              />
                            ) : (
                              <span>{cell.seatNumber}</span>
                            )}

                            {/* Broken / maintenance marker dot */}
                            {isBroken && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Row Label */}
                    <span
                      className={`w-6 text-xs font-mono font-black text-center shrink-0 ${
                        row.isFullPathwayRow ? 'text-neutral-600' : 'text-neutral-400'
                      }`}
                    >
                      {row.rowLabel}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. AUDITORIUM SEAT LEGEND & PRICING BAR */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#11131c] border border-white/10 flex flex-wrap items-center justify-center gap-4 sm:gap-7 text-xs text-neutral-300 max-w-4xl mx-auto shadow-xl">
              {/* Standard */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-cyan-500/10 border border-cyan-500/40" />
                <span>Standard (₹{pricing.NORMAL})</span>
              </div>
              {/* Premium */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-amber-500/10 border border-amber-500/40" />
                <span>Premium (₹{pricing.PREMIUM})</span>
              </div>
              {/* VIP Recliner */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-purple-500/15 border border-purple-500/50" />
                <span>VIP Recliner (₹{pricing.RECLINER})</span>
              </div>
              {/* Wheelchair Accessible */}
              <div className="flex items-center gap-1.5 text-cyan-400">
                <Accessibility size={15} />
                <span>Accessible</span>
              </div>
              {/* Pathway / Aisle */}
              <div className="flex items-center gap-1.5 text-neutral-400">
                <span className="w-5 h-4 rounded border border-dashed border-neutral-700 bg-neutral-900/60 flex items-center justify-center">
                  <Footprints size={10} className="text-neutral-400" />
                </span>
                <span>Pathway / Aisle</span>
              </div>
              {/* Selected */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-[#f5a623] shadow-[0_0_8px_rgba(245,166,35,0.5)]" />
                <span className="text-white font-bold">Selected</span>
              </div>
              {/* Held by Others */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-amber-950/40 border border-amber-500/40" />
                <span className="text-amber-400">On Hold</span>
              </div>
              {/* Sold Out */}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-md bg-neutral-800 border border-white/5" />
                <span className="text-neutral-500">Sold Out</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. DOCKED FLOATING CHECKOUT BAR (STICKY BOTTOM) */}
      <div className="fixed inset-x-0 bottom-0 z-40 bg-[#0d0e14]/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.8)] py-4 px-6 sm:px-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div>
              <div className="text-xs text-neutral-400 flex items-center gap-2">
                <span>Selected Seats:</span>
                <span className="font-bold text-white font-mono">
                  {selectedSeatIds.length > 0
                    ? selectedSeatIds
                        .map((id) => {
                          const st = statusBySeatId.get(id);
                          const seat = st?.seat || show?.screen?.seats?.find((s) => s.id === id);
                          return seat ? `${seat.rowLabel}${seat.seatNumber}` : id;
                        })
                        .join(', ')
                    : 'None selected'}
                </span>
                {selectedSeatIds.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f5a623]/20 text-[#f5a623]">
                    {selectedSeatIds.length} / 6 tickets
                  </span>
                )}
              </div>
              <div className="text-2xl font-heading font-black text-[#f5a623] flex items-baseline gap-2 mt-0.5">
                <span>₹{subtotal.toFixed(2)}</span>
                <span className="text-xs font-normal text-neutral-400">Subtotal</span>
              </div>
            </div>
          </div>

          <button
            disabled={selectedSeatIds.length === 0 || initiating || !!existingOtherHold}
            onClick={handleProceedToCheckout}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#f5a623] hover:bg-[#e09612] disabled:opacity-40 text-black font-heading font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,166,35,0.4)] transition active:scale-95 cursor-pointer"
          >
            {initiating ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Locking Seats &amp; Proceeding...</span>
              </>
            ) : (
              <>
                <span>Continue to Checkout</span>
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
