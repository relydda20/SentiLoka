import User from '../models/User.model.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwtUtils.js';
import { jwtConfig } from '../config/jwtConfig.js';

/**
 * Controller: Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, image, description } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    // Create new user
    const userData = {
      name,
      email,
      password
    };

    // Only include optional fields if provided
    if (image) userData.image = image;
    if (description) userData.description = description;

    const user = await User.create(userData);

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, jwtConfig.cookieOptions);

    // Return user data and access token
    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          slug: user.slug,
          image: user.image,
          description: user.description,
          subscription: user.subscription
        },
        accessToken
      }
    });
  } catch (error) {
    console.error('Register error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed.',
      error: error.message
    });
  }
};

/**
 * Controller: Login user
 * @route POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    // Find user by email (include password for comparison)
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate tokens
    const accessToken = generateAccessToken({ userId: user._id, email: user.email });
    const refreshToken = generateRefreshToken({ userId: user._id });

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, jwtConfig.cookieOptions);

    // Return user data and access token
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          slug: user.slug,
          image: user.image,
          description: user.description,
          subscription: user.subscription,
          lastLogin: user.lastLogin
        },
        accessToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed.',
      error: error.message
    });
  }
};

/**
 * Controller: Logout user
 * @route POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken', {
      ...jwtConfig.cookieOptions,
      maxAge: 0
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful.'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed.',
      error: error.message
    });
  }
};

/**
 * Controller: Refresh access token
 * @route POST /api/auth/refresh-token
 */
export const refreshToken = async (req, res) => {
  try {
    // Get refresh token from cookie
    const { refreshToken: token } = req.cookies;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token not found.'
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(token);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token.'
      });
    }

    // Find user
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken({ userId: user._id, email: user.email });

    // Optionally generate new refresh token (rotation)
    const newRefreshToken = generateRefreshToken({ userId: user._id });
    res.cookie('refreshToken', newRefreshToken, jwtConfig.cookieOptions);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully.',
      data: {
        accessToken: newAccessToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed.',
      error: error.message
    });
  }
};

/**
 * Controller: Get current user profile
 * @route GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    // req.user is set by authenticate middleware
    const user = await User.findById(req.user._id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          slug: user.slug,
          image: user.image,
          description: user.description,
          subscription: user.subscription,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile.',
      error: error.message
    });
  }
};

/**
 * Controller: Verify token
 * @route GET /api/auth/verify
 */
export const verifyToken = async (req, res) => {
  try {
    // If we reach here, the authenticate middleware has verified the token
    res.status(200).json({
      success: true,
      message: 'Token is valid.',
      data: {
        userId: req.user._id,
        email: req.user.email
      }
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Token verification failed.',
      error: error.message
    });
  }
};
