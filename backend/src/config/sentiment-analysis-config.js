import dotenv from "dotenv";
dotenv.config();

export const CONFIG = {
  GPT4O_MINI_API_KEY: process.env.GPT4O_MINI_API_KEY,
  GPT4O_MINI_BASE_URL: "https://mlapi.run/40cc17ae-a89b-4f12-a7d6-13293180fc87/v1",
  GPT4O_MINI_URL: "https://mlapi.run/40cc17ae-a89b-4f12-a7d6-13293180fc87/v1/chat/completions",
  RESULTS_FILE: "./data/results.json",
  REVIEWS_FILE: "./data/google_reviews.json",
  BATCH_SIZE: 15,
  CONCURRENT_BATCHES: 10,
};