const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  datetime: { type: String, default: null },
  weather: {
    temperature: { type: Number, default: null },
    precipitation: { type: Number, default: null },
    weathercode: { type: Number, default: null }
  }
});

module.exports = mongoose.model('Location', LocationSchema);
