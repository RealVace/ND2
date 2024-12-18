document.addEventListener("DOMContentLoaded", () => {
    const dailyForecastContainer = document.getElementById("daily-forecast-container");
    const currentWeatherCard = document.getElementById("current-weather-card");
    const cityInput = document.getElementById("city-input");
    const searchButton = document.getElementById("search-button");
    const autocompleteList = document.getElementById("autocomplete-list");
    const themeToggle = document.getElementById("theme-toggle");
    const clockDisplay = document.getElementById("clock");
    const tempUnitToggle = document.getElementById("temp-unit-toggle"); 

    const apiKey = "d4bac581aee6e8976c3822422c2835ee"; 
    let isCelsius = true; 

    
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        document.body.classList.add(savedTheme);
    }

    const toggleTheme = () => {
        document.body.classList.toggle("dark-mode");
        const currentTheme = document.body.classList.contains("dark-mode") ? "dark-mode" : "light-mode";
        localStorage.setItem("theme", currentTheme); 
        themeToggle.textContent = currentTheme === "dark-mode" ? "☀️" : "🌙"; 
    };

    themeToggle.addEventListener("click", toggleTheme);

    const getDayName = (dateString) => {
        const days = ["Sekmadienis", "Pirmadienis", "Antradienis", "Trečiadienis", "Ketvirtadienis", "Penktadienis", "Šeštadienis"];
        return days[new Date(dateString).getDay()]; 
    };

    const formatTime = (dateString) => {
        const time = new Date(dateString).toLocaleTimeString("lt-LT", { hour: "2-digit", minute: "2-digit" });
        return time.slice(0, 5); 
    };

    const fetchWeather = (city) => {
        const apiURL = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;
        fetch(apiURL)
            .then(response => response.json())
            .then(data => {
                const cityName = data.city.name;
                const country = data.city.country;

                
                currentWeatherCard.innerHTML = `
                    <h3>${cityName}, ${country}</h3>
                    <div>
                        <img src="https://openweathermap.org/img/wn/${data.list[0].weather[0].icon}@2x.png" alt="weather icon">
                        <p>${convertTemp(data.list[0].main.temp)}°${isCelsius ? 'C' : 'F'}</p>
                        <p>Jaučiasi kaip: ${convertTemp(data.list[0].main.feels_like)}°${isCelsius ? 'C' : 'F'}</p>
                    </div>
                    <div class="additional-info">
                        <div class="icon">
                            <img src="https://img.icons8.com/dotty/80/rainmeter.png" alt="humidity"/>
                            <p>${data.list[0].main.humidity}%</p>
                        </div>
                    </div>
                `;

                
                dailyForecastContainer.innerHTML = "";
                data.list.forEach((entry, index) => {
                    if (index % 8 === 0) { 
                        const dayName = getDayName(entry.dt_txt);
                        const dayIcon = entry.weather[0].icon;
                        const dayTemp = entry.main.temp;

                        const dayCard = document.createElement("div");
                        dayCard.classList.add("day-card");
                        dayCard.innerHTML = `
                            <h3>${dayName}</h3>
                            <img src="https://openweathermap.org/img/wn/${dayIcon}@2x.png" alt="${dayName} icon">
                            <p>${convertTemp(dayTemp)}°${isCelsius ? 'C' : 'F'}</p>
                        `;

                       
                        dayCard.addEventListener("click", () => {
                            const hourlyForecast = data.list.filter(hour => hour.dt_txt.startsWith(entry.dt_txt.split(" ")[0]));
                            const hourlyDetails = hourlyForecast.map(hour => `
                                <div class="icon">
                                    <img src="https://openweathermap.org/img/wn/${hour.weather[0].icon}.png" alt="hourly weather icon">
                                    <p>${formatTime(hour.dt_txt)}: ${convertTemp(hour.main.temp)}°${isCelsius ? 'C' : 'F'}</p>
                                </div>
                            `).join("");

                            const modal = document.createElement("div");
                            modal.classList.add("modal");
                            modal.innerHTML = `
                                <div class="modal-content">
                                    <span class="close">&times;</span>
                                    <h3>${dayName}</h3>
                                    ${hourlyDetails}
                                </div>
                            `;
                            document.body.appendChild(modal);

                            const closeModal = modal.querySelector(".close");
                            closeModal.addEventListener("click", () => {
                                modal.remove();
                            });

                            
                            document.addEventListener("keydown", function onEscape(event) {
                                if (event.key === "Escape") {
                                    modal.remove();
                                    document.removeEventListener("keydown", onEscape); 
                                }
                            });
                        });

                        dailyForecastContainer.appendChild(dayCard);
                    }
                });
            });
    };

    const fetchCities = (query) => {
        const apiURL = `https://api.openweathermap.org/data/2.5/find?q=${query}&type=like&units=metric&appid=${apiKey}`;
        fetch(apiURL)
            .then(response => response.json())
            .then(data => {
                autocompleteList.innerHTML = "";
                data.list.forEach(city => {
                    const listItem = document.createElement("div");
                    listItem.classList.add("autocomplete-item");
                    listItem.textContent = `${city.name}, ${city.sys.country}`;
                    listItem.addEventListener("click", () => {
                        cityInput.value = `${city.name}, ${city.sys.country}`;
                        fetchWeather(city.name);
                        autocompleteList.innerHTML = "";
                    });
                    autocompleteList.appendChild(listItem);
                });
            });
    };

    cityInput.addEventListener("input", () => {
        const query = cityInput.value;
        if (query.length >= 3) {
            fetchCities(query);
            autocompleteList.style.display = "block";
        } else {
            autocompleteList.style.display = "none";
        }
    });

    searchButton.addEventListener("click", () => {
        fetchWeather(cityInput.value);
    });

    
    const convertTemp = (tempInCelsius) => {
        if (isCelsius) {
            return tempInCelsius.toFixed(1);
        } else {
            return ((tempInCelsius * 9/5) + 32).toFixed(1);
        }
    };

    
    tempUnitToggle.addEventListener("click", () => {
        isCelsius = !isCelsius;
        tempUnitToggle.textContent = isCelsius ? "Switch to °F" : "Switch to °C";
        const currentCity = cityInput.value;
        if (currentCity) {
            fetchWeather(currentCity); 
        }
    });

    
    const updateClock = () => {
        const now = new Date();
        const hours = now.getHours().toString().padStart(2, "0");
        const minutes = now.getMinutes().toString().padStart(2, "0");
        const seconds = now.getSeconds().toString().padStart(2, "0");
        clockDisplay.textContent = `${hours}:${minutes}:${seconds}`;
    };

    
    setInterval(updateClock, 1000);
    updateClock(); 
});
