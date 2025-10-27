import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Lock,
  Shield,
  Bell,
  Moon,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  Ban
} from 'lucide-react';
import BottomTabBar from '../components/BottomTabBar';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Profile',
          path: '/profile',
          description: 'Manage your profile information'
        },
        {
          icon: Lock,
          label: 'Privacy',
          action: () => alert('Privacy settings - Connect to backend'),
          description: 'Control your privacy settings'
        },
        {
          icon: Shield,
          label: 'Security',
          action: () => alert('Security settings - Connect to backend'),
          description: 'Password and authentication'
        },
        {
          icon: Ban,
          label: 'Blocked Users',
          path: '/blocked-users',
          description: 'Manage blocked contacts'
        }
      ]
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: Bell,
          label: 'Notifications',
          action: () => alert('Notification settings - Connect to backend'),
          description: 'Manage notification preferences'
        },
        {
          icon: Moon,
          label: 'Appearance',
          path: '/appearance',
          description: 'Theme and display options'
        },
        {
          icon: Globe,
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
          icon: HelpCircle,
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
          await fetch('http://localhost:3001/api/auth/logout', {
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
    if (item.path) {
      navigate(item.path);
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="back-btn" onClick={() => navigate('/chats')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Settings</h1>
        <div style={{ width: 40 }}></div>
      </div>

      <div className="settings-content">
        {settingsSections.map((section, index) => (
          <div key={index} className="settings-section">
            <h2 className="section-title">{section.title}</h2>
            <div className="settings-items">
              {section.items.map((item, itemIndex) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIndex}
                    className="setting-item"
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
  );
};

export default Settings;
