import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadImage } from '../../services/api';
import './ImageUploader.css';

const ImageUploader = ({ onImageProcessed, setLoading }) => {
  // const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    // setIsProcessing(true);
    setLoading(true);
    const data = await uploadImage(file);
    if (data) {
      data.file_name = file.name;  // Add the file name to the data
      data.original_image_url = URL.createObjectURL(file); // Set the original image URL
      console.log("Uploaded image data:", data);
      onImageProcessed(data);
    } else {
      alert('Failed to process image.');
    }
    // setIsProcessing(false);
    setLoading(false);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div {...getRootProps({ className: 'dropzone' })}>
      <input {...getInputProps()} accept="image/*" />
      <p><b>Choose a file</b> or drag it here.</p>
      
    </div>
  );
};

export default ImageUploader;
