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
  // The interceptor in apiClient will handle this, but
  // we need a way to check auth on app load.
  // This endpoint expects the httpOnly refresh token cookie.
  return apiClient.post('/auth/refresh-token');
};