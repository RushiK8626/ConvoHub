import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UserRound,
  LockKeyhole,
  ShieldCheck,
  BellRing,
  Palette,
  Languages,
  LifeBuoy,
  LogOut,
  ChevronRight,
  Ban
} from 'lucide-react';
import BottomTabBar from '../components/BottomTabBar';
import Profile from './Profile';
import Appearance from './Appearance';
import BlockedUsers from './BlockedUsers';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    // Try to get saved width from localStorage, default to 360
    try {
      const saved = localStorage.getItem('settingsLeftPanelWidth');
      return saved ? parseInt(saved) : 360;
    } catch (e) {
      return 360;
    }
  });
  const containerRef = useRef(null);
  const isResizingRef = useRef(false);

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          id: 'profile',
          icon: UserRound,
          label: 'Profile',
          path: '/profile',
          description: 'Manage your profile information',
          component: Profile
        },
        {
          id: 'privacy',
          icon: LockKeyhole,
          label: 'Privacy',
          action: () => alert('Privacy settings - Connect to backend'),
          description: 'Control your privacy settings'
        },
        {
          id: 'security',
          icon: ShieldCheck,
          label: 'Security',
          action: () => alert('Security settings - Connect to backend'),
          description: 'Password and authentication'
        },
        {
          id: 'blocked-users',
          icon: Ban,
          label: 'Blocked Users',
          path: '/blocked-users',
          description: 'Manage blocked contacts',
          component: BlockedUsers
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'notifications',
          icon: BellRing,
          label: 'Notifications',
          action: () => alert('Notification settings - Connect to backend'),
          description: 'Manage notification preferences'
        },
        {
          id: 'appearance',
          icon: Palette,
          label: 'Appearance',
          path: '/appearance',
          description: 'Theme and display options',
          component: Appearance
        },
        {
          id: 'language',
          icon: Languages,
          label: 'Language',
          action: () => alert('Language settings - Connect to backend'),
          description: 'Change app language'
        }
      ]
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          icon: LifeBuoy,
          label: 'Help & Support',
          action: () => alert('Help & Support - Connect to backend'),
          description: 'Get help with ConvoHub'
        }
      ]
    }
  ];

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.user_id;
      try {
        if (userId) {
          await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:3001"}/api/auth/logout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
          });
        }
      } catch (e) {
        // Optionally handle error
      } finally {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Use replace to prevent going back to protected pages
        window.location.replace('/login');
      }
    }
  };

  const handleItemClick = (item) => {
    if (typeof window !== 'undefined' && window.innerWidth < 900) {
      // On mobile, navigate to the page
      if (item.path) {
        navigate(item.path);
      } else if (item.action) {
        item.action();
      }
    } else {
      // On wide screens, select the setting to show on right panel
      setSelectedSetting(item);
    }
  };

  // Handle column resize
  useEffect(() => {
    const handleMouseDown = (e) => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const rightEdge = rect.left + leftPanelWidth;
      
      if (Math.abs(e.clientX - rightEdge) < 5) {
        isResizingRef.current = true;
      }
    };

    const handleMouseMove = (e) => {
      if (!isResizingRef.current || !containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      let newWidth = e.clientX - rect.left;
      
      newWidth = Math.max(320, Math.min(newWidth, 650));
      setLeftPanelWidth(newWidth);
      // Save to localStorage
      try {
        localStorage.setItem('settingsLeftPanelWidth', newWidth.toString());
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

  return (
    <div className="settings-page">
      <div 
        className="settings-container"
        ref={containerRef}
        style={typeof window !== 'undefined' && window.innerWidth >= 900 ? {
          gridTemplateColumns: `${leftPanelWidth}px 1fr`
        } : {}}
      >
        {/* Left Panel - Settings Menu */}
        <div className="settings-left-panel">
          <div className="settings-header">
            <button className="back-btn" onClick={() => navigate('/chats')}>
              <ArrowLeft size={24} />
            </button>
            <h1>Settings</h1>
            <div style={{ width: 40 }}></div>
          </div>

          <div className="settings-menu">
            {settingsSections.map((section, index) => (
              <div key={index} className="settings-section">
                <h2 className="section-title">{section.title}</h2>
                <div className="settings-items">
                  {section.items.map((item, itemIndex) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={itemIndex}
                        className={`setting-item ${selectedSetting?.id === item.id ? 'selected' : ''}`}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="setting-icon">
                          <Icon size={22} />
                        </div>
                        <div className="setting-info">
                          <h3>{item.label}</h3>
                          <p>{item.description}</p>
                        </div>
                        <ChevronRight size={20} className="chevron-icon" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="settings-section">
              <button className="logout-btn" onClick={handleLogout}>
                <LogOut size={22} />
                <span>Logout</span>
              </button>
            </div>

            <div className="app-version">
              <p>ConvoHub v1.0.0</p>
            </div>
          </div>

          <BottomTabBar activeTab="settings" />
        </div>

        {/* Right Panel - Settings Content */}
        <div className="settings-right-panel">
          {selectedSetting ? (
            <>
              {selectedSetting.component ? (
                <selectedSetting.component isEmbedded={true} />
              ) : selectedSetting.path ? (
                <div className="settings-placeholder">
                  <p>Click to navigate to {selectedSetting.label}</p>
                  <button onClick={() => navigate(selectedSetting.path)}>
                    Go to {selectedSetting.label}
                  </button>
                </div>
              ) : selectedSetting.action ? (
                <div className="settings-placeholder">
                  <p>{selectedSetting.label}</p>
                  <button onClick={selectedSetting.action}>
                    {selectedSetting.label}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <div className="settings-placeholder">
              <p>Select a setting from the menu</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
