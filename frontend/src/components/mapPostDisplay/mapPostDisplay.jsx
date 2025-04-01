// frontend/src/components/MapPostsDisplay/MapPostsDisplay.jsx
import React, { useState, useEffect } from 'react';
import { getPostsInArea, convertPostsToPins } from '../../services/mapPostIntegration';
import './MapPostsDisplay.css';

/**
 * Component that displays posts in the current map view
 * This sits alongside the map to show posts in a list format
 */
const MapPostsDisplay = ({ mapCenter, mapRadius }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch posts whenever the map center or radius changes
  useEffect(() => {
    if (!mapCenter) return;

    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get posts in the map area
        const { lat, lng } = mapCenter;
        const radius = mapRadius || 10; // Default 10 miles
        const postsData = await getPostsInArea(lat, lng, radius);
        
        setPosts(postsData);
      } catch (err) {
        console.error('Error fetching posts for map:', err);
        setError('Failed to load posts for this area');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [mapCenter, mapRadius]);

  // Handle clicking "View on Map" - this requires communication with the map
  const handleViewOnMap = (location) => {
    // This could dispatch an event or use a callback prop
    // to pan the map to this location
    if (window.map) {
      window.map.panTo([location.lat, location.lng]);
      window.map.setZoom(15); // Zoom in
    }
  };

  if (loading) {
    return <div className="map-posts-loading">Loading posts in this area...</div>;
  }

  if (error) {
    return <div className="map-posts-error">{error}</div>;
  }

  return (
    <div className="map-posts-display">
      <h3>Posts in This Area</h3>
      
      {posts.length === 0 ? (
        <p className="no-posts-message">No posts found in this area. Create one by clicking on the map!</p>
      ) : (
        <div className="posts-list">
          {posts.map(post => (
            <div key={post._id} className="post-card">
              <div className="post-header">
                <span className="post-species">{post.species || 'Fishing spot'}</span>
                <span className="post-date">{new Date(post.dateCaught).toLocaleDateString()}</span>
              </div>
              
              {post.imageUrl && (
                <div className="post-image">
                  <img src={post.imageUrl} alt={post.species || 'Fishing spot'} />
                </div>
              )}
              
              <div className="post-info">
                {post.waterType && (
                  <span className="post-water-type">{post.waterType}</span>
                )}
                {post.bait && (
                  <span className="post-bait">Bait: {post.bait}</span>
                )}
              </div>
              
              <div className="post-actions">
                <button 
                  className="view-on-map-btn"
                  onClick={() => handleViewOnMap(post.location)}
                >
                  View on Map
                </button>
                <a 
                  href={`/post/${post._id}`} 
                  className="view-post-btn"
                >
                  Details
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MapPostsDisplay;