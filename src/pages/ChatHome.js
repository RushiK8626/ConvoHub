import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MessageCircle, Search, Plus, MoreVertical } from 'lucide-react';
import BottomTabBar from '../components/BottomTabBar';
import ChatInfoModal from '../components/ChatInfoModal';
import ChatOptionsMenu from '../components/ChatOptionsMenu';
import CreateGroupModal from '../components/CreateGroupModal';
import ChatWindow from './ChatWindow';
import { formatChatPreviewTime } from '../utils/dateUtils';
import socketService from '../utils/socket';
import './ChatHome.css';

const ChatHome = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Get userId from navigation state if present, or from localStorage user
  const userId = location.state?.userId || JSON.parse(localStorage.getItem('user') || '{}').user_id;
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfiles, setUserProfiles] = useState({});
  const [chatImages, setChatImages] = useState({}); // Store blob URLs for chat images
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchUsers, setSearchUsers] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showChatInfoModal, setShowChatInfoModal] = useState(false);
  const [selectedChatInfo, setSelectedChatInfo] = useState(null);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    // Try to get saved width from localStorage, default to 360
    try {
      const saved = localStorage.getItem('chatHomeLeftPanelWidth');
      return saved ? parseInt(saved) : 360;
    } catch (e) {
      return 360;
    }
  });
  const containerRef = useRef(null);
  const isResizingRef = useRef(false);

  // Function to fetch user profile by user_id
  const fetchUserProfile = async (otherUserId) => {
    if (userProfiles[otherUserId] || otherUserId === userId) return;
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/api/users/public/id/${otherUserId}`, {
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
          userData.profile_pic = `${API_URL}/uploads/profiles/${filename}`;
        }
        
        setUserProfiles(prev => ({
          ...prev,
          [otherUserId]: userData
        }));
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  // Function to fetch chat image with token
  const fetchChatImage = async (chatId, imagePath) => {
    if (chatImages[chatId] || !imagePath) return;
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');
      const filename = imagePath.split('/uploads/').pop();
      const res = await fetch(`${API_URL}/uploads/chat-images/${filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        setChatImages(prev => ({
          ...prev,
          [chatId]: blobUrl
        }));
      }
    } catch (err) {
      console.error('Error fetching chat image:', err);
    }
  };

  useEffect(() => {
    const fetchChats = async (retry = false) => {
      if (!userId) {
        setError('User ID not found.');
        setLoading(false);
        return;
      }
      try {
        const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`${API_URL}/api/chats/user/${userId}/preview`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (res.status === 401 && !retry) {
          // Try to refresh token
          const refreshToken = localStorage.getItem('refreshToken');
          if (!refreshToken) {
            setError('Session expired. Please log in again.');
            setLoading(false);
            console.log('No refresh token found');
            return;
          }
          try {
            const refreshRes = await fetch(`${API_URL}/api/auth/refresh-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: String(refreshToken) }),
            });
            if (!refreshRes.ok) {
              setError('Session expired. Please log in again.');
              setLoading(false);
              return;
            }
            const refreshData = await refreshRes.json();
            localStorage.setItem('accessToken', refreshData.accessToken);
            // Retry fetching chats with new token
            await fetchChats(true);
            return;
          } catch (refreshErr) {
            setError('Session expired. Please log in again.');
            setLoading(false);
            return;
          }
        }
        if (!res.ok) {
          throw new Error('Failed to fetch chats');
        }
        const data = await res.json();
        
        // Don't process chat images here, just set the chats with original paths
        setChats(data.chats || []);
      } catch (err) {
        setError(err.message || 'Error fetching chats');
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, [userId]);

  // Fetch user profiles for private chats
  useEffect(() => {
    chats.forEach(chat => {
      if (chat.chat_type === 'private' && Array.isArray(chat.members)) {
        const other = chat.members.find(m => m.user_id !== userId);
        if (other && other.user_id) {
          fetchUserProfile(other.user_id);
        }
      } else if (chat.chat_type === 'group' && chat.chat_image) {
        // Fetch group chat image with token
        fetchChatImage(chat.chat_id, chat.chat_image);
      }
    });
    // eslint-disable-next-line
  }, [chats]);


  const filteredChats = chats.filter(chat =>
    (chat.chat_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close options menu when clicking outside
  useEffect(() => {
    if (!showOptionsMenu) return;

    const handleClickOutside = (e) => {
      const menu = document.querySelector('.chat-options-menu');
      const btn = document.querySelector('.new-chat-btn');
      if (menu && !menu.contains(e.target) && btn && !btn.contains(e.target)) {
        setShowOptionsMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showOptionsMenu]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(chatImages).forEach(blobUrl => {
        if (blobUrl) URL.revokeObjectURL(blobUrl);
      });
    };
  }, [chatImages]);

  // Socket.IO setup for real-time chat updates
  useEffect(() => {
    if (!userId) return;

    // Connect to socket
    socketService.connect(userId);

    // Listen for new messages to update chat previews
    const handleNewMessage = (message) => {
      // Refetch chats to update the preview
      const fetchChatsUpdate = async () => {
        try {
          const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
          const token = localStorage.getItem('accessToken');
          const res = await fetch(`${API_URL}/api/chats/user/${userId}/preview`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (res.ok) {
            const data = await res.json();
            setChats(data.chats || []);
          }
        } catch (err) {
          console.error('Error updating chats:', err);
        }
      };
      fetchChatsUpdate();
    };

    // Listen for user online/offline status to update chat list
    const handleUserOnline = ({ user_id }) => {
      console.log(`🟢 User ${user_id} online - updating chats`);
      setChats(prevChats => 
        prevChats.map(chat => {
          if (chat.chat_type === 'private' && chat.members) {
            const other = chat.members.find(m => m.user_id !== userId);
            if (other && other.user_id === user_id) {
              return {
                ...chat,
                members: chat.members.map(m => 
                  m.user_id === user_id ? { ...m, is_online: true } : m
                )
              };
            }
          }
          return chat;
        })
      );
    };

    const handleUserOffline = ({ user_id, lastSeen }) => {
      console.log(`🔴 User ${user_id} offline - updating chats`);
      setChats(prevChats => 
        prevChats.map(chat => {
          if (chat.chat_type === 'private' && chat.members) {
            const other = chat.members.find(m => m.user_id !== userId);
            if (other && other.user_id === user_id) {
              return {
                ...chat,
                members: chat.members.map(m => 
                  m.user_id === user_id ? { ...m, is_online: false, last_seen: lastSeen } : m
                )
              };
            }
          }
          return chat;
        })
      );
    };

    socketService.onNewMessage(handleNewMessage);
    socketService.onUserOnline(handleUserOnline);
    socketService.onUserOffline(handleUserOffline);

    return () => {
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('new_message', handleNewMessage);
        socket.off('user_online', handleUserOnline);
        socket.off('user_offline', handleUserOffline);
      }
    };
  }, [userId]);

  // Handle column resize
  useEffect(() => {
    const handleMouseDown = (e) => {
      // Only start resize if click is on the divider (right edge of left-panel)
      if (!containerRef.current) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const rightEdge = rect.left + leftPanelWidth;
      
      if (Math.abs(e.clientX - rightEdge) < 5) { // 5px tolerance for click area
        isResizingRef.current = true;
      }
    };

    const handleMouseMove = (e) => {
      if (!isResizingRef.current || !containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      let newWidth = e.clientX - rect.left;
      
      // Min width: 320px, Max width: 650px
      newWidth = Math.max(320, Math.min(newWidth, 650));
      setLeftPanelWidth(newWidth);
      // Save to localStorage
      try {
        localStorage.setItem('chatHomeLeftPanelWidth', newWidth.toString());
      } catch (e) {
        // Ignore localStorage errors
      }
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
    };

    if (typeof window !== 'undefined' && window.innerWidth >= 900) {
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [leftPanelWidth]);

  const handleChatClick = (chatId) => {
    // On small screens, navigate to chat page. On wide screens, open inline.
    if (typeof window !== 'undefined' && window.innerWidth < 900) {
      navigate(`/chat/${chatId}`);
    } else {
      setSelectedChatId(chatId);
    }
  };

  // Keep selectedChatId in sync with URL when user navigates directly (on mobile or deep link)
  useEffect(() => {
    const path = location.pathname || '';
    const match = path.match(/\/chat\/(\d+)/);
    if (match && typeof window !== 'undefined' && window.innerWidth < 900) {
      // Only sync on small screens - otherwise just set from URL
      setSelectedChatId(match[1]);
    }
  }, [location.pathname]);

  const handleChatAvatarClick = (e, chat) => {
    e.stopPropagation(); // Prevent navigation to chat
    
    if (chat.chat_type === 'group') {
      setSelectedChatInfo({
        chatId: chat.chat_id,
        chatType: 'group',
        otherUserId: null
      });
    } else if (chat.chat_type === 'private') {
      const other = chat.members.find(m => m.user_id !== userId);
      setSelectedChatInfo({
        chatId: chat.chat_id,
        chatType: 'private',
        otherUserId: other?.user_id
      });
    }
    
    setShowChatInfoModal(true);
  };

  const handleNewChat = () => {
    setShowOptionsMenu(!showOptionsMenu);
  };

  const handleNewChatWithUser = () => {
    setShowOptionsMenu(false);
    setShowNewChatModal(true);
    setSearchUsers('');
    setSearchResults([]);
  };

  const handleCreateNewGroup = () => {
    setShowOptionsMenu(false);
    setShowCreateGroupModal(true);
  };

  const handleGroupCreated = (newChatId) => {
    setShowCreateGroupModal(false);
    // Close the options menu if open
    setShowOptionsMenu(false);
    // Navigate to the new group chat
    navigate(`/chat/${newChatId}`);
  };

  // Debounced search function
  const searchUsersAPI = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`${API_URL}/api/users/public/search?query=${encodeURIComponent(query)}&page=1&limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const data = await res.json();
        // Process profile pics
        const usersWithPics = (data.users || []).map(user => {
          if (user.profile_pic) {
            const filename = user.profile_pic.split('/uploads/').pop();
            user.profile_pic = `${API_URL}/uploads/profiles/${filename}`;
          }
          return user;
        });
        setSearchResults(usersWithPics);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounce effect for search
  useEffect(() => {
    if (!searchUsers.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);
    const debounceTimer = setTimeout(() => {
      searchUsersAPI(searchUsers);
    }, 300); // 300ms debounce

    return () => clearTimeout(debounceTimer);
  }, [searchUsers, searchUsersAPI]);

  const handleSearchUsers = (query) => {
    setSearchUsers(query);
  };

  const handleSelectUser = async (selectedUser) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      let token = localStorage.getItem('accessToken');
      
      // Create a new private chat
      let createChatRes = await fetch(`${API_URL}/api/chats/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_type: 'private',
          member_ids: [userId, selectedUser.user_id]
        })
      });

      // If unauthorized, try to refresh token
      if (createChatRes.status === 401) {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          try {
            const refreshRes = await fetch(`${API_URL}/api/auth/refresh-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: String(refreshToken) }),
            });
            if (refreshRes.ok) {
              const refreshData = await refreshRes.json();
              localStorage.setItem('accessToken', refreshData.accessToken);
              token = refreshData.accessToken;
              
              // Retry creating chat with new token
              createChatRes = await fetch(`${API_URL}/api/chats/`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chat_type: 'private',
                  member_ids: [userId, selectedUser.user_id]
                })
              });
            }
          } catch (refreshErr) {
            console.error('Token refresh failed:', refreshErr);
          }
        }
      }

      if (!createChatRes.ok) {
        const errorText = await createChatRes.text();
        console.error('Create chat error:', errorText);
        throw new Error('Failed to create chat');
      }

      const chatData = await createChatRes.json();
      const newChatId = chatData.chat?.chat_id;

      if (newChatId) {
        // Close modal and navigate to the new chat
        setShowNewChatModal(false);
        navigate(`/chat/${newChatId}`);
      } else {
        alert('Error creating chat. Please try again.');
      }
    } catch (err) {
      console.error('Error creating chat:', err);
      alert('Failed to create chat. Please try again.');
    }
  };

  return (
    <div className="chat-home">
      <div 
        className="chat-home-container"
        ref={containerRef}
        style={typeof window !== 'undefined' && window.innerWidth >= 900 ? {
          gridTemplateColumns: `${leftPanelWidth}px 1fr`
        } : {}}
      >
        <div className="left-panel">
          <div className="chat-home-header">
            <div className="header-top">
              <h1>ConvoHub</h1>
              <button className="more-btn">
                <MoreVertical size={24} />
              </button>
            </div>
            <div className="search-bar">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          <div className="chat-list">
        {loading ? (
          <div className="no-chats"><p>Loading chats...</p></div>
        ) : error ? (
          <div className="no-chats"><p>{error}</p></div>
        ) : filteredChats.length > 0 ? (
          filteredChats.map((chat) => {
            let displayName = chat.chat_name;
            let otherUserId = null;
            let chatImage = null;
            
            if (chat.chat_type === 'private' && Array.isArray(chat.members)) {
              // Find the other member
              const other = chat.members.find(m => m.user_id !== userId);
              if (other) {
                otherUserId = other.user_id;
                if (other.user && other.user.full_name) {
                  displayName = other.user.full_name;
                } else if (other.user && other.user.username) {
                  displayName = other.user.username;
                }
              }
            } else if (chat.chat_type === 'group') {
              // Use fetched blob URL for group chat image
              chatImage = chatImages[chat.chat_id];
            }
            
            // Get profile pic for private chats
            const profilePic = otherUserId && userProfiles[otherUserId]?.profile_pic;
            
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
              <div
                key={chat.chat_id}
                className={`chat-item ${selectedChatId === chat.chat_id ? 'selected' : ''}`}
                onClick={() => handleChatClick(chat.chat_id)}
              >
                <div 
                  className="chat-avatar"
                  onClick={(e) => handleChatAvatarClick(e, chat)}
                  style={{ cursor: 'pointer' }}
                >
                  {(profilePic || chatImage) ? (
                    <img 
                      src={profilePic || chatImage} 
                      alt={chat.chat_type === 'group' ? 'group' : 'profile'}
                      style={{
                        width: '100%',
                        height: '100%',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <span className="avatar-emoji">{chat.chat_type === 'private' ? getInitials(displayName) : '💬'}</span>
                  )}
                </div>
                <div className="chat-info">
                  <div className="chat-header-info">
                    <h3 className="chat-name">{displayName}</h3>
                    <span className="chat-time">{formatChatPreviewTime(chat.last_message?.created_at)}</span>
                  </div>
                  <div className="chat-last-message">
                    <p className="last-message">{chat.last_message?.preview_text || 'No messages yet'}</p>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-chats">
            <MessageCircle size={64} className="no-chats-icon" />
            <p>No conversations found</p>
          </div>
        )}
      </div>

          <button className="new-chat-btn" onClick={handleNewChat}>
        <Plus size={24} />
      </button>

          <BottomTabBar activeTab="chats" />
        </div>

        <div className="right-panel">
          {selectedChatId ? (
            <ChatWindow chatId={selectedChatId} isEmbedded={true} />
          ) : (
            <div className="chat-placeholder">
              <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>

  </div>

  {showNewChatModal && (
        <div className="modal-overlay" onClick={() => setShowNewChatModal(false)}>
          <div className="new-chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Chat</h2>
              <button className="modal-close-btn" onClick={() => setShowNewChatModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-search">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search by username..."
                value={searchUsers}
                onChange={(e) => handleSearchUsers(e.target.value)}
                className="modal-search-input"
                autoFocus
              />
            </div>
            <div className="modal-results">
              {searchLoading ? (
                <p className="modal-message">Searching...</p>
              ) : searchUsers && searchResults.length === 0 ? (
                <p className="modal-message">No users found</p>
              ) : searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user.user_id}
                    className="user-result-item"
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className="user-avatar">
                      {user.profile_pic ? (
                        <img 
                          src={user.profile_pic} 
                          alt="profile"
                          style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <span className="avatar-text">
                          {user.full_name 
                            ? user.full_name.split(' ').length >= 2 
                              ? (user.full_name.split(' ')[0][0] + user.full_name.split(' ')[user.full_name.split(' ').length - 1][0]).toUpperCase()
                              : user.full_name.substring(0, 2).toUpperCase()
                            : user.username.substring(0, 2).toUpperCase()
                          }
                        </span>
                      )}
                    </div>
                    <div className="user-info">
                      <h4>{user.full_name || user.username}</h4>
                      <p>@{user.username}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="modal-message">Search for users to start a new chat</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chat Info Modal */}
      <ChatInfoModal
        isOpen={showChatInfoModal}
        onClose={() => setShowChatInfoModal(false)}
        chatId={selectedChatInfo?.chatId}
        chatType={selectedChatInfo?.chatType}
        otherUserId={selectedChatInfo?.otherUserId}
      />

      {/* Chat Options Menu */}
      <ChatOptionsMenu
        isOpen={showOptionsMenu}
        onNewChat={handleNewChatWithUser}
        onNewGroup={handleCreateNewGroup}
      />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onGroupCreated={handleGroupCreated}
        currentUserId={userId}
      />

    </div>
  );
};

export default ChatHome;
