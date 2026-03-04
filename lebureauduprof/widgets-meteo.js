// =========================================================================
// WIDGET MÉTÉO
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function() {
    const s = document.createElement('style');
    s.textContent = `
        .widget[data-type="meteo"] { min-width: unset; background: transparent !important; border: none !important; box-shadow: none !important; }
        .widget[data-type="meteo"] .editor-container { border: none; border-radius: 16px; overflow: hidden; resize: both; }
        .meteo-city-name { text-decoration: underline dotted; }
    `;
    document.head.appendChild(s);
})();

// ── Template ──────────────────────────────────────────────────────────────
(function() {
    const tpl = document.createElement('template');
    tpl.id = 'template-meteo';
    tpl.innerHTML = `
        <div class="editor-container meteo-container" style="width:280px;height:200px;background:linear-gradient(135deg,#1a6fa8,#38b6e8);border-radius:16px;border:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;padding:16px;box-sizing:border-box;color:white;overflow:hidden;">
            <div class="meteo-city" style="font-size:13px;font-weight:600;opacity:0.85;cursor:pointer;text-align:center;border-bottom:1px solid rgba(255,255,255,0.3);padding-bottom:6px;width:100%;" title="Cliquer pour changer de ville">📍 <span class="meteo-city-name">Chargement...</span></div>
            <div class="meteo-icon" style="font-size:52px;line-height:1;margin:4px 0;">⛅</div>
            <div class="meteo-temp" style="font-size:36px;font-weight:800;line-height:1;">--°</div>
            <div class="meteo-desc" style="font-size:13px;opacity:0.9;text-align:center;">--</div>
            <div class="meteo-details" style="font-size:11px;opacity:0.75;display:flex;gap:12px;margin-top:2px;">
                <span class="meteo-wind">💨 --</span>
                <span class="meteo-humidity">💧 --</span>
            </div>
            <div class="meteo-updated" style="font-size:9px;opacity:0.5;margin-top:2px;">--</div>
        </div>`;
    document.body.appendChild(tpl);
})();

// ── Données WMO + fetch + init ────────────────────────────────────────────
const WMO_CODES = {
    0:'Ciel dégagé',1:'Principalement dégagé',2:'Partiellement nuageux',3:'Couvert',
    45:'Brouillard',48:'Brouillard givrant',
    51:'Bruine légère',53:'Bruine modérée',55:'Bruine dense',
    61:'Pluie légère',63:'Pluie modérée',65:'Pluie forte',
    71:'Neige légère',73:'Neige modérée',75:'Neige forte',77:'Grains de neige',
    80:'Averses légères',81:'Averses modérées',82:'Averses violentes',
    85:'Averses de neige',86:'Averses de neige fortes',
    95:'Orage',96:'Orage avec grêle',99:'Orage violent avec grêle'
};
const WMO_ICONS = {
    0:'☀️',1:'🌤️',2:'⛅',3:'☁️',
    45:'🌫️',48:'🌫️',
    51:'🌦️',53:'🌦️',55:'🌧️',
    61:'🌧️',63:'🌧️',65:'🌧️',
    71:'❄️',73:'❄️',75:'❄️',77:'🌨️',
    80:'🌦️',81:'🌧️',82:'⛈️',
    85:'🌨️',86:'🌨️',
    95:'⛈️',96:'⛈️',99:'⛈️'
};
const WMO_BG = {
    0:'linear-gradient(135deg,#f7971e,#ffd200)',
    1:'linear-gradient(135deg,#56ccf2,#2f80ed)',
    2:'linear-gradient(135deg,#4facfe,#6c8ce4)',
    3:'linear-gradient(135deg,#757f9a,#d7dde8)',
    45:'linear-gradient(135deg,#8e9eab,#c3cfe2)',48:'linear-gradient(135deg,#8e9eab,#c3cfe2)',
    61:'linear-gradient(135deg,#1a6fa8,#38b6e8)',63:'linear-gradient(135deg,#1a6fa8,#38b6e8)',65:'linear-gradient(135deg,#0f4c75,#1b6ca8)',
    71:'linear-gradient(135deg,#a8c0ff,#e0eafc)',73:'linear-gradient(135deg,#a8c0ff,#e0eafc)',75:'linear-gradient(135deg,#a8c0ff,#e0eafc)',
    80:'linear-gradient(135deg,#1a6fa8,#38b6e8)',81:'linear-gradient(135deg,#1a6fa8,#38b6e8)',82:'linear-gradient(135deg,#0f4c75,#1b6ca8)',
    95:'linear-gradient(135deg,#373b44,#4286f4)',96:'linear-gradient(135deg,#373b44,#4286f4)',99:'linear-gradient(135deg,#373b44,#4286f4)',
};

async function fetchMeteo(city) {
    // 1. Géocodage via Open-Meteo geocoding API
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=fr&format=json`);
    const geoData = await geoRes.json();
    if (!geoData.results?.length) throw new Error('Ville introuvable');
    const { latitude, longitude, name, country } = geoData.results[0];
    // 2. Météo actuelle
    const metRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weathercode,windspeed_10m,relativehumidity_2m&wind_speed_unit=kmh&timezone=auto`);
    const metData = await metRes.json();
    const c = metData.current;
    return { name, country, temp: Math.round(c.temperature_2m), code: c.weathercode, wind: Math.round(c.windspeed_10m), humidity: c.relativehumidity_2m };
}

function initMeteoWidget(widget) {
    const container = widget.querySelector('.meteo-container');
    const cityNameEl = widget.querySelector('.meteo-city-name');
    const iconEl     = widget.querySelector('.meteo-icon');
    const tempEl     = widget.querySelector('.meteo-temp');
    const descEl     = widget.querySelector('.meteo-desc');
    const windEl     = widget.querySelector('.meteo-wind');
    const humEl      = widget.querySelector('.meteo-humidity');
    const updEl      = widget.querySelector('.meteo-updated');

    // --- POIGNÉE DE REDIMENSIONNEMENT ---
    const resizeHandle = document.createElement('div');
    resizeHandle.style.cssText = 'position:absolute;right:0;bottom:0;width:20px;height:20px;cursor:se-resize;background:linear-gradient(135deg,transparent 50%,rgba(255,255,255,0.4) 50%);border-radius:0 0 14px 0;opacity:0;transition:opacity 0.2s;z-index:10;';
    widget.appendChild(resizeHandle);
    widget.addEventListener('mouseenter', () => resizeHandle.style.opacity = '1');
    widget.addEventListener('mouseleave', () => resizeHandle.style.opacity = '0');

    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth, startH = container.offsetHeight;
        document.onmousemove = (ev) => {
            const newW = Math.max(180, startW + ev.clientX - startX);
            const newH = Math.max(140, startH + ev.clientY - startY);
            container.style.width  = newW + 'px';
            container.style.height = newH + 'px';
            adaptMeteoFontSizes(container, newW, newH);
        };
        document.onmouseup = () => { document.onmousemove = null; saveBoard(); };
    });

    // Adapter les tailles de police au conteneur
    function adaptMeteoFontSizes(c, w, h) {
        const scale = Math.min(w / 280, h / 200);
        iconEl.style.fontSize     = Math.round(52 * scale) + 'px';
        tempEl.style.fontSize     = Math.round(36 * scale) + 'px';
        descEl.style.fontSize     = Math.round(13 * scale) + 'px';
        windEl.parentElement.style.fontSize = Math.round(11 * scale) + 'px';
        cityNameEl.style.fontSize = Math.round(13 * scale) + 'px';
        updEl.style.fontSize      = Math.round(9  * scale) + 'px';
    }

    // Observer les changements de taille
    new ResizeObserver(() => {
        adaptMeteoFontSizes(container, container.offsetWidth, container.offsetHeight);
    }).observe(container);

    // --- MODALE PERSONNALISÉE ---

    let city = widget.dataset.meteoCity || '';

    function applyMeteo(data) {
        const code = data.code;
        cityNameEl.textContent = `${data.name}, ${data.country}`;
        iconEl.textContent  = WMO_ICONS[code] || '🌡️';
        tempEl.textContent  = `${data.temp}°`;
        descEl.textContent  = WMO_CODES[code] || '';
        windEl.textContent  = `💨 ${data.wind} km/h`;
        humEl.textContent   = `💧 ${data.humidity}%`;
        updEl.textContent   = 'Mis à jour ' + new Date().toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'});
        container.style.background = WMO_BG[code] || WMO_BG[2];
        const lightBg = [71,73,75,3];
        container.style.color = lightBg.includes(code) ? '#222' : 'white';
    }

    async function loadCity(c) {
        cityNameEl.textContent = 'Chargement...';
        iconEl.textContent = '⏳'; tempEl.textContent = ''; descEl.textContent = '';
        try {
            const data = await fetchMeteo(c);
            widget.dataset.meteoCity = c;
            applyMeteo(data);
            saveBoard();
        } catch(e) {
            cityNameEl.textContent = 'Ville introuvable';
            iconEl.textContent = '❓'; tempEl.textContent = ''; descEl.textContent = '';
        }
    }

    widget.querySelector('.meteo-city').addEventListener('click', () => {
        showPromptModal('⛅', 'Widget Météo', 'Entrez la ville de votre école', widget.dataset.meteoCity || '', 'Ex : Paris, Lyon, Grenoble...')
            .then(newCity => { if (newCity) loadCity(newCity); });
    });

    function scheduleRefresh() {
        setTimeout(() => {
            if (widget.isConnected && widget.dataset.meteoCity) loadCity(widget.dataset.meteoCity).then(scheduleRefresh);
        }, 10 * 60 * 1000);
    }

    if (city) {
        loadCity(city).then(scheduleRefresh);
    } else {
        setTimeout(() => {
            showPromptModal('⛅', 'Widget Météo', 'Entrez la ville de votre école', '', 'Ex : Paris, Lyon, Grenoble...')
                .then(newCity => { if (newCity) loadCity(newCity).then(scheduleRefresh); });
        }, 200);
    }
}
