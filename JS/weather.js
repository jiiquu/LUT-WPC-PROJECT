
var myLat = 48.86;
var myLon = 2.35;
const OWMAPIKey = '58111013c30dffa44e8a1d78e22ce00c';
const OWMCurrentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${myLat}&lon=${myLon}&appid=${OWMAPIKey}&units=metric`;
const hourlyForecastOMUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&hourly=weather_code,temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,is_day&timezone=auto&forecast_days=1&wind_speed_unit=ms`;
var dailyForecastOMUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7&wind_speed_unit=ms`;
var forecastMode = "24h";
const forecastCache = {};
var viewToggle = "chart";
var tempUnit = "C";
    

// Fetch and display weather data on page load
function init() {
 
    // Get user location, update coordinates, fallback to default if error
    if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
        (position) => {

            myLat = position.coords.latitude;

            myLon = position.coords.longitude;
            fetchInitialWeather(myLat, myLon);
        },
        (error) => {
            console.error("Error getting location:", error);
            fetchInitialWeather(myLat, myLon);
        }
    );
    } else {
        console.log("Geolocation is not supported by this browser.");
        fetchInitialWeather(myLat, myLon);

    }
    function fetchInitialWeather(lat, lon) {
        const OWMCurrentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWMAPIKey}&units=metric`;
        fetchCurrentWeather(OWMCurrentWeatherUrl);
        const hourlyForecastOMUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&hourly=weather_code,temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,is_day&timezone=auto&forecast_days=1&wind_speed_unit=ms`;
        fetchHourlyForecast(hourlyForecastOMUrl);
        dailyForecastOMUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7&wind_speed_unit=ms`;
    //    const MIUrl = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${myLat}&lon=${myLon}`;
    //    fetchIMForecast(MIUrl);
    }

}
// Fetch current weather data from OpenWeatherMap
async function fetchCurrentWeather(url) {

    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    displayCurrentWeather(data);
}
// Display current weather data in the div #current    
function displayCurrentWeather(data) {
    if (!data || data.length === 0) {
        console.error('No data found');
        return;
    }
    document.querySelector('#current_city').innerText = data.name + ', ' + data.sys.country;
    document.querySelector('#current_time').innerText = new Date((data.dt + data.timezone) * 1000).toUTCString().replace('GMT', '');
    document.querySelector('#current_icon').src=`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    document.querySelector('#current_condition').innerText = data.weather[0].description;
    document.querySelector('#current_temp').innerText = `${Math.round(data.main.temp)}°${tempUnit}`;
    document.querySelector('#current_humidity').innerText = `${data.main.humidity}%`;
    document.querySelector('#current_wind_speed').innerText = `${Math.round(data.wind.speed)}m/s`;


};
// Generate a unique cache key based on latitude, longitude, and forecast mode
function getCacheKey(lat, lon, mode) {
    return `${lat}_${lon}_${mode}`;
}

// Fetch hourly forecast data from Open-Meteo
async function fetchHourlyForecast(url) {
    const key = getCacheKey(myLat, myLon, 'hourly');
    if (forecastCache[key]) {
        console.log('Using cached data');
        displayHourlyForecast(forecastCache[key]);
        return;
    }
    const response = await fetch(url);
    const data = await response.json();
    forecastCache[key] = data;
    console.log(data);
    console.log('Data stored in cache with key:', key);
    
    displayHourlyForecast(data);
    function displayHourlyForecast(data) {
        if (!data || data.length === 0) {
            console.error('No data found');
            return;
        } else {
            const chartData = {
                labels: data.hourly.time.map(t => t.slice(11, 13)),
                datasets: [
                    {
                        name: "Temperature (°C)",
                        values: data.hourly.temperature_2m,
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
}
// Fetch daily forecast data from Open-Meteo
async function fetchDailyForecast(url) {
    const key = getCacheKey(myLat, myLon, 'daily')

    if (forecastCache[key]) {
        console.log('Using cached data');
        displayDailyForecast(forecastCache[key]);
        return;
    }
    const response = await fetch(url);
    const data = await response.json();
    forecastCache[key] = data;
    console.log(data);
    console.log('Data stored in cache with key:', key);
    displayDailyForecast(data);
    function displayDailyForecast(data) {
        if (!data || data.length === 0) {
            console.error('No data found');
            return;
        } else {
            const weekdayLabels = data.daily.time.map(t => {
                const weekday = new Date(t.slice(0, 10)).toLocaleDateString('en-US', { weekday: 'short' });
                return weekday;
            });

            const chartData = {
                
                labels: weekdayLabels,
                datasets: [
                    { name: "Max", values: data.daily.temperature_2m_max, chartType: 'line' },
                    { name: "Min", values: data.daily.temperature_2m_min, chartType: 'line' },
                    { name: "Precipitation (mm)", values: data.daily.precipitation_sum, chartType: 'bar' }
                ]

            }
            if (viewToggle === "chart") {
            createChart(chartData);
            } else {
            createDailyTable(data);
        }

        }
    }
}
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
function createHourlyTable(data) {
    const tableContainer = document.getElementById('chart');
    tableContainer.innerHTML = '';
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');

    // Loop through hourly data and create rows
    for (let i = 0; i < data.hourly.time.length; i++) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data.hourly.time[i].slice(11, 16)}</td>
            <td><img src="/PNG/${data.hourly.weather_code[i]}.png"></td>
            <td>${Math.round(data.hourly.temperature_2m[i])}°${tempUnit}</td>
            <td>${data.hourly.precipitation[i]}mm</td>
        `;
        tbody.appendChild(row);
    }

    //table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
}
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
        row.innerHTML = `
            <td>${weekday}</td>
            <td><img src="/PNG/${data.daily.weather_code[i]}.png"></td>
            <td>${Math.round(data.daily.temperature_2m_min[i])}...${Math.round(data.daily.temperature_2m_max[i])}°${tempUnit}</td>
            <td>${data.daily.precipitation_sum[i]}mm</td>
        `;
        tbody.appendChild(row);
    }

    //table.appendChild(thead);
    //table.appendChild(thead);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
}
/* async function fetchIMForecast(url) {
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Weather app project, (https://github.com/jiiquu/LUT-WPC-PROJECT)'
        }
    });
    const data = await response.json();
    console.log(data);
    //displayIMForecast(data);
} */
document.getElementById('search_form').addEventListener('submit', async(event) => {
    event.preventDefault();
    const city = document.getElementById('city_input').value;
    if (city !== '') {
        const OWMCurrentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OWMAPIKey}&units=metric`;
        const response = await fetch(OWMCurrentWeatherUrl);
        const data = await response.json();
        displayCurrentWeather(data);
        myLat = data.coord.lat;
        myLon = data.coord.lon;
        const hourlyForecastOMUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&hourly=weather_code,temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,is_day&timezone=auto&forecast_days=1&wind_speed_unit=ms`;
        const dailyForecastOMUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7&wind_speed_unit=ms`;
        if (forecastMode === "24h") {
            fetchHourlyForecast(hourlyForecastOMUrl);
        } else {
            fetchDailyForecast(dailyForecastOMUrl);
        }
        
    }
    else {
        return;
    }
    

})

document.getElementById('toggle_view').addEventListener('click', () => {
    viewToggle = (viewToggle === "chart") ? "list" : "chart";
    const hourlyUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&hourly=weather_code,temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,is_day&timezone=auto&forecast_days=1&wind_speed_unit=ms`;
    const dailyUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7&wind_speed_unit=ms`;
    if (forecastMode === "24h") {
        fetchHourlyForecast(hourlyUrl);
    } else {
        fetchDailyForecast(dailyUrl);
    }
}
)
/* document.getElementById('toggle_list').addEventListener('click', () => {
    viewToggle = "list";
    
        if (forecastMode === "24h") {
            const hourlyUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&hourly=weather_code,temperature_2m,precipitation,wind_speed_10m,wind_direction_10m&timezone=auto&forecast_days=1&wind_speed_unit=ms`;
            fetchHourlyForecast(hourlyUrl);
        } else {
            const dailyUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7&wind_speed_unit=ms`;
            fetchDailyForecast(dailyUrl);
        }

}); */
document.getElementById('toggle_forecast').addEventListener('click', () => {
    forecastMode = (forecastMode === "24h") ? "7d" : "24h";
    const hourlyUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&hourly=weather_code,temperature_2m,precipitation,wind_speed_10m,wind_direction_10m,is_day&timezone=auto&forecast_days=1&wind_speed_unit=ms`;
    const dailyUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto&forecast_days=7&wind_speed_unit=ms`;

    if (forecastMode === "24h") {
        fetchHourlyForecast(hourlyUrl);
    } else {
        fetchDailyForecast(dailyUrl);
}
});

init();


//const OMCurrentWeatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&current=temperature_2m,is_day,rain,weather_code,wind_speed_10m&wind_speed_unit=ms`;
//const OWMCurrentWeatherUrl = 'https://api.openweathermap.org/data/2.5/weather?q=Helsinki&appid=58111013c30dffa44e8a1d78e22ce00c&units=metric';
