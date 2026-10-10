import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Tv2, 
  CalendarDays, 
  Ticket, 
  Users, 
  Building2, 
  LogOut, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { api } from '../../services/api.service';
import { useAuth } from '../../contexts/AuthContext';

export const ManagerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [theatre, setTheatre] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTheatre();
  }, []);

  const fetchTheatre = async () => {
    try {
      setLoading(true);
      const data = await api.getMyTheatre();
      setTheatre(data);
    } catch (err) {
      console.error('Error fetching manager theatre:', err);
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/manager', icon: LayoutDashboard },
    { name: 'Screens & Seats', path: '/manager/screens', icon: Tv2 },
    { name: 'Show Scheduler', path: '/manager/shows', icon: CalendarDays },
    { name: 'Box Office Bookings', path: '/manager/bookings', icon: Ticket },
    { name: 'Staff Management', path: '/manager/staff', icon: Users },
    { name: 'Cinema Profile & KYC', path: '/manager/profile', icon: Building2 },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} />
            Verified & Active
          </span>
        );
      case 'DOCS_VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Clock size={12} />
            Docs Verified
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle size={12} />
            Application Rejected
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <AlertTriangle size={12} />
            Branch Suspended
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock size={12} />
            Pending Admin Review
          </span>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#07080a] text-white overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0d0f12] border-r border-white/5 flex flex-col z-20">
        {/* Brand & Cinema Header */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-black tracking-tight text-white flex items-center">
              CineVerse<span className="text-yellow-500 text-2xl leading-none">.</span>
            </Link>
            <span className="text-[10px] font-bold tracking-widest uppercase bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/20">
              Manager
            </span>
          </div>
          
          <div className="mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="text-xs font-medium text-neutral-400 truncate">Cinema Branch</div>
            <div className="text-sm font-bold text-white truncate mt-0.5">
              {theatre?.name || 'My Cinema'}
            </div>
            <div className="text-xs text-neutral-400 truncate mt-0.5">
              {theatre?.city ? `${theatre.city}, ${theatre.state || ''}` : 'Loading location...'}
            </div>
            <div className="mt-2.5">
              {getStatusBadge(theatre?.status)}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/manager' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition group ${
                  isActive
                    ? 'bg-yellow-500 text-black font-semibold shadow-lg shadow-yellow-500/10'
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={18} className={isActive ? 'text-black' : 'text-neutral-400 group-hover:text-yellow-400 transition'} />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight size={14} className="text-black" />}
              </Link>
            );
          })}
        </nav>

        {/* Manager User & Logout Footer */}
        <div className="p-4 border-t border-white/5 bg-[#0a0c0e]">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center font-bold text-black text-sm shadow">
              {user?.fullName?.charAt(0) || 'M'}
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-semibold text-white truncate">{user?.fullName || 'Manager'}</div>
              <div className="text-xs text-neutral-500 truncate">{user?.email || 'manager@cineverse.com'}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-neutral-400 hover:text-white hover:bg-white/5 rounded-lg border border-white/5 transition"
            >
              <ExternalLink size={13} />
              Public Site
            </Link>
            <button
              onClick={logout}
              className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg border border-red-500/20 transition"
              title="Logout"
            >
              <LogOut size={13} />
              Exit
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#07080a]">
        {/* Verification Status Warning Bar if Pending or Rejected */}
        {theatre?.status === 'PENDING' && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-amber-400 animate-pulse" />
              <span>
                <strong>Application Under Review:</strong> Your theatre onboarding documents are currently being verified by CineVerse administrators. You can build screens and configure seats in advance.
              </span>
            </div>
            <Link to="/manager/profile" className="underline font-bold hover:text-amber-200">
              Check KYC Status &rarr;
            </Link>
          </div>
        )}

        {theatre?.status === 'REJECTED' && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-2.5 flex items-center justify-between text-xs text-red-300">
            <div className="flex items-center gap-2">
              <ShieldAlert size={15} className="text-red-400" />
              <span>
                <strong>Registration Rejected:</strong> {theatre.rejectionReason || 'Please review your uploaded documents or contact CineVerse Partner Support.'}
              </span>
            </div>
            <Link to="/manager/profile" className="underline font-bold hover:text-red-200">
              Update Information &rarr;
            </Link>
          </div>
        )}

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <Outlet context={{ theatre, refreshTheatre: fetchTheatre }} />
        </main>
      </div>
    </div>
  );
};
