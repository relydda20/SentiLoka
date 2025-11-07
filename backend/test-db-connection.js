import 'dotenv/config';
import mongoose from 'mongoose';
import ReviewSummary from './src/models/ReviewSummary.model.js';

// Test MongoDB connection and saving
async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB connection...');
    console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database:', mongoose.connection.name);

    // Test saving a summary
    console.log('\n🔍 Testing ReviewSummary save...');
    const testSummary = new ReviewSummary({
      author: 'Test User',
      rating: 5,
      text: 'This is a test review',
      sentiment: 'positive',
      sentimentScore: 0.9,
      confidence: 0.95,
      sentimentKeywords: ['test', 'review'],
      contextualTopics: ['testing'],
      summary: 'This is a test summary to verify database saving works correctly.',
      company: 'TestCompany',
      source: 'Manual Test',
      processedAt: new Date(),
    });

    const saved = await testSummary.save();
    console.log('✅ Successfully saved test summary!');
    console.log('📝 Saved document ID:', saved._id);
    console.log('📄 Summary:', saved.summary);

    // Retrieve it back
    console.log('\n🔍 Testing retrieval...');
    const retrieved = await ReviewSummary.findById(saved._id);
    console.log('✅ Successfully retrieved summary!');
    console.log('📄 Retrieved summary:', retrieved.summary);

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await ReviewSummary.deleteOne({ _id: saved._id });
    console.log('✅ Test data cleaned up');

    // Get count of existing summaries
    const count = await ReviewSummary.countDocuments();
    console.log(`\n📊 Total summaries in database: ${count}`);

    // Close connection
    await mongoose.connection.close();
    console.log('\n👋 Test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testConnection();
