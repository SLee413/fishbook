import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './MapPage.css';
import L from 'leaflet';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function MapController({ onMapReady, onPinCreate }) {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      onMapReady(map);
      // Add click handler
      map.on('click', function(e) {
        const { lat, lng } = e.latlng;
        onPinCreate(lat, lng);
      });
    }
  }, [map, onMapReady, onPinCreate]);

  return null;
}

const MapPage = () => {
  const defaultPosition = [40.0583, -74.4057]; // New Jersey coordinates
  const [markers, setMarkers] = useState([]);

  const handleMapReady = (map) => {
    // Load existing pins
    fetch('http://localhost:3000/api/locations')
      .then(res => res.json())
      .then(locations => {
        setMarkers(locations);
      });
  };

  const handlePinCreation = async (lat, lng) => {
    const name = prompt("Enter a name for this location:");
    if (!name) return;

    const now = new Date().toISOString();
    const weather = await getLiveWeather(lat, lng);

    const newPin = {
      name,
      lat,
      lng,
      datetime: now,
      weather
    };

    // Save to backend
    const response = await fetch('http://localhost:3000/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newPin)
    });

    if (response.ok) {
      const savedPin = await response.json();
      setMarkers(prev => [...prev, savedPin]);
    }
  };

  return (
    <div className="map-page">
      <div className="map-container">
        <MapContainer 
          center={defaultPosition} 
          zoom={8} 
          style={{ height: "100%", width: "100%" }}
        >
          <MapController 
            onMapReady={handleMapReady} 
            onPinCreate={handlePinCreation}
          />
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {markers.map((marker, i) => (
            <Marker key={i} position={[marker.lat, marker.lng]}>
              <Popup>
                <strong>{marker.name}</strong><br />
                {marker.weather && (
                  <>
                    🌡️ {marker.weather.temperature}°F<br />
                    🌧️ {marker.weather.precipitation}" rain<br />
                    💨 {marker.weather.windspeed} mph
                  </>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

// Helper function to get weather data
async function getLiveWeather(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation,weathercode,windspeed_10m&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=America%2FNew_York`;

  const res = await fetch(url);
  const data = await res.json();
  const currentHour = new Date().getHours();

  return {
    temperature: data.hourly.temperature_2m[currentHour],
    windspeed: data.hourly.windspeed_10m[currentHour],
    weathercode: data.hourly.weathercode[currentHour],
    precipitation: data.hourly.precipitation[currentHour]
  };
}

export default MapPage;
