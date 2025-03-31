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

app.listen(3000, () => console.log('Server running on port 3000'));