import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  Ticket,
  CheckCheck,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api.service';

export const NotificationBell = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const res = await api.getNotifications();
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
        const unread = res.data.filter((n) => !n.isRead).length;
        setUnreadCount(unread);
      }
    } catch (e) {
      // Silently fail for background polling
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 25000); // 25s polling
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [token]);

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAsRead = async (notification) => {
    if (!notification.isRead) {
      try {
        await api.markNotificationRead(notification.id);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (e) {
        // Ignore
      }
    }

    setIsOpen(false);
    if (
      notification.type === 'BOOKING_CONFIRMED' ||
      notification.type === 'BOOKING_CANCELLED' ||
      notification.metadata?.bookingId
    ) {
      navigate('/my-bookings');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setLoading(true);
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        aria-label="View notifications"
        className="relative p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#f5a623]/50 text-neutral-300 hover:text-white transition-all cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0B0C10] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#11131c] border border-white/10 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-heading font-bold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f5a623]/20 text-[#f5a623]">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-[11px] font-semibold text-[#f5a623] hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Sparkles className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                <p className="text-xs font-semibold text-neutral-400">No notifications yet</p>
                <p className="text-[11px] text-neutral-600 mt-1">
                  Updates about your bookings and ticket confirmations will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const isBookingSuccess = n.type === 'BOOKING_CONFIRMED';
                const isBookingCancel = n.type === 'BOOKING_CANCELLED';
                const dateStr = new Date(n.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={n.id}
                    onClick={() => handleMarkAsRead(n)}
                    className={`p-3.5 hover:bg-white/5 transition flex items-start gap-3 cursor-pointer ${
                      !n.isRead ? 'bg-[#f5a623]/[0.03]' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className="shrink-0 mt-0.5">
                      {isBookingSuccess ? (
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                          <CheckCircle className="w-4 h-4" />
                        </div>
                      ) : isBookingCancel ? (
                        <div className="w-8 h-8 rounded-lg bg-red-500/15 text-red-400 flex items-center justify-center border border-red-500/30">
                          <XCircle className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[#f5a623]/15 text-[#f5a623] flex items-center justify-center border border-[#f5a623]/30">
                          <Ticket className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-xs font-bold truncate ${!n.isRead ? 'text-white' : 'text-neutral-300'}`}>
                          {n.title}
                        </h4>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-[#f5a623] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-neutral-500 mt-1 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {dateStr}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 border-t border-white/10 bg-white/[0.02] text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/my-bookings');
              }}
              className="text-[11px] font-semibold text-neutral-400 hover:text-white transition cursor-pointer"
            >
              Go to My Bookings →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
