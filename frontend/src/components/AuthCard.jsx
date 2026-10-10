import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, Sparkles, User, Phone, Mail, Lock, Building2, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export const AuthCard = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const redirectTo = searchParams.get('redirect') || '/';
    const [mode, setMode] = useState('signin');
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [mobileNumber, setMobileNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const fillQuickDemo = (role) => {
        setMode('signin');
        setErrorMessage('');
        setSuccessMessage('');
        if (role === 'admin') {
            setEmail('admin@cineverse.com');
            setPassword('Pass@123');
        } else if (role === 'manager') {
            setEmail('inox@cinepolis.com');
            setPassword('Pass@123');
        } else {
            setEmail('prateekrnerli@gmail.com');
            setPassword('Pass@123');
        }
    };

    const handleSubmit = async (e) => {
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
                const res = await api.login({ email: email.trim(), password });
                if (res.success && res.data) {
                    setSuccessMessage(`Welcome back, ${res.data.user.fullName}! Redirecting...`);
                    setTimeout(() => {
                        login(res.data.accessToken, res.data.user);
                    }, 600);
                } else {
                    setErrorMessage(res.error || 'Invalid email or password.');
                }
            } else {
                const res = await api.register({
                    fullName: fullName.trim(),
                    email: email.trim(),
                    password,
                    mobileNumber: mobileNumber.trim() || undefined,
                    role: 'CUSTOMER',
                });
                if (res.success && res.data) {
                    setSuccessMessage(`Account created! Welcome, ${res.data.user.fullName}!`);
                    setTimeout(() => {
                        login(res.data.accessToken, res.data.user);
                    }, 600);
                } else {
                    setErrorMessage(res.error || 'Failed to create account.');
                }
            }
        } catch (err) {
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
                    {mode === 'signin' ? 'Welcome to CineVerse' : 'Join CineVerse'}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                    {mode === 'signin'
                        ? 'Sign in to access your bookings and exclusive offers'
                        : 'Create your account to start booking movies & shows'}
                </p>
            </div>

            {/* Notifications */}
            {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}
            {successMessage && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                    {successMessage}
                </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'signup' && (
                    <div>
                        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                            Full Name
                        </label>
                        <div className="relative">
                            <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="John Doe"
                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-[#f5a623] transition"
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                        Email Address
                    </label>
                    <div className="relative">
                        <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-[#f5a623] transition"
                        />
                    </div>
                </div>

                {mode === 'signup' && (
                    <div>
                        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                            Mobile Number <span className="text-neutral-500 font-normal">(optional)</span>
                        </label>
                        <div className="relative">
                            <Phone className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="tel"
                                value={mobileNumber}
                                onChange={(e) => setMobileNumber(e.target.value)}
                                placeholder="+91 98765 43210"
                                className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-[#f5a623] transition"
                            />
                        </div>
                    </div>
                )}

                <div>
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5">
                        Password
                    </label>
                    <div className="relative">
                        <Lock className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-[#f5a623] transition"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#f5a623] hover:bg-[#e09612] text-black font-extrabold py-3.5 rounded-xl transition shadow-lg shadow-[#f5a623]/25 cursor-pointer disabled:opacity-50 mt-2 text-sm flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <span>Processing...</span>
                    ) : (
                        <span>{mode === 'signin' ? 'Sign In to CineVerse' : 'Create Customer Account'}</span>
                    )}
                </button>
            </form>

            {/* Quick Demo Logins Helper */}
            {mode === 'signin' && (
                <div className="mt-5 pt-4 border-t border-white/10">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 block mb-2 text-center">
                        Quick Demo Fill:
                    </span>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => fillQuickDemo('admin')}
                            className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-yellow-400 font-semibold transition cursor-pointer text-center"
                        >
                            Super Admin
                        </button>
                        <button
                            type="button"
                            onClick={() => fillQuickDemo('manager')}
                            className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-neutral-300 font-medium transition cursor-pointer text-center"
                        >
                            Manager
                        </button>
                        <button
                            type="button"
                            onClick={() => fillQuickDemo('customer')}
                            className="flex-1 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] text-neutral-400 font-medium transition cursor-pointer text-center"
                        >
                            Customer
                        </button>
                    </div>
                </div>
            )}

            {/* Theatre Manager Onboarding Banner */}
            <div className="mt-5 pt-4 border-t border-white/10">
                <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl p-3 flex items-center justify-between gap-3 text-left">
                    <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center shrink-0">
                            <Building2 size={15} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white leading-tight">Theatre Manager?</p>
                            <p className="text-[10px] text-neutral-400">List and manage your cinema venue</p>
                        </div>
                    </div>
                    <Link
                        to="/theatre/signup"
                        className="px-2.5 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-black text-[11px] font-bold whitespace-nowrap transition flex items-center gap-1 cursor-pointer"
                    >
                        <span>Manager Sign Up</span>
                        <ArrowRight size={11} />
                    </Link>
                </div>
            </div>
        </div>
    );
};
