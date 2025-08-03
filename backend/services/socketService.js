import { Server } from 'socket.io';
import chatService from './chatService.js';
import { logger } from '../middlewares/logging.middleware.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

class SocketService {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // Map<userId, socketId>
  }

  /**
   * Initialize Socket.IO server
   */
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info('Socket.IO server initialized');
  }

  /**
   * Setup Socket.IO middleware
   */
  setupMiddleware() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Import authService dynamically to avoid circular dependency
        const { default: authService } = await import('./authService.js');
        const user = await authService.getCurrentUser(token);
        
        if (!user) {
          return next(new Error('Invalid or expired token'));
        }

        // Attach user to socket
        socket.user = user;
        socket.userId = user._id.toString();
        
        logger.info(`Socket authenticated: ${user._id} (${user.email})`);
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.userId} (${socket.user.email})`);
      
      // Store connected user
      this.connectedUsers.set(socket.userId, socket.id);
      
      // Join user to their personal room
      socket.join(`user:${socket.userId}`);

      // Handle send-message event
      socket.on('send-message', async (data) => {
        try {
          await this.handleSendMessage(socket, data);
        } catch (error) {
          logger.error('Error handling send-message:', error);
          socket.emit('error', {
            message: 'Failed to send message',
            error: error.message
          });
        }
      });

      // Handle join-conversation event
      socket.on('join-conversation', async (data) => {
        try {
          await this.handleJoinConversation(socket, data);
        } catch (error) {
          logger.error('Error handling join-conversation:', error);
          socket.emit('error', {
            message: 'Failed to join conversation',
            error: error.message
          });
        }
      });

      // Handle leave-conversation event
      socket.on('leave-conversation', (data) => {
        try {
          this.handleLeaveConversation(socket, data);
        } catch (error) {
          logger.error('Error handling leave-conversation:', error);
        }
      });

      // Handle mark-read event
      socket.on('mark-read', async (data) => {
        try {
          await this.handleMarkRead(socket, data);
        } catch (error) {
          logger.error('Error handling mark-read:', error);
          socket.emit('error', {
            message: 'Failed to mark messages as read',
            error: error.message
          });
        }
      });

      // Handle join-offer event
      socket.on('join-offer', async (data) => {
        try {
          await this.handleJoinOffer(socket, data);
        } catch (error) {
          logger.error('Error handling join-offer:', error);
          socket.emit('error', {
            message: 'Failed to join offer',
            error: error.message
          });
        }
      });

      // Handle leave-offer event
      socket.on('leave-offer', (data) => {
        try {
          this.handleLeaveOffer(socket, data);
        } catch (error) {
          logger.error('Error handling leave-offer:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`User disconnected: ${socket.userId}`);
        this.connectedUsers.delete(socket.userId);
      });
    });
  }

  /**
   * Handle send-message event
   */
  async handleSendMessage(socket, data) {
    const { conversationId, receiverId, content } = data;
    const senderId = socket.userId;

    // Validate input
    if (!conversationId || !receiverId || !content) {
      throw new Error('Missing required fields: conversationId, receiverId, content');
    }

    // Check if user can access this conversation
    const canAccess = await chatService.canAccessConversation(conversationId, senderId);
    if (!canAccess) {
      throw new Error('Access denied to this conversation');
    }

    // Send message via chat service
    const message = await chatService.sendMessage(conversationId, senderId, receiverId, content);

    // Create notification for receiver
    try {
      const sender = await User.findById(senderId).select('name.first name.last');
      const senderName = sender ? `${sender.name.first} ${sender.name.last}` : 'شخص ما';
      
      const notification = new Notification({
        userId: receiverId,
        type: 'new_message',
        title: 'رسالة جديدة',
        message: `${senderName} أرسل لك رسالة جديدة`,
        data: { conversationId },
        isRead: false
      });
      await notification.save();

      // Emit notification to receiver if online
      this.emitToUser(receiverId, 'notify:newMessage', {
        notification: {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt
        }
      });

      logger.info(`Notification created for new message: ${notification._id}`);
    } catch (error) {
      logger.error('Error creating notification for new message:', error);
      // Don't throw error here as the message was already sent successfully
    }

    // Emit to sender (confirmation)
    const messageData = {
      _id: message._id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      timestamp: message.timestamp,
      read: message.read,
      readAt: message.readAt
    };

    socket.emit('message-sent', messageData);

    // Emit to conversation room for real-time delivery (excluding sender)
    socket.to(`conversation:${conversationId}`).emit('receive-message', messageData);

    logger.info(`Message sent via socket: ${message._id} from ${senderId} to ${receiverId}`);
  }

  /**
   * Handle join-conversation event
   */
  async handleJoinConversation(socket, data) {
    const { conversationId } = data;
    const userId = socket.userId;

    // Check if user can access this conversation
    const canAccess = await chatService.canAccessConversation(conversationId, userId);
    if (!canAccess) {
      throw new Error('Access denied to this conversation');
    }

    // Join conversation room
    socket.join(`conversation:${conversationId}`);
    
    logger.info(`User ${userId} joined conversation: ${conversationId}`);
  }

  /**
   * Handle leave-conversation event
   */
  handleLeaveConversation(socket, data) {
    const { conversationId } = data;
    
    // Leave conversation room
    socket.leave(`conversation:${conversationId}`);
    
    logger.info(`User ${socket.userId} left conversation: ${conversationId}`);
  }

  /**
   * Handle mark-read event
   */
  async handleMarkRead(socket, data) {
    const { conversationId } = data;
    const userId = socket.userId;

    // Check if user can access this conversation
    const canAccess = await chatService.canAccessConversation(conversationId, userId);
    if (!canAccess) {
      throw new Error('Access denied to this conversation');
    }

    // Mark messages as read
    const readCount = await chatService.markMessagesAsRead(conversationId, userId);

    // Emit to sender
    socket.emit('messages-read', {
      conversationId,
      readCount
    });

    logger.info(`Messages marked as read: ${readCount} messages for user ${userId}`);
  }

  /**
   * Handle join-offer event
   */
  async handleJoinOffer(socket, data) {
    const { offerId } = data;
    const userId = socket.userId;

    // Import offerService dynamically to avoid circular dependency
    const { default: offerService } = await import('./offerService.js');
    
    // Check if user can access this offer
    try {
      await offerService.getOfferById(offerId, userId);
      
      // Join offer room
      socket.join(`offer:${offerId}`);
      
      logger.info(`User ${userId} joined offer: ${offerId}`);
    } catch (error) {
      throw new Error('Access denied to this offer');
    }
  }

  /**
   * Handle leave-offer event
   */
  handleLeaveOffer(socket, data) {
    const { offerId } = data;
    
    // Leave offer room
    socket.leave(`offer:${offerId}`);
    
    logger.info(`User ${socket.userId} left offer: ${offerId}`);
  }

  /**
   * Get socket instance
   */
  getIO() {
    return this.io;
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get socket ID for user
   */
  getUserSocketId(userId) {
    return this.connectedUsers.get(userId);
  }

  /**
   * Emit to specific user
   */
  emitToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  /**
   * Emit to multiple users
   */
  emitToUsers(userIds, event, data) {
    userIds.forEach(userId => {
      this.emitToUser(userId, event, data);
    });
  }

  /**
   * Send offer notification to seeker
   */
  async sendOfferNotification(offerId, providerId, seekerId) {
    try {
      const provider = await User.findById(providerId).select('name.first name.last');
      const providerName = provider ? `${provider.name.first} ${provider.name.last}` : 'مقدم خدمة';
      
      const notification = new Notification({
        userId: seekerId,
        type: 'new_offer',
        title: 'عرض جديد',
        message: `${providerName} أرسل لك عرض جديد`,
        data: { offerId },
        isRead: false
      });
      await notification.save();
      
      // Emit notification to seeker
      this.emitToUser(seekerId, 'notify:newOffer', {
        notification: {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt
        }
      });
      
      // Emit to offer room for real-time updates
      this.emitToOffer(offerId, 'offer:created', {
        offerId,
        providerId,
        timestamp: new Date()
      });
      
      logger.info(`Offer notification sent for offer: ${offerId}`);
    } catch (error) {
      logger.error('Error sending offer notification:', error);
    }
  }

  /**
   * Send offer acceptance notification to provider
   */
  async sendOfferAcceptanceNotification(offerId, seekerId, providerId) {
    try {
      const seeker = await User.findById(seekerId).select('name.first name.last');
      const seekerName = seeker ? `${seeker.name.first} ${seeker.name.last}` : 'طالب الخدمة';
      
      const notification = new Notification({
        userId: providerId,
        type: 'offer_accepted',
        title: 'عرض مقبول',
        message: `${seekerName} قبل عرضك`,
        data: { offerId },
        isRead: false
      });
      await notification.save();
      
      // Emit notification to provider
      this.emitToUser(providerId, 'notify:offerAccepted', {
        notification: {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt
        }
      });
      
      // Emit to offer room for real-time updates
      this.emitToOffer(offerId, 'offer:accepted', {
        offerId,
        seekerId,
        timestamp: new Date()
      });
      
      logger.info(`Offer acceptance notification sent for offer: ${offerId}`);
    } catch (error) {
      logger.error('Error sending offer acceptance notification:', error);
    }
  }

  /**
   * Send payment notification to users
   */
  async sendPaymentNotification(paymentId, seekerId, providerId) {
    try {
      // Create notification for provider
      const notification = new Notification({
        userId: providerId,
        type: 'payment_created',
        title: 'دفع جديد',
        message: 'تم إنشاء دفعة جديدة للخدمة',
        data: { paymentId },
        isRead: false
      });
      await notification.save();
      
      // Emit to both users
      this.emitToUsers([seekerId, providerId], 'payment:created', {
        paymentId,
        timestamp: new Date()
      });
      
      // Emit notification to provider
      this.emitToUser(providerId, 'notify:paymentCreated', {
        notification: {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt
        }
      });
      
      logger.info(`Payment notification sent for payment: ${paymentId}`);
    } catch (error) {
      logger.error('Error sending payment notification:', error);
    }
  }

  /**
   * Send payment completion notification to users
   */
  async sendPaymentCompletionNotification(paymentId, seekerId, providerId) {
    try {
      // Create notification for both users
      const providerNotification = new Notification({
        userId: providerId,
        type: 'payment_completed',
        title: 'دفع مكتمل',
        message: 'تم اكتمال الدفع للخدمة',
        data: { paymentId },
        isRead: false
      });
      await providerNotification.save();
      
      const seekerNotification = new Notification({
        userId: seekerId,
        type: 'payment_completed',
        title: 'دفع مكتمل',
        message: 'تم اكتمال الدفع للخدمة',
        data: { paymentId },
        isRead: false
      });
      await seekerNotification.save();
      
      // Emit to both users
      this.emitToUsers([seekerId, providerId], 'payment:completed', {
        paymentId,
        timestamp: new Date()
      });
      
      // Emit notifications
      this.emitToUser(providerId, 'notify:paymentCompleted', {
        notification: {
          _id: providerNotification._id,
          type: providerNotification.type,
          title: providerNotification.title,
          message: providerNotification.message,
          data: providerNotification.data,
          isRead: providerNotification.isRead,
          createdAt: providerNotification.createdAt
        }
      });
      
      this.emitToUser(seekerId, 'notify:paymentCompleted', {
        notification: {
          _id: seekerNotification._id,
          type: seekerNotification.type,
          title: seekerNotification.title,
          message: seekerNotification.message,
          data: seekerNotification.data,
          isRead: seekerNotification.isRead,
          createdAt: seekerNotification.createdAt
        }
      });
      
      logger.info(`Payment completion notification sent for payment: ${paymentId}`);
    } catch (error) {
      logger.error('Error sending payment completion notification:', error);
    }
  }

  /**
   * Send negotiation notification
   */
  async sendNegotiationNotification(offerId, senderId, receiverId) {
    try {
      const sender = await User.findById(senderId).select('name.first name.last');
      const senderName = sender ? `${sender.name.first} ${sender.name.last}` : 'شخص ما';
      
      const notification = new Notification({
        userId: receiverId,
        type: 'negotiation_message',
        title: 'رسالة تفاوض',
        message: `${senderName} أرسل رسالة تفاوض جديدة`,
        data: { offerId },
        isRead: false
      });
      await notification.save();
      
      // Emit notification to receiver
      this.emitToUser(receiverId, 'notify:negotiationMessage', {
        notification: {
          _id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          isRead: notification.isRead,
          createdAt: notification.createdAt
        }
      });
      
      // Emit to offer room for real-time updates
      this.emitToOffer(offerId, 'negotiation:message', {
        offerId,
        senderId,
        timestamp: new Date()
      });
      
      logger.info(`Negotiation notification sent for offer: ${offerId}`);
    } catch (error) {
      logger.error('Error sending negotiation notification:', error);
    }
  }

  /**
   * Emit to conversation room
   */
  emitToConversation(conversationId, event, data) {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }

  /**
   * Emit to offer room
   */
  emitToOffer(offerId, event, data) {
    this.io.to(`offer:${offerId}`).emit(event, data);
  }
}

export default new SocketService(); 