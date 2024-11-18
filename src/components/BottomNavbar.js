import React from 'react';
import { useNavigate } from 'react-router-dom';

const BottomNavbar = () => {
  const navigate = useNavigate();

  const handleStoryClick = () => {
    alert('Story clicked! Add story functionality here.');
    // Navigate to the story page if needed
    // navigate('/story');
  };

  const handleStatusClick = () => {
    alert('Status clicked! Add status functionality here.');
    // Navigate to the status page if needed
    // navigate('/status');
  };

  return (
    <nav className="bg-gray-800 text-white px-4 py-2 fixed bottom-0 w-full flex justify-around items-center">
      <button
        onClick={handleStoryClick}
        className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-700"
      >
        Story
      </button>
      <button
        onClick={handleStatusClick}
        className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-700"
      >
        Status
      </button>
    </nav>
  );
};

export default BottomNavbar;
