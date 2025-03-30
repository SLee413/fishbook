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
  const { name, lat, lng } = req.body;
  const location = new Location({ name, lat, lng });
  await location.save();
  res.json(location);
});

app.get('/api/locations', async (req, res) => {
  const locations = await Location.find();
  res.json(locations);
});

app.listen(3000, () => console.log('Server running on port 3000'));