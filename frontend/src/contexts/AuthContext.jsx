import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api.service';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState('login'); 

  useEffect(() => {
    const savedToken = localStorage.getItem('token') || localStorage.getItem('cinepass_token');
    const savedUser = localStorage.getItem('user') || localStorage.getItem('cinepass_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('cinepass_token');
        localStorage.removeItem('cinepass_user');
      }
    }
  }, []);

  /**
   * Persists a successful sign-in and routes the user onward.
   *
   * Previously only SUPER_ADMIN and THEATRE_MANAGER were redirected, so a
   * CUSTOMER stayed sitting on /login with a "Redirecting..." message and no
   * redirect ever happening. Every role now navigates.
   *
   * @param redirectTo where the user was originally heading (e.g. /profile),
   *                   ignored for roles that land on their own console.
   */
  const login = (newToken, newUser, redirectTo = '/') => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('cinepass_token', newToken);
    localStorage.setItem('cinepass_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setIsAuthModalOpen(false);

    if (newUser?.role === 'SUPER_ADMIN') {
      navigate('/admin', { replace: true });
      return;
    }
    if (newUser?.role === 'THEATRE_MANAGER') {
      navigate('/manager', { replace: true });
      return;
    }

    navigate(redirectTo || '/', { replace: true });
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (e) {
      console.warn('Backend logout failed:', e);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cinepass_token');
    localStorage.removeItem('cinepass_user');
    setToken(null);
    setUser(null);
    navigate('/', { replace: true });
  };

  const openAuthModal = (mode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthModalOpen, authModalMode, setAuthModalMode, openAuthModal, closeAuthModal, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
