import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';



function getWeatherIcon(code) {
  const icons = {
    0: "☀️",      // Clear sky
    1: "🌤️",     // Mainly clear
    2: "⛅",      // Partly cloudy
    3: "☁️",      // Overcast
    45: "🌫️",     // Fog
    48: "🌫️",     // Depositing rime fog
    51: "🌦️",     // Drizzle: Light
    61: "🌧️",     // Rain: Slight
    71: "❄️",     // Snow fall: Slight
    80: "🌦️",     // Rain showers: Slight
    95: "⛈️",     // Thunderstorm: Slight/moderate
    99: "⛈️",     // Thunderstorm with hail
  };

  return icons[code] || "❓";
}




const MapPage = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map').setView([40.0583, -74.4057], 8);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      // 🐟 Fetch pins from the backend
      fetch('/api/posts')
        .then((res) => res.json())
        .then((data) => {
          data.posts.forEach((post) => {
            if (post.location?.lat && post.location?.lng) {
              const weather = post.weather || {};

              const popupContent = `
                <strong>${post.species || "Unknown Fish"}</strong><br/>
                ${post.description || ""}<br/>
                ${getWeatherIcon(post.weather?.weathercode)}<br/>
                🕒 ${new Date(post.dateCaught).toLocaleString()}<br>
                🌡️ Temp: ${weather.temperature ?? "?"}°F<br/>
                💧 Precip: ${weather.precipitation ?? "?"} in<br/>
                🌬️ Wind: ${weather.windspeed ?? "?"} mph<br/>
              `;

              L.marker([post.location.lat, post.location.lng])
                .addTo(map)
                .bindPopup(popupContent);
            }
          });
        })
        .catch((err) => console.error("Failed to load pins:", err));
    }
  }, []);

  return <div id="map" style={{ height: '100vh', width: '100%' }}></div>;
};

export default MapPage;
