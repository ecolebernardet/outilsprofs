// =========================================================================
// WIDGET DATE & HEURE
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function() {
    const s = document.createElement('style');
    s.textContent = `
        .widget[data-type="date"], .widget[data-type="time"] { min-width: unset; width: auto; }
        .widget[data-type="date"] .editor-container, .widget[data-type="time"] .editor-container { overflow: hidden; display: flex; flex-direction: column; justify-content: center; align-items: center; background: white; resize: none; }
        .widget[data-type="date"] .editor-container { min-width: 150px; min-height: 180px; }
        .widget[data-type="time"] .editor-container { min-width: 120px; min-height: 80px; border: none; }
        .widget[data-type="date"] .editor-container::-webkit-resizer,
        .widget[data-type="time"] .editor-container::-webkit-resizer { background-color: transparent; background-image: none; }
        .calendar-page { width: 100%; height: 100%; display: flex; flex-direction: column; border: 1px solid #ced4da; border-radius: 8px; overflow: visible; background: white; text-align: center; position: relative; padding-top: 15px; box-sizing: border-box; }
        .calendar-header { background: #D17B6B; height: 20%; min-height: 30px; border-bottom: 2px solid #B5634F; margin-bottom: 5px; position: relative; overflow: visible; }
        .calendar-rings-svg { position: absolute; left: 0; width: 100%; pointer-events: none; overflow: visible; }
        .calendar-body { flex-grow: 1; display: flex; flex-direction: column; justify-content: center; padding: 2px 5px; gap: 1px; }
        .calendar-day-name   { font-size: 0.95em; font-weight: 700; color: #333; text-transform: lowercase; line-height: 1.1; }
        .calendar-day-number { font-size: 2.5em; font-weight: 800; color: #2c3e50; line-height: 1em; margin: 0; }
        .calendar-month      { font-size: 1.25em; font-weight: 600; color: #333; line-height: 1.1; }
        .clock-time { font-weight: 800; color: var(--primary-color); font-family: 'Courier New', monospace; display: flex; align-items: baseline; justify-content: center; width: 100%; gap: 4px; }
        .clock-seconds { font-size: 0.5em; color: #888; margin-left: 0.1em; }
        .icon-transparency { display: inline-block; width: 16px; height: 16px; border: 1px solid #333; background-color: #fff; background-image: linear-gradient(45deg,#ddd 25%,transparent 25%),linear-gradient(-45deg,#ddd 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ddd 75%),linear-gradient(-45deg,transparent 75%,#ddd 75%); background-size: 8px 8px; background-position: 0 0,0 4px,4px -4px,-4px 0px; vertical-align: middle; border-radius: 2px; }
    `;
    document.head.appendChild(s);
})();

// ── Templates ─────────────────────────────────────────────────────────────
(function() {
    const tplDate = document.createElement('template');
    tplDate.id = 'template-date';
    tplDate.innerHTML = `
        <div class="editor-container" style="width:220px;height:260px;overflow:hidden;">
            <div class="calendar-page" style="font-size:16px;">
                <div class="calendar-header">
                    <svg class="calendar-rings-svg" xmlns="http://www.w3.org/2000/svg"></svg>
                </div>
                <div class="calendar-body">
                    <div class="calendar-day-name"></div>
                    <div class="calendar-day-number"></div>
                    <div class="calendar-month"></div>
                </div>
            </div>
        </div>`;
    document.body.appendChild(tplDate);

    const tplTime = document.createElement('template');
    tplTime.id = 'template-time';
    tplTime.innerHTML = `
        <div class="editor-container" style="width:200px;height:100px;display:flex;align-items:center;justify-content:center;overflow:hidden;border:none;">
            <div class="clock-time" style="font-size:32px;width:100%;height:100%;display:flex;align-items:center;justify-content:center;padding:0 16px;box-sizing:border-box;">
                <span class="clock-hm">00:00</span><span class="clock-seconds">00</span>
            </div>
        </div>`;
    document.body.appendChild(tplTime);
})();

// ── Horloge ───────────────────────────────────────────────────────────────
function updateClock() {
    const now = new Date();
    const dateStr = now.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
    const timeStr = now.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
    document.querySelectorAll('.agenda-current-date').forEach(el => el.textContent = dateStr);
    document.querySelectorAll('.agenda-current-time').forEach(el => el.textContent = timeStr);
    updateDateTime();
}

function updateDateTime() {
    const now = new Date();
    const days   = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
    const months = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
    document.querySelectorAll('.calendar-day-name').forEach(el   => el.textContent = days[now.getDay()]);
    document.querySelectorAll('.calendar-day-number').forEach(el => el.textContent = now.getDate());
    document.querySelectorAll('.calendar-month').forEach(el      => el.textContent = months[now.getMonth()]);
    const hh = String(now.getHours()).padStart(2,'0'), mm = String(now.getMinutes()).padStart(2,'0'), ss = String(now.getSeconds()).padStart(2,'0');
    document.querySelectorAll('.clock-hm').forEach(el      => el.textContent = ` ${hh}:${mm} `);
    document.querySelectorAll('.clock-seconds').forEach(el => el.textContent = ss);
}

// ── Init widget Heure ─────────────────────────────────────────────────────
function initTimeWidget(widget) {
    const container = widget.querySelector('.editor-container');
    const clockTime = widget.querySelector('.clock-time');
    if (!container || !clockTime) return;

    const resizeObserver = new ResizeObserver(() => {
        const h = container.offsetHeight, w = container.offsetWidth;
        const sizeByH = Math.floor(h * 0.55);
        const sizeByW = Math.floor(w * 0.28);
        const size = Math.max(12, Math.min(sizeByH, sizeByW));
        clockTime.style.fontSize = size + 'px';
        const sec = widget.querySelector('.clock-seconds');
        if (sec) sec.style.fontSize = Math.floor(size * 0.45) + 'px';
    });
    resizeObserver.observe(container);
    container.style.resize = 'none';

    // Poignée de resize
    const resizeHandle = document.createElement('div');
    resizeHandle.style.cssText = 'position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:se-resize;background:linear-gradient(135deg,transparent 50%,#aaa 50%);border-radius:0 0 4px 0;opacity:0;transition:opacity 0.2s;z-index:10;';
    widget.appendChild(resizeHandle);
    widget.addEventListener('mouseenter', () => resizeHandle.style.opacity = '1');
    widget.addEventListener('mouseleave', () => resizeHandle.style.opacity = '0');
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth, startH = container.offsetHeight;
        document.onmousemove = (ev) => {
            container.style.width  = Math.max(100, startW + ev.clientX - startX) + 'px';
            container.style.height = Math.max(60,  startH + ev.clientY - startY) + 'px';
        };
        document.onmouseup = () => { document.onmousemove = null; saveBoard(); };
    });

    // Bouton transparence
    const transpBtn = document.createElement('button');
    transpBtn.title = 'Fond transparent';
    transpBtn.style.cssText = 'position:absolute;top:4px;right:30px;background:rgba(255,255,255,0.8);border:1px solid #ddd;border-radius:4px;width:22px;height:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;z-index:10;padding:0;';
    transpBtn.innerHTML = '<span class="icon-transparency"></span>';
    transpBtn.addEventListener('click', () => {
        snapshotNow();
        applyTransparency(widget, widget.dataset.transparent !== 'true');
        saveBoard();
    });
    widget.appendChild(transpBtn);
    widget.addEventListener('mouseenter', () => transpBtn.style.opacity = '1');
    widget.addEventListener('mouseleave', () => transpBtn.style.opacity = '0');
}

// ── Init widget Date ──────────────────────────────────────────────────────
function initDateWidget(widget) {
    const container = widget.querySelector('.editor-container');
    const dayName   = widget.querySelector('.calendar-day-name');
    const dayNumber = widget.querySelector('.calendar-day-number');
    const month     = widget.querySelector('.calendar-month');
    const header    = widget.querySelector('.calendar-header');
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
        const h = container.offsetHeight, w = container.offsetWidth;
        if (header) header.style.height = Math.floor(h * 0.20) + 'px';
        const bodyH = h * 0.75;
        const baseSize = Math.min(w * 0.18, bodyH * 0.14, w / 8);
        const maxLine = bodyH * 0.30;
        if (dayName)   dayName.style.fontSize   = Math.max(10, Math.min(Math.floor(baseSize * 1.0),  maxLine)) + 'px';
        if (dayNumber) dayNumber.style.fontSize = Math.max(20, Math.min(Math.floor(baseSize * 3.2),  maxLine * 1.5)) + 'px';
        if (month)     month.style.fontSize     = Math.max(10, Math.min(Math.floor(baseSize * 1.35), maxLine)) + 'px';

        // Dessiner les piliers en SVG
        const svg = widget.querySelector('.calendar-rings-svg');
        if (svg && header) {
            const hw = header.offsetWidth, hh = header.offsetHeight;
            const overflowTop = Math.floor(hh * 0.7);
            const totalH = hh + overflowTop;
            svg.setAttribute('viewBox', `0 0 ${hw} ${totalH}`);
            svg.setAttribute('height', totalH);
            svg.style.top = -overflowTop + 'px';
            svg.style.height = totalH + 'px';

            const n = 4;
            const margin = hw * 0.15;
            const step = (hw - margin * 2) / (n - 1);
            const pw = Math.max(5, Math.min(10, hw * 0.04));   // largeur pilier
            const pr = pw / 2;                                   // border-radius
            const pillarTop = 4;                                 // top du pilier dans le SVG
            const pillarBot = totalH * 0.78;                    // bas du pilier (dans la bande rouge)
            const pillarH = pillarBot - pillarTop;
            const circR = Math.max(5, pw * 0.9);                // rayon du cercle bas

            let svgContent = `<defs>
                <linearGradient id="pillarGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%"   stop-color="#aaa"/>
                    <stop offset="40%"  stop-color="#e8e8e8"/>
                    <stop offset="100%" stop-color="#888"/>
                </linearGradient>
            </defs>`;

            for (let i = 0; i < n; i++) {
                const cx = margin + i * step;
                const x  = cx - pr;
                svgContent += `<rect x="${x}" y="${pillarTop}" width="${pw}" height="${pillarH}" rx="${pr}" fill="url(#pillarGrad)"/>`;
                svgContent += `<circle cx="${cx}" cy="${pillarBot}" r="${circR}" fill="#7a2020"/>`;
                svgContent += `<circle cx="${cx}" cy="${pillarBot}" r="${circR * 0.55}" fill="#5a1515"/>`;
            }
            svg.innerHTML = svgContent;
        }
    });
    resizeObserver.observe(container);

    // Poignée de resize
    const resizeHandle = document.createElement('div');
    resizeHandle.style.cssText = 'position:absolute;right:0;bottom:0;width:18px;height:18px;cursor:se-resize;background:linear-gradient(135deg,transparent 50%,#aaa 50%);border-radius:0 0 4px 0;opacity:0;transition:opacity 0.2s;z-index:10;';
    widget.appendChild(resizeHandle);
    widget.addEventListener('mouseenter', () => resizeHandle.style.opacity = '1');
    widget.addEventListener('mouseleave', () => resizeHandle.style.opacity = '0');
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth, startH = container.offsetHeight;
        document.onmousemove = (ev) => {
            container.style.width  = Math.max(150, startW + ev.clientX - startX) + 'px';
            container.style.height = Math.max(180, startH + ev.clientY - startY) + 'px';
        };
        document.onmouseup = () => { document.onmousemove = null; saveBoard(); };
    });

    // Bouton transparence
    const transpBtn = document.createElement('button');
    transpBtn.title = 'Fond transparent';
    transpBtn.style.cssText = 'position:absolute;top:4px;right:30px;background:rgba(255,255,255,0.8);border:1px solid #ddd;border-radius:4px;width:22px;height:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.2s;z-index:10;padding:0;';
    transpBtn.innerHTML = '<span class="icon-transparency"></span>';
    transpBtn.addEventListener('click', () => {
        snapshotNow();
        applyTransparency(widget, widget.dataset.transparent !== 'true');
        saveBoard();
    });
    widget.appendChild(transpBtn);
    widget.addEventListener('mouseenter', () => transpBtn.style.opacity = '1');
    widget.addEventListener('mouseleave', () => transpBtn.style.opacity = '0');
}
