import React, { useState, useRef } from 'react';
import { FiImage, FiMic, FiSend } from 'react-icons/fi';
import Picker from 'emoji-picker-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const MessageInput = ({ user, userId, conversationId }) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showImagePopup, setShowImagePopup] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Handle message send
  const handleSendMessage = async () => {
    if (newMessage.trim() === '') return;

    const messageData = {
      text: newMessage,
      senderId: user.uid,
      receiverId: userId,
      timestamp: serverTimestamp(),
    };

    try {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle typing indicator
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
  };

  // Handle emoji selection
  const handleEmojiClick = (emojiData) => {
    setNewMessage((prevMessage) => prevMessage + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const storageRef = ref(storage, `images/${file.name}`);
      uploadBytes(storageRef, file).then((snapshot) => {
        getDownloadURL(snapshot.ref).then((downloadURL) => {
          const messageData = {
            image: downloadURL,
            senderId: user.uid,
            receiverId: userId,
            timestamp: serverTimestamp(),
          };

          // Send image message to Firebase
          const messagesRef = collection(db, 'conversations', conversationId, 'messages');
          addDoc(messagesRef, messageData);
        });
      });
    }
  };

  // Start recording audio
  const startRecording = () => {
    setIsRecording(true);
    audioChunksRef.current = [];

    // Ensure we have permission and initialize MediaRecorder
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          audioChunksRef.current.push(event.data);
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setAudioURL(audioUrl);

          // Send audio message to Firebase
          const messageData = {
            audio: audioUrl,
            senderId: user.uid,
            receiverId: userId,
            timestamp: serverTimestamp(),
          };

          const messagesRef = collection(db, 'conversations', conversationId, 'messages');
          addDoc(messagesRef, messageData);
        };

        mediaRecorder.start();
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
      });
  };

  // Stop recording audio
  const stopRecording = () => {
    setIsRecording(false);
    mediaRecorderRef.current.stop();
  };

  return (
    <div className="relative flex items-center p-3 bg-gradient-to-r from-green-400 to-blue-500 rounded-lg shadow-lg">
      {/* Emoji Button */}
      <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="text-white hover:bg-opacity-75 p-2 rounded-full transition-all ease-in-out duration-300 transform hover:scale-110">
        😀
      </button>

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-20 left-0 bg-white rounded-xl shadow-xl p-3 z-50">
          <Picker onEmojiClick={handleEmojiClick} />
        </div>
      )}

      {/* Image Upload Button */}
      <button onClick={() => setShowImagePopup(true)} className="text-white hover:bg-opacity-75 p-2 rounded-full transition-all ease-in-out duration-300 transform hover:scale-110">
        <FiImage />
      </button>

      {/* Input Field */}
      <input
        type="text"
        value={newMessage}
        onChange={handleTyping}
        className="flex-1 p-3 mx-3 rounded-full text-gray-900 placeholder-gray-600 focus:outline-none bg-white bg-opacity-80 border border-transparent hover:border-gray-300 focus:border-gray-400 transition-all ease-in-out duration-300"
        placeholder="Type a message"
      />

      {/* Audio/Send Button */}
      <div className="flex items-center space-x-2">
        {isRecording ? (
          <button onClick={stopRecording} className="text-red-500 hover:bg-opacity-75 p-2 rounded-full transition-all ease-in-out duration-300 transform hover:scale-110">
            Stop
          </button>
        ) : (
          <button onClick={startRecording} className="text-red-500 hover:bg-opacity-75 p-2 rounded-full transition-all ease-in-out duration-300 transform hover:scale-110">
            <FiMic size={24} />
          </button>
        )}

        <button onClick={handleSendMessage} className="bg-[#25D366] text-white p-3 rounded-full hover:bg-[#128C7E] transition-all ease-in-out duration-300 transform hover:scale-110">
          <FiSend size={20} />
        </button>
      </div>

      {/* Image Upload Popup */}
      {showImagePopup && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="mb-3 border border-gray-300 p-2 rounded-lg"
            />
            <button onClick={() => setShowImagePopup(false)} className="bg-red-500 text-white p-3 rounded-full">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;
