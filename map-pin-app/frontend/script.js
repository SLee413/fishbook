const map = L.map('map').setView([40.0583, -74.4057], 8); // Centered over New Jersey
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

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


// Load existing pins
// Load existing pins with weather and datetime info
fetch('http://localhost:3000/api/locations')
  .then(res => res.json())
  .then(locations => {
    locations.forEach(loc => {
      const popupContent = `
        ${loc.name}<br>
        ${loc.datetime || ''}<br>
        ${loc.weather?.temperature ?? 'N/A'}°F,
        ${loc.weather?.precipitation ?? 'N/A'}" rain
      `;

      L.marker([loc.lat, loc.lng]).addTo(map).bindPopup(popupContent);
    });
  });


// Add new pin on click
map.on('click', async function(e) {
  const { lat, lng } = e.latlng;

  const name = prompt('Enter location name:');
  if (!name) return;

  const datetimeInput = prompt('Enter date and time (YYYY-MM-DDTHH:MM, 24-hour format):');
  if (!datetimeInput || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datetimeInput)) {
    alert("Invalid date/time format.");
    return;
  }

  const [date, time] = datetimeInput.split("T");
  const hour = parseInt(time.split(":")[0]);

  const weatherData = await getWeather(lat, lng, date);
  const sidebarHTML = `<strong>${name}</strong><br>${datetimeInput}<br><br>` + formatHourlyWeather(weatherData);
  document.getElementById("hourlyWeatherPanel").innerHTML = sidebarHTML;

  const temp = weatherData.temps[hour];
  const icon = getWeatherIcon(weatherData.codes[hour]);

  L.marker([lat, lng]).addTo(map)
    .bindPopup(`${name}<br>${temp}°F ${icon}`)
    .openPopup();

  const weather = {
    temperature: temp,
    precipitation: weatherData.precipitation[hour],
    weathercode: weatherData.codes[hour]
  };

  saveLocation(name, lat, lng, datetimeInput, weather);
});


map.on('contextmenu', async function (e) {
  const { lat, lng } = e.latlng;
  const today = new Date().toISOString().split("T")[0];

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=temperature_2m,precipitation,weathercode&temperature_unit=fahrenheit&precipitation_unit=inch&windspeed_unit=mph&timezone=America%2FNew_York`;

  const res = await fetch(url);
  const data = await res.json();

  const weatherData = {
    hours: data.hourly.time.filter(t => t.startsWith(today)),
    temps: data.hourly.temperature_2m.slice(0, 24),
    precipitation: data.hourly.precipitation.slice(0, 24),
    codes: data.hourly.weathercode.slice(0, 24)
  };

  const sidebarHTML = `<strong>Right-clicked Location</strong><br>${today}<br><br>` + formatHourlyWeather(weatherData);
  document.getElementById("hourlyWeatherPanel").innerHTML = sidebarHTML;

  // ✅ This line updates the "Clicked Location" section
  const hour = new Date().getHours();
  updateWeatherSection("clickWeather", {
    temperature: weatherData.temps[hour],
    windspeed: 0, // Optional
    weathercode: weatherData.codes[hour]
  });
});






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
  resultEl.textContent = `${icon} ${weather.temperature}°F, ${weather.windspeed} mph`;

}


async function getWeather(lat, lng, date) {
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${date}&end_date=${date}&hourly=temperature_2m,precipitation,weathercode&temperature_unit=fahrenheit&precipitation_unit=inch&windspeed_unit=mph&timezone=America%2FNew_York`;

  const res = await fetch(url);
  const data = await res.json();

  return {
    hours: data.hourly.time,
    temps: data.hourly.temperature_2m,
    precipitation: data.hourly.precipitation,
    codes: data.hourly.weathercode
  };
}



function formatHourlyWeather(data) {
  let result = "<strong>Hourly Forecast:</strong><br>";
  for (let i = 0; i < data.hours.length; i++) {
    const time = data.hours[i].split("T")[1]; // "15:00"
    const temp = data.temps[i];
    const rain = data.precipitation[i];
    const icon = getWeatherIcon(data.codes[i]);
    result += `${time} → ${temp}°F, ${rain}" ${icon}<br>`;

  }
  return result;
}




async function addLocationFromInput() {
  const input = document.getElementById('locationInput').value.trim();
  const datetimeInput = document.getElementById("pinDateTime").value;
  if (!datetimeInput) {
    alert("Please enter a date and time.");
    return;
  }

  const [date, time] = datetimeInput.split("T");
  const hour = parseInt(time.split(":")[0]);

  if (!input) return alert("Please enter an address or coordinates.");

  let lat, lng;

  // 🔍 If coordinates
  if (/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(input)) {
    [lat, lng] = input.split(',').map(Number);
  } else {
    // 🌐 Geocode the address
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(input)}&format=json`);
    const data = await response.json();
    if (data.length === 0) return alert("Address not found.");
    lat = parseFloat(data[0].lat);
    lng = parseFloat(data[0].lon);

    const searchWeather = await getLiveWeather(lat, lng);
    //updateWeatherSection("searchWeather", searchWeather);
  }

  // ✅ This happens regardless of input type:
  const name = prompt("Enter a name for this pin:");
  if (!name) return;

  const weatherData = await getWeather(lat, lng, date);
const sidebarHTML = `<strong>${name}</strong><br>${datetimeInput}<br><br>` + formatHourlyWeather(weatherData);
document.getElementById("hourlyWeatherPanel").innerHTML = sidebarHTML;

const selectedHour = parseInt(time.split(":")[0]);
const weather = {
  temperature: weatherData.temps[selectedHour],
  precipitation: weatherData.precipitation[selectedHour],
  weathercode: weatherData.codes[selectedHour]
};

console.log("before L.");
L.marker([lat, lng]).addTo(map)
  .bindPopup(`${name}<br>${weather.temperature}°F ${getWeatherIcon(weather.weathercode)}`)
  .openPopup();
  console.log("before saveloaction.");
saveLocation(name, lat, lng, datetimeInput, weather);

}


function updateWeatherSection(elementId, weather) {
  const icon = getWeatherIcon(weather.weathercode);
  const text = `${icon} ${weather.temperature}°F, ${weather.windspeed} mph`;
  document.getElementById(elementId).textContent = text;
}

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



async function getLiveWeather(lat, lng) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&temperature_unit=fahrenheit&windspeed_unit=mph&precipitation_unit=inch`;

  const res = await fetch(url);
  const data = await res.json();
  return data.current_weather;
}



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
}
