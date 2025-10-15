
var myLat = 48.86;
var myLon = 2.35;
const OWMAPIKey = '58111013c30dffa44e8a1d78e22ce00c';
const OWMCurrentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${myLat}&lon=${myLon}&appid=${OWMAPIKey}&units=metric`;
const hourlyForecastOMUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&hourly=temperature_2m,precipitation&timezone=auto&forecast_days=1&wind_speed_unit=ms`;
// const now = new Date();
/* now.setMinutes(0, 0, 0);
const today = now.toISOString().slice(0, 10);
const timeNow = now.toISOString().slice(0, 16);
console.log(timeNow);
 */
function init() {
    let lat = myLat;
    let lon = myLon;
    function fetchInitialWeather(lat, lon) {
        const OWMCurrentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OWMAPIKey}&units=metric`;
        fetchCurrentWeather(OWMCurrentWeatherUrl);
        const hourlyForecastOMUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation&timezone=auto&wind_speed_unit=ms&forecast_hours=24`;
        fetchHourlyForecast(hourlyForecastOMUrl);
    }
// Get user location, update coordinates, fallback to default if error
    if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
        console.log("Latitude:", position.coords.latitude);
        lat = position.coords.latitude;
        console.log("Longitude:", position.coords.longitude);
        lon = position.coords.longitude;
        fetchInitialWeather(lat, lon);
        },
        (error) => {
        console.error("Error getting location:", error);
        fetchInitialWeather(lat, lon);

        }
    );
    } else {
        console.log("Geolocation is not supported by this browser.");
        fetchInitialWeather(lat, lon);

    }
    
}


async function fetchCurrentWeather(url) {

    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    displayCurrentWeather(data);
}
    
function displayCurrentWeather(data) {
//const div = document.getElementById('current');
    if (!data || data.length === 0) {
        console.error('No data found');
        return;
    }
    document.querySelector('#city').innerText = data.name + ', ' + data.sys.country;
    document.querySelector('#current_time').innerText = new Date((data.dt + data.timezone) * 1000).toUTCString().replace('GMT', '');
    document.querySelector('#current_icon').src=`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    document.querySelector('#current_condition').innerText = data.weather[0].description;
    document.querySelector('#current_temp').innerText = data.main.temp;
    document.querySelector('#current_humidity').innerText = data.main.humidity;
    document.querySelector('#current_wind_speed').innerText = data.wind.speed;


};

async function fetchHourlyForecast(url) {
    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
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
            createHourlyChart(chartData);
        }
    }
    
}
function createHourlyChart(chartData) {
     window.chart = new frappe.Chart("#chart", {
        title: 'Weather next 24 hours',
        data: chartData,
        type: 'line',
        height: 450,
        colors: ['#eb5146'],
    })
}

document.getElementById('search_form').addEventListener('submit', async(event) => {
    event.preventDefault();
    const city = document.getElementById('city_input').value;
    if (city !== '') {
        const OWMCurrentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OWMAPIKey}&units=metric`;
        const response = await fetch(OWMCurrentWeatherUrl);
        const data = await response.json();
        displayCurrentWeather(data);
        const lat = data.coord.lat;
        const lon = data.coord.lon;
        const hourlyForecastOMUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation&timezone=auto&wind_speed_unit=ms&forecast_hours=24`;
        fetchHourlyForecast(hourlyForecastOMUrl);
    }
    else {
        return;
    }
    

})

init();

// const MIUrl = 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=60.10&lon=9.58';
//const OMCurrentWeatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&current=temperature_2m,is_day,rain,weather_code,wind_speed_10m&wind_speed_unit=ms`;
//const OWMCurrentWeatherUrl = 'https://api.openweathermap.org/data/2.5/weather?q=Helsinki&appid=58111013c30dffa44e8a1d78e22ce00c&units=metric';
