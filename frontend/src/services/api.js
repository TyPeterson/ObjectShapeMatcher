// src/services/api.js

import axios from 'axios';

const apiUrl = 'http://localhost:5000/api';

export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
  try {
    const response = await axios.post(`${apiUrl}/images/process`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

export const compareObjects = async (maskCoords, categoryId, objectId, imageFileName, compareMethod) => {
  try {
    const response = await axios.post(`${apiUrl}/objects/compare`, {
      mask_coords: maskCoords,
      category_id: categoryId,
      object_id: objectId,
      image_file_name: imageFileName,
      compare_method: compareMethod
    });
    return response.data;
  } catch (error) {
    console.error('Error comparing objects:', error);
    return null;
  }
};

export const submitRankings = async (rankingsData) => {
  try {
    const response = await axios.post(`${apiUrl}/rankings/submit`, rankingsData);
    return response.data;
  } catch (error) {
    console.error('Error submitting rankings:', error);
    return null;
  }
};

export const getRankings = async () => {
  try {
    const response = await axios.get(`${apiUrl}/rankings/get`);
    return response.data;
  } catch (error) {
    console.error('Error getting rankings:', error);
    return null;
  }
};
