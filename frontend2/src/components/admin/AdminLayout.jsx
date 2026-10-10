
import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Film, Building2, CalendarDays, LayoutDashboard, LogOut, ClipboardCheck } from 'lucide-react';

export const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

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
      <div className="w-64 bg-black border-r border-white/10 flex flex-col z-10">
        <div className="p-6 border-b border-white/10">
          <Link to="/" className="text-2xl font-bold tracking-tighter">CineVerse<span className="text-yellow-500">.</span></Link>
          <p className="text-xs text-neutral-500 mt-1 uppercase tracking-widest">Admin Panel</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map(item => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link 
                key={item.path} 
                to={item.path} 
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive ? 'bg-yellow-500 text-black font-bold' : 'text-neutral-400 hover:text-white hover:bg-white/5'}`}
              >
                <Icon size={20} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 rounded-lg transition w-full font-medium">
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto bg-[#0a0b0e] p-8">
        <Outlet />
      </div>
    </div>
  );
};
