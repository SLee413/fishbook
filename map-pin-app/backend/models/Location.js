const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema({
  name: String,
  lat: Number,
  lng: Number,
  datetime: String,
  weather: {
    temperature: Number,
    precipitation: Number,
    windspeed: Number,  
    weathercode: Number   
  }
});


module.exports = mongoose.model('Location', LocationSchema);
