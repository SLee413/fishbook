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
      const icon = getWeatherIcon(loc.weather?.weathercode ?? -1);

      const popupContent = `
        <strong>${loc.name}</strong><br>
        ${formatDateTime(loc.datetime)}<br>
        🌡️ ${loc.weather?.temperature ?? 'N/A'}°F<br>
        🌧️ ${loc.weather?.precipitation ?? 'N/A'}" rain<br>
        💨 ${loc.weather?.windspeed ?? 'N/A'} mph ${icon}
      `;



      L.marker([loc.lat, loc.lng]).addTo(map).bindPopup(popupContent);
    });
  });


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
  
  




/*
  map.on('click', async function(e) {
    const { lat, lng } = e.latlng;
    console.log("📍 Clicked:", lat, lng);
  
    const name = prompt('Enter location name:');
    if (!name) return;
  
    const datetimeInput = prompt('Enter date and time (YYYY-MM-DDTHH:MM, 24-hour format):');
    if (!datetimeInput || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(datetimeInput)) {
      alert("Invalid date/time format.");
      return;
    }
  
    const [date, time] = datetimeInput.split("T");
    const [hourStr, minuteStr] = time.split(":");
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);

    // ⏱️ Round to the nearest hour
    const roundedHour = minute >= 30 ? hour + 1 : hour;
    const roundedTimeString = `${date}T${roundedHour.toString().padStart(2, "0")}:00`;

    console.log("🕒 Date/hour:", date, hour);
  
    let weatherData;
    if (isTodayOrYesterday(date)) {
      console.log("📡 Using live weather");
      const live = await getLiveWeather(lat, lng);
      console.log("✅ Live weather:", live);
  
      const hourString = `${date}T${time}:00`;

      weatherData = {
        hours: [hourString],
        temps: [live.temperature],
        precipitation: [live.precipitation],
        windspeed: [live.windspeed],
        codes: [live.weathercode]
      };

      weatherData.temps[hour] = live.temperature;
      weatherData.precipitation[hour] = live.precipitation;
      weatherData.windspeed[hour] = live.windspeed;
      weatherData.codes[hour] = live.weathercode;
    } else {
      console.log("📚 Using archived weather");
      weatherData = await getWeather(lat, lng, date);
    }
  
    const formattedTime = formatDateTime(datetimeInput);
    const sidebarHTML = `<strong>${name}</strong><br>${formattedTime}<br><br>` + formatHourlyWeather(weatherData);
    document.getElementById("hourlyWeatherPanel").innerHTML = sidebarHTML;
  
    const weather = {
      temperature: weatherData.temps[hour],
      precipitation: weatherData.precipitation[hour],
      windspeed: weatherData.windspeed[hour],
      weathercode: weatherData.codes[hour]
    };
  
    console.log("📦 Weather object:", weather);
  
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
  });
  */


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

  document.getElementById("hourlyWeatherPanel").innerHTML = sidebarHTML;

  // ✅ This line updates the "Clicked Location" section
  const hour = new Date().getHours();
  updateWeatherSection("clickWeather", {
    temperature: weatherData.temps[hour],
    windspeed: weatherData.windspeed[hour],
    precipitation: weatherData.precipitation[hour],
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
  resultEl.textContent = `${icon} ${weather.temperature}°F, ${weather.windspeed} mph, ${weather.precipitation}" rain`;


}


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
    weatherData = await getWeather(lat, lng, date);
  }

  const formattedTime = formatDateTime(datetimeInput);
  const sidebarHTML = `<strong>${name}</strong><br>${formattedTime}<br><br>` + formatHourlyWeather(weatherData);
  document.getElementById("hourlyWeatherPanel").innerHTML = sidebarHTML;

  // ✅ Always use index 0, because we only saved 1 hour of data
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




function updateWeatherSection(elementId, weather) {
  const icon = getWeatherIcon(weather.weathercode);
  const text = `${icon} ${weather.temperature}°F | ${weather.windspeed} mph | ${weather.precipitation ?? 0}" precipitation`;
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









let modalLat, modalLng;

map.on('click', function (e) {
  const { lat, lng } = e.latlng;
  console.log("📍 Clicked:", lat, lng);

  modalLat = lat;
  modalLng = lng;

  // Reset and open the modal
  document.getElementById("modalPinName").value = "";
  document.getElementById("modalPinDate").value = "";
  document.getElementById("pinModal").style.display = "flex";
});


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
