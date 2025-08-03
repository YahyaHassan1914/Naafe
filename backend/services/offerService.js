import Offer from '../models/Offer.js';
import ServiceRequest from '../models/JobRequest.js'; // Updated import
import User from '../models/User.js';
import { logger } from '../middlewares/logging.middleware.js';

class OfferService {
  /**
   * Create a new offer for a service request
   * @param {Object} offerData - Offer data
   * @param {string} providerId - ID of the provider creating the offer
   * @returns {Object} Created offer
   */
  async createOffer(offerData, providerId) {
    try {
      logger.info(`Creating offer for service request: ${offerData.requestId} by provider: ${providerId}`);
      
      // Verify provider exists and is verified
      const provider = await User.findById(providerId);
      if (!provider || provider.role !== 'provider') {
        throw new Error('Provider not found or not authorized');
      }
      
      if (provider.verificationStatus !== 'approved') {
        throw new Error('Provider must be verified to create offers');
      }

      // Verify service request exists and is open
      const serviceRequest = await ServiceRequest.findById(offerData.requestId);
      if (!serviceRequest) {
        throw new Error('Service request not found');
      }
      
      if (serviceRequest.status !== 'open') {
        throw new Error('Service request is not open for offers');
      }

      // Check if provider already has an offer for this request
      const existingOffer = await Offer.findOne({
        requestId: offerData.requestId,
        providerId: providerId,
        status: { $in: ['pending', 'negotiating'] }
      });
      
      if (existingOffer) {
        throw new Error('Provider already has an active offer for this service request');
      }

      // Prepare timeline data
      const timeline = {
        startDate: offerData.timeline?.startDate || new Date(),
        duration: offerData.timeline?.duration || offerData.timeline || '2-3 days'
      };

      // Prepare payment schedule data
      const paymentSchedule = {
        deposit: offerData.paymentSchedule?.deposit || 0,
        milestone: offerData.paymentSchedule?.milestone || 0,
        final: offerData.paymentSchedule?.final || offerData.price
      };

      // Create offer with new model structure
      const offer = new Offer({
        requestId: offerData.requestId,
        providerId: providerId,
        price: offerData.price,
        timeline: timeline,
        scopeOfWork: offerData.scopeOfWork,
        materialsIncluded: offerData.materialsIncluded || [],
        warranty: offerData.warranty || 'No warranty',
        paymentSchedule: paymentSchedule,
        status: 'pending'
      });

      await offer.save();
      logger.info(`Offer created successfully: ${offer._id}`);

      // Update service request status to negotiating if this is the first offer
      const offerCount = await Offer.countDocuments({ 
        requestId: offerData.requestId, 
        status: { $in: ['pending', 'negotiating'] } 
      });
      
      if (offerCount === 1) {
        await ServiceRequest.findByIdAndUpdate(offerData.requestId, { status: 'negotiating' });
      }

      // Populate offer with provider and request details
      await offer.populate([
        { path: 'providerId', select: 'name email avatarUrl providerProfile' },
        { path: 'requestId', select: 'category subcategory description urgency location' }
      ]);

      return offer;
    } catch (error) {
      logger.error(`Error creating offer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all offers with filtering
   * @param {Object} filters - Filter options
   * @param {string} userId - User ID for authorization
   * @returns {Object} Object with offers and total count
   */
  async getAllOffers(filters = {}, userId) {
    try {
      const {
        status,
        requestId,
        providerId,
        page = 1,
        limit = 20
      } = filters;
      
      logger.info(`Getting offers with filters:`, filters);

      let query = {};

      // Apply filters
      if (status) {
        query.status = status;
      }

      if (requestId) {
        query.requestId = requestId;
      }

      if (providerId) {
        query.providerId = providerId;
      }

      // Authorization: Users can only see offers they're involved with
      const user = await User.findById(userId);
      if (user.role === 'provider') {
        query.providerId = userId;
      } else if (user.role === 'seeker') {
        // Get service requests created by this seeker
        const seekerRequests = await ServiceRequest.find({ seekerId: userId }).select('_id');
        query.requestId = { $in: seekerRequests.map(req => req._id) };
      } else if (user.role !== 'admin') {
        throw new Error('Unauthorized to view offers');
      }

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute query
      const [offers, total] = await Promise.all([
        Offer.find(query)
          .populate('providerId', 'name email avatarUrl providerProfile')
          .populate('requestId', 'category subcategory description urgency location')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Offer.countDocuments(query)
      ]);

      return {
        offers,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      logger.error(`Error getting offers: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get offer by ID
   * @param {string} offerId - Offer ID
   * @param {string} userId - User ID for authorization
   * @returns {Object} Offer with populated data
   */
  async getOfferById(offerId, userId) {
    try {
      const offer = await Offer.findById(offerId)
        .populate('providerId', 'name email avatarUrl providerProfile')
        .populate('requestId', 'category subcategory description urgency location seekerId');

      if (!offer) {
        throw new Error('Offer not found');
      }

      // Check authorization
      const user = await User.findById(userId);
      const isAuthorized = 
        user.role === 'admin' ||
        offer.providerId._id.toString() === userId.toString() ||
        offer.requestId.seekerId.toString() === userId.toString();

      if (!isAuthorized) {
        throw new Error('Unauthorized to view this offer');
      }

      return offer;
    } catch (error) {
      logger.error(`Error getting offer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update an offer
   * @param {string} offerId - Offer ID
   * @param {Object} updateData - Update data
   * @param {string} userId - User ID for authorization
   * @returns {Object} Updated offer
   */
  async updateOffer(offerId, updateData, userId) {
    try {
      const offer = await Offer.findById(offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      // Check authorization (only offer owner can update)
      if (offer.providerId.toString() !== userId) {
        throw new Error('Unauthorized to update this offer');
      }

      // Only allow updates if offer is pending
      if (offer.status !== 'pending') {
        throw new Error('Cannot update offer that is not pending');
      }

      // Update allowed fields
      const allowedUpdates = ['price', 'timeline', 'scopeOfWork', 'materialsIncluded', 'warranty', 'paymentSchedule'];
      const updates = {};
      
      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          updates[field] = updateData[field];
        }
      });

      const updatedOffer = await Offer.findByIdAndUpdate(
        offerId,
        updates,
        { new: true, runValidators: true }
      ).populate([
        { path: 'providerId', select: 'name email avatarUrl providerProfile' },
        { path: 'requestId', select: 'category subcategory description urgency location' }
      ]);

      logger.info(`Offer updated: ${offerId}`);
      return updatedOffer;
    } catch (error) {
      logger.error(`Error updating offer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Accept an offer
   * @param {string} offerId - Offer ID
   * @param {string} userId - User ID (seeker)
   * @returns {Object} Accepted offer
   */
  async acceptOffer(offerId, userId) {
    try {
      const offer = await Offer.findById(offerId)
        .populate('requestId');
      
      if (!offer) {
        throw new Error('Offer not found');
      }

      // Check authorization (only service request owner can accept)
      if (offer.requestId.seekerId.toString() !== userId.toString()) {
        throw new Error('Unauthorized to accept this offer');
      }

      // Only allow acceptance if offer is pending
      if (offer.status !== 'pending') {
        throw new Error('Cannot accept offer that is not pending');
      }

      // Update offer status
      offer.status = 'accepted';
      await offer.save();

      // Update service request status and assign provider
      await ServiceRequest.findByIdAndUpdate(offer.requestId._id, {
        status: 'assigned',
        assignedTo: offer.providerId
      });

      // Reject all other offers for this request
      await Offer.updateMany(
        { 
          requestId: offer.requestId._id, 
          _id: { $ne: offerId },
          status: { $in: ['pending', 'negotiating'] }
        },
        { status: 'rejected' }
      );

      logger.info(`Offer accepted: ${offerId}`);
      return offer;
    } catch (error) {
      logger.error(`Error accepting offer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Reject an offer
   * @param {string} offerId - Offer ID
   * @param {string} userId - User ID (seeker)
   * @returns {Object} Rejected offer
   */
  async rejectOffer(offerId, userId) {
    try {
      const offer = await Offer.findById(offerId)
        .populate('requestId');
      
      if (!offer) {
        throw new Error('Offer not found');
      }

      // Check authorization (only service request owner can reject)
      if (offer.requestId.seekerId.toString() !== userId.toString()) {
        throw new Error('Unauthorized to reject this offer');
      }

      // Only allow rejection if offer is pending
      if (offer.status !== 'pending') {
        throw new Error('Cannot reject offer that is not pending');
      }

      // Update offer status
      offer.status = 'rejected';
      await offer.save();

      logger.info(`Offer rejected: ${offerId}`);
      return offer;
    } catch (error) {
      logger.error(`Error rejecting offer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete/withdraw an offer
   * @param {string} offerId - Offer ID
   * @param {string} userId - User ID (provider)
   * @returns {Object} Deletion result
   */
  async deleteOffer(offerId, userId) {
    try {
      const offer = await Offer.findById(offerId);
      if (!offer) {
        throw new Error('Offer not found');
      }

      // Check authorization (only offer owner can delete)
      if (offer.providerId.toString() !== userId) {
        throw new Error('Unauthorized to delete this offer');
      }

      // Only allow deletion if offer is pending
      if (offer.status !== 'pending') {
        throw new Error('Cannot delete offer that is not pending');
      }

      await Offer.findByIdAndDelete(offerId);
      logger.info(`Offer deleted: ${offerId}`);

      return { message: 'Offer deleted successfully' };
    } catch (error) {
      logger.error(`Error deleting offer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Negotiate on an offer
   * @param {string} offerId - Offer ID
   * @param {Object} negotiationData - Negotiation data
   * @param {string} userId - User ID
   * @returns {Object} Updated offer with negotiation
   */
  async negotiateOffer(offerId, negotiationData, userId) {
    try {
      const offer = await Offer.findById(offerId)
        .populate('requestId');
      
      if (!offer) {
        throw new Error('Offer not found');
      }

      // Check authorization (only offer participants can negotiate)
      const isProvider = offer.providerId.toString() === userId.toString();
      const isSeeker = offer.requestId.seekerId.toString() === userId.toString();
      
      if (!isProvider && !isSeeker) {
        throw new Error('Unauthorized to negotiate on this offer');
      }

      // Only allow negotiation if offer is pending
      if (offer.status !== 'pending') {
        throw new Error('Cannot negotiate on offer that is not pending');
      }

      // Add negotiation message
      const negotiation = {
        userId: userId,
        message: negotiationData.message,
        counterPrice: negotiationData.counterPrice,
        timestamp: new Date()
      };

      if (!offer.negotiations) {
        offer.negotiations = [];
      }
      offer.negotiations.push(negotiation);

      // Update offer status to negotiating
      offer.status = 'negotiating';
      await offer.save();

      logger.info(`Negotiation added to offer: ${offerId}`);
      return offer;
    } catch (error) {
      logger.error(`Error negotiating offer: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get negotiation history for an offer
   * @param {string} offerId - Offer ID
   * @param {string} userId - User ID for authorization
   * @returns {Array} Negotiation history
   */
  async getNegotiationHistory(offerId, userId) {
    try {
      const offer = await Offer.findById(offerId)
        .populate('requestId');
      
      if (!offer) {
        throw new Error('Offer not found');
      }

      // Check authorization (only offer participants can view history)
      const isProvider = offer.providerId.toString() === userId.toString();
      const isSeeker = offer.requestId.seekerId.toString() === userId.toString();
      
      if (!isProvider && !isSeeker) {
        throw new Error('Unauthorized to view negotiation history');
      }

      return offer.negotiations || [];
    } catch (error) {
      logger.error(`Error getting negotiation history: ${error.message}`);
      throw error;
    }
  }
}

export default new OfferService(); 