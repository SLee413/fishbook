import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const CreatePostMap = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return; // Prevent multiple initializations

    const map = L.map('map').setView([40.0583, -74.4057], 8);
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    // Example: Add a marker on click
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      const name = prompt("Enter location name:");
      if (!name) return;

      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(name)
        .openPopup();
    });
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <div id="map" style={{ height: '100%' }}></div>
    </div>
  );
};

export default CreatePostMap;
