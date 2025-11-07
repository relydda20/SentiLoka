import dotenv from 'dotenv';

dotenv.config();

export const jwtConfig = {
  accessTokenSecret: process.env.JWT_SECRET,
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
  accessTokenExpire: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpire: process.env.JWT_REFRESH_EXPIRY || '7d',
  // Cookie options for access token (shorter expiry)
  accessTokenCookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes in milliseconds
    path: '/'
  },
  // Cookie options for refresh token (longer expiry)
  refreshTokenCookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/'
  },
  // Legacy support - alias for refresh token options
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  }
};
