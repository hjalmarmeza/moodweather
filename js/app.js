/* =========================================
   PARTICLE SYSTEM (Embedded)
   ========================================= */
class ParticleSystem {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return; // Safety
        this.ctx = this.canvas.getContext('2d');
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.particles = [];
        this.activeType = 'none';

        this._resize();
        window.addEventListener('resize', () => this._resize());
        this._animate();
    }

    _resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }

    setType(type) {
        this.activeType = type;
        this.particles = [];
        const count = type === 'rain' ? 300 : (type === 'snow' ? 100 : 0);

        for (let i = 0; i < count; i++) {
            this.particles.push(this._createParticle(type));
        }
    }

    _createParticle(type) {
        return {
            x: Math.random() * this.width,
            y: Math.random() * this.height,
            speedY: type === 'rain' ? Math.random() * 15 + 10 : Math.random() * 2 + 1,
            speedX: type === 'rain' ? 0 : Math.random() * 1 - 0.5,
            size: type === 'rain' ? Math.random() * 2 + 1 : Math.random() * 3 + 2,
            opacity: Math.random() * 0.5 + 0.1
        };
    }

    _animate() {
        if (!this.ctx) return;
        this.ctx.clearRect(0, 0, this.width, this.height);

        if (this.activeType !== 'none') {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.beginPath();

            this.particles.forEach(p => {
                p.y += p.speedY;
                p.x += p.speedX;

                if (p.y > this.height) {
                    p.y = -10;
                    p.x = Math.random() * this.width;
                }

                this.ctx.moveTo(p.x, p.y);
                if (this.activeType === 'rain') {
                    this.ctx.rect(p.x, p.y, 1, p.size * 5);
                } else {
                    this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                }
            });

            this.ctx.globalAlpha = 0.6;
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        }

        requestAnimationFrame(() => this._animate());
    }
}

/* =========================================
   MOODWEATHER APP LOGIC (SINGLE FILE)
   ========================================= */

const CONFIG = {
    geoApi: 'https://geocoding-api.open-meteo.com/v1/search',
    weatherApi: 'https://api.open-meteo.com/v1/forecast',
    reverseGeoApi: 'https://nominatim.openstreetmap.org/reverse'
};

const state = {
    currentCity: '',
    lat: null,
    lon: null,
    weatherCode: 0,
    isZen: false,
    lastVideoId: null
};

let el = {};
let particles = null;

// --- SAVED CITIES LOGIC ---
let savedCities = JSON.parse(localStorage.getItem('moodWeatherFavs')) || [];

function init() {
    console.log("Initializing MoodWeather...");

    // 1. Elements
    // 1. Elements
    el = {
        input: document.getElementById('city-search'),
        btnSearch: document.getElementById('btn-search'),
        cityName: document.getElementById('city-name'),
        temp: document.getElementById('temperature'),
        tempMax: document.getElementById('temp-max'),
        tempMin: document.getElementById('temp-min'),
        desc: document.getElementById('weather-desc'),
        icon: document.getElementById('weather-icon'),
        quote: document.getElementById('quote'),
        video: document.getElementById('bg-visual'),
        btnZen: document.getElementById('btn-zen'),
        appMain: document.querySelector('.glass-container'),
        dateTime: document.getElementById('date-time'),
        favList: document.getElementById('favorites-list'), // New Drawer List
        btnMenu: document.getElementById('btn-menu'),
        btnCloseDrawer: document.getElementById('btn-close-drawer'),
        drawer: document.getElementById('cities-drawer'),
        btnToggleFav: document.getElementById('btn-toggle-fav')
    };

    // 2. Particless
    particles = new ParticleSystem('particles-canvas');

    // 3. Listeners
    setupListeners();

    // 4. Render Favs
    renderFavorites();

    // 5. Clock
    updateClock();
    setInterval(updateClock, 1000);

    // 6. Setup Audio (but don't play yet)
    const ambientAudio = setupAudio();

    // LANDING GATE: Explicit Start for Autoplay
    const overlay = document.getElementById('landing-overlay');
    const startApp = () => {
        console.log("Starting app...");

        // Unlock Video
        if (el.video) {
            el.video.muted = true;
            el.video.play().then(() => {
                console.log("Video playing");
            }).catch(e => console.log("Gate unlock failed", e));
        }

        // Start Ambient Audio
        if (ambientAudio) {
            console.log("Attempting to play audio...");
            ambientAudio.play().then(() => {
                console.log("Audio playing successfully");
            }).catch(e => {
                console.log("Audio autoplay blocked:", e);
                // Retry with lower volume
                ambientAudio.volume = 0.2;
                ambientAudio.play().catch(err => console.log("Audio retry failed", err));
            });
        }

        // Hide Overlay
        if (overlay) {
            overlay.classList.add('hidden');
            setTimeout(() => overlay.remove(), 1000);
        }
    };

    if (overlay) {
        overlay.addEventListener('click', startApp);
        overlay.addEventListener('touchstart', startApp);
    } else {
        document.addEventListener('click', startApp, { once: true });
    }

    // 7. START
    startExperience();
}

// AUTOCOMPLETE VARIABLES
let debounceTimer;

function setupListeners() {
    // 1. Input Autocomplete
    if (el.input) {
        el.input.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            clearTimeout(debounceTimer);
            if (query.length < 3) {
                document.getElementById('suggestions').classList.remove('active');
                return;
            }
            debounceTimer = setTimeout(() => fetchSuggestions(query), 300);
        });

        document.addEventListener('click', (e) => {
            if (!el.input.contains(e.target)) document.getElementById('suggestions').classList.remove('active');
        });

        el.input.onkeypress = (e) => {
            if (e.key === 'Enter') {
                document.getElementById('suggestions').classList.remove('active');
                searchCity();
            }
        };
    }

    // 2. Drawer Logic
    if (el.btnMenu) el.btnMenu.onclick = () => el.drawer.classList.add('open');
    if (el.btnCloseDrawer) el.btnCloseDrawer.onclick = () => el.drawer.classList.remove('open');

    // 3. Toggle Favorite Button
    if (el.btnToggleFav) {
        el.btnToggleFav.onclick = () => {
            const current = state.currentCity || el.cityName.textContent;
            if (!current || current === "--" || current === "Tu Ubicación") return;

            if (savedCities.includes(current)) {
                // Remove
                savedCities = savedCities.filter(c => c !== current);
            } else {
                // Add
                savedCities.push(current);
            }
            localStorage.setItem('moodWeatherFavs', JSON.stringify(savedCities));
            renderFavorites();
            updateFavoritesIcon(current);
        };
    }

    // Zen
    if (el.btnZen) el.btnZen.onclick = toggleZen;

    // Drawer Geo Button
    const btnGeoDrawer = document.getElementById('btn-geo-drawer');
    if (btnGeoDrawer) btnGeoDrawer.onclick = () => {
        el.drawer.classList.remove('open');
        el.input.value = '';
        startExperience();
    };

    // Floating Widget
    const floatingWidget = document.getElementById('floating-widget');
    const widgetToggle = document.getElementById('widget-toggle');

    // Show widget on scroll
    let scrollTimeout;
    window.addEventListener('scroll', () => {
        if (!floatingWidget) return;

        clearTimeout(scrollTimeout);

        if (window.scrollY > 400) {
            floatingWidget.classList.remove('hidden');
        } else {
            floatingWidget.classList.add('hidden');
        }
    });

    // Toggle minimize/expand
    if (widgetToggle) {
        widgetToggle.onclick = () => {
            floatingWidget.classList.toggle('minimized');
        };
    }



    // Exit Zen
    let exitBtn = document.getElementById('btn-zen-exit');
    if (!exitBtn) {
        exitBtn = document.createElement('button');
        exitBtn.id = 'btn-zen-exit';
        exitBtn.innerHTML = '<span class="material-icons-round">close</span>';
        document.body.appendChild(exitBtn);
        exitBtn.onclick = toggleZen;
    }
}

function setupAudio() {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2499/2499-preview.mp3');
    audio.loop = true;
    audio.volume = 0.3;
    return audio;
}


// --- AUTOCOMPLETE LOGIC ---
async function fetchSuggestions(query) {
    try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=es&format=json`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.results) {
            renderSuggestions(data.results);
        } else {
            document.getElementById('suggestions').classList.remove('active');
        }
    } catch (e) {
        console.error("Autocomplete error", e);
    }
}

function renderSuggestions(cities) {
    const list = document.getElementById('suggestions');
    list.innerHTML = '';

    cities.forEach(city => {
        const li = document.createElement('li');
        const country = city.country || '';
        // Flag emoji from country code if available? Simplified:
        li.innerHTML = `
            <span>${city.name}</span>
            <span class="country">${country}</span>
        `;

        li.onclick = () => {
            // Select City: Use Lat/Lon directly!
            el.input.value = `${city.name}, ${country}`;
            list.classList.remove('active');

            // Trigger Weather Load directly by coords
            state.lastVideoId = null; // Reset video cache when changing cities
            fetchWeatherData(city.latitude, city.longitude);
            state.currentCity = city.name; // Update Display Name override
        };

        list.appendChild(li);
    });

    list.classList.add('active');
}


function renderFavorites() {
    if (!el.favList) return;
    el.favList.innerHTML = '';

    if (savedCities.length === 0) {
        el.favList.innerHTML = '<div style="padding:20px; text-align:center; opacity:0.5; font-size:0.9rem">No tienes ciudades guardadas</div>';
        return;
    }

    savedCities.forEach(city => {
        const row = document.createElement('div');
        row.className = 'fav-card-row';
        row.innerHTML = `
            <span class="city-name">${city}</span>
            <span class="material-icons-round remove-btn" title="Eliminar">delete_outline</span>
        `;

        // Click on row -> Load City
        row.onclick = (e) => {
            el.drawer.classList.remove('open');
            el.input.value = city;
            searchCityExternal(city);
        };

        // Click on bin -> Delete
        const btnDelete = row.querySelector('.remove-btn');
        btnDelete.onclick = (e) => {
            e.stopPropagation();
            savedCities = savedCities.filter(c => c !== city);
            localStorage.setItem('moodWeatherFavs', JSON.stringify(savedCities));
            renderFavorites();
            // Re-check icon if we deleted the current city
            updateFavoritesIcon(state.currentCity || el.cityName.textContent);
        };

        el.favList.appendChild(row);
    });
}

function updateFavoritesIcon(cityName) {
    if (!el.btnToggleFav) return;
    const icon = el.btnToggleFav.querySelector('.material-icons-round');
    if (!icon) return;

    if (savedCities.includes(cityName)) {
        icon.textContent = 'favorite'; // Filled
        el.btnToggleFav.style.opacity = '1';
        el.btnToggleFav.style.color = '#ff6b6b';
    } else {
        icon.textContent = 'favorite_border'; // Outline
        el.btnToggleFav.style.opacity = '0.7';
        el.btnToggleFav.style.color = 'white';
    }
}

async function startExperience() {
    updateStatus("Detectando ubicación...");

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                fetchWeatherData(latitude, longitude);
            },
            (err) => {
                console.warn("Geolocation error:", err.message);
                if (err.code === 1) { // PERMISSION_DENIED
                    updateStatus("Permiso de ubicación denegado. Usando ciudad por defecto...");
                } else if (err.code === 2) { // POSITION_UNAVAILABLE
                    updateStatus("Ubicación no disponible. Usando ciudad por defecto...");
                } else if (err.code === 3) { // TIMEOUT
                    updateStatus("Tiempo de espera agotado. Usando ciudad por defecto...");
                }
                // Fallback to Madrid (Spain) as default
                searchCityExternal('Madrid');
            },
            {
                timeout: 8000,
                enableHighAccuracy: false,
                maximumAge: 60000
            }
        );
    } else {
        updateStatus("Geolocalización no disponible. Usando ciudad por defecto...");
        searchCityExternal('Madrid');
    }
}

async function searchCity() {
    const term = el.input.value.trim();
    if (!term) return;
    searchCityExternal(term);
}

async function searchCityExternal(term) {
    updateStatus("Buscando ciudad...");
    try {
        const res = await fetch(`${CONFIG.geoApi}?name=${encodeURIComponent(term)}&count=1&language=es&format=json`);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            const loc = data.results[0];
            state.currentCity = loc.name; // Track for saving
            state.lastVideoId = null; // Reset video cache when changing cities
            el.cityName.textContent = loc.name;
            fetchWeatherData(loc.latitude, loc.longitude, loc.name);
        } else {
            updateStatus("Ciudad no encontrada");
        }
    } catch (e) {
        console.error(e);
        updateStatus("Error de conexión");
    }
}

async function fetchWeatherData(lat, lon, nameOverride = null) {
    try {
        updateStatus("Descargando clima...");

        // --- ROBUST REQUEST: Get everything needed ---
        // We use hourly variables for "current" stats to be safe, selecting the current hour index.
        const res = await fetch(`${CONFIG.weatherApi}?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,wind_gusts_10m,wind_direction_10m,weathercode,visibility,precipitation,is_day&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,precipitation_sum&timezone=auto`);

        const data = await res.json();
        const weather = data.current_weather;
        const hourly = data.hourly || {};
        const daily = data.daily || {};

        // Extract real-time details
        const nowIso = new Date().toISOString().slice(0, 13);
        let nowIndex = hourly.time.findIndex(t => t.startsWith(nowIso));
        if (nowIndex === -1) nowIndex = 0;

        const currentDetails = {
            humidity: hourly.relative_humidity_2m[nowIndex],
            feels_like: hourly.apparent_temperature[nowIndex],
            wind: hourly.wind_speed_10m[nowIndex],
            wind_gusts: hourly.wind_gusts_10m ? hourly.wind_gusts_10m[nowIndex] : 0,
            wind_direction: hourly.wind_direction_10m ? hourly.wind_direction_10m[nowIndex] : 0,
            vocab: hourly.visibility ? hourly.visibility[nowIndex] : 10000,
            uv: daily.uv_index_max ? daily.uv_index_max[0] : 0
        };

        // Name Resolution
        if (!nameOverride) {
            // Placeholder while resolving
            if (!state.currentCity) el.cityName.textContent = "Tu Ubicación";

            fetch(`${CONFIG.reverseGeoApi}?format=json&lat=${lat}&lon=${lon}&zoom=10`)
                .then(r => r.json())
                .then(d => {
                    const addr = d.address;
                    const resolvedName = addr.city || addr.town || addr.village || addr.state || "Tu Ubicación";

                    // Update State & UI
                    state.currentCity = resolvedName;
                    el.cityName.textContent = resolvedName;

                    // Update Title immediately once resolved
                    if (weather) {
                        document.title = `${Math.round(weather.temperature)}° ${resolvedName}`;
                    }
                })
                .catch(() => { });
        } else {
            // Explicit name provided (Search)
            state.currentCity = nameOverride;
            el.cityName.textContent = nameOverride;
        }

        updateUI(weather, currentDetails, hourly, daily);

        // Load Air Quality Data
        loadAirQuality(lat, lon);

        // Load Wind Map
        loadWindMap(lat, lon);
    } catch (e) {
        console.error("API Error", e);
        updateStatus("Error API");
    }
}

// Load Air Quality Data
async function loadAirQuality(lat, lon) {
    try {
        const res = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,european_aqi`);
        const data = await res.json();

        if (data.current) {
            const aqi = Math.round(data.current.european_aqi || 0);
            const pm25 = Math.round(data.current.pm2_5 || 0);
            const pm10 = Math.round(data.current.pm10 || 0);

            // Update UI
            const aqiValue = document.getElementById('aqi-value');
            const aqiLabel = document.getElementById('aqi-label');
            const pm25Value = document.getElementById('pm25-value');
            const pm10Value = document.getElementById('pm10-value');

            if (aqiValue) aqiValue.textContent = aqi;
            if (pm25Value) pm25Value.textContent = pm25 + ' μg/m³';
            if (pm10Value) pm10Value.textContent = pm10 + ' μg/m³';

            // Set label and color based on AQI
            let label = 'Buena';
            let colorClass = 'aqi-good';
            let description = 'Ideal para actividades al aire libre';

            if (aqi <= 20) {
                label = 'Excelente';
                colorClass = 'aqi-good';
                description = 'Calidad del aire óptima';
            }
            else if (aqi <= 40) {
                label = 'Buena';
                colorClass = 'aqi-moderate';
                description = 'Aire limpio y saludable';
            }
            else if (aqi <= 60) {
                label = 'Moderada';
                colorClass = 'aqi-unhealthy-sensitive';
                description = 'Aceptable para la mayoría';
            }
            else if (aqi <= 80) {
                label = 'Mala';
                colorClass = 'aqi-unhealthy';
                description = 'Evita ejercicio intenso';
            }
            else if (aqi <= 100) {
                label = 'Muy Mala';
                colorClass = 'aqi-very-unhealthy';
                description = 'Limita actividades exteriores';
            }
            else {
                label = 'Peligrosa';
                colorClass = 'aqi-hazardous';
                description = 'Permanece en interiores';
            }

            const aqiDescription = document.getElementById('aqi-description');

            if (aqiLabel) {
                aqiLabel.textContent = label;
                aqiLabel.className = 'aqi-label ' + colorClass;
            }
            if (aqiValue) {
                aqiValue.className = 'aqi-value ' + colorClass;
            }
            if (aqiDescription) {
                aqiDescription.textContent = description;
            }
        }
    } catch (e) {
        console.error("Air Quality API Error", e);
    }
}

// Load Wind Map
function loadWindMap(lat, lon) {
    const iframe = document.getElementById('wind-map');
    if (iframe) {
        // Windy.com embed with wind layer
        const windyUrl = `https://embed.windy.com/embed2.html?lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}&width=650&height=450&zoom=8&level=surface&overlay=wind&product=ecmwf&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1`;
        iframe.src = windyUrl;
    }
}

function updateStatus(msg) {
    if (el.desc) el.desc.textContent = msg;
}

function updateUI(weather, details, hourly, daily) {
    state.weatherCode = weather.weathercode;
    const currentTemp = Math.round(weather.temperature);
    el.temp.textContent = currentTemp;

    // Dynamic Tab Title
    document.title = `${currentTemp}° ${state.currentCity || 'MoodWeather'}`;

    const isDay = weather.is_day !== undefined ? weather.is_day : 1;
    const condition = interpretWeatherCode(weather.weathercode, isDay);

    el.desc.textContent = condition.label;
    el.icon.textContent = condition.icon;
    el.quote.textContent = condition.quote;

    // --- NEW: Header Details (Min/Max) ---
    if (daily && daily.temperature_2m_max) {
        if (el.tempMax) el.tempMax.textContent = Math.round(daily.temperature_2m_max[0]);
        if (el.tempMin) el.tempMin.textContent = Math.round(daily.temperature_2m_min[0]);
    }

    // --- UPDATE FLOATING WIDGET ---
    const widgetTemp = document.getElementById('widget-temp');
    const widgetCondition = document.getElementById('widget-condition');
    const widgetWind = document.getElementById('widget-wind');
    const widgetFeels = document.getElementById('widget-feels');

    if (widgetTemp) widgetTemp.textContent = Math.round(weather.temperature);
    if (widgetCondition) widgetCondition.textContent = condition.label;
    if (widgetWind && details) widgetWind.textContent = `${Math.round(details.wind || 0)} km/h`;
    if (widgetFeels && details) widgetFeels.textContent = `Sensación: ${Math.round(details.feels_like || weather.temperature)}°`;


    // --- UPDATE DETAILS GRID (Fixed Logic) ---
    // --- UPDATE DETAILS GRID (Fixed Logic) ---
    // --- UPDATE DETAILS GRID (Fixed Logic) ---
    if (details) {
        // 1. Humidity
        const elHum = document.getElementById('humidity');
        if (elHum) elHum.textContent = `${details.humidity || '--'}%`;

        // 2. Wind (Hero + Legacy)
        const elWindHero = document.getElementById('wind-speed-hero');
        if (elWindHero) elWindHero.textContent = `${Math.round(details.wind || 0)}`;

        const elWind = document.getElementById('wind') || document.getElementById('wind-speed');
        if (elWind) elWind.textContent = `${Math.round(details.wind || 0)}`;

        // 3. UV Index
        const elUV = document.getElementById('uv-index');
        if (elUV) elUV.textContent = details.uv !== undefined ? Math.round(details.uv) : '--';

        // 4. Visibility
        const elVis = document.getElementById('visibility');
        if (elVis) elVis.textContent = details.vocab !== undefined ? `${(details.vocab / 1000).toFixed(1)}km` : '10km';

        // 5. Feels Like + Explanation
        const elFeels = document.getElementById('apparent-temp');
        const feelsLikeTemp = Math.round(details.feels_like || weather.temperature);
        const actualTemp = Math.round(weather.temperature);
        const windSpeed = Math.round(details.wind || 0);
        const humidity = details.humidity || 50;

        if (elFeels) elFeels.textContent = `${feelsLikeTemp}`;

        // Generate explanation
        const explanationEl = document.getElementById('feels-like-explanation');
        if (explanationEl) {
            const diff = feelsLikeTemp - actualTemp;
            let explanation = '';

            if (Math.abs(diff) <= 1) {
                explanation = '💨 El viento y la humedad están en equilibrio';
            } else if (diff < -1) {
                // Feels colder
                if (windSpeed > 15) {
                    explanation = `🌬️ El viento de ${windSpeed} km/h hace que se sienta ${Math.abs(diff)}° más frío`;
                } else {
                    explanation = `❄️ La combinación de viento y humedad reduce la sensación térmica en ${Math.abs(diff)}°`;
                }
            } else {
                // Feels warmer
                if (humidity > 70) {
                    explanation = `💧 La alta humedad (${humidity}%) hace que se sienta ${diff}° más caluroso`;
                } else {
                    explanation = `☀️ Las condiciones hacen que se sienta ${diff}° más cálido de lo que marca el termómetro`;
                }
            }

            explanationEl.textContent = explanation;
        }
    }

    // --- UPDATE HOURLY FORECAST SCROLL ---
    if (hourly && hourly.time) {
        const container = document.getElementById('hourly-container');
        if (container) {
            container.innerHTML = '';

            // Simply show the first 24 hours from the API data
            // The API already provides data starting from current time in the city's timezone
            const maxHours = Math.min(24, hourly.time.length);

            console.log(`📊 Hourly forecast: showing ${maxHours} hours`);

            for (let i = 0; i < maxHours; i++) {
                if (!hourly.time[i]) break;

                const timeStr = hourly.time[i].split('T')[1]; // HH:00
                const temp = Math.round(hourly.temperature_2m[i]);
                const code = hourly.weathercode[i];
                // Use API is_day if valid, otherwise fallback to 1 (day)
                const isDayHour = (hourly.is_day && hourly.is_day[i] !== undefined) ? hourly.is_day[i] : 1;
                const hourCond = interpretWeatherCode(code, isDayHour);

                const div = document.createElement('div');
                div.className = 'hour-item';
                div.innerHTML = `
                    <span>${timeStr}</span>
                    <span class="material-icons-round">${hourCond.icon}</span>
                    <span>${temp}°</span>
                `;
                container.appendChild(div);
            }
        }
    }

    // --- NEW: UPDATE DAILY FORECAST ---
    if (daily && daily.time) {
        const dailyContainer = document.getElementById('daily-container');
        if (dailyContainer) {
            dailyContainer.innerHTML = '';
            // Show 7 days
            for (let i = 0; i < 7; i++) {
                if (!daily.time[i]) break;

                const dateObj = new Date(daily.time[i]);
                const dayName = dateObj.toLocaleDateString('es-ES', { weekday: 'long' });
                const capDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

                const max = Math.round(daily.temperature_2m_max[i]);
                const min = Math.round(daily.temperature_2m_min[i]);
                const prob = daily.precipitation_probability_max[i];
                const code = daily.weathercode[i];
                const cond = interpretWeatherCode(code, 1);

                // Only show rain % if relevant (>20%)
                const rainHtml = prob > 20 ? `<span class="rain-chance"><span class="material-icons-round" style="font-size:10px">water_drop</span>${prob}%</span>` : '';

                // Calculate bar width/pos based on weekly range (e.g. min 10, max 30)
                // This gives a visual scaling of temp
                const weekMin = Math.min(...daily.temperature_2m_min);
                const weekMax = Math.max(...daily.temperature_2m_max);
                const range = weekMax - weekMin || 1;

                const leftPercent = ((min - weekMin) / range) * 100;
                const widthPercent = ((max - min) / range) * 100;

                const div = document.createElement('div');
                div.className = 'daily-item';
                div.innerHTML = `
                    <span class="day-name">${i === 0 ? 'Hoy' : capDay}</span>
                    <div class="day-icon" style="width:50px">
                        <span class="material-icons-round ${getIconClass(code)}">${cond.icon}</span>
                        ${rainHtml}
                    </div>
                    
                    <!-- PRO TEMP BAR -->
                    <div class="temp-bar-container">
                        <span class="min-temp" style="width:30px; text-align:right">${min}°</span>
                        <div class="temp-bar-bg">
                            <div class="temp-bar-fill" style="margin-left:${leftPercent}%; width:${widthPercent}%"></div>
                        </div>
                        <span class="max-temp" style="width:30px">${max}°</span>
                    </div>
                `;
                dailyContainer.appendChild(div);
            }
        }

        // --- NEW: UPDATE SUN/UV ---
        if (document.getElementById('uv-index')) {
            document.getElementById('uv-index').textContent = daily.uv_index_max[0] || '--';
        }
    }

    // --- CLOUDINARY CONFIG (QUOTA SAFE) ---
    const CLOUD_NAME = 'dveqs8f3n';
    const CLOUD_FOLDER = '';

    // QUOTA SAFE MODE: 'upload' deliver original file.
    const CLOUD_OUPUT_MODE = 'video/upload'; // VIDEO MODE

    function getCloudinaryUrl(filename) {
        // Remove .webp extension if present in ID
        let cleanName = filename.replace('.webp', '');

        const encodedFolder = CLOUD_FOLDER ? encodeURIComponent(CLOUD_FOLDER) + '/' : '';
        const encodedFile = encodeURIComponent(cleanName);

        // Request MP4 Video
        return `https://res.cloudinary.com/${CLOUD_NAME}/${CLOUD_OUPUT_MODE}/v1/${encodedFolder}${encodedFile}.mp4`;
    }

    // VISUAL UPDATE (Video MP4)
    const bgVisual = document.getElementById('bg-visual');
    const cloudId = getWeatherId(state.weatherCode, isDay);
    const fullUrl = getCloudinaryUrl(cloudId);

    console.log('🎬 Video Update Check:', {
        weatherCode: state.weatherCode,
        isDay: isDay,
        cloudId: cloudId,
        lastVideoId: state.lastVideoId,
        needsUpdate: state.lastVideoId !== cloudId
    });

    if (bgVisual && fullUrl) {
        // Check if video needs to change (compare with last loaded video ID)
        if (state.lastVideoId !== cloudId) {
            console.log("✅ Loading NEW Weather VIDEO:", fullUrl, "for weather code:", state.weatherCode);

            // Update last video ID FIRST
            state.lastVideoId = cloudId;

            // Fade out current video
            bgVisual.style.opacity = '0';

            // Wait a bit for fade out, then change source
            setTimeout(() => {
                // 1. Ensure properties for autoplay
                bgVisual.muted = true;
                bgVisual.loop = true;
                bgVisual.playsInline = true;

                // Wait for video to be ready
                bgVisual.onloadeddata = () => {
                    // Fade in new video
                    bgVisual.style.opacity = '1';
                };

                // Wait for metadata/buffer
                bgVisual.oncanplay = () => {
                    const p = bgVisual.play();
                    if (p && p.catch) {
                        p.catch(e => {
                            console.log("🔇 Canplay autoplay blocked (retry muted)");
                            bgVisual.muted = true;
                            // Try again with muted, and catch this one too
                            const retry = bgVisual.play();
                            if (retry && retry.catch) {
                                retry.catch(() => {
                                    console.log("⚠️ Video autoplay completely blocked. User interaction needed.");
                                });
                            }
                        });
                    }
                };

                // 2. Set Source & Load
                bgVisual.src = fullUrl;
                bgVisual.load();

                // 3. Immediate attempt
                const playPromise = bgVisual.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        console.log("🎬 Immediate autoplay blocked (normal). Will retry when video is ready.");
                        bgVisual.muted = true;
                    });
                }
            }, 300); // Wait 300ms for fade out

        } else {
            console.log("⏭️ SKIPPING video update - same video already loaded:", cloudId);
        }

    }

    if (particles && condition) particles.setType(condition.particle);

    // --- UPDATE WIND DETAILS ---
    if (details) {
        // Wind compass
        const windSpeedDisplay = document.getElementById('wind-speed-display');
        const windCurrent = document.getElementById('wind-current');
        const windGusts = document.getElementById('wind-gusts');
        const windDirection = document.getElementById('wind-direction');
        const windArrow = document.getElementById('wind-arrow');

        const windSpeed = Math.round(details.wind || 0);
        const gustSpeed = Math.round(details.wind_gusts || 0);
        const direction = Math.round(details.wind_direction || 0);

        if (windSpeedDisplay) windSpeedDisplay.textContent = windSpeed;
        if (windCurrent) windCurrent.textContent = `${windSpeed} km/h`;
        if (windGusts) windGusts.textContent = `${gustSpeed} km/h`;
        if (windDirection) windDirection.textContent = `${direction}°`;

        // Rotate arrow to show wind direction
        if (windArrow) {
            // The arrow points where the wind is GOING TO (not coming from)
            // Add 180° if your arrow graphic points up by default
            const rotation = direction; // Adjust if needed: direction + 180
            windArrow.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
            console.log('🧭 Wind Direction:', direction, '° - Arrow rotation:', rotation, '°');
        }

        // Add wind comment
        const windComment = document.getElementById('wind-comment');
        if (windComment) {
            let comment = '';
            if (windSpeed < 10) {
                comment = '🍃 Viento suave, ideal para pasear';
            } else if (windSpeed < 20) {
                comment = '💨 Viento moderado, condiciones agradables';
            } else if (windSpeed < 30) {
                comment = '🌬️ Viento fresco, abrígate bien';
            } else if (windSpeed < 40) {
                comment = '⚠️ Viento fuerte, precaución al aire libre';
            } else {
                comment = '🚨 Viento muy fuerte, evita salir';
            }
            windComment.textContent = comment;
        }
    }

    // --- UPDATE SUN TIMES ---
    if (daily && daily.sunrise && daily.sunset) {
        const sunriseTime = document.getElementById('sunrise-time');
        const sunsetTime = document.getElementById('sunset-time');
        const sunPosition = document.getElementById('sun-position');

        const sunrise = new Date(daily.sunrise[0]);
        const sunset = new Date(daily.sunset[0]);

        if (sunriseTime) sunriseTime.textContent = sunrise.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        if (sunsetTime) sunsetTime.textContent = sunset.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        // Calculate sun position on arc
        if (sunPosition) {
            const now = new Date();
            const totalDayMinutes = (sunset - sunrise) / 1000 / 60;
            const elapsedMinutes = (now - sunrise) / 1000 / 60;
            const progress = Math.max(0, Math.min(1, elapsedMinutes / totalDayMinutes));

            // Calculate position on arc (SVG path)
            const x = 10 + (180 * progress);
            const y = 90 - (80 * Math.sin(progress * Math.PI));

            sunPosition.setAttribute('cx', x);
            sunPosition.setAttribute('cy', y);
        }
    }

    // --- UPDATE PRECIPITATION ---
    if (hourly && hourly.precipitation) {
        const precipLast24 = document.getElementById('precip-last-24');
        const precipNext24 = document.getElementById('precip-next-24');

        // Calculate last 24h precipitation
        let last24Sum = 0;
        const now = new Date();
        for (let i = 0; i < 24 && i < hourly.precipitation.length; i++) {
            const hourTime = new Date(hourly.time[hourly.time.length - 24 + i]);
            if (hourTime <= now) {
                last24Sum += hourly.precipitation[hourly.time.length - 24 + i] || 0;
            }
        }

        // Calculate next 24h precipitation
        let next24Sum = 0;
        const nowIndex = hourly.time.findIndex(t => t.startsWith(now.toISOString().slice(0, 13)));
        for (let i = 0; i < 24 && (nowIndex + i) < hourly.precipitation.length; i++) {
            next24Sum += hourly.precipitation[nowIndex + i] || 0;
        }

        if (precipLast24) precipLast24.textContent = `${last24Sum.toFixed(1)} mm`;
        if (precipNext24) precipNext24.textContent = `${next24Sum.toFixed(1)} mm`;

        // Add precipitation comment
        const precipComment = document.getElementById('precip-comment');
        if (precipComment) {
            let comment = '';
            const totalPrecip = last24Sum + next24Sum;

            if (totalPrecip < 0.5) {
                comment = '☀️ Sin lluvia, disfruta el día';
            } else if (totalPrecip < 5) {
                comment = '🌦️ Lluvia ligera esperada';
            } else if (totalPrecip < 15) {
                comment = '☔ Lluvia moderada, lleva paraguas';
            } else if (totalPrecip < 30) {
                comment = '🌧️ Lluvia intensa, planifica con cuidado';
            } else {
                comment = '⛈️ Lluvia muy fuerte, evita salir si es posible';
            }
            precipComment.textContent = comment;
        }
    }

    // --- WEATHER ALERTS DETECTION ---
    checkWeatherAlerts(weather, details, hourly, daily);

    // --- UPDATE DAY PHASE & MOON PHASE ---
    updateDayPhase(daily, weather);

    // --- UPDATE NEW PREMIUM FEATURES ---
    updateHumidityAndDewPoint(weather, details);
    updateActivityIndex(weather, details);
    updateStellarVisibility(weather, details, daily);

    // Animation tick
    if (el.appMain) {
        el.appMain.classList.remove('animate-float');
        void el.appMain.offsetWidth; // trigger reflow
        el.appMain.classList.add('animate-float');
    }
} // End updateUI

// --- DAY PHASE & MOON PHASE CALCULATOR ---
function updateDayPhase(daily, weather) {
    const phaseIcon = document.getElementById('phase-icon');
    const phaseLabel = document.getElementById('phase-label');

    if (!phaseIcon || !phaseLabel) return;

    const now = new Date();
    const hour = now.getHours();

    // Determine if it's day or night from API
    const isDay = weather.is_day !== undefined ? weather.is_day : 1;
    const weatherCode = weather.weathercode;

    // Check if sky is clear (code 0, 1, 2)
    const isClearSky = weatherCode <= 2;

    let icon = '☀️';
    let label = 'Día';

    if (isDay) {
        // Daytime phases
        if (hour >= 6 && hour < 12) {
            icon = '🌅';
            label = 'Mañana';
        } else if (hour >= 12 && hour < 18) {
            icon = '☀️';
            label = 'Tarde';
        } else {
            icon = '🌆';
            label = 'Atardecer';
        }
    } else {
        // Nighttime
        if (isClearSky) {
            // Calculate moon phase
            const moonPhase = calculateMoonPhase(now);
            icon = getMoonEmoji(moonPhase);
            label = getMoonPhaseName(moonPhase);
        } else {
            icon = '🌙';
            label = 'Noche';
        }
    }

    phaseIcon.textContent = icon;
    phaseLabel.textContent = label;
}

// Calculate moon phase (0 = new moon, 0.5 = full moon, 1 = new moon)
function calculateMoonPhase(date) {
    // Known new moon: January 6, 2000, 18:14 UTC
    const knownNewMoon = new Date('2000-01-06T18:14:00Z');
    const lunarCycle = 29.53058867; // days

    const daysSinceKnownNewMoon = (date - knownNewMoon) / (1000 * 60 * 60 * 24);
    const phase = (daysSinceKnownNewMoon % lunarCycle) / lunarCycle;

    return phase;
}

// Get moon emoji based on phase
function getMoonEmoji(phase) {
    if (phase < 0.0625) return '🌑'; // New Moon
    if (phase < 0.1875) return '🌒'; // Waxing Crescent
    if (phase < 0.3125) return '🌓'; // First Quarter
    if (phase < 0.4375) return '🌔'; // Waxing Gibbous
    if (phase < 0.5625) return '🌕'; // Full Moon
    if (phase < 0.6875) return '🌖'; // Waning Gibbous
    if (phase < 0.8125) return '🌗'; // Last Quarter
    if (phase < 0.9375) return '🌘'; // Waning Crescent
    return '🌑'; // New Moon
}

// Get moon phase name in Spanish
function getMoonPhaseName(phase) {
    if (phase < 0.0625) return 'Luna Nueva';
    if (phase < 0.1875) return 'Creciente';
    if (phase < 0.3125) return 'Cuarto Creciente';
    if (phase < 0.4375) return 'Gibosa Creciente';
    if (phase < 0.5625) return 'Luna Llena';
    if (phase < 0.6875) return 'Gibosa Menguante';
    if (phase < 0.8125) return 'Cuarto Menguante';
    if (phase < 0.9375) return 'Menguante';
    return 'Luna Nueva';
}

// --- WEATHER ALERTS SYSTEM ---
function checkWeatherAlerts(weather, details, hourly, daily) {
    const alertBanner = document.getElementById('weather-alert');
    const alertTitle = document.getElementById('alert-title');
    const alertMessage = document.getElementById('alert-message');

    if (!alertBanner || !alertTitle || !alertMessage) return;

    const alerts = [];

    // Check temperature extremes
    const temp = weather.temperature;
    if (temp <= 0) {
        alerts.push({
            severity: 'danger',
            title: '⚠️ Alerta de Helada',
            message: 'Temperatura bajo cero. Riesgo de hielo en carreteras y aceras.'
        });
    } else if (temp >= 35) {
        alerts.push({
            severity: 'danger',
            title: '🌡️ Alerta de Calor Extremo',
            message: 'Temperatura muy alta. Mantente hidratado y evita exposición prolongada al sol.'
        });
    }

    // Check wind
    const windSpeed = details?.wind || 0;
    if (windSpeed >= 50) {
        alerts.push({
            severity: 'extreme',
            title: '🌪️ Alerta de Viento Extremo',
            message: 'Vientos muy fuertes. Evita salir, riesgo de objetos voladores y caída de árboles.'
        });
    } else if (windSpeed >= 40) {
        alerts.push({
            severity: 'danger',
            title: '💨 Alerta de Viento Fuerte',
            message: 'Vientos intensos. Precaución al conducir y caminar al aire libre.'
        });
    }

    // Check precipitation
    if (hourly && hourly.precipitation) {
        const now = new Date();
        const nowIndex = hourly.time.findIndex(t => t.startsWith(now.toISOString().slice(0, 13)));
        let next6hPrecip = 0;
        for (let i = 0; i < 6 && (nowIndex + i) < hourly.precipitation.length; i++) {
            next6hPrecip += hourly.precipitation[nowIndex + i] || 0;
        }

        if (next6hPrecip >= 30) {
            alerts.push({
                severity: 'danger',
                title: '🌧️ Alerta de Lluvia Intensa',
                message: 'Lluvia muy fuerte esperada. Riesgo de inundaciones y deslizamientos.'
            });
        } else if (next6hPrecip >= 15) {
            alerts.push({
                severity: 'warning',
                title: '☔ Alerta de Lluvia',
                message: 'Lluvia moderada a fuerte en las próximas horas. Lleva paraguas.'
            });
        }
    }

    // Check visibility
    const visibility = details?.vocab || 10000;
    if (visibility < 1000) {
        alerts.push({
            severity: 'danger',
            title: '🌫️ Alerta de Baja Visibilidad',
            message: 'Niebla densa o condiciones de baja visibilidad. Conduce con precaución.'
        });
    }

    // Check UV index
    const uv = details?.uv || 0;
    if (uv >= 8) {
        alerts.push({
            severity: 'warning',
            title: '☀️ Alerta UV Extremo',
            message: 'Índice UV muy alto. Usa protector solar y evita exposición entre 10am-4pm.'
        });
    }

    // Check storm conditions
    const weatherCode = weather.weathercode;
    if (weatherCode >= 95) {
        alerts.push({
            severity: 'extreme',
            title: '⛈️ Alerta de Tormenta',
            message: 'Tormenta eléctrica activa. Busca refugio inmediatamente, evita árboles y estructuras altas.'
        });
    }

    // Display highest priority alert
    if (alerts.length > 0) {
        // Sort by severity: extreme > danger > warning
        const severityOrder = { extreme: 3, danger: 2, warning: 1 };
        alerts.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity]);

        const topAlert = alerts[0];
        alertTitle.textContent = topAlert.title;
        alertMessage.textContent = topAlert.message;

        // Remove all severity classes
        alertBanner.classList.remove('warning', 'danger', 'extreme');
        // Add current severity
        alertBanner.classList.add(topAlert.severity);
        // Show banner
        alertBanner.classList.remove('hidden');
    } else {
        // No alerts, hide banner
        alertBanner.classList.add('hidden');
    }
}

// --- HUMIDITY & DEW POINT ---
function updateHumidityAndDewPoint(weather, details) {
    const humidityPercent = document.getElementById('humidity-percent');
    const dewPoint = document.getElementById('dew-point');
    const comfortLevel = document.getElementById('comfort-level');
    const comfortText = document.getElementById('comfort-text');

    if (!humidityPercent || !dewPoint) return;

    const humidity = details?.humidity || 0;
    const temp = weather.temperature || 0;

    // Display humidity
    humidityPercent.textContent = `${humidity}%`;

    // Calculate dew point (Magnus formula)
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
    const dewPointTemp = (b * alpha) / (a - alpha);

    dewPoint.textContent = `${Math.round(dewPointTemp)}°C`;

    // Determine comfort level
    let comfort = 'comfortable';
    let comfortMsg = 'Condiciones confortables';
    let icon = 'sentiment_satisfied';

    if (humidity < 30) {
        comfort = 'uncomfortable';
        comfortMsg = 'Aire seco, puede causar irritación';
        icon = 'sentiment_dissatisfied';
    } else if (humidity > 70) {
        comfort = 'uncomfortable';
        comfortMsg = 'Aire húmedo, sensación pegajosa';
        icon = 'sentiment_dissatisfied';
    } else if (humidity > 85) {
        comfort = 'very-uncomfortable';
        comfortMsg = 'Muy húmedo, muy incómodo';
        icon = 'sentiment_very_dissatisfied';
    }

    if (comfortLevel && comfortText) {
        comfortLevel.className = `comfort-indicator ${comfort}`;
        comfortLevel.querySelector('.material-icons-round').textContent = icon;
        comfortText.textContent = comfortMsg;
    }
}

// --- OUTDOOR ACTIVITY INDEX ---
function updateActivityIndex(weather, details) {
    const activityScore = document.getElementById('activity-score');
    const activityProgress = document.getElementById('activity-progress');
    const activityRecommendation = document.getElementById('activity-recommendation');

    if (!activityScore) return;

    const temp = weather.temperature || 0;
    const wind = details?.wind || 0;
    const uv = details?.uv || 0;
    const humidity = details?.humidity || 50;

    // Calculate score (0-10)
    let score = 10;

    // Temperature factor (ideal: 15-25°C)
    if (temp < 5 || temp > 30) score -= 3;
    else if (temp < 10 || temp > 28) score -= 2;
    else if (temp < 15 || temp > 25) score -= 1;

    // Wind factor (ideal: <15 km/h)
    if (wind > 30) score -= 3;
    else if (wind > 20) score -= 2;
    else if (wind > 15) score -= 1;

    // UV factor (ideal: <6)
    if (uv > 8) score -= 2;
    else if (uv > 6) score -= 1;

    // Humidity factor (ideal: 40-60%)
    if (humidity < 30 || humidity > 80) score -= 1;

    score = Math.max(0, Math.min(10, score));

    // Display score
    activityScore.textContent = score;

    // Animate progress circle
    if (activityProgress) {
        const circumference = 314; // 2 * PI * 50
        const offset = circumference - (score / 10) * circumference;
        activityProgress.style.strokeDashoffset = offset;

        // Change color based on score
        if (score >= 7) {
            activityProgress.style.stroke = '#4caf50';
        } else if (score >= 4) {
            activityProgress.style.stroke = '#ff9800';
        } else {
            activityProgress.style.stroke = '#f44336';
        }
    }

    // Recommendation
    let recommendation = '';
    if (score >= 8) {
        recommendation = '🌟 Excelente para actividades al aire libre';
    } else if (score >= 6) {
        recommendation = '✅ Buenas condiciones para ejercicio moderado';
    } else if (score >= 4) {
        recommendation = '⚠️ Condiciones aceptables, toma precauciones';
    } else {
        recommendation = '❌ Mejor quedarse en interiores o gimnasio';
    }

    if (activityRecommendation) {
        activityRecommendation.textContent = recommendation;
    }
}

// --- STELLAR VISIBILITY ---
function updateStellarVisibility(weather, details, daily) {
    const stellarCard = document.getElementById('stellar-card');
    const stellarScore = document.getElementById('stellar-score');
    const stellarCondition = document.getElementById('stellar-condition');
    const stellarBestTime = document.getElementById('stellar-best-time');

    if (!stellarCard) return;

    const isDay = weather.is_day !== undefined ? weather.is_day : 1;
    const weatherCode = weather.weathercode;
    const cloudCover = details?.cloud_cover || 0;

    // Only show at night
    if (isDay === 0) {
        stellarCard.style.display = 'block';

        // Calculate visibility score (0-10)
        let score = 10;

        // Cloud cover factor
        if (cloudCover > 80) score -= 7;
        else if (cloudCover > 60) score -= 5;
        else if (cloudCover > 40) score -= 3;
        else if (cloudCover > 20) score -= 1;

        // Weather code factor
        if (weatherCode >= 95) score -= 5; // Storm
        else if (weatherCode >= 80) score -= 4; // Rain
        else if (weatherCode >= 60) score -= 3; // Drizzle
        else if (weatherCode >= 45) score -= 2; // Fog

        // Moon phase factor (less moon = better visibility)
        const moonPhase = calculateMoonPhase();
        if (moonPhase > 0.4 && moonPhase < 0.6) score -= 2; // Full moon area

        score = Math.max(0, Math.min(10, score));

        // Display score
        if (stellarScore) stellarScore.textContent = score;

        // Condition message
        let condition = '';
        if (score >= 8) {
            condition = '⭐ Excelente visibilidad, noche perfecta para observar estrellas';
        } else if (score >= 6) {
            condition = '🌟 Buena visibilidad, se pueden ver constelaciones principales';
        } else if (score >= 4) {
            condition = '☁️ Visibilidad moderada, algunas estrellas visibles';
        } else {
            condition = '🌫️ Mala visibilidad, difícil ver estrellas';
        }

        if (stellarCondition) stellarCondition.textContent = condition;

        // Best time (usually midnight to 3am)
        if (stellarBestTime) {
            stellarBestTime.textContent = 'Mejor momento: 00:00 - 03:00';
        }
    } else {
        stellarCard.style.display = 'none';
    }
}

// --- HELPER FUNCTIONS ---

function getWeatherId(code, isDay = 1) {
    // MAPPING: WMO Code -> Cloudinary Public ID (MP4 Video Names)
    // Now with DAY/NIGHT variants - Updated with actual Cloudinary IDs

    // 0: Despejado
    if (code === 0) {
        return isDay ? 'soleado_id2xmu' : 'noche_despejada_estrellada_yxjpxa';
    }

    // 1-2: Parcialmente Nublado
    if (code >= 1 && code <= 2) {
        return isDay ? 'parcialmente_fdhxml' : 'noche_parcialmente_nublado_dwuvkx';
    }

    // 3: Nublado
    if (code === 3) {
        return isDay ? 'nublado_v2_assaug' : 'noche_nublado_c16ex3';
    }

    // 45-48: Niebla (Neblina)
    if (code === 45 || code === 48) {
        return isDay ? 'neblina_odrm7y' : 'noche_niebla_drlpix';
    }

    // 51-57: Llovizna (usa el mismo video que lluvia)
    if (code >= 51 && code <= 57) {
        return isDay ? 'llovizna_kw31jm' : 'noche_lluvia_qmzrat';
    }

    // 61-82: Lluvia
    if (code >= 61 && code <= 82) {
        return isDay ? 'lluvia_lpxtmw' : 'noche_lluvia_qmzrat';
    }

    // 71-86: Nieve
    if (code >= 71 && code <= 86) {
        return isDay ? 'nieve_ghrasq' : 'noche_nieve_mibq4v';
    }

    // 95+: Tormenta
    if (code >= 95) {
        return isDay ? 'día_tormenta_nb24f3' : 'Noche_Tormenta_ap8pn8';
    }

    // Default Fallback
    return isDay ? 'soleado_id2xmu' : 'noche_despejada_estrellada_yxjpxa';
}

function interpretWeatherCode(code, isDay) {
    // Only used for Labels and Icons now
    let result = { label: 'Despejado', icon: 'wb_sunny', particle: 'none', quote: '' };

    // Default icon fallback
    result.icon = isDay ? 'wb_sunny' : 'nights_stay';

    if (code === 0) {
        result.label = 'Soleado';
        result.icon = isDay ? 'wb_sunny' : 'nights_stay';
    }
    else if (code === 1) {
        result.label = 'Mayormente Despejado';
        result.icon = isDay ? 'wb_sunny' : 'nights_stay';
    }
    else if (code === 2) {
        result.label = 'Parcialmente Nublado';
        result.icon = isDay ? 'partly_cloudy_day' : 'nights_stay'; // nights_stay is cleaner for night
    }
    else if (code === 3) {
        result.label = 'Nublado';
        result.icon = 'cloud';
    }
    else if (code >= 45 && code <= 48) {
        result.label = 'Niebla';
        result.icon = 'blur_on';
    }
    else if (code >= 51 && code <= 57) {
        result.label = 'Llovizna';
        result.icon = 'grain';
        result.particle = 'rain';
    }
    else if (code >= 61 && code <= 67) { // Rain: Slight, moderate and heavy intensity
        result.label = 'Lluvia';
        result.icon = 'water_drop';
        result.particle = 'rain';
    }
    else if (code >= 80 && code <= 82) { // Rain showers: Slight, moderate, and violent
        result.label = 'Chubascos';
        result.icon = 'tsunami'; // closest to showers or use water_drop
        result.particle = 'rain';
    }
    else if (code >= 71 && code <= 77) { // Snow fall & Snow grains
        result.label = 'Nieve';
        result.icon = 'ac_unit';
        result.particle = 'snow';
    }
    else if (code >= 85 && code <= 86) { // Snow showers
        result.label = 'Nieve Fuerte';
        result.icon = 'severe_cold';
        result.particle = 'snow';
    }
    else if (code >= 95) { // Thunderstorm
        result.label = 'Tormenta';
        result.icon = 'flash_on';
        result.particle = 'rain';
    }

    return result;
}

function toggleZen() {
    state.isZen = !state.isZen;
    document.body.classList.toggle('zen-active', state.isZen);
}

function updateClock() {
    const now = new Date();
    if (el.dateTime) el.dateTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Universal Load Event
window.addEventListener('load', init);

// Helper for Icon Colors
function getIconClass(code) {
    // 0: Sunny/Clear
    if (code === 0) return 'sun';
    // 1-3: Cloudy
    if (code >= 1 && code <= 3) return 'cloud';
    // 51-67: Rain
    if (code >= 51 && code <= 67) return 'rain';
    // 71-86: Snow
    if (code >= 71 && code <= 86) return 'snow';
    // 95+: Storm
    if (code >= 95) return 'storm';

    return '';
}
