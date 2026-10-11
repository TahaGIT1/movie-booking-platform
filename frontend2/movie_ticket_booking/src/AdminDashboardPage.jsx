import React, { useState, useEffect } from 'react';
import { api } from './api';

export const AdminDashboardPage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newMovie, setNewMovie] = useState({
    title: '',
    synopsis: '',
    durationMinutes: 120,
    originalLanguage: 'English'
  });

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const data = await api.getMovies();
      setMovies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:5000/api/v1/admin/movies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \Bearer \\
        },
        body: JSON.stringify(newMovie)
      });
      if (res.ok) {
        alert('Movie added!');
        fetchMovies();
      } else {
        const data = await res.json();
        alert('Failed: ' + data.message);
      }
    } catch (err) {
      alert('Error saving movie');
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8 text-white">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
          <h2 className="text-xl font-bold mb-4">Add Movie</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <input type="text" placeholder="Title" value={newMovie.title} onChange={e=>setNewMovie({...newMovie, title: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded text-white" required />
            <textarea placeholder="Synopsis" value={newMovie.synopsis} onChange={e=>setNewMovie({...newMovie, synopsis: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded text-white" required />
            <div className="flex gap-4">
              <input type="number" placeholder="Duration (min)" value={newMovie.durationMinutes} onChange={e=>setNewMovie({...newMovie, durationMinutes: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded text-white" required />
              <input type="text" placeholder="Language" value={newMovie.originalLanguage} onChange={e=>setNewMovie({...newMovie, originalLanguage: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded text-white" required />
            </div>
            <button className="w-full bg-yellow-500 text-black font-bold p-3 rounded">Add Movie</button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white/5 p-6 rounded-2xl border border-white/10">
          <h2 className="text-xl font-bold mb-4">Database Movies</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-neutral-400">
                  <th className="pb-3 px-4">Title</th>
                  <th className="pb-3 px-4">Language</th>
                  <th className="pb-3 px-4">Duration</th>
                </tr>
              </thead>
              <tbody>
                {movies.map(m => (
                  <tr key={m.id} className="border-b border-white/5">
                    <td className="py-4 px-4">{m.title}</td>
                    <td className="py-4 px-4">{m.originalLanguage}</td>
                    <td className="py-4 px-4">{m.durationMinutes}m</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
