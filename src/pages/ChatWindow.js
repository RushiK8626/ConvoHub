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
  CheckCheck
} from 'lucide-react';
import ChatInfoModal from '../components/ChatInfoModal';
import { formatMessageTime, formatLastSeen } from '../utils/dateUtils';
import socketService from '../utils/socket';
import './ChatWindow.css';

const ChatWindow = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const [messageText, setMessageText] = useState('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showMessageMenu, setShowMessageMenu] = useState(null);


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
      const res = await fetch(`http://localhost:3001/api/users/public/id/${senderId}`, {
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
          userData.profile_pic = `http://localhost:3001/uploads/profiles/${filename}`;
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
      const res = await fetch(`http://localhost:3001/uploads/chat-images/${filename}`, {
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
        const chatRes = await fetch(`http://localhost:3001/api/chats/${chatId}`, {
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
        const res = await fetch(`http://localhost:3001/api/messages/chat/${chatId}`, {
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
    socketService.connect(userId);

    // Join the chat room
    socketService.joinChat(chatId);

    // Listen for new messages
    const handleNewMessage = (message) => {
      console.log('📩 New message received:', message);
      setMessages(prevMessages => {
        // Check if message already exists by message_id
        const exists = prevMessages.some(m => m.message_id === message.message_id && !m.isOptimistic);
        if (exists) return prevMessages;
        
        // Remove optimistic message(s) with matching content
        const filteredMessages = prevMessages.filter(m => {
          // If it's not an optimistic message, keep it
          if (!m.isOptimistic) return true;
          
          // Remove optimistic message if content matches the new real message
          const isSameMessage = (
            m.sender_id === message.sender_id &&
            m.message_text === message.message_text &&
            m.chat_id === message.chat_id
          );
          
          return !isSameMessage; // Remove if it matches
        });
        
        return [...filteredMessages, message];
      });

      // Fetch user profile if needed
      if (message.sender_id && message.sender_id !== userId) {
        fetchUserProfile(message.sender_id);
      }
    };

    // Listen for typing indicators
    const handleUserTyping = ({ userId: typingUserId, userName }) => {
      if (typingUserId !== userId) {
        setTypingUsers(prev => {
          if (!prev.some(u => u.userId === typingUserId)) {
            return [...prev, { userId: typingUserId, userName }];
          }
          return prev;
        });
      }
    };

    const handleUserStoppedTyping = ({ userId: typingUserId }) => {
      setTypingUsers(prev => prev.filter(u => u.userId !== typingUserId));
    };

    // Listen for user online status updates
    const handleUserOnlineStatus = ({ userId: statusUserId, isOnline, lastSeen }) => {
      if (chatInfo.otherUserId === statusUserId) {
        setChatInfo(prev => ({
          ...prev,
          is_online: isOnline,
          last_seen: lastSeen
        }));
      }
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onUserTyping(handleUserTyping);
    socketService.onUserStoppedTyping(handleUserStoppedTyping);
    socketService.onUserOnlineStatus(handleUserOnlineStatus);

    // Cleanup on unmount
    return () => {
      socketService.leaveChat(chatId);
      socketService.off('new_message', handleNewMessage);
      socketService.off('user_typing', handleUserTyping);
      socketService.off('user_stopped_typing', handleUserStoppedTyping);
      socketService.off('user_online_status', handleUserOnlineStatus);
    };
    // eslint-disable-next-line
  }, [chatId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    // Send message via Socket.IO
    const messageData = {
      chat_id: parseInt(chatId),
      sender_id: userId,
      message_text: messageToSend,
      message_type: 'text'
    };

    socketService.sendMessage(messageData);

    // Optimistically add message to UI with a unique temporary ID
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    const optimisticMessage = {
      message_id: tempId, // Temporary unique ID
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
    if (!socketService.isSocketConnected()) return;

    socketService.sendTyping(chatId, userId);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      socketService.sendStoppedTyping(chatId, userId);
    }, 2000);
  }, [chatId, userId]);

  const handleAttachment = (type) => {
    setShowAttachMenu(false);
    alert(`${type} attachment - Connect to your backend`);
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
      <div className="chat-window-header">
        <button className="back-btn" onClick={() => navigate('/chats')}>
          <ArrowLeft size={24} />
        </button>
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
                  <div style={{ display: 'flex', justifyContent: 'flex-end', maxWidth: '80%' }}>
                    <div className="message-bubble">
                      {message.message_type === 'image' && message.attachments && message.attachments.length > 0 && (
                        <img src={message.attachments[0].file_url} alt="attachment" className="message-image" />
                      )}
                      <p className="message-text">{message.message_text}</p>
                      <div className="message-meta">
                        <span className="message-time">{formatMessageTime(message.created_at)}</span>
                      </div>
                    </div>
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
                <div style={{ flex: 1 }}>
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
                    {message.message_type === 'image' && message.attachments && message.attachments.length > 0 && (
                      <img src={message.attachments[0].file_url} alt="attachment" className="message-image" />
                    )}
                    <p className="message-text">{message.message_text}</p>
                    <div className="message-meta">
                      <span className="message-time">{formatMessageTime(message.created_at)}</span>
                    </div>
                  </div>
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
/* Add this CSS to your ChatWindow.css for avatar if not present:
.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 8px;
  margin-top: 2px;
  background: #eee;
  flex-shrink: 0;
}
*/
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
            >
              <Image size={24} />
              <span>Image</span>
            </button>
            <button
              className="attach-option"
              onClick={() => handleAttachment('File')}
            >
              <File size={24} />
              <span>File</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="message-input-form">
          <button
            type="button"
            className="attach-btn"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
          >
            <Paperclip size={22} />
          </button>

          <input
            type="text"
            className="message-input"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => {
              setMessageText(e.target.value);
              handleTyping();
            }}
          />

          <button type="button" className="emoji-btn">
            <Smile size={22} />
          </button>

          <button
            type="submit"
            className="send-btn"
            disabled={!messageText.trim()}
          >
            <Send size={22} />
          </button>
        </form>

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.length === 1 
              ? `${typingUsers[0].userName || 'Someone'} is typing...`
              : `${typingUsers.length} people are typing...`
            }
          </div>
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
    </div>
  );
};

export default ChatWindow;
