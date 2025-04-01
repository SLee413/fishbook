// frontend/src/components/PinToPost/PinToPost.jsx
import React, { useState } from 'react';
import { createPostFromPin } from '../../services/mapPostIntegration';
import './PinToPost.css';

const PinToPost = ({ pinData, onPostCreated, onCancel }) => {
  const [imageUrl, setImageUrl] = useState('');
  const [species, setSpecies] = useState('');
  const [bait, setBait] = useState('');
  const [waterType, setWaterType] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // Validate required fields
      if (!imageUrl) {
        throw new Error('Image URL is required');
      }

      // Create post from pin data
      const newPost = await createPostFromPin(
        pinData,
        imageUrl,
        species,
        bait,
        waterType
      );
      
      // Call the callback with new post data
      onPostCreated(newPost);
    } catch (err) {
      setError(err.message || 'Error creating post');
      console.error('Failed to create post:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Water type options
  const waterTypes = ['Lake', 'River', 'Ocean', 'Pond', 'Stream', 'Other'];

  return (
    <div className="pin-to-post-container">
      <h2>Create Post from Pin</h2>
      <div className="pin-details">
        <strong>{pinData.name}</strong>
        <p>
          <span>Location: {pinData.lat.toFixed(5)}, {pinData.lng.toFixed(5)}</span>
          <span>Date: {new Date(pinData.datetime).toLocaleDateString()}</span>
        </p>
        {pinData.weather && (
          <div className="weather-info">
            <p>Weather: {pinData.weather.temperature}°F, {pinData.weather.windspeed} mph</p>
            <p>Precipitation: {pinData.weather.precipitation}" rain</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="imageUrl">Image URL *</label>
          <input
            id="imageUrl"
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/my-fishing-image.jpg"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="species">Species</label>
          <input
            id="species"
            type="text"
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            placeholder="Bass, Trout, etc."
          />
        </div>

        <div className="form-group">
          <label htmlFor="bait">Bait/Lure</label>
          <input
            id="bait"
            type="text"
            value={bait}
            onChange={(e) => setBait(e.target.value)}
            placeholder="What did you use to catch it?"
          />
        </div>

        <div className="form-group">
          <label htmlFor="waterType">Water Type</label>
          <select
            id="waterType"
            value={waterType}
            onChange={(e) => setWaterType(e.target.value)}
          >
            <option value="">Select water type</option>
            {waterTypes.map(type => (
              <option key={type} value={type.toLowerCase()}>{type}</option>
            ))}
          </select>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button 
            type="button" 
            className="cancel-button" 
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-button" 
            disabled={isLoading}
          >
            {isLoading ? 'Creating Post...' : 'Create Post'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PinToPost;