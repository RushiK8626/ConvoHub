import React, { useState, useEffect } from 'react';
import './ChatInfoModal.css';

const ChatInfoModal = ({ 
  isOpen, 
  onClose, 
  chatId, 
  chatType, 
  otherUserId 
}) => {
  const [chatDetails, setChatDetails] = useState(null);
  const [loadingChatDetails, setLoadingChatDetails] = useState(false);
  const [chatImageUrl, setChatImageUrl] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState(null);

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

  // Function to fetch profile pic with token
  const fetchProfilePic = async (profilePicPath) => {
    if (!profilePicPath) return;
    try {
      const token = localStorage.getItem('accessToken');
      const filename = profilePicPath.split('/uploads/').pop();
      const res = await fetch(`http://localhost:3001/uploads/profiles/${filename}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        setProfilePicUrl(blobUrl);
      }
    } catch (err) {
      console.error('Error fetching profile pic:', err);
    }
  };

  // Function to fetch detailed chat info
  const fetchChatDetails = async () => {
    setLoadingChatDetails(true);
    try {
      let token = localStorage.getItem('accessToken');
      
      if (chatType === 'group') {
        // Fetch group chat info
        let res = await fetch(`http://localhost:3001/api/chats/${chatId}/info`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        // Handle token refresh if unauthorized
        if (res.status === 401) {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const refreshRes = await fetch('http://localhost:3001/api/auth/refresh-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: String(refreshToken) }),
              });
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                localStorage.setItem('accessToken', refreshData.accessToken);
                token = refreshData.accessToken;
                
                // Retry the request with new token
                res = await fetch(`http://localhost:3001/api/chats/${chatId}/info`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });
              }
            } catch (refreshErr) {
              console.error('Token refresh failed:', refreshErr);
            }
          }
        }
        
        if (res.ok) {
          const data = await res.json();
          // API returns { chat: {...} } so store the whole response
          setChatDetails(data);
          
          // Fetch group image if available
          if (data.chat?.chat_image) {
            fetchChatImage(data.chat.chat_image);
          }
        } else {
          console.error('Failed to fetch group chat info:', res.status, res.statusText);
        }
      } else if (chatType === 'private' && otherUserId) {
        // Fetch user details for private chat
        let res = await fetch(`http://localhost:3001/api/users/public/id/${otherUserId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        
        // Handle token refresh if unauthorized
        if (res.status === 401) {
          const refreshToken = localStorage.getItem('refreshToken');
          if (refreshToken) {
            try {
              const refreshRes = await fetch('http://localhost:3001/api/auth/refresh-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: String(refreshToken) }),
              });
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                localStorage.setItem('accessToken', refreshData.accessToken);
                token = refreshData.accessToken;
                
                // Retry the request with new token
                res = await fetch(`http://localhost:3001/api/users/public/id/${otherUserId}`, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                });
              }
            } catch (refreshErr) {
              console.error('Token refresh failed:', refreshErr);
            }
          }
        }
        
        if (res.ok) {
          const data = await res.json();
          setChatDetails(data);
          
          // Fetch profile pic if available
          if (data.user?.profile_pic) {
            fetchProfilePic(data.user.profile_pic);
          }
        } else {
          console.error('Failed to fetch user info:', res.status, res.statusText);
        }
      }
    } catch (err) {
      console.error('Error fetching chat details:', err);
    } finally {
      setLoadingChatDetails(false);
    }
  };

  // Fetch details when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchChatDetails();
    }
    // eslint-disable-next-line
  }, [isOpen, chatId, chatType, otherUserId]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      if (chatImageUrl) URL.revokeObjectURL(chatImageUrl);
      if (profilePicUrl) URL.revokeObjectURL(profilePicUrl);
    };
  }, [chatImageUrl, profilePicUrl]);

  // Get initials from display name
  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="chat-info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{chatType === 'group' ? 'Group Info' : 'Contact Info'}</h2>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        
        {loadingChatDetails ? (
          <div className="modal-loading">
            <p>Loading...</p>
          </div>
        ) : chatDetails ? (
          <div className="chat-info-content">
            {/* Profile/Group Image */}
            <div className="chat-info-image-container">
              {chatType === 'private' && profilePicUrl ? (
                <img 
                  src={profilePicUrl} 
                  alt="profile"
                  className="chat-info-image"
                />
              ) : chatType === 'group' && chatImageUrl ? (
                <img 
                  src={chatImageUrl} 
                  alt="group"
                  className="chat-info-image"
                />
              ) : (
                <div className="chat-info-placeholder">
                  <span style={{ fontSize: 64, fontWeight: '600' }}>
                    {chatType === 'private' && chatDetails?.user
                      ? getInitials(chatDetails.user.full_name || chatDetails.user.username)
                      : chatType === 'group' && chatDetails?.chat
                      ? getInitials(chatDetails.chat.chat_name)
                      : '?'}
                  </span>
                </div>
              )}
            </div>

            {/* Private Chat Details */}
            {chatType === 'private' && chatDetails.user && (
              <div className="chat-info-details">
                <div className="info-section">
                  <h3>{chatDetails.user.full_name || chatDetails.user.username}</h3>
                  <p className="info-username">@{chatDetails.user.username}</p>
                </div>
                
                {chatDetails.user.status_message && (
                  <div className="info-section">
                    <label>About</label>
                    <p>{chatDetails.user.status_message}</p>
                  </div>
                )}
                
                {chatDetails.user.email && (
                  <div className="info-section">
                    <label>Email</label>
                    <p>{chatDetails.user.email}</p>
                  </div>
                )}

                <div className="info-section">
                  <label>Joined</label>
                  <p>{new Date(chatDetails.user.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            )}

            {/* Group Chat Details */}
            {chatType === 'group' && chatDetails?.chat && (
              <div className="chat-info-details">
                <div className="info-section">
                  <h3>{chatDetails.chat.chat_name}</h3>
                </div>
                
                {chatDetails.chat.group_description && (
                  <div className="info-section">
                    <label>Description</label>
                    <p>{chatDetails.chat.group_description}</p>
                  </div>
                )}
                
                <div className="info-section">
                  <label>Members</label>
                  <p>{chatDetails.chat.member_count || 0} members</p>
                </div>

                <div className="info-section">
                  <label>Created</label>
                  <p>{new Date(chatDetails.chat.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="modal-loading">
            <p>Unable to load details</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInfoModal;
