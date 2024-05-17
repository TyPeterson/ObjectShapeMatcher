// src/components/Common/Thumbnail/Thumbnail.jsx

import React from 'react';
import './Thumbnail.css';

const Thumbnail = ({ src, alt, onClick }) => {
  return (
    <img
      className="thumbnail"
      src={src}
      alt={alt}
      onClick={onClick}
    />
  );
};

export default Thumbnail;
