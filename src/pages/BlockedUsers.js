import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserX, Ban } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import './BlockedUsers.css';

const BlockedUsers = () => {
  const navigate = useNavigate();

  // Mock blocked users data - replace with actual API data
  const [blockedUsers, setBlockedUsers] = useState([
    {
      id: 1,
      name: 'Spam User',
      username: 'spamuser',
      avatar: '🚫',
      blockedDate: 'Jan 15, 2024'
    },
    {
      id: 2,
      name: 'Another Blocked',
      username: 'blocked123',
      avatar: '⛔',
      blockedDate: 'Jan 10, 2024'
    }
  ]);

  const handleUnblock = (userId, userName) => {
    if (window.confirm(`Are you sure you want to unblock ${userName}?`)) {
      setBlockedUsers(blockedUsers.filter(user => user.id !== userId));
      // Here you would call backend API to unblock user
      alert(`${userName} has been unblocked`);
    }
  };

  return (
    <div className="blocked-users-page">
      <PageHeader 
        title="Blocked Users" 
        onBack={() => navigate('/settings')}
        // variant="accent"
      />

      <div className="blocked-users-content">
        {blockedUsers.length > 0 ? (
          <div className="blocked-users-list">
            {blockedUsers.map((user) => (
              <div key={user.id} className="blocked-user-item">
                <div className="blocked-user-avatar">
                  <span>{user.avatar}</span>
                </div>
                <div className="blocked-user-info">
                  <h3>{user.name}</h3>
                  <p>@{user.username}</p>
                  <span className="blocked-date">Blocked on {user.blockedDate}</span>
                </div>
                <button
                  className="unblock-btn"
                  onClick={() => handleUnblock(user.id, user.name)}
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-blocked-users">
            <UserX size={64} className="no-blocked-icon" />
            <h2>No Blocked Users</h2>
            <p>You haven't blocked anyone yet</p>
          </div>
        )}

        <div className="blocked-info">
          <Ban size={20} />
          <p>
            Blocked users cannot send you messages or see your online status.
            You can unblock them anytime from this page.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BlockedUsers;
