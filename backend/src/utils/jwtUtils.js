import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwtConfig.js';

// Generate access token
export const generateAccessToken = (payload) => {
  try {
    if (!jwtConfig.accessTokenSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    
    return jwt.sign(payload, jwtConfig.accessTokenSecret, {
      expiresIn: jwtConfig.accessTokenExpire
    });
  } catch (error) {
    console.error('Error generating access token:', error);
    throw new Error('Failed to generate access token');
  }
};

// Generate refresh token
export const generateRefreshToken = (payload) => {
  try {
    if (!jwtConfig.refreshTokenSecret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }
    
    return jwt.sign(payload, jwtConfig.refreshTokenSecret, {
      expiresIn: jwtConfig.refreshTokenExpire
    });
  } catch (error) {
    console.error('Error generating refresh token:', error);
    throw new Error('Failed to generate refresh token');
  }
};

// Verify access token
export const verifyAccessToken = (token) => {
  try {
    if (!jwtConfig.accessTokenSecret) {
      throw new Error('JWT_SECRET is not configured');
    }
    
    return jwt.verify(token, jwtConfig.accessTokenSecret);
  } catch (error) {
    console.error('Error verifying access token:', error);
    return null;
  }
};

// Verify refresh token
export const verifyRefreshToken = (token) => {
  try {
    if (!jwtConfig.refreshTokenSecret) {
      throw new Error('JWT_REFRESH_SECRET is not configured');
    }
    
    return jwt.verify(token, jwtConfig.refreshTokenSecret);
  } catch (error) {
    console.error('Error verifying refresh token:', error);
    return null;
  }
};