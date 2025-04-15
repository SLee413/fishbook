import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [bait, setBait] = useState('');
  const [waterType, setWaterType] = useState('');

  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [selectedLatLng, setSelectedLatLng] = useState(null);

  const navigate = useNavigate();

  if (!localStorage.getItem("token")) {
    navigate('/login');
  }

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

  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => mapRef.current.invalidateSize(), 200);
    }
  }, []);

  async function fetchWeather(lat, lng, datetime) {
    const hour = parseInt(datetime.split("T")[1].split(":")[0]);
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation,weathercode,windspeed_10m&temperature_unit=fahrenheit&precipitation_unit=inch&windspeed_unit=mph&timezone=America%2FNew_York`;
    try {
      const res = await fetch(url);
      const data = await res.json();
      return {
        temperature: data.hourly.temperature_2m?.[hour] ?? null,
        precipitation: data.hourly.precipitation?.[hour] ?? null,
        windspeed: data.hourly.windspeed_10m?.[hour] ?? null,
        weathercode: data.hourly.weathercode?.[hour] ?? null,
      };
    } catch (err) {
      console.error("❌ Failed to fetch weather:", err);
      return { temperature: null, precipitation: null, windspeed: null, weathercode: null };
    }
  }

  async function fetchMoonPhase(dateStr) {
    const timestamp = Math.floor(new Date(dateStr).getTime() / 1000);
    try {
      const res = await fetch(`https://api.farmsense.net/v1/moonphases/?d=${timestamp}`);
      const data = await res.json();
      return data?.[0]?.Phase ?? null;
    } catch (err) {
      console.error("🌑 Failed to fetch moon phase:", err);
      return null;
    }
  }

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLatLng) {
      alert("Please select a pin location on the map.");
      return;
    }

    const dateCaught = new Date();
    const dateStr = dateCaught.toISOString().split("T")[0];
    const weather = await fetchWeather(selectedLatLng.lat, selectedLatLng.lng, dateCaught.toISOString());
    const moonPhase = await fetchMoonPhase(dateStr);

    const postData = {
      imageUrl: "https://example.com/fakeimg.jpg",
      dateCaught: dateCaught.toISOString(),
      location: { lat: selectedLatLng.lat, lng: selectedLatLng.lng },
      species: fishType,
      bait: bait || null,             
      waterType: waterType || null,
      description,
      weight: weight || null,
      length: length || null,
      weather,
      moonPhase
    };

    console.log("📤 Sending postData to /posts:", postData);

    const res = await fetch('/api/posts/', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization' : `Bearer ${localStorage.getItem("token")}` 
      },
      body: JSON.stringify(postData)
    });

    if (res.ok) {
      alert("Post created!");
    } else {
      alert("Error creating post.");
    }
  };

  return (
    <main style={{ display: 'flex', flexDirection: 'column', height: '100vh', padding: '20px' }}>
      <h2>Create a Post</h2>
      <div
        style={{
        display: 'flex',
        flex: 1,
        gap: '20px',
        minHeight: 0,
        overflow: 'hidden',
        }}
>

<form
  onSubmit={handlePostSubmit}
  style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    width: '350px',         
    flexShrink: 0,          
    flexGrow: 0,           
    paddingRight: '20px',
  }}
>


  <div>
    <label style={{ fontWeight: 'bold' }}>Fish Type:</label>
    <input
      type="text"
      value={fishType}
      onChange={(e) => setFishType(e.target.value)}
      placeholder="e.g., Bass, Trout"
      style={{ padding: '10px', fontSize: '16px', width: '100%' }}
    />

  </div>

  <div>
    <label style={{ fontWeight: 'bold' }}>Description:</label>
    <textarea
      value={description}
      onChange={(e) => setDescription(e.target.value)}
      placeholder="Write your post description..."
      rows={4}
      style={{
        width: '100%',
        padding: '10px',
        fontSize: '15px',
        borderRadius: '6px',
        border: '1px solid #ccc'
      }}
      required
    />
  </div>

  <div>
    <label style={{ fontWeight: 'bold' }}>Bait:</label>
    <input
      type="text"
      value={bait}
      onChange={(e) => setBait(e.target.value)}
      placeholder="e.g., worms, lures"
      style={{
        width: '100%',
        padding: '10px',
        fontSize: '15px',
        borderRadius: '6px',
        border: '1px solid #ccc'
      }}
    />
  </div>

  <div>
    <label style={{ fontWeight: 'bold' }}>Water Type:</label>
    <select
      value={waterType}
      onChange={(e) => setWaterType(e.target.value)}
      style={{
        width: '100%',
        padding: '10px',
        fontSize: '15px',
        borderRadius: '6px',
        border: '1px solid #ccc'
      }}
    >
      <option value="">Select type</option>
      <option value="Fresh">Freshwater</option>
      <option value="Salt">Saltwater</option>
    </select>
  </div>

  <div>
    <label style={{ fontWeight: 'bold' }}>Weight:</label>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <input
        type="text"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        placeholder="e.g., 3.5"
        style={{
          flex: 1,
          padding: '10px',
          fontSize: '15px',
          borderRadius: '6px',
          border: '1px solid #ccc'
        }}
      />
      <span style={{ marginLeft: '8px' }}>lbs</span>
    </div>
  </div>

  <div>
    <label style={{ fontWeight: 'bold' }}>Length:</label>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <input
        type="text"
        value={length}
        onChange={(e) => setLength(e.target.value)}
        placeholder="e.g., 18"
        style={{
          flex: 1,
          padding: '10px',
          fontSize: '15px',
          borderRadius: '6px',
          border: '1px solid #ccc'
        }}
      />
      <span style={{ marginLeft: '8px' }}>in</span>
    </div>
  </div>

  <button
    type="submit"
    style={{
      padding: '12px',
      fontSize: '16px',
      backgroundColor: '#0077cc',
      color: '#fff',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      marginTop: '10px'
    }}
  >
    Post
  </button>
</form>


        <div id="map" style={{ height: '100%', flex: 2, minWidth: '400px', borderRadius: '8px' }}></div>
      </div>
    </main>
  );
};

export default CreatePost;
