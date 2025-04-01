// frontend/src/services/mapPostIntegration.js

/**
 * This service connects the map pin functionality with the post creation system
 */

// Import your API service or axios if you have it configured
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Configure axios with auth token interceptor
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add auth token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

/**
 * Creates a post from a map pin
 * @param {Object} pinData - Data from the map pin
 * @param {string} pinData.name - Name of the location
 * @param {number} pinData.lat - Latitude
 * @param {number} pinData.lng - Longitude
 * @param {string} pinData.datetime - ISO datetime string
 * @param {Object} pinData.weather - Weather data object
 * @param {string} imageUrl - URL to the image for the post
 * @param {string} species - Optional species information
 * @param {string} bait - Optional bait information
 * @param {string} waterType - Optional water type
 * @returns {Promise} - Promise resolving to the created post
 */
export const createPostFromPin = async (pinData, imageUrl, species = '', bait = '', waterType = '') => {
  try {
    // Format the data according to your Post schema requirements
    const postData = {
      imageUrl: imageUrl, 
      dateCaught: new Date(pinData.datetime).toISOString(),
      location: {
        lat: pinData.lat,
        lng: pinData.lng
      },
      species: species,
      bait: bait,
      waterType: waterType,
      // Weather data can be added to a notes field or custom field if needed
      weatherData: pinData.weather
    };

    // Send the post creation request
    const response = await api.post('/posts', postData);
    return response.data;
  } catch (error) {
    console.error('Error creating post from pin:', error);
    throw error;
  }
};

/**
 * Gets posts for a specific area on the map
 * @param {number} lat - Center latitude
 * @param {number} lng - Center longitude
 * @param {number} radius - Search radius in miles
 * @returns {Promise} - Promise resolving to posts in the area
 */
export const getPostsInArea = async (lat, lng, radius = 10) => {
  try {
    // This endpoint would need to be implemented on the backend
    const response = await api.get('/posts/area', {
      params: { lat, lng, radius }
    });
    return response.data.posts;
  } catch (error) {
    console.error('Error fetching posts in area:', error);
    throw error;
  }
};

/**
 * Converts posts to map pins format
 * @param {Array} posts - Array of post objects
 * @returns {Array} - Array of pin objects formatted for the map
 */
export const convertPostsToPins = (posts) => {
  return posts.map(post => ({
    name: post.species || 'Fishing spot',
    lat: post.location.lat,
    lng: post.location.lng,
    datetime: post.dateCaught,
    weather: post.weatherData || null,
    postId: post._id // Link back to the original post
  }));
};

export default {
  createPostFromPin,
  getPostsInArea,
  convertPostsToPins
};