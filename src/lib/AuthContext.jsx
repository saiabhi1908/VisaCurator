import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '@/api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('visapath_token');
    if (!token) {
      setIsLoadingAuth(false);
      return;
    }
    try {
      const userData = await authAPI.me();
      setUser(userData);
      setIsAuthenticated(true);
    } catch {
      localStorage.removeItem('visapath_token');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('visapath_token', res.token);
    setUser(res.user);
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  // UPDATED register function for OTP flow
  const register = async (token, userData) => {
    localStorage.setItem('visapath_token', token);
    setUser(userData);
    setIsAuthenticated(true);
    setShowAuthModal(false);
  };

  const logout = () => {
    localStorage.removeItem('visapath_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const navigateToLogin = () => {
    setAuthMode('login');
    setShowAuthModal(true);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError: null,
      showAuthModal,
      authMode,
      setAuthMode,
      setShowAuthModal,
      login,
      register,
      logout,
      navigateToLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};