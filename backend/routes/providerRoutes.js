import express from 'express';
const router = express.Router();
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import Offer from '../models/Offer.js';
import JobRequest from '../models/JobRequest.js';
import User from '../models/User.js';
import ServiceListing from '../models/ServiceListing.js';

/**
 * @route   GET /api/providers/dashboard-stats
 * @desc    Get provider dashboard statistics
 * @access  Private (Providers only)
 * @returns {object} Dashboard statistics including earnings, completed jobs, active offers, etc.
 */
router.get('/dashboard-stats', 
  authenticateToken, 
  requireRole(['provider']),
  async (req, res) => {
    try {
      const providerId = req.user.id;

      // Get provider's offers
      const offers = await Offer.find({ provider: providerId })
        .populate('jobRequest', 'title budget status')
        .sort({ createdAt: -1 });

      // Calculate statistics
      const completedJobs = offers.filter(offer => offer.status === 'completed').length;
      const activeOffers = offers.filter(offer => offer.status === 'pending').length;
      const totalEarnings = offers
        .filter(offer => offer.status === 'completed')
        .reduce((sum, offer) => sum + (offer.budget?.min || 0), 0);

      // Get provider profile for rating
      const provider = await User.findById(providerId).select('providerProfile');
      const averageRating = provider?.providerProfile?.rating || 0;

      // Calculate response rate (completed jobs / total offers)
      const responseRate = offers.length > 0 ? Math.round((completedJobs / offers.length) * 100) : 0;

      const stats = {
        totalEarnings,
        completedJobs,
        activeOffers,
        averageRating,
        responseRate,
        totalOffers: offers.length
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error fetching provider dashboard stats:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch dashboard statistics'
        }
      });
    }
  }
);

/**
 * @route   GET /api/providers/recent-requests
 * @desc    Get recent requests in provider's categories
 * @access  Private (Providers only)
 * @query   {number} [limit=5] - Number of requests to return
 * @returns {object} Array of recent job requests
 */
router.get('/recent-requests',
  authenticateToken,
  requireRole(['provider']),
  async (req, res) => {
    try {
      const providerId = req.user.id;
      const limit = parseInt(req.query.limit) || 5;

      // Get provider's skills
      const provider = await User.findById(providerId).select('providerProfile');
      const providerSkills = provider?.providerProfile?.skills || [];

      // Build query for requests
      let query = { status: 'open' };
      
      // Filter by provider's skills if available
      if (providerSkills.length > 0) {
        query.category = { $in: providerSkills };
      }

      const requests = await JobRequest.find(query)
        .populate('seeker', 'name')
        .sort({ createdAt: -1 })
        .limit(limit);

      // Map to frontend format
      const mappedRequests = requests.map(request => ({
        id: request._id,
        title: request.title,
        category: request.category,
        budget: request.budget || { min: 0, max: 0 },
        createdAt: request.createdAt,
        views: Math.floor(Math.random() * 20) + 1, // Mock data for now
        responses: Math.floor(Math.random() * 5) + 1, // Mock data for now
        seeker: request.seeker
      }));

      res.json({
        success: true,
        data: {
          requests: mappedRequests,
          totalCount: requests.length
        }
      });

    } catch (error) {
      console.error('Error fetching recent requests:', error);
      res.status(500).json({
        success: false,
        error: {
          message: 'Failed to fetch recent requests'
        }
      });
    }
  }
);

/**
 * @route   GET /api/providers/profile
 * @desc    Get provider's service profile
 * @access  Private (Providers only)
 * @returns {object} Provider's service profile data
 */
router.get('/profile',
  authenticateToken,
  requireRole(['provider']),
  async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Get provider's service listing
      const serviceListing = await ServiceListing.findOne({
        provider: userId
      }).lean();
      
      if (!serviceListing) {
        return res.json({
          success: true,
          data: {
            category: '',
            subcategory: '',
            description: '',
            budgetMin: 0,
            budgetMax: 0,
            availability: {
              days: [],
              timeSlots: []
            },
            skills: []
          }
        });
      }
      
      res.json({
        success: true,
        data: {
          category: serviceListing.category || '',
          subcategory: serviceListing.subcategory || '',
          description: serviceListing.description || '',
          budgetMin: serviceListing.budget?.min || 0,
          budgetMax: serviceListing.budget?.max || 0,
          availability: serviceListing.availability || {
            days: [],
            timeSlots: []
          },
          skills: serviceListing.provider?.providerProfile?.skills || []
        }
      });
    } catch (error) {
      console.error('Error fetching provider profile:', error);
      res.status(500).json({
        success: false,
        error: { message: 'فشل في تحميل الملف الشخصي' }
      });
    }
  }
);

/**
 * @route   PUT /api/providers/profile
 * @desc    Update provider's service profile
 * @access  Private (Providers only)
 * @body    {object} Profile data
 * @returns {object} Updated profile data
 */
router.put('/profile',
  authenticateToken,
  requireRole(['provider']),
  async (req, res) => {
    try {
      const userId = req.user.id;
      const profileData = req.body;
      
      // Update or create service listing
      const serviceListing = await ServiceListing.findOneAndUpdate(
        { provider: userId },
        {
          provider: userId,
          category: profileData.category,
          subcategory: profileData.subcategory,
          title: `${profileData.category} - ${profileData.subcategory}`,
          description: profileData.description,
          budget: {
            min: profileData.budgetMin,
            max: profileData.budgetMax
          },
          availability: profileData.availability,
          isActive: true
        },
        { upsert: true, new: true }
      );
      
      // Update user's provider profile skills
      await User.findByIdAndUpdate(userId, {
        'providerProfile.skills': [profileData.category]
      });
      
      res.json({
        success: true,
        data: serviceListing,
        message: 'تم حفظ الملف الشخصي بنجاح'
      });
    } catch (error) {
      console.error('Error updating provider profile:', error);
      res.status(500).json({
        success: false,
        error: { message: 'فشل في حفظ الملف الشخصي' }
      });
    }
  }
);

export default router; 