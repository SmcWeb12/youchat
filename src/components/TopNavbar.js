import React, { useState } from 'react';
import { FaCog } from 'react-icons/fa'; // Settings icon
import { useNavigate } from 'react-router-dom'; // For navigation
import { auth, storage, db } from '../firebase/firebase'; // Import Firebase
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase storage imports
import { doc, updateDoc } from 'firebase/firestore'; // Firebase Firestore imports

const TopNavbar = ({ onLogout, user }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State to toggle dropdown menu
  const [newImage, setNewImage] = useState(null); // State to store the selected image
  const [name, setName] = useState(user.displayName || ''); // Set name from user profile or default
  const [loading, setLoading] = useState(false); // State for loading indicator

  // Function to handle Settings click (opens the dropdown)
  const handleSettingsClick = () => {
    setIsMenuOpen(!isMenuOpen); // Toggle menu visibility
  };

  // Function to handle Logout click
  const handleLogout = () => {
    onLogout(); // Call the logout function passed via props
    navigate('/login'); // Redirect to login page after logout
  };

  // Function to handle Edit Profile click
  const handleEditProfile = () => {
    navigate('/edit-profile'); // Redirect to edit profile page
  };

  // Handle image upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0]; // Get the selected image file
    if (file) {
      setLoading(true); // Start loading
      try {
        // Create a reference to the storage location
        const imageRef = ref(storage, `profileImages/${user.uid}`);
        // Upload the image file
        await uploadBytes(imageRef, file);
        // Get the download URL after upload
        const imageUrl = await getDownloadURL(imageRef);
        
        // Update the user's image URL in Firestore
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, { profileImage: imageUrl });
        
        alert("Profile image updated successfully!");
      } catch (error) {
        console.error("Error uploading image:", error);
        alert("Error uploading image!");
      } finally {
        setLoading(false); // End loading
      }
    }
  };

  // Function to handle Profile updates (only name)
  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const userRef = doc(db, "users", user.uid); // Firestore reference
      await updateDoc(userRef, { name }); // Update name in Firestore
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Error updating profile!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <nav className="bg-blue-500 text-white px-4 py-2 flex justify-between items-center">
      <h1 className="text-lg font-bold">My Chat App</h1>

      <div className="relative flex items-center space-x-4">
        {/* Settings icon */}
        <button
          onClick={handleSettingsClick}
          className="bg-white text-blue-500 p-2 rounded-full hover:bg-gray-200"
        >
          <FaCog className="h-6 w-6" />
        </button>

        {/* Dropdown menu */}
        {isMenuOpen && (
          <div className="absolute right-0 bg-white text-blue-500 shadow-md rounded-md mt-2 w-64 p-4">
            {/* User Profile Image */}
            <div className="flex flex-col items-center mb-4">
             
             
              
            </div>

            
            

            {/* Edit Profile and Logout Buttons */}
            <div className="space-y-2">
              <button
                onClick={handleEditProfile}
                className="w-full px-4 py-2 text-left hover:bg-gray-200"
              >
                Edit Profile
              </button>
              
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default TopNavbar;
