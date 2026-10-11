import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Menu,
  X,
  ChevronDown,
  User,
  Ticket,
  LogOut,
  Building2
} from 'lucide-react';
import { NotificationBell } from '../notifications/NotificationBell';
import { MovieSearchBar } from '../common/MovieSearchBar';

export const Navbar = () => {
  const { user, token, logout, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  // Close menus on route change
  useEffect(() => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="sticky top-0 z-50 bg-[#0b0c10]/85 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 lg:px-12 py-3 transition-all">
      <div className="max-w-[1720px] mx-auto flex justify-between items-center gap-4 sm:gap-6">
        {/* Left Side: Logo & Primary Tab */}
        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
          <Link to="/" className="flex items-center group">
            <img 
              src="/ticket-total-logo.png" 
              alt="Ticket Total" 
              className="h-9 sm:h-11 w-auto object-contain drop-shadow-[0_2px_12px_rgba(255,255,255,0.18)] hover:scale-105 transition-transform duration-200" 
            />
          </Link>

          <div className="hidden lg:flex items-center gap-2 text-sm font-semibold">
            <Link
              to="/"
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                isActive('/') && location.pathname === '/'
                  ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Movies
            </Link>

            {token && (
              <Link
                to="/my-bookings"
                className={`px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                  isActive('/my-bookings')
                    ? 'bg-white/15 text-white border border-white/20 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Ticket className="w-3.5 h-3.5 text-[#f5a623]" />
                My Bookings
              </Link>
            )}
          </div>
        </div>

        {/* Center: Interactive Movie Search Bar with Filters */}
        <div className="hidden sm:flex flex-1 justify-center max-w-lg lg:max-w-xl mx-2">
          <MovieSearchBar />
        </div>

        {/* Right Action Icons & Auth */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {!token && (
            <Link
              to="/theatre/signup"
              className="hidden xl:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[#f5a623]/30 bg-[#f5a623]/10 hover:bg-[#f5a623]/20 text-[#f5a623] text-xs font-bold transition"
            >
              <Building2 className="w-3.5 h-3.5" />
              List Cinema
            </Link>
          )}

          {user?.role === 'SUPER_ADMIN' && (
            <Link
              to="/admin"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 transition text-xs font-bold"
            >
              Admin Console
            </Link>
          )}

          {user?.role === 'THEATRE_MANAGER' && (
            <Link
              to="/manager"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#f5a623]/15 border border-[#f5a623]/30 text-[#f5a623] hover:bg-[#f5a623]/25 transition text-xs font-bold"
            >
              Manager Console
            </Link>
          )}

          {/* In-App Notifications Bell */}
          {token && <NotificationBell />}

          {/* User Profile Dropdown or Login Button */}
          {token && user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#f5a623]/20 text-[#f5a623] font-bold text-xs flex items-center justify-center border border-[#f5a623]/30">
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline text-xs font-bold text-neutral-200 max-w-[110px] truncate">
                  {user.fullName || 'Account'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {/* Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#11131c] border border-white/10 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="text-xs font-bold text-white truncate">{user.fullName || 'User'}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{user.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-neutral-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <User className="w-4 h-4 text-[#f5a623]" />
                    <span>Profile & Preferences</span>
                  </Link>

                  <Link
                    to="/my-bookings"
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-neutral-300 hover:text-white hover:bg-white/5 transition"
                  >
                    <Ticket className="w-4 h-4 text-[#f5a623]" />
                    <span>My Bookings</span>
                  </Link>

                  <div className="my-1 border-t border-white/10" />

                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="px-4 py-2 rounded-xl bg-[#f5a623] hover:bg-[#e09612] text-black text-xs font-bold transition shadow-lg cursor-pointer"
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white transition"
            aria-label="Toggle Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu & Mobile Search Overlay */}
      {isMobileMenuOpen && (
        <div className="sm:hidden mt-3 pt-3 border-t border-white/10 space-y-3 pb-2">
          {/* Mobile Search Bar with Filters */}
          <div className="px-1">
            <MovieSearchBar />
          </div>

          <div className="space-y-1 pt-1">
            <Link
              to="/"
              className="block px-3 py-2 rounded-lg text-sm font-semibold text-neutral-300 hover:bg-white/5 hover:text-white"
            >
              Movies Catalog
            </Link>
            {token && (
              <>
                <Link
                  to="/my-bookings"
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-neutral-300 hover:bg-white/5 hover:text-white"
                >
                  My Bookings
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-lg text-sm font-semibold text-neutral-300 hover:bg-white/5 hover:text-white"
                >
                  Profile & Preferences
                </Link>
              </>
            )}
            {!token && (
              <Link
                to="/theatre/signup"
                className="block px-3 py-2 rounded-lg text-sm font-semibold text-[#f5a623] hover:bg-[#f5a623]/10"
              >
                List Your Cinema
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
