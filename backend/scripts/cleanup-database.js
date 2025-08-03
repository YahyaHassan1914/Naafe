import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Notification from '../models/Notification.js';
import Offer from '../models/Offer.js';

dotenv.config();

const cleanupDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Starting database cleanup...');

    // 1. Remove premium fields from users
    console.log('Cleaning up user records...');
    const userUpdateResult = await User.updateMany(
      {},
      {
        $unset: {
          isPremium: 1,
          subscription: 1,
          stripeCustomerId: 1
        }
      }
    );
    console.log(`Updated ${userUpdateResult.modifiedCount} user records`);

    // 2. Remove subscription-related payments
    console.log('Cleaning up payment records...');
    const paymentDeleteResult = await Payment.deleteMany({
      type: 'subscription'
    });
    console.log(`Deleted ${paymentDeleteResult.deletedCount} subscription payments`);

    // 3. Remove premium-related notifications
    console.log('Cleaning up notification records...');
    const notificationDeleteResult = await Notification.deleteMany({
      type: { $in: ['subscription_upgraded', 'subscription_expired', 'premium_feature'] }
    });
    console.log(`Deleted ${notificationDeleteResult.deletedCount} premium notifications`);

    // 4. Remove orphaned offers (if any)
    console.log('Checking for orphaned offers...');
    const orphanedOffers = await Offer.find({
      $or: [
        { jobRequest: { $exists: false } },
        { provider: { $exists: false } }
      ]
    });
    if (orphanedOffers.length > 0) {
      const offerDeleteResult = await Offer.deleteMany({
        $or: [
          { jobRequest: { $exists: false } },
          { provider: { $exists: false } }
        ]
      });
      console.log(`Deleted ${offerDeleteResult.deletedCount} orphaned offers`);
    }

    // 5. Remove orphaned notifications
    console.log('Checking for orphaned notifications...');
    const orphanedNotifications = await Notification.find({
      $or: [
        { userId: { $exists: false } },
        { userId: null }
      ]
    });
    if (orphanedNotifications.length > 0) {
      const notificationDeleteResult = await Notification.deleteMany({
        $or: [
          { userId: { $exists: false } },
          { userId: null }
        ]
      });
      console.log(`Deleted ${notificationDeleteResult.deletedCount} orphaned notifications`);
    }

    console.log('Database cleanup completed successfully!');
    
    // Print summary
    console.log('\n=== CLEANUP SUMMARY ===');
    console.log(`- Updated ${userUpdateResult.modifiedCount} user records`);
    console.log(`- Deleted ${paymentDeleteResult.deletedCount} subscription payments`);
    console.log(`- Deleted ${notificationDeleteResult.deletedCount} premium notifications`);
    console.log('========================');

  } catch (error) {
    console.error('Database cleanup failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupDatabase();
}

export default cleanupDatabase; 