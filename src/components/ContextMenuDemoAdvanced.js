import React from "react";
import ContextMenu from "./ContextMenu";
import useContextMenu from "../hooks/useContextMenu";
import {
  Copy,
  Trash2,
  Pin,
  Forward,
  Flag,
  MoreVertical,
  Heart,
  Archive,
  Mute,
  Users,
} from "lucide-react";
import "./ContextMenuDemoAdvanced.css";

/**
 * Advanced Demo Component for ContextMenu with useContextMenu hook
 * Shows how to use the hook for cleaner state management
 */
const ContextMenuDemoAdvanced = () => {
  // Use the custom hook for each context menu
  const messageMenu = useContextMenu();
  const chatMenu = useContextMenu();
  const threeDotsMenu = useContextMenu();

  // Message context menu items
  const messageMenuItems = [
    {
      id: "copy",
      label: "Copy",
      icon: <Copy size={16} />,
      onClick: () => alert("✅ Message copied to clipboard"),
    },
    {
      id: "reply",
      label: "Reply",
      icon: <Forward size={16} />,
      onClick: () => alert("💬 Reply mode activated"),
    },
    {
      id: "divider1",
      divider: true,
    },
    {
      id: "pin",
      label: "Pin Message",
      icon: <Pin size={16} />,
      onClick: () => alert("📌 Message pinned"),
    },
    {
      id: "react",
      label: "React",
      icon: <Heart size={16} />,
      onClick: () => alert("❤️ Reaction menu opened"),
    },
    {
      id: "divider2",
      divider: true,
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash2 size={16} />,
      color: "danger",
      onClick: () => alert("🗑️ Message deleted"),
    },
  ];

  // Chat list context menu items
  const chatMenuItems = [
    {
      id: "archive",
      label: "Archive",
      icon: <Archive size={16} />,
      onClick: () => alert("📦 Chat archived"),
    },
    {
      id: "mute",
      label: "Mute",
      icon: <Mute size={16} />,
      onClick: () => alert("🔇 Chat muted"),
    },
    {
      id: "pin-chat",
      label: "Pin",
      icon: <Pin size={16} />,
      onClick: () => alert("📌 Chat pinned"),
    },
    {
      id: "divider",
      divider: true,
    },
    {
      id: "delete-chat",
      label: "Delete Chat",
      icon: <Trash2 size={16} />,
      color: "danger",
      onClick: () => alert("🗑️ Chat deleted"),
    },
  ];

  // Three dots menu items
  const threeDotsMenuItems = [
    {
      id: "mute-all",
      label: "Mute All Notifications",
      icon: <Mute size={16} />,
      onClick: () => alert("🔇 All notifications muted"),
    },
    {
      id: "members",
      label: "Group Members",
      icon: <Users size={16} />,
      onClick: () => alert("👥 Members list opened"),
    },
    {
      id: "divider",
      divider: true,
    },
    {
      id: "report",
      label: "Report",
      icon: <Flag size={16} />,
      color: "warning",
      onClick: () => alert("⚠️ Report submitted"),
    },
    {
      id: "delete-group",
      label: "Delete Group",
      icon: <Trash2 size={16} />,
      color: "danger",
      onClick: () => alert("🗑️ Group deleted"),
    },
  ];

  return (
    <div className="context-menu-demo-advanced">
      <h1>📋 Context Menu Component - Advanced Demo</h1>
      <p className="intro-text">
        Using the useContextMenu hook for cleaner state management
      </p>

      {/* Message Demo */}
      <section className="demo-section">
        <h2>💬 Message Context Menu</h2>
        <p className="section-description">
          Right-click on the message to see actions like copy, reply, pin, or
          delete
        </p>
        <div
          className="demo-message"
          onContextMenu={messageMenu.handleContextMenu}
        >
          <p className="message-text">
            🧪 Right-click on this message to see the context menu
          </p>
          <small className="message-meta">Today at 2:30 PM</small>
        </div>
      </section>

      {/* Chat Demo */}
      <section className="demo-section">
        <h2>💬 Chat List Context Menu</h2>
        <p className="section-description">
          Right-click on a chat to manage it (mute, archive, or delete)
        </p>
        <div
          className="demo-chat-item"
          onContextMenu={chatMenu.handleContextMenu}
        >
          <div className="chat-avatar">👤</div>
          <div className="chat-info">
            <h3>Chat with John Doe</h3>
            <p>Last message: Hey, how are you?</p>
          </div>
        </div>
      </section>

      {/* Three Dots Menu Demo */}
      <section className="demo-section">
        <h2>⋯ Three Dots Menu (Button Click)</h2>
        <p className="section-description">
          Click the three dots button to see group management options
        </p>
        <div className="demo-header">
          <div className="header-content">
            <h3>Project Managers Group</h3>
            <p className="group-info">5 members</p>
          </div>
          <button
            className="three-dots-button"
            onClick={(e) => threeDotsMenu.handleThreeDotsClick(e)}
            title="More options"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </section>

      {/* Hook Usage Example */}
      <section className="demo-section info-box">
        <h3>🎯 How to Use the useContextMenu Hook</h3>
        <p>The hook simplifies context menu management:</p>

        <div className="code-block">
          <pre>{`import useContextMenu from '../hooks/useContextMenu';

function MyComponent() {
  const menu = useContextMenu();
  
  const menuItems = [
    {
      id: 'delete',
      label: 'Delete',
      icon: <Trash2 size={16} />,
      onClick: () => handleDelete(),
    },
  ];

  return (
    <>
      <div onContextMenu={menu.handleContextMenu}>
        Right-click me!
      </div>
      
      <ContextMenu
        isOpen={menu.isOpen}
        x={menu.x}
        y={menu.y}
        items={menuItems}
        onClose={menu.closeMenu}
      />
    </>
  );
}`}</pre>
        </div>

        <h4>Hook Methods:</h4>
        <ul>
          <li>
            <code>handleContextMenu(e)</code> - Handle right-click events
          </li>
          <li>
            <code>handleThreeDotsClick(e, menuWidth, offset)</code> - Handle
            button clicks
          </li>
          <li>
            <code>handleLongPress(e, duration)</code> - Handle mobile long press
          </li>
          <li>
            <code>closeMenu()</code> - Close the menu
          </li>
          <li>
            <code>closeMenuWithCallback(callback)</code> - Close and execute
            callback
          </li>
          <li>
            <code>updateMenuPosition(x, y)</code> - Update menu position
          </li>
        </ul>

        <h4>Hook Properties:</h4>
        <ul>
          <li>
            <code>menu</code> - Full menu state object
          </li>
          <li>
            <code>isOpen</code> - Boolean menu visibility
          </li>
          <li>
            <code>x, y</code> - Current menu position
          </li>
          <li>
            <code>setMenu(state)</code> - Set menu state directly
          </li>
        </ul>
      </section>

      {/* Implementation Tips */}
      <section className="demo-section">
        <h3>💡 Implementation Tips</h3>
        <div className="tips-grid">
          <div className="tip">
            <h4>📍 Position Handling</h4>
            <p>
              The hook's <code>handleThreeDotsClick</code> automatically
              prevents menus from going off-screen
            </p>
          </div>
          <div className="tip">
            <h4>📱 Mobile Support</h4>
            <p>
              Use <code>handleLongPress</code> for long-press on mobile devices
              (default 500ms)
            </p>
          </div>
          <div className="tip">
            <h4>⌨️ Keyboard</h4>
            <p>Menu automatically closes on Escape key press</p>
          </div>
          <div className="tip">
            <h4>🎨 Styling</h4>
            <p>
              All menu colors automatically follow your app's theme (light/dark)
            </p>
          </div>
          <div className="tip">
            <h4>🔄 Reusability</h4>
            <p>
              Create multiple instances with different menu items for various UI
              elements
            </p>
          </div>
          <div className="tip">
            <h4>⚡ Performance</h4>
            <p>Hook uses useCallback to prevent unnecessary re-renders</p>
          </div>
        </div>
      </section>

      {/* Context Menus */}
      <ContextMenu
        isOpen={messageMenu.isOpen}
        x={messageMenu.x}
        y={messageMenu.y}
        items={messageMenuItems}
        onClose={messageMenu.closeMenu}
      />

      <ContextMenu
        isOpen={chatMenu.isOpen}
        x={chatMenu.x}
        y={chatMenu.y}
        items={chatMenuItems}
        onClose={chatMenu.closeMenu}
      />

      <ContextMenu
        isOpen={threeDotsMenu.isOpen}
        x={threeDotsMenu.x}
        y={threeDotsMenu.y}
        items={threeDotsMenuItems}
        onClose={threeDotsMenu.closeMenu}
      />
    </div>
  );
};

export default ContextMenuDemoAdvanced;
