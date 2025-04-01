// Complete script.js for map application with post integration

const map = L.map('map').setView([40.0583, -74.4057], 8); // Centered over New Jersey
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Make map available globally for other components to access
window.map = map;

// Add a state variable to track if user wants to create a post from pin
let createPostFromPin = false;
let selectedPin = null;
let modalLat, modalLng;

// Add a toggle button for post creation mode
const postModeButton = L.control({ position: 'topleft' });
postModeButton.onAdd = function() {
  const div = L.DomUtil.create('div', 'post-mode-control');
  div.innerHTML = `<button id="togglePostMode" class="post-mode-btn">Create Post Mode: OFF</button>`;
  return div;
};
postModeButton.addTo(map);

// Add event listener for the toggle button
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('togglePostMode').addEventListener('click', function() {
    createPostFromPin = !createPostFromPin;
    this.textContent = `Create Post Mode: ${createPostFromPin ? 'ON' : 'OFF'}`;
    this.classList.toggle('active', createPostFromPin);
  });
});

// Show weather for user's current location via GPS
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    const weather = await getLiveWeather(latitude, longitude);
    updateWeatherSection("currentLocationWeather", weather);
  }, () => {
    document.getElementById("currentLocationWeather").textContent = "Location permission denied";
  });
} else {
  document.getElementById("currentLocationWeather").textContent = "Geolocation not supported";
}

// Load existing pins with weather and datetime info
fetch('http://localhost:3000/api/locations')
  .then(res => res.json())
  .then(locations => {
    locations.forEach(loc => {
      const icon = getWeatherIcon(loc.weather?.weathercode ?? -1);

      let popupContent = `
        <strong>${loc.name}</strong><br>
        ${formatDateTime(loc.datetime)}<br>
        🌡️ ${loc.weather?.temperature ?? 'N/A'}°F<br>
        🌧️ ${loc.weather?.precipitation ?? 'N/A'}" rain<br>
        💨 ${loc.weather?.windspeed ?? 'N/A'} mph ${icon}
      `;

      // If this pin is linked to a post, add post info and link
      if (loc.postId) {
        popupContent += `
          <hr>
          <small>This location has a post!</small><br>
          <button class="view-post-btn" data-postid="${loc.postId}">View Post</button>
        `;
      } else if (loc._id) {
        // If pin exists but no post yet, offer to create one
        popupContent += `
          <hr>
          <button class="create-post-btn" data-pinid="${loc._id}">Create Post</button>
        `;
      }

      const marker = L.marker([loc.lat, loc.lng]).addTo(map).bindPopup(popupContent);
      
      // Add event listener to the marker's popup
      marker.on('popupopen', function() {
        // Find view post buttons in popup and add click handlers
        const viewPostBtns = document.querySelectorAll('.view-post-btn');
        viewPostBtns.forEach(btn => {
          btn.addEventListener('click', function() {
            const postId = this.getAttribute('data-postid');
            window.location.href = `/post/${postId}`;
          });
        });

        // Find create post buttons in popup and add click handlers
        const createPostBtns = document.querySelectorAll('.create-post-btn');
        createPostBtns.forEach(btn => {
          btn.addEventListener('click', function() {
            const pinId = this.getAttribute('data-pinid');
            // Find the location data for this pin
            const pinData = locations.find(loc => loc._id === pinId);
            if (pinData) {
              openPostCreationModal(pinData);
            }
          });
        });
      });
    });
  });

// Modified click handler for map
map.on('click', function (e) {
  const { lat, lng } = e.latlng;
  console.log("📍 Clicked:", lat, lng);
  
  // If in post creation mode, go directly to post creation flow
  if (createPostFromPin) {
    confirmPinForPost(lat, lng);
    return;
  }
  
  // Otherwise, use the normal pin creation flow
  modalLat = lat;
  modalLng = lng;
  document.getElementById("pinModal").style.display = "flex";
});

// Right-click to see weather forecast
map.on('contextmenu', async function (e) {
  const { lat, lng } = e.latlng;
  const today = new Date().toISOString().split("T")[0];

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation,weathercode,windspeed_10m&temperature_unit=fahrenheit&precipitation_unit=inch&windspeed_unit=mph&timezone=America%2FNew_York`;

  const res = await fetch(url);
  const data = await res.json();

  const weatherData = {
    hours: data.hourly.time.filter(t => t.startsWith(today)),
    temps: data.hourly.temperature_2m.slice(0, 24),
    precipitation: data.hourly.precipitation.slice(0, 24),
    windspeed: data.hourly.windspeed_10m.slice(0, 24),
    codes: data.hourly.weathercode.slice(0, 24)
  };
  
  const sidebarHTML = `
    <strong>Right-clicked Location</strong><br>
    ${today}<br>
    Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}<br><br>
    ${formatHourlyWeather(weatherData)}
  `;
  document.getElementById("hourlyWeatherPanel").innerHTML = sidebarHTML;

  // Update the "Clicked Location" section
  const hour = new Date().getHours();
  updateWeatherSection("clickWeather", {
    temperature: weatherData.temps[hour],
    windspeed: weatherData.windspeed[hour],
    precipitation: weatherData.precipitation[hour],
    weathercode: weatherData.codes[hour]
  });
});

// New function to create a pin specifically for post creation
async function confirmPinForPost(lat, lng) {
  const name = prompt("Enter a name for this location:");
  if (!name) return;
  
  // Get current date and time
  const now = new Date();
  const formattedDateTime = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:MM
  
  // Get weather for this location
  const weather = await getLiveWeather(lat, lng);
  
  // Create the pin data object
  const pinData = {
    name,
    lat,
    lng,
    datetime: formattedDateTime,
    weather
  };
  
  // Save the pin
  try {
    const response = await fetch('http://localhost:3000/api/locations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pinData)
    });
    
    const savedPin = await response.json();
    
    // Now open the post creation UI with this pin
    openPostCreationModal(savedPin);
    
    // Add a marker to the map
    const icon = getWeatherIcon(weather.weathercode);
    const popupContent = `
      <strong>${name}</strong><br>
      ${formatDateTime(formattedDateTime)}<br>
      🌡️ ${weather.temperature}°F<br>
      🌧️ ${weather.precipitation}" rain<br>
      💨 ${weather.windspeed} mph ${icon}<br>
      <hr>
      <small>Creating post...</small>
    `;
    
    L.marker([lat, lng]).addTo(map)
      .bindPopup(popupContent)
      .openPopup();
      
  } catch (error) {
    console.error("Error saving pin:", error);
    alert("Failed to save pin. Please try again.");
  }
}

// Function to open the post creation modal/component
function openPostCreationModal(pinData) {
  // Create a modal directly in the DOM
  const modalHTML = `
    <div id="postCreationModal" class="modal">
      <div class="modal-content">
        <span class="close">&times;</span>
        <h2>Create Post from Pin</h2>
        <div class="pin-details">
          <strong>${pinData.name}</strong>
          <p>Location: ${pinData.lat.toFixed(5)}, ${pinData.lng.toFixed(5)}</p>
          <p>Date: ${new Date(pinData.datetime).toLocaleDateString()}</p>
          ${pinData.weather ? `
            <div class="weather-info">
              <p>Weather: ${pinData.weather.temperature}°F, ${pinData.weather.windspeed} mph</p>
              <p>Precipitation: ${pinData.weather.precipitation}" rain</p>
            </div>
          ` : ''}
        </div>
        <form id="postForm">
          <div class="form-group">
            <label for="imageUrl">Image URL *</label>
            <input id="imageUrl" type="text" required placeholder="https://example.com/my-fishing-image.jpg">
          </div>
          <div class="form-group">
            <label for="species">Species</label>
            <input id="species" type="text" placeholder="Bass, Trout, etc.">
          </div>
          <div class="form-group">
            <label for="bait">Bait/Lure</label>
            <input id="bait" type="text" placeholder="What did you use to catch it?">
          </div>
          <div class="form-group">
            <label for="waterType">Water Type</label>
            <select id="waterType">
              <option value="">Select water type</option>
              <option value="lake">Lake</option>
              <option value="river">River</option>
              <option value="ocean">Ocean</option>
              <option value="pond">Pond</option>
              <option value="stream">Stream</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="form-actions">
            <button type="button" id="cancelPost" class="cancel-button">Cancel</button>
            <button type="submit" class="submit-button">Create Post</button>
          </div>
        </form>
      </div>
    </div>
  `;
  
  // Inject the modal into the DOM
  const modalContainer = document.createElement('div');
  modalContainer.innerHTML = modalHTML;
  document.body.appendChild(modalContainer.firstChild);
  
  // Get references to the DOM elements
  const modal = document.getElementById('postCreationModal');
  const closeBtn = modal.querySelector('.close');
  const cancelBtn = document.getElementById('cancelPost');
  const form = document.getElementById('postForm');
  
  // Add event listeners
  closeBtn.onclick = cancelBtn.onclick = function() {
    modal.remove();
  };
  
  // Handle form submission
  form.onsubmit = async function(e) {
    e.preventDefault();
    
    // Get form values
    const imageUrl = document.getElementById('imageUrl').value;
    const species = document.getElementById('species').value;
    const bait = document.getElementById('bait').value;
    const waterType = document.getElementById('waterType').value;
    
    // Create the post data
    const postData = {
      imageUrl: imageUrl,
      dateCaught: new Date(pinData.datetime).toISOString(),
      location: {
        lat: pinData.lat,
        lng: pinData.lng
      },
      species: species || undefined,
      bait: bait || undefined,
      waterType: waterType || undefined
    };
    
    try {
      // Make sure user is authenticated
      const token = localStorage.getItem('token');
      if (!token) {
        alert("You need to log in to create a post.");
        modal.remove();
        window.location.href = '/login';
        return;
      }
      
      // Send the request to create a post
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create post');
      }
      
      const result = await response.json();
      
      // Now update the pin to link it to the post
      await fetch(`http://localhost:3000/api/locations/${pinData._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: result.postId })
      });
      
      // Close the modal
      modal.remove();
      
      // Redirect to the post page or show success message
      alert('Post created successfully!');
      window.location.href = `/post/${result.postId}`;
      
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  };
  
  // Show the modal
  modal.style.display = 'block';
}

// Function to check if date is today or yesterday
function isTodayOrYesterday(dateString) {
  const selected = new Date(dateString);
  const now = new Date();

  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return (
    selected.toDateString() === today.toDateString() ||
    selected.toDateString() === yesterday.toDateString()
  );
}

// Search for weather by location or coordinates
async function searchLiveWeather() {
  const input = document.getElementById("weatherSearchInput").value.trim();
  const resultEl = document.getElementById("weatherSearchResult");

  if (!input) {
    resultEl.textContent = "Please enter a location.";
    return;
  }

  let lat, lng;

  // Check if it's coordinates
  if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(input)) {
    [lat, lng] = input.split(',').map(Number);
  } else {
    // Use OpenStreetMap to geocode the address
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json`);
    const data = await res.json();
    if (data.length === 0) {
      resultEl.textContent = "Address not found.";
      return;
    }
    lat = parseFloat(data[0].lat);
    lng = parseFloat(data[0].lon);
  }

  // Get weather and display
  const weather = await getLiveWeather(lat, lng);
  const icon = getWeatherIcon(weather.weathercode);
  resultEl.textContent = `${icon} ${weather.temperature}°F, ${weather.windspeed} mph, ${weather.precipitation}" rain`;
}

// Get historical weather data
async function getWeather(lat, lng, date) {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${date}&end_date=${date}&hourly=temperature_2m,precipitation,weathercode,windspeed_10m&temperature_unit=fahrenheit&precipitation_unit=inch&windspeed_unit=mph&timezone=America%2FNew_York`;

  const res = await fetch(url);
  const data = await res.json();

  return {
    hours: data.hourly.time,
    temps: data.hourly.temperature_2m,
    precipitation: data.hourly.precipitation,
    windspeed: data.hourly.windspeed_10m,
    codes: data.hourly.weathercode
  };
}

// Format hourly weather data for display
function formatHourlyWeather(data) {
  let result = "<strong>Hourly Forecast:</strong><br>";
  for (let i = 0; i < data.hours.length; i++) {
    const time = data.hours[i].split("T")[1];
    const temp = data.temps[i];
    const rain = data.precipitation[i];
    const wind = data.windspeed[i];
    const icon = getWeatherIcon(data.codes[i]);

    result += `${time} → ${temp}°F, ${rain}" rain, ${wind} mph ${icon}<br>`;
  }
  return result;
}

// Add a location from input field
async function addLocationFromInput() {
  const input = document.getElementById('locationInput').value.trim();
  const datetimeInput = document.getElementById("pinDateTime").value;
  if (!datetimeInput) {
    alert("Please enter a date and time.");
    return;
  }

  const [date, time] = datetimeInput.split("T");
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);

  const roundedHour = minute >= 30 ? hour + 1 : hour;
  const roundedTime = `${date}T${roundedHour.toString().padStart(2, "0")}:00`;

  if (!input) return alert("Please enter an address or coordinates.");

  let lat, lng;
  if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(input)) {
    [lat, lng] = input.split(',').map(Number);
  } else {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json`);
    const data = await response.json();
    if (data.length === 0) return alert("Address not found.");
    lat = parseFloat(data[0].lat);
    lng = parseFloat(data[0].lon);
  }

  const name = prompt("Enter a name for this pin:");
  if (!name) return;

  let weatherData;
  if (isTodayOrYesterday(date)) {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation,weathercode,windspeed_10m&temperature_unit=fahrenheit&precipitation_unit=inch&windspeed_unit=mph&timezone=America%2FNew_York`);

    const data = await res.json();
  
    const todayHours = data.hourly.time
      .map((t, i) => ({ t, i }))
      .filter(obj => obj.t.startsWith(date));
  
    weatherData = {
      hours: todayHours.map(h => h.t),
      temps: todayHours.map(h => data.hourly.temperature_2m[h.i]),
      precipitation: todayHours.map(h => data.hourly.precipitation[h.i]),
      windspeed: todayHours.map(h => data.hourly.windspeed_10m[h.i]),
      codes: todayHours.map(h => data.hourly.weathercode[h.i])
    };
  }
  else {
    weatherData = await getWeather(lat, lng, date);
  }

  const formattedTime = formatDateTime(datetimeInput);
  const sidebarHTML = `<strong>${name}</strong><br>${formattedTime}<br><br>` + formatHourlyWeather(weatherData);
  document.getElementById("hourlyWeatherPanel").innerHTML = sidebarHTML;

  // Use index 0, because we only saved 1 hour of data
  const weather = {
    temperature: weatherData.temps[0],
    precipitation: weatherData.precipitation[0],
    windspeed: weatherData.windspeed[0],
    weathercode: weatherData.codes[0]
  };

  const popupContent = `
    <strong>${name}</strong><br>
    ${formattedTime}<br>
    🌡️ ${weather.temperature}°F<br>
    🌧️ ${weather.precipitation}" rain<br>
    💨 ${weather.windspeed} mph ${getWeatherIcon(weather.weathercode)}
  `;

  L.marker([lat, lng]).addTo(map)
    .bindPopup(popupContent)
    .openPopup();

  saveLocation(name, lat, lng, datetimeInput, weather);
}

// Update weather section with formatted data
function updateWeatherSection(elementId, weather) {
  const icon = getWeatherIcon(weather.weathercode);
  const text = `${icon} ${weather.temperature}°F | ${weather.windspeed} mph | ${weather.precipitation ?? 0}" precipitation`;
  document.getElementById(elementId).textContent = text;
}

// Get appropriate weather icon based on code
function getWeatherIcon(code) {
  if ([0].includes(code)) return "☀️";         // Clear
  if ([1, 2].includes(code)) return "🌤️";     // Partly cloudy
  if ([3].includes(code)) return "☁️";         // Cloudy
  if ([45, 48].includes(code)) return "🌫️";    // Fog
  if ([51, 53, 55, 61, 63, 65].includes(code)) return "🌧️"; // Rain
  if ([71, 73, 75, 77].includes(code)) return "❄️"; // Snow
  if ([95, 96, 99].includes(code)) return "⛈️"; // Thunder
  return "❓";
}

// Get current weather at a location
async function getLiveWeather(lat, lng) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentHour = now.getHours();

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation,weathercode,windspeed_10m&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch&timezone=America%2FNew_York`;

  const res = await fetch(url);
  const data = await res.json();

  return {
    temperature: data.hourly.temperature_2m[currentHour],
    windspeed: data.hourly.windspeed_10m[currentHour],
    weathercode: data.hourly.weathercode[currentHour],
    precipitation: data.hourly.precipitation[currentHour]
  };
}

// Format datetime for display
function formatDateTime(isoString) {
  const date = new Date(isoString);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  };
  return date.toLocaleString("en-US", options);
}

// Handle pin modal
function openModal(lat, lng) {
  modalLat = lat;
  modalLng = lng;
  document.getElementById("modalPinName").value = "";
  document.getElementById("modalPinDate").value = "";
  document.getElementById("pinModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("pinModal").style.display = "none";
}

// Handle pin confirmation from modal
async function confirmPin() {
  const name = document.getElementById("modalPinName").value.trim();
  const datetimeInput = document.getElementById("modalPinDate").value;
  if (!name || !datetimeInput) {
    alert("Please fill out both fields.");
    return;
  }

  document.getElementById("pinModal").style.display = "none";

  const [date, time] = datetimeInput.split("T");
  const [hourStr, minuteStr] = time.split(":");
  const hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);

  const roundedHour = minute >= 30 ? hour + 1 : hour;
  const roundedTime = `${date}T${roundedHour.toString().padStart(2, "0")}:00`;

  let weatherData;

  if (isTodayOrYesterday(date)) {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${modalLat}&longitude=${modalLng}&hourly=temperature_2m,precipitation,weathercode,windspeed_10m&temperature_unit=fahrenheit&precipitation_unit=inch&windspeed_unit=mph&timezone=America%2FNew_York`);

    const data = await res.json();
  
    const todayHours = data.hourly.time
      .map((t, i) => ({ t, i }))
      .filter(obj => obj.t.startsWith(date));
  
    weatherData = {
      hours: todayHours.map(h => h.t),
      temps: todayHours.map(h => data.hourly.temperature_2m[h.i]),
      precipitation: todayHours.map(h => data.hourly.precipitation[h.i]),
      windspeed: todayHours.map(h => data.hourly.windspeed_10m[h.i]),
      codes: todayHours.map(h => data.hourly.weathercode[h.i])
    };
  }
  else {
    console.log("📚 Using archived weather");
    weatherData = await getWeather(modalLat, modalLng, date);
  }

  const formattedTime = formatDateTime(datetimeInput);
  const sidebarHTML = `<strong>${name}</strong><br>${formattedTime}<br><br>` + formatHourlyWeather(weatherData);
  document.getElementById("hourlyWeatherPanel").innerHTML = sidebarHTML;

  const weather = {
    temperature: weatherData.temps[0],
    precipitation: weatherData.precipitation[0],
    windspeed: weatherData.windspeed[0],
    weathercode: weatherData.codes[0]
  };

  const popupContent = `
    <strong>${name}</strong><br>
    ${formattedTime}<br>
    🌡️ ${weather.temperature}°F<br>
    🌧️ ${weather.precipitation}" rain<br>
    💨 ${weather.windspeed} mph ${getWeatherIcon(weather.weathercode)}
  `;

  L.marker([modalLat, modalLng]).addTo(map)
    .bindPopup(popupContent)
    .openPopup();

  saveLocation(name, modalLat, modalLng, datetimeInput, weather);
}

// Save location to database
function saveLocation(name, lat, lng, datetime, weather) {
  fetch('http://localhost:3000/api/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name,
      lat,
      lng,
      datetime,
      weather
    })
  });
  console.log("📝 Saving location with weather:", weather);
}