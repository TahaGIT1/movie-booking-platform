
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Film, Building2, ClipboardCheck, ArrowRight, Clock } from 'lucide-react';
import { api } from '../../services/api.service';

export const DashboardOverview = () => {
  const [stats, setStats] = useState({ movies: 0, theatres: 0, pendingRequests: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [moviesRes, theatresRes, adminTheatres] = await Promise.all([
          fetch(import.meta.env.VITE_API_BASE_URL + '/movies').then(res => res.json()).catch(() => ({ data: [] })),
          fetch(import.meta.env.VITE_API_BASE_URL + '/theatres').then(res => res.json()).catch(() => ({ data: [] })),
          api.getAdminTheatres().catch(() => [])
        ]);

        const pending = Array.isArray(adminTheatres) ? adminTheatres.filter(t => t.status === 'PENDING').length : 0;

        setStats({
          movies: moviesRes.data?.length || 0,
          theatres: theatresRes.data?.length || (Array.isArray(adminTheatres) ? adminTheatres.filter(t => t.status === 'ACTIVE' || t.status === 'APPROVED').length : 0),
          pendingRequests: pending
        });
      } catch (err) { console.error(err); }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-black mb-1 text-white tracking-tight">Admin Dashboard Overview</h1>
        <p className="text-neutral-400 text-sm">Platform administration, cinema partner approvals, and catalogue overview.</p>
      </div>

      {stats.pendingRequests > 0 && (
        <div className="bg-gradient-to-r from-yellow-500/20 via-amber-500/15 to-yellow-500/10 border border-yellow-500/40 rounded-3xl p-6 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/30 text-yellow-400 flex items-center justify-center shrink-0">
              <Clock size={24} className="animate-spin" style={{ animationDuration: '6s' }} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">
                {stats.pendingRequests} Theatre Registration Application{stats.pendingRequests > 1 ? 's' : ''} Awaiting Review
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5">
                New cinema managers have applied to partner with CineVerse. Review details, check GST information, and approve or reject with feedback.
              </p>
            </div>
          </div>
          <Link
            to="/admin/theatre-requests"
            className="px-5 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs transition flex items-center gap-2 shrink-0 hover:shadow-[0_0_20px_rgba(234,179,8,0.3)]"
          >
            Review Applications
            <ArrowRight size={15} />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Pending Requests card */}
        <Link 
          to="/admin/theatre-requests"
          className="bg-neutral-900/50 hover:bg-neutral-900/80 border border-white/10 hover:border-yellow-500/50 p-6 rounded-3xl shadow-lg backdrop-blur-sm transition group cursor-pointer"
        >
          <div className="flex items-center justify-between text-yellow-400 text-xs font-bold uppercase tracking-wider">
            <span>Pending Requests</span>
            <ClipboardCheck size={18} className="group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-5xl font-black mt-4 text-yellow-400">{stats.pendingRequests}</p>
          <span className="text-[11px] text-neutral-400 mt-2 block group-hover:text-yellow-300 transition">
            Click to review applications →
          </span>
        </Link>

        {/* Active Theatres */}
        <Link 
          to="/admin/theatres"
          className="bg-neutral-900/50 hover:bg-neutral-900/80 border border-white/10 hover:border-emerald-500/50 p-6 rounded-3xl shadow-lg backdrop-blur-sm transition group cursor-pointer"
        >
          <div className="flex items-center justify-between text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <span>Active Theatres</span>
            <Building2 size={18} className="group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-5xl font-black mt-4 text-emerald-400">{stats.theatres}</p>
          <span className="text-[11px] text-neutral-400 mt-2 block group-hover:text-emerald-300 transition">
            Manage active theatres →
          </span>
        </Link>

        {/* Total Movies */}
        <Link 
          to="/admin/movies"
          className="bg-neutral-900/50 hover:bg-neutral-900/80 border border-white/10 hover:border-white/30 p-6 rounded-3xl shadow-lg backdrop-blur-sm transition group cursor-pointer"
        >
          <div className="flex items-center justify-between text-neutral-400 text-xs font-bold uppercase tracking-wider">
            <span>Master Movies</span>
            <Film size={18} className="group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-5xl font-black mt-4 text-white">{stats.movies}</p>
          <span className="text-[11px] text-neutral-400 mt-2 block group-hover:text-white transition">
            Browse catalogue & release list →
          </span>
        </Link>

      </div>
    </div>
  );
};
