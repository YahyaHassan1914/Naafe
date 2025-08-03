import express from 'express';
import AdminController from '../controllers/adminController.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import upload from '../middlewares/upload.js';
import User from '../models/User.js';
import userService from '../services/userService.js';

const router = express.Router();

const adminController = new AdminController();

// GET /api/admin/stats - Admin dashboard stats
router.get('/stats', authenticateToken, requireRole(['admin']), adminController.getDashboardStats.bind(adminController));

// GET /api/admin/charts/user-growth - User growth chart data
router.get('/charts/user-growth', authenticateToken, requireRole(['admin']), adminController.getUserGrowthData.bind(adminController));

// GET /api/admin/charts/service-categories - Service categories chart data
router.get('/charts/service-categories', authenticateToken, requireRole(['admin']), adminController.getServiceCategoriesData.bind(adminController));

// GET /api/admin/charts/revenue - Revenue chart data
router.get('/charts/revenue', authenticateToken, requireRole(['admin']), adminController.getRevenueData.bind(adminController));

// GET /api/admin/activity - Recent activity data
router.get('/activity', authenticateToken, requireRole(['admin']), adminController.getRecentActivity.bind(adminController));

// Upgrade Requests
// Removed upgrade request routes - feature no longer exists

// Removed upgrade request submission - feature no longer exists

/**
 * Update provider rating (temporary endpoint for testing)
 * POST /api/admin/update-provider-rating/:userId
 */
router.post('/update-provider-rating/:userId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { userId } = req.params;
    await userService.updateUserRatingAndReviewCount(userId);
    
    res.json({
      success: true,
      message: `Updated rating for provider ${userId}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Update all provider ratings (temporary endpoint for testing)
 * POST /api/admin/update-all-provider-ratings
 */
router.post('/update-all-provider-ratings', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const providers = await User.find({ roles: 'provider' });
    let updatedCount = 0;
    
    for (const provider of providers) {
      try {
        await userService.updateUserRatingAndReviewCount(provider._id.toString());
        updatedCount++;
      } catch (error) {
        console.error(`Failed to update provider ${provider._id}:`, error.message);
      }
    }
    
    res.json({
      success: true,
      message: `Updated ratings for ${updatedCount} providers`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: error.message },
      timestamp: new Date().toISOString()
    });
  }
});

export default router; 