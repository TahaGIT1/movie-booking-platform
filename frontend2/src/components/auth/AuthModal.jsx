import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Building2, 
  ArrowRight, 
  Mail, 
  Lock, 
  User, 
  KeyRound, 
  ArrowLeft, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { api } from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';

export const AuthModal = () => {
  const navigate = useNavigate();
  const { isAuthModalOpen, closeAuthModal, authModalMode, setAuthModalMode, login } = useAuth();
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // OTP & Password Reset states
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Multi-step sub-state: 'form' | 'otp'
  const [step, setStep] = useState('form');
  
  // Status feedback
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Resend OTP Countdown timer (seconds)
  const [countdown, setCountdown] = useState(0);

  // Reset state when modal opens or mode switches
  useEffect(() => {
    if (isAuthModalOpen) {
      setStep('form');
      setOtp('');
      setError('');
      setSuccessMsg('');
      setLoading(false);
    }
  }, [isAuthModalOpen, authModalMode]);

  // Handle countdown interval
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  if (!isAuthModalOpen) return null;

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.login({ email, password });
      login(result.data.accessToken, result.data.user);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup: Step 1 - Send Verification OTP
  const handleSignupRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendSignupOtp({ email, fullName });
      setSuccessMsg(res.message || `Verification code sent to ${email}`);
      setStep('otp');
      setCountdown(45);
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Signup: Step 2 - Verify OTP & Create Account
  const handleSignupComplete = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.register({
        email,
        password,
        fullName,
        role: 'CUSTOMER',
        otp: cleanOtp
      });

      if (result.success) {
        login(result.data.accessToken, result.data.user);
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (err) {
      setError(err.message || 'Invalid verification code or registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password: Step 1 - Request Reset OTP (Checks if email exists)
  const handleForgotRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendForgotPasswordOtp({ email });
      setSuccessMsg(res.message || `Password reset code sent to ${email}`);
      setStep('otp');
      setCountdown(45);
    } catch (err) {
      setError(err.message || 'No account found with this email address.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password: Step 2 - Reset Password with OTP
  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the 6-digit reset code');
      return;
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.resetPassword({
        email,
        otp: cleanOtp,
        newPassword
      });

      // Successful password reset! Switch to login mode
      setSuccessMsg('Password updated successfully! Please sign in with your new password.');
      setPassword('');
      setOtp('');
      setStep('form');
      setAuthModalMode('login');
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please verify your OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP helper
  const handleResendOtp = async () => {
    if (countdown > 0 || loading) return;
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (authModalMode === 'signup') {
        await api.sendSignupOtp({ email, fullName });
      } else if (authModalMode === 'forgot') {
        await api.sendForgotPasswordOtp({ email });
      }
      setSuccessMsg(`A fresh verification code was sent to ${email}`);
      setCountdown(45);
    } catch (err) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300 p-4">
      <div className="bg-[#0b0c10]/95 border border-white/10 p-7 sm:p-8 rounded-3xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.8)] relative animate-in zoom-in-95 duration-300">
        
        {/* Close Button */}
        <button 
          onClick={closeAuthModal} 
          className="absolute top-5 right-5 text-neutral-400 hover:text-white transition p-1 hover:bg-white/5 rounded-full"
        >
          <X size={20} />
        </button>
        
        {/* Header Branding */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-black text-white tracking-tight">
            CineVerse<span className="text-yellow-500">.</span>
          </h2>
          <p className="text-neutral-400 text-xs sm:text-sm mt-1.5">
            {authModalMode === 'login' && 'Welcome back! Please login to your account.'}
            {authModalMode === 'signup' && (step === 'form' ? 'Create an account to book your tickets.' : 'Verify your email address.')}
            {authModalMode === 'forgot' && (step === 'form' ? 'Reset your CineVerse account password.' : 'Enter the code sent to your email.')}
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="bg-red-500/15 border border-red-500/40 text-red-300 p-3 rounded-xl mb-5 text-xs text-center font-medium animate-in fade-in">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl mb-5 text-xs text-center font-medium animate-in fade-in flex items-center justify-center gap-1.5">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* -------------------- 1. LOGIN MODE -------------------- */}
        {authModalMode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-neutral-400 text-xs uppercase tracking-wider font-bold mb-1.5 block">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input 
                  type="email" 
                  className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-3 rounded-xl text-sm text-white outline-none focus:border-yellow-500 transition shadow-inner" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-neutral-400 text-xs uppercase tracking-wider font-bold block">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setSuccessMsg('');
                    setStep('form');
                    setAuthModalMode('forgot');
                  }}
                  className="text-xs text-yellow-500 hover:text-yellow-400 font-semibold hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  className="w-full bg-black/60 border border-white/10 pl-10 pr-10 py-3 rounded-xl text-sm text-white outline-none focus:border-yellow-500 transition shadow-inner"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
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

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold py-3.5 rounded-xl transition hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                'Sign In'
              )}
            </button>

            <div className="mt-5 text-center text-xs text-neutral-400">
              Don't have an account?{' '}
              <button 
                type="button"
                onClick={() => {
                  setError('');
                  setSuccessMsg('');
                  setStep('form');
                  setAuthModalMode('signup');
                }} 
                className="text-yellow-500 font-bold hover:underline cursor-pointer"
              >
                Sign up
              </button>
            </div>
          </form>
        )}

        {/* -------------------- 2. SIGNUP MODE -------------------- */}
        {authModalMode === 'signup' && (
          <>
            {step === 'form' ? (
              <form onSubmit={handleSignupRequestOtp} className="space-y-4">
                <div>
                  <label className="text-neutral-400 text-xs uppercase tracking-wider font-bold mb-1.5 block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input 
                      type="text" 
                      className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-3 rounded-xl text-sm text-white outline-none focus:border-yellow-500 transition shadow-inner" 
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      required
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-neutral-400 text-xs uppercase tracking-wider font-bold mb-1.5 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input 
                      type="email" 
                      className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-3 rounded-xl text-sm text-white outline-none focus:border-yellow-500 transition shadow-inner" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-neutral-400 text-xs uppercase tracking-wider font-bold mb-1.5 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      className="w-full bg-black/60 border border-white/10 pl-10 pr-10 py-3 rounded-xl text-sm text-white outline-none focus:border-yellow-500 transition shadow-inner"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      placeholder="••••••••"
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

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold py-3.5 rounded-xl transition hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] mt-2 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue & Verify Email</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="mt-5 text-center text-xs text-neutral-400">
                  Already have an account?{' '}
                  <button 
                    type="button"
                    onClick={() => {
                      setError('');
                      setSuccessMsg('');
                      setAuthModalMode('login');
                    }} 
                    className="text-yellow-500 font-bold hover:underline cursor-pointer"
                  >
                    Log in
                  </button>
                </div>
              </form>
            ) : (
              /* Signup Step 2: OTP Verification */
              <form onSubmit={handleSignupComplete} className="space-y-4 animate-in fade-in">
                <div className="text-center p-3.5 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                  <ShieldCheck size={26} className="text-yellow-400 mx-auto mb-1.5" />
                  <p className="text-xs text-neutral-300">
                    We sent a 6-digit one-time code to
                  </p>
                  <p className="text-xs font-bold text-white mt-0.5">{email}</p>
                </div>

                <div>
                  <label className="text-neutral-400 text-xs uppercase tracking-wider font-bold mb-1.5 block text-center">
                    Enter 6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-yellow-500" />
                    <input 
                      type="text" 
                      maxLength={6}
                      autoFocus
                      autoComplete="one-time-code"
                      className="w-full bg-black/70 border border-yellow-500/40 text-center tracking-[8px] font-mono font-bold text-2xl text-yellow-400 pl-10 pr-4 py-3.5 rounded-xl outline-none focus:border-yellow-400 focus:shadow-[0_0_15px_rgba(234,179,8,0.2)] transition" 
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="••••••"
                    />
                  </div>
                </div>

                {/* Resend OTP Bar */}
                <div className="flex items-center justify-between text-xs px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('form');
                      setError('');
                    }}
                    className="text-neutral-400 hover:text-white flex items-center gap-1 transition"
                  >
                    <ArrowLeft size={13} />
                    <span>Change Details</span>
                  </button>

                  <button
                    type="button"
                    disabled={countdown > 0 || loading}
                    onClick={handleResendOtp}
                    className="text-yellow-500 hover:text-yellow-400 disabled:text-neutral-500 font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    <span>{countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}</span>
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || otp.length < 6}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-extrabold py-3.5 rounded-xl transition hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] mt-2 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Verifying & Creating Account...</span>
                    </>
                  ) : (
                    <span>Verify & Complete Signup</span>
                  )}
                </button>
              </form>
            )}

            {/* Theatre Manager link */}
            <div className="mt-5 pt-4 border-t border-white/10 text-center">
              <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-2xl p-3 flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0">
                    <Building2 size={15} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Theatre Manager?</p>
                    <p className="text-[10px] text-neutral-400">List and manage your cinema</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    closeAuthModal();
                    navigate('/theatre/signup');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-[11px] font-bold whitespace-nowrap transition flex items-center gap-1 cursor-pointer"
                >
                  <span>Manager Signup</span>
                  <ArrowRight size={11} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* -------------------- 3. FORGOT PASSWORD MODE -------------------- */}
        {authModalMode === 'forgot' && (
          <>
            {step === 'form' ? (
              /* Forgot Password Step 1: Input Email */
              <form onSubmit={handleForgotRequestOtp} className="space-y-4">
                <div>
                  <label className="text-neutral-400 text-xs uppercase tracking-wider font-bold mb-1.5 block">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input 
                      type="email" 
                      className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-3 rounded-xl text-sm text-white outline-none focus:border-yellow-500 transition shadow-inner" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1.5 leading-relaxed">
                    We will check if your account exists and send a secure 6-digit OTP code to this email.
                  </p>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold py-3.5 rounded-xl transition hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] mt-2 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Checking Account...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Reset Code</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setSuccessMsg('');
                      setAuthModalMode('login');
                    }}
                    className="text-xs text-neutral-400 hover:text-white inline-flex items-center gap-1 transition"
                  >
                    <ArrowLeft size={13} />
                    <span>Back to Login</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Forgot Password Step 2: Input OTP & New Password */
              <form onSubmit={handleForgotResetPassword} className="space-y-4 animate-in fade-in">
                <div className="text-center p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl">
                  <KeyRound size={22} className="text-yellow-400 mx-auto mb-1" />
                  <p className="text-xs text-neutral-300">
                    Reset code sent to <strong className="text-white">{email}</strong>
                  </p>
                </div>

                {/* 6-Digit Code */}
                <div>
                  <label className="text-neutral-400 text-xs uppercase tracking-wider font-bold mb-1.5 block">
                    6-Digit Security Code
                  </label>
                  <input 
                    type="text" 
                    maxLength={6}
                    autoFocus
                    autoComplete="one-time-code"
                    className="w-full bg-black/70 border border-yellow-500/40 text-center tracking-[8px] font-mono font-bold text-2xl text-yellow-400 px-4 py-3 rounded-xl outline-none focus:border-yellow-400 focus:shadow-[0_0_15px_rgba(234,179,8,0.2)] transition" 
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    placeholder="••••••"
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="text-neutral-400 text-xs uppercase tracking-wider font-bold mb-1.5 block">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input 
                      type={showNewPassword ? 'text' : 'password'} 
                      className="w-full bg-black/60 border border-white/10 pl-10 pr-10 py-2.5 rounded-xl text-sm text-white outline-none focus:border-yellow-500 transition shadow-inner"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="text-neutral-400 text-xs uppercase tracking-wider font-bold mb-1.5 block">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
                    <input 
                      type={showNewPassword ? 'text' : 'password'} 
                      className="w-full bg-black/60 border border-white/10 pl-10 pr-4 py-2.5 rounded-xl text-sm text-white outline-none focus:border-yellow-500 transition shadow-inner"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {/* Resend & Back helpers */}
                <div className="flex items-center justify-between text-xs px-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('form');
                      setError('');
                    }}
                    className="text-neutral-400 hover:text-white flex items-center gap-1 transition"
                  >
                    <ArrowLeft size={13} />
                    <span>Change Email</span>
                  </button>

                  <button
                    type="button"
                    disabled={countdown > 0 || loading}
                    onClick={handleResendOtp}
                    className="text-yellow-500 hover:text-yellow-400 disabled:text-neutral-500 font-semibold flex items-center gap-1 transition cursor-pointer"
                  >
                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                    <span>{countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}</span>
                  </button>
                </div>

                <button 
                  type="submit" 
                  disabled={loading || otp.length < 6}
                  className="w-full bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 text-black font-extrabold py-3.5 rounded-xl transition hover:shadow-[0_0_20px_rgba(234,179,8,0.3)] mt-2 cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <span>Reset Password</span>
                  )}
                </button>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
};
