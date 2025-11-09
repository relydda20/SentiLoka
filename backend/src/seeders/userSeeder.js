import User from '../models/User.model.js';
import bcrypt from 'bcryptjs';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const usersData = JSON.parse(
  readFileSync(join(__dirname, 'data', 'users.json'), 'utf-8')
);

/**
 * Generate URL-friendly slug from name
 */
const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Seed users into the database
 */
export const seedUsers = async () => {
  try {
    console.log('🌱 Seeding users...');

    // Hash passwords and add slugs
    const usersWithHashedPasswords = await Promise.all(
      usersData.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const slug = generateSlug(user.name);
        
        return {
          slug,
          name: user.name,
          email: user.email,
          password: hashedPassword,
          image: user.image,
          description: user.description,
          subscription: {
            plan: user.subscription.plan,
            startDate: new Date(user.subscription.startDate),
            endDate: new Date(user.subscription.endDate),
            isActive: user.subscription.isActive
          }
        };
      })
    );

    const users = await User.insertMany(usersWithHashedPasswords);
    console.log(`✅ ${users.length} users seeded`);
    return users;
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    throw error;
  }
};

/**
 * Clear all users from the database
 */
export const clearUsers = async () => {
  try {
    await User.deleteMany({});
    console.log('✅ Users cleared');
  } catch (error) {
    console.error('❌ Error clearing users:', error.message);
    throw error;
  }
};
