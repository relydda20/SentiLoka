import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Validate Google Maps URL format
 * @param {string} url - Google Maps URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
export const validateGoogleMapsUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Valid patterns for Google Maps place URLs
  const patterns = [
    /^https?:\/\/(www\.)?google\.[a-z]+\/maps\/place\/.+/i,
    /^https?:\/\/maps\.google\.[a-z]+\/maps\?.*cid=/i,
    /^https?:\/\/(www\.)?google\.[a-z]+\/maps\/.*@-?\d+\.?\d*,-?\d+\.?\d*,.*/i,
  ];

  return patterns.some((pattern) => pattern.test(url));
};

/**
 * Extract place information from Google Maps URL
 * @param {string} url - Google Maps URL
 * @returns {Object} - Extracted place information
 */
export const extractPlaceInfoFromUrl = (url) => {
  const info = {
    url,
    placeName: null,
    placeId: null,
    coordinates: null,
  };

  try {
    // Extract place name from /place/ pattern
    const placeMatch = url.match(/\/place\/([^\/]+)/);
    if (placeMatch) {
      info.placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    }

    // Extract coordinates if present
    const coordMatch = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (coordMatch) {
      info.coordinates = {
        lat: parseFloat(coordMatch[1]),
        lng: parseFloat(coordMatch[2]),
      };
    }

    // Extract CID (Customer ID) if present
    const cidMatch = url.match(/[?&]cid=(\d+)/);
    if (cidMatch) {
      info.placeId = cidMatch[1];
    }
  } catch (error) {
    console.error('Error extracting place info from URL:', error);
  }

  return info;
};

/**
 * Generate a unique temporary file path for scraper output
 * @returns {string} - Temporary file path
 */
const generateTempFilePath = () => {
  const tempDir = path.join(__dirname, '../../temp');
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString('hex');
  return path.join(tempDir, `scraper_output_${timestamp}_${randomStr}.json`);
};

/**
 * Ensure temp directory exists
 */
const ensureTempDir = async () => {
  const tempDir = path.join(__dirname, '../../temp');
  try {
    await fs.access(tempDir);
  } catch {
    await fs.mkdir(tempDir, { recursive: true });
  }
};

/**
 * Clean up temporary file
 * @param {string} filePath - Path to temporary file
 */
const cleanupTempFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
    console.log(`Cleaned up temp file: ${filePath}`);
  } catch (error) {
    console.error(`Failed to cleanup temp file ${filePath}:`, error.message);
  }
};

/**
 * Execute the Python Google Maps scraper
 * @param {Object} options - Scraper options
 * @param {string} options.url - Google Maps place URL to scrape
 * @param {number} options.maxReviews - Maximum number of reviews to scrape (default: 100)
 * @param {Function} options.onProgress - Progress callback function
 * @returns {Promise<Object>} - Scraper results
 */
export const executeScraper = async ({
  url,
  maxReviews = 100,
  onProgress = null,
}) => {
  // Validate URL
  if (!validateGoogleMapsUrl(url)) {
    throw new Error('Invalid Google Maps URL format');
  }

  // Ensure temp directory exists
  await ensureTempDir();

  // Generate temp file path for output
  const outputFile = generateTempFilePath();

  // Get the path to the backend directory (where scrapy.cfg is located)
  const backendDir = path.join(__dirname, '../../');

  // Check if Python virtual environment exists
  const venvPython = path.join(backendDir, 'python_env/bin/python');
  const pythonExecutable = await fs
    .access(venvPython)
    .then(() => venvPython)
    .catch(() => 'python3'); // Fallback to system Python

  return new Promise((resolve, reject) => {
    // Use Scrapy command with the spider name
    const args = [
      '-m', 'scrapy', 'crawl', 'maps_reviews',
      '-a', `url=${url}`,
      '-a', `max_reviews=${maxReviews}`,
      '-O', outputFile,
    ];

    console.log(`Executing scraper: ${pythonExecutable} ${args.join(' ')}`);

    const scraperProcess = spawn(pythonExecutable, args, {
      cwd: backendDir,  // Run from backend directory where scrapy.cfg is
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1', // Ensure real-time output
      },
    });

    let stdoutData = '';
    let stderrData = '';
    let reviewsScraped = 0;

    // Handle stdout (progress updates)
    scraperProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
      const lines = stdoutData.split('\n');
      stdoutData = lines.pop() || ''; // Keep incomplete line

      lines.forEach((line) => {
        console.log(`[Scraper] ${line}`);

        // Parse progress updates
        const progressMatch = line.match(/Progress: (\d+)\/(\d+) reviews/i);
        if (progressMatch && onProgress) {
          reviewsScraped = parseInt(progressMatch[1]);
          const total = parseInt(progressMatch[2]);
          const percentage = Math.round((reviewsScraped / total) * 100);

          onProgress({
            type: 'progress',
            reviewsScraped,
            totalReviews: total,
            percentage,
            message: `Scraped ${reviewsScraped} of ${total} reviews (${percentage}%)`,
          });
        }

        // Parse completion message
        if (line.includes('Scraping completed') && onProgress) {
          onProgress({
            type: 'complete',
            message: 'Scraping completed successfully',
          });
        }
      });
    });

    // Handle stderr (errors and warnings)
    scraperProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.error(`[Scraper Error] ${data.toString()}`);
    });

    // Handle process completion
    scraperProcess.on('close', async (code) => {
      if (code !== 0) {
        await cleanupTempFile(outputFile);
        return reject(
          new Error(`Scraper process exited with code ${code}: ${stderrData}`)
        );
      }

      try {
        // Read the output file
        const fileContent = await fs.readFile(outputFile, 'utf-8');
        let scraperOutput = JSON.parse(fileContent);

        // If Scrapy returns an array directly, wrap it in an object
        if (Array.isArray(scraperOutput)) {
          scraperOutput = { reviews: scraperOutput };
        }

        // Clean up temp file
        await cleanupTempFile(outputFile);

        // Return results
        resolve({
          success: true,
          data: scraperOutput,
          metadata: {
            reviewsScraped: scraperOutput.reviews?.length || 0,
            scrapedAt: new Date().toISOString(),
            url,
            maxReviews,
          },
        });
      } catch (error) {
        await cleanupTempFile(outputFile);
        reject(new Error(`Failed to read scraper output: ${error.message}`));
      }
    });

    // Handle process errors
    scraperProcess.on('error', async (error) => {
      await cleanupTempFile(outputFile);
      reject(new Error(`Failed to start scraper process: ${error.message}`));
    });

    // Send initial progress update
    if (onProgress) {
      onProgress({
        type: 'start',
        message: 'Starting scraper...',
      });
    }
  });
};

/**
 * Test scraper connectivity
 * @returns {Promise<boolean>} - Whether scraper is available
 */
export const testScraperAvailability = async () => {
  try {
    const backendDir = path.join(__dirname, '../../');
    const scrapyCfgPath = path.join(backendDir, 'scrapy.cfg');
    const spiderPath = path.join(backendDir, 'scraper/src/spiders/maps_reviews_spiders.py');

    // Check if scrapy.cfg and spider exist
    await fs.access(scrapyCfgPath);
    await fs.access(spiderPath);

    return true;
  } catch (error) {
    console.error('Scraper availability test failed:', error);
    return false;
  }
};

export default {
  executeScraper,
  validateGoogleMapsUrl,
  extractPlaceInfoFromUrl,
  testScraperAvailability,
};
