import Location from '../models/Location.model.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const locationsData = JSON.parse(
  readFileSync(join(__dirname, 'data', 'locations.json'), 'utf-8')
);

export const clearLocations = async () => {
  try {
    await Location.deleteMany({});
    console.log('✅ Locations cleared');
  } catch (error) {
    console.error('❌ Error clearing locations:', error.message);
    throw error;
  }
};

export const seedLocations = async (users) => {
  try {
    if (!users || users.length === 0) {
      throw new Error('No users available. Seed users first.');
    }

    // Assign locations to users in round-robin fashion
    const locationsWithUsers = locationsData.map((location, index) => {
      const user = users[index % users.length];

      return {
        ...location,
        userId: user._id,
        scrapeConfig: {
          ...location.scrapeConfig,
          lastScraped: location.scrapeConfig.lastScraped
            ? new Date(location.scrapeConfig.lastScraped)
            : null
        }
      };
    });
    const locations = await Location.create(locationsWithUsers);
    console.log(`✅ ${locations.length} locations seeded`);
    return locations;
  } catch (error) {
    console.error('❌ Error seeding locations:', error.message);
    throw error;
  }
};
