import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { seedUsers, clearUsers } from './userSeeder.js';
import { seedLocations, clearLocations } from './locationSeeder.js';
import { seedReviews, clearReviews } from './reviewSeeder.js';

dotenv.config();

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sentiloka';
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

/**
 * Disconnect from MongoDB
 */
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
    throw error;
  }
};

/**
 * Clear all data from the database
 */
export const clearDatabase = async () => {
  try {
    console.log('🧹 Clearing database...\n');

    // Clear in order (reviews first due to references)
    await clearReviews();
    await clearLocations();
    await clearUsers();

    // Also drop indexes to ensure clean slate
    const collections = await mongoose.connection.db.collections();
    for (const collection of collections) {
      if (collection.collectionName === 'reviews') {
        console.log('🔧 Dropping indexes on reviews collection...');
        await collection.dropIndexes();
        console.log('✅ Indexes dropped');
      }
    }

    console.log('\n✨ Database cleared successfully!\n');
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    throw error;
  }
};

/**
 * Seed all data into the database
 * Ensures all references are properly connected
 */
export const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Step 1: Create users first
    const users = await seedUsers();

    // Step 2: Create locations (linked to users)
    const locations = await seedLocations(users);

    // Step 3: Create reviews (linked to locations)
    await seedReviews(locations);

    console.log('\n✨ Database seeded successfully!\n');
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    throw error;
  }
};

/**
 * Fresh seed: Clear database and seed new data
 */
export const freshSeed = async () => {
  try {
    await clearDatabase();
    await seedDatabase();
  } catch (error) {
    console.error('❌ Error in fresh seed:', error.message);
    throw error;
  }
};

/**
 * Main execution function
 */
const run = async () => {
  try {
    await connectDB();

    const command = process.argv[2];

    switch (command) {
      case 'clear':
        await clearDatabase();
        break;
      case 'seed':
        await seedDatabase();
        break;
      case 'fresh':
        await freshSeed();
        break;
      default:
        console.log('Usage: node databaseSeeder.js [clear|seed|fresh]');
        console.log('  clear - Clear all data from database');
        console.log('  seed  - Seed data into database');
        console.log('  fresh - Clear and seed database');
    }

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    await disconnectDB();
    process.exit(1);
  }
};

// Run if this file is executed directly
const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  run();
}
