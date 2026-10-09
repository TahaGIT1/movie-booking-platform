import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const AdminDashboardPage: React.FC = () => {
  const [movies, setMovies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [newMovie, setNewMovie] = useState({
    title: '',
    synopsis: '',
    durationMinutes: 120,
    originalLanguage: 'English'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const mData = await api.getMovies();
      setMovies(mData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/v1/admin/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newMovie)
      });
      if (res.ok) {
        alert('Movie created successfully!');
        fetchData();
      } else {
        const error = await res.json();
        alert('Failed to create movie: ' + error.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error creating movie');
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-10 max-w-[1720px] mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-heading font-black text-white tracking-tight uppercase">Admin Dashboard</h1>
          <p className="text-neutral-400 mt-2">Manage your cinemas, movies, and view analytics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
            <h2 className="text-xl font-bold text-white mb-4">Add New Movie</h2>
            <form onSubmit={handleCreateMovie} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Title</label>
                <input
                  type="text"
                  value={newMovie.title}
                  onChange={e => setNewMovie({...newMovie, title: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#f5a623] outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1">Synopsis</label>
                <textarea
                  value={newMovie.synopsis}
                  onChange={e => setNewMovie({...newMovie, synopsis: e.target.value})}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#f5a623] outline-none transition-colors h-24"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={newMovie.durationMinutes}
                    onChange={e => setNewMovie({...newMovie, durationMinutes: parseInt(e.target.value)})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#f5a623] outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Language</label>
                  <input
                    type="text"
                    value={newMovie.originalLanguage}
                    onChange={e => setNewMovie({...newMovie, originalLanguage: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-[#f5a623] outline-none transition-colors"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-[#f5a623] text-black font-bold rounded-lg px-4 py-3 hover:bg-[#f5a623]/90 transition-colors mt-4"
              >
                Add Movie
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md min-h-[400px]">
            <h2 className="text-xl font-bold text-white mb-6">Database Movies</h2>
            
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f5a623]"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-neutral-400 text-sm">
                      <th className="pb-3 px-4 font-medium">ID</th>
                      <th className="pb-3 px-4 font-medium">Title</th>
                      <th className="pb-3 px-4 font-medium">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movies.map((m: any, idx: number) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="py-4 px-4 text-sm text-neutral-500">#{m.id?.substring(0,6) || idx}</td>
                        <td className="py-4 px-4 font-medium text-white">{m.title}</td>
                        <td className="py-4 px-4 text-sm text-neutral-300">{m.durationMinutes || '120'} mins</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
