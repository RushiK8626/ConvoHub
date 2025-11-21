import React, { useEffect, useRef } from "react";
import "./ContextMenu.css";

/**
 * Reusable Context/Dropdown Menu Component
 * @param {boolean} isOpen - Whether the menu is visible
 * @param {number} x - X position for the menu
 * @param {number} y - Y position for the menu
 * @param {array} items - Array of menu items with structure:
 *        { id, label, icon, onClick, color, divider }
 * @param {function} onClose - Callback when menu should close
 * @param {string} theme - Optional theme class (light/dark)
 */
const ContextMenu = ({ isOpen, x, y, items, onClose, theme = "light" }) => {
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Close menu on Escape key
    const handleEscapeKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleItemClick = (item) => {
    if (item.onClick) {
      item.onClick();
    }
    onClose();
  };

  return (
    <>
      {/* Overlay to close menu on click outside */}
      <div className="context-menu-overlay" onClick={onClose} />

      {/* Menu Container */}
      <div
        ref={menuRef}
        className={`context-menu ${theme}`}
        style={{
          top: `${y}px`,
          left: `${x}px`,
        }}
      >
        {items.map((item, index) => (
          <React.Fragment key={item.id || index}>
            {/* Divider */}
            {item.divider && <div className="context-menu-divider" />}

            {/* Menu Item */}
            {!item.divider && (
              <button
                className={`context-menu-item ${item.color || "default"} ${
                  item.disabled ? "disabled" : ""
                }`}
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                title={item.title || item.label}
              >
                {/* Icon */}
                {item.icon && (
                  <span className="context-menu-icon">{item.icon}</span>
                )}

                {/* Label */}
                <span className="context-menu-label">{item.label}</span>

                {/* Badge (optional) */}
                {item.badge && (
                  <span className="context-menu-badge">{item.badge}</span>
                )}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>
    </>
  );
};

export default ContextMenu;
