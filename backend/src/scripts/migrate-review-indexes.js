import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function migrateReviewIndexes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const reviewsCollection = db.collection('reviews');

    // Get existing indexes
    const indexes = await reviewsCollection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach((index) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    // Drop the old unique index on googleReviewId if it exists
    try {
      await reviewsCollection.dropIndex('googleReviewId_1');
      console.log('\n✅ Dropped old unique index on googleReviewId');
    } catch (error) {
      if (error.code === 27) {
        console.log('\n⚠️  Old googleReviewId index does not exist (already dropped or never created)');
      } else {
        throw error;
      }
    }

    // Create new compound unique index on (userId, googleReviewId)
    try {
      await reviewsCollection.createIndex(
        { userId: 1, googleReviewId: 1 },
        { unique: true, name: 'userId_1_googleReviewId_1' }
      );
      console.log('✅ Created new compound unique index on (userId, googleReviewId)');
    } catch (error) {
      if (error.code === 85) {
        console.log('⚠️  Compound index already exists');
      } else {
        throw error;
      }
    }

    // Get updated indexes
    const newIndexes = await reviewsCollection.indexes();
    console.log('\n📋 Updated indexes:');
    newIndexes.forEach((index) => {
      console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
    });

    console.log('\n✅ Migration completed successfully!');
    console.log('\nℹ️  Summary:');
    console.log('  - Old behavior: Only ONE copy of each Google review could exist globally');
    console.log('  - New behavior: Each user can have their own copy of each Google review');
    console.log('  - Example: User A and User B can both scrape and store reviews for "Wedrink Lippo Cikarang"');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run migration
migrateReviewIndexes();
