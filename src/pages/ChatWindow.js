import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MoreVertical,
  Send,
  Paperclip,
  Smile,
  Image,
  File,
  Check,
  CheckCheck,
  X,
  Loader
} from 'lucide-react';
import ChatInfoModal from '../components/ChatInfoModal';
import AttachmentPreview from '../components/AttachmentPreview';
import ToastContainer from '../components/ToastContainer';
import TypingIndicator from '../components/TypingIndicator';
import { useToast } from '../hooks/useToast';
import { formatMessageTime, formatLastSeen } from '../utils/dateUtils';
import socketService from '../utils/socket';
import { getFileLogo, isImageFile, formatFileSize } from '../utils/fileLogos';
import './ChatWindow.css';

const ChatWindow = ({ chatId: propChatId, isEmbedded = false, onClose = null }) => {
  const params = useParams();
  const chatId = propChatId || params?.chatId;
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const [messageText, setMessageText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toasts, showError, showSuccess, removeToast } = useToast();


  // Get userId from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.user_id;
  const [chatInfo, setChatInfo] = useState({ 
    id: chatId, 
    name: '', 
    avatar: '💬', 
    online: false, 
    is_online: false,
    last_seen: null 
  });
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfiles, setUserProfiles] = useState({});
  const [chatImageUrl, setChatImageUrl] = useState(null); // Store blob URL for chat image
  const [showChatInfoModal, setShowChatInfoModal] = useState(false);
  const [showUserProfileModal, setShowUserProfileModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeoutRef = useRef(null);

  // Function to fetch user profile by user_id
  const fetchUserProfile = async (senderId) => {
    if (userProfiles[senderId] || senderId === userId) return;
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/users/public/id/${senderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        const userData = data.user;
        
        // Convert profile_pic to full URL if it exists
        if (userData.profile_pic) {
          // Extract filename from path like /uploads/25002-xxx.jpg
          const filename = userData.profile_pic.split('/uploads/').pop();
          userData.profile_pic = `${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/profiles/${filename}`;
        }
        
        setUserProfiles(prev => ({
          ...prev,
          [senderId]: userData
        }));
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // Function to fetch chat image with token
  const fetchChatImage = async (imagePath) => {
    if (!imagePath) return;
    try {
      const token = localStorage.getItem('accessToken');
      const filename = imagePath.split('/uploads/').pop();
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/chat-images/${filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        setChatImageUrl(blobUrl);
      }
    } catch (err) {
      console.error('Error fetching chat image:', err);
    }
  };

  // Handle clicking on chat avatar/name to show info modal
  const handleShowChatInfo = () => {
    setShowChatInfoModal(true);
  };

  // Handle clicking on message avatar to show user profile
  const handleShowUserProfile = (senderId) => {
    setSelectedUserId(senderId);
    setShowUserProfileModal(true);
  };

  useEffect(() => {
    const fetchChatAndMessages = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('accessToken');
        // Fetch chat info
        const chatRes = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/chats/${chatId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!chatRes.ok) throw new Error('Failed to fetch chat info');
        const chatData = await chatRes.json();
        const chat = chatData.chat;
        // Set chatInfo for header display
        let chatType = chat.chat_type;
        let members = chat.members || [];
        let chatName = '';
        let otherUserId = null;
        if (chatType === 'private' && Array.isArray(members)) {
          const other = members.find(m => m.user_id !== userId);
          if (other) {
            otherUserId = other.user_id;
            if (other.user && other.user.full_name) {
              chatName = other.user.full_name;
            } else if (other.user && other.user.username) {
              chatName = other.user.username;
            }
          }
        } else if (chatType === 'group') {
          chatName = chat.chat_name;
          // Fetch group chat image if available
          if (chat.chat_image) {
            fetchChatImage(chat.chat_image);
          }
        }
        
        // Fetch other user's profile in private chat
        if (otherUserId) {
          fetchUserProfile(otherUserId);
        }
        
        // Get is_online and last_seen for private chats
        let isOnline = false;
        let lastSeen = null;
        if (chatType === 'private' && otherUserId) {
          const otherMember = members.find(m => m.user_id === otherUserId);
          if (otherMember && otherMember.user) {
            isOnline = otherMember.user.is_online || false;
            lastSeen = otherMember.user.last_seen || null;
          }
        }
        
        console.log('[🔵 INITIAL FETCH] Online status loaded for chat:', {
          chatId,
          chatType,
          otherUserId,
          is_online: isOnline,
          last_seen: lastSeen,
          timestamp: new Date().toISOString()
        });
        
        setChatInfo((info) => ({
          ...info,
          name: chatName,
          avatar: '💬',
          online: isOnline,
          is_online: isOnline,
          last_seen: lastSeen,
          chat_type: chatType,
          members: members,
          otherUserId: otherUserId
        }));
        // Fetch messages
        const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/messages/chat/${chatId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!res.ok) throw new Error('Failed to fetch messages');
        const data = await res.json();
        setMessages(data.messages || []);
      } catch (err) {
        setError(err.message || 'Error fetching messages');
      } finally {
        setLoading(false);
      }
    };
    fetchChatAndMessages();
    // eslint-disable-next-line
  }, [chatId]);

  // Fetch user profiles for message senders
  useEffect(() => {
    messages.forEach(message => {
      if (message.sender_id && message.sender_id !== userId) {
        fetchUserProfile(message.sender_id);
      }
    });
    // eslint-disable-next-line
  }, [messages]);

  // Cleanup blob URL on unmount
  useEffect(() => {
    return () => {
      if (chatImageUrl) {
        URL.revokeObjectURL(chatImageUrl);
      }
    };
  }, [chatImageUrl]);

  // Socket.IO setup - Connect and join chat room
  useEffect(() => {
    // Connect to socket
    const socket = socketService.connect(userId);

    // Function to join chat when socket is ready
    const joinChatWhenReady = () => {
      if (socketService.isSocketConnected()) {
        socketService.joinChat(chatId);
      } else {
        // Wait for connection
        socket.once('connect', () => {
          socketService.joinChat(chatId);
        });
      }
    };

    joinChatWhenReady();

    // Listen for new messages
    const handleNewMessage = (message) => {
      setMessages(prevMessages => {
        // Check if this is a real message (has message_id that's a number, not temp)
        const isRealMessage = message.message_id && !message.message_id.toString().startsWith('temp');
        
        if (isRealMessage) {
          // Check if we already have this real message (avoid duplicates)
          const existingRealMessage = prevMessages.some(
            m => m.message_id === message.message_id && !m.isOptimistic
          );
          if (existingRealMessage) {
            console.log('⚠️ Real message already exists, skipping');
            return prevMessages;
          }

          // Find and remove the matching optimistic message by tempId
          const filteredMessages = prevMessages.filter(m => {
            // If it's not an optimistic message, keep it
            if (!m.isOptimistic) return true;
            
            // Remove optimistic message if tempId matches
            if (m.tempId === message.tempId) {
              console.log(`✅ Replacing optimistic message (tempId: ${message.tempId}) with real message (id: ${message.message_id})`);
              return false; // Remove this optimistic message
            }
            
            return true; // Keep this optimistic message
          });
          
          return [...filteredMessages, message];
        } else {
          // If it's an optimistic message, just add it
          return [...prevMessages, message];
        }
      });

      // Fetch user profile if needed
      if (message.sender_id && message.sender_id !== userId) {
        fetchUserProfile(message.sender_id);
      }
    };

    // Listen for typing indicators
    const handleUserTyping = ({ userId: typingUserId, userName }) => {
      console.log('[⌨️ TYPING EVENT] user_typing received:', {
        typingUserId,
        userName,
        currentUserId: userId,
        isOtherUser: typingUserId !== userId,
        timestamp: new Date().toISOString()
      });

      if (typingUserId !== userId) {
        setTypingUsers(prev => {
          const alreadyTyping = prev.some(u => u.userId === typingUserId);
          console.log('[⌨️ STATE] user_typing state update:', {
            action: alreadyTyping ? 'SKIP_DUPLICATE' : 'ADD_USER',
            typingUserId,
            userName,
            currentTypingUsers: prev.length,
            newTypingUsers: alreadyTyping ? prev.length : prev.length + 1,
            timestamp: new Date().toISOString()
          });

          if (!alreadyTyping) {
            const updated = [...prev, { userId: typingUserId, userName }];
            console.log('[⌨️ UPDATE] New typingUsers array:', updated);
            return updated;
          }
          return prev;
        });
      } else {
        console.log('[⌨️ SKIP] Ignored typing event from self');
      }
    };

    const handleUserStoppedTyping = ({ userId: typingUserId }) => {
      console.log('[⌨️ STOPPED EVENT] user_stopped_typing received:', {
        typingUserId,
        currentUserId: userId,
        timestamp: new Date().toISOString()
      });

      setTypingUsers(prev => {
        const wasTyping = prev.some(u => u.userId === typingUserId);
        console.log('[⌨️ STATE] user_stopped_typing state update:', {
          wasTyping,
          typingUserId,
          currentTypingUsers: prev.length,
          newTypingUsers: wasTyping ? prev.length - 1 : prev.length,
          timestamp: new Date().toISOString()
        });

        if (wasTyping) {
          const updated = prev.filter(u => u.userId !== typingUserId);
          console.log('[⌨️ UPDATE] Removed typingUserId, new array:', updated);
          return updated;
        }
        return prev;
      });
    };

    // Listen for user online event
    const handleUserOnline = ({ user_id, username, full_name, status }) => {
      setChatInfo(prev => {
        if (prev.otherUserId === user_id) {
          return {
            ...prev,
            is_online: true,
            last_seen: null
          };
        }
        return prev;
      });
    };

    // Listen for user offline event
    const handleUserOffline = ({ user_id, username, lastSeen }) => {
      setChatInfo(prev => {
        if (prev.otherUserId === user_id) {
          return {
            ...prev,
            is_online: false,
            last_seen: lastSeen
          };
        }
        return prev;
      });
    };

    // Listen for user online status updates
    const handleUserOnlineStatus = ({ userId: statusUserId, isOnline, lastSeen }) => {
      setChatInfo(prev => {
        if (prev.otherUserId === statusUserId) {
          return {
            ...prev,
            is_online: isOnline,
            last_seen: lastSeen
          };
        }
        return prev;
      });
    };

    // Listen for file upload progress updates from server
    const handleFileUploadProgress = (progressData) => {
      const { progress, tempId } = progressData;
      console.log(`📊 Server Progress: ${progress}%`);
      setUploadProgress(progress);
    };

    // Listen for file upload success from server
    const handleFileUploadSuccess = (messageData) => {
      console.log('✅ File upload success event received:', messageData);
      // The new_message listener will handle adding the persisted message
      // This event confirms the file was saved to database
    };

    // Add listeners
    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('user_online_status', handleUserOnlineStatus);
    socket.on('file_upload_progress_update', handleFileUploadProgress);
    socket.on('file_upload_success', handleFileUploadSuccess);

    console.log('✅ Socket listeners registered for chat:', chatId);
    console.log('[⌨️ LISTENER] Registered listeners:', [
      'new_message',
      'user_typing',
      'user_stopped_typing',
      'user_online',
      'user_offline',
      'user_online_status',
      'file_upload_progress_update',
      'file_upload_success'
    ]);

    // Cleanup on unmount - MUST remove listeners with same callback reference
    return () => {
      console.log('🧹 Cleaning up socket listeners for chat:', chatId);
      console.log('[🧹 CLEANUP] Removing all socket listeners');
      
      socketService.leaveChat(chatId);
      
      if (socket) {
        // Remove each listener with the exact callback reference
        socket.off('new_message', handleNewMessage);
        socket.off('user_typing', handleUserTyping);
        socket.off('user_stopped_typing', handleUserStoppedTyping);
        socket.off('user_online', handleUserOnline);
        socket.off('user_offline', handleUserOffline);
        socket.off('user_online_status', handleUserOnlineStatus);
        socket.off('file_upload_progress_update', handleFileUploadProgress);
        socket.off('file_upload_success', handleFileUploadSuccess);
      }
      
      console.log('✅ Socket listeners cleaned up for chat:', chatId);
    };
    // eslint-disable-next-line
  }, [chatId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debug effect to monitor chatInfo changes
  useEffect(() => {
    console.log('[📊 MONITOR] chatInfo changed:', {
      id: chatInfo.id,
      name: chatInfo.name,
      is_online: chatInfo.is_online,
      last_seen: chatInfo.last_seen,
      otherUserId: chatInfo.otherUserId,
      chat_type: chatInfo.chat_type,
      timestamp: new Date().toISOString()
    });
  }, [chatInfo]);

  // Debug effect to monitor typing users changes
  useEffect(() => {
    console.log('[⌨️ TYPING MONITOR] typingUsers array changed:', {
      count: typingUsers.length,
      users: typingUsers.map(u => ({ userId: u.userId, userName: u.userName })),
      timestamp: new Date().toISOString()
    });
  }, [typingUsers]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const messageToSend = messageText.trim();
    setMessageText(''); // Clear input immediately for better UX

    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    socketService.sendStoppedTyping(chatId, userId);

    // Generate temporary ID for tracking the message
    const tempId = `temp_${Date.now()}_${Math.random()}`;

    // Send message via Socket.IO with tempId
    const messageData = {
      chat_id: parseInt(chatId),
      sender_id: userId,
      message_text: messageToSend,
      message_type: 'text',
      tempId: tempId // Include tempId so server can send it back
    };

    socketService.sendMessage(messageData);

    // Optimistically add message to UI with a unique temporary ID
    const optimisticMessage = {
      message_id: tempId, // Temporary unique ID
      tempId: tempId,
      ...messageData,
      created_at: new Date().toISOString(),
      sender: {
        user_id: userId,
        username: user.username,
        full_name: user.full_name,
        profile_pic: user.profile_pic
      },
      status: [{ status: 'sending' }],
      isOptimistic: true // Flag to identify optimistic messages
    };

    setMessages(prevMessages => [...prevMessages, optimisticMessage]);
  };

  // Handle typing indicator
  const handleTyping = useCallback(() => {
    if (!socketService.isSocketConnected()) {
      console.log('[⌨️ SEND] Socket not connected, cannot send typing event');
      return;
    }

    console.log('[⌨️ SEND] Emitting typing event:', {
      chatId,
      userId,
      timestamp: new Date().toISOString()
    });

    socketService.sendTyping(chatId, userId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      console.log('[⌨️ SEND STOPPED] Emitting stopped_typing event:', {
        chatId,
        userId,
        timestamp: new Date().toISOString()
      });
      socketService.sendStoppedTyping(chatId, userId);
    }, 2000);
  }, [chatId, userId]);

  const handleAttachment = (type) => {
    setShowAttachMenu(false);
    
    if (type === 'Image') {
      fileInputRef.current.accept = 'image/*';
    } else if (type === 'File') {
      fileInputRef.current.accept = '*/*';
    }
    
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size exceeds 50MB limit');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // Store file for later sending
    setSelectedFile(file);
    setShowFilePreview(true);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setShowFilePreview(false);
  };

  const handleSendWithAttachment = async () => {
    if (!selectedFile) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      
      // Generate temporary ID for tracking the message
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Convert file to base64
      const reader = new FileReader();
      reader.onload = () => {
        const base64File = reader.result.split(',')[1]; // Get only the base64 part
        
        // Simulate progress updates with chunks
        const chunkSize = 1024 * 50; // 50KB chunks for progress updates
        let uploaded = 0;

        // Simulate progress updates
        const progressInterval = setInterval(() => {
          const progress = Math.min(100, (uploaded / selectedFile.size) * 100);
          setUploadProgress(progress);
          uploaded += chunkSize;
          
          if (progress >= 100) {
            clearInterval(progressInterval);
          }
        }, 150);

        // Prepare file message data
        const fileMessageData = {
          chat_id: parseInt(chatId),
          message_text: messageText.trim() || '',
          fileBuffer: base64File,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileSize: selectedFile.size,
          tempId: tempId
        };

        console.log('📤 Sending file message via WebSocket:', {
          chat_id: fileMessageData.chat_id,
          fileName: fileMessageData.fileName,
          fileSize: fileMessageData.fileSize,
          fileType: fileMessageData.fileType,
          message_text: fileMessageData.message_text
        });

        // Add optimistic message to UI immediately
        const optimisticMessage = {
          message_id: tempId,
          tempId: tempId,
          isOptimistic: true,
          sender_id: userId,
          message_text: fileMessageData.message_text,
          chat_id: parseInt(chatId),
          attachments: [
            {
              file_url: '',
              fileName: selectedFile.name,
              file_name: selectedFile.name,
              fileSize: selectedFile.size,
              file_size: selectedFile.size,
              fileType: selectedFile.type,
              file_type: selectedFile.type,
              original_filename: selectedFile.name
            }
          ],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_read: false,
          deleted_at: null
        };

        setMessages(prevMessages => [...prevMessages, optimisticMessage]);

        // Send via WebSocket
        socketService.sendFileMessage(fileMessageData);

        // Clear states after sending
        setSelectedFile(null);
        setShowFilePreview(false);
        setMessageText('');
        setUploading(false);
        setUploadProgress(0);
        
        // Show success toast
        showSuccess('File sent successfully!');
      };

      reader.onerror = () => {
        setUploading(false);
        setUploadProgress(0);
        throw new Error('Failed to read file');
      };

      reader.readAsDataURL(selectedFile);
    } catch (err) {
      console.error('❌ File upload error:', err);
      
      // Parse error message for better user feedback
      let errorMessage = 'File upload failed';
      const errorStr = err.message || err.toString();
      
      if (errorStr.includes('read file')) {
        errorMessage = 'Failed to read file';
      } else if (errorStr.includes('not supported')) {
        errorMessage = 'File type not supported';
      } else if (errorStr.includes('too large') || errorStr.includes('exceeds')) {
        errorMessage = 'File is too large';
      } else {
        errorMessage = errorStr;
      }
      
      // Remove the selected file and close preview
      setSelectedFile(null);
      setShowFilePreview(false);
      setUploading(false);
      setUploadProgress(0);
      
      // Show error toast
      showError(errorMessage, 4000);
    }
  };

  const handleMessageAction = (action, messageId) => {
    setShowMessageMenu(null);
    switch (action) {
      case 'delete-me':
        alert('Delete for me - Connect to your backend');
        break;
      case 'delete-all':
        alert('Delete for everyone - Connect to your backend');
        break;
      case 'mark-read':
        alert('Mark as read - Connect to your backend');
        break;
      default:
        break;
    }
  };

  const renderMessageStatus = (status) => {
    switch (status) {
      case 'sent':
        return <Check size={16} className="status-icon" />;
      case 'delivered':
        return <CheckCheck size={16} className="status-icon" />;
      case 'read':
        return <CheckCheck size={16} className="status-icon read" />;
      default:
        return null;
    }
  };

  // Get initials from display name
  const getInitials = (name) => {
    if (!name) return '💬';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="chat-window">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div className="chat-window-header">
        {!isEmbedded && (
          <button className="back-btn" onClick={() => navigate('/chats')}>
            <ArrowLeft size={24} />
          </button>
        )}
        <div className="header-info" onClick={handleShowChatInfo} style={{ cursor: 'pointer' }}>
          {chatInfo.otherUserId && userProfiles[chatInfo.otherUserId]?.profile_pic ? (
            <div className="chat-avatar-small" style={{ position: 'relative' }}>
              <img 
                src={userProfiles[chatInfo.otherUserId].profile_pic} 
                alt="profile"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
              {chatInfo.is_online && chatInfo.chat_type === 'private' && <span className="online-dot"></span>}
            </div>
          ) : chatInfo.chat_type === 'group' && chatImageUrl ? (
            <div className="chat-avatar-small" style={{ position: 'relative' }}>
              <img 
                src={chatImageUrl} 
                alt="group"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            </div>
          ) : (
            <div className="chat-avatar-small">
              <span style={{ fontSize: '16px', fontWeight: '600' }}>
                {chatInfo.chat_type === 'private' ? getInitials(chatInfo.name) : '💬'}
              </span>
              {chatInfo.is_online && chatInfo.chat_type === 'private' && <span className="online-dot"></span>}
            </div>
          )}
          <div className="header-text">
            <h2>{chatInfo.name}</h2>
            {chatInfo.chat_type === 'private' && (
              <span className="status-text">
                {chatInfo.is_online 
                  ? 'Online' 
                  : chatInfo.last_seen 
                    ? `Last seen ${formatLastSeen(chatInfo.last_seen)}` 
                    : 'Offline'}
              </span>
            )}
          </div>
        </div>
        <button className="header-more-btn">
          <MoreVertical size={24} />
        </button>
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="no-chats"><p>Loading messages...</p></div>
        ) : error ? (
          <div className="no-chats"><p>{error}</p></div>
        ) : messages.length === 0 ? (
          <div className="no-chats"><p>No messages yet</p></div>
        ) : (
          messages.map((message) => {
            const isSelf = message.sender_id === userId;
            const isGroup = chatInfo.chat_type === 'group';
            // For self messages, align right and do not show avatar or sender name
            if (isSelf) {
              return (
                <div
                  key={message.message_id}
                  className="message message-sent"
                  style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setShowMessageMenu(message.message_id);
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: '80%', flexDirection: 'column', gap: '8px' }}>
                    {message.attachments && message.attachments.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {message.attachments.map((att, idx) => (
                          <AttachmentPreview key={(att.file_url || att.fileUrl || att.url || idx) + idx} attachment={att} />
                        ))}
                      </div>
                    )}
                    {message.message_text && (
                      <div className="message-bubble">
                        <p className="message-text">{message.message_text}</p>
                        <div className="message-meta">
                          <span className="message-time">{formatMessageTime(message.created_at)}</span>
                        </div>
                      </div>
                    )}
                    {!message.message_text && !message.attachments && (
                      <div className="message-bubble">
                        <p className="message-text">Empty message</p>
                        <div className="message-meta">
                          <span className="message-time">{formatMessageTime(message.created_at)}</span>
                        </div>
                      </div>
                    )}
                    {showMessageMenu === message.message_id && (
                      <div className="message-menu">
                        <button onClick={() => handleMessageAction('mark-read', message.message_id)}>
                          Mark as Read
                        </button>
                        <button onClick={() => handleMessageAction('delete-me', message.message_id)}>
                          Delete for Me
                        </button>
                        <button onClick={() => handleMessageAction('delete-all', message.message_id)}>
                          Delete for Everyone
                        </button>
                        <button onClick={() => setShowMessageMenu(null)}>Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            }
            // For messages from others, align left, show avatar and sender name in group chat
            return (
              <div
                key={message.message_id}
                className="message message-received"
                style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setShowMessageMenu(message.message_id);
                }}
              >
                {isGroup && (
                  <img
                    src={
                      message.sender_id && userProfiles[message.sender_id]?.profile_pic
                        ? userProfiles[message.sender_id].profile_pic
                        : message.sender?.profile_picture_url || 'https://ui-avatars.com/api/?name=' + (message.sender?.full_name || message.sender?.username || 'User')
                    }
                    alt="profile"
                    className="message-avatar"
                    onClick={() => handleShowUserProfile(message.sender_id)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginRight: 8,
                      marginTop: 2,
                      background: '#eee',
                      flexShrink: 0,
                      cursor: 'pointer'
                    }}
                  />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '70%' }}>
                  {message.attachments && message.attachments.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {message.attachments.map((att, idx) => (
                        <AttachmentPreview key={(att.file_url || att.fileUrl || att.url || idx) + idx} attachment={att} />
                      ))}
                    </div>
                  )}
                  {message.message_text && (
                    <div className="message-bubble">
                      {isGroup && (
                        <div
                          className="message-sender clickable"
                          style={{ fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 2, cursor: 'pointer' }}
                          onClick={() => {/* Placeholder for future action */}}
                        >
                          {message.sender_id && userProfiles[message.sender_id]?.full_name
                            ? userProfiles[message.sender_id].full_name
                            : message.sender?.full_name || message.sender?.username || 'Unknown User'}
                        </div>
                      )}
                      <p className="message-text">{message.message_text}</p>
                      <div className="message-meta">
                        <span className="message-time">{formatMessageTime(message.created_at)}</span>
                      </div>
                    </div>
                  )}
                  {!message.message_text && message.attachments && message.attachments.length > 0 && (
                    <div className="message-bubble">
                      {isGroup && (
                        <div
                          className="message-sender clickable"
                          style={{ fontSize: 13, fontWeight: 500, color: '#555', marginBottom: 2, cursor: 'pointer' }}
                          onClick={() => {/* Placeholder for future action */}}
                        >
                          {message.sender_id && userProfiles[message.sender_id]?.full_name
                            ? userProfiles[message.sender_id].full_name
                            : message.sender?.full_name || message.sender?.username || 'Unknown User'}
                        </div>
                      )}
                      <div className="message-meta">
                        <span className="message-time">{formatMessageTime(message.created_at)}</span>
                      </div>
                    </div>
                  )}
                  {showMessageMenu === message.message_id && (
                    <div className="message-menu">
                      <button onClick={() => handleMessageAction('mark-read', message.message_id)}>
                        Mark as Read
                      </button>
                      <button onClick={() => handleMessageAction('delete-me', message.message_id)}>
                        Delete for Me
                      </button>
                      <button onClick={() => setShowMessageMenu(null)}>Cancel</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-container">
        {showAttachMenu && (
          <div className="attach-menu">
            <button
              className="attach-option"
              onClick={() => handleAttachment('Image')}
              disabled={uploading}
            >
              <Image size={24} />
              <span>Image</span>
            </button>
            <button
              className="attach-option"
              onClick={() => handleAttachment('File')}
              disabled={uploading}
            >
              <File size={24} />
              <span>File</span>
            </button>
          </div>
        )}

        {/* File Preview Section */}
        {showFilePreview && selectedFile && (
          <div className="file-preview-container">
            {isImageFile(selectedFile.name, selectedFile.type) ? (
              // Image preview
              <div className="file-preview-image">
                <img 
                  src={URL.createObjectURL(selectedFile)} 
                  alt={selectedFile.name}
                />
                <button
                  type="button"
                  className="remove-file-btn"
                  onClick={handleRemoveFile}
                  disabled={uploading}
                  title="Remove file"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              // File card with logo
              <div className="file-preview-card">
                <div className="file-logo-wrapper">
                  <img 
                    src={getFileLogo(selectedFile.name, selectedFile.type)}
                    alt={selectedFile.name}
                    className="file-logo"
                  />
                </div>
                <div className="file-card-info">
                  <div className="file-name" title={selectedFile.name}>
                    {selectedFile.name}
                  </div>
                  <div className="file-size">
                    {formatFileSize(selectedFile.size)}
                  </div>
                </div>
                <button
                  type="button"
                  className="remove-file-btn-card"
                  onClick={handleRemoveFile}
                  disabled={uploading}
                  title="Remove file"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Upload Progress Bar */}
        {uploading && (
          <div className="upload-progress-container">
            <div className="upload-progress-bar">
              <div 
                className="upload-progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <span className="upload-progress-text">
              <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
              {Math.round(uploadProgress)}%
            </span>
          </div>
        )}

        {/* Message Input */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedFile) {
              handleSendWithAttachment();
            } else {
              handleSendMessage(e);
            }
          }} 
          className="message-input-form"
        >
          <button
            type="button"
            className="attach-btn"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            disabled={uploading || selectedFile !== null}
            title={selectedFile ? "Remove file first to select another" : "Attach file"}
          >
            <Paperclip size={22} />
          </button>

          <input
            type="text"
            className="message-input"
            placeholder={selectedFile ? "Add message (optional)" : "Type a message..."}
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
            disabled={uploading}
          />

          <button 
            type="button" 
            className="emoji-btn"
            disabled={uploading}
          >
            <Smile size={22} />
          </button>

          <button
            type="submit"
            className="send-btn"
            disabled={uploading || (!messageText.trim() && !selectedFile)}
          >
            <Send size={22} />
          </button>
        </form>

        {/* Typing indicator */}
        {typingUsers.length > 0 && !selectedFile && (
          <TypingIndicator typingUsers={typingUsers} />
        )}
      </div>

      {/* Chat Info Modal */}
      <ChatInfoModal
        isOpen={showChatInfoModal}
        onClose={() => setShowChatInfoModal(false)}
        chatId={chatId}
        chatType={chatInfo.chat_type}
        otherUserId={chatInfo.otherUserId}
      />

      {/* User Profile Modal */}
      <ChatInfoModal
        isOpen={showUserProfileModal}
        onClose={() => setShowUserProfileModal(false)}
        chatId={null}
        chatType="private"
        otherUserId={selectedUserId}
      />
      
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default ChatWindow;
