import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api.service';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Search, 
  Film, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  Globe, 
  Tag, 
  Users, 
  Clapperboard, 
  ExternalLink, 
  Image as ImageIcon,
  Check,
  AlertCircle
} from 'lucide-react';

const COMMON_GENRES = [
  'Action', 'Adventure', 'Comedy', 'Crime', 'Drama', 
  'Fantasy', 'Historical', 'Horror', 'Mystery', 'Romance', 
  'Sci-Fi', 'Thriller', 'Family', 'Animation'
];

const COMMON_LANGUAGES = [
  'Hindi', 'English', 'Kannada', 'Telugu', 'Tamil', 
  'Malayalam', 'Marathi', 'Bengali', 'Punjabi', 'Gujarati'
];

const CERTIFICATES = ['U', 'U/A', 'A', 'S', 'PG-13', 'R'];

const DEFAULT_FORM = {
  title: '',
  synopsis: '',
  durationMinutes: 120,
  censorCertificate: 'U/A',
  originalLanguage: 'Hindi',
  supportedLanguages: ['Hindi'],
  genres: ['Drama'],
  castMembers: [{ name: '', role: '' }],
  director: '',
  posterUrl: '',
  trailerUrl: '',
  releaseDate: ''
};

export const ManageMovies = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [customGenre, setCustomGenre] = useState('');
  const [customLang, setCustomLang] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminMovies();
      setMovies(data);
    } catch (err) {
      console.error('Failed to fetch movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingMovieId(null);
    setFormData(DEFAULT_FORM);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (movie) => {
    setEditingMovieId(movie.id);
    let formattedDate = '';
    if (movie.releaseDate) {
      formattedDate = new Date(movie.releaseDate).toISOString().split('T')[0];
    }

    let parsedCast = [];
    if (Array.isArray(movie.castMembers) && movie.castMembers.length > 0) {
      parsedCast = movie.castMembers.map(c => {
        if (typeof c === 'string') return { name: c, role: '' };
        return { name: c?.name || '', role: c?.role || '' };
      });
    } else {
      parsedCast = [{ name: '', role: '' }];
    }

    setFormData({
      title: movie.title || '',
      synopsis: movie.synopsis || '',
      durationMinutes: movie.durationMinutes || 120,
      censorCertificate: movie.censorCertificate || 'U/A',
      originalLanguage: movie.originalLanguage || 'Hindi',
      supportedLanguages: Array.isArray(movie.supportedLanguages) ? movie.supportedLanguages : [],
      genres: Array.isArray(movie.genres) ? movie.genres : [],
      castMembers: parsedCast,
      director: movie.director || '',
      posterUrl: movie.posterUrl || '',
      trailerUrl: movie.trailerUrl || '',
      releaseDate: formattedDate
    });
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingMovieId(null);
    setFormData(DEFAULT_FORM);
    setErrorMsg('');
  };

  const toggleGenre = (genre) => {
    setFormData(prev => {
      const exists = prev.genres.includes(genre);
      return {
        ...prev,
        genres: exists ? prev.genres.filter(g => g !== genre) : [...prev.genres, genre]
      };
    });
  };

  const addCustomGenre = (e) => {
    e.preventDefault();
    if (!customGenre.trim()) return;
    const trimmed = customGenre.trim();
    if (!formData.genres.includes(trimmed)) {
      setFormData(prev => ({ ...prev, genres: [...prev.genres, trimmed] }));
    }
    setCustomGenre('');
  };

  const toggleLanguage = (lang) => {
    setFormData(prev => {
      const exists = prev.supportedLanguages.includes(lang);
      return {
        ...prev,
        supportedLanguages: exists 
          ? prev.supportedLanguages.filter(l => l !== lang) 
          : [...prev.supportedLanguages, lang]
      };
    });
  };

  const addCustomLanguage = (e) => {
    e.preventDefault();
    if (!customLang.trim()) return;
    const trimmed = customLang.trim();
    if (!formData.supportedLanguages.includes(trimmed)) {
      setFormData(prev => ({ ...prev, supportedLanguages: [...prev.supportedLanguages, trimmed] }));
    }
    setCustomLang('');
  };

  const handleCastChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.castMembers];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, castMembers: updated };
    });
  };

  const addCastMember = () => {
    setFormData(prev => ({
      ...prev,
      castMembers: [...prev.castMembers, { name: '', role: '' }]
    }));
  };

  const removeCastMember = (index) => {
    setFormData(prev => {
      const updated = prev.castMembers.filter((_, i) => i !== index);
      return { ...prev, castMembers: updated.length ? updated : [{ name: '', role: '' }] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSubmitting(true);

    try {
      const cleanedCast = formData.castMembers
        .map(c => ({ name: c.name.trim(), role: c.role.trim() }))
        .filter(c => Boolean(c.name));

      const payload = {
        title: formData.title.trim(),
        synopsis: formData.synopsis.trim() || null,
        durationMinutes: parseInt(formData.durationMinutes, 10),
        censorCertificate: formData.censorCertificate.trim(),
        originalLanguage: formData.originalLanguage.trim(),
        supportedLanguages: formData.supportedLanguages,
        genres: formData.genres,
        castMembers: cleanedCast,
        director: formData.director.trim() || null,
        posterUrl: formData.posterUrl.trim() || null,
        trailerUrl: formData.trailerUrl.trim() || null,
        releaseDate: formData.releaseDate ? formData.releaseDate : null
      };

      if (editingMovieId) {
        await api.updateMovie(editingMovieId, payload);
        setSuccessMsg(`"${payload.title}" updated successfully!`);
      } else {
        await api.createMovie(payload);
        setSuccessMsg(`"${payload.title}" created successfully!`);
      }

      handleCloseModal();
      fetchMovies();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error submitting movie:', err);
      setErrorMsg(err.message || 'Failed to save movie');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      await api.deleteMovie(id);
      setSuccessMsg(`"${title}" deleted successfully.`);
      fetchMovies();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert(err.message || 'Failed to delete movie');
    }
  };

  const filteredMovies = useMemo(() => {
    if (!searchQuery.trim()) return movies;
    const q = searchQuery.toLowerCase();
    return movies.filter(m => 
      m.title?.toLowerCase().includes(q) ||
      m.director?.toLowerCase().includes(q) ||
      (Array.isArray(m.genres) && m.genres.some(g => g.toLowerCase().includes(q))) ||
      m.originalLanguage?.toLowerCase().includes(q)
    );
  }, [movies, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Toast feedback */}
      {successMsg && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500/90 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur border border-emerald-400 animate-in fade-in slide-in-from-top-2">
          <Check size={20} className="text-emerald-100" />
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Film className="text-yellow-500" size={32} />
            Manage Movies
            <span className="text-sm font-semibold px-3 py-1 bg-white/10 text-neutral-300 rounded-full border border-white/10">
              {movies.length} {movies.length === 1 ? 'Movie' : 'Movies'}
            </span>
          </h1>
          <p className="text-neutral-400 text-sm mt-1">
            Configure movie catalog, metadata, censor ratings, cast & crew, and media links.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search movies, genres, directors..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-neutral-900 border border-neutral-700/80 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 w-64 md:w-80 transition"
            />
          </div>

          <button
            onClick={handleOpenAdd}
            className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-yellow-500/20 transition active:scale-95"
          >
            <Plus size={18} />
            Add Movie
          </button>
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-neutral-500">
          <div className="w-10 h-10 border-4 border-yellow-500/20 border-t-yellow-500 rounded-full animate-spin mb-4" />
          <p className="text-sm font-medium">Loading catalog...</p>
        </div>
      ) : filteredMovies.length === 0 ? (
        <div className="bg-neutral-900/50 border border-white/10 rounded-2xl p-16 text-center text-neutral-400">
          <Clapperboard size={48} className="mx-auto mb-4 text-neutral-600 opacity-60" />
          <h3 className="text-lg font-semibold text-white mb-1">No movies found</h3>
          <p className="text-sm text-neutral-500 max-w-sm mx-auto mb-6">
            {searchQuery ? `No results match "${searchQuery}".` : 'Get started by adding your first movie to the database.'}
          </p>
          {!searchQuery && (
            <button
              onClick={handleOpenAdd}
              className="bg-yellow-500 text-black font-bold px-4 py-2 rounded-xl text-sm hover:bg-yellow-400 transition"
            >
              Add New Movie
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
          {filteredMovies.map(movie => {
            const castCount = Array.isArray(movie.castMembers) ? movie.castMembers.length : 0;
            const topCast = Array.isArray(movie.castMembers)
              ? movie.castMembers.slice(0, 2).map(c => typeof c === 'string' ? c : c.name).filter(Boolean).join(', ')
              : '';

            return (
              <div
                key={movie.id}
                className="group bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-2xl transition duration-300"
              >
                {/* Poster / Header */}
                <div className="relative aspect-[2/3] w-full bg-neutral-950 overflow-hidden">
                  {movie.posterUrl ? (
                    <img
                      src={movie.posterUrl}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600">
                      <ImageIcon size={44} className="opacity-40 mb-2" />
                      <span className="text-xs uppercase tracking-widest text-neutral-500 font-semibold">No Poster</span>
                    </div>
                  )}

                  {/* Badges on poster */}
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap">
                    <span className="bg-black/75 backdrop-blur text-yellow-400 border border-yellow-500/40 text-[10px] font-bold px-2 py-0.5 rounded-md">
                      {movie.censorCertificate || 'U/A'}
                    </span>
                    <span className="bg-black/75 backdrop-blur text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Clock size={10} className="text-neutral-400" />
                      {movie.durationMinutes}m
                    </span>
                  </div>

                  {movie.trailerUrl && (
                    <a
                      href={movie.trailerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2.5 right-2.5 bg-red-600/90 hover:bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md backdrop-blur flex items-center gap-1 transition"
                      title="Watch Trailer"
                    >
                      <ExternalLink size={10} />
                      Trailer
                    </a>
                  )}

                  {/* Subtle Gradient Overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent pointer-events-none" />
                </div>

                {/* Details Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-bold text-white text-base line-clamp-1 group-hover:text-yellow-400 transition" title={movie.title}>
                      {movie.title}
                    </h3>
                    
                    {movie.director && (
                      <p className="text-xs text-neutral-400 line-clamp-1 mt-0.5">
                        <span className="text-neutral-500 font-medium">Dir:</span> {movie.director}
                      </p>
                    )}

                    {movie.releaseDate && (
                      <p className="text-[11px] text-neutral-500 flex items-center gap-1 mt-1">
                        <Calendar size={11} />
                        {new Date(movie.releaseDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    )}
                  </div>

                  {/* Genres */}
                  <div className="flex flex-wrap gap-1">
                    {Array.isArray(movie.genres) && movie.genres.slice(0, 3).map((g, idx) => (
                      <span key={idx} className="bg-white/5 border border-white/10 text-[10px] font-medium text-neutral-300 px-1.5 py-0.5 rounded">
                        {g}
                      </span>
                    ))}
                    {Array.isArray(movie.genres) && movie.genres.length > 3 && (
                      <span className="text-[10px] text-neutral-500 font-medium self-center">
                        +{movie.genres.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Language & Cast info */}
                  <div className="pt-2 border-t border-neutral-800 text-[11px] space-y-1 text-neutral-400">
                    <div className="flex justify-between items-center">
                      <span className="text-neutral-500">Language:</span>
                      <span className="font-semibold text-neutral-200">{movie.originalLanguage}</span>
                    </div>

                    {topCast && (
                      <div className="line-clamp-1 text-neutral-400" title={topCast}>
                        <span className="text-neutral-500">Cast: </span>
                        {topCast}
                        {castCount > 2 ? ` +${castCount - 2}` : ''}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(movie)}
                      className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-200 hover:text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition"
                    >
                      <Edit3 size={13} className="text-yellow-500" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(movie.id, movie.title)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-lg transition"
                      title="Delete Movie"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= ADD / EDIT MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#121318] border border-neutral-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-xl border border-yellow-500/20">
                  <Film size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {editingMovieId ? 'Edit Movie' : 'Add New Movie to Catalog'}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    All 12 fields are saved directly to the database Movie model.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Error banner inside modal */}
            {errorMsg && (
              <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle size={18} className="shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Modal Form Scrollable Body */}
            <form id="movie-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* SECTION 1: Core Information */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-500 flex items-center gap-2">
                  <Film size={14} /> 1. Core Movie Details
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Movie Title <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Drishyam The Conclusion"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      className="w-full bg-black/60 border border-neutral-700/80 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 transition"
                      required
                    />
                  </div>

                  {/* Director */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Director
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Abhishek Pathak"
                      value={formData.director}
                      onChange={e => setFormData({ ...formData, director: e.target.value })}
                      className="w-full bg-black/60 border border-neutral-700/80 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 transition"
                    />
                  </div>

                  {/* Release Date */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                      <Calendar size={13} className="text-neutral-400" />
                      Theatrical Release Date
                    </label>
                    <input
                      type="date"
                      value={formData.releaseDate}
                      onChange={e => setFormData({ ...formData, releaseDate: e.target.value })}
                      className="w-full bg-black/60 border border-neutral-700/80 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 transition"
                    />
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                      <Clock size={13} className="text-neutral-400" />
                      Duration (Minutes) <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="480"
                      placeholder="120"
                      value={formData.durationMinutes}
                      onChange={e => setFormData({ ...formData, durationMinutes: e.target.value })}
                      className="w-full bg-black/60 border border-neutral-700/80 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 transition"
                      required
                    />
                  </div>

                  {/* Censor Certificate */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                      <ShieldAlert size={13} className="text-neutral-400" />
                      Censor Certificate <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={formData.censorCertificate}
                      onChange={e => setFormData({ ...formData, censorCertificate: e.target.value })}
                      className="w-full bg-black/60 border border-neutral-700/80 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-yellow-500 transition"
                      required
                    >
                      {CERTIFICATES.map(c => (
                        <option key={c} value={c} className="bg-neutral-900 text-white">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Languages & Genres */}
              <div className="space-y-4 pt-4 border-t border-neutral-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-500 flex items-center gap-2">
                  <Globe size={14} /> 2. Language & Genres
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Primary Language */}
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Original / Primary Language <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      list="language-options"
                      placeholder="e.g. Hindi"
                      value={formData.originalLanguage}
                      onChange={e => setFormData({ ...formData, originalLanguage: e.target.value })}
                      className="w-full bg-black/60 border border-neutral-700/80 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 transition"
                      required
                    />
                    <datalist id="language-options">
                      {COMMON_LANGUAGES.map(l => (
                        <option key={l} value={l} />
                      ))}
                    </datalist>
                  </div>

                  {/* Supported Languages Selector */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Supported Languages (Audio / Dubs Available)
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {COMMON_LANGUAGES.map(lang => {
                        const isSelected = formData.supportedLanguages.includes(lang);
                        return (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => toggleLanguage(lang)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                              isSelected
                                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                            }`}
                          >
                            {isSelected && '✓ '}
                            {lang}
                          </button>
                        );
                      })}
                    </div>
                    {/* Add Custom Language */}
                    <div className="flex items-center gap-2 max-w-sm">
                      <input
                        type="text"
                        placeholder="Add other language..."
                        value={customLang}
                        onChange={e => setCustomLang(e.target.value)}
                        className="flex-1 bg-black/60 border border-neutral-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500"
                      />
                      <button
                        type="button"
                        onClick={addCustomLanguage}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs px-3 py-1.5 rounded-lg font-medium transition"
                      >
                        + Add
                      </button>
                    </div>
                  </div>

                  {/* Genres Selector */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                      <Tag size={13} className="text-neutral-400" />
                      Genres
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {COMMON_GENRES.map(genre => {
                        const isSelected = formData.genres.includes(genre);
                        return (
                          <button
                            key={genre}
                            type="button"
                            onClick={() => toggleGenre(genre)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                              isSelected
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                            }`}
                          >
                            {isSelected && '✓ '}
                            {genre}
                          </button>
                        );
                      })}
                    </div>
                    {/* Add Custom Genre */}
                    <div className="flex items-center gap-2 max-w-sm">
                      <input
                        type="text"
                        placeholder="Add custom genre..."
                        value={customGenre}
                        onChange={e => setCustomGenre(e.target.value)}
                        className="flex-1 bg-black/60 border border-neutral-700/80 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500"
                      />
                      <button
                        type="button"
                        onClick={addCustomGenre}
                        className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs px-3 py-1.5 rounded-lg font-medium transition"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Synopsis */}
              <div className="space-y-2 pt-4 border-t border-neutral-800">
                <label className="block text-xs font-bold uppercase tracking-wider text-yellow-500">
                  3. Synopsis / Storyline
                </label>
                <textarea
                  rows="3"
                  placeholder="Provide an engaging synopsis or plot summary of the movie..."
                  value={formData.synopsis}
                  onChange={e => setFormData({ ...formData, synopsis: e.target.value })}
                  className="w-full bg-black/60 border border-neutral-700/80 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 transition resize-y"
                />
              </div>

              {/* SECTION 4: Media Links */}
              <div className="space-y-4 pt-4 border-t border-neutral-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-500 flex items-center gap-2">
                  <ImageIcon size={14} /> 4. Media & Video Links
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Poster Image URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://assets-in.bmscdn.com/.../poster.jpg"
                      value={formData.posterUrl}
                      onChange={e => setFormData({ ...formData, posterUrl: e.target.value })}
                      className="w-full bg-black/60 border border-neutral-700/80 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
                      <ExternalLink size={13} className="text-neutral-400" />
                      Trailer Video URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={formData.trailerUrl}
                      onChange={e => setFormData({ ...formData, trailerUrl: e.target.value })}
                      className="w-full bg-black/60 border border-neutral-700/80 rounded-xl p-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 transition"
                    />
                  </div>
                </div>

                {/* Poster Live Preview */}
                {formData.posterUrl && (
                  <div className="flex items-center gap-4 p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
                    <img
                      src={formData.posterUrl}
                      alt="Poster Preview"
                      className="w-16 h-24 object-cover rounded-lg border border-neutral-700 shadow"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div className="text-xs text-neutral-400 space-y-1">
                      <p className="font-semibold text-white">Live Poster Preview</p>
                      <p className="text-neutral-500 text-[11px] break-all">{formData.posterUrl}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 5: Cast Members (Json Array) */}
              <div className="space-y-4 pt-4 border-t border-neutral-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-yellow-500 flex items-center gap-2">
                    <Users size={14} /> 5. Cast Members
                  </h3>
                  <button
                    type="button"
                    onClick={addCastMember}
                    className="text-xs bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition"
                  >
                    <Plus size={14} />
                    Add Actor
                  </button>
                </div>

                <div className="space-y-2.5">
                  {formData.castMembers.map((cast, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Actor / Star Name (e.g. Ajay Devgn)"
                        value={cast.name}
                        onChange={e => handleCastChange(index, 'name', e.target.value)}
                        className="flex-1 bg-black/60 border border-neutral-700/80 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 transition"
                      />
                      <input
                        type="text"
                        placeholder="Character / Role (e.g. Vijay Salgaonkar)"
                        value={cast.role}
                        onChange={e => handleCastChange(index, 'role', e.target.value)}
                        className="flex-1 bg-black/60 border border-neutral-700/80 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-yellow-500 transition"
                      />
                      <button
                        type="button"
                        onClick={() => removeCastMember(index)}
                        className="p-2 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="Remove member"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-900/60 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-neutral-300 hover:text-white hover:bg-white/5 font-semibold text-sm transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="movie-form"
                disabled={submitting}
                className="bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-lg shadow-yellow-500/20 transition active:scale-95"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check size={18} />
                    {editingMovieId ? 'Update Movie' : 'Save Movie'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
