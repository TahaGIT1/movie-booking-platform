import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, MapPin, ChevronDown, User, Tag, Film, LogOut, Building2, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Navbar = ({ onOpenSearch }) => {
    const { user, token, logout, openAuthModal } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState('Malaysia, Global');
    const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
    const location = useLocation();

    const handleLogout = () => {
        logout();
    };

    const navLinks = [
        { label: 'All Movies', path: '/' },
        { label: 'Streams', path: '/streams' },
        { label: 'Events', path: '/events' },
        { label: 'Plays', path: '/plays' },
        { label: 'Sports', path: '/sports' },
        { label: 'Activities', path: '/activities' },
    ];

    const locations = [
        'Malaysia, Global',
        'Kuala Lumpur, MY',
        'Petaling Jaya, MY',
        'Penang, MY',
        'Johor Bahru, MY',
        'Singapore, SG',
    ];

    const isLinkActive = (path) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <>
            <header className="sticky top-0 z-50 w-full bg-gradient-to-b from-black/95 via-black/85 to-black/70 backdrop-blur-md border-b border-white/5 transition-all">
                <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 h-18 sm:h-20 flex items-center justify-between">
                    {/* LEFT: Logo */}
                    <Link to="/" className="flex items-center gap-2 group select-none cursor-pointer">
                        <div className="flex items-center gap-1.5">
                            <span className="text-xl sm:text-2xl font-heading font-extrabold tracking-tight text-white group-hover:text-neutral-200 transition-colors">
                                CineVerse
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#f5a623] inline-block shadow-[0_0_8px_#f5a623]" />
                        </div>
                    </Link>

                    {/* CENTER: Navigation Links (Desktop) */}
                    <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
                        {navLinks.map((link) => {
                            const active = isLinkActive(link.path);
                            return (
                                <NavLink
                                    key={link.label}
                                    to={link.path}
                                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                                        active
                                            ? 'bg-white/10 text-white border border-white/20 shadow-sm backdrop-blur-md'
                                            : 'text-neutral-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {link.label}
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* RIGHT: Actions */}
                    <div className="flex items-center gap-3 sm:gap-4">
                        {/* Location Selector */}
                        <div className="relative hidden md:block">
                            <button
                                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                                className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-3 py-1.5 rounded-full border border-white/10 hover:border-white/20 bg-white/5 transition-colors cursor-pointer"
                            >
                                <MapPin className="w-3.5 h-3.5 text-[#f5a623]" />
                                <span className="max-w-[120px] truncate">{selectedLocation}</span>
                                <ChevronDown className="w-3 h-3 text-neutral-400" />
                            </button>

                            {locationDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-[#11131c] border border-white/15 rounded-xl shadow-2xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                                    {locations.map((loc) => (
                                        <button
                                            key={loc}
                                            onClick={() => {
                                                setSelectedLocation(loc);
                                                setLocationDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-3.5 py-2 text-xs transition-colors cursor-pointer ${
                                                selectedLocation === loc
                                                    ? 'text-[#f5a623] font-semibold bg-white/5'
                                                    : 'text-neutral-300 hover:text-white hover:bg-white/10'
                                            }`}
                                        >
                                            {loc}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* List Cinema for Managers */}
                        {!token && (
                            <Link
                                to="/theatre/signup"
                                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 text-xs font-bold transition"
                            >
                                <Building2 size={13} />
                                <span>List Your Cinema</span>
                            </Link>
                        )}

                        {/* Role Console Shortcuts */}
                        {user?.role === 'SUPER_ADMIN' && (
                            <Link
                                to="/admin"
                                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 text-xs font-bold transition shadow-sm"
                            >
                                <ShieldCheck size={13} />
                                <span>Admin Console</span>
                            </Link>
                        )}

                        {user?.role === 'THEATRE_MANAGER' && (
                            <Link
                                to="/manager"
                                className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-yellow-500/40 bg-yellow-500/20 text-yellow-400 hover:text-yellow-300 text-xs font-bold transition shadow-sm"
                            >
                                <Building2 size={13} />
                                <span>Manager Console</span>
                            </Link>
                        )}

                        {/* User Profile or Sign In */}
                        {token && user ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/profile"
                                    className="flex items-center gap-2.5 p-1 rounded-full hover:bg-white/5 transition-colors group cursor-pointer"
                                >
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-white/20 ring-1 ring-white/10 group-hover:border-[#f5a623] transition-colors bg-neutral-800 flex items-center justify-center">
                                        <User className="w-4 h-4 text-neutral-400 group-hover:text-white" />
                                    </div>
                                    <div className="hidden sm:flex flex-col text-left">
                                        <span className="text-xs font-semibold text-neutral-200 group-hover:text-white transition-colors truncate max-w-[120px]">
                                            {user.fullName || 'User'}
                                        </span>
                                        {user.role !== 'CUSTOMER' && (
                                            <span className="text-[9px] text-[#f5a623] font-medium leading-none">
                                                {user.role.replace('_', ' ')}
                                            </span>
                                        )}
                                    </div>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    title="Sign Out"
                                    className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => openAuthModal('login')}
                                className="text-xs font-semibold text-black bg-[#f5a623] hover:bg-[#e09612] px-3.5 py-1.5 rounded-full transition-all shadow-md shadow-[#f5a623]/20 cursor-pointer"
                            >
                                Sign In
                            </button>
                        )}

                        {/* Search Icon */}
                        <button
                            onClick={onOpenSearch}
                            aria-label="Search movies, events, shows"
                            className="text-neutral-300 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <Search className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                        </button>

                        {/* Hamburger / Menu Icon */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            aria-label="Toggle menu"
                            className="text-neutral-300 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                        >
                            <Menu className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2]" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Slide-over Side Drawer / Mobile Navigation */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-sm h-full bg-[#0e1017] border-l border-white/10 p-6 flex flex-col justify-between shadow-2xl overflow-y-auto">
                        <div>
                            {/* Header */}
                            <div className="flex items-center justify-between pb-6 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl font-heading font-extrabold text-white">CineVerse</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#f5a623]" />
                                </div>
                                <button
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-white/5 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Profile Card */}
                            {token && user ? (
                                <div className="my-5 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#f5a623]/50 bg-neutral-800 flex items-center justify-center">
                                            <User className="w-5 h-5 text-neutral-300" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-semibold text-white">{user.fullName}</h4>
                                            <p className="text-xs text-[#f5a623]">{user.role.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                    <Link
                                        to="/profile"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-xs text-[#f5a623] hover:underline font-semibold"
                                    >
                                        Profile
                                    </Link>
                                </div>
                            ) : (
                                <div className="my-5 p-4 rounded-xl bg-white/5 border border-white/10 text-center space-y-2">
                                    <p className="text-xs text-neutral-300">Sign in to book tickets and manage orders</p>
                                    <button
                                        onClick={() => {
                                            setMobileMenuOpen(false);
                                            openAuthModal('login');
                                        }}
                                        className="w-full py-2 rounded-lg bg-[#f5a623] text-black text-xs font-bold hover:bg-[#e09612] transition cursor-pointer"
                                    >
                                        Sign In / Register
                                    </button>
                                </div>
                            )}

                            {/* Consoles for Admin / Manager */}
                            {user?.role === 'SUPER_ADMIN' && (
                                <Link
                                    to="/admin"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="mb-3 flex items-center justify-between p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold"
                                >
                                    <span>Super Admin Console</span>
                                    <ShieldCheck size={16} />
                                </Link>
                            )}

                            {user?.role === 'THEATRE_MANAGER' && (
                                <Link
                                    to="/manager"
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="mb-3 flex items-center justify-between p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-bold"
                                >
                                    <span>Theatre Manager Console</span>
                                    <Building2 size={16} />
                                </Link>
                            )}

                            {/* Navigation Items */}
                            <div className="space-y-1">
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2 px-3">
                                    Categories
                                </div>
                                {navLinks.map((link) => {
                                    const active = isLinkActive(link.path);
                                    return (
                                        <Link
                                            key={link.label}
                                            to={link.path}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                                active
                                                    ? 'bg-[#f5a623]/15 text-[#f5a623] border border-[#f5a623]/30 font-semibold'
                                                    : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                                            }`}
                                        >
                                            <span>{link.label}</span>
                                            {active && <span className="w-1.5 h-1.5 rounded-full bg-[#f5a623]" />}
                                        </Link>
                                    );
                                })}

                                <div className="pt-3 border-t border-white/10 mt-3 space-y-1">
                                    <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2 px-3">
                                        Venues &amp; Deals
                                    </div>
                                    <Link
                                        to="/theatres"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between px-3.5 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg"
                                    >
                                        <span>Browse Theatres</span>
                                        <Film className="w-3.5 h-3.5 text-neutral-500" />
                                    </Link>
                                    <Link
                                        to="/theatre/signup"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between px-3.5 py-2 text-sm text-yellow-400 hover:bg-white/5 rounded-lg font-semibold"
                                    >
                                        <span>List Your Cinema</span>
                                        <Building2 className="w-3.5 h-3.5" />
                                    </Link>
                                    <Link
                                        to="/offers"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="flex items-center justify-between px-3.5 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg"
                                    >
                                        <span>Cinema Offers</span>
                                        <Tag className="w-3.5 h-3.5 text-[#f5a623]" />
                                    </Link>
                                    <Link
                                        to="/bookings"
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="block px-3.5 py-2 text-sm text-neutral-300 hover:text-white hover:bg-white/5 rounded-lg"
                                    >
                                        My Bookings
                                    </Link>
                                    {token && user ? (
                                        <button
                                            onClick={() => {
                                                handleLogout();
                                                setMobileMenuOpen(false);
                                            }}
                                            className="w-full text-left px-3.5 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-white/5 rounded-lg font-medium flex items-center justify-between cursor-pointer"
                                        >
                                            <span>Sign Out ({user.fullName?.split(' ')[0]})</span>
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                openAuthModal('login');
                                            }}
                                            className="w-full text-left px-3.5 py-2 text-sm text-[#f5a623] hover:underline rounded-lg font-semibold cursor-pointer"
                                        >
                                            Login / Sign In
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Footer Region Selector */}
                        <div className="pt-4 border-t border-white/10 mt-6">
                            <div className="flex items-center gap-2 text-xs text-neutral-400">
                                <MapPin className="w-3.5 h-3.5 text-[#f5a623]" />
                                <span>Region: {selectedLocation}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
