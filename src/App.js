import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { auth } from './firebase/firebase'; // Firebase import for authentication
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ClipLoader } from 'react-spinners'; // Loading spinner component

// Import pages and components
import Login from './components/Login';
import Signup from './components/Signup';
import HomePage from './pages/HomePage';
import ProfileEdit from './components/ProfileEdit';
import ChatPage from './pages/ChatPage';
import EditProfile from './components/EditProfile'; 
import GroupChat from './pages/GroupChat'; // Import GroupChat page
import Navbar from './components/UI/Navbar'; // Add Navbar for navigation

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Logout function
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setUser(null);
      })
      .catch((error) => {
        console.error('Error during logout:', error);
        alert('Error logging out! Please try again.');
      });
  };

  // Show loading spinner until user is authenticated
  if (loading) {
    return <div className="flex justify-center items-center h-screen"><ClipLoader size={50} color={"#123abc"} /></div>;
  }

  return (
    <div>
      {/* Navbar Component for all pages */}
      {user && <Navbar onLogout={handleLogout} />}

      <Routes>
        {/* Redirect to home if logged in or login page if not */}
        <Route path="/" element={<Navigate to={user ? '/home' : '/login'} />} />
        
        {/* Authentication Routes */}
        <Route path="/login" element={user ? <Navigate to="/home" /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/home" /> : <Signup />} />

        {/* HomePage and other routes only accessible if user is logged in */}
        <Route path="/home" element={user ? <HomePage user={user} /> : <Navigate to="/login" />} />
        <Route path="/profile/edit" element={user ? <ProfileEdit /> : <Navigate to="/login" />} />
        <Route path="/chat/:userId" element={user ? <ChatPage user={user} /> : <Navigate to="/login" />} />
        <Route path="/edit-profile" element={user ? <EditProfile /> : <Navigate to="/login" />} />

        {/* GroupChat route */}
        <Route path="/groupchat" element={user ? <GroupChat user={user} /> : <Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

export default App;
