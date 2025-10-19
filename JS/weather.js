
let myLat = 48.86;
let myLon = 2.35;

const OWMAPIKey = '58111013c30dffa44e8a1d78e22ce00c';
const forecastCache = {};
let forecastMode = "24h";
let viewToggle = "list";
let tempUnit = "C";

// Fetch and render initial weather data
function init() {
    // Get user location, update coordinates, fallback to default if error
    if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            myLat = position.coords.latitude;
            myLon = position.coords.longitude;
            updateWeatherAndForecast();
        },
        (error) => {
            console.error("Error getting location:", error);
            updateWeatherAndForecast();
        }
    );
    } else {
        console.log("Geolocation not supported by the browser.");
        updateWeatherAndForecast();

    }
    updateFavouritesDropdown();

};
// Fetch current weather data from OpenWeatherMap
async function fetchCurrentWeather(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response not ok');
        const data = await response.json();
        displayCurrentWeather(data);
    } catch (err) {
        console.error("Can't get the current weather:", err);
    }
};
function convertTemperature(celsius, unit) {
    if (unit === "F") return (celsius * 9/5 + 32);
    if (unit === "K") return (celsius + 273.15);
    return (celsius);
};
// Show current weather data in the div #current    
function displayCurrentWeather(data) {
    if (!data || data.length === 0) {
        console.error('No data');
        return;
    }
    const currentTemp = convertTemperature(data.main.temp, tempUnit);
    const feelsLikeTemp = convertTemperature(data.main.feels_like, tempUnit);
    document.querySelector('#current_city').innerText = data.name + ', ' + data.sys.country;
    document.querySelector('#current_time').innerText = new Date((data.dt + data.timezone) * 1000).toUTCString().replace('GMT', '');
    document.querySelector('#current_icon').src=`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    document.querySelector('#current_condition').innerText = data.weather[0].description;
    document.querySelector('#current_temp').innerText = `${Math.round(currentTemp)}°${tempUnit}, feels like ${Math.round(feelsLikeTemp)}°${tempUnit}`;
    document.querySelector('#current_humidity').innerText = `${data.main.humidity}% humidity`;
    document.querySelector('#current_wind_speed').innerText = `${Math.round(data.wind.speed)}m/s wind`;
    setAppStyleBasedOnWeather(data);
};
// Generate the cache key based on lat, long, and forecast mode
function getCacheKey(lat, lon, mode) {
    return `${lat}_${lon}_${mode}`;
};

// Set app background and persona icon based on weather and time of day
function setAppStyleBasedOnWeather(data) {
    const currentCondition = data.weather[0].main.toLowerCase();
    const localDate = new Date((data.dt) * 1000);
    const hour = localDate.getHours();
    const isDay = (hour >= 6 && hour < 18) ? "day" : "night";
    //console.log(hour, isDay);
    //console.log("Current condition:", currentCondition);
    const key = `${currentCondition}_${isDay}`;
    document.body.style.backgroundColor = bgColorMap[key] || "#aca9a9ff";
    
    // Determine persona icon based on feels-like temperature
    const personaTemp = data.main.feels_like;
    let personaKey = "";
    if (personaTemp >= 32) {
        personaKey = "extreme";
    } else if (personaTemp >= 25) {
        personaKey = "hot";
    } else if (personaTemp >= 15) {
        personaKey = "temperate";
    } else if (personaTemp >= 0) {
        personaKey = "cold";
    } else {
        personaKey = "freezing";
    }
    document.getElementById('persona_icon').innerHTML = `<p class="persona">${personaIconMap[personaKey]}</p>`;
};

// Get hourly forecast data from Open-Meteo
async function fetchHourlyForecast(url) {
    // Check if data is in cache and less than 1 hour old
    const key = getCacheKey(myLat, myLon, 'hourly');
    const cacheEntry = forecastCache[key];
    if (cacheEntry && (Date.now() - cacheEntry.timestamp < 3600000)) {
        console.log('Using cached data');
        displayHourlyForecast(cacheEntry.data);
        return;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response not ok');
        const data = await response.json();
        forecastCache[key] = {
            data: data,
            timestamp: Date.now()
        };
        console.log('Data stored in cache');
        displayHourlyForecast(data);
    } catch (error) {
        console.error("Can't get the hourly forecast:", error);
    }
};
// Render hourly forcast data
function displayHourlyForecast(data) {
    if (!data || data.length === 0) {
        console.error('No data');
        return;
    } else {
        const chartData = {
            labels: data.hourly.time.map(t => t.slice(11, 13)),
            datasets: [
                {
                    name: `Temperature (°${tempUnit})`,
                    values: data.hourly.temperature_2m.map(t => convertTemperature(t, tempUnit)),
                    chartType: 'line'
                },
                {
                    name: "Precipitation (mm)",
                    values: data.hourly.precipitation,
                    chartType: 'bar'
                }
            ]
        }
        
        if (viewToggle === "chart") {
            createChart(chartData);
        } else {
            createHourlyTable(data);
        }
    }
}

// Get daily forecast data from Open-Meteo
async function fetchDailyForecast(url) {
    // Check if data is cached and less than 1 hour old
    const key = getCacheKey(myLat, myLon, 'daily')
    const cacheEntry = forecastCache[key];
    if (cacheEntry && ( Date.now() - cacheEntry.timestamp < 3600000 )) {
        console.log('Using cached data');
        displayDailyForecast(cacheEntry.data);
        return;
    }
    // Fetch new data and store in cache
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network response not ok');
        const data = await response.json();
        forecastCache[key] = {
            data: data,
            timestamp: Date.now()
        };
        console.log('Data stored in cache');
        displayDailyForecast(data);
    } catch (error) {
        console.error("Can't get the daily forecast:", error);
    }
};
// Render daily forecast data
function displayDailyForecast(data) {
    if (!data || data.length === 0) {
        console.error('No data');
        return;

    } else {
        // Format time to weekdays for labels
        const weekdayLabels = data.daily.time.map(t => {
            const weekday = new Date(t.slice(0, 10)).toLocaleDateString('en-US', { weekday: 'short' });
            return weekday;
        });
        // Prep the chart data
        const chartData = {       
            labels: weekdayLabels,
            datasets: [
                { name: `Max (°${tempUnit})`, values: data.daily.temperature_2m_max.map(t => convertTemperature(t, tempUnit)), chartType: 'line' },
                { name: `Min (°${tempUnit})`, values: data.daily.temperature_2m_min.map(t => convertTemperature(t, tempUnit)), chartType: 'line' },
                { name: "Precipitation (mm)", values: data.daily.precipitation_sum, chartType: 'bar' }
            ]
        }
        // Serve chart or table based on selected view
        if (viewToggle === "chart") {
        createChart(chartData);
        } else {
        createDailyTable(data);
    }

    }
};

// Create a Frappe chart
function createChart(chartData) {
     window.chart = new frappe.Chart("#chart", {
        title: `${forecastMode} Weather Forecast`,
        data: chartData,
        type: 'line',
        height: 300,
        width: 350,
        colors: ['#eb5146'],
        
    })
}
// Create hourly forecast table (list view)
function createHourlyTable(data) {
    const tableContainer = document.getElementById('chart');
    tableContainer.innerHTML = '';
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');

    // Loop through hourly data and create rows
    for (let i = 0; i < data.hourly.time.length; i++) {
        const row = document.createElement('tr');
        
        // Use different icon for day/night if available
        let imgVer = data.hourly.is_day[i] ? "" : "n";
        const code = data.hourly.weather_code[i];
        const img = document.createElement('img');
        img.src = `/IMG/${code}${imgVer}.png`;
        img.onerror = function() { 
            this.src = `/IMG/${code}.png`;
            console.log("Image not found, loading default."); 
        };
        const temp = convertTemperature(data.hourly.temperature_2m[i], tempUnit);
        row.innerHTML = `
            <td>${data.hourly.time[i].slice(11, 16)}</td>
            <td></td>
            <td>${Math.round(temp)}°${tempUnit}</td>
            <td>${data.hourly.precipitation[i]}mm</td>
        `;
        row.children[1].appendChild(img);
        tbody.appendChild(row);
    }
    table.appendChild(tbody);
    tableContainer.appendChild(table);
}

// Create daily forecast table (list view)
function createDailyTable(data) {
    const tableContainer = document.getElementById('chart');
    tableContainer.innerHTML = '';
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');

    // Loop through daily data and create rows
    for (let i = 0; i < data.daily.time.length; i++) {
        const dateFromData = data.daily.time[i].slice(0, 10);
        const weekday = new Date(dateFromData).toLocaleDateString('en-US', { weekday: 'short' });
        const row = document.createElement('tr');
        const maxTemp = convertTemperature(data.daily.temperature_2m_max[i], tempUnit);
        const minTemp = convertTemperature(data.daily.temperature_2m_min[i], tempUnit);
        row.innerHTML = `
            <td>${weekday}</td>
            <td><img src="/IMG/${data.daily.weather_code[i]}.png"></td>
            <td>${Math.round(minTemp)}...${Math.round(maxTemp)}°${tempUnit}</td>
            <td>${data.daily.precipitation_sum[i]}mm</td>
        `;
        tbody.appendChild(row);
    }
    table.appendChild(tbody);
    tableContainer.appendChild(table);
}

// Helper function to update weather and forecast based on current coordinates and settings
function updateWeatherAndForecast() {
    const OWMCurrentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${myLat}&lon=${myLon}&appid=${OWMAPIKey}&units=metric`;
        fetchCurrentWeather(OWMCurrentWeatherUrl);
    const hourlyUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&hourly=weather_code,temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,is_day&timezone=auto&forecast_hours=24&wind_speed_unit=ms`;
        const dailyUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7&wind_speed_unit=ms`;
        if (forecastMode === "24h") {
            fetchHourlyForecast(hourlyUrl);
        } else {
            fetchDailyForecast(dailyUrl);
        }
}

// Search city
document.getElementById('search_form').addEventListener('submit', async(event) => {
    event.preventDefault();
    const city = document.getElementById('city_input').value;
    if (city !== '') {
        const OWMCurrentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OWMAPIKey}&units=metric`;
        try {
            const response = await fetch(OWMCurrentWeatherUrl);
            if (!response.ok) throw new Error('City not found');
            const data = await response.json();
            myLat = data.coord.lat;
            myLon = data.coord.lon;
            updateWeatherAndForecast();
        } catch (error) {
            console.error("Can't get city data:", error);
        }
    }
    else {
        return;
    }
})

// Toggle view between chart and list
document.getElementById('toggle_view').addEventListener('click', () => {
    viewToggle = (viewToggle === "chart") ? "list" : "chart";
    updateWeatherAndForecast();
});

// Toggle forecast mode
document.getElementById('toggle_forecast').addEventListener('click', () => {
    forecastMode = (forecastMode === "24h") ? "7d" : "24h";
    updateWeatherAndForecast();
});

// Toggle temperature units
document.getElementById('toggle_units').addEventListener('click', () => {
    tempUnit = (tempUnit === "C") ? "F" : (tempUnit === "F") ? "K" : "C";
    updateWeatherAndForecast();
});

// Update favourites dropdown menu
function updateFavouritesDropdown() {
    const dropdown = document.getElementById('favourites_dropdown');
    dropdown.innerHTML = '<option value="">Favourites</option>';
    const favourites = JSON.parse(localStorage.getItem('favourites')) || [];
    favourites.forEach(fav => {
        const option = document.createElement('option');
        option.value = `${fav.lat},${fav.lon}`;
        option.text = fav.city;
        dropdown.appendChild(option);
    });
}

// User selects a favourite -> update weather
document.getElementById('favourites_dropdown').addEventListener('change', function() {
    const favourites = JSON.parse(localStorage.getItem('favourites')) || [];
    const selected = this.value;
    //console.log(selected);
    if (selected) {
        const [lat, lon] = selected.split(',').map(x => Number(x).toFixed(4));
        myLat = lat;
        myLon = lon;
        updateWeatherAndForecast();
    }
});

// Save current location to favourites
document.getElementById('save_favourite').addEventListener('click', function() {
    const favourites = JSON.parse(localStorage.getItem('favourites')) || [];
    const lat = Number(myLat).toFixed(4);
    const lon = Number(myLon).toFixed(4);
    const current = {
        city: document.getElementById('current_city').innerText,
        lat: lat,
        lon: lon
    }
    if (!favourites.some(fav => fav.lat === current.lat && fav.lon === current.lon)) {
        favourites.push(current);
        localStorage.setItem('favourites', JSON.stringify(favourites));
        console.log('Saved to favourites');
        updateFavouritesDropdown();
    }
});

// Remove current city from favourites
document.getElementById('clear_favourites').addEventListener('click', function() {
    let favourites = JSON.parse(localStorage.getItem('favourites')) || [];
    const lat = Number(myLat).toFixed(4);
    const lon = Number(myLon).toFixed(4);
    favourites = favourites.filter(fav => !(fav.lat === lat && fav.lon === lon));
    localStorage.setItem('favourites', JSON.stringify(favourites));
    updateFavouritesDropdown();
    console.log('Removed from favourites');
    
});
// Initialize like a true Englishman
init();
