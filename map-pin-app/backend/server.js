const express = require('express');
const mongoose = require('mongoose');
const Location = require('./models/Location');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

console.log("Connecting to MongoDB URI:", process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI);

// Import locations routes
const locationsRoutes = require('./routes/locations');

// Use the locations routes for /api/locations
app.use('/api/locations', locationsRoutes);

// Fallback/legacy direct routes - these can be removed once you've fully migrated to the locationsRoutes
app.post('/api/locations', async (req, res) => {
  console.log("📩 Received request:", req.body); // See what frontend sends

  try {
    const { name, lat, lng, datetime, weather } = req.body;

    const location = new Location({
      name,
      lat,
      lng,
      datetime: datetime || null,
      weather: weather || null
    });

    const saved = await location.save();
    console.log("✅ Location saved:", saved);
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Error saving location:", err);
    res.status(500).json({ error: "Failed to save location" });
  }
});

app.get('/api/locations', async (req, res) => {
  const locations = await Location.find();
  res.json(locations);
});

// Calculate distance between two points using the Haversine formula
// This can be moved to a utility file if needed elsewhere
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

app.listen(3000, () => console.log('Server running on port 3000'));

