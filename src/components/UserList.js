import React, { useState, useEffect } from 'react'; // useState, useEffect इम्पोर्ट
import { useNavigate } from 'react-router-dom'; // useNavigate इम्पोर्ट
import { db } from '../firebase/firebase'; // Firebase configuration
import { doc, getDoc } from 'firebase/firestore'; // Firebase Firestore methods

function UserList({ users = [] }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [userProfiles, setUserProfiles] = useState([]); // To store the profile images
  const [selectedUsers, setSelectedUsers] = useState([]); // To store selected users for group chat

  useEffect(() => {
    // Fetch the user profiles with profilePicture
    const fetchUserProfiles = async () => {
      const usersWithProfilePictures = await Promise.all(
        users.map(async (user) => {
          const userDocRef = doc(db, 'users', user.id);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            return { ...user, profilePicture: userDoc.data().profilePicture || 'https://via.placeholder.com/50' };
          }
          return user;
        })
      );
      setUserProfiles(usersWithProfilePictures);
    };

    fetchUserProfiles();
  }, [users]);

  const handleSelectUser = (user) => {
    // If the user is already selected, deselect them, otherwise select them
    setSelectedUsers((prevSelectedUsers) => {
      if (prevSelectedUsers.includes(user.id)) {
        return prevSelectedUsers.filter((id) => id !== user.id);
      } else {
        return [...prevSelectedUsers, user.id];
      }
    });
  };

  const createGroupChat = async () => {
    if (selectedUsers.length < 2) {
      alert("Please select at least two users to create a group chat.");
      return;
    }

    // Create a new group in Firestore
    const groupRef = await db.collection('groups').add({
      members: selectedUsers,
      groupName: "New Group", // You can add a group name input if needed
      createdAt: new Date(),
    });

    // After group is created, navigate to the group chat page
    navigate(`/group-chat/${groupRef.id}`);
  };

  const filteredUsers = userProfiles.filter((user) =>
    user?.name?.toLowerCase().includes(searchTerm?.toLowerCase() || '')
  );

  return (
    <div className="user-list-container bg-white p-4 rounded-lg shadow-lg max-w-[380px] mx-auto h-full overflow-y-auto">
      {/* सर्च बार */}
      <div className="search-bar mb-4">
        <input
          type="text"
          className="w-full p-3 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
          placeholder="Search or start new chat..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Users List */}
      <ul className="user-list space-y-3">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <li
              key={user.id}
              className="user-item flex items-center p-3 bg-white rounded-lg hover:bg-gray-100 cursor-pointer transition duration-200 ease-in-out"
              onClick={() => handleSelectUser(user)}
            >
              {/* User Profile Picture */}
              <div className="user-avatar relative mr-4">
                <img
                  src={user.profilePicture || 'https://via.placeholder.com/50'}
                  alt={`${user.name}'s profile`}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                />
                {/* Online/Offline Status Indicator */}
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                    user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}
                ></span>
              </div>

              {/* User Name */}
              <div className="user-info flex flex-col justify-center">
                <span className="user-name font-semibold text-gray-800 text-sm truncate">
                  {user.name}
                </span>
                <span className="user-last-message text-gray-500 text-xs truncate">
                  {user.lastMessage || 'No messages yet'}
                </span>
              </div>
            </li>
          ))
        ) : (
          <li className="text-center text-gray-500">No users available</li>
        )}
      </ul>

      {/* Group Chat Create Button */}
      {selectedUsers.length > 1 && (
        <div className="create-group-chat mt-4">
          <button
            className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={createGroupChat}
          >
            Create Group Chat
          </button>
        </div>
      )}
    </div>
  );
}

export default UserList;
