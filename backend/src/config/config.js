import dotenv from 'dotenv';

dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 8080,
  mongoUri: process.env.MONGODB_URI,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY,
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
  googleCalendarApiKey: process.env.GOOGLE_CALENDAR_API_KEY,
  geminiApiKey: process.env.GEMINI_API_KEY
};
