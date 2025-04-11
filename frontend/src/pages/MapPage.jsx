import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function getWeatherIcon(code) {
  const icons = {
    0: "☀️", 1: "🌤️", 2: "⛅", 3: "☁️", 45: "🌫️", 48: "🌫️",
    51: "🌦️", 61: "🌧️", 71: "❄️", 80: "🌦️", 95: "⛈️", 99: "⛈️"
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

      fetch('/api/posts')
        .then((res) => res.json())
        .then((data) => {
          console.log("🎣 Posts fetched from API:", data);
          data.posts.forEach((post) => {
            if (
              post.location &&
              typeof post.location.lat === "number" &&
              typeof post.location.lng === "number"
            ) {
              const weather = post.weather || {};

              const popupContent = `
                <strong>${post.species || "Unknown Fish"}</strong><br/>
                ${getWeatherIcon(weather.weathercode)}<br/>
                🎣 <strong>Angler:</strong> ${post.authorName || "Unknown"}<br/>
                📝 ${post.description || ""}<br/>
                ${post.weight ? `⚖️ Weight: ${post.weight}<br/>` : ""}
                ${post.length ? `📏 Length: ${post.length}<br/>` : ""}
                ${post.bait ? `🪱 Bait: ${post.bait}<br/>` : ""}
                ${post.waterType ? `💧 Water: ${post.waterType}<br/>` : ""}
                ${post.moonPhase ? `🌙 Moon: ${post.moonPhase}<br/>` : ""}
                🕒 ${new Date(post.dateCaught).toLocaleString()}<br/>
                🌡️ Temp: ${weather.temperature ?? "?"}°F<br/>
                💧 Precip: ${weather.precipitation ?? "?"} in<br/>
                🌬️ Wind: ${weather.windspeed ?? "?"} mph<br/>
              `;

              console.log("📍 Adding marker for post:", post);

              L.marker([post.location.lat, post.location.lng])
                .addTo(map)
                .bindPopup(popupContent);
            } else {
              console.warn("⚠️ Invalid location for post:", post);
            }
          });
        })
        .catch((err) => console.error("❌ Failed to load pins:", err));
    }
  }, []);

  return <div id="map" style={{ height: '100vh', width: '100%' }}></div>;
};

export default MapPage;
