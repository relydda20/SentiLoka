// frontend/src/utils/apiClient.js
import axios from 'axios';
import { store } from '../store/store'; // Import store directly
import { logoutUser } from '../store/auth/authSlice'; // Import logout action

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  withCredentials: true, // This is essential for sending httpOnly cookies
});

// Flag to prevent multiple concurrent refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const { status } = error.response;

    // Check if the error is 401 (Unauthorized) and it's not a retry request
    if (status === 401 && !originalRequest._retry) {
      // If it's the refresh token endpoint that failed, log out
      if (originalRequest.url === '/auth/refresh-token') {
        store.dispatch(logoutUser()); // Dispatch logout
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, add this request to the queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the refresh token endpoint
        await apiClient.post('/auth/refresh-token');

        // Backend should have set a new access token cookie
        // Process the queue with success
        processQueue(null);

        // Retry the original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh fails, process queue with error and log out
        processQueue(refreshError);
        store.dispatch(logoutUser()); // Dispatch logout
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // For other errors, just reject
    return Promise.reject(error);
  }
);

export default apiClient;