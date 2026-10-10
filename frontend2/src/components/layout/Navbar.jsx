
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Menu, ChevronDown, User } from 'lucide-react';

export const Navbar = () => {
  const { user, token, logout, openAuthModal } = useAuth();
  
  return (
    <nav className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-12 py-6 bg-transparent">
      {/* Logo */}
      <Link to="/" className="text-2xl font-bold text-white tracking-tighter flex items-center">
        CineVerse<span className="text-yellow-500 text-3xl leading-none">.</span>
      </Link>

      {/* Center Links */}
      <div className="hidden lg:flex items-center gap-8 text-sm font-medium">
        <Link to="/" className="px-5 py-2 rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md">Movies</Link>
        <Link to="/cinemas" className="text-neutral-400 hover:text-white transition">Cinemas</Link>
        <Link to="/offers" className="text-neutral-400 hover:text-white transition">Offers</Link>
        <div className="flex items-center gap-1 text-neutral-400 cursor-pointer hover:text-white transition">
          Malaysia, Global <ChevronDown size={14} />
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-6">
        {!token && (
          <Link 
            to="/theatre/signup" 
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 text-xs font-bold transition"
          >
            List Your Cinema
          </Link>
        )}

        {user?.role === 'SUPER_ADMIN' && (
          <Link to="/admin" className="text-yellow-500 hover:text-yellow-400 transition font-medium text-sm flex items-center gap-1.5">
            Admin Console
          </Link>
        )}

        {user?.role === 'THEATRE_MANAGER' && (
          <Link to="/manager" className="text-yellow-500 hover:text-yellow-400 transition font-medium text-sm flex items-center gap-1.5">
            Manager Console
          </Link>
        )}
        
        {token && user ? (
          <div className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border border-white/20">
              <User size={16} className="text-neutral-400 group-hover:text-white transition" />
            </div>
            <span className="text-sm text-neutral-300 group-hover:text-white transition">{user.fullName || 'User'}</span>
          </div>
        ) : (
          <button onClick={() => openAuthModal('login')} className="text-sm font-medium text-neutral-300 hover:text-white transition">Login / Sign Up</button>
        )}
        
        <button className="text-neutral-300 hover:text-white transition">
          <Search size={20} />
        </button>
        <button className="text-neutral-300 hover:text-white transition">
          <Menu size={24} />
        </button>
        
        {token && (
          <button onClick={logout} className="text-xs text-red-500/80 hover:text-red-400 transition ml-2">Logout</button>
        )}
      </div>
    </nav>
  );
};
