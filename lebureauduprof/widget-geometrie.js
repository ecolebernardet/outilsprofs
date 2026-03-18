// =========================================================================
// WIDGET GÉOMÉTRIE — Le Bureau du Prof
// Barre flottante avec Règle, Équerre et Compas
// Les outils sont draggables/pivotables sur le tableau et peuvent tracer.
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> :
//      <script src="widget-geometrie.js"></script>
//
//   2. Ajouter dans le sous-menu Outils :
//      <div class="mm-sub-item" onclick="toggleGeoToolbar();closeMainMenu()">
//          <span class="mm-ico">📐</span>&nbsp;&nbsp;Géométrie
//      </div>
// =========================================================================

(function () {

// ── CSS ──────────────────────────────────────────────────────────────────
const STYLE = `
/* ── Barre flottante géométrie (au-dessus de la barre dessin) ── */
#geo-toolbar {
    position: fixed;
    bottom: 80px;
    left: 140px;
    background: #1F1F21;
    border-radius: 12px;
    display: none;
    padding: 7px 15px;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.3);
    z-index: 13000;
    border: 1px solid #554466;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}
#geo-toolbar.open { display: flex; }
.geo-label {
    background: #1F1F21;
    color: #a78bfa;
    font-size: 14px;
    font-weight: bold;
    text-align: center;
    line-height: 1;
    white-space: nowrap;
}
.geo-sep { width:1px; height:30px; background:#444; }
.geo-tool-btn {
    cursor: pointer;
    background: #2a2a36;
    color: #eee;
    border: 1px solid #555;
    border-radius: 8px;
    padding: 5px 10px;
    font-size: 11px;
    font-weight: 700;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    transition: background 0.15s, border-color 0.15s;
    white-space: nowrap;
    line-height: 1.3;
}
.geo-tool-btn:hover { background: #3a3a4a; border-color: #7ab8f5; }
.geo-tool-btn.active { background: #1a3a5a; border-color: #6aaee8; color: #6aaee8; }
.geo-tool-btn .ico { font-size: 18px; }
.geo-close-btn {
    margin-left: auto;
    background: #6c757d;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    border: none;
    font-size: 13px;
}

/* ── Outils SVG sur le tableau ── */
.geo-tool-overlay {
    position: absolute;
    z-index: 9500;
    cursor: move !important;
    user-select: none;
    touch-action: none;
}
.geo-tool-overlay:active { cursor: grabbing !important; }
.geo-tool-overlay.geo-selected { filter: drop-shadow(0 0 6px rgba(106,174,232,0.8)); }
.geo-tool-overlay button { cursor: pointer !important; }
.geo-rot-handle { cursor: pointer !important; }

/* Poignée rotation */
.geo-rot-handle {
    position: absolute;
    width: 20px; height: 20px;
    background: #6aaee8;
    border-radius: 50%;
    border: 2px solid #fff;
    cursor: pointer;
    z-index: 2;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
    color: #fff;
    box-shadow: 0 2px 6px rgba(0,0,0,0.4);
}

/* Bouton tracer sur l'outil */
.geo-trace-btn {
    position: absolute;
    background: #a78bfa;
    color: #fff;
    border: none;
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 10px;
    font-weight: 700;
    cursor: pointer !important;
    z-index: 3;
    white-space: nowrap;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    transition: background 0.15s;
}
.geo-trace-btn:hover { background: #7c3aed; cursor: pointer !important; }

/* Bouton fermer l'outil */
.geo-close-tool {
    position: absolute;
    background: #e74c3c;
    color: #fff;
    border: none;
    border-radius: 50%;
    width: 18px; height: 18px;
    font-size: 10px;
    cursor: pointer;
    z-index: 3;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

/* Compas : curseur rayon */
.geo-compass-radius-wrap {
    position: absolute;
    display: flex;
    align-items: center;
    gap: 4px;
    z-index: 3;
    background: rgba(26,26,34,0.85);
    border-radius: 6px;
    padding: 3px 7px;
    border: 1px solid #555;
    font-size: 10px;
    color: #ccc;
    white-space: nowrap;
}
.geo-compass-radius-wrap input[type=range] {
    width: 70px;
    accent-color: #a78bfa;
    cursor: pointer !important;
}
`;

if (!document.getElementById('geo-style')) {
    const s = document.createElement('style');
    s.id = 'geo-style';
    s.textContent = STYLE;
    document.head.appendChild(s);
}

// ── Barre flottante ───────────────────────────────────────────────────────
const bar = document.createElement('div');
bar.id = 'geo-toolbar';
bar.innerHTML = `
    <span style="color:#a78bfa;font-size:11px;font-weight:700;white-space:nowrap;">📐 Outils géométrie</span>
    <div class="geo-sep"></div>
    <button class="geo-tool-btn" id="geo-btn-regle"   onclick="geoSpawnTool('regle')">
        <span class="ico">📏</span><span>Règle</span>
    </button>
    <button class="geo-tool-btn" id="geo-btn-equerre" onclick="geoSpawnTool('equerre')">
        <span class="ico">📐</span><span>Équerre</span>
    </button>
    <button class="geo-tool-btn" id="geo-btn-compas"  onclick="geoSpawnTool('compas')">
        <span class="ico">⭕</span><span>Compas</span>
    </button>
`;
document.body.appendChild(bar);

// ── API publique ──────────────────────────────────────────────────────────
window.toggleGeoToolbar = function () {
    bar.classList.toggle('open');
};
window.closeGeoToolbar = function () {
    bar.classList.remove('open');
    const btn = document.getElementById('geo-draw-btn');
    if (btn) {
        btn.style.background = '#2a2a36';
        btn.style.borderColor = '#555';
        btn.classList.remove('btn-mode-active');
    }
};

// Alias utilisé par draw.js pour fermer ce sous-menu
window.closeGeoSubmenu = window.closeGeoToolbar;

// Appelé depuis le bouton dans la barre dessin
window.toggleGeoFromDrawBar = function () {
    const btn = document.getElementById('geo-draw-btn');
    const isOpen = bar.classList.contains('open');
    if (isOpen) {
        bar.classList.remove('open');
        if (btn) { btn.style.background = '#2a2a36'; btn.style.borderColor = '#555'; btn.classList.remove('btn-mode-active'); }
    } else {
        // Fermer le sous-menu figures géométriques avant d'ouvrir celui-ci
        const figSub = document.getElementById('figures-submenu');
        if (figSub) figSub.classList.remove('open');
        if (typeof _setBtnActive === 'function') {
            _setBtnActive('draw-figures-btn', false, 'figures');
            _setBtnActive('draw-select-btn', false);
            _setBtnActive('draw-free-btn', false);
        } else {
            const figBtn = document.getElementById('draw-figures-btn');
            if (figBtn) { figBtn.style.borderColor = '#444'; figBtn.style.background = '#2a2a2e'; figBtn.style.color = '#aaa'; }
            const selBtn = document.getElementById('draw-select-btn');
            if (selBtn) { selBtn.style.borderColor = '#444'; selBtn.style.background = '#2a2a2e'; selBtn.style.color = '#aaa'; }
            const freeBtn = document.getElementById('draw-free-btn');
            if (freeBtn) { freeBtn.style.borderColor = '#444'; freeBtn.style.background = '#2a2a2e'; freeBtn.style.color = '#aaa'; }
        }
        bar.classList.add('open');
        if (btn) { btn.style.background = '#1a2a4a'; btn.style.borderColor = '#a78bfa'; btn.classList.add('btn-mode-active'); }
    }
};

// ── Utilitaire : tracer sur le canvas de dessin ───────────────────────────
function getDrawCanvas() {
    return document.getElementById('draw-canvas');
}

function getDrawColor() {
    // Lire la couleur active du crayon (même logique que draw.js)
    if (typeof cpickGetValue === 'function') {
        const c = cpickGetValue('draw-color');
        if (c) return c;
    }
    const native = document.getElementById('cpick-native-draw-color');
    if (native) return native.value;
    return '#222222';
}

function getDrawSize() {
    const el = document.getElementById('draw-size');
    return el ? parseInt(el.value) || 3 : 3;
}

function traceOnCanvas(pointsList) {
    // pointsList : tableau de tableaux [{x,y}] — un tableau par trait
    // On pousse chaque trait comme un vrai stroke dans draw.js
    const color = getDrawColor();
    const size  = getDrawSize();

    if (typeof window.strokes !== 'undefined' && typeof window.redrawStrokes === 'function') {
        pointsList.forEach(function (pts) {
            if (pts.length < 2) return;
            window.strokes.push({ points: pts, color: color, size: size });
        });
        window.redrawStrokes();
        if (typeof saveBoard === 'function') saveBoard();
        return;
    }

    // Fallback : tracer directement sur le canvas sans passer par strokes
    const canvas = getDrawCanvas();
    if (!canvas) { alert('Canvas de dessin non disponible.'); return; }
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth   = size;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    pointsList.forEach(function (pts) {
        if (pts.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        pts.forEach(function (p) { ctx.lineTo(p.x, p.y); });
        ctx.stroke();
    });
    ctx.restore();
    if (typeof saveBoard === 'function') saveBoard();
}

// ── Spawn d'un outil ─────────────────────────────────────────────────────
window.geoSpawnTool = function (type) {
    const board = document.getElementById('board');
    if (!board) return;

    // Centrer l'outil dans le viewport
    const bRect = board.getBoundingClientRect();
    const cx = (window.innerWidth  / 2) - bRect.left;
    const cy = (window.innerHeight / 2) - bRect.top;

    if      (type === 'regle')   spawnRegle(board, cx, cy);
    else if (type === 'equerre') spawnEquerre(board, cx, cy);
    else if (type === 'compas')  spawnCompas(board, cx, cy);
};

// ── Helpers drag + rotate ────────────────────────────────────────────────
function makeDraggableGeo(overlay, onDragEnd) {
    function startGeoDrag(clientX, clientY) {
        const board   = overlay.parentElement;
        const bRect   = board.getBoundingClientRect();
        const startX  = clientX - bRect.left - parseFloat(overlay.style.left || 0);
        const startY  = clientY - bRect.top  - parseFloat(overlay.style.top  || 0);
        overlay.classList.add('geo-selected');
        overlay.style.cursor = 'grabbing';

        function onMove(ev) {
            const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
            const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
            overlay.style.left = (cx - bRect.left - startX) + 'px';
            overlay.style.top  = (cy - bRect.top  - startY) + 'px';
            if (onDragEnd) onDragEnd(); // repositionne la barre en temps réel
        }
        function onEnd() {
            overlay.style.cursor = 'move';
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup',   onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            if (onDragEnd) onDragEnd();
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }

    overlay.addEventListener('mousedown', function (e) {
        if (e.target.classList.contains('geo-rot-handle') ||
            e.target.classList.contains('geo-trace-btn')  ||
            e.target.classList.contains('geo-close-tool') ||
            e.target.tagName === 'INPUT') return;
        e.preventDefault(); e.stopPropagation();
        startGeoDrag(e.clientX, e.clientY);
    });
    overlay.addEventListener('touchstart', function (e) {
        if (e.target.classList.contains('geo-rot-handle') ||
            e.target.classList.contains('geo-trace-btn')  ||
            e.target.classList.contains('geo-close-tool') ||
            e.target.tagName === 'INPUT') return;
        e.preventDefault(); e.stopPropagation();
        startGeoDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
}

function makeRotatableGeo(overlay, rotHandle) {
    rotHandle.ondblclick = function (e) {
        e.preventDefault(); e.stopPropagation();
        overlay.style.transform = '';
        overlay.dataset.angle = '0';
    };

    function startGeoRotate(clientX, clientY) {
        const rect = overlay.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const startAngle = Math.atan2(clientY - cy, clientX - cx);
        const startRot   = parseFloat(overlay.dataset.angle || 0);
        const indicator  = document.getElementById('rotation-indicator');

        function onMove(ev) {
            const px = ev.touches ? ev.touches[0].clientX : ev.clientX;
            const py = ev.touches ? ev.touches[0].clientY : ev.clientY;
            const newRot = startRot + (Math.atan2(py - cy, px - cx) - startAngle) * 180 / Math.PI;
            const snapped = geoSnapRotation(newRot);
            overlay.style.transform = `rotate(${snapped}deg)`;
            overlay.dataset.angle = snapped;
            if (indicator) {
                const deg = Math.round(((snapped % 360) + 360) % 360);
                const rotDeg = document.getElementById('rot-deg');
                if (rotDeg) rotDeg.textContent = deg + '°';
                indicator.style.display = 'block';
                indicator.style.left = px + 16 + 'px';
                indicator.style.top  = py + 'px';
                const hint = indicator.querySelector('.rot-reset-hint');
                if (hint) hint.style.display = (deg === 0) ? 'none' : 'inline';
            }
        }
        function onEnd() {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup',   onEnd);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            document.onmousemove = null;
            document.onmouseup   = null;
            const ind = document.getElementById('rotation-indicator');
            if (ind) ind.style.display = 'none';
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onEnd);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }

    rotHandle.onmousedown = function (e) {
        e.preventDefault(); e.stopPropagation();
        startGeoRotate(e.clientX, e.clientY);
    };
    rotHandle.addEventListener('touchstart', function (e) {
        e.preventDefault(); e.stopPropagation();
        startGeoRotate(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
}

function geoSnapRotation(deg) {
    const snaps = [0, 45, 90, 135, 180, 225, 270, 315, 360];
    const norm = ((deg % 360) + 360) % 360;
    for (const s of snaps) {
        if (Math.abs(norm - s) < 2) return s === 360 ? 0 : s;
    }
    return deg;
}

// ── Helper : rend un bouton cliquable au toucher même quand le parent
//    appelle preventDefault() sur touchstart ────────────────────────────────
function addTouchClick(btn, handler) {
    btn.addEventListener('touchend', function (e) {
        e.stopPropagation();
        e.preventDefault();
        handler(e);
    }, { passive: false });
}

// ── Obtenir la transformation monde d'un overlay ─────────────────────────
function getOverlayTransform(overlay) {
    const x = parseFloat(overlay.style.left || 0);
    const y = parseFloat(overlay.style.top  || 0);
    // Lire l'angle depuis style.transform (cohérent avec makeRotatableGeo)
    const m = overlay.style.transform && overlay.style.transform.match(/rotate\(([-\d.]+)deg\)/);
    const angle = m ? parseFloat(m[1]) * Math.PI / 180 : 0;
    const cx = x + overlay.offsetWidth  / 2;
    const cy = y + overlay.offsetHeight / 2;
    return { x, y, angle, cx, cy };
}

// Rotation d'un point autour d'un centre
function rotatePoint(px, py, cx, cy, angle) {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    return {
        x: cos * (px - cx) - sin * (py - cy) + cx,
        y: sin * (px - cx) + cos * (py - cy) + cy
    };
}

// ── RÈGLE ─────────────────────────────────────────────────────────────────
function spawnRegle(board, cx, cy) {
    const W = 800, H = 60;
    const BTN_H = 32; // hauteur de la bande de boutons sous la règle
    const TOTAL_H = H + BTN_H;
    const UNIT = 40;

    const overlay = document.createElement('div');
    overlay.className = 'geo-tool-overlay';
    overlay.dataset.angle = '0';
    overlay.style.cssText = `left:${cx - W/2}px; top:${cy - TOTAL_H/2}px; width:${W}px; height:${TOTAL_H}px;`;

    // ── SVG règle ──
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.style.cssText = 'display:block; position:absolute; top:0; left:0; pointer-events:none;';

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', 0); rect.setAttribute('y', 0);
    rect.setAttribute('width', W); rect.setAttribute('height', H);
    rect.setAttribute('rx', 4);
    rect.setAttribute('fill', 'rgba(255, 245, 180, 0.93)');
    rect.setAttribute('stroke', '#b8860b'); rect.setAttribute('stroke-width', '1.5');
    svg.appendChild(rect);

    const TENTH = UNIT / 10;
    const totalTenths = W / TENTH;
    for (let t10 = 0; t10 <= totalTenths; t10++) {
        const x = t10 * TENTH;
        const isUnit = t10 % 10 === 0;
        const isHalf = t10 % 5  === 0 && !isUnit;
        const tickH  = isUnit ? 22 : (isHalf ? 13 : 7);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x); line.setAttribute('y1', 0);
        line.setAttribute('x2', x); line.setAttribute('y2', tickH);
        line.setAttribute('stroke', '#7a5c00');
        line.setAttribute('stroke-width', isUnit ? '1.5' : '0.6');
        svg.appendChild(line);
        if (isUnit && x >= 0 && x < W) {
            const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            txt.setAttribute('x', x); txt.setAttribute('y', 36);
            txt.setAttribute('text-anchor', 'middle');
            txt.setAttribute('font-size', '10');
            txt.setAttribute('fill', '#7a5c00');
            txt.setAttribute('font-family', 'monospace');
            txt.textContent = t10 / 10;
            svg.appendChild(txt);
        }
    }

    // ── Bande de boutons intégrée SOUS la règle ───────────────────────────
    const btnBar = document.createElement('div');
    btnBar.style.cssText = `
        position:absolute; top:${H}px; left:0; width:${W}px; height:${BTN_H}px;
        display:flex; align-items:center; justify-content:center; gap:8px;
        background:rgba(26,26,34,0.82); border-radius:0 0 8px 8px;
        border:1px solid #554466; border-top:none;
        box-sizing:border-box; padding:0 8px;
        pointer-events:auto;
    `;

    // Bouton fermer
    const closeBtn = document.createElement('button');
    closeBtn.className = 'geo-close-tool';
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `position:relative; width:20px; height:20px; font-size:13px;
        border-radius:50%; background:#e74c3c; color:#fff; border:none;
        cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center;`;
    closeBtn.onmousedown = e => e.stopPropagation();
    closeBtn.onclick     = e => { e.stopPropagation(); overlay.remove(); };
    addTouchClick(closeBtn, () => { overlay.remove(); });

    // Poignée rotation
    const rotH = document.createElement('div');
    rotH.className = 'geo-rot-handle';
    rotH.textContent = '↻';
    rotH.style.cssText = `position:relative; width:22px; height:22px; font-size:12px;
        border-radius:50%; background:#6aaee8; color:#fff; border:2px solid #fff;
        cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center;
        box-shadow:0 2px 6px rgba(0,0,0,0.4);`;

    // Bouton tracer
    const traceBtn = document.createElement('button');
    traceBtn.className = 'geo-trace-btn';
    traceBtn.textContent = '✏️ Tracer la ligne';
    traceBtn.style.cssText = 'position:relative; cursor:pointer !important; flex-shrink:0; font-size:11px; padding:3px 8px;';
    traceBtn.onclick = function (e) {
        e.stopPropagation();
        const t = getOverlayTransform(overlay);
        const ox = parseFloat(overlay.style.left || 0);
        const oy = parseFloat(overlay.style.top  || 0);
        // Tracer le bord supérieur de la règle (y = oy)
        const p1 = rotatePoint(ox,     oy, t.cx, t.cy, t.angle);
        const p2 = rotatePoint(ox + W, oy, t.cx, t.cy, t.angle);
        const pts = [];
        const steps = Math.max(2, Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 3));
        for (let i = 0; i <= steps; i++) {
            pts.push({ x: p1.x + (p2.x - p1.x) * i / steps,
                       y: p1.y + (p2.y - p1.y) * i / steps });
        }
        traceOnCanvas([pts]);
    };
    addTouchClick(traceBtn, function() { traceBtn.onclick({ stopPropagation: ()=>{} }); });

    btnBar.appendChild(closeBtn);
    btnBar.appendChild(rotH);
    btnBar.appendChild(traceBtn);

    overlay.appendChild(svg);
    overlay.appendChild(btnBar);
    board.appendChild(overlay);

    makeDraggableGeo(overlay, null);
    makeRotatableGeo(overlay, rotH);
}

// ── ÉQUERRE ───────────────────────────────────────────────────────────────
function spawnEquerre(board, cx, cy) {
    const CAT = 300;
    const W = CAT + 20, H = CAT + 20;
    const OVW = W + 40, OVH = H + 40;

    const overlay = document.createElement('div');
    overlay.className = 'geo-tool-overlay';
    overlay.dataset.angle = '0';
    overlay.style.cssText = `left:${cx - OVW/2}px; top:${cy - OVH/2}px; width:${OVW}px; height:${OVH}px;`;

    // ── SVG équerre ──
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', OVW);
    svg.setAttribute('height', OVH);
    svg.style.cssText = 'display:block; position:absolute; top:0; left:0; pointer-events:none;';

    const OX = 15, OY = H + 5;

    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', `${OX},${OY} ${OX + CAT},${OY} ${OX},${OY - CAT}`);
    poly.setAttribute('fill', 'rgba(180,230,255,0.88)');
    poly.setAttribute('stroke', '#1a6eab'); poly.setAttribute('stroke-width', '2');
    poly.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(poly);

    const sq = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    sq.setAttribute('points', `${OX + 14},${OY} ${OX + 14},${OY - 14} ${OX},${OY - 14}`);
    sq.setAttribute('fill', 'none');
    sq.setAttribute('stroke', '#1a6eab'); sq.setAttribute('stroke-width', '1.5');
    svg.appendChild(sq);

    function addAngle(x, y, txt) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        el.setAttribute('x', x); el.setAttribute('y', y);
        el.setAttribute('font-size', '11'); el.setAttribute('fill', '#1a6eab');
        el.setAttribute('font-weight', 'bold');
        el.textContent = txt; svg.appendChild(el);
    }
    addAngle(OX + CAT - 52, OY - 10,      '45°');
    addAngle(OX + 12,       OY - CAT + 46, '45°');
    addAngle(OX + 18,       OY - 18,       '90°');

    // ── Boutons intégrés dans l'équerre ──────────────────────────────────────
    // Fermer + Rotation : colonne verticale dans le coin haut gauche du triangle
    //   sous le label 45° du haut (OX+12, OY-CAT+46) → on part de y≈OY-CAT+60
    // Boutons tracer : ligne horizontale le long de la base, à l'intérieur

    // Bouton fermer — dans le triangle, sous le 45° du haut
    const closeBtn = document.createElement('button');
    closeBtn.className = 'geo-close-tool';
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `position:absolute; left:${OX + 20}px; top:${OY - CAT + 60}px;
        width:22px; height:22px; font-size:13px;
        border-radius:50%; background:#e74c3c; color:#fff; border:none;
        cursor:pointer; display:flex; align-items:center; justify-content:center;
        box-shadow:0 2px 4px rgba(0,0,0,0.4); z-index:4;`;
    closeBtn.onmousedown = e => e.stopPropagation();
    closeBtn.onclick     = e => { e.stopPropagation(); overlay.remove(); };
    addTouchClick(closeBtn, () => { overlay.remove(); });

    // Poignée rotation — juste sous le bouton fermer
    const rotH = document.createElement('div');
    rotH.className = 'geo-rot-handle';
    rotH.textContent = '↻';
    rotH.style.cssText = `position:absolute; left:${OX + 18}px; top:${OY - CAT + 88}px;
        width:26px; height:26px; font-size:13px;
        border-radius:50%; background:#6aaee8; color:#fff; border:2px solid #fff;
        cursor:pointer; display:flex; align-items:center; justify-content:center;
        box-shadow:0 2px 6px rgba(0,0,0,0.5); z-index:4;`;

    // Boutons tracer — ligne horizontale le long de la base, à l'intérieur
    const traceBtnBar = document.createElement('div');
    traceBtnBar.style.cssText = `
        position:absolute; left:${OX + 30}px; top:${OY - 26}px;
        display:flex; align-items:center; gap:6px;
        pointer-events:auto; z-index:4;
    `;

    function makeTraceBtnInline(label, drawFn) {
        const b = document.createElement('button');
        b.className = 'geo-trace-btn';
        b.textContent = label;
        b.style.cssText = 'position:relative; cursor:pointer !important; flex-shrink:0; font-size:10px; padding:3px 7px;';
        b.onmousedown = e => e.stopPropagation();
        b.onclick = e => { e.stopPropagation(); drawFn(); };
        addTouchClick(b, drawFn);
        return b;
    }

    function makeLine(ax, ay, bx, by) {
        const t = getOverlayTransform(overlay);
        const p1 = rotatePoint(ax, ay, t.cx, t.cy, t.angle);
        const p2 = rotatePoint(bx, by, t.cx, t.cy, t.angle);
        const pts = [];
        const steps = Math.max(2, Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 3));
        for (let i = 0; i <= steps; i++) {
            pts.push({ x: p1.x + (p2.x - p1.x) * i / steps,
                       y: p1.y + (p2.y - p1.y) * i / steps });
        }
        return pts;
    }

    const ox = () => parseFloat(overlay.style.left || 0);
    const oy = () => parseFloat(overlay.style.top  || 0);

    traceBtnBar.appendChild(makeTraceBtnInline('✏️ Base', () => {
        traceOnCanvas([makeLine(ox() + OX, oy() + OY, ox() + OX + CAT, oy() + OY)]);
    }));
    traceBtnBar.appendChild(makeTraceBtnInline('✏️ Côté', () => {
        traceOnCanvas([makeLine(ox() + OX, oy() + OY, ox() + OX, oy() + OY - CAT)]);
    }));
    traceBtnBar.appendChild(makeTraceBtnInline('📐 Angle droit', () => {
        traceOnCanvas([
            makeLine(ox() + OX, oy() + OY, ox() + OX + CAT, oy() + OY),
            makeLine(ox() + OX, oy() + OY, ox() + OX,       oy() + OY - CAT)
        ]);
    }));

    overlay.appendChild(svg);
    overlay.appendChild(closeBtn);
    overlay.appendChild(rotH);
    overlay.appendChild(traceBtnBar);
    board.appendChild(overlay);

    makeDraggableGeo(overlay, null);
    makeRotatableGeo(overlay, rotH);
}

// ── COMPAS ────────────────────────────────────────────────────────────────
function spawnCompas(board, cx, cy) {
    const MAX_R = 400, MIN_R = 20;
    let radius = 100;

    // Dimensions de l'overlay (SVG seul, sans barre intégrée)
    const OVW = 460, OVH = 436;
    const overlay = document.createElement('div');
    overlay.className = 'geo-tool-overlay';
    overlay.dataset.angle = '0';
    overlay.style.cssText = `left:${cx - OVW/2}px; top:${cy - 60}px; width:${OVW}px; height:${OVH}px;`;

    // ── Barre de contrôle FIXE (body-level, toujours visible) ───────────
    const BAR_W = 400;
    const ctrlBar = document.createElement('div');
    ctrlBar.style.cssText = `
        position:fixed; width:${BAR_W}px; height:44px; z-index:19000;
        display:flex; align-items:center; justify-content:center; gap:8px;
        background:rgba(26,26,34,0.96); border-radius:10px;
        border:1px solid #554466; padding:0 10px; box-sizing:border-box;
        pointer-events:auto; cursor:default;
        box-shadow:0 4px 16px rgba(0,0,0,0.5);
    `;

    // Positionne la barre en fixed en fonction de la position de l'overlay
    function repositionBar() {
        const bRect  = board.getBoundingClientRect();
        const ovLeft = parseFloat(overlay.style.left || 0);
        const ovTop  = parseFloat(overlay.style.top  || 0);
        const MARGIN = 8;

        // Centre X de l'overlay en coordonnées viewport
        const centerX = bRect.left + ovLeft + OVW / 2;
        let barLeft = centerX - BAR_W / 2;
        barLeft = Math.max(MARGIN, Math.min(barLeft, window.innerWidth - BAR_W - MARGIN));

        // Y : juste au-dessus de l'overlay si possible, sinon juste en-dessous
        const ovTopVP = bRect.top + ovTop;
        let barTop = ovTopVP - 52;
        if (barTop < MARGIN) {
            barTop = ovTopVP + OVH + 8;
            if (barTop + 44 > window.innerHeight - MARGIN) barTop = MARGIN;
        }

        ctrlBar.style.left = barLeft + 'px';
        ctrlBar.style.top  = barTop  + 'px';
    }

    // Bouton fermer — tout à gauche de la barre
    const closeBtn = document.createElement('button');
    closeBtn.className = 'geo-close-tool';
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
        position:relative; width:24px; height:24px; font-size:14px;
        border-radius:50%; background:#e74c3c; color:#fff; border:none;
        cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center;
    `;
    closeBtn.onmousedown = e => e.stopPropagation();
    closeBtn.onclick     = e => { e.stopPropagation(); overlay.remove(); ctrlBar.remove(); };
    addTouchClick(closeBtn, () => { overlay.remove(); ctrlBar.remove(); });

    // Poignée rotation — juste à droite du bouton fermer
    const rotH = document.createElement('div');
    rotH.className = 'geo-rot-handle';
    rotH.textContent = '↻';
    rotH.style.cssText = `
        position:relative; width:24px; height:24px; font-size:13px;
        border-radius:50%; background:#6aaee8; color:#fff; border:2px solid #fff;
        cursor:pointer; flex-shrink:0; display:flex; align-items:center; justify-content:center;
        box-shadow:0 2px 6px rgba(0,0,0,0.4);
    `;

    // Slider rayon
    const sliderLabel = document.createElement('span');
    sliderLabel.textContent = 'Rayon';
    sliderLabel.style.cssText = 'color:#ccc; font-size:11px; white-space:nowrap; flex-shrink:0;';

    const slider = document.createElement('input');
    slider.type = 'range'; slider.min = MIN_R; slider.max = MAX_R;
    slider.value = radius; slider.step = '2';
    slider.style.cssText = 'width:90px; accent-color:#a78bfa; cursor:pointer; flex-shrink:0;';
    slider.addEventListener('mousedown', e => e.stopPropagation());
    slider.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });

    const rVal = document.createElement('span');
    rVal.textContent = radius + 'px';
    rVal.style.cssText = 'color:#a78bfa; font-size:11px; font-weight:700; min-width:36px; flex-shrink:0;';

    slider.addEventListener('input', function () {
        radius = parseInt(this.value);
        rVal.textContent = radius + 'px';
        updateSvg();
    });

    // Bouton tracer
    const traceBtn = document.createElement('button');
    traceBtn.className = 'geo-trace-btn';
    traceBtn.textContent = '⭕ Tracer';
    traceBtn.style.cssText = 'position:relative; cursor:pointer !important; flex-shrink:0;';

    ctrlBar.appendChild(closeBtn);
    ctrlBar.appendChild(rotH);
    ctrlBar.appendChild(sliderLabel);
    ctrlBar.appendChild(slider);
    ctrlBar.appendChild(rVal);
    ctrlBar.appendChild(traceBtn);

    // ── SVG compas (occupe tout l'overlay) ───────────────────────────────
    const SVG_W = OVW, SVG_H = OVH;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width',  SVG_W);
    svg.setAttribute('height', SVG_H);
    svg.style.cssText = `display:block; position:absolute; top:0; left:0; pointer-events:none;`;

    // Defs : dégradés pour les bras
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');

    function makeArmGrad(id, col1, col2) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
        g.setAttribute('id', id);
        g.setAttribute('x1', '0%'); g.setAttribute('y1', '0%');
        g.setAttribute('x2', '100%'); g.setAttribute('y2', '0%');
        const s1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s1.setAttribute('offset', '0%');   s1.setAttribute('stop-color', col1);
        const s2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
        s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', col2);
        g.appendChild(s1); g.appendChild(s2);
        return g;
    }
    defs.appendChild(makeArmGrad('grad-arm-left',  '#8a8a9a', '#4a4a5a'));
    defs.appendChild(makeArmGrad('grad-arm-right', '#7a9ab8', '#3a5a78'));
    svg.appendChild(defs);

    // Pivot (centre géométrique, en haut au milieu du SVG)
    const PIV_X = SVG_W / 2, PIV_Y = 30;
    const ARM_LEN = 200; // bras plus courts

    // Éléments SVG (créés vides, positionnés par updateSvg)
    // Cercle preview
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    // Bras gauche (pointe) — polygon pour avoir de l'épaisseur variable
    const armLeftPoly  = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    // Bras droit (mine) — polygon
    const armRightPoly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');

    // Pointe métallique : triangle allongé argenté
    const pointeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const pointeBody  = document.createElementNS('http://www.w3.org/2000/svg', 'polygon'); // corps argenté
    const pointeTip   = document.createElementNS('http://www.w3.org/2000/svg', 'polygon'); // extrémité sombre

    // Mine (crayon) : corps coloré + mine graphite + ligne de couleur
    const mineGroup  = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const mineBody   = document.createElementNS('http://www.w3.org/2000/svg', 'polygon'); // corps bois clair
    const minePaint  = document.createElementNS('http://www.w3.org/2000/svg', 'polygon'); // capuchon coloré
    const mineGraphite = document.createElementNS('http://www.w3.org/2000/svg', 'polygon'); // mine grise
    const mineTip    = document.createElementNS('http://www.w3.org/2000/svg', 'circle');   // pointe mine

    // Pivot visuel (par-dessus tout)
    const pivCircOuter = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    const pivCircInner = document.createElementNS('http://www.w3.org/2000/svg', 'circle');

    pointeGroup.appendChild(pointeBody);
    pointeGroup.appendChild(pointeTip);
    mineGroup.appendChild(mineBody);
    mineGroup.appendChild(minePaint);
    mineGroup.appendChild(mineGraphite);
    mineGroup.appendChild(mineTip);

    svg.appendChild(circle);
    svg.appendChild(armLeftPoly);
    svg.appendChild(armRightPoly);
    svg.appendChild(pointeGroup);
    svg.appendChild(mineGroup);
    svg.appendChild(pivCircOuter);
    svg.appendChild(pivCircInner);

    // Helper : calcule le polygon d'un bras épais (trapèze)
    // de (x1,y1) vers (x2,y2), largeur w1 à la base, w2 à l'extrémité
    function armPolygon(x1, y1, x2, y2, w1, w2) {
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const nx = -dy / len, ny = dx / len; // normale
        return [
            x1 + nx * w1, y1 + ny * w1,
            x1 - nx * w1, y1 - ny * w1,
            x2 - nx * w2, y2 - ny * w2,
            x2 + nx * w2, y2 + ny * w2
        ].join(' ');
    }

    // Helper : triangle orienté vers (tx,ty) depuis (bx,by), largeur w, longueur l
    function tipPolygon(bx, by, tx, ty, w, l) {
        const dx = tx - bx, dy = ty - by;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len, uy = dy / len;
        const nx = -uy, ny = ux;
        // base à distance (len-l) depuis bx,by, pointe à (tx,ty)
        const mbx = bx + ux * (len - l), mby = by + uy * (len - l);
        return [
            mbx + nx * w, mby + ny * w,
            mbx - nx * w, mby - ny * w,
            tx, ty
        ].join(' ');
    }

    function updateSvg() {
        const halfAngle = Math.min(Math.asin(Math.min(radius / (2 * ARM_LEN), 1)), Math.PI / 2);

        // Extrémités des bras
        const lx = PIV_X - Math.sin(halfAngle) * ARM_LEN;
        const ly = PIV_Y + Math.cos(halfAngle) * ARM_LEN;
        const rx = PIV_X + Math.sin(halfAngle) * ARM_LEN;
        const ry = PIV_Y + Math.cos(halfAngle) * ARM_LEN;

        // ── Bras gauche (pointe) : acier, épais en haut, fin en bas
        armLeftPoly.setAttribute('points', armPolygon(PIV_X, PIV_Y, lx, ly, 7, 3));
        armLeftPoly.setAttribute('fill', 'url(#grad-arm-left)');
        armLeftPoly.setAttribute('stroke', '#333'); armLeftPoly.setAttribute('stroke-width', '0.5');

        // ── Bras droit (mine) : bleu acier, idem
        armRightPoly.setAttribute('points', armPolygon(PIV_X, PIV_Y, rx, ry, 7, 3));
        armRightPoly.setAttribute('fill', 'url(#grad-arm-right)');
        armRightPoly.setAttribute('stroke', '#333'); armRightPoly.setAttribute('stroke-width', '0.5');

        // ── Pointe métallique (bras gauche) ──
        // Corps argenté : 20px depuis l'extrémité
        pointeBody.setAttribute('points', tipPolygon(PIV_X, PIV_Y, lx, ly, 4, 22));
        pointeBody.setAttribute('fill', '#c0c0c0');
        pointeBody.setAttribute('stroke', '#888'); pointeBody.setAttribute('stroke-width', '0.5');
        // Extrémité acérée plus sombre (8px)
        pointeTip.setAttribute('points', tipPolygon(PIV_X, PIV_Y, lx, ly, 1.5, 8));
        pointeTip.setAttribute('fill', '#555');

        // ── Mine / Crayon (bras droit) ──
        // Corps du crayon (bois clair) : 28px depuis l'extrémité, largeur 5
        mineBody.setAttribute('points', tipPolygon(PIV_X, PIV_Y, rx, ry, 5, 30));
        mineBody.setAttribute('fill', '#f0c040');
        mineBody.setAttribute('stroke', '#b88800'); mineBody.setAttribute('stroke-width', '0.5');
        // Capuchon coloré (haut du crayon) : 6px tout en haut de la partie bois
        minePaint.setAttribute('points', tipPolygon(PIV_X, PIV_Y, rx, ry, 5, 8));
        minePaint.setAttribute('fill', '#e05050');
        // Graphite (mine grise pointue) : 10px depuis l'extrémité, plus étroite
        mineGraphite.setAttribute('points', tipPolygon(PIV_X, PIV_Y, rx, ry, 2.5, 12));
        mineGraphite.setAttribute('fill', '#444');
        // Pointe de la mine (petit cercle rouge-violet à l'extrémité exacte)
        mineTip.setAttribute('cx', rx); mineTip.setAttribute('cy', ry);
        mineTip.setAttribute('r', '3');
        mineTip.setAttribute('fill', '#a78bfa');
        mineTip.setAttribute('stroke', '#fff'); mineTip.setAttribute('stroke-width', '1');

        // ── Cercle preview centré sur la pointe ──
        circle.setAttribute('cx', lx); circle.setAttribute('cy', ly);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', 'rgba(167,139,250,0.45)');
        circle.setAttribute('stroke-width', '1.5');
        circle.setAttribute('stroke-dasharray', '7 4');

        // ── Pivot visuel ──
        pivCircOuter.setAttribute('cx', PIV_X); pivCircOuter.setAttribute('cy', PIV_Y);
        pivCircOuter.setAttribute('r', '11');
        pivCircOuter.setAttribute('fill', '#6a6a7a');
        pivCircOuter.setAttribute('stroke', '#222'); pivCircOuter.setAttribute('stroke-width', '1.5');
        pivCircInner.setAttribute('cx', PIV_X); pivCircInner.setAttribute('cy', PIV_Y);
        pivCircInner.setAttribute('r', '5');
        pivCircInner.setAttribute('fill', '#bbb');
        pivCircInner.setAttribute('stroke', '#444'); pivCircInner.setAttribute('stroke-width', '1');

        // Stocker les coords pour le tracé (dans le repère de l'overlay)
        overlay.dataset.pivX   = lx;
        overlay.dataset.pivY   = ly;
        overlay.dataset.radius = radius;
    }

    // ── Bouton tracer (logique inchangée) ───────────────────────────────
    traceBtn.onclick = function (e) {
        e.stopPropagation();
        const t    = getOverlayTransform(overlay);
        const pivX = parseFloat(overlay.dataset.pivX || 0);
        const pivY = parseFloat(overlay.dataset.pivY || 0);
        const r    = parseFloat(overlay.dataset.radius || radius);
        const ox   = parseFloat(overlay.style.left || 0);
        const oy   = parseFloat(overlay.style.top  || 0);
        const worldPiv = rotatePoint(ox + pivX, oy + pivY, t.cx, t.cy, t.angle);

        const C = 6;
        const cx_ = worldPiv.x, cy_ = worldPiv.y;
        const steps = Math.max(60, Math.round(2 * Math.PI * r / 3));
        const gid = 'geo-' + Date.now();

        const ptsCercle = [];
        for (let i = 0; i <= steps; i++) {
            const a = (i / steps) * 2 * Math.PI;
            ptsCercle.push({ x: cx_ + Math.cos(a) * r, y: cy_ + Math.sin(a) * r });
        }
        const ptsH = [{ x: cx_ - C, y: cy_ }, { x: cx_ + C, y: cy_ }];
        const ptsV = [{ x: cx_, y: cy_ - C }, { x: cx_, y: cy_ + C }];

        const color = getDrawColor(), size = getDrawSize();
        if (typeof window.strokes !== 'undefined' && typeof window.redrawStrokes === 'function') {
            [ptsCercle, ptsH, ptsV].forEach(pts => {
                window.strokes.push({ points: pts, color, size, groupId: gid });
            });
            window.redrawStrokes();
            if (typeof saveBoard === 'function') saveBoard();
        }
    };
    addTouchClick(traceBtn, function() { traceBtn.onclick({ stopPropagation: ()=>{} }); });

    overlay.appendChild(svg);
    board.appendChild(overlay);
    document.body.appendChild(ctrlBar);

    updateSvg();
    repositionBar();

    // Rebrancher repositionBar après chaque drag
    makeDraggableGeo(overlay, repositionBar);
    makeRotatableGeo(overlay, rotH);
}

// ── Fermer la barre géo quand la barre dessin se ferme ────────────────────
document.addEventListener('DOMContentLoaded', function () {
    const drawToolbar = document.getElementById('draw-toolbar');
    if (drawToolbar) {
        new MutationObserver(function () {
            if (drawToolbar.style.display === 'none') {
                window.closeGeoToolbar();
            }
        }).observe(drawToolbar, { attributes: true, attributeFilter: ['style'] });
    }
});

})();
