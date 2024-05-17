// src/components/Common/Button/Button.jsx

import React from 'react';
import './Button.css';

const Button = ({ children, onClick, className = '', ...props }) => {
  return (
    <button
      className={`button ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
