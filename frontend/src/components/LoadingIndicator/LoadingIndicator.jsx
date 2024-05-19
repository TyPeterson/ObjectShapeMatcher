import React from 'react';
import './LoadingIndicator.css';

const LoadingIndicator = ({ message }) => {
  return (
    <div className="loading-indicator">
      <div className="spinner"></div>
      <p id="loading-message">{message}</p>
    </div>
  );
};

export default LoadingIndicator;
