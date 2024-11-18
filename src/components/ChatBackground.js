// src/components/ChatBackground.js
import React from 'react';

const ChatBackground = () => {
  return (
    <div className="chat-background">
      <div className="overlay"></div>
      <style jsx>{`
        .chat-background {
          position: relative;
          height: 100%;
          width: 100%;
          background: url('https://example.com/background.jpg') no-repeat center center fixed;
          background-size: cover;
        }
        .overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
};

export default ChatBackground;
