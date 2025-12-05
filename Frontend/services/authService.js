import { config } from '../config';

const API_URL = `${config.API_BASE_URL}/auth`;

/**
 * Register new user
 */
export const register = async (email, password, fullName) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password, fullName })
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Registration failed');
  }

  return data;
};

/**
 * Login user
 */
export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Login failed');
  }

  return data;
};

/**
 * Logout user
 */
export const logout = () => {
  localStorage.removeItem('token');
};

/**
 * Get user profile
 */
export const getProfile = async () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('No token found');
  }

  const response = await fetch(`${API_URL}/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to get profile');
  }

  return data.user;
};

/**
 * Update user profile
 */
export const updateProfile = async (profileData) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to update profile');
  }

  return data.user;
};

/**
 * Add city to favorites
 */
export const addFavorite = async (cityId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/favorites/${cityId}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to add favorite');
  }

  return data.favorites;
};

/**
 * Remove city from favorites
 */
export const removeFavorite = async (cityId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/favorites/${cityId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to remove favorite');
  }

  return data.favorites;
};

/**
 * Get user's favorite cities with weather data
 */
export const getFavorites = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/favorites`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.message || 'Failed to get favorites');
  }

  return data.favorites;
};
