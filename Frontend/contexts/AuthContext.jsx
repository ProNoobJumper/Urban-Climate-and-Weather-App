import React, { createContext, useState, useContext, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          const profile = await authService.getProfile();
          setUser(profile);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login(email, password);
    setToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    localStorage.setItem('token', data.token);
    return data;
  };

  const register = async (email, password, fullName) => {
    const data = await authService.register(email, password, fullName);
    setToken(data.token);
    setUser(data.user);
    setIsAuthenticated(true);
    localStorage.setItem('token', data.token);
    return data;
  };

  const logout = () => {
    authService.logout();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (profileData) => {
    const updatedUser = await authService.updateProfile(profileData);
    setUser(updatedUser);
    return updatedUser;
  };

  const addFavorite = async (cityId) => {
    const favorites = await authService.addFavorite(cityId);
    setUser(prev => ({ ...prev, favorites }));
    return favorites;
  };

  const removeFavorite = async (cityId) => {
    const favorites = await authService.removeFavorite(cityId);
    setUser(prev => ({ ...prev, favorites }));
    return favorites;
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    addFavorite,
    removeFavorite
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
