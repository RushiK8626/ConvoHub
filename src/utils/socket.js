import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

// Debug: Log the Socket URL being used
console.log('🔌 Socket URL:', SOCKET_URL);
console.log('🔧 Environment:', process.env.NODE_ENV);
console.log('🌐 Server URL:', process.env.REACT_APP_API_URL);
class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect(userId) {
    if (this.socket && this.isConnected) {
      return this.socket;
    }

    const token = localStorage.getItem('accessToken');
    
    this.socket = io(SOCKET_URL, {
      auth: {
        token,
        userId
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket connected:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join a chat room
  joinChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join_chat', { chatId });
      console.log(`📥 Joined chat room: ${chatId}`);
    }
  }

  // Leave a chat room
  leaveChat(chatId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave_chat', { chatId });
      console.log(`📤 Left chat room: ${chatId}`);
    }
  }

  // Send a text message
  sendMessage(messageData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('send_message', messageData);
      console.log('📨 Message sent via socket');
    }
  }

  // Listen for new messages
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('new_message', callback);
    }
  }

  // Listen for message status updates
  onMessageStatusUpdate(callback) {
    if (this.socket) {
      this.socket.on('message_status_update', callback);
    }
  }

  // Listen for typing indicators
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  onUserStoppedTyping(callback) {
    if (this.socket) {
      this.socket.on('user_stopped_typing', callback);
    }
  }

  // Send typing indicator
  sendTyping(chatId, userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('typing', { chatId, userId });
    }
  }

  sendStoppedTyping(chatId, userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('stopped_typing', { chatId, userId });
    }
  }

  // Listen for user online status
  onUserOnlineStatus(callback) {
    if (this.socket) {
      this.socket.on('user_online_status', callback);
    }
  }

  // Mark message as read
  markMessageAsRead(messageId, userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('mark_read', { messageId, userId });
    }
  }

  // Remove specific event listener
  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Remove all listeners for an event
  removeAllListeners(event) {
    if (this.socket) {
      this.socket.removeAllListeners(event);
    }
  }

  getSocket() {
    return this.socket;
  }

  isSocketConnected() {
    return this.isConnected && this.socket?.connected;
  }
}

// Export a singleton instance
const socketService = new SocketService();
export default socketService;
