import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db, storage } from '../firebase/firebase'; 
import { collection, onSnapshot, doc, getDoc, updateDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore'; // Import query and orderBy
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import MessageInput from './MessageInput'; 

const ChatPage = ({ user }) => {
  const { userId } = useParams();
  const [messages, setMessages] = useState([]);
  const [receiverName, setReceiverName] = useState('');
  const [receiverOnlineStatus, setReceiverOnlineStatus] = useState('');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [chatBackground, setChatBackground] = useState('');
  const [wallpaperFile, setWallpaperFile] = useState(null);

  const conversationId = [user.uid, userId].sort().join('_');

  // Fetch receiver's name and online status
  useEffect(() => {
    const fetchReceiverData = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          setReceiverName(userDoc.data().name);
          setReceiverOnlineStatus(userDoc.data().online ? 'Online' : 'Offline');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchReceiverData();
  }, [userId]);

  // Real-time messages
  useEffect(() => {
    if (!conversationId) return;

    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc')); // Using query and orderBy here

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, [conversationId]);

  // Fetch and set the saved wallpaper
  useEffect(() => {
    const fetchWallpaper = async () => {
      const userRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists() && userDoc.data().chatBackground) {
        setChatBackground(userDoc.data().chatBackground);
      }
    };
    fetchWallpaper();
  }, [user.uid]);

  // Handle wallpaper upload
  const handleWallpaperUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setWallpaperFile(file); 
    }
  };

  // Save wallpaper to Firestore and Storage
  const saveWallpaper = async () => {
    if (!wallpaperFile) return;

    const storageRef = ref(storage, `wallpapers/${wallpaperFile.name}`);
    await uploadBytes(storageRef, wallpaperFile);
    const url = await getDownloadURL(storageRef);
    setChatBackground(url);

    // Save wallpaper URL in Firestore for persistence
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      chatBackground: url,
    });
  };

  // Handle Clear Chat
  const handleClearChat = async () => {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const querySnapshot = await getDocs(messagesRef);
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref); // Delete each message
    });
  };

  // Handle message delete
  const handleDeleteMessage = async (messageId) => {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await deleteDoc(messageRef);
  };

  return (
    <div className="chat-page h-screen flex flex-col bg-gray-100">
      {/* Chat Header */}
      <header className="bg-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <img
            src={user.photoURL || 'default-avatar.png'}
            alt="Profile"
            className="w-10 h-10 rounded-full cursor-pointer"
          />
          <div>
            <div className="font-semibold">{receiverName || userId}</div>
            <div className="text-xs text-gray-500">
              {receiverOnlineStatus && `• ${receiverOnlineStatus}`}
            </div>
          </div>
        </div>
        <div className="flex space-x-2">
          {/* Settings Button */}
          <button onClick={() => setSettingsModalOpen(true)} className="text-gray-600 hover:text-gray-900">⚙️</button>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white rounded-lg shadow-lg mx-4" style={{ backgroundImage: `url(${chatBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`mb-3 p-3 max-w-xs rounded-xl ${msg.senderId === user.uid ? 'bg-blue-500 text-white self-end ml-auto' : 'bg-gray-200 text-black self-start mr-auto'}`}
          >
            <p>{msg.text}</p>
            {msg.image && (
              <div className="relative">
                <img
                  src={msg.image}
                  alt="Message"
                  className="w-40 h-40 object-cover rounded-md my-2 cursor-pointer"
                  onClick={() => window.open(msg.image, '_blank')} // Open image in full-screen on click
                />
              </div>
            )}
            {msg.audio && <audio controls className="my-2"><source src={msg.audio} /></audio>}
            <div className="text-xs text-gray-400 text-right mt-1">{new Date(msg.timestamp?.seconds * 1000).toLocaleTimeString()}</div>
            <button onClick={() => handleDeleteMessage(msg.id)} className="text-red-500 text-xs">Delete</button>
          </div>
        ))}
      </div>

      {/* Message Input */}
      <MessageInput user={user} userId={userId} conversationId={conversationId} />

      {/* Settings Modal */}
      {settingsModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="font-semibold text-xl mb-4">Settings</h2>
            <div className="mb-4">
              <input type="file" onChange={handleWallpaperUpload} className="border p-2 w-full" />
              {wallpaperFile && <div className="mt-2 text-gray-600">Selected Wallpaper: {wallpaperFile.name}</div>}
              {chatBackground && <img src={chatBackground} alt="Wallpaper Preview" className="mt-4 w-full h-40 object-cover rounded-lg" />}
            </div>
            <div className="mb-4">
              <button onClick={saveWallpaper} className="w-full bg-blue-500 text-white p-2 rounded-md">Save Wallpaper</button>
            </div>
            <div className="mb-4">
              <button onClick={handleClearChat} className="w-full bg-red-500 text-white p-2 rounded-md">Clear Chat</button>
            </div>
            <div className="mb-4">
              <button onClick={() => setSettingsModalOpen(false)} className="w-full bg-gray-500 text-white p-2 rounded-md">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
