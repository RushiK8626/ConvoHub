import React, { useState } from "react";
import ContextMenu from "./ContextMenu";
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
import "./ContextMenuDemo.css";

/**
 * Demo Component for ContextMenu
 * Shows various use cases with different menu configurations
 */
const ContextMenuDemo = () => {
  const [messageMenu, setMessageMenu] = useState({ isOpen: false, x: 0, y: 0 });
  const [chatMenu, setChatMenu] = useState({ isOpen: false, x: 0, y: 0 });
  const [threeDotsMenu, setThreeDotsMenu] = useState({
    isOpen: false,
    x: 0,
    y: 0,
  });

  // Message context menu items
  const messageMenuItems = [
    {
      id: "copy",
      label: "Copy",
      icon: <Copy size={16} />,
      onClick: () => alert("Message copied"),
    },
    {
      id: "reply",
      label: "Reply",
      icon: <Forward size={16} />,
      onClick: () => alert("Reply mode activated"),
    },
    {
      id: "divider1",
      divider: true,
    },
    {
      id: "pin",
      label: "Pin Message",
      icon: <Pin size={16} />,
      onClick: () => alert("Message pinned"),
    },
    {
      id: "react",
      label: "React",
      icon: <Heart size={16} />,
      onClick: () => alert("Reaction menu opened"),
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
      onClick: () => alert("Message deleted"),
    },
  ];

  // Chat list context menu items
  const chatMenuItems = [
    {
      id: "archive",
      label: "Archive",
      icon: <Archive size={16} />,
      onClick: () => alert("Chat archived"),
    },
    {
      id: "mute",
      label: "Mute",
      icon: <Mute size={16} />,
      onClick: () => alert("Chat muted"),
    },
    {
      id: "pin-chat",
      label: "Pin",
      icon: <Pin size={16} />,
      onClick: () => alert("Chat pinned"),
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
      onClick: () => alert("Chat deleted"),
    },
  ];

  // Three dots menu items
  const threeDotsMenuItems = [
    {
      id: "mute-all",
      label: "Mute All Notifications",
      icon: <Mute size={16} />,
      onClick: () => alert("All notifications muted"),
    },
    {
      id: "members",
      label: "Group Members",
      icon: <Users size={16} />,
      onClick: () => alert("Members list opened"),
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
      onClick: () => alert("Report submitted"),
    },
    {
      id: "delete-group",
      label: "Delete Group",
      icon: <Trash2 size={16} />,
      color: "danger",
      onClick: () => alert("Group deleted"),
    },
  ];

  // Handle right click on message
  const handleMessageContextMenu = (e) => {
    e.preventDefault();
    setMessageMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Handle right click on chat
  const handleChatContextMenu = (e) => {
    e.preventDefault();
    setChatMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
    });
  };

  // Handle long press on message (for mobile)
  const handleMessageLongPress = (e) => {
    const touch = e.touches[0];
    setMessageMenu({
      isOpen: true,
      x: touch.clientX,
      y: touch.clientY,
    });
  };

  // Handle three dots click
  const handleThreeDotsClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setThreeDotsMenu({
      isOpen: true,
      x: rect.right - 280,
      y: rect.bottom + 8,
    });
  };

  return (
    <div className="context-menu-demo">
      <h1>Context Menu Component Demo</h1>

      {/* Message Demo */}
      <section className="demo-section">
        <h2>Message Context Menu (Right Click)</h2>
        <div
          className="demo-message"
          onContextMenu={handleMessageContextMenu}
          onTouchEnd={(e) => {
            // Simulate long press for mobile
            const touch = e.touches?.[0];
            if (touch) handleMessageLongPress(e);
          }}
        >
          <p>
            🧪 Right-click or long press on this message to see the context menu
          </p>
          <small>Try copying, pinning, or deleting</small>
        </div>
      </section>

      {/* Chat Demo */}
      <section className="demo-section">
        <h2>Chat List Context Menu (Right Click)</h2>
        <div className="demo-chat-item" onContextMenu={handleChatContextMenu}>
          <div className="chat-avatar">👤</div>
          <div className="chat-info">
            <h3>Chat with John</h3>
            <p>Last message: Hey, how are you?</p>
          </div>
        </div>
        <small>Right-click on the chat to see options</small>
      </section>

      {/* Three Dots Menu */}
      <section className="demo-section">
        <h2>Three Dots Menu (Top Right)</h2>
        <div className="demo-header">
          <h3>Group Chat</h3>
          <button
            className="three-dots-button"
            onClick={handleThreeDotsClick}
            title="More options"
          >
            <MoreVertical size={20} />
          </button>
        </div>
        <small>Click the three dots button to see menu</small>
      </section>

      {/* Context Menus */}
      <ContextMenu
        isOpen={messageMenu.isOpen}
        x={messageMenu.x}
        y={messageMenu.y}
        items={messageMenuItems}
        onClose={() => setMessageMenu({ isOpen: false, x: 0, y: 0 })}
      />

      <ContextMenu
        isOpen={chatMenu.isOpen}
        x={chatMenu.x}
        y={chatMenu.y}
        items={chatMenuItems}
        onClose={() => setChatMenu({ isOpen: false, x: 0, y: 0 })}
      />

      <ContextMenu
        isOpen={threeDotsMenu.isOpen}
        x={threeDotsMenu.x}
        y={threeDotsMenu.y}
        items={threeDotsMenuItems}
        onClose={() => setThreeDotsMenu({ isOpen: false, x: 0, y: 0 })}
      />

      {/* Info Box */}
      <section className="demo-section info-box">
        <h3>📌 How to Use ContextMenu Component</h3>
        <ul>
          <li>Import the ContextMenu component</li>
          <li>
            Define your menu items array with id, label, icon, and onClick
          </li>
          <li>
            Handle user interactions (right-click, long press, or button click)
          </li>
          <li>Pass position (x, y) and items to the ContextMenu</li>
          <li>Add dividers between item groups using divider: true</li>
          <li>
            Use color prop for visual hierarchy (danger, warning, success,
            primary)
          </li>
        </ul>

        <h4>Menu Item Properties:</h4>
        <ul>
          <li>
            <code>id</code> - Unique identifier
          </li>
          <li>
            <code>label</code> - Display text
          </li>
          <li>
            <code>icon</code> - React element (SVG icon)
          </li>
          <li>
            <code>onClick</code> - Callback function
          </li>
          <li>
            <code>color</code> - Styling variant (default, danger, warning,
            success, primary)
          </li>
          <li>
            <code>disabled</code> - Disable item
          </li>
          <li>
            <code>divider</code> - Show divider line
          </li>
          <li>
            <code>badge</code> - Display small badge text
          </li>
        </ul>
      </section>
    </div>
  );
};

export default ContextMenuDemo;
