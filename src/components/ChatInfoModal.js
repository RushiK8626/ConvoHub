import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './ChatInfoModal.css';

const ChatInfoModal = ({ 
  isOpen, 
  onClose, 
  chatId, 
  chatType, 
  otherUserId 
}) => {
  const navigate = useNavigate();
  const [chatDetails, setChatDetails] = useState(null);
  const [loadingChatDetails, setLoadingChatDetails] = useState(false);
  const [chatImageUrl, setChatImageUrl] = useState(null);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [membersImages, setMembersImages] = useState({});

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

  // Function to fetch profile pic with token
  const fetchProfilePic = async (profilePicPath) => {
    if (!profilePicPath) return;
    try {
      const token = localStorage.getItem('accessToken');
      const filename = profilePicPath.split('/uploads/').pop();
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/profiles/${filename}`, {
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

  // Fetch and cache member profile images (for group members list)
  const fetchMemberProfilePic = async (member) => {
    if (!member || !member.profile_pic) return;
    try {
      const token = localStorage.getItem('accessToken');
      const filename = member.profile_pic.split('/uploads/').pop();
      const res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/uploads/profiles/${filename}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        setMembersImages(prev => ({ ...prev, [member.user_id]: blobUrl }));
      }
    } catch (err) {
      console.error('Error fetching member profile pic:', err);
    }
  };

  // Function to fetch detailed chat info
  const fetchChatDetails = async () => {
    setLoadingChatDetails(true);
    try {
      let token = localStorage.getItem('accessToken');
      
      if (chatType === 'group') {
        // Fetch group chat info
        let res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/chats/${chatId}/info`, {
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
              const refreshRes = await fetch('${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/auth/refresh-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: String(refreshToken) }),
              });
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                localStorage.setItem('accessToken', refreshData.accessToken);
                token = refreshData.accessToken;
                
                // Retry the request with new token
                res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/chats/${chatId}/info`, {
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
          // API now returns data directly (not nested in 'chat' property)
          // Wrap it in { chat: data } for consistency with component logic
          setChatDetails({ chat: data });
          
          // Fetch group image if available
          if (data.chat_image) {
            fetchChatImage(data.chat_image);
          }
            // If members present, fetch profile pics for each member
            if (Array.isArray(data.members)) {
              data.members.forEach((m) => {
                if (m && m.profile_pic) {
                  fetchMemberProfilePic(m);
                }
              });
            }
        } else {
          console.error('Failed to fetch group chat info:', res.status, res.statusText);
        }
      } else if (chatType === 'private' && otherUserId) {
        // Fetch user details for private chat
        let res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/users/public/id/${otherUserId}`, {
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
              const refreshRes = await fetch('${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/auth/refresh-token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken: String(refreshToken) }),
              });
              if (refreshRes.ok) {
                const refreshData = await refreshRes.json();
                localStorage.setItem('accessToken', refreshData.accessToken);
                token = refreshData.accessToken;
                
                // Retry the request with new token
                res = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/users/public/id/${otherUserId}`, {
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
      // revoke member images
      Object.values(membersImages).forEach(url => {
        try { URL.revokeObjectURL(url); } catch (e) { }
      });
    };
  }, [chatImageUrl, profilePicUrl, membersImages]);

  // When membersImages mapping updates, revoke any previous URLs that were replaced
  useEffect(() => {
    return () => {
      Object.values(membersImages).forEach(url => {
        try { URL.revokeObjectURL(url); } catch (e) { }
      });
    };
  }, [membersImages]);

  // Get initials from display name
  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Format last seen timestamp into a readable string
  const formatLastSeen = (iso) => {
    if (!iso) return 'Unknown';
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch (e) {
      return iso;
    }
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
                  {/* Presence info */}
                  <div className="info-status" style={{ marginTop: 8 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: chatDetails.user.is_online ? '#4CAF50' : '#bdbdbd',
                        marginRight: 8,
                      }}
                    />
                    <span className="status-text" style={{ fontSize: 14, color: 'var(--text-color, #333)' }}>
                      {chatDetails.user.is_online ? 'Online' : `Last seen: ${formatLastSeen(chatDetails.user.last_seen)}`}
                    </span>
                  </div>
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
                
                {chatDetails.chat.description && (
                  <div className="info-section">
                    <label>Description</label>
                    <p>{chatDetails.chat.description}</p>
                  </div>
                )}
                
                <div className="info-section">
                  <label>Members</label>
                  <p>{chatDetails.chat.member_count || 0} members</p>

                  {/* Members list */}
                  <div className="members-list">
                    {Array.isArray(chatDetails.chat.members) && chatDetails.chat.members.length > 0 ? (
                      chatDetails.chat.members.map((m) => (
                        <div key={m.user_id} className="member-item" onClick={() => { onClose(); navigate(`/user/${m.user_id}`); }} style={{ cursor: 'pointer' }}>
                          <div className="member-avatar">
                            {membersImages[m.user_id] ? (
                              <img src={membersImages[m.user_id]} alt={m.full_name || m.username} />
                            ) : (
                              <div className="member-initials">{getInitials(m.full_name || m.username)}</div>
                            )}
                          </div>
                          <div className="member-info">
                            <div className="member-name">{m.full_name || m.username}</div>
                            <div className="member-username">@{m.username}</div>
                            {/* Member presence */}
                            <div className="member-presence" style={{ marginTop: 4, fontSize: 12, color: '#666' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  backgroundColor: m.is_online ? '#4CAF50' : '#bdbdbd',
                                  marginRight: 6,
                                }}
                              />
                              <span>{m.is_online ? 'Online' : `Last seen: ${formatLastSeen(m.last_seen)}`}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="small">No members data</p>
                    )}
                  </div>
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
