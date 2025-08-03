# Backend Cleanup Plan

## 🗑️ **Routes to Remove (No Longer Used)**

### 1. Subscription Routes (Removed Premium Feature)
- `subscriptionRoutes.js` - DELETE
- Remove from `app.js`: `app.use('/api/subscriptions', subscriptionRoutes);`

### 2. Upgrade Request Routes (Removed Premium Feature)
- `upgradeRequestRoutes.js` - DELETE
- Remove from `app.js`: `app.use('/api/upgrade-requests', upgradeRequestRoutes);`

### 3. AI Routes (Removed AI Integration)
- `aiRoutes.js` - DELETE
- Remove from `app.js`: `app.use('/api/ai', aiRoutes);`

### 4. Ad Routes (Removed Advertisement System)
- `adRoutes.js` - DELETE
- Remove from `app.js`: `app.use('/api/ads', adRoutes);`

## 🗑️ **Models to Remove**

### 1. UpgradeRequest Model (Removed Premium Feature)
- `UpgradeRequest.js` - DELETE

### 2. Ad Model (Removed Advertisement System)
- `Ad.js` - DELETE

## 🔧 **Models to Update**

### 1. User Model
- Remove `subscription` sub-document
- Remove `isPremium` field
- Keep provider profile and verification fields

### 2. Payment Model
- Remove subscription-related fields
- Keep job payment fields

## 🧹 **Database Cleanup Scripts Needed**

### 1. Remove Premium Data
- Remove all subscription records
- Remove all upgrade requests
- Remove all ad records
- Update user records to remove premium fields

### 2. Clean Up Orphaned Data
- Remove orphaned payments
- Remove orphaned notifications
- Remove orphaned offers

## ✅ **Keep These (Still Used)**

### Routes
- `authRoutes.js` - User authentication
- `userRoutes.js` - User management
- `categoryRoutes.js` - Categories and subcategories
- `jobRequestRoutes.js` - Service requests
- `listingRoutes.js` - Provider listings
- `providerRoutes.js` - Provider management
- `bookingRoutes.js` - Calendar/booking system
- `uploadRoutes.js` - Image uploads (ImgBB)
- `chatRoutes.js` - Messaging
- `notificationRoutes.js` - Notifications
- `paymentRoutes.js` - Job payments
- `verificationRoutes.js` - Identity verification
- `adminRoutes.js` - Admin dashboard
- `reviewRoutes.js` - Reviews
- `complaintRoutes.js` - Complaints
- `reportRoutes.js` - Reports
- `scheduleRoutes.js` - Scheduling
- `settingsRoutes.js` - User settings

### Models
- `User.js` - User accounts
- `Category.js` - Categories and subcategories
- `JobRequest.js` - Service requests
- `ServiceListing.js` - Provider listings
- `Payment.js` - Job payments
- `Notification.js` - Notifications
- `Conversation.js` - Chat conversations
- `Message.js` - Chat messages
- `Offer.js` - Job offers
- `Review.js` - Reviews
- `Complaint.js` - Complaints
- `Report.js` - Reports
- `Admin.js` - Admin accounts
- `AdminAction.js` - Admin audit log 