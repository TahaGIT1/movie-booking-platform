import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  CalendarDays, 
  Plus, 
  Clock, 
  Film, 
  Tv2, 
  Trash2, 
  Ban, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  X, 
  Tag, 
  DollarSign, 
  ChevronRight, 
  RefreshCw,
  Edit3,
  Coins,
  Sparkles,
  ArrowUpDown,
  LayoutGrid,
  ListFilter
} from 'lucide-react';
import { api } from '../../services/api.service';
import { EditPricingModal } from '../../components/manager/EditPricingModal';

export const ManagerShows = () => {
  const { theatre } = useOutletContext();
  const [shows, setShows] = useState([]);
  const [screens, setScreens] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Views
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedScreenId, setSelectedScreenId] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState('');
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' | 'by-movie'

  // Schedule Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  // New Show Form State
  const [newShow, setNewShow] = useState({
    movieId: '',
    screenId: '',
    showDate: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '20:30',
    visualFormat: 'TWO_D',
    languageVersion: 'English',
    pricing: {
      NORMAL: 250,
      PREMIUM: 380,
      RECLINER: 550
    }
  });

  // Edit Pricing Modal State
  const [editingShow, setEditingShow] = useState(null);
  const [editingMovie, setEditingMovie] = useState(null);
  const [editingMovieShowCount, setEditingMovieShowCount] = useState(1);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchShows();
  }, [selectedDate, selectedScreenId, selectedMovieId]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [screensData, moviesData] = await Promise.all([
        api.getScreens(),
        api.getMovies()
      ]);
      setScreens(screensData || []);
      setMovies(moviesData || []);
      if (screensData && screensData.length > 0) {
        setNewShow(prev => ({ ...prev, screenId: screensData[0].id }));
      }
      if (moviesData && moviesData.length > 0) {
        setNewShow(prev => ({ ...prev, movieId: moviesData[0].id }));
      }
      await fetchShows();
    } catch (err) {
      console.error('Failed to load shows data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchShows = async () => {
    try {
      const data = await api.getManagerShows({
        date: selectedDate || undefined,
        screenId: selectedScreenId || undefined,
        movieId: selectedMovieId || undefined
      });
      setShows(data || []);
    } catch (err) {
      console.error('Failed to fetch manager shows:', err);
    }
  };

  // Open Edit Pricing for a specific show
  const openEditPricingModal = (show) => {
    setEditingMovie(null);
    setEditingShow(show);
  };

  // Open Edit Pricing for all shows of a movie
  const openMoviePricingModal = (movie, count = 1) => {
    setEditingShow(null);
    setEditingMovie(movie);
    setEditingMovieShowCount(count);
  };

  // Auto-calculate end time when movie or start time changes
  const handleMovieOrStartTimeChange = (movieId, startTime, showDate) => {
    const movie = movies.find(m => m.id === movieId);
    const duration = movie?.durationMinutes || 120;
    
    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const totalStartMinutes = hours * 60 + minutes;
      const totalEndMinutes = totalStartMinutes + duration + 20; // 20 min interval
      
      const endHours = Math.floor(totalEndMinutes / 60) % 24;
      const endMins = totalEndMinutes % 60;
      const formattedEndTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
      
      setNewShow(prev => ({
        ...prev,
        movieId,
        startTime,
        endTime: formattedEndTime,
        languageVersion: movie?.originalLanguage || 'English'
      }));
    }
  };

  const handleCreateShow = async (e) => {
    e.preventDefault();
    setScheduleError('');
    setScheduling(true);

    try {
      const startDateTime = new Date(`${newShow.showDate}T${newShow.startTime}:00`);
      let endDateTime = new Date(`${newShow.showDate}T${newShow.endTime}:00`);

      if (endDateTime <= startDateTime) {
        endDateTime = new Date(endDateTime.getTime() + 24 * 60 * 60 * 1000);
      }

      await api.createShow({
        movieId: newShow.movieId,
        screenId: newShow.screenId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        visualFormat: newShow.visualFormat,
        languageVersion: newShow.languageVersion,
        baseTierPricing: {
          NORMAL: Number(newShow.pricing.NORMAL),
          PREMIUM: Number(newShow.pricing.PREMIUM),
          RECLINER: Number(newShow.pricing.RECLINER)
        }
      });

      setIsScheduleModalOpen(false);
      fetchShows();
    } catch (err) {
      setScheduleError(err.message || 'Failed to schedule show');
    } finally {
      setScheduling(false);
    }
  };

  const handleCancelShow = async (showId) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled show?')) return;
    try {
      await api.cancelShow(showId);
      fetchShows();
    } catch (err) {
      alert(err.message || 'Failed to cancel show');
    }
  };

  const handleDeleteShow = async (showId) => {
    if (!window.confirm('Are you sure you want to delete this show session?')) return;
    try {
      await api.deleteShow(showId);
      fetchShows();
    } catch (err) {
      alert(err.message || 'Failed to delete show');
    }
  };

  // Group shows by Movie ID
  const showsByMovie = React.useMemo(() => {
    const map = new Map();
    shows.forEach(show => {
      const mId = show.movie?.id || show.movieId || 'unknown';
      if (!map.has(mId)) {
        map.set(mId, {
          movie: show.movie,
          shows: []
        });
      }
      map.get(mId).shows.push(show);
    });
    return Array.from(map.values());
  }, [shows]);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <CalendarDays className="text-yellow-400" /> Show & Slot Scheduler
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Program cinema sessions, adjust tier pricing, and manage screening timelines. Click any show or movie to edit ticket rates anytime.
          </p>
        </div>

        <button
          onClick={() => setIsScheduleModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition shadow-lg shadow-yellow-500/20"
        >
          <Plus size={16} /> Schedule New Show
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-[#101216] border border-white/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-neutral-400">
            <Filter size={14} className="text-yellow-400" /> Filters:
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-[#181b22] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-500"
          />

          <select
            value={selectedScreenId}
            onChange={(e) => setSelectedScreenId(e.target.value)}
            className="bg-[#181b22] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-500"
          >
            <option value="">All Auditorium Screens</option>
            {screens.map(s => (
              <option key={s.id} value={s.id}>
                Screen {s.screenNumber} - {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedMovieId}
            onChange={(e) => setSelectedMovieId(e.target.value)}
            className="bg-[#181b22] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-yellow-500"
          >
            <option value="">All Movies</option>
            {movies.map(m => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
          </select>

          {(selectedDate || selectedScreenId || selectedMovieId) && (
            <button
              onClick={() => {
                setSelectedDate('');
                setSelectedScreenId('');
                setSelectedMovieId('');
              }}
              className="text-xs text-yellow-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* View Mode Toggle & Total Sessions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#181b22] border border-white/10 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'timeline' 
                  ? 'bg-yellow-500 text-black shadow' 
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Timeline list view"
            >
              <CalendarDays size={13} />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setViewMode('by-movie')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
                viewMode === 'by-movie' 
                  ? 'bg-yellow-500 text-black shadow' 
                  : 'text-neutral-400 hover:text-white'
              }`}
              title="Group by Movie view"
            >
              <Film size={13} />
              <span>By Movie</span>
            </button>
          </div>

          <div className="text-xs text-neutral-400 hidden sm:block">
            Showing <strong className="text-white">{shows.length}</strong> scheduled sessions
          </div>
        </div>
      </div>

      {/* Shows List */}
      {loading ? (
        <div className="py-20 text-center text-neutral-500">
          <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-yellow-400" />
          <p className="text-sm">Loading scheduled shows...</p>
        </div>
      ) : shows.length === 0 ? (
        <div className="bg-[#101216] border border-white/5 rounded-2xl p-12 text-center">
          <CalendarDays size={48} className="mx-auto text-neutral-600 mb-3" />
          <h3 className="text-lg font-bold text-white">No Shows Found</h3>
          <p className="text-sm text-neutral-400 max-w-md mx-auto mt-1 mb-6">
            There are no shows programmed matching your filters. Schedule a new screening session now.
          </p>
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition"
          >
            <Plus size={16} /> Schedule First Show
          </button>
        </div>
      ) : viewMode === 'by-movie' ? (
        /* BY-MOVIE GROUPED VIEW */
        <div className="space-y-6">
          {showsByMovie.map(({ movie: groupMovie, shows: groupShows }) => (
            <div 
              key={groupMovie?.id || Math.random()} 
              className="bg-[#101216] border border-white/5 hover:border-yellow-500/20 rounded-2xl p-6 transition space-y-5"
            >
              {/* Movie Header Card */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/5">
                <div 
                  onClick={() => openMoviePricingModal(groupMovie, groupShows.length)}
                  className="flex items-center gap-4 cursor-pointer group/movie flex-1"
                  title="Click movie to edit pricing across all scheduled sessions"
                >
                  {groupMovie?.posterUrl ? (
                    <img 
                      src={groupMovie.posterUrl} 
                      alt={groupMovie.title} 
                      className="w-14 h-20 object-cover rounded-xl shadow-md border border-white/10 group-hover/movie:scale-105 transition shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-20 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                      <Film size={22} />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-white group-hover/movie:text-yellow-400 transition flex items-center gap-2">
                        <span>{groupMovie?.title}</span>
                        <Edit3 size={14} className="opacity-0 group-hover/movie:opacity-100 text-yellow-400 transition" />
                      </h3>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        {groupShows.length} Show Session{groupShows.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-400 mt-1 flex flex-wrap items-center gap-2">
                      <span>{groupMovie?.durationMinutes || 120} mins</span>
                      <span>•</span>
                      <span>{groupMovie?.originalLanguage || 'English'}</span>
                      {groupMovie?.genres?.length > 0 && (
                        <>
                          <span>•</span>
                          <span>{groupMovie.genres.join(', ')}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Batch Movie Pricing Button */}
                <button
                  onClick={() => openMoviePricingModal(groupMovie, groupShows.length)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold transition shadow-sm self-start md:self-center"
                  title="Change ticket pricing for all scheduled shows of this movie"
                >
                  <Coins size={15} />
                  <span>Change Pricing for All Shows ({groupShows.length})</span>
                </button>
              </div>

              {/* Scheduled Sessions Grid */}
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
                  <Clock size={13} className="text-yellow-400" /> Scheduled Sessions (Click any session to adjust rate)
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {groupShows.map(sessionShow => {
                    const startDate = new Date(sessionShow.startTime);
                    const timeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const dateStr = startDate.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' });
                    const pricing = typeof sessionShow.baseTierPricing === 'object' && sessionShow.baseTierPricing !== null 
                      ? sessionShow.baseTierPricing 
                      : { NORMAL: 250, PREMIUM: 380, RECLINER: 550 };

                    return (
                      <div
                        key={sessionShow.id}
                        onClick={() => openEditPricingModal(sessionShow)}
                        className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-yellow-500/40 hover:bg-white/[0.04] transition cursor-pointer group/slot relative flex flex-col justify-between gap-2.5"
                        title="Click to modify ticket rates for this screening"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-yellow-400 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">
                              {sessionShow.screen?.name || `Screen ${sessionShow.screen?.screenNumber}`}
                            </span>
                            <div className="text-sm font-bold text-white mt-1 group-hover/slot:text-yellow-400 transition flex items-center gap-1.5">
                              <span>{timeStr}</span>
                              <span className="text-xs text-neutral-400 font-normal">• {dateStr}</span>
                            </div>
                          </div>

                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-neutral-300 font-bold shrink-0">
                            {sessionShow.visualFormat}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono">
                          <div className="flex items-center gap-2 text-neutral-300">
                            <span className="text-cyan-400 font-bold">N: ₹{pricing.NORMAL || 250}</span>
                            <span className="text-neutral-600">•</span>
                            <span className="text-amber-400 font-bold">P: ₹{pricing.PREMIUM || 380}</span>
                            <span className="text-neutral-600">•</span>
                            <span className="text-purple-400 font-bold">R: ₹{pricing.RECLINER || 550}</span>
                          </div>
                          <span className="text-[10px] font-bold text-yellow-400 group-hover/slot:underline flex items-center gap-1">
                            <Coins size={11} /> Edit
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TIMELINE VIEW */
        <div className="space-y-4">
          {shows.map((show) => {
            const startDate = new Date(show.startTime);
            const endDate = new Date(show.endTime);
            const formattedDate = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            const startTimeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTimeStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const pricing = typeof show.baseTierPricing === 'object' && show.baseTierPricing !== null 
              ? show.baseTierPricing 
              : { NORMAL: 250, PREMIUM: 380, RECLINER: 550 };

            return (
              <div
                key={show.id}
                className={`p-5 rounded-2xl bg-[#101216] border transition flex flex-col lg:flex-row lg:items-center justify-between gap-6 group/card ${
                  show.isCancelled ? 'border-red-500/20 opacity-70' : 'border-white/5 hover:border-yellow-500/30'
                }`}
              >
                {/* Left: Movie & Screen Info (Clickable to edit pricing) */}
                <div 
                  onClick={() => openEditPricingModal(show)}
                  className="flex items-center gap-4 cursor-pointer group/title flex-1"
                  title="Click to change ticket pricing and show details"
                >
                  {show.movie?.posterUrl ? (
                    <img
                      src={show.movie.posterUrl}
                      alt={show.movie.title}
                      className="w-16 h-24 object-cover rounded-xl shadow-md shrink-0 group-hover/title:scale-105 transition"
                    />
                  ) : (
                    <div className="w-16 h-24 rounded-xl bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                      <Film size={24} />
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20">
                        {show.screen?.name || `Screen ${show.screen?.screenNumber}`}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-neutral-300 font-bold">
                        {show.visualFormat}
                      </span>
                      <span className="text-xs text-neutral-400 font-medium">
                        {show.languageVersion}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover/title:text-yellow-400 transition flex items-center gap-2">
                      <span>{show.movie?.title || 'Unknown Film Title'}</span>
                      <Edit3 size={14} className="opacity-0 group-hover/title:opacity-100 text-yellow-400 transition" />
                    </h3>

                    <div className="text-xs text-neutral-400 flex items-center gap-3">
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span className="font-mono font-bold text-neutral-200">
                        {startTimeStr} - {endTimeStr}
                      </span>
                      <span>•</span>
                      <span>{show.movie?.durationMinutes || 120} mins</span>
                    </div>
                  </div>
                </div>

                {/* Middle: Tier Pricing (Clickable with edit trigger) */}
                <div 
                  onClick={() => openEditPricingModal(show)}
                  className="flex items-center gap-3 text-xs bg-white/[0.02] hover:bg-white/[0.05] p-3 rounded-xl border border-white/5 hover:border-yellow-500/30 transition cursor-pointer group/pricing relative"
                  title="Click to modify ticket rates for this screening"
                >
                  <div className="text-center px-2">
                    <div className="text-neutral-500 text-[10px] uppercase font-bold">Normal</div>
                    <div className="font-mono font-bold text-cyan-400 mt-0.5">₹{pricing.NORMAL || 250}</div>
                  </div>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="text-center px-2">
                    <div className="text-neutral-500 text-[10px] uppercase font-bold">Premium</div>
                    <div className="font-mono font-bold text-amber-400 mt-0.5">₹{pricing.PREMIUM || 380}</div>
                  </div>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="text-center px-2">
                    <div className="text-neutral-500 text-[10px] uppercase font-bold">Recliner</div>
                    <div className="font-mono font-bold text-purple-400 mt-0.5">₹{pricing.RECLINER || 550}</div>
                  </div>

                  <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded text-[9px] font-bold bg-yellow-500 text-black opacity-0 group-hover/pricing:opacity-100 transition shadow">
                    Edit Price
                  </span>
                </div>

                {/* Right: Bookings & Status Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-4">
                  <div className="text-right">
                    <div className="text-xs font-bold text-white">
                      {show._count?.bookings || 0} Bookings
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      {show.isCancelled ? (
                        <span className="text-red-400 font-semibold">Cancelled</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Scheduled Active</span>
                      )}
                    </div>
                  </div>

                  {/* Prominent Edit Pricing Button */}
                  <button
                    onClick={() => openEditPricingModal(show)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold transition shadow-sm"
                    title="Change Ticket Pricing"
                  >
                    <Coins size={13} />
                    <span>Change Price</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {!show.isCancelled && (
                      <button
                        onClick={() => handleCancelShow(show.id)}
                        className="p-2 rounded-xl text-neutral-400 hover:text-amber-400 hover:bg-amber-500/10 border border-white/5 transition"
                        title="Cancel Show"
                      >
                        <Ban size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteShow(show.id)}
                      className="p-2 rounded-xl text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-white/5 transition"
                      title="Delete Session"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: EDIT TICKET PRICING */}
      <EditPricingModal
        isOpen={!!editingShow || !!editingMovie}
        show={editingShow}
        movie={editingMovie}
        scheduledShowsCount={editingMovieShowCount}
        onClose={() => {
          setEditingShow(null);
          setEditingMovie(null);
        }}
        onSuccess={fetchShows}
      />

      {/* SCHEDULE SHOW MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121419] border border-white/10 rounded-2xl w-full max-w-lg p-6 overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CalendarDays className="text-yellow-400" size={20} />
                Schedule New Screening
              </h3>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-neutral-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {scheduleError && (
              <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                <AlertCircle size={15} />
                <span>{scheduleError}</span>
              </div>
            )}

            <form onSubmit={handleCreateShow} className="mt-5 space-y-4">
              {/* Select Movie */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Movie / Film Title <span className="text-yellow-400">*</span>
                </label>
                <select
                  required
                  value={newShow.movieId}
                  onChange={(e) => handleMovieOrStartTimeChange(e.target.value, newShow.startTime, newShow.showDate)}
                  className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                >
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.durationMinutes}m • {m.originalLanguage})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Auditorium Screen */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Auditorium Screen <span className="text-yellow-400">*</span>
                </label>
                <select
                  required
                  value={newShow.screenId}
                  onChange={(e) => setNewShow({ ...newShow, screenId: e.target.value })}
                  className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-yellow-500"
                >
                  {screens.map(s => (
                    <option key={s.id} value={s.id}>
                      Screen {s.screenNumber} - {s.name} ({s.soundSystem})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Show Date</label>
                  <input
                    type="date"
                    required
                    value={newShow.showDate}
                    onChange={(e) => setNewShow({ ...newShow, showDate: e.target.value })}
                    className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newShow.startTime}
                    onChange={(e) => handleMovieOrStartTimeChange(newShow.movieId, e.target.value, newShow.showDate)}
                    className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={newShow.endTime}
                    onChange={(e) => setNewShow({ ...newShow, endTime: e.target.value })}
                    className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              {/* Visual Format & Language Version */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Format</label>
                  <select
                    value={newShow.visualFormat}
                    onChange={(e) => setNewShow({ ...newShow, visualFormat: e.target.value })}
                    className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                  >
                    <option value="TWO_D">2D Digital</option>
                    <option value="THREE_D">3D Stereoscopic</option>
                    <option value="IMAX">IMAX 3D Experience</option>
                    <option value="FOUR_DX">4DX Motion & Effects</option>
                    <option value="SCREEN_X">ScreenX 270° Panoramic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">Language / Audio</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. English Atmos"
                    value={newShow.languageVersion}
                    onChange={(e) => setNewShow({ ...newShow, languageVersion: e.target.value })}
                    className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500"
                  />
                </div>
              </div>

              {/* Base Tier Pricing Breakdown */}
              <div className="pt-2 border-t border-white/10">
                <label className="block text-xs font-semibold text-neutral-300 mb-2">
                  Base Tier Ticket Pricing (INR ₹)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-cyan-400 font-bold block mb-1">Normal Tier</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={newShow.pricing.NORMAL}
                      onChange={(e) => setNewShow({
                        ...newShow,
                        pricing: { ...newShow.pricing, NORMAL: e.target.value }
                      })}
                      className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold block mb-1">Premium Tier</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={newShow.pricing.PREMIUM}
                      onChange={(e) => setNewShow({
                        ...newShow,
                        pricing: { ...newShow.pricing, PREMIUM: e.target.value }
                      })}
                      className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-purple-400 font-bold block mb-1">Recliner Tier</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={newShow.pricing.RECLINER}
                      onChange={(e) => setNewShow({
                        ...newShow,
                        pricing: { ...newShow.pricing, RECLINER: e.target.value }
                      })}
                      className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-500 font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="px-5 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition disabled:opacity-50"
                >
                  {scheduling ? 'Verifying & Scheduling...' : 'Confirm Show Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
