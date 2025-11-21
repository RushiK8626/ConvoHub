import React from "react";
import { Check, CheckCheck } from "lucide-react";

const MessageStatusIndicator = ({ messageId, statuses, currentUserId }) => {
  if (!messageId) return null;

  // console.log(`[STATUS INDICATOR] messageId=${messageId}, statuses=`, statuses, `currentUserId=${currentUserId}`);

  // statuses is an object like: { user_id_1: 'read', user_id_2: 'delivered', user_id_3: 'sent' }
  if (!statuses || Object.keys(statuses).length === 0) {
    // Default to 'sent' if no status
    // console.log(`[STATUS INDICATOR] No statuses for message ${messageId}, showing single tick`);
    return (
      <Check
        size={14}
        style={{
          marginLeft: 4,
          opacity: 0.7,
          color: "currentColor",
        }}
      />
    );
  }

  // For messages the current user SENT, we need to check OTHER users' status
  // Find the highest status among all OTHER users
  let highestStatus = "sent";

  const otherUsersStatuses = Object.entries(statuses)
    .filter(([uid]) => uid.toString() !== currentUserId?.toString())
    .map(([, status]) => status);

  // console.log(`[STATUS INDICATOR] Other users statuses for message ${messageId}:`, otherUsersStatuses);

  // Determine highest status (read > delivered > sent)
  if (otherUsersStatuses.some((s) => s === "read")) {
    highestStatus = "read";
  } else if (otherUsersStatuses.some((s) => s === "delivered")) {
    highestStatus = "delivered";
  } else {
    highestStatus = "sent";
  }

  // console.log(`[STATUS INDICATOR] Message ${messageId} highest status=${highestStatus}`);

  // Show status based on highest status among other users
  if (highestStatus === "sent") {
    return (
      <Check
        size={14}
        style={{
          marginLeft: 4,
          opacity: 0.7,
          color: "currentColor",
        }}
      />
    );
  }

  // Show status based on highest status among other users
  if (highestStatus === "sent") {
    return (
      <Check
        size={14}
        style={{
          marginLeft: 4,
          opacity: 0.7,
          color: "currentColor",
        }}
      />
    );
  }

  // Double ticks with gray for delivered
  if (highestStatus === "delivered") {
    return (
      <CheckCheck
        size={14}
        style={{
          marginLeft: 4,
          opacity: 0.7,
          color: "currentColor",
        }}
      />
    );
  }

  // Double ticks with blue color for read
  if (highestStatus === "read") {
    return (
      <CheckCheck
        size={14}
        style={{
          marginLeft: 4,
          color: "#007AFF", // Blue color for read
          fill: "#007AFF",
        }}
      />
    );
  }

  // Fallback
  return (
    <Check
      size={14}
      style={{
        marginLeft: 4,
        opacity: 0.7,
        color: "currentColor",
      }}
    />
  );
};

export default MessageStatusIndicator;
