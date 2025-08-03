import adminService from '../services/adminService.js';
// Removed UpgradeRequest import - feature no longer exists
import User from '../models/User.js';

class AdminController {
  /**
   * Get dashboard statistics for admin overview
   * GET /api/admin/stats
   */
  async getDashboardStats(req, res) {
    try {
      const stats = await adminService.getDashboardStats();
      res.status(200).json({
        success: true,
        data: stats,
        message: 'Dashboard statistics retrieved successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get user growth data for charts
   * GET /api/admin/charts/user-growth
   */
  async getUserGrowthData(req, res) {
    try {
      const data = await adminService.getUserGrowthData();
      res.status(200).json({
        success: true,
        data,
        message: 'User growth data retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error'
        }
      });
    }
  }

  /**
   * Get service categories data for charts
   * GET /api/admin/charts/service-categories
   */
  async getServiceCategoriesData(req, res) {
    try {
      const data = await adminService.getServiceCategoriesData();
      res.status(200).json({
        success: true,
        data,
        message: 'Service categories data retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error'
        }
      });
    }
  }

  /**
   * Get revenue data for charts
   * GET /api/admin/charts/revenue
   */
  async getRevenueData(req, res) {
    try {
      const data = await adminService.getRevenueData();
      res.status(200).json({
        success: true,
        data,
        message: 'Revenue data retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error'
        }
      });
    }
  }

  /**
   * Get recent activity data
   * GET /api/admin/activity
   */
  async getRecentActivity(req, res) {
    try {
      const data = await adminService.getRecentActivity();
      res.status(200).json({
        success: true,
        data,
        message: 'Recent activity data retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error'
        }
      });
    }
  }

  // Removed getUpgradeRequests method - feature no longer exists


}

export default AdminController; 