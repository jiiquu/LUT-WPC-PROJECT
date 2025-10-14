
var myLat = 19.43;
var myLon = 99.13;
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      console.log("Latitude:", position.coords.latitude);
      myLat = position.coords.latitude;
      console.log("Longitude:", position.coords.longitude);
      myLon = position.coords.longitude;
      fetchOMCurrentWeather();

    },
    (error) => {
      console.error("Error getting location:", error);
      fetchOMCurrentWeather();

    }
  );
} else {
  console.log("Geolocation is not supported by this browser.");
  fetchOMCurrentWeather();

}

const MIUrl = 'https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=60.10&lon=9.58';
const OWMUrl = 'https://api.openweathermap.org/data/2.5/weather?q=Helsinki&appid=58111013c30dffa44e8a1d78e22ce00c&units=metric';



async function fetchOMCurrentWeather() {
    const OMCurrentWeatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${myLat}&longitude=${myLon}&current=temperature_2m,is_day,rain,weather_code,wind_speed_10m&wind_speed_unit=ms`;
    const response = await fetch(OMCurrentWeatherUrl);
    //const response = await fetch(MIUrl);
    const data = await response.json();
    console.log(data);
    displayCurrentWeather(data);
    //document.getElementById('weather').innerText = `Current temperature: ${data.current.temperature_2m}°C, Wind Speed: ${data.current.wind_speed_10m}`;
}    
async function fetchOWMCurrentWeather() {
    const response = await fetch(OWMUrl);
    const data = await response.json();
    console.log(data);
    //displayCurrentWeather(data);

};
function displayCurrentWeather(data) {
    //const div = document.getElementById('current');
    document.querySelector('#current_temp').innerText = data.current.temperature_2m;
    document.querySelector('#current_rainfall').innerText = data.current.rain;
    document.querySelector('#current_wind_speed').innerText = data.current.wind_speed_10m;

    

}
    
    //const table = document.createElement('table');
   /*  for (const [key, value] of Object.entries(data.current)) {
        //console.log(key, value);
        const row = document.createElement('tr');
        const keyCell = document.createElement('td');
        keyCell.innerText = key;
        const valueCell = document.createElement('td');
        valueCell.innerText = value;
        row.appendChild(keyCell);
        row.appendChild(valueCell);
        table.appendChild(row);
        div.appendChild(table); */
    //}