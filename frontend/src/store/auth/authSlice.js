// frontend/src/store/auth/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as authService from '../../services/authService';

const initialState = {
  user: null,
  isAuthenticated: false,
  loading: 'idle', // 'idle' | 'pending' | 'succeeded' | 'failed'
  error: null,
};

// Async thunk for user registration
export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await authService.register(userData);
      return data.user; // Assuming backend returns { user: {...} }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk for user login
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await authService.login(credentials);
      return data.user; // Assuming backend returns { user: {...} }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk for user logout
export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Async thunk to check auth status (e.g., on app load using refresh token)
export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      // This endpoint should use the httpOnly refresh token
      // to get a new access token and return user data.
      const { data } = await authService.refreshToken();
      return data.user; // Assuming refresh endpoint returns new user data
    } catch (error) {
      return rejectWithValue('Session expired');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Standard reducers can go here if needed
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload;
      })
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = 'pending';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.loading = 'idle';
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout API fails, force frontend logout
        state.user = null;
        state.isAuthenticated = false;
        state.loading = 'idle';
      })
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = 'pending';
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = 'succeeded'; // Finished loading, but failed auth
        state.isAuthenticated = false;
        state.user = null;
      });
  },
});

export default authSlice.reducer;