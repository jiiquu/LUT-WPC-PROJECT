
var myLat = 19.43;
var myLon = 99.13;
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("Latitude:", position.coords.latitude);
      myLat = position.coords.latitude;
      console.log("Longitude:", position.coords.longitude);
      myLon = position.coords.longitude;
      const OWMCurrentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${myLat}&lon=${myLon}&appid=58111013c30dffa44e8a1d78e22ce00c&units=metric`;
      fetchCurrentWeather(OWMCurrentWeatherUrl);

    },
    (error) => {
      console.error("Error getting location:", error);
      const OWMCurrentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${myLat}&lon=${myLon}&appid=58111013c30dffa44e8a1d78e22ce00c&units=metric`;
      fetchCurrentWeather(OWMCurrentWeatherUrl);

    }
  );
} else {
    console.log("Geolocation is not supported by this browser.");
    const OWMCurrentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${myLat}&lon=${myLon}&appid=58111013c30dffa44e8a1d78e22ce00c&units=metric`;
    fetchCurrentWeather(OWMCurrentWeatherUrl);

}

const MIUrl = 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=60.10&lon=9.58';


//const OMCurrentWeatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&current=temperature_2m,is_day,rain,weather_code,wind_speed_10m&wind_speed_unit=ms`;
//const OWMCurrentWeatherUrl = 'https://api.openweathermap.org/data/2.5/weather?q=Helsinki&appid=58111013c30dffa44e8a1d78e22ce00c&units=metric';


async function fetchCurrentWeather(url) {

    const response = await fetch(url);
    const data = await response.json();
    console.log(data);
    displayCurrentWeather(data);
    
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

}

document.getElementById('search_form').addEventListener('submit', async(event) => {
    event.preventDefault();
    const city = document.getElementById('city_input').value;
    if (city !== '') {
        const OWMCurrentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=58111013c30dffa44e8a1d78e22ce00c&units=metric`;
        fetchCurrentWeather(OWMCurrentWeatherUrl);
    }
    else {
        return;
    }
    

})

