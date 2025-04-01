// routes/locations.js
const express = require('express');
const router = express.Router();
const Location = require('../models/Location');

/**
 * Get all locations
 * 
 * @route GET /api/locations
 * @returns {Array} Array of all locations
 */
router.get('/', async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });
    res.json(locations);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Get a specific location by ID
 * 
 * @route GET /api/locations/:id
 * @param {string} id - The ID of the location
 * @returns {Object} Location object
 */
router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findById(req.params.id);
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    res.json(location);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Create a new location
 * 
 * @route POST /api/locations
 * @param {Object} req.body - Location data
 * @returns {Object} Created location object
 */
router.post('/', async (req, res) => {
  console.log("📩 Received request:", req.body); // See what frontend sends

  try {
    const { name, lat, lng, datetime, weather } = req.body;
    
    // Validate required fields
    if (!name || !lat || !lng) {
      return res.status(400).json({ message: 'Name, latitude, and longitude are required' });
    }
    
    // Create new location
    const newLocation = new Location({
      name,
      lat,
      lng,
      datetime: datetime || null,
      weather: weather || null
    });
    
    const savedLocation = await newLocation.save();
    console.log("✅ Location saved:", savedLocation);
    res.status(201).json(savedLocation);
  } catch (error) {
    console.error("❌ Error saving location:", error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Updates a location
 * 
 * @route PUT /api/locations/:id
 * @param {string} id - The ID of the location
 * @param {Object} req.body - Updated location data
 * @returns {Object} Updated location object
 */
router.put('/:id', async (req, res) => {
  try {
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    res.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Updates a pin to link it to a post
 * 
 * @route PATCH /api/locations/:id
 * @param {string} id - The ID of the location
 * @body {string} postId - The ID of the post to link to
 * @returns {Object} Updated location object
 */
router.patch('/:id', async (req, res) => {
  try {
    const { postId } = req.body;
    
    if (!postId) {
      return res.status(400).json({ message: 'postId is required' });
    }
    
    const location = await Location.findByIdAndUpdate(
      req.params.id,
      { postId: postId },
      { new: true }
    );
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    res.json(location);
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Deletes a location
 * 
 * @route DELETE /api/locations/:id
 * @param {string} id - The ID of the location to delete
 * @returns {Object} Success message
 */
router.delete('/:id', async (req, res) => {
  try {
    const location = await Location.findByIdAndDelete(req.params.id);
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Gets pins associated with posts in a geographic area
 * 
 * @route GET /api/locations/area
 * @query {number} lat - Center latitude
 * @query {number} lng - Center longitude
 * @query {number} radius - Search radius in miles (default: 10)
 * @returns {Array} Array of location objects in the specified area
 */
router.get('/area', async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ message: 'lat and lng are required' });
    }
    
    // Convert latitude and longitude from strings to numbers
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    
    // Calculate bounding box (approximate) for faster initial filtering
    // 1 degree latitude is approximately 69 miles
    // 1 degree longitude is approximately 55 miles at 40 degrees latitude
    const latRange = parseFloat(radius) / 69;
    const lngRange = parseFloat(radius) / (55 * Math.cos(latitude * Math.PI / 180));
    
    const locations = await Location.find({
      lat: { $gte: latitude - latRange, $lte: latitude + latRange },
      lng: { $gte: longitude - lngRange, $lte: longitude + lngRange }
    });
    
    // For more precise filtering, calculate actual distance for each point
    const filteredLocations = locations.filter(loc => {
      const distance = calculateDistance(
        latitude, longitude, 
        loc.lat, loc.lng
      );
      return distance <= radius;
    });
    
    res.json(filteredLocations);
  } catch (error) {
    console.error('Error fetching locations by area:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Calculate the distance between two points using the Haversine formula
 * 
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in miles
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance; // Distance in miles
}

module.exports = router;