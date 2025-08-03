import User from './User.js';
import Admin from './Admin.js';
import Category from './Category.js';
import ServiceRequest from './JobRequest.js'; // Renamed from JobRequest
import Offer from './Offer.js';
import Review from './Review.js';
import Conversation from './Conversation.js';
import Message from './Message.js';
import Notification from './Notification.js';
import Payment from './Payment.js';
import Complaint from './Complaint.js';

// Ensure discriminators are registered
// This is important because the discriminator models need to be imported
// to register themselves with the base User model

export {
  User,
  Admin,
  Category,
  ServiceRequest, // Updated export name
  Offer,
  Review,
  Conversation,
  Message,
  Notification,
  Payment,
  Complaint
};

export default User; 