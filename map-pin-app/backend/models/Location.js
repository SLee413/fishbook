// map-pin-app/backend/models/Location.js
const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  lat: {
    type: Number,
    required: true
  },
  lng: {
    type: Number,
    required: true
  },
  datetime: {
    type: String,
    required: true
  },
  weather: {
    temperature: Number,
    precipitation: Number,
    windspeed: Number,  
    weathercode: Number   
  },
  // Add post reference
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    default: null
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Add a 2dsphere index for geographic queries
LocationSchema.index({ lat: 1, lng: 1 });

module.exports = mongoose.model('Location', LocationSchema);