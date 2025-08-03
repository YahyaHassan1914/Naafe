import ServiceRequest from '../models/JobRequest.js'; // Updated import
import User from '../models/User.js';
import Category from '../models/Category.js';
import Offer from '../models/Offer.js';
import { logger } from '../middlewares/logging.middleware.js';

class ServiceRequestService {
  /**
   * Create a new service request
   * @param {Object} requestData - Service request data
   * @param {string} seekerId - ID of the seeker creating the request
   * @returns {Object} Created service request
   */
  async createServiceRequest(requestData, seekerId) {
    try {
      logger.info(`Creating service request for seeker: ${seekerId}`);
      
      // Verify seeker exists and is a seeker
      const seeker = await User.findById(seekerId);
      if (!seeker) {
        throw new Error('Seeker not found');
      }
      
      if (seeker.role !== 'seeker') {
        throw new Error('Only seekers can create service requests');
      }

      // Verify category exists and is active
      const category = await Category.findOne({ name: requestData.category, isActive: true });
      if (!category) {
        throw new Error('Category does not exist or is not active');
      }

      // Create service request with new model structure
      const serviceRequest = new ServiceRequest({
        seekerId, // Updated field name
        category: requestData.category,
        subcategory: requestData.subcategory,
        description: requestData.description,
        urgency: requestData.urgency || 'flexible',
        location: {
          governorate: requestData.location.governorate,
          city: requestData.location.city
        },
        images: requestData.images || [],
        answers: requestData.answers || [],
        status: 'open'
      });

      await serviceRequest.save();
      logger.info(`Service request created successfully: ${serviceRequest._id}`);

      // Populate seeker information
      await serviceRequest.populate('seekerId', 'name email avatarUrl createdAt');

      return serviceRequest;
    } catch (error) {
      logger.error(`Error creating service request: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all service requests with filtering and pagination
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Object} Object with service requests and total count
   */
  async getAllServiceRequests(filters = {}, pagination = {}) {
    try {
      const {
        category,
        subcategory,
        status,
        urgency,
        governorate,
        city,
        search,
        page = 1,
        limit = 20
      } = filters;
      
      logger.info(`Getting service requests with filters:`, filters);

      let query = {};

      // Apply filters
      if (category) {
        query.category = category;
      }

      if (subcategory) {
        query.subcategory = subcategory;
      }

      if (status) {
        query.status = status;
      }

      if (urgency) {
        query.urgency = urgency;
      }

      if (governorate) {
        query['location.governorate'] = governorate;
      }

      if (city) {
        query['location.city'] = city;
      }

      // Text search
      if (search) {
        query.$or = [
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { subcategory: { $regex: search, $options: 'i' } }
        ];
      }

      // Only show open requests to public
      if (!filters.includeAll) {
        query.status = { $in: ['open', 'negotiating'] };
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [serviceRequests, total] = await Promise.all([
        ServiceRequest.find(query)
          .populate('seekerId', 'name avatarUrl createdAt')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        ServiceRequest.countDocuments(query)
      ]);

      return {
        serviceRequests,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error(`Error getting service requests: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get service request by ID
   * @param {string} requestId - Service request ID
   * @returns {Object} Service request with populated data
   */
  async getServiceRequestById(requestId) {
    try {
      const serviceRequest = await ServiceRequest.findById(requestId)
        .populate('seekerId', 'name email avatarUrl createdAt')
        .populate('assignedTo', 'name email avatarUrl providerProfile');

      if (!serviceRequest) {
        throw new Error('Service request not found');
      }

      return serviceRequest;
    } catch (error) {
      logger.error(`Error getting service request: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update service request
   * @param {string} requestId - Service request ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} Updated service request
   */
  async updateServiceRequest(requestId, updateData, userId) {
    try {
      const serviceRequest = await ServiceRequest.findById(requestId);
      if (!serviceRequest) {
        throw new Error('Service request not found');
      }

      // Check authorization (only seeker who created it or admin can update)
      if (serviceRequest.seekerId.toString() !== userId) {
        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
          throw new Error('Unauthorized to update this service request');
        }
      }

      // Only allow updates if request is still open
      if (serviceRequest.status !== 'open') {
        throw new Error('Cannot update service request that is not open');
      }

      // Update allowed fields
      const allowedUpdates = ['description', 'urgency', 'images', 'answers'];
      const updates = {};
      
      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      });

      const updatedRequest = await ServiceRequest.findByIdAndUpdate(
        requestId,
        updates,
        { new: true, runValidators: true }
      ).populate('seekerId', 'name email avatarUrl createdAt');

      logger.info(`Service request updated: ${requestId}`);
      return updatedRequest;
    } catch (error) {
      logger.error(`Error updating service request: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete service request
   * @param {string} requestId - Service request ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} Deletion result
   */
  async deleteServiceRequest(requestId, userId) {
    try {
      const serviceRequest = await ServiceRequest.findById(requestId);
      if (!serviceRequest) {
        throw new Error('Service request not found');
      }

      // Check authorization (only seeker who created it or admin can delete)
      if (serviceRequest.seekerId.toString() !== userId) {
        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
          throw new Error('Unauthorized to delete this service request');
        }
      }

      // Only allow deletion if request is still open
      if (serviceRequest.status !== 'open') {
        throw new Error('Cannot delete service request that is not open');
      }

      await ServiceRequest.findByIdAndDelete(requestId);
      logger.info(`Service request deleted: ${requestId}`);

      return { message: 'Service request deleted successfully' };
    } catch (error) {
      logger.error(`Error deleting service request: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get service requests by seeker
   * @param {string} seekerId - Seeker ID
   * @param {Object} filters - Filter options
   * @returns {Array} Array of service requests
   */
  async getServiceRequestsBySeeker(seekerId, filters = {}) {
    try {
      const query = { seekerId };
      
      if (filters.status) {
        query.status = filters.status;
      }

      const serviceRequests = await ServiceRequest.find(query)
        .populate('assignedTo', 'name email avatarUrl providerProfile')
        .sort({ createdAt: -1 });

      return serviceRequests;
    } catch (error) {
      logger.error(`Error getting seeker service requests: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get provider recommendations for a service request
   * @param {string} requestId - Service request ID
   * @returns {Array} Array of recommended providers
   */
  async getProviderRecommendations(requestId) {
    try {
      const serviceRequest = await ServiceRequest.findById(requestId);
      if (!serviceRequest) {
        throw new Error('Service request not found');
      }

      // Find providers with matching skills and location
      const providers = await User.find({
        role: 'provider',
        verificationStatus: 'approved',
        'providerProfile.skills': {
          $elemMatch: {
            category: serviceRequest.category,
            subcategory: serviceRequest.subcategory
          }
        },
        isActive: true
      })
      .select('name email avatarUrl providerProfile')
      .sort({ 'providerProfile.rating': -1, 'providerProfile.totalJobsCompleted': -1 })
      .limit(10);

      return providers;
    } catch (error) {
      logger.error(`Error getting provider recommendations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cancel a service request
   * @param {string} requestId - Service request ID
   * @param {string} userId - User ID
   * @param {string} reason - Cancellation reason
   * @returns {Object} Cancellation result
   */
  async cancelServiceRequest(requestId, userId, reason) {
    try {
      const serviceRequest = await ServiceRequest.findById(requestId);
      if (!serviceRequest) {
        throw new Error('Service request not found');
      }

      // Check authorization
      if (serviceRequest.seekerId.toString() !== userId && 
          serviceRequest.assignedTo?.toString() !== userId) {
        const user = await User.findById(userId);
        if (!user || user.role !== 'admin') {
          throw new Error('Unauthorized to cancel this service request');
        }
      }

      // Update status
      serviceRequest.status = 'cancelled';
      await serviceRequest.save();

      logger.info(`Service request cancelled: ${requestId} by user: ${userId}`);
      return { message: 'Service request cancelled successfully' };
    } catch (error) {
      logger.error(`Error cancelling service request: ${error.message}`);
      throw error;
    }
  }
}

export default new ServiceRequestService(); 