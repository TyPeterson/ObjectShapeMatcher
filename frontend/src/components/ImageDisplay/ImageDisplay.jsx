import React, { useState, useEffect, useRef } from 'react';
import './ImageDisplay.css';
import LoadingIndicator from '../LoadingIndicator/LoadingIndicator';

// Example Python dictionary mapping object_id to RGB colors
const objectColors = {
  0: [200, 0, 0],
  1: [0, 200, 0],
  2: [0, 0, 200],
  3: [0, 200, 200],
  4: [200, 0, 200],
  5: [200, 200, 0],
  6: [12, 300, 123],
  7: [0, 0, 100],
  8: [0, 100, 0],
  9: [100, 0, 0],
  10: [0, 100, 100],
  11: [100, 0, 100],
  12: [100, 100, 0],
  13: [1, 10, 100],
  14: [0, 0, 50],
  15: [0, 50, 0],
  16: [50, 0, 0],
  17: [0, 50, 50],
  18: [50, 0, 50],
  19: [50, 50, 0],
  20: [50, 50, 50],
  21: [0, 0, 25],
  22: [0, 25, 0],
  23: [25, 0, 0],
  24: [0, 25, 25],
  25: [25, 0, 25],
  26: [25, 25, 0],
  27: [169, 169, 169],
  28: [25, 25, 25],
};

const lightenColor = (rgb) => {
  const factor = 0.4;
  return rgb.map(value => Math.min(Math.round(value + (255 - value) * factor), 255));
};

const ImageDisplay = ({ imageData, onSelectObject, isProcessing }) => {
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [hoveredObjectId, setHoveredObjectId] = useState(null);
  const [maskCoords, setMaskCoords] = useState({});
  const imageRef = useRef();

  useEffect(() => {
    setSelectedObjectId(null);
    const newMaskCoords = {};
    imageData.objects.forEach((object, index) => {
      calculateMaskCoords(object.mask_coords, object.object_id);
    });
    setMaskCoords(newMaskCoords);
  }, [imageData]);

  const handleSelectObject = (obj) => {
    setSelectedObjectId(obj ? obj.object_id : null);
    onSelectObject(obj);
  };

  const calculateMaskCoords = (maskCoords, objectId) => {
    const image = new Image();
    image.crossOrigin = "anonymous"; // Enable CORS
    image.src = imageData.composite_image_url;

    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Set canvas dimensions to match the original image
      canvas.width = image.width;
      canvas.height = image.height;

      ctx.drawImage(image, 0, 0);

      // Scale maskCoords to fit the image dimensions
      const scaleX = canvas.width / maskCoords[0].length;
      const scaleY = canvas.height / maskCoords.length;

      const scaledMaskCoords = [];

      for (let y = 0; y < maskCoords.length; y++) {
        const scaledRow = [];
        for (let x = 0; x < maskCoords[y].length; x++) {
          if (maskCoords[y][x] === 1) {
            // Store the scaled coordinates
            scaledRow.push(1);
          } else {
            scaledRow.push(0);
          }
        }
        scaledMaskCoords.push(scaledRow);
      }

      setMaskCoords(prev => ({ ...prev, [objectId]: scaledMaskCoords }));
    };
  };

  const handleImageClick = (e) => {
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const [objectId, coords] of Object.entries(maskCoords)) {
      const scaleX = imageRef.current.width / coords[0].length;
      const scaleY = imageRef.current.height / coords.length;

      const maskX = Math.floor(x / scaleX);
      const maskY = Math.floor(y / scaleY);

      if (coords[maskY] && coords[maskY][maskX] === 1) {
        const obj = imageData.objects.find(o => o.object_id === parseInt(objectId));
        handleSelectObject(obj);
        return;
      }
    }
  };

  const handleImageMouseMove = (e) => {
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const [objectId, coords] of Object.entries(maskCoords)) {
      const scaleX = imageRef.current.width / coords[0].length;
      const scaleY = imageRef.current.height / coords.length;

      const maskX = Math.floor(x / scaleX);
      const maskY = Math.floor(y / scaleY);

      if (coords[maskY] && coords[maskY][maskX] === 1) {
        imageRef.current.style.cursor = 'pointer';
        setHoveredObjectId(imageData.objects.find(o => o.object_id === parseInt(objectId)).object_id);
        return;
      }
    }
    imageRef.current.style.cursor = 'default';
    setHoveredObjectId(null);
  };

  const handleButtonMouseEnter = (objectId) => {
    setHoveredObjectId(objectId);
  };

  const handleButtonMouseLeave = () => {
    setHoveredObjectId(null);
  };

  const getCurrentImageSrc = () => {
    if (hoveredObjectId != null) {
      return imageData.objects.find(obj => obj.object_id === hoveredObjectId).colored_mask_path;
    } else if (selectedObjectId != null) {
      return imageData.objects.find(obj => obj.object_id === selectedObjectId).colored_mask_path;
    } else {
      return imageData.composite_image_url;
    }
  };

  const getButtonColor = (objectId) => {
    const rgb = lightenColor(objectColors[objectId]);
    return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  };

  return (
    <div className="image-display-container">
        <img
          ref={imageRef}
          src={getCurrentImageSrc()}
          alt="Composite or Selected Object"
          onClick={handleImageClick}
          onMouseMove={handleImageMouseMove}
        />

      <div className="buttons">
        {imageData.objects.map(obj => (
          <button
            key={obj.object_id}
            className={`button ${selectedObjectId === obj.object_id ? 'selected' : ''}`}
            onClick={() => handleSelectObject(obj)}
            onMouseEnter={() => handleButtonMouseEnter(obj.object_id)}
            onMouseLeave={handleButtonMouseLeave}
            style={{ backgroundColor: getButtonColor(obj.object_id) }}
          >
            {obj.object_type}
          </button>
        ))}
        <button
          className={`button ${selectedObjectId == null ? 'selected' : ''}`}
          onClick={() => handleSelectObject(null)}
          onMouseEnter={() => handleButtonMouseEnter(null)}
          onMouseLeave={handleButtonMouseLeave}
          style={{ backgroundColor: getButtonColor(28), color: 'black' }}
        >
          Select All
        </button>
      </div>
    </div>
  );
};

export default ImageDisplay;
