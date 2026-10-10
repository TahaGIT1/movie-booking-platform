import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Ticket, 
  ArrowRight,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { api } from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';

export const CustomerSignup = () => {
  const navigate = useNavigate();
  const { login, openAuthModal } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const result = await api.register({
        fullName,
        email,
        mobileNumber: mobileNumber || undefined,
        password,
        role: 'CUSTOMER'
      });

      if (result.success) {
        login(result.data.accessToken, result.data.user);
        navigate('/');
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#060608] text-white pt-24 pb-16 px-4 sm:px-6 relative overflow-hidden flex flex-col justify-center items-center selection:bg-yellow-500 selection:text-black">
      {/* Background Decorative Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-yellow-500/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="w-full max-w-md relative z-10">
        
        {/* Top Back Navigation */}
        <div className="mb-6 flex justify-between items-center text-sm">
          <Link to="/" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition">
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <Link to="/theatre/signup" className="text-yellow-500 hover:text-yellow-400 text-xs font-semibold flex items-center gap-1">
            <Building2 size={14} />
            Partner Portal
          </Link>
        </div>

        {/* PROMINENT THEATER MANAGER SIGNUP CALLOUT BANNER */}
        <div className="mb-6 bg-gradient-to-r from-yellow-500/15 via-yellow-500/10 to-amber-500/15 border border-yellow-500/30 rounded-2xl p-4 backdrop-blur-md transition hover:border-yellow-500/50 shadow-lg shadow-yellow-500/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 flex items-center justify-center shrink-0 mt-0.5">
              <Building2 size={20} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Cinema Owner or Theatre Manager?
                <Sparkles size={14} className="text-yellow-400" />
              </h3>
              <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
                List your cinema venue, manage auditoriums, and schedule showtimes on CineVerse.
              </p>
              <Link
                to="/theatre/signup"
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-yellow-400 hover:text-yellow-300 bg-yellow-500/20 hover:bg-yellow-500/30 px-3 py-1.5 rounded-lg border border-yellow-500/30 transition group"
              >
                Sign up as Theater Manager
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {/* Customer Signup Card */}
        <div className="bg-neutral-900/70 border border-white/10 rounded-3xl p-7 sm:p-9 backdrop-blur-xl shadow-2xl">
          <div className="text-center mb-6">
            <Link to="/" className="text-3xl font-black text-white tracking-tight">
              CineVerse<span className="text-yellow-500">.</span>
            </Link>
            <h1 className="text-xl font-bold text-white mt-3">Create Customer Account</h1>
            <p className="text-neutral-400 text-xs mt-1">
              Book movie tickets, select favorite seats, and access digital passes.
            </p>
          </div>

          {error && (
            <div className="mb-5 bg-red-500/15 border border-red-500/40 text-red-200 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-medium">
              <AlertCircle size={16} className="text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-1.5">
                Mobile Number <span className="text-neutral-500 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-neutral-500 outline-none transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-neutral-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="text-neutral-300 text-xs font-bold uppercase tracking-wider block mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-black/60 border border-white/10 focus:border-yellow-500 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-neutral-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold py-3.5 rounded-xl transition hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <Ticket size={18} />
                  <span>Create Customer Account</span>
                </>
              )}
            </button>
          </form>

          {/* Login switch */}
          <div className="mt-6 text-center text-xs text-neutral-400">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                navigate('/');
                openAuthModal('login');
              }}
              className="text-yellow-500 font-bold hover:underline"
            >
              Sign In
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
