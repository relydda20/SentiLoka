import axios from "axios";

const apiUrl = import.meta.env.BACKEND_BASE_URL || "http://localhost:5000";

const apiClient = axios.create({
  baseURL: apiUrl, // adjust to your backend
  withCredentials: true, // send HttpOnly cookies
});

// --- Refresh logic ---
let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = () => {
  refreshSubscribers.forEach((cb) => cb());
  refreshSubscribers = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Do not attempt token refresh for auth endpoints (login/register/refresh)
    // so that auth-related errors (e.g. wrong password) surface to callers.
    const authEndpoints = [
      "/auth/login",
      "/auth/register",
      "/auth/refresh-token",
    ];
    if (
      originalRequest &&
      authEndpoints.some((ep) => originalRequest.url?.includes(ep))
    ) {
      return Promise.reject(error);
    }

    // If 401 and not already retried, try refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue requests until refresh is done
        return new Promise((resolve) => {
          refreshSubscribers.push(() => resolve(apiClient(originalRequest)));
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call backend refresh endpoint (sets new cookies)
        await apiClient.post("/auth/refresh-token");
        isRefreshing = false;
        onRefreshed();
        return apiClient(originalRequest); // retry original request
      } catch (refreshError) {
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
