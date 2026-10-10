import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.service';
import {
  Plus,
  Image as ImageIcon,
  Edit2,
  Trash2,
  Search,
  X,
  Film,
  Calendar,
  Clock,
  Globe,
  User,
  Users,
  Video,
  Award,
  Check,
  AlertCircle,
  Loader2,
  ExternalLink
} from 'lucide-react';

const COMMON_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Drama',
  'Fantasy',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller'
];

const COMMON_LANGUAGES = [
  'English',
  'Hindi',
  'Kannada',
  'Telugu',
  'Tamil',
  'Malayalam',
  'Bengali',
  'Marathi'
];

const CERTIFICATES = ['U', 'U/A', 'A', 'S', 'PG', 'PG-13', 'R'];

const INITIAL_FORM = {
  title: '',
  synopsis: '',
  durationMinutes: 120,
  censorCertificate: 'U/A',
  originalLanguage: 'English',
  supportedLanguages: ['English'],
  genres: ['Action'],
  director: '',
  castMembersText: '',
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
  const [form, setForm] = useState(INITIAL_FORM);
  const [customGenre, setCustomGenre] = useState('');
  const [customLanguage, setCustomLanguage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const data = await api.getMovies();
      setMovies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch movies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingMovieId(null);
    setForm(INITIAL_FORM);
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (m) => {
    setEditingMovieId(m.id);
    let castText = '';
    if (Array.isArray(m.castMembers)) {
      castText = m.castMembers
        .map((c) => (typeof c === 'string' ? c : c.role ? `${c.name} as ${c.role}` : c.name))
        .join(', ');
    } else if (typeof m.castMembers === 'string') {
      castText = m.castMembers;
    }

    setForm({
      title: m.title || '',
      synopsis: m.synopsis || '',
      durationMinutes: m.durationMinutes || 120,
      censorCertificate: m.censorCertificate || 'U/A',
      originalLanguage: m.originalLanguage || 'English',
      supportedLanguages: Array.isArray(m.supportedLanguages) && m.supportedLanguages.length > 0
        ? m.supportedLanguages
        : [m.originalLanguage || 'English'],
      genres: Array.isArray(m.genres) && m.genres.length > 0 ? m.genres : ['Action'],
      director: m.director || '',
      castMembersText: castText,
      posterUrl: m.posterUrl || '',
      trailerUrl: m.trailerUrl || '',
      releaseDate: m.releaseDate ? new Date(m.releaseDate).toISOString().split('T')[0] : ''
    });
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsModalOpen(true);
  };

  const toggleGenre = (genre) => {
    setForm((prev) => {
      const exists = prev.genres.includes(genre);
      const updated = exists ? prev.genres.filter((g) => g !== genre) : [...prev.genres, genre];
      return { ...prev, genres: updated };
    });
  };

  const handleAddCustomGenre = (e) => {
    e.preventDefault();
    const g = customGenre.trim();
    if (g && !form.genres.includes(g)) {
      setForm((prev) => ({ ...prev, genres: [...prev.genres, g] }));
      setCustomGenre('');
    }
  };

  const toggleLanguage = (lang) => {
    setForm((prev) => {
      const exists = prev.supportedLanguages.includes(lang);
      const updated = exists
        ? prev.supportedLanguages.filter((l) => l !== lang)
        : [...prev.supportedLanguages, lang];
      return { ...prev, supportedLanguages: updated };
    });
  };

  const handleAddCustomLanguage = (e) => {
    e.preventDefault();
    const l = customLanguage.trim();
    if (l && !form.supportedLanguages.includes(l)) {
      setForm((prev) => ({ ...prev, supportedLanguages: [...prev.supportedLanguages, l] }));
      setCustomLanguage('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Format cast members
    const castMembers = form.castMembersText
      ? form.castMembersText
          .split(',')
          .map((c) => {
            const trimmed = c.trim();
            if (!trimmed) return null;
            const parts = trimmed.split(/\s+as\s+/i);
            return parts.length > 1
              ? { name: parts[0].trim(), role: parts[1].trim() }
              : { name: trimmed };
          })
          .filter(Boolean)
      : [];

    const payload = {
      title: form.title.trim(),
      synopsis: form.synopsis.trim() || undefined,
      durationMinutes: parseInt(form.durationMinutes, 10),
      censorCertificate: form.censorCertificate,
      originalLanguage: form.originalLanguage.trim(),
      supportedLanguages: form.supportedLanguages,
      genres: form.genres,
      director: form.director.trim() || undefined,
      castMembers,
      posterUrl: form.posterUrl.trim() || undefined,
      trailerUrl: form.trailerUrl.trim() || undefined,
      releaseDate: form.releaseDate ? form.releaseDate : undefined
    };

    try {
      if (editingMovieId) {
        await api.updateMovie(editingMovieId, payload);
        setSuccessMsg('Movie updated successfully!');
      } else {
        await api.createMovie(payload);
        setSuccessMsg('Movie added to database successfully!');
      }
      setTimeout(() => {
        setIsModalOpen(false);
        fetchMovies();
      }, 700);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (movieId) => {
    try {
      await api.deleteMovie(movieId);
      setDeleteConfirmId(null);
      fetchMovies();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete movie');
    }
  };

  const filteredMovies = movies.filter((m) => {
    const q = searchQuery.toLowerCase();
    const titleMatch = m.title?.toLowerCase().includes(q);
    const langMatch = m.originalLanguage?.toLowerCase().includes(q);
    const genreMatch = Array.isArray(m.genres) && m.genres.some((g) => g.toLowerCase().includes(q));
    const directorMatch = m.director?.toLowerCase().includes(q);
    return titleMatch || langMatch || genreMatch || directorMatch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30 tracking-wider">
            ADMIN CATALOG MANAGEMENT
          </span>
          <h1 className="text-3xl font-heading font-black text-white mt-1">
            Manage Movies
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Create, update, and manage all cinema catalog items in the PostgreSQL database.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-[#f5a623] hover:bg-[#e09612] text-black font-semibold px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-[#f5a623]/20 transition cursor-pointer text-sm"
        >
          <Plus size={18} />
          <span>Add New Movie</span>
        </button>
      </div>

      {/* Filter and Stats Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#11131c] border border-white/10 p-4 rounded-2xl">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by title, genre, language, director..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-neutral-500 outline-none focus:border-[#f5a623]"
          />
        </div>
        <div className="text-xs text-neutral-400 font-mono">
          Showing <span className="text-white font-bold">{filteredMovies.length}</span> of{' '}
          <span className="text-[#f5a623] font-bold">{movies.length}</span> movies
        </div>
      </div>

      {/* Movies Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#f5a623] mx-auto mb-3" />
          <p className="text-xs text-neutral-400">Loading movies from database...</p>
        </div>
      ) : filteredMovies.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredMovies.map((m) => (
            <div
              key={m.id}
              className="bg-[#11131c] border border-white/10 rounded-2xl overflow-hidden hover:border-[#f5a623]/40 transition duration-300 flex flex-col group shadow-xl"
            >
              {/* Poster thumbnail */}
              <div className="relative aspect-[2/3] w-full bg-black/60 overflow-hidden">
                {m.posterUrl ? (
                  <img
                    src={m.posterUrl}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    onError={(e) => {
                      e.currentTarget.src =
                        'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-neutral-600">
                    <ImageIcon size={40} className="mb-2 opacity-40" />
                    <span className="text-[10px] uppercase font-mono tracking-wider">No Poster</span>
                  </div>
                )}

                {/* Badges on poster */}
                <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                  <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md border border-white/15 text-[10px] font-bold text-white font-mono">
                    {m.censorCertificate || 'U/A'}
                  </span>
                  {m.durationMinutes && (
                    <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md border border-white/15 text-[10px] text-neutral-300 font-mono">
                      {m.durationMinutes}m
                    </span>
                  )}
                </div>

                {/* Quick Action Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-4">
                  <button
                    onClick={() => handleOpenEditModal(m)}
                    className="p-2.5 rounded-xl bg-white/20 hover:bg-[#f5a623] text-white hover:text-black transition cursor-pointer"
                    title="Edit Movie"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(m.id)}
                    className="p-2.5 rounded-xl bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white transition cursor-pointer"
                    title="Delete Movie"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Movie Details Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-heading font-bold text-white text-sm line-clamp-1 group-hover:text-[#f5a623] transition-colors">
                    {m.title}
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {m.originalLanguage}
                    {m.director ? ` • Dir: ${m.director}` : ''}
                  </p>
                  {Array.isArray(m.genres) && m.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {m.genres.slice(0, 2).map((g) => (
                        <span
                          key={g}
                          className="px-1.5 py-0.5 rounded text-[9px] bg-white/5 border border-white/10 text-neutral-300"
                        >
                          {g}
                        </span>
                      ))}
                      {m.genres.length > 2 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] text-neutral-500">
                          +{m.genres.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
                  <span>{m._count?.shows || 0} Shows Scheduled</span>
                  <button
                    onClick={() => handleOpenEditModal(m)}
                    className="text-[#f5a623] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Delete confirmation prompt */}
              {deleteConfirmId === m.id && (
                <div className="p-3 bg-red-950/80 border-t border-red-500/30 text-center animate-in fade-in duration-150">
                  <p className="text-[11px] text-red-200 mb-2">Delete this movie?</p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => handleDelete(m.id)}
                      className="px-2.5 py-1 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-neutral-300 text-[10px] cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-neutral-500 bg-[#11131c] border border-white/10 rounded-2xl">
          <Film size={48} className="mx-auto mb-3 opacity-30 text-[#f5a623]" />
          <p className="text-sm font-medium text-white">No movies found</p>
          <p className="text-xs text-neutral-400 mt-1">
            {searchQuery ? 'Try clearing your search query.' : 'Click "Add New Movie" above to add one to the database.'}
          </p>
        </div>
      )}

      {/* Add / Edit Movie Modal with All 12 DB Fields */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-[#0f1118] border border-white/15 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-lg bg-[#f5a623]/10 text-[#f5a623]">
                  <Film className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-heading font-bold text-white">
                    {editingMovieId ? 'Edit Movie' : 'Add New Movie to Database'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Configures all 12 schema fields directly in PostgreSQL
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2.5 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5 text-emerald-400 text-xs">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* 1. Title & Director */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-[#f5a623]" />
                    Movie Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Inception"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#f5a623]" />
                    Director
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Christopher Nolan"
                    value={form.director}
                    onChange={(e) => setForm({ ...form, director: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white outline-none transition"
                  />
                </div>
              </div>

              {/* 2. Synopsis */}
              <div>
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 block">
                  Synopsis / Storyline
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter a compelling summary of the movie plot..."
                  value={form.synopsis}
                  onChange={(e) => setForm({ ...form, synopsis: e.target.value })}
                  className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white outline-none transition resize-none"
                />
              </div>

              {/* 3. Duration, Censor, Release Date */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#f5a623]" />
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="120"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#f5a623]" />
                    Censor Certificate *
                  </label>
                  <select
                    value={form.censorCertificate}
                    onChange={(e) => setForm({ ...form, censorCertificate: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white outline-none transition"
                  >
                    {CERTIFICATES.map((c) => (
                      <option key={c} value={c} className="bg-[#11131c] text-white">
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#f5a623]" />
                    Release Date
                  </label>
                  <input
                    type="date"
                    value={form.releaseDate}
                    onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] rounded-xl px-4 py-2 text-xs sm:text-sm text-white outline-none transition"
                  />
                </div>
              </div>

              {/* 4. Original Language & Supported Dubbed Languages */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#f5a623]" />
                      Original Language *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. English, Hindi, Kannada"
                      value={form.originalLanguage}
                      onChange={(e) => setForm({ ...form, originalLanguage: e.target.value })}
                      className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 block">
                      Add Other Supported Languages
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Type & add language"
                        value={customLanguage}
                        onChange={(e) => setCustomLanguage(e.target.value)}
                        className="flex-1 bg-white/5 border border-white/15 focus:border-[#f5a623] rounded-xl px-3 py-2 text-xs text-white outline-none transition"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomLanguage}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Common Language chips */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-neutral-500 mr-1">Quick Select:</span>
                  {COMMON_LANGUAGES.map((lang) => {
                    const isSelected = form.supportedLanguages.includes(lang);
                    return (
                      <button
                        type="button"
                        key={lang}
                        onClick={() => toggleLanguage(lang)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#f5a623]/20 border-[#f5a623] text-[#f5a623]'
                            : 'bg-white/5 border-white/10 text-neutral-400 hover:border-white/25'
                        }`}
                      >
                        {lang} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Genres Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Genres * (Select one or more)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Custom genre"
                      value={customGenre}
                      onChange={(e) => setCustomGenre(e.target.value)}
                      className="bg-white/5 border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-[#f5a623] w-28"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomGenre}
                      className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {COMMON_GENRES.map((g) => {
                    const isSelected = form.genres.includes(g);
                    return (
                      <button
                        type="button"
                        key={g}
                        onClick={() => toggleGenre(g)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#f5a623] text-black border-[#f5a623] shadow-md shadow-[#f5a623]/20'
                            : 'bg-white/5 text-neutral-300 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {g} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 6. Cast Members */}
              <div>
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#f5a623]" />
                  Cast Members (Comma separated, e.g. "Robert Downey Jr. as Tony Stark, Chris Evans")
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ajay Devgn as Vijay Salgaonkar, Tabu, Akshaye Khanna"
                  value={form.castMembersText}
                  onChange={(e) => setForm({ ...form, castMembersText: e.target.value })}
                  className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white outline-none transition"
                />
              </div>

              {/* 7. Poster & Trailer URLs with Preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-[#f5a623]" />
                    Poster Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://.../poster.jpg"
                    value={form.posterUrl}
                    onChange={(e) => setForm({ ...form, posterUrl: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-[#f5a623]" />
                    Trailer URL (YouTube / Video Link)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={form.trailerUrl}
                    onChange={(e) => setForm({ ...form, trailerUrl: e.target.value })}
                    className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white outline-none transition"
                  />
                </div>
              </div>

              {/* Live Poster Thumbnail Preview */}
              {form.posterUrl && (
                <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-4">
                  <img
                    src={form.posterUrl}
                    alt="Preview"
                    className="w-12 h-16 object-cover rounded-lg border border-white/10"
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <div className="text-xs">
                    <span className="text-neutral-400 block">Poster Preview Active</span>
                    <a
                      href={form.posterUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#f5a623] hover:underline inline-flex items-center gap-1 mt-0.5"
                    >
                      <span>Open image</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              )}

              {/* Form Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-[#f5a623] hover:bg-[#e09612] text-black font-semibold text-xs transition shadow-lg shadow-[#f5a623]/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving to DB...</span>
                    </>
                  ) : (
                    <span>{editingMovieId ? 'Update Movie' : 'Save Movie to Database'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
