import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Film,
  Globe,
  MapPin,
  Save,
  Ticket,
  LogOut,
  CheckCircle,
  AlertCircle,
  Loader2,
  ShieldCheck,
  Sparkles,
  Heart
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api.service';

const AVAILABLE_LANGUAGES = [
  'English',
  'Hindi',
  'Kannada',
  'Telugu',
  'Tamil',
  'Malayalam',
  'Marathi'
];

const AVAILABLE_GENRES = [
  'Action',
  'Drama',
  'Comedy',
  'Sci-Fi',
  'Thriller',
  'Romance',
  'Horror',
  'Crime',
  'Adventure',
  'Animation'
];

const POPULAR_CITIES = [
  'Bengaluru',
  'Mumbai',
  'Delhi-NCR',
  'Hyderabad',
  'Chennai',
  'Pune'
];

export const ProfilePage = () => {
  const { user, token, logout, setUser, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Form states
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [favoriteGenres, setFavoriteGenres] = useState([]);
  const [city, setCity] = useState('Bengaluru');

  // Stats
  const [bookingCount, setBookingCount] = useState(0);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const [profileRes, bookingsRes] = await Promise.allSettled([
          api.getUserProfile(),
          api.getMyBookings()
        ]);

        if (profileRes.status === 'fulfilled' && profileRes.value.success) {
          const u = profileRes.value.data;
          setFullName(u.fullName || '');
          setMobileNumber(u.mobileNumber || '');
          const prefs = typeof u.preferences === 'object' && u.preferences !== null
            ? u.preferences
            : {};
          setPreferredLanguage(prefs.preferredLanguage || 'English');
          setFavoriteGenres(Array.isArray(prefs.favoriteGenres) ? prefs.favoriteGenres : []);
          setCity(prefs.city || 'Bengaluru');
        } else if (user) {
          setFullName(user.fullName || '');
          setMobileNumber(user.mobileNumber || '');
        }

        if (bookingsRes.status === 'fulfilled' && bookingsRes.value.success) {
          setBookingCount((bookingsRes.value.data || []).length);
        }
      } catch (err) {
        setErrorMsg('Failed to load profile. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [token]);

  const toggleGenre = (genre) => {
    setFavoriteGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMsg('Full name cannot be empty');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        fullName: fullName.trim(),
        mobileNumber: mobileNumber.trim() || null,
        preferences: {
          preferredLanguage,
          favoriteGenres,
          city
        }
      };

      const res = await api.updateUserProfile(payload);
      if (res.success) {
        setSuccessMsg('Your profile preferences have been successfully updated!');
        if (setUser && res.data) {
          setUser((prev) => ({ ...prev, ...res.data }));
          localStorage.setItem('user', JSON.stringify({ ...user, ...res.data }));
        }
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg(res.message || 'Failed to update profile');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred while saving profile');
    } finally {
      setSaving(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center px-4">
        <div className="bg-[#11131c] border border-white/10 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/30 flex items-center justify-center mx-auto mb-4 text-[#f5a623]">
            <User className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-heading font-black text-white mb-2">Sign in to view Profile</h2>
          <p className="text-neutral-400 text-sm mb-6">
            Access your CinePass rewards, personal ticket history, and movie recommendations.
          </p>
          <button
            onClick={() => openAuthModal('login')}
            className="w-full py-3 bg-[#f5a623] hover:bg-[#e09612] text-black font-bold rounded-xl transition shadow-lg cursor-pointer"
          >
            Sign In Now
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#f5a623] animate-spin mb-3" />
        <p className="text-neutral-400 text-sm">Loading your CineVerse profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-10 max-w-[1040px] mx-auto">
      <div className="space-y-8">
        {/* Profile Card Header (inspired by reference layout) */}
        <div className="bg-[#11131c] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#f5a623]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Avatar */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#f5a623] shadow-[0_0_25px_rgba(245,166,35,0.25)] bg-neutral-800 flex items-center justify-center text-3xl font-heading font-black text-[#f5a623] shrink-0">
            {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">
                {fullName || 'CineVerse Customer'}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {user?.role === 'SUPER_ADMIN' ? 'SUPER ADMIN' : user?.role === 'THEATRE_MANAGER' ? 'MANAGER' : 'CINEPASS ELITE'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Cinema Enthusiast & Premier Festival Member
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs text-neutral-300">
              <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                <Mail className="w-3.5 h-3.5 text-[#f5a623]" />
                {user?.email || 'customer@cineverse.com'}
              </span>
              {mobileNumber && (
                <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  <Phone className="w-3.5 h-3.5 text-[#f5a623]" />
                  {mobileNumber}
                </span>
              )}
              <span className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                <MapPin className="w-3.5 h-3.5 text-[#f5a623]" />
                {city}
              </span>
            </div>
          </div>

          {/* Points & Stats */}
          <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto shrink-0 flex sm:flex-col justify-around sm:justify-center gap-4">
            <div>
              <div className="text-2xl font-heading font-black text-[#f5a623]">
                {bookingCount * 120 + 250}
              </div>
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider">
                CinePoints
              </div>
            </div>
            <div>
              <div className="text-xl font-heading font-black text-white">
                {bookingCount}
              </div>
              <div className="text-[11px] text-neutral-400 uppercase tracking-wider">
                Total Bookings
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            to="/my-bookings"
            className="p-5 rounded-2xl bg-[#11131c] border border-white/10 hover:border-[#f5a623]/50 transition-all flex items-center justify-between group shadow-lg"
          >
            <div className="flex items-center gap-3.5">
              <span className="p-3 rounded-xl bg-[#f5a623]/10 text-[#f5a623] group-hover:bg-[#f5a623] group-hover:text-black transition-colors">
                <Ticket className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white">My Booking History</h4>
                <p className="text-xs text-neutral-400">{bookingCount} total booked transactions</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-[#f5a623] group-hover:underline">View Bookings →</span>
          </Link>

          <Link
            to="/cinemas"
            className="p-5 rounded-2xl bg-[#11131c] border border-white/10 hover:border-white/30 transition-all flex items-center justify-between group shadow-lg"
          >
            <div className="flex items-center gap-3.5">
              <span className="p-3 rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-black transition-colors">
                <Film className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white">Cinemas & Venues</h4>
                <p className="text-xs text-neutral-400">Explore theaters & IMAX screens</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-purple-400 group-hover:underline">Explore →</span>
          </Link>
        </div>

        {/* Profile Edit Form */}
        <div className="bg-[#11131c] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="border-b border-white/10 pb-4 mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-heading font-black text-white">Personal Settings & Preferences</h2>
              <p className="text-xs text-neutral-400 mt-0.5">Customize your cinema recommendations and contact details</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 text-sm">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#f5a623] transition"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              {/* Email (Read Only) */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Email Address <span className="text-[10px] text-neutral-500 normal-case">(Account Identifier)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-neutral-400 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Mobile Number (For Ticket SMS & WhatsApp)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#f5a623] transition"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Default City */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Preferred Location / City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#171a26] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#f5a623] transition"
                  >
                    {POPULAR_CITIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preferred Language */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Audio & Subtitle Language
                </label>
                <div className="relative">
                  <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                  <select
                    value={preferredLanguage}
                    onChange={(e) => setPreferredLanguage(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#171a26] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#f5a623] transition"
                  >
                    {AVAILABLE_LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Favorite Genres Chips */}
            <div>
              <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Favorite Movie Genres <span className="text-[10px] text-neutral-500 normal-case">(Pick what you love watching)</span>
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {AVAILABLE_GENRES.map((g) => {
                  const isSelected = favoriteGenres.includes(g);
                  return (
                    <button
                      type="button"
                      key={g}
                      onClick={() => toggleGenre(g)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#f5a623] text-black shadow-[0_0_12px_rgba(245,166,35,0.3)]'
                          : 'bg-white/5 border border-white/10 text-neutral-300 hover:border-white/30'
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${isSelected ? 'fill-black' : 'text-neutral-400'}`} />
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-neutral-500">
                Member ID: <span className="font-mono text-neutral-400">{user?.id?.slice(0, 8)}...</span>
              </span>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-[#f5a623] hover:bg-[#e09612] text-black font-bold text-sm transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sign Out Card */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-white">Session Security</h4>
            <p className="text-xs text-neutral-400">Sign out of CineVerse on this workstation</p>
          </div>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};
