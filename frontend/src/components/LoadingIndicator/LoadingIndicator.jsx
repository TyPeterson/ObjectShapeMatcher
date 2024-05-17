// src/components/LoadingIndicator/LoadingIndicator.jsx

import React from 'react';
import './LoadingIndicator.css';

// add input parameter for what to display as the loading message
const LoadingIndicator = ({ message }) => {
  return (
    <div className="loading-indicator">
      <div className="spinner"></div>
      <p id="loading-message">{message}</p>
    </div>
  );
};

export default LoadingIndicator;
