import React, { useState } from 'react';
import { Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Sparkles, User, Phone } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';

export const AuthCard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectTo = searchParams.get('redirect') || '/';

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fillQuickDemo = (role: 'customer' | 'manager') => {
    setMode('signin');
    setErrorMessage('');
    setSuccessMessage('');
    if (role === 'customer') {
      setEmail('customer@cinepass.com');
      setPassword('Password123!');
    } else {
      setEmail('manager@cinepass.com');
      setPassword('Password123!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (mode === 'signup' && !fullName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'signin') {
        const res = await api.login(email, password);
        if (res.success && res.data) {
          setSuccessMessage(`Welcome back, ${res.data.user.fullName}! Redirecting...`);
          setTimeout(() => {
            navigate(redirectTo);
          }, 800);
        } else {
          setErrorMessage(res.error || 'Invalid email or password.');
        }
      } else {
        const res = await api.register(fullName, email, password, mobileNumber);
        if (res.success && res.data) {
          setSuccessMessage(`Account created! Welcome to CinePass, ${res.data.user.fullName}!`);
          setTimeout(() => {
            navigate(redirectTo);
          }, 800);
        } else {
          setErrorMessage(res.error || 'Failed to create account.');
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px] bg-[#11141c]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] p-7 sm:p-9 text-left">
      {/* Tab Switcher */}
      <div className="flex bg-white/5 p-1 rounded-xl mb-6 border border-white/10">
        <button
          type="button"
          onClick={() => {
            setMode('signin');
            setErrorMessage('');
          }}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            mode === 'signin'
              ? 'bg-[#f5a623] text-black shadow-md shadow-[#f5a623]/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('signup');
            setErrorMessage('');
          }}
          className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
            mode === 'signup'
              ? 'bg-[#f5a623] text-black shadow-md shadow-[#f5a623]/20'
              : 'text-neutral-400 hover:text-white'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Card Header */}
      <div className="text-center mb-5">
        <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white tracking-tight">
          {mode === 'signin' ? 'Welcome Back' : 'Join CinePass'}
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1">
          {mode === 'signin'
            ? 'Sign in to reserve seats and manage your bookings.'
            : 'Register for instant seat locks and VIP cinema privileges.'}
        </p>
      </div>

      {/* Quick Demo Fill Buttons */}
      <div className="flex items-center gap-2 mb-5">
        <button
          type="button"
          onClick={() => fillQuickDemo('customer')}
          className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-neutral-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-[#f5a623]" />
          <span>Demo Customer</span>
        </button>
        <button
          type="button"
          onClick={() => fillQuickDemo('manager')}
          className="flex-1 py-1.5 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-neutral-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-purple-400" />
          <span>Demo Manager</span>
        </button>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === 'signup' && (
          <>
            <div>
              <label className="text-[11px] font-medium text-neutral-400 mb-1 block" htmlFor="fullName">
                Full Name
              </label>
              <div className="relative">
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Marcus Levin"
                  disabled={isLoading}
                  className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none transition-all"
                />
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-neutral-400 mb-1 block" htmlFor="mobileNumber">
                Mobile Number (Optional)
              </label>
              <div className="relative">
                <input
                  id="mobileNumber"
                  type="tel"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="+60123456789"
                  disabled={isLoading}
                  className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] rounded-xl pl-9 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none transition-all"
                />
                <Phone className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </>
        )}

        <div>
          <label className="text-[11px] font-medium text-neutral-400 mb-1 block" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@domain.com"
            disabled={isLoading}
            className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none transition-all"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-neutral-400 mb-1 block" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              disabled={isLoading}
              className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] focus:ring-1 focus:ring-[#f5a623] rounded-xl px-4 py-2.5 pr-10 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-neutral-400 hover:text-white transition-colors absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-3 py-3 rounded-xl bg-[#f5a623] hover:bg-[#e09612] active:bg-[#c9830c] text-black font-semibold text-sm transition-all duration-200 cursor-pointer shadow-lg shadow-[#f5a623]/25 flex items-center justify-center gap-2 disabled:opacity-60 select-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{mode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
            </>
          ) : (
            <span>{mode === 'signin' ? 'Sign In to Account' : 'Complete Registration'}</span>
          )}
        </button>
      </form>
    </div>
  );
};
