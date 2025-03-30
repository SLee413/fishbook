const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  name: String,
  lat: Number,
  lng: Number,
  datetime: String,
  weather: {
    temperature: Number,
    precipitation: Number
  }
});

module.exports = mongoose.model('Location', locationSchema);
