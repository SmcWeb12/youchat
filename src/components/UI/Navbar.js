// src/components/UI/Navbar.js

import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ onLogout }) => {
  return (
    <nav className="bg-blue-600 p-4 flex justify-between items-center">
      <div>
        <Link to="/home" className="text-white text-xl">My Chat App</Link>
      </div>
      <div>
        <Link to="/profile/edit" className="text-white mx-4">Profile</Link>
        <Link to="/groupchat" className="text-white mx-4">Group Chat</Link>
        <button onClick={onLogout} className="text-white mx-4">Logout</button>
      </div>
    </nav>
  );
}

export default Navbar;
