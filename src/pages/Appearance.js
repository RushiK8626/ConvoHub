import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sun, Moon, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './Appearance.css';

const Appearance = () => {
  const navigate = useNavigate();
  const { theme, setLightTheme, setDarkTheme } = useTheme();

  const themeOptions = [
    {
      id: 'light',
      label: 'Light Mode',
      description: 'Clean and bright interface',
      icon: Sun,
    },
    {
      id: 'dark',
      label: 'Dark Mode',
      description: 'Pitch black theme for your eyes',
      icon: Moon,
    },
  ];

  const handleThemeSelect = (themeId) => {
    if (themeId === 'light') {
      setLightTheme();
    } else {
      setDarkTheme();
    }
  };

  return (
    <div className="appearance-page">
      <div className="appearance-header">
        <button className="back-btn" onClick={() => navigate('/settings')}>
          <ArrowLeft size={24} />
        </button>
        <h1>Appearance</h1>
        <div style={{ width: 40 }}></div>
      </div>

      <div className="appearance-content">
        <div className="appearance-section">
          <h2 className="section-title">Theme</h2>
          <p className="section-description">
            Choose how ConvoHub looks to you. Select a single theme, or sync with your system.
          </p>

          <div className="theme-options">
            {themeOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = theme === option.id;

              return (
                <button
                  key={option.id}
                  className={`theme-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleThemeSelect(option.id)}
                >
                  <div className="theme-option-icon">
                    <Icon size={24} />
                  </div>
                  <div className="theme-option-info">
                    <h3>{option.label}</h3>
                    <p>{option.description}</p>
                  </div>
                  {isSelected && (
                    <div className="theme-option-check">
                      <Check size={20} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="appearance-preview">
          <h3 className="preview-title">Preview</h3>
          <div className="preview-window">
            <div className="preview-header">
              <div className="preview-avatar"></div>
              <div className="preview-text">
                <div className="preview-name"></div>
                <div className="preview-status"></div>
              </div>
            </div>
            <div className="preview-messages">
              <div className="preview-message received">
                <div className="preview-bubble">Hey there!</div>
              </div>
              <div className="preview-message sent">
                <div className="preview-bubble">Hello! How are you?</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appearance;
