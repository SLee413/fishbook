import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import L from 'leaflet';


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
  const [weightUnit, setWeightUnit] = useState('lbs');
  const [length, setLength] = useState('');
  const [lengthUnit, setLengthUnit] = useState('in');
  const [bait, setBait] = useState('');
  const [waterType, setWaterType] = useState('');
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewUrl(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  async function uploadImage() {
    if (!selectedFile) return null;
    const formData = new FormData();
    formData.append('profilePicture', selectedFile);

    const token = localStorage.getItem("token");

    const res = await fetch('/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      return data.filePath;
    } else {
      console.error('Failed to upload image');
      return null;
    }
  }

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

  const buildCaughtDate = () => {
    if (!month || !day || !year) return null;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T00:00:00`;
  };

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLatLng) {
      alert("Please select a pin location on the map.");
      return;
    }
    if (!month || !day || !year) {
      alert("Please select month, day, and year for Date Caught.");
      return;
    }

    let imageUrl = "https://example.com/fakeimg.jpg";
    if (selectedFile) {
      const uploadedPath = await uploadImage();
      if (uploadedPath) {
        imageUrl = uploadedPath;
      }
    }

    const caughtDateStr = buildCaughtDate();
    const weather = await fetchWeather(selectedLatLng.lat, selectedLatLng.lng, caughtDateStr);
    const moonPhase = await fetchMoonPhase(caughtDateStr);

    const postData = {
      imageUrl,
      dateCaught: caughtDateStr,
      location: { lat: selectedLatLng.lat, lng: selectedLatLng.lng },
      species: fishType,
      bait: bait || null,
      waterType: waterType || null,
      description,
      weight: weight || null,
      weightUnit: weightUnit || "lbs",
      length: length || null,
      lengthUnit: lengthUnit || "in",
      weather,
      moonPhase
    };

    console.log("📤 Sending postData to /posts:", postData);

    const res = await fetch('/api/posts/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify(postData)
    });

    if (res.ok) {
      alert("Post created!");
      navigate('/');
    } else {
      alert("Error creating post.");
    }
  };

  return (
    <main style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '20px', overflowY: 'auto' }}>
      <h2>Create a Post</h2>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '20px',
        minHeight: 0,
      }}>
        <form onSubmit={handlePostSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          width: '400px',
          flexShrink: 0,
          flexGrow: 0,
        }}>
          {/* Upload Image */}
          <div>
          <label style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Upload Image:</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ padding: '5px', fontSize: '15px' }}
            />
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                style={{
                  marginTop: '10px',
                  width: '100%',
                  aspectRatio: '1/1',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  border: '1px solid #ccc'
                }}
              />
            )}
          </div>

          {/* Date Caught */}
          <div>
            <label style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Date Caught:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ flex: 1 }}>
                <option value="">Month</option>
                {[...Array(12)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <select value={day} onChange={(e) => setDay(e.target.value)} style={{ flex: 1 }}>
                <option value="">Day</option>
                {[...Array(31)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>{i + 1}</option>
                ))}
              </select>
              <select value={year} onChange={(e) => setYear(e.target.value)} style={{ flex: 1 }}>
                <option value="">Year</option>
                {Array.from({ length: 76 }, (_, i) => 1950 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fish Type */}
          <div>
            <label style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Fish Type:</label>
            <input
              type="text"
              value={fishType}
              onChange={(e) => setFishType(e.target.value)}
              placeholder="e.g., Bass, Trout"
              style={{ width: '100%' }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Description:</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write your post description..."
              rows={3}
              style={{ width: '100%' }}
            />
          </div>

          {/* Bait */}
          <div>
            <label style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Bait:</label>
            <input
              type="text"
              value={bait}
              onChange={(e) => setBait(e.target.value)}
              placeholder="e.g., worms, lures"
              style={{ width: '100%' }}
            />
          </div>

          {/* Water Type */}
          <div>
            <label style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Water Type:</label>
            <select
              value={waterType}
              onChange={(e) => setWaterType(e.target.value)}
              style={{ width: '100%' }}
            >
              <option value="">Select type</option>
              <option value="Fresh">Freshwater</option>
              <option value="Salt">Saltwater</option>
            </select>
          </div>

          {/* Weight */}
          <div>
            <label style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Weight:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                style={{ flex: 1 }}
              />
              <select
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>

          {/* Length */}
          <div>
            <label style={{ fontWeight: 'bold', color: '#1e3a8a' }}>Length:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                style={{ flex: 1 }}
              />
              <select
                value={lengthUnit}
                onChange={(e) => setLengthUnit(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="in">in</option>
                <option value="cm">cm</option>
              </select>
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" style={{
            padding: '12px',
            fontSize: '16px',
            backgroundColor: '#0077cc',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            Post
          </button>
        </form>

        <div id="map" style={{
          height: '600px',
          flex: 2,
          minWidth: '400px',
          borderRadius: '8px',
          overflow: 'hidden'
        }}></div>
      </div>
    </main>
  );
};

export default CreatePost;
