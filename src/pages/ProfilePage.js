import React, { useState, useEffect } from "react";
import { db, storage } from "../firebase/firebase"; // Firebase config
import { collection, getDocs, addDoc, query, where, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage"; // Firebase Storage functions
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify"; // For toast notifications

function HomePage({ user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [userStatus, setUserStatus] = useState(""); // User status
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
    if (!selectedUser) return;

    const q = query(
      collection(db, "messages"),
      where("chatId", "in", [
        [user.uid, selectedUser.id].sort().join("-"),
        [selectedUser.id, user.uid].sort().join("-"),
      ]),
      orderBy("timestamp")
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const newMessages = [];
      querySnapshot.forEach((doc) => {
        newMessages.push({ id: doc.id, ...doc.data() });
      });
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [selectedUser, user]);

  const handleProfileImageUpload = async () => {
    if (!newProfileImage) return;

    const imageRef = ref(storage, `profile_images/${user.uid}`);
    const uploadTask = uploadBytesResumable(imageRef, newProfileImage);

    uploadTask.on(
      "state_changed",
      null,
      (error) => console.error("Error uploading image:", error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        // Update user profile image URL in Firestore
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { profileImage: downloadURL });

        // Update the users list to reflect the new image
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === user.uid ? { ...u, profileImage: downloadURL } : u
          )
        );

        toast.success("Profile image updated!");
      }
    );
  };

  const handleStatusUpdate = async () => {
    if (!userStatus.trim()) return;

    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { status: userStatus });

    toast.success("Status updated!");
  };

  const handleSendMessage = async () => {
    if (messageInput.trim() && selectedUser) {
      const newMessage = {
        text: messageInput,
        sender: user.name,
        timestamp: new Date().toISOString(),
        chatId: [user.uid, selectedUser.id].sort().join("-"),
        status: "unread", // Initial status as unread
      };

      setMessages((prevMessages) => [...prevMessages, newMessage]);
      setMessageInput("");

      try {
        await addDoc(collection(db, "messages"), newMessage);
        toast.success("Message sent!");
      } catch (error) {
        console.error("Error sending message: ", error);
        toast.error("Failed to send message");
      }
    }
  };

  const handleLogout = () => {
    alert("Logged out successfully!");
    navigate("/login");
  };

  const handleEditProfile = () => {
    navigate("/edit-profile");
  };

  const handleMediaUpload = async (file) => {
    if (!file) return;

    const mediaRef = ref(storage, `media_messages/${user.uid}_${file.name}`);
    const uploadTask = uploadBytesResumable(mediaRef, file);

    uploadTask.on(
      "state_changed",
      null,
      (error) => console.error("Error uploading media:", error),
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        // Create message with media
        const mediaMessage = {
          text: downloadURL,
          sender: user.name,
          timestamp: new Date().toISOString(),
          chatId: [user.uid, selectedUser.id].sort().join("-"),
          status: "unread",
          mediaType: file.type,
        };

        setMessages((prevMessages) => [...prevMessages, mediaMessage]);
        try {
          await addDoc(collection(db, "messages"), mediaMessage);
          toast.success("Media sent!");
        } catch (error) {
          toast.error("Failed to send media");
        }
      }
    );
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
                className="flex items-center space-x-4 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                onClick={() => setSelectedUser(userItem)}
              >
                <img
                  src={userItem.profileImage || "https://via.placeholder.com/50"}
                  alt="User"
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <p className="text-gray-700 font-semibold">{userItem.name}</p>
                  {userItem.unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {userItem.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        
      </div>

      {/* User Status Update */}
      
    </div>
  );
}

export default HomePage;
