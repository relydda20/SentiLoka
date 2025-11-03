import dotenv from "dotenv";
dotenv.config();

export const CONFIG = {
  // OpenAI API Keys
  GPT4O_MINI_API_KEY: process.env.GPT4O_MINI_API_KEY,
  GPT5_NANO_API_KEY: process.env.GPT5_NANO_API_KEY,
  // OpenAI Base URLs
  GPT4O_MINI_BASE_URL: "https://mlapi.run/40cc17ae-a89b-4f12-a7d6-13293180fc87/v1",
  GPT5_NANO_BASE_URL: "https://mlapi.run/daef5150-72ef-48ff-8861-df80052ea7ac/v1",
  // Batch processing settings
  BATCH_SIZE: 15,           // Number of reviews per batch !!! DO NOT SET MORE THAN 15 !!!
  CONCURRENT_BATCHES: 10,   // Number of batches to process concurrently !!! INCREASE WITH CAUTION !!!
};