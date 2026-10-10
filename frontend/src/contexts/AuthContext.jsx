import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
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
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('cinepass_token');
        localStorage.removeItem('cinepass_user');
      }
    }
  }, []);

  const login = (newToken, newUser) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    localStorage.setItem('cinepass_token', newToken);
    localStorage.setItem('cinepass_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    setIsAuthModalOpen(false);
    if (newUser.role === 'SUPER_ADMIN') {
      window.location.href = '/admin';
    } else if (newUser.role === 'THEATRE_MANAGER') {
      window.location.href = '/manager';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cinepass_token');
    localStorage.removeItem('cinepass_user');
    setToken(null);
    setUser(null);
    window.location.href = '/';
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
