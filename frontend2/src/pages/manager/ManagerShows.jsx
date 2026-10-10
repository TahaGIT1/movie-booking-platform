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
  RefreshCw
} from 'lucide-react';
import { api } from '../../services/api.service';

export const ManagerShows = () => {
  const { theatre } = useOutletContext();
  const [shows, setShows] = useState([]);
  const [screens, setScreens] = useState([]);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedScreenId, setSelectedScreenId] = useState('');

  // Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [scheduleError, setScheduleError] = useState('');

  // Form State
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

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchShows();
  }, [selectedDate, selectedScreenId]);

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
        screenId: selectedScreenId || undefined
      });
      setShows(data || []);
    } catch (err) {
      console.error('Failed to fetch manager shows:', err);
    }
  };

  // Auto-calculate end time when movie or start time changes
  const handleMovieOrStartTimeChange = (movieId, startTime, showDate) => {
    const movie = movies.find(m => m.id === movieId);
    const duration = movie?.durationMinutes || 120;
    
    if (startTime) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const totalStartMinutes = hours * 60 + minutes;
      const totalEndMinutes = totalStartMinutes + duration + 20; // 20 min cleanup/interval
      
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

      // If end time is past midnight
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

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <CalendarDays className="text-yellow-400" /> Show & Slot Scheduler
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Program cinema sessions, set tier pricing, and manage screening timelines.
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

          {(selectedDate || selectedScreenId) && (
            <button
              onClick={() => {
                setSelectedDate('');
                setSelectedScreenId('');
              }}
              className="text-xs text-yellow-400 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>

        <div className="text-xs text-neutral-400">
          Showing <strong className="text-white">{shows.length}</strong> scheduled sessions
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
      ) : (
        <div className="space-y-4">
          {shows.map((show) => {
            const startDate = new Date(show.startTime);
            const endDate = new Date(show.endTime);
            const formattedDate = startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
            const startTimeStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const endTimeStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const pricing = typeof show.baseTierPricing === 'object' ? show.baseTierPricing : {};

            return (
              <div
                key={show.id}
                className={`p-5 rounded-2xl bg-[#101216] border transition flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
                  show.isCancelled ? 'border-red-500/20 opacity-70' : 'border-white/5 hover:border-yellow-500/30'
                }`}
              >
                {/* Left: Movie & Screen Info */}
                <div className="flex items-center gap-4">
                  {show.movie?.posterUrl ? (
                    <img
                      src={show.movie.posterUrl}
                      alt={show.movie.title}
                      className="w-16 h-24 object-cover rounded-xl shadow-md shrink-0"
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

                    <h3 className="text-lg font-bold text-white">
                      {show.movie?.title || 'Unknown Film Title'}
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

                {/* Middle: Tier Pricing */}
                <div className="flex items-center gap-3 text-xs bg-white/[0.02] p-3 rounded-xl border border-white/5">
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
                </div>

                {/* Right: Bookings & Status Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-5">
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
                      min="50"
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
                      min="50"
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
                      min="50"
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
