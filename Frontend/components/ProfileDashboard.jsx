import React, { useState, useEffect } from 'react';
import { X, User, Mail, Calendar, Heart, Trash2, MapPin, Thermometer, Wind, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import * as authService from '../services/authService';

const ProfileDashboard = ({ isOpen, onClose, onCityClick }) => {
  const { user, logout } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && user) {
      loadFavorites();
    }
  }, [isOpen, user]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await authService.getFavorites();
      setFavorites(data);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (cityId) => {
    try {
      await authService.removeFavorite(cityId);
      setFavorites(favorites.filter(fav => fav.cityId !== cityId));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  if (!isOpen || !user) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            My Profile
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User Info Card */}
          <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-2xl font-bold text-white">
                {user.fullName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-slate-100 mb-1">
                  {user.fullName || 'User'}
                </h3>
                <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
                  <Mail className="w-4 h-4" />
                  {user.email}
                </div>
                {user.createdAt && (
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Calendar className="w-4 h-4" />
                    Joined {formatDate(user.createdAt)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Favorites Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-pink-400" />
              <h3 className="text-lg font-semibold text-slate-100">
                Favorite Cities ({favorites.length})
              </h3>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-purple-400 animate-spin" />
              </div>
            ) : favorites.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Heart className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No favorite cities yet</p>
                <p className="text-sm mt-1">Click the heart icon on any city to add it here</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {favorites.map((favorite) => (
                  <div
                    key={favorite.cityId}
                    className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 hover:border-purple-500/50 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-purple-400" />
                        <h4 className="font-semibold text-slate-100">
                          {favorite.weather?.cityName || favorite.cityId}
                        </h4>
                      </div>
                      <button
                        onClick={() => handleRemoveFavorite(favorite.cityId)}
                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Remove from favorites"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>

                    {favorite.weather ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Thermometer className="w-4 h-4 text-amber-400" />
                            <span className="text-2xl font-bold text-slate-100">
                              {favorite.weather.temperature?.toFixed(1)}°C
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Wind className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-slate-300">
                              AQI {favorite.weather.aqi || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onCityClick(favorite.cityId);
                            onClose();
                          }}
                          className="w-full mt-2 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-purple-300 text-sm font-medium transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Weather data unavailable</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700/50">
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold rounded-lg transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileDashboard;
