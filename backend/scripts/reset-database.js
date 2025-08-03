import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';

// Load environment variables
dotenv.config();

const resetDatabase = async () => {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    console.log('🗑️  Dropping all collections...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      console.log(`   Dropping collection: ${collection.name}`);
      await mongoose.connection.db.dropCollection(collection.name);
    }
    
    console.log('✅ Database reset completed successfully!');
    console.log('📝 New schema is ready for use.');
    console.log('');
    console.log('📋 Updated Models:');
    console.log('   - User (default role: seeker, Egypt-specific verification)');
    console.log('   - ServiceRequest (no budget/duration, private location)');
    console.log('   - Offer (multi-provider negotiation)');
    console.log('   - Payment (multiple payment methods)');
    console.log('   - Review (rating and feedback system)');
    console.log('   - Notification (real-time notifications)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
};

// Run the reset
resetDatabase(); 