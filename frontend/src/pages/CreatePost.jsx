import React, { useState, useRef, useEffect } from 'react';

import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

import L from 'leaflet';

// Fix Leaflet's default icon path
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


const CreatePost = () => {
  const [description, setDescription] = useState('');
  const [fishType, setFishType] = useState('');
  const [weight, setWeight] = useState('');
  const [length, setLength] = useState('');
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [selectedLatLng, setSelectedLatLng] = useState(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map').setView([40.0583, -74.4057], 8);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        setSelectedLatLng({ lat, lng });

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        }
      });

      mapRef.current = map;
    }
  }, []);

  // Force tile redraw once map is mounted
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize();
      }, 200);
    }
  }, []);

  async function fetchWeather(lat, lng, datetime) {
    const [date, time] = datetime.split("T");
    const hour = parseInt(time.split(":")[0]);

    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${date}&end_date=${date}&hourly=temperature_2m,precipitation,weathercode,windspeed_10m&temperature_unit=fahrenheit&precipitation_unit=inch&windspeed_unit=mph&timezone=America%2FNew_York`;
    const res = await fetch(url);
    const data = await res.json();

    return {
      temperature: data.hourly.temperature_2m[hour],
      precipitation: data.hourly.precipitation[hour],
      windspeed: data.hourly.windspeed_10m[hour],
      weathercode: data.hourly.weathercode[hour],
    };
  }

  const handlePostSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLatLng) {
      alert("Please select a pin location on the map.");
      return;
    }

    const datetime = new Date().toISOString();
    const weather = await fetchWeather(selectedLatLng.lat, selectedLatLng.lng, datetime);

    const postData = {
      imageUrl: "https://example.com/fakeimg.jpg",
      dateCaught: datetime,
      location: {
        lat: selectedLatLng.lat,
        lng: selectedLatLng.lng
      },
      species: fishType,
      bait: "worms",
      waterType: "fresh",
      description,
      weight: weight || null,
      length: length || null,
      weather
    };
    
  
    console.log("📤 Sending postData to /from-map:", postData);

    const res = await fetch('/api/posts/from-map', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(postData)
    });
    

    if (res.ok) {
      alert("Post created!");
    } else {
      alert("Error creating post.");
    }
  };

  return (
    <main
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        padding: '20px',
        boxSizing: 'border-box',
      }}
    >
      <h2>Create a Post</h2>
  
      <div
        style={{
          display: 'flex',
          flex: 1,
          gap: '20px',
          overflow: 'hidden',
        }}
      >
        {/* Form Section */}
        <form
          onSubmit={handlePostSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            maxWidth: '400px',
            flex: 1,
            overflowY: 'auto',
          }}
        >
          <label>
            Description:
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write your post description..."
              rows={5}
              style={{ padding: '10px', fontSize: '16px' }}
              required
            />
          </label>
  
          <label>
            Fish Type:
            <input
              type="text"
              value={fishType}
              onChange={(e) => setFishType(e.target.value)}
              placeholder="e.g., Bass, Trout"
              style={{ padding: '10px', fontSize: '16px' }}
              required
            />
          </label>
  
          <label>
            Weight (optional):
            <input
              type="text"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g., 3.5 lbs"
              style={{ padding: '10px', fontSize: '16px' }}
            />
          </label>
  
          <label>
            Length (optional):
            <input
              type="text"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="e.g., 18 inches"
              style={{ padding: '10px', fontSize: '16px' }}
            />
          </label>
  
          <button type="submit" style={{ padding: '10px', fontSize: '16px', cursor: 'pointer' }}>
            Post
          </button>
        </form>
  
        {/* Map Section */}
        <div
          id="map"
          style={{
            height: '100%',
            flex: 2,
            minWidth: '400px',
            borderRadius: '8px',
          }}
        ></div>
      </div>
    </main>
  );
  
  
};

export default CreatePost;
