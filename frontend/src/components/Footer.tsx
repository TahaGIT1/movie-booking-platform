import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Film, Calendar, ShieldCheck, Mail, Send, MapPin, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#07080a] text-neutral-400 border-t border-white/10 mt-16 text-xs sm:text-sm">
      {/* Experience formats marquee / badge ribbon */}
      <div className="border-b border-white/10 bg-white/5 py-4 px-4 sm:px-8">
        <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#f5a623]" />
            Official Premium Experience Formats
          </span>
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 font-mono text-[11px] text-neutral-300">
            <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-white font-bold">
              IMAX LASER
            </span>
            <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-white font-bold">
              DOLBY ATMOS
            </span>
            <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-white font-bold">
              SCREENX 270°
            </span>
            <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-white font-bold">
              4DX MOTION
            </span>
            <span className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-white font-bold">
              AURUM GETHA LUX
            </span>
          </div>
        </div>
      </div>

      {/* Main Footer Container */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-white/10">
          {/* Brand Info & App */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-heading font-black tracking-tight text-white">CineVerse</span>
              <span className="w-2 h-2 rounded-full bg-[#f5a623] inline-block shadow-[0_0_8px_#f5a623]" />
            </Link>
            <p className="text-neutral-400 leading-relaxed max-w-sm text-xs sm:text-sm">
              Malaysia & Southeast Asia's premier destination for cinema showtimes, blockbuster pre-booking, live music festivals, broadway stage plays, and 4K digital streams.
            </p>

            {/* Newsletter Subscription */}
            <div className="pt-2">
              <span className="block text-xs font-semibold uppercase tracking-wider text-white mb-2">
                Subscribe to Premiere Alerts
              </span>
              <form onSubmit={handleSubscribe} className="flex max-w-sm gap-2">
                <div className="relative flex-1">
                  <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    className="w-full bg-white/5 border border-white/15 focus:border-[#f5a623] rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-neutral-500 outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[#f5a623] hover:bg-[#e09612] text-black font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Join</span>
                </button>
              </form>
              {subscribed && (
                <span className="text-[11px] text-emerald-400 mt-1.5 block">
                  ✓ You have been subscribed to VIP premiere showtime updates!
                </span>
              )}
            </div>
          </div>

          {/* Column 1: Movies & Cinema */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Film className="w-3.5 h-3.5 text-[#f5a623]" />
              Movies & Cinema
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Now Showing Blockbusters
                </Link>
              </li>
              <li>
                <Link to="/#coming-soon" className="hover:text-white transition-colors">
                  Upcoming Releases 2024–2025
                </Link>
              </li>
              <li>
                <Link to="/theatres" className="hover:text-white transition-colors">
                  Browse Theatres & Hall Types
                </Link>
              </li>
              <li>
                <Link to="/offers" className="hover:text-white transition-colors">
                  Cinema Promotions & Card Deals
                </Link>
              </li>
              <li>
                <Link to="/#imax" className="hover:text-white transition-colors">
                  IMAX 70MM Screenings
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Live Events & Entertainment */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#f5a623]" />
              Live & Sports
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/events" className="hover:text-white transition-colors">
                  Global Music Festivals & Concerts
                </Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-white transition-colors">
                  Stand-up Comedy & Tours
                </Link>
              </li>
              <li>
                <Link to="/plays" className="hover:text-white transition-colors">
                  Broadway Musicals & Stage Plays
                </Link>
              </li>
              <li>
                <Link to="/sports" className="hover:text-white transition-colors">
                  F1 & Premier League Screenings
                </Link>
              </li>
              <li>
                <Link to="/activities" className="hover:text-white transition-colors">
                  VR Holodeck & Go-Kart Tracks
                </Link>
              </li>
              <li>
                <Link to="/streams" className="hover:text-white transition-colors">
                  Digital Premieres & Streams
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Help & Support */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#f5a623]" />
              Support & Security
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link to="/bookings" className="hover:text-white transition-colors">
                  My Bookings & QR Tickets
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-white transition-colors">
                  VIP Club & Loyalty Points
                </Link>
              </li>
              <li>
                <a href="#faq" onClick={(e) => { e.preventDefault(); alert("24/7 Support Hotline: 1800-88-CINE (2463) or email help@cinepass.com"); }} className="hover:text-white transition-colors">
                  24/7 Help Desk & FAQ
                </a>
              </li>
              <li>
                <a href="#refund" onClick={(e) => { e.preventDefault(); alert("Tickets can be rescheduled or refunded up to 2 hours before showtime."); }} className="hover:text-white transition-colors">
                  Cancellation & Refund Policy
                </a>
              </li>
              <li>
                <a href="#corporate" onClick={(e) => { e.preventDefault(); alert("For private hall rentals, corporate screenings and school packages, contact corporate@cinepass.com"); }} className="hover:text-white transition-colors">
                  Private Hall Rentals
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-neutral-500">
            <span>© 2024–2026 CinePass Technologies Sdn. Bhd. All rights reserved.</span>
            <span>•</span>
            <Link to="/login" className="hover:text-neutral-300">Staff Portal</Link>
            <span>•</span>
            <span className="hover:text-neutral-300 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-neutral-300 cursor-pointer">Terms of Service</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-neutral-400 flex items-center gap-1.5 text-xs">
              <MapPin className="w-3.5 h-3.5 text-[#f5a623]" />
              Kuala Lumpur, Malaysia
            </span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Scroll to Top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};

