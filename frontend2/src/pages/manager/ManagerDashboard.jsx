import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { 
  Tv2, 
  CalendarDays, 
  Ticket, 
  TrendingUp, 
  Plus, 
  Users, 
  Clock, 
  Film, 
  Sparkles, 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle2, 
  RefreshCw, 
  Building2,
  Tag,
  Coins
} from 'lucide-react';
import { api } from '../../services/api.service';
import { EditPricingModal } from '../../components/manager/EditPricingModal';

export const ManagerDashboard = () => {
  const { theatre, refreshTheatre } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedShowForPricing, setSelectedShowForPricing] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.getManagerAnalytics();
      setStats(data);
    } catch (err) {
      console.error('Failed to load manager analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (cents) => {
    const amount = (cents || 0) / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Cinema Operations Dashboard
            </h1>
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-sm text-neutral-400 mt-1">
            Real-time box office operations, screen schedules, and seat performance for{' '}
            <span className="text-yellow-400 font-semibold">{theatre?.name || 'Your Branch'}</span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchDashboardData();
              refreshTheatre();
            }}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 text-xs font-semibold transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh Feed
          </button>
          <Link
            to="/manager/shows"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black text-xs font-bold transition shadow-lg shadow-yellow-500/20"
          >
            <Plus size={16} />
            Schedule Show
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Screens */}
        <div className="bg-[#101216] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-yellow-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Screens</span>
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-400">
              <Tv2 size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats?.totalScreens ?? 0}</span>
            <span className="text-xs text-neutral-500">screens configured</span>
          </div>
          <div className="mt-2 text-xs text-neutral-400 flex items-center gap-1">
            <span className="text-yellow-400 font-semibold">{stats?.totalSeats ?? 0}</span> total seating capacity
          </div>
        </div>

        {/* Today's Shows */}
        <div className="bg-[#101216] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-blue-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Shows Today</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
              <CalendarDays size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats?.activeShowsToday ?? 0}</span>
            <span className="text-xs text-neutral-500">sessions scheduled</span>
          </div>
          <div className="mt-2 text-xs text-neutral-400">
            Across all active auditoriums
          </div>
        </div>

        {/* Confirmed Bookings */}
        <div className="bg-[#101216] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Total Bookings</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <Ticket size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{stats?.confirmedBookingsCount ?? stats?.totalBookings ?? 0}</span>
            <span className="text-xs text-neutral-500">orders processed</span>
          </div>
          <div className="mt-2 text-xs text-emerald-400/90 font-medium flex items-center gap-1">
            <CheckCircle2 size={13} /> Real-time synchronized
          </div>
        </div>

        {/* Gross Box Office & Occupancy */}
        <div className="bg-[#101216] border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Box Office Revenue</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{formatCurrency(stats?.grossRevenueCents)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-neutral-400">Avg Occupancy</span>
            <span className="text-purple-400 font-bold">{stats?.occupancyRate ?? 0}%</span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-1.5 overflow-hidden">
            <div 
              className="bg-purple-500 h-full rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(100, stats?.occupancyRate || 0)}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Shows & Quick Launch */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Shows Schedule */}
        <div className="lg:col-span-2 bg-[#101216] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock size={18} className="text-yellow-400" />
                Today's Show Schedule
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">Timeline of screening sessions for today</p>
            </div>
            <Link
              to="/manager/shows"
              className="text-xs font-semibold text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
            >
              Full Calendar <ChevronRight size={14} />
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {stats?.todayShows && stats.todayShows.length > 0 ? (
              stats.todayShows.map((show) => {
                const startTime = new Date(show.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const endTime = new Date(show.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const pricing = typeof show.baseTierPricing === 'object' && show.baseTierPricing !== null 
                  ? show.baseTierPricing 
                  : { NORMAL: 250, PREMIUM: 380, RECLINER: 550 };

                return (
                  <div
                    key={show.id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-yellow-500/30 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 group/item"
                  >
                    {/* Movie Info & Poster (Click to edit pricing) */}
                    <div 
                      onClick={() => setSelectedShowForPricing(show)}
                      className="flex items-center gap-4 cursor-pointer flex-1"
                      title="Click to change ticket rates for this screening"
                    >
                      {show.movie?.posterUrl ? (
                        <img
                          src={show.movie.posterUrl}
                          alt={show.movie.title}
                          className="w-12 h-16 object-cover rounded-lg shadow-md group-hover/item:scale-105 transition shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-16 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                          <Film size={20} />
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-white group-hover/item:text-yellow-400 transition flex items-center gap-2">
                          <span>{show.movie?.title || 'Unknown Title'}</span>
                        </div>
                        <div className="text-xs text-neutral-400 mt-0.5 flex flex-wrap items-center gap-2">
                          <span className="text-yellow-400 font-medium">{show.screen?.name || `Screen ${show.screen?.screenNumber}`}</span>
                          <span>•</span>
                          <span>{show.languageVersion}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-bold text-neutral-300">
                            {show.visualFormat}
                          </span>
                        </div>
                        {/* Quick Pricing Badge */}
                        <div className="flex items-center gap-2 mt-1.5 text-[11px] font-mono text-neutral-300">
                          <span className="text-cyan-400 font-bold">N: ₹{pricing.NORMAL || 250}</span>
                          <span className="text-neutral-600">•</span>
                          <span className="text-amber-400 font-bold">P: ₹{pricing.PREMIUM || 380}</span>
                          <span className="text-neutral-600">•</span>
                          <span className="text-purple-400 font-bold">R: ₹{pricing.RECLINER || 550}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 text-right">
                      <div>
                        <div className="text-xs font-mono font-bold text-white">{startTime} - {endTime}</div>
                        <div className="text-[11px] text-neutral-400 mt-0.5">
                          {show._count?.bookings || 0} bookings
                        </div>
                      </div>

                      {/* Change Ticket Pricing Button */}
                      <button
                        onClick={() => setSelectedShowForPricing(show)}
                        className="px-3 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                        title="Change Ticket Pricing"
                      >
                        <Coins size={13} />
                        <span>Edit Price</span>
                      </button>

                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        show.isCancelled 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {show.isCancelled ? 'Cancelled' : 'Active'}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-neutral-500">
                <CalendarDays size={32} className="mx-auto mb-2 opacity-40 text-neutral-400" />
                <p className="text-sm font-medium">No shows scheduled for today yet.</p>
                <Link
                  to="/manager/shows"
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-xs font-bold transition"
                >
                  <Plus size={14} /> Schedule First Show
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Recent Bookings */}
        <div className="space-y-6">
          {/* Quick Management Shortcuts */}
          <div className="bg-[#101216] border border-white/5 rounded-2xl p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 mb-4">
              Quick Management
            </h2>
            <div className="grid grid-cols-1 gap-2.5">
              <Link
                to="/manager/screens"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-sm font-medium text-white transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                    <Tv2 size={16} />
                  </div>
                  <span>Configure Screens & Matrix</span>
                </div>
                <ChevronRight size={16} className="text-neutral-500 group-hover:text-white transition" />
              </Link>

              <Link
                to="/manager/shows"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-sm font-medium text-white transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <CalendarDays size={16} />
                  </div>
                  <span>Show & Slot Scheduler</span>
                </div>
                <ChevronRight size={16} className="text-neutral-500 group-hover:text-white transition" />
              </Link>

              <Link
                to="/manager/staff"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-sm font-medium text-white transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Users size={16} />
                  </div>
                  <span>Gate Staff & Scanner Access</span>
                </div>
                <ChevronRight size={16} className="text-neutral-500 group-hover:text-white transition" />
              </Link>

              <Link
                to="/manager/profile"
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 text-sm font-medium text-white transition group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Building2 size={16} />
                  </div>
                  <span>Cinema Profile & KYC Info</span>
                </div>
                <ChevronRight size={16} className="text-neutral-500 group-hover:text-white transition" />
              </Link>
            </div>
          </div>

          {/* Recent Orders Stream */}
          <div className="bg-[#101216] border border-white/5 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                Recent Bookings
              </h2>
              <Link to="/manager/bookings" className="text-xs font-semibold text-yellow-400 hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {stats?.recentBookings && stats.recentBookings.length > 0 ? (
                stats.recentBookings.slice(0, 4).map((b) => (
                  <div key={b.id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-yellow-400">{b.bookingReference}</span>
                      <span className="font-bold text-white">{formatCurrency(b.totalAmountCents)}</span>
                    </div>
                    <div className="text-neutral-400 mt-1 truncate">
                      {b.user?.fullName || 'Guest Customer'} • {b.show?.movie?.title || 'Screening'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-neutral-500">
                  No ticket bookings recorded yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Ticket Pricing Modal */}
      <EditPricingModal
        isOpen={!!selectedShowForPricing}
        show={selectedShowForPricing}
        onClose={() => setSelectedShowForPricing(null)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
};
