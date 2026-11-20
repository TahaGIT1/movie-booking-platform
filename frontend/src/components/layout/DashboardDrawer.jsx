import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

/**
 * Off-canvas sidebar state for the admin / manager dashboards.
 * Below the `lg` breakpoint the sidebar slides in over the content; it closes on
 * navigation, on Escape, and when the backdrop is tapped.
 */
export function useDashboardDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setIsOpen(false); }, [pathname]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    // Static column on desktop, slide-in panel on tablets and phones.
    sidebarClassName: `fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 lg:static lg:translate-x-0 ${
      isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
    }`,
  };
}

/** Top bar shown only on tablets and phones, holding the menu toggle. */
export function DashboardMobileBar({ label, onOpen, isOpen, onClose }) {
  return (
    <>
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 px-4 h-14 bg-black/90 backdrop-blur border-b border-white/10 shrink-0">
        <button
          type="button"
          onClick={onOpen}
          aria-label="Open navigation"
          aria-expanded={isOpen}
          className="w-10 h-10 -ml-2 flex items-center justify-center rounded-lg text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <Menu size={20} />
        </button>
        <Link to="/" className="flex items-center">
          <img src="/ticket-total-logo.png" alt="Ticket Total" className="h-7 w-auto object-contain" />
        </Link>
        <span className="text-[10px] font-bold tracking-widest uppercase bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/20">
          {label}
        </span>
      </div>
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="absolute top-3 right-3 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>
      )}
    </>
  );
}
