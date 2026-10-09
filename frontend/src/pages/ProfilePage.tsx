import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Award, Ticket, CreditCard, ChevronRight, LogOut } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-10 max-w-[1000px] mx-auto">
      <div className="space-y-8">
        {/* Profile Card Header */}
        <div className="bg-[#11131c] border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 shadow-2xl">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#f5a623] shadow-[0_0_20px_rgba(245,166,35,0.3)] bg-neutral-800">
            <img
              src="/images/avatars/marcus.jpg"
              alt="Marcus Levin"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-heading font-black text-white">
                Marcus Levin
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f5a623]/20 text-[#f5a623] border border-[#f5a623]/30">
                VIP PLATINUM
              </span>
            </div>

            <p className="text-xs sm:text-sm text-neutral-400 mt-1">
              Cinema Enthusiast & Premier Festival Member
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-xs text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#f5a623]" />
                marcus.levin@cinema.com
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#f5a623]" />
                Kuala Lumpur, Malaysia
              </span>
            </div>
          </div>

          <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-6 w-full sm:w-auto">
            <div className="text-2xl font-heading font-black text-[#f5a623]">
              1,450
            </div>
            <div className="text-[11px] text-neutral-400 uppercase tracking-wider">
              Reward Points
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/bookings"
            className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-[#f5a623]/50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3.5">
              <span className="p-2.5 rounded-xl bg-[#f5a623]/10 text-[#f5a623] group-hover:bg-[#f5a623] group-hover:text-black transition-colors">
                <Ticket className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white">Booking History</h4>
                <p className="text-xs text-neutral-400">3 active tickets</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white" />
          </Link>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group">
            <div className="flex items-center gap-3.5">
              <span className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400">
                <Award className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white">VIP Club Perks</h4>
                <p className="text-xs text-neutral-400">Free popcorn & drink</p>
              </div>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between group">
            <div className="flex items-center gap-3.5">
              <span className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400">
                <CreditCard className="w-5 h-5" />
              </span>
              <div>
                <h4 className="text-sm font-semibold text-white">Saved Cards</h4>
                <p className="text-xs text-neutral-400">Mastercard •••• 8821</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="pt-4 flex justify-end">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
