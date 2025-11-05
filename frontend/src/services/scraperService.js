/**
 * Scraper Service
 * Handles web scraping operations for reviews
 */
import apiClient from "../utils/apiClient";

/**
 * Trigger a scraping job for a location
 * POST /api/scraper/start
 */
export const triggerLocationScrape = async (locationId) => {
  try {
    console.log("🔄 Starting scrape for location:", locationId);

    const response = await apiClient.post("/scraper/start", {
      locationId,
    });

    if (!response.data || !response.data.success) {
      throw new Error(response.data?.message || "Failed to start scraping");
    }

    console.log(`✅ Scrape job started: ${response.data.data.jobId}`);

    return {
      success: true,
      jobId: response.data.data.jobId,
      message: response.data.message,
    };
  } catch (error) {
    console.error(
      `❌ Error triggering scrape for location ${locationId}:`,
      error,
    );

    const backendMessage = error.response?.data?.message || error.message;
    const enhancedError = new Error(backendMessage);
    enhancedError.originalError = error;
    enhancedError.statusCode = error.response?.status;

    throw enhancedError;
  }
};

/**
 * Subscribe to scraping progress via Server-Sent Events (SSE)
 * Real-time progress updates without inefficient polling
 * GET /api/scraper/progress/:jobId (SSE endpoint)
 */
export const subscribeScrapeProgress = (jobId, callbacks = {}) => {
  const {
    onProgress = null,
    onComplete = null,
    onError = null,
    onConnected = null,
  } = callbacks;

  return new Promise((resolve, reject) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const eventSource = new EventSource(`${baseURL}/scraper/progress/${jobId}`, {
      withCredentials: true,
    });

    console.log(`🔌 Connected to SSE for job: ${jobId}`);

    eventSource.onopen = () => {
      console.log("✅ SSE connection established");
      if (onConnected) onConnected();
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("📨 SSE message:", data.type, data);

        switch (data.type) {
          case 'connected':
            if (onConnected) onConnected();
            break;

          case 'progress':
            if (onProgress) {
              onProgress({
                state: data.state,
                progress: data.progress,
                jobId: data.jobId,
              });
            }
            break;

          case 'complete':
            console.log("✅ Scraping completed via SSE!");
            eventSource.close();
            if (onComplete) onComplete(data);
            resolve(data);
            break;

          case 'failed':
            console.error("❌ Scraping failed:", data.error);
            eventSource.close();
            const error = new Error(data.message || "Scraping job failed");
            if (onError) onError(error);
            reject(error);
            break;

          case 'error':
            console.error("❌ SSE error:", data.message);
            eventSource.close();
            const sseError = new Error(data.message);
            if (onError) onError(sseError);
            reject(sseError);
            break;

          default:
            console.warn("Unknown SSE message type:", data.type);
        }
      } catch (parseError) {
        console.error("Error parsing SSE data:", parseError);
      }
    };

    eventSource.onerror = (error) => {
      console.error("❌ SSE connection error:", error);
      eventSource.close();
      const connectionError = new Error("SSE connection failed");
      if (onError) onError(connectionError);
      reject(connectionError);
    };

    // Return cleanup function
    return () => {
      console.log("🔌 Closing SSE connection");
      eventSource.close();
    };
  });
};
