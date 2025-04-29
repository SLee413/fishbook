import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

function getWeatherIcon(code) {
  const icons = {
    0: "☀️",    // Clear
    1: "🌤️",    // Mainly clear
    2: "⛅",     // Partly cloudy
    3: "☁️",     // Overcast
    45: "🌫️",   // Fog
    48: "🌫️",   // Depositing rime fog
    51: "🌦️",   // Light drizzle
    53: "🌦️",   // Moderate drizzle
    55: "🌧️",   // Dense drizzle
    56: "🌧️",   // Freezing drizzle (light)
    57: "🌧️",   // Freezing drizzle (dense)
    61: "🌧️",   // Slight rain
    63: "🌧️",   // Moderate rain
    65: "🌧️",   // Heavy rain
    66: "🌧️",   // Freezing rain (light)
    67: "🌧️",   // Freezing rain (heavy)
    71: "🌨️",   // Slight snow fall
    73: "🌨️",   // Moderate snow fall
    75: "❄️",   // Heavy snow fall
    77: "❄️",   // Snow grains
    80: "🌧️",   // Slight rain showers
    81: "🌧️",   // Moderate rain showers
    82: "🌧️",   // Violent rain showers
    85: "🌨️",   // Slight snow showers
    86: "🌨️",   // Heavy snow showers
    95: "⛈️",   // Thunderstorm
    96: "⛈️",   // Thunderstorm with slight hail
    99: "⛈️"    // Thunderstorm with heavy hail
  };
  return icons[code] || "❓";
}

const moonPhaseIcons = {
  "New Moon": "🌑",
  "Waxing Crescent": "🌒",
  "First Quarter": "🌓",
  "Waxing Gibbous": "🌔",
  "Full Moon": "🌕",
  "Waning Gibbous": "🌖",
  "Last Quarter": "🌗",
  "Waning Crescent": "🌘",
  "Crescent Moon (Generic)": "🌙",
  "New Moon Face": "🌚",
  "Full Moon Face": "🌝",
  "First Quarter Face": "🌛",
  "Last Quarter Face": "🌜"
};


const MapPage = () => {
  const mapRef = useRef(null);
  const [forecast, setForecast] = useState(null);
  const [userForecast, setUserForecast] = useState(null);
  const [waterFilter, setWaterFilter] = useState('all');
  const markersRef = useRef([]); // Use ref to store markers
  const [userLocation, setUserLocation] = useState(null); // Store user's location

  // Helper to clear markers from map
  const clearMarkers = () => {
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
  };

  // Function to center map on user's location
  const centerOnUser = () => {
    if (userLocation) {
      mapRef.current.setView([userLocation.lat, userLocation.lng], 12);
    } else {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          mapRef.current.setView([latitude, longitude], 12);
        },
        error => {
          console.error("Error getting location:", error);
          alert("Unable to access your location. Please enable location services.");
        }
      );
    }
  };

  // Fetch and display pins based on filter
  const fetchPosts = () => {
    clearMarkers();
    const url = waterFilter === 'all'
      ? '/api/posts'
      : `/api/posts?filterWaterType=${waterFilter}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.posts && data.posts.length > 0) {
          data.posts.forEach(post => {
            if (post.location?.lat && post.location?.lng) {
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
              const marker = L.marker([post.location.lat, post.location.lng])
                .addTo(mapRef.current)
                .bindPopup(popupContent);
              markersRef.current.push(marker);
            }
          });
        }
      });
  };

  useEffect(() => {
    if (!mapRef.current) {
      const map = L.map('map').setView([40.0583, -74.4057], 8);

      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        const weather = await fetchHourlyForecast(latitude, longitude);
        setUserForecast(weather);
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        const weather = await fetchHourlyForecast(lat, lng);
        setForecast(weather);
      });

      mapRef.current = map;
    }
    fetchPosts();
    // eslint-disable-next-line
  }, [waterFilter]);

  function getPrecipIcon(code) {
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return "🌧️ Rain:";
    if ([66, 67].includes(code)) return "🌧️❄️ Freezing Rain:";
    if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️ Snow:";
    if ([95, 96, 99].includes(code)) return "⛈️ Thunderstorm:";
    return "💧None:"; // Fallback label
  }
  
  // Fetches moon phase data
  async function fetchMoonPhase(date) {
    const timestamp = Math.floor(date.getTime() / 1000);
    try {
      const res = await fetch(`https://api.farmsense.net/v1/moonphases/?d=${timestamp}`);
      const data = await res.json();
      return data?.[0]?.Phase ?? null;
    } catch (err) {
      console.error("🌑 Failed to fetch moon phase:", err);
      return null;
    }
  }

  const fetchHourlyForecast = async (lat, lng) => {
    const today = new Date().toISOString().split("T")[0];
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,precipitation,windspeed_10m,weathercode&temperature_unit=fahrenheit&precipitation_unit=inch&windspeed_unit=mph&timezone=America%2FNew_York&start_date=${today}&end_date=${today}`;
    const res = await fetch(url);
    const data = await res.json();

    const now = new Date();
    const currentHourIndex = data.hourly.time.findIndex(t => new Date(t).getHours() === now.getHours());

    let moonData = await fetchMoonPhase(now);

    return {
      current: {
        temperature: data.current_weather.temperature,
        windspeed: data.current_weather.windspeed,
        weathercode: data.current_weather.weathercode,
        moonPhase: moonData
      },
      hourly: data.hourly.time.map((time, i) => ({
        hour: new Date(time).getHours(),
        label: new Date(time).toLocaleTimeString([], { hour: 'numeric', hour12: true }),
        temperature: data.hourly.temperature_2m[i],
        precipitation: data.hourly.precipitation[i],
        windspeed: data.hourly.windspeed_10m[i],
        weathercode: data.hourly.weathercode[i],
      })),
      indexNow: currentHourIndex
    };
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div id="map" style={{ position: 'relative', flex: 3 }}>
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'white',
          padding: '10px 15px',
          borderRadius: '10px',
          boxShadow: '0 0 10px rgba(0,0,0,0.2)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          fontSize: '14px',
          maxWidth: '600px',
          flexWrap: 'wrap'
        }}>
          <select
            value={waterFilter}
            onChange={e => setWaterFilter(e.target.value)}
            style={{
              padding: '5px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              marginRight: '10px'
            }}
          >
            <option value="all">All Waters</option>
            <option value="Fresh">Freshwater</option>
            <option value="Salt">Saltwater</option>
          </select>

          {/* Add the recenter button */}
          <button
            onClick={centerOnUser}
            style={{
              padding: '5px 10px',
              borderRadius: '5px',
              backgroundColor: '#1e88e5',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            📍 My Location
          </button>

          {userForecast && (
            <>
              <span><strong>📍 Your Weather:</strong></span>
              <span>{getWeatherIcon(userForecast.current.weathercode)} {userForecast.current.temperature}°F</span>
              <span>{getPrecipIcon(userForecast.hourly[userForecast.indexNow]?.weathercode)} {userForecast.hourly[userForecast.indexNow]?.precipitation} in</span>
              <span>🌬️ Wind: {userForecast.current.windspeed} mph</span>
              <span>{moonPhaseIcons[userForecast.current.moonPhase] || "🌕"} {userForecast.current.moonPhase}</span>
            </>
          )}
        </div>
      </div>
      
      {/* SIDEBAR – Clicked Forecast */}
      <aside style={{
        flex: 1,
        padding: '20px',
        backgroundColor: '#f4f4f4',
        borderLeft: '1px solid #ccc',
        overflowY: 'auto'
      }}>
        <h3>📍 Clicked Location</h3>
        {forecast ? (
          <div>
            <p>{getWeatherIcon(forecast.current.weathercode)} {forecast.current.temperature}°F</p>
            <p>{getPrecipIcon(forecast.hourly[forecast.indexNow]?.weathercode)} {forecast.hourly[forecast.indexNow]?.precipitation} in</p>
            <p>🌬️ Wind: {forecast.current.windspeed} mph</p>

            <h4>⏱ Hourly Forecast</h4>
            <ul style={{ paddingLeft: 0, listStyle: 'none' }}>
              {forecast.hourly
                .filter(hour => hour.hour >= 0 && hour.hour <= 23)
                .map((hour, i) => (
                  <li key={i} style={{ marginBottom: '8px' }}>
                    <strong>{hour.label}</strong>: {getWeatherIcon(hour.weathercode)} {hour.temperature}°F,
                    {getPrecipIcon(hour.weathercode)} {hour.precipitation} in, 🌬️ {hour.windspeed} mph
                  </li>
                ))}
            </ul>
          </div>
        ) : (
          <p>Click a location to view forecast.</p>
        )}
      </aside>
    </div>
  );
};

export default MapPage;