
import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.service';

export const DashboardOverview = () => {
  const [stats, setStats] = useState({ movies: 0, theatres: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [moviesRes, theatresRes] = await Promise.all([
          fetch(import.meta.env.VITE_API_BASE_URL + '/movies').then(res => res.json()),
          fetch(import.meta.env.VITE_API_BASE_URL + '/theatres').then(res => res.json())
        ]);
        setStats({
          movies: moviesRes.data?.length || 0,
          theatres: theatresRes.data?.length || 0
        });
      } catch (err) { console.error(err); }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-white">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
          <h3 className="text-neutral-400 text-sm font-medium uppercase tracking-wider">Total Movies</h3>
          <p className="text-5xl font-bold mt-4 text-white">{stats.movies}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
          <h3 className="text-neutral-400 text-sm font-medium uppercase tracking-wider">Active Theatres</h3>
          <p className="text-5xl font-bold mt-4 text-white">{stats.theatres}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl shadow-lg backdrop-blur-sm">
          <h3 className="text-neutral-400 text-sm font-medium uppercase tracking-wider">Today's Shows</h3>
          <p className="text-5xl font-bold mt-4 text-neutral-600">--</p>
        </div>
      </div>
    </div>
  );
};
