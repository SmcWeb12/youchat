// src/components/SettingsModal.js
import React, { useState } from 'react';

const SettingsModal = ({ isOpen, closeModal, user, updateUser }) => {
  const [newName, setNewName] = useState(user.name);
  const [newProfilePic, setNewProfilePic] = useState(user.profilePic);

  const handleSave = () => {
    // Update the user profile information here (could integrate with Firebase)
    updateUser({ name: newName, profilePic: newProfilePic });
    closeModal();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Profile</h2>
        <div>
          <label>Name</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
        </div>
        <div>
          <label>Profile Picture URL</label>
          <input
            type="text"
            value={newProfilePic}
            onChange={(e) => setNewProfilePic(e.target.value)}
          />
        </div>
        <div className="buttons">
          <button onClick={handleSave}>Save</button>
          <button onClick={closeModal}>Cancel</button>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .modal-content {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          max-width: 400px;
          width: 100%;
        }
        .buttons {
          display: flex;
          justify-content: space-between;
        }
      `}</style>
    </div>
  );
};

export default SettingsModal;
