import React, { useState, useEffect } from "react";
import { db, storage } from "../firebase/firebase"; // Firebase config
import { collection, getDocs, updateDoc, doc, onSnapshot, query, where, orderBy, addDoc } from "firebase/firestore"; // addDoc इम्पोर्ट करें
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Firebase Storage functions
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; // For toast notifications

function HomePage({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [userStatus, setUserStatus] = useState(user.status || ""); // User status initialized from Firebase
  const [selectedUser, setSelectedUser] = useState(null); // selectedUser स्टेट जोड़ें
  const [selectedUsers, setSelectedUsers] = useState([]); // selectedUsers स्टेट जोड़ें (for group chat)
  const navigate = useNavigate();

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, "users"));
        const userList = [];
        querySnapshot.forEach((doc) => {
          userList.push({ id: doc.id, ...doc.data() });
        });

        // Sort users by message count in descending order
        userList.sort((a, b) => b.messageCount - a.messageCount);
        setUsers(userList);
        setLoading(false);
      } catch (error) {
        setError("Failed to load users.");
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Real-time messages from Firestore
  useEffect(() => {
    if (!selectedUser) return; // अगर selectedUser नहीं है तो रिटर्न कर जाएं
    const messagesQuery = query(
      collection(db, "messages"),
      where("receiver", "==", selectedUser.id),
      orderBy("timestamp")
    );

    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      const messagesArray = [];
      querySnapshot.forEach((doc) => {
        messagesArray.push(doc.data());
      });
      setMessages(messagesArray);

      // Update message count for the selected user
      updateMessageCount(selectedUser.id, messagesArray.length);
    });

    return () => unsubscribe();
  }, [selectedUser]); // selectedUser पर निर्भरता

  const updateMessageCount = async (userId, count) => {
    const userDoc = doc(db, "users", userId);
    await updateDoc(userDoc, { messageCount: count });
  };

  // Handle Profile Image Upload
  const handleProfileImageUpload = async () => {
    if (!newProfileImage) {
      toast.error("No image selected!");
      return;
    }
    const storageRef = ref(storage, `profileImages/${user.id}`);
    const uploadTask = uploadBytesResumable(storageRef, newProfileImage);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is " + progress + "% done");
      },
      (error) => {
        console.log(error);
        toast.error("Failed to upload image.");
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        // Update the user's profile image in Firestore
        await updateDoc(doc(db, "users", user.id), {
          profileImage: downloadURL,
        });
        toast.success("Profile image updated successfully!");
      }
    );
  };

  // Handle Status Update
  const handleStatusUpdate = async () => {
    if (userStatus.trim()) {
      await updateDoc(doc(db, "users", user.id), { status: userStatus });
      toast.success("Status updated!");
    } else {
      toast.error("Please enter a valid status!");
    }
  };

  // Handle Send Message
  const handleSendMessage = async () => {
    if (messageInput.trim()) {
      const newMessage = {
        sender: user.id,
        receiver: selectedUser.id,
        message: messageInput,
        timestamp: new Date(),
      };
      await addDoc(collection(db, "messages"), newMessage); // addDoc से संदेश जोड़ें
      setMessageInput("");
    } else {
      toast.error("Message cannot be empty!");
    }
  };

  // Handle Logout
  const handleLogout = () => {
    alert("Logged out successfully!");
    navigate("/login");
  };

  // Handle Edit Profile
  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  // Handle Select User
  const handleSelectUser = (userItem) => {
    setSelectedUser(userItem);  // selectedUser को सेट करें
    navigate(`/chat/${userItem.id}`);
  };

  // Handle Group Chat
  const handleGroupChat = () => {
    if (selectedUsers.length > 1) {
      // Navigate to GroupChat page
      navigate("/groupchat", { state: { users: selectedUsers } });
    } else {
      toast.error("Please select at least 2 users for group chat!");
    }
  };

  // Toggle user selection for group chat
  const toggleUserSelection = (userItem) => {
    if (selectedUsers.includes(userItem)) {
      setSelectedUsers(selectedUsers.filter((user) => user !== userItem));
    } else {
      setSelectedUsers([...selectedUsers, userItem]);
    }
  };

  if (loading) {
    return (
      <div className="text-center text-gray-600 mt-10">
        <div className="loader h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="mt-4">Loading...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-600">{error}</div>;
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-gradient-to-br from-green-400 to-blue-500">
      {/* Top Navbar */}
      <div className="bg-white shadow-md py-2 px-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <img
            src={user.profileImage || "https://via.placeholder.com/50"}
            alt="Profile"
            className="w-12 h-12 rounded-full"
          />
          <h2 className="text-2xl font-semibold text-gray-700">{user.name}</h2>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleEditProfile}
            className="bg-gray-600 text-white px-4 py-2 rounded-full hover:bg-gray-700"
          >
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="flex-grow flex">
        {/* Left Side - User List */}
        <div className="w-full md:w-1/3 bg-white shadow-lg rounded-lg p-4 overflow-y-auto">
          <h3 className="text-xl font-semibold text-gray-700 mb-4">Chats</h3>
          <div className="user-list overflow-y-auto max-h-80 custom-scrollbar">
            {users.map((userItem) => (
              <div
                key={userItem.id}
                className="flex items-center space-x-4 p-2 hover:bg-gray-100 rounded-lg cursor-pointer transition-all duration-200 ease-in-out"
                onClick={() => handleSelectUser(userItem)} // Navigate to ChatPage
              >
                <img
                  src={userItem.profileImage || "https://via.placeholder.com/50"}
                  alt="User"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="text-gray-700">{userItem.name}</p>
                  {userItem.messageCount > 0 && (
                    <span className="text-sm text-red-500">{userItem.messageCount}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Chat Window */}
        <div className="w-full md:w-2/3 bg-white shadow-lg rounded-lg p-4 overflow-y-auto">
          {selectedUser ? (
            <>
              <h3 className="text-2xl font-semibold text-gray-700">Chat with {selectedUser.name}</h3>
              <div className="messages mt-4 mb-4">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded-lg mb-2 ${message.sender === user.id ? "bg-green-100" : "bg-blue-100"}`}
                  >
                    <p className="text-sm">{message.message}</p>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-grow p-2 rounded-lg border border-gray-300"
                  placeholder="Type your message..."
                />
                <button
                  onClick={handleSendMessage}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <p className="text-gray-500">Select a user to start chatting!</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default HomePage;
