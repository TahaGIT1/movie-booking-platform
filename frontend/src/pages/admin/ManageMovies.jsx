import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.service';
import { Plus, Image as ImageIcon } from 'lucide-react';

export const ManageMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMovie, setNewMovie] = useState({ title: '', synopsis: '', durationMinutes: 120, originalLanguage: 'English', censorCertificate: 'U/A', posterUrl: '', trailerUrl: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchMovies(); }, []);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const data = await api.getMovies();
      setMovies(data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + '/admin/movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({...newMovie, durationMinutes: parseInt(newMovie.durationMinutes)})
      });
      if (res.ok) {
        alert('Movie added!');
        setNewMovie({ title: '', synopsis: '', durationMinutes: 120, originalLanguage: 'English', censorCertificate: 'U/A', posterUrl: '', trailerUrl: '' });
        setShowForm(false);
        fetchMovies();
      } else {
        const data = await res.json();
        alert('Failed: ' + data.message);
      }
    } catch (err) { alert('Error saving movie'); }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Manage Movies</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-yellow-400 transition">
          <Plus size={20} /> {showForm ? 'Cancel' : 'Add Movie'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 mb-8 animate-in slide-in-from-top-4 fade-in">
          <h2 className="text-xl font-bold mb-4">Add New Movie</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <input type="text" placeholder="Movie Title" value={newMovie.title} onChange={e=>setNewMovie({...newMovie, title: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-yellow-500 transition" required />
            <textarea placeholder="Synopsis" value={newMovie.synopsis} onChange={e=>setNewMovie({...newMovie, synopsis: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-yellow-500 transition min-h-[100px]" required />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="url" placeholder="Poster Image URL" value={newMovie.posterUrl} onChange={e=>setNewMovie({...newMovie, posterUrl: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-yellow-500 transition" />
              <input type="url" placeholder="Trailer URL" value={newMovie.trailerUrl} onChange={e=>setNewMovie({...newMovie, trailerUrl: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-yellow-500 transition" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input type="number" placeholder="Duration (min)" value={newMovie.durationMinutes} onChange={e=>setNewMovie({...newMovie, durationMinutes: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-yellow-500 transition" required />
              <input type="text" placeholder="Language" value={newMovie.originalLanguage} onChange={e=>setNewMovie({...newMovie, originalLanguage: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-yellow-500 transition" required />
              <input type="text" placeholder="Censor (e.g. U/A)" value={newMovie.censorCertificate} onChange={e=>setNewMovie({...newMovie, censorCertificate: e.target.value})} className="w-full bg-black/50 border border-white/10 p-3 rounded-lg text-white outline-none focus:border-yellow-500 transition" required />
            </div>
            
            <button className="bg-yellow-500 text-black font-bold px-6 py-3 rounded-lg hover:bg-yellow-400 transition">Save Movie</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {movies.map(m => (
          <div key={m.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:scale-105 transition duration-300">
            {m.posterUrl ? (
              <img src={m.posterUrl} alt={m.title} className="w-full aspect-[2/3] object-cover" />
            ) : (
              <div className="w-full aspect-[2/3] bg-black/50 flex flex-col items-center justify-center text-neutral-600">
                <ImageIcon size={48} className="mb-2 opacity-50" />
                <span className="text-xs font-medium uppercase tracking-widest">No Poster</span>
              </div>
            )}
            <div className="p-4">
              <h3 className="font-bold text-white line-clamp-1">{m.title}</h3>
              <div className="flex justify-between items-center mt-2 text-xs text-neutral-400">
                <span>{m.originalLanguage}</span>
                <span className="px-1.5 py-0.5 border border-neutral-600 rounded">{m.censorCertificate}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {movies.length === 0 && !loading && (
        <div className="py-20 text-center text-neutral-500 bg-white/5 border border-white/10 rounded-2xl">
          <ImageIcon size={48} className="mx-auto mb-4 opacity-50" />
          <p>No movies found in the database.</p>
        </div>
      )}
    </div>
  );
};
