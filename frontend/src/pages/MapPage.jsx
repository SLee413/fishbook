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
                  🎣 <strong>Angler:</strong> ${post.authorName || "Unknown"}<br/>
                  🐟 <strong>Fish Type:</strong> ${post.species || "Unknown Fish"}<br/>
                  📝 <strong>Description:</strong> ${post.description || "No description"}<br/>
                  ${post.bait ? `🪱 <strong>Bait:</strong> ${post.bait}<br/>` : ""}
                  ${post.waterType ? `💧 <strong>Water:</strong> ${post.waterType}<br/>` : ""}
                  ${post.weight ? `⚖️ <strong>Weight:</strong> ${post.weight}<br/>` : ""}
                  ${post.length ? `📏 <strong>Length:</strong> ${post.length}<br/>` : ""}
                  🕒 <strong>Caught:</strong> ${new Date(post.dateCaught).toLocaleString()} ${getWeatherIcon(weather.weathercode)}<br/>
                  ${post.moonPhase ? `🌙 <strong>Moon:</strong> ${post.moonPhase}<br/>` : ""}
                  🌡️ <strong>Temp:</strong> ${weather.temperature ?? "?"}°F<br/>
                  💧 <strong>Precip:</strong> ${weather.precipitation ?? "?"} in<br/>
                  🌬️ <strong>Wind:</strong> ${weather.windspeed ?? "?"} mph<br/>
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
