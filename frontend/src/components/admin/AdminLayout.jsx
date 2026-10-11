import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  Film, 
  Building2, 
  CalendarDays, 
  LayoutDashboard, 
  LogOut, 
  ClipboardCheck, 
  ShieldCheck, 
  Lock, 
  LogIn
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, openAuthModal } = useAuth();

  const isAdmin = user && user.role === 'SUPER_ADMIN';

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Theatre Requests', path: '/admin/theatre-requests', icon: ClipboardCheck },
    { name: 'Theatres', path: '/admin/theatres', icon: Building2 },
    { name: 'Movies', path: '/admin/movies', icon: Film },
    { name: 'Shows', path: '/admin/shows', icon: CalendarDays },
  ];

  return (
    <div className="flex h-screen bg-[#0a0b0e] text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-black border-r border-white/10 flex flex-col z-10 shrink-0">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="block">
            <img src="/ticket-total-logo.png" alt="Ticket Total" className="h-9 w-auto object-contain drop-shadow-md" />
          </Link>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-yellow-500 uppercase tracking-widest font-semibold">
            <ShieldCheck size={13} />
            <span>Admin Console</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${
                  isActive 
                    ? 'bg-yellow-500 text-black font-bold shadow-[0_0_15px_rgba(234,179,8,0.25)]' 
                    : 'text-neutral-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Info / Status in Sidebar */}
        <div className="p-4 border-t border-white/10 space-y-3">
          {isAdmin ? (
            <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Authenticated</span>
              </div>
              <div className="text-xs font-bold text-white truncate">{user.fullName || 'Administrator'}</div>
              <div className="text-[11px] text-neutral-400 truncate font-mono">{user.email}</div>
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 text-xs">
              <div className="text-amber-300 font-bold flex items-center gap-1.5 mb-1">
                <Lock size={12} />
                <span>Not Signed In</span>
              </div>
              <p className="text-[11px] text-neutral-400">Admin credentials required to perform operations.</p>
            </div>
          )}

          {isAdmin ? (
            <button 
              onClick={logout} 
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition w-full text-xs font-semibold cursor-pointer"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => openAuthModal('login')}
              className="w-full py-2.5 px-3 bg-yellow-500 hover:bg-yellow-400 text-black rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogIn size={14} />
              Sign In as Admin
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#0a0b0e] p-6 sm:p-8">
        {!isAdmin ? (
          <div className="max-w-md mx-auto my-16 bg-neutral-900/60 border border-white/10 rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-6 animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 flex items-center justify-center mx-auto shadow-inner">
              <Lock size={32} />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
                Protected Area
              </span>
              <h2 className="text-2xl font-black text-white">Super Admin Access Required</h2>
              <p className="text-neutral-400 text-xs sm:text-sm max-w-sm mx-auto leading-relaxed">
                Please sign in with your administrator account to access cinema management and administrative controls.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={() => openAuthModal('login')}
                className="w-full py-3.5 px-6 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black font-extrabold text-xs transition inline-flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.3)] cursor-pointer"
              >
                <LogIn size={16} />
                Sign In as Admin
              </button>
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </div>
    </div>
  );
};
