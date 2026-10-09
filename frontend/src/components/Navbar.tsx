import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, MapPin, ChevronDown, User, Tag, Film } from 'lucide-react';

interface NavbarProps {
  onOpenSearch?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSearch }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState('Malaysia, Global');
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
  { label: 'Movies', path: '/' },
  { label: 'Cinemas', path: '/theatres' },
  { label: 'Offers', path: '/offers' },
];

  const locations = [
    'Malaysia, Global',
    'Kuala Lumpur, MY',
    'Petaling Jaya, MY',
    'Penang, MY',
    'Johor Bahru, MY',
    'Singapore, SG',
  ];

  const isLinkActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-gradient-to-b from-black/95 via-black/85 to-black/70 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 h-18 sm:h-20 flex items-center justify-between">
          {/* LEFT: Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group select-none cursor-pointer"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-xl sm:text-2xl font-heading font-extrabold tracking-tight text-white group-hover:text-neutral-200 transition-colors">CineVerse</span>
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
                  className={`text-xs xl:text-sm tracking-wide transition-all duration-200 cursor-pointer ${
                    active
                      ? 'border border-white/30 bg-white/10 text-white font-medium px-4 py-1.5 rounded-full shadow-[0_0_12px_rgba(245,166,35,0.15)]'
                      : 'text-neutral-400 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </NavLink>
              );
            })}

            {/* Location selector dropdown */}
            <div className="relative ml-1">
              <button
                onClick={() => setLocationDropdownOpen(!locationDropdownOpen)}
                className="flex items-center gap-1 text-xs xl:text-sm text-neutral-300 hover:text-white px-3 py-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span>{selectedLocation}</span>
                <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
              </button>

              {locationDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 w-48 bg-[#12151c]/95 backdrop-blur-xl border border-white/15 rounded-xl shadow-2xl py-2 z-50">
                  <div className="px-3 py-1 text-[10px] uppercase font-semibold text-neutral-400 tracking-wider flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#f5a623]" />
                    Select Region
                  </div>
                  {locations.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setSelectedLocation(loc);
                        setLocationDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs transition-colors hover:bg-white/10 cursor-pointer ${
                        selectedLocation === loc
                          ? 'text-[#f5a623] font-medium'
                          : 'text-neutral-300'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* RIGHT: User Profile, Search, Hamburger */}
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
            {/* User Profile */}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 p-1 rounded-full hover:bg-white/5 transition-colors group cursor-pointer"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full overflow-hidden border border-white/20 ring-1 ring-white/10 group-hover:border-[#f5a623] transition-colors bg-neutral-800 flex items-center justify-center">
                <img
                  src="/images/avatars/marcus.jpg"
                  alt="Marcus Levin"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <User className="w-4 h-4 text-neutral-400 group-hover:text-white" />
              </div>
              <span className="hidden sm:inline-block text-xs font-medium text-neutral-200 group-hover:text-white transition-colors">
                Marcus Levin
              </span>
            </Link>

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
              <div className="my-5 p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-[#f5a623]/50">
                    <img
                      src="/images/avatars/marcus.jpg"
                      alt="Marcus Levin"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Marcus Levin</h4>
                    <p className="text-xs text-neutral-400">VIP Platinum Member</p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs text-[#f5a623] hover:underline font-semibold"
                >
                  View
                </Link>
              </div>

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
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#f5a623]" />
                      )}
                    </Link>
                  );
                })}

                <div className="pt-3 border-t border-white/10 mt-3 space-y-1">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 mb-2 px-3">
                    Venues & Deals
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
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3.5 py-2 text-sm text-[#f5a623] hover:underline rounded-lg font-semibold"
                  >
                    Login / Sign In
                  </Link>
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


