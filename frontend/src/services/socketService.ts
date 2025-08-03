import { io, Socket } from 'socket.io-client';
import { authService } from './authService';

// Socket event types
export interface SocketEvents {
  // Connection events
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'connect_error': (error: Error) => void;

  // Authentication events
  'auth:success': (data: { user: any }) => void;
  'auth:error': (data: { message: string }) => void;

  // Notification events
  'notify:newNotification': (data: { notification: any }) => void;
  'notify:notificationUpdated': (data: { notification: any }) => void;

  // Offer events
  'offer:created': (data: { offerId: string; providerId: string; timestamp: string }) => void;
  'offer:updated': (data: { offerId: string; changes: any }) => void;
  'offer:accepted': (data: { offerId: string; seekerId: string; timestamp: string }) => void;
  'offer:rejected': (data: { offerId: string; seekerId: string; timestamp: string }) => void;
  'offer:expired': (data: { offerId: string; timestamp: string }) => void;

  // Negotiation events
  'negotiation:newMessage': (data: { offerId: string; message: any }) => void;
  'negotiation:counterOffer': (data: { offerId: string; counterOffer: any }) => void;

  // Payment events
  'payment:created': (data: { paymentId: string; seekerId: string; providerId: string }) => void;
  'payment:completed': (data: { paymentId: string; timestamp: string }) => void;
  'payment:failed': (data: { paymentId: string; reason: string }) => void;

  // Service request events
  'request:created': (data: { requestId: string; seekerId: string; category: string }) => void;
  'request:updated': (data: { requestId: string; changes: any }) => void;
  'request:assigned': (data: { requestId: string; providerId: string; timestamp: string }) => void;
  'request:completed': (data: { requestId: string; timestamp: string }) => void;
  'request:cancelled': (data: { requestId: string; reason: string; timestamp: string }) => void;

  // Chat events
  'chat:message': (data: { message: any }) => void;
  'chat:typing': (data: { userId: string; isTyping: boolean }) => void;
  'chat:read': (data: { messageId: string; userId: string }) => void;

  // Admin events
  'admin:userBlocked': (data: { userId: string; reason: string }) => void;
  'admin:userUnblocked': (data: { userId: string }) => void;
  'admin:verificationApproved': (data: { userId: string; category: string }) => void;
  'admin:verificationRejected': (data: { userId: string; reason: string }) => void;
}

// Socket service class
class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private eventListeners: Map<string, Set<Function>> = new Map();
  private isConnecting = false;

  /**
   * Initialize socket connection
   */
  async connect(): Promise<Socket | null> {
    if (this.socket?.connected || this.isConnecting) {
      return this.socket;
    }

    this.isConnecting = true;

    try {
      const token = authService.getAccessToken();
      if (!token) {
        console.warn('No access token available for socket connection');
        this.isConnecting = false;
        return null;
      }

      const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

      this.socket = io(SOCKET_URL, {
        auth: {
          token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true
      });

      this.setupEventListeners();
      this.setupReconnection();

      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket initialization failed'));
          return;
        }

        this.socket.on('connect', () => {
          console.log('Socket connected successfully');
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          this.isConnecting = false;
          resolve(this.socket);
        });

        this.socket.on('connect_error', (error) => {
          console.error('Socket connection error:', error);
          this.isConnecting = false;
          reject(error);
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!this.socket?.connected) {
            this.isConnecting = false;
            reject(new Error('Socket connection timeout'));
          }
        }, 10000);
      });
    } catch (error) {
      console.error('Error connecting to socket:', error);
      this.isConnecting = false;
      return null;
    }
  }

  /**
   * Disconnect socket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.eventListeners.clear();
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket instance
   */
  getSocket(): Socket | null {
    return this.socket;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.emit('disconnect', reason);
    });

    // Authentication events
    this.socket.on('auth:success', (data) => {
      console.log('Socket authentication successful');
      this.emit('auth:success', data);
    });

    this.socket.on('auth:error', (data) => {
      console.error('Socket authentication error:', data);
      this.emit('auth:error', data);
    });

    // Notification events
    this.socket.on('notify:newNotification', (data) => {
      console.log('New notification received:', data);
      this.emit('notify:newNotification', data);
    });

    this.socket.on('notify:notificationUpdated', (data) => {
      console.log('Notification updated:', data);
      this.emit('notify:notificationUpdated', data);
    });

    // Offer events
    this.socket.on('offer:created', (data) => {
      console.log('New offer created:', data);
      this.emit('offer:created', data);
    });

    this.socket.on('offer:updated', (data) => {
      console.log('Offer updated:', data);
      this.emit('offer:updated', data);
    });

    this.socket.on('offer:accepted', (data) => {
      console.log('Offer accepted:', data);
      this.emit('offer:accepted', data);
    });

    this.socket.on('offer:rejected', (data) => {
      console.log('Offer rejected:', data);
      this.emit('offer:rejected', data);
    });

    this.socket.on('offer:expired', (data) => {
      console.log('Offer expired:', data);
      this.emit('offer:expired', data);
    });

    // Negotiation events
    this.socket.on('negotiation:newMessage', (data) => {
      console.log('New negotiation message:', data);
      this.emit('negotiation:newMessage', data);
    });

    this.socket.on('negotiation:counterOffer', (data) => {
      console.log('New counter offer:', data);
      this.emit('negotiation:counterOffer', data);
    });

    // Payment events
    this.socket.on('payment:created', (data) => {
      console.log('Payment created:', data);
      this.emit('payment:created', data);
    });

    this.socket.on('payment:completed', (data) => {
      console.log('Payment completed:', data);
      this.emit('payment:completed', data);
    });

    this.socket.on('payment:failed', (data) => {
      console.log('Payment failed:', data);
      this.emit('payment:failed', data);
    });

    // Service request events
    this.socket.on('request:created', (data) => {
      console.log('Service request created:', data);
      this.emit('request:created', data);
    });

    this.socket.on('request:updated', (data) => {
      console.log('Service request updated:', data);
      this.emit('request:updated', data);
    });

    this.socket.on('request:assigned', (data) => {
      console.log('Service request assigned:', data);
      this.emit('request:assigned', data);
    });

    this.socket.on('request:completed', (data) => {
      console.log('Service request completed:', data);
      this.emit('request:completed', data);
    });

    this.socket.on('request:cancelled', (data) => {
      console.log('Service request cancelled:', data);
      this.emit('request:cancelled', data);
    });

    // Chat events
    this.socket.on('chat:message', (data) => {
      console.log('New chat message:', data);
      this.emit('chat:message', data);
    });

    this.socket.on('chat:typing', (data) => {
      this.emit('chat:typing', data);
    });

    this.socket.on('chat:read', (data) => {
      this.emit('chat:read', data);
    });

    // Admin events
    this.socket.on('admin:userBlocked', (data) => {
      console.log('User blocked:', data);
      this.emit('admin:userBlocked', data);
    });

    this.socket.on('admin:userUnblocked', (data) => {
      console.log('User unblocked:', data);
      this.emit('admin:userUnblocked', data);
    });

    this.socket.on('admin:verificationApproved', (data) => {
      console.log('Verification approved:', data);
      this.emit('admin:verificationApproved', data);
    });

    this.socket.on('admin:verificationRejected', (data) => {
      console.log('Verification rejected:', data);
      this.emit('admin:verificationRejected', data);
    });
  }

  /**
   * Setup reconnection logic
   */
  private setupReconnection(): void {
    if (!this.socket) return;

    this.socket.on('disconnect', (reason) => {
      if (reason === 'io server disconnect') {
        // Server disconnected us, don't reconnect
        return;
      }

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        
        setTimeout(() => {
          this.reconnectAttempts++;
          this.reconnectDelay *= 2; // Exponential backoff
          this.connect();
        }, this.reconnectDelay);
      } else {
        console.error('Max reconnection attempts reached');
      }
    });
  }

  /**
   * Join a room
   */
  joinRoom(room: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-room', { room });
    }
  }

  /**
   * Leave a room
   */
  leaveRoom(room: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-room', { room });
    }
  }

  /**
   * Join user's notification room
   */
  joinNotifications(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-notifications', { userId });
    }
  }

  /**
   * Leave user's notification room
   */
  leaveNotifications(userId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-notifications', { userId });
    }
  }

  /**
   * Join offer room
   */
  joinOffer(offerId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-offer', { offerId });
    }
  }

  /**
   * Leave offer room
   */
  leaveOffer(offerId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-offer', { offerId });
    }
  }

  /**
   * Join chat room
   */
  joinChat(chatId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('join-chat', { chatId });
    }
  }

  /**
   * Leave chat room
   */
  leaveChat(chatId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave-chat', { chatId });
    }
  }

  /**
   * Send chat message
   */
  sendChatMessage(chatId: string, message: string): void {
    if (this.socket?.connected) {
      this.socket.emit('chat:message', { chatId, message });
    }
  }

  /**
   * Send typing indicator
   */
  sendTyping(chatId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('chat:typing', { chatId, isTyping });
    }
  }

  /**
   * Mark message as read
   */
  markMessageRead(messageId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('chat:read', { messageId });
    }
  }

  /**
   * Add event listener
   */
  on<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)?.add(callback as Function);
  }

  /**
   * Remove event listener
   */
  off<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]): void {
    this.eventListeners.get(event)?.delete(callback as Function);
  }

  /**
   * Emit event to listeners
   */
  private emit<T extends keyof SocketEvents>(event: T, data: Parameters<SocketEvents[T]>[0]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          (callback as Function)(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<void> {
    try {
      const response = await authService.refreshToken();
      if (response.success && response.data) {
        authService.storeTokens(response.data);
        
        // Reconnect with new token
        this.disconnect();
        await this.connect();
      }
    } catch (error) {
      console.error('Error refreshing token:', error);
      // Token refresh failed, user needs to login again
      authService.logout();
    }
  }
}

// Create and export singleton instance
export const socketService = new SocketService();

export default socketService; 