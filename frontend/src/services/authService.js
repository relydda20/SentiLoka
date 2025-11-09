import apiClient from '../utils/apiClient';

export const register = (userData) => {
  return apiClient.post('/auth/register', userData);
};

export const login = (credentials) => {
  return apiClient.post('/auth/login', credentials);
};

export const logout = () => {
  return apiClient.post('/auth/logout');
};

export const refreshToken = () => {
  // This endpoint expects the httpOnly refresh token cookie
  // and returns user data along with setting new tokens in cookies
  return apiClient.post('/auth/refresh-token');
};

export const getCurrentUser = () => {
  // Get current user profile (requires valid access token in cookie)
  return apiClient.get('/auth/me');
};

/**
 * Initiate Google OAuth flow
 * Redirects user to Google OAuth consent screen
 */
export const loginWithGoogle = () => {
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
  window.location.href = `${backendUrl}/api/auth/google`;
};