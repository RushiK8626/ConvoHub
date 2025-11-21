import { io } from "socket.io-client";

// Ensure the configured socket URL does not end with a slash to avoid `//` when joining paths
const SOCKET_URL = (
  process.env.REACT_APP_SOCKET_URL || "http://localhost:3001"
).replace(/\/+$/, "");

// Log the Socket URL being used
console.log("🔌 Socket URL:", SOCKET_URL);
console.log("🔧 Environment:", process.env.NODE_ENV);
console.log("🌐 Server URL:", process.env.REACT_APP_API_URL);

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.userId = null;
  }

  connect(userId) {
    // If already connected with the same user, return existing socket
    if (this.socket && this.isConnected && this.userId === userId) {
      // console.log('Using existing socket connection');
      return this.socket;
    }

    // If connecting with a different user, disconnect first
    if (this.socket && this.userId && this.userId !== userId) {
      // console.log('Switching user, reconnecting socket...');
      this.disconnect();
    }

    this.userId = userId;
    const token = localStorage.getItem("accessToken");

    this.socket = io(SOCKET_URL, {
      auth: {
        token,
        userId,
      },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on("connect", () => {
      // console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
    });

    this.socket.on("disconnect", (reason) => {
      // console.log('Socket disconnected:', reason);
      this.isConnected = false;
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      this.isConnected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.userId = null;
      // console.log('Socket disconnected and cleaned up');
    }
  }

  // Join a chat room
  joinChat(chatId) {
    if (this.socket && this.isConnected) {
      // Ensure chatId is a number
      const numericChatId =
        typeof chatId === "string" ? parseInt(chatId, 10) : chatId;
      this.socket.emit("join_chat", { chatId: numericChatId });
      // console.log(`Joined chat room: ${numericChatId}`);
    } else {
      console.warn("⚠️ Cannot join chat - socket not connected");
    }
  }

  // Leave a chat room
  leaveChat(chatId) {
    if (this.socket && this.isConnected) {
      const numericChatId =
        typeof chatId === "string" ? parseInt(chatId, 10) : chatId;
      this.socket.emit("leave_chat", { chatId: numericChatId });
      // console.log(`Left chat room: ${numericChatId}`);
    }
  }

  // Send a text message
  sendMessage(messageData) {
    if (this.socket && this.isConnected) {
      // Ensure chat_id is a number
      const dataToSend = {
        ...messageData,
        chat_id:
          typeof messageData.chat_id === "string"
            ? parseInt(messageData.chat_id, 10)
            : messageData.chat_id,
        tempId: messageData.tempId, // Ensure tempId is always passed
      };

      // Use acknowledgment to ensure server received and saved the message
      this.socket.emit("send_message", dataToSend, (response) => {
        if (response && response.success) {
          // console.log('Server confirmed message received and saved:', response.message_id);
        } else {
          console.error(
            "Server failed to save message:",
            response?.error || "Unknown error"
          );
        }
      });
    } else {
      console.error("Cannot send message - socket not connected");
    }
  }

  // Send a message with file attachment via WebSocket using chunking for large files
  sendFileMessage(fileMessageData) {
    if (this.socket && this.isConnected) {
      const {
        fileBuffer,
        chat_id,
        fileName,
        fileSize,
        fileType,
        message_text,
        tempId,
      } = fileMessageData;

      // Check if file is too large for single message (>20MB), use chunking
      const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB chunks

      if (fileBuffer && fileBuffer.length > CHUNK_SIZE) {
        this._sendFileMessageInChunks(fileMessageData);
      } else {
        // Use acknowledgment to ensure server received and saved the message
        this.socket.emit("send_file_message", fileMessageData, (response) => {
          if (response && response.success) {
          } else {
            console.error(
              "❌ Server failed to save file message:",
              response?.error || "Unknown error"
            );
          }
        });
      }
    } else {
      console.error("❌ Cannot send file message - socket not connected");
    }
  }

  // Helper method to send large files in chunks
  _sendFileMessageInChunks(fileMessageData) {
    const {
      fileBuffer,
      chat_id,
      fileName,
      fileSize,
      fileType,
      message_text,
      tempId,
    } = fileMessageData;
    const CHUNK_SIZE = 20 * 1024 * 1024; // 20MB chunks
    const totalChunks = Math.ceil(fileBuffer.length / CHUNK_SIZE);

    // Send first chunk with metadata
    const firstChunk = fileBuffer.substring(0, CHUNK_SIZE);

    this.socket.emit(
      "send_file_message_chunk",
      {
        chat_id,
        fileName,
        fileSize,
        fileType,
        message_text,
        tempId,
        chunkData: firstChunk,
        chunkIndex: 0,
        totalChunks,
        isFirstChunk: true,
        isLastChunk: totalChunks === 1,
      },
      (response) => {
        if (response && response.success) {
          // Send remaining chunks
          if (totalChunks > 1) {
            for (let i = 1; i < totalChunks; i++) {
              const startIdx = i * CHUNK_SIZE;
              const endIdx = Math.min(startIdx + CHUNK_SIZE, fileBuffer.length);
              const chunk = fileBuffer.substring(startIdx, endIdx);

              this.socket.emit(
                "send_file_message_chunk",
                {
                  tempId,
                  chunkData: chunk,
                  chunkIndex: i,
                  totalChunks,
                  isFirstChunk: false,
                  isLastChunk: i === totalChunks - 1,
                },
                (chunkResponse) => {
                  if (chunkResponse && chunkResponse.success) {
                  } else {
                    console.error(`Chunk ${i} failed:`, chunkResponse?.error);
                  }
                }
              );
            }
          }
        } else {
          console.error("First chunk failed:", response?.error);
        }
      }
    );
  }

  // Listen for new messages
  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on("new_message", callback);
    }
  }

  deleteMessageForAll(messageId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("delete_message_for_all", {
        message_id: messageId,
      });
    } else {
      console.warn("⚠️ Cannot delete message - socket not connected");
    }
  }

  // Listen for message status updates
  onMessageStatusUpdate(callback) {
    if (this.socket) {
      this.socket.on("message_status_update", callback);
    }
  }

  // Listen for typing indicators
  onUserTyping(callback) {
    if (this.socket) {
      this.socket.on("user_typing", callback);
    }
  }

  onUserStoppedTyping(callback) {
    if (this.socket) {
      this.socket.on("user_stopped_typing", callback);
    }
  }

  // Send typing indicator
  sendTyping(chatId, userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("typing_start", { chat_id: chatId, user_id: userId });
    } else {
      console.warn("[SOCKET ERROR] Cannot send typing - socket not connected");
    }
  }

  sendStoppedTyping(chatId, userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("typing_stop", { chat_id: chatId, user_id: userId });
    } else {
      console.warn(
        "[SOCKET ERROR] Cannot send stopped_typing - socket not connected"
      );
    }
  }

  // Listen for user online status
  onUserOnlineStatus(callback) {
    if (this.socket) {
      this.socket.on("user_online_status", callback);
    }
  }

  // Listen for user online event
  onUserOnline(callback) {
    if (this.socket) {
      this.socket.on("user_online", callback);
    }
  }

  // Listen for user offline event
  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on("user_offline", callback);
    }
  }

  // Listen for being added to a group
  onAddedToGroup(callback) {
    if (this.socket) {
      this.socket.on("you_were_added_to_group", callback);
    }
  }

  // Listen for being removed from a group
  onRemovedFromGroup(callback) {
    if (this.socket) {
      this.socket.on("you_were_removed_from_group", callback);
    }
  }

  // Listen for file upload success
  onFileUploadSuccess(callback) {
    if (this.socket) {
      this.socket.on("file_upload_success", callback);
    }
  }

  // Mark message as read
  markMessageAsRead(messageId, userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit("mark_read", { messageId, userId });
    }
  }

  // Update message status (delivered/read)
  updateMessageStatus(messageId, status) {
    if (this.socket && this.isConnected) {
      this.socket.emit("update_message_status", {
        message_id: messageId,
        status: status,
      });
    } else {
      console.warn(
        "[SOCKET ERROR] Cannot update message status - socket not connected"
      );
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
