import React from "react";
import { useLocation } from "react-router-dom";

function GroupChat() {
  const location = useLocation();
  const selectedUsers = location.state?.users || [];

  return (
    <div>
      <h2>Group Chat</h2>
      <div>
        {selectedUsers.length > 0 ? (
          <ul>
            {selectedUsers.map((user, index) => (
              <li key={index}>{user.name}</li>
            ))}
          </ul>
        ) : (
          <p>No users selected for the group chat.</p>
        )}
      </div>
    </div>
  );
}

export default GroupChat;
