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
    left: 84px;
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
    cursor: grab;
    user-select: none;
    touch-action: none;
}
.geo-tool-overlay:active { cursor: grabbing; }
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
    // Réinitialiser le bouton dans la barre dessin
    const btn = document.getElementById('geo-draw-btn');
    if (btn) {
        btn.style.background = '#2a2a36';
        btn.style.borderColor = '#555';
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
        if (btn) { btn.style.background = '#2a2a36'; btn.style.borderColor = '#555'; }
    } else {
        // Fermer le sous-menu figures géométriques avant d'ouvrir celui-ci
        const figSub = document.getElementById('figures-submenu');
        if (figSub) figSub.classList.remove('open');
        const figBtn = document.getElementById('draw-figures-btn');
        if (figBtn) { figBtn.style.borderColor = '#444'; figBtn.style.background = '#2a2a2e'; figBtn.style.color = '#aaa'; }
        // Désactiver le bouton sélection
        const selBtn = document.getElementById('draw-select-btn');
        if (selBtn) { selBtn.style.borderColor = '#444'; selBtn.style.background = '#2a2a2e'; selBtn.style.color = '#aaa'; }
        // Désactiver le bouton dessin libre
        const freeBtn = document.getElementById('draw-free-btn');
        if (freeBtn) { freeBtn.style.borderColor = '#444'; freeBtn.style.background = '#2a2a2e'; freeBtn.style.color = '#aaa'; }
        bar.classList.add('open');
        if (btn) { btn.style.background = '#1a2a4a'; btn.style.borderColor = '#a78bfa'; }
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
function makeDraggableGeo(overlay) {
    overlay.addEventListener('mousedown', function (e) {
        if (e.target.classList.contains('geo-rot-handle') ||
            e.target.classList.contains('geo-trace-btn')  ||
            e.target.classList.contains('geo-close-tool') ||
            e.target.tagName === 'INPUT') return;
        e.preventDefault();
        e.stopPropagation();
        const board   = overlay.parentElement;
        const bRect   = board.getBoundingClientRect();
        const startX  = e.clientX - bRect.left - parseFloat(overlay.style.left || 0);
        const startY  = e.clientY - bRect.top  - parseFloat(overlay.style.top  || 0);
        overlay.classList.add('geo-selected');
        overlay.style.cursor = 'grabbing';

        function onMove(ev) {
            overlay.style.left = (ev.clientX - bRect.left - startX) + 'px';
            overlay.style.top  = (ev.clientY - bRect.top  - startY) + 'px';
        }
        function onUp() {
            overlay.style.cursor = 'grab';
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup',   onUp);
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup',   onUp);
    });
}

function makeRotatableGeo(overlay, rotHandle) {
    // Double-clic : reset à 0°
    rotHandle.ondblclick = function (e) {
        e.preventDefault(); e.stopPropagation();
        overlay.style.transform = '';
        overlay.dataset.angle = '0';
    };

    rotHandle.onmousedown = function (e) {
        e.preventDefault(); e.stopPropagation();

        // Centre visuel réel de l'overlay (après rotation éventuelle)
        const rect = overlay.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;

        const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx);
        const startRot   = parseFloat(overlay.dataset.angle || 0);

        // Indicateur de rotation du système existant
        const indicator = document.getElementById('rotation-indicator');

        document.onmousemove = function (ev) {
            const newRot = startRot + (Math.atan2(ev.clientY - cy, ev.clientX - cx) - startAngle) * 180 / Math.PI;
            const snapped = geoSnapRotation(newRot);
            overlay.style.transform = `rotate(${snapped}deg)`;
            overlay.dataset.angle = snapped;

            if (indicator) {
                const deg = Math.round(((snapped % 360) + 360) % 360);
                const rotDeg = document.getElementById('rot-deg');
                if (rotDeg) rotDeg.textContent = deg + '°';
                indicator.style.display = 'block';
                indicator.style.left = ev.clientX + 16 + 'px';
                indicator.style.top  = ev.clientY + 'px';
                const hint = indicator.querySelector('.rot-reset-hint');
                if (hint) hint.style.display = (deg === 0) ? 'none' : 'inline';
            }
        };

        document.onmouseup = function () {
            document.onmousemove = null;
            document.onmouseup   = null;
            const ind = document.getElementById('rotation-indicator');
            if (ind) ind.style.display = 'none';
        };
    };
}

function geoSnapRotation(deg) {
    const snaps = [0, 45, 90, 135, 180, 225, 270, 315, 360];
    const norm = ((deg % 360) + 360) % 360;
    for (const s of snaps) {
        if (Math.abs(norm - s) < 2) return s === 360 ? 0 : s;
    }
    return deg;
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
    const W = 800, H = 60; // 20 unités à 40px/unité
    const UNIT = 40;       // 1 unité = 40 px
    const HALF = UNIT / 2; // demi-unité = 20 px
    const BTN_H = 28;      // hauteur de la barre de boutons au-dessus

    const overlay = document.createElement('div');
    overlay.className = 'geo-tool-overlay';
    overlay.dataset.angle = '0';
    overlay.style.cssText = `left:${cx - W/2}px; top:${cy - H/2}px; width:${W}px; height:${BTN_H + H + 34}px;`;

    // ── Barre du haut : uniquement le bouton fermer ──
    const btnBar = document.createElement('div');
    btnBar.style.cssText = `position:absolute; top:0; left:0; width:100%; height:${BTN_H}px;
        display:flex; align-items:center; justify-content:flex-end; padding-right:4px; box-sizing:border-box; pointer-events:auto; cursor:default;`;

    const closeBtn = document.createElement('button');
    closeBtn.className = 'geo-close-tool';
    closeBtn.textContent = '×';
    closeBtn.style.position = 'relative';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.setProperty('cursor', 'pointer', 'important');
    closeBtn.onclick = e => { e.stopPropagation(); overlay.remove(); };

    btnBar.appendChild(closeBtn);

    // ── Bouton tracer SOUS la règle ──
    const traceBtn = document.createElement('button');
    traceBtn.className = 'geo-trace-btn';
    traceBtn.textContent = '✏️ Tracer';
    traceBtn.style.cssText = `position:absolute; top:${BTN_H + H + 6}px; left:50%; transform:translateX(-50%); cursor:pointer !important;`;
    traceBtn.onclick = function (e) {
        e.stopPropagation();
        const t = getOverlayTransform(overlay);
        const ox = parseFloat(overlay.style.left || 0);
        const oy = parseFloat(overlay.style.top  || 0);
        const svgTop = oy + BTN_H;
        const p1 = rotatePoint(ox,     svgTop, t.cx, t.cy, t.angle);
        const p2 = rotatePoint(ox + W, svgTop, t.cx, t.cy, t.angle);
        const pts = [];
        const steps = Math.max(2, Math.round(Math.hypot(p2.x - p1.x, p2.y - p1.y) / 3));
        for (let i = 0; i <= steps; i++) {
            pts.push({ x: p1.x + (p2.x - p1.x) * i / steps,
                       y: p1.y + (p2.y - p1.y) * i / steps });
        }
        traceOnCanvas([pts]);
    };

    // ── SVG règle (en dessous de la barre) ──
    const svgWrap = document.createElement('div');
    svgWrap.style.cssText = `position:absolute; top:${BTN_H}px; left:0;`;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.style.display = 'block';
    svg.style.pointerEvents = 'none';

    // Corps
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', 0); rect.setAttribute('y', 0);
    rect.setAttribute('width', W); rect.setAttribute('height', H);
    rect.setAttribute('rx', 4);
    rect.setAttribute('fill', 'rgba(255, 245, 180, 0.93)');
    rect.setAttribute('stroke', '#b8860b'); rect.setAttribute('stroke-width', '1.5');
    svg.appendChild(rect);

    // Graduations — 0 à 20 unités, 1 unité = 40px, demi à 20px, dixièmes à 4px
    const TENTH = UNIT / 10; // = 4px
    const totalTenths = W / TENTH; // = 200
    for (let t10 = 0; t10 <= totalTenths; t10++) {
        const x = t10 * TENTH;
        const isUnit  = t10 % 10 === 0;
        const isHalf  = t10 % 5  === 0 && !isUnit;
        const tickH   = isUnit ? 22 : (isHalf ? 13 : 7);
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
    svgWrap.appendChild(svg);

    // ── Poignée rotation sur le bord DROIT de la règle ──
    const rotH = document.createElement('div');
    rotH.className = 'geo-rot-handle';
    rotH.textContent = '↻';
    rotH.style.cssText = `position:absolute; top:${BTN_H + H/2 - 10}px; right:-10px; cursor:pointer !important;`;

    overlay.appendChild(btnBar);
    overlay.appendChild(svgWrap);
    overlay.appendChild(traceBtn);
    overlay.appendChild(rotH);
    board.appendChild(overlay);

    makeDraggableGeo(overlay);
    makeRotatableGeo(overlay, rotH);
}

// ── ÉQUERRE ───────────────────────────────────────────────────────────────
function spawnEquerre(board, cx, cy) {
    // Équerre 45/45/90 — cathètes de 200px chacune
    const CAT = 300;
    const W = CAT + 20, H = CAT + 20;

    const overlay = document.createElement('div');
    overlay.className = 'geo-tool-overlay';
    overlay.dataset.angle = '0';
    overlay.style.cssText = `left:${cx - W/2}px; top:${cy - H/2}px; width:${W + 40}px; height:${H + 40}px;`;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', W + 40);
    svg.setAttribute('height', H + 40);
    svg.style.cssText = 'display:block; pointer-events:none;';

    const OX = 15, OY = H + 5; // origine (angle droit) en bas à gauche

    // Corps de l'équerre (triangle)
    const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    poly.setAttribute('points', `${OX},${OY} ${OX + CAT},${OY} ${OX},${OY - CAT}`);
    poly.setAttribute('fill', 'rgba(180,230,255,0.88)');
    poly.setAttribute('stroke', '#1a6eab'); poly.setAttribute('stroke-width', '2');
    poly.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(poly);

    // Symbole angle droit
    const sq = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    sq.setAttribute('points', `${OX + 14},${OY} ${OX + 14},${OY - 14} ${OX},${OY - 14}`);
    sq.setAttribute('fill', 'none');
    sq.setAttribute('stroke', '#1a6eab'); sq.setAttribute('stroke-width', '1.5');
    svg.appendChild(sq);

    // Angles
    const ang1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    ang1.setAttribute('x', OX + CAT - 52); ang1.setAttribute('y', OY - 10);
    ang1.setAttribute('font-size', '11'); ang1.setAttribute('fill', '#1a6eab');
    ang1.setAttribute('font-weight', 'bold');
    ang1.textContent = '45°'; svg.appendChild(ang1);

    const ang2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    ang2.setAttribute('x', OX + 12); ang2.setAttribute('y', OY - CAT + 46);
    ang2.setAttribute('font-size', '11'); ang2.setAttribute('fill', '#1a6eab');
    ang2.setAttribute('font-weight', 'bold');
    ang2.textContent = '45°'; svg.appendChild(ang2);

    const ang3 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    ang3.setAttribute('x', OX + 18); ang3.setAttribute('y', OY - 18);
    ang3.setAttribute('font-size', '11'); ang3.setAttribute('fill', '#1a6eab');
    ang3.setAttribute('font-weight', 'bold');
    ang3.textContent = '90°'; svg.appendChild(ang3);

    // Poignée rotation
    const rotH = document.createElement('div');
    rotH.className = 'geo-rot-handle';
    rotH.textContent = '↻';
    rotH.style.cssText = `bottom: 0px; right: 0px; cursor:pointer !important;`;

    // Bouton fermer — à gauche du bouton rotation
    const closeBtn = document.createElement('button');
    closeBtn.className = 'geo-close-tool';
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'position:absolute; bottom:0px; right:28px; cursor:pointer !important;';
    closeBtn.onclick = e => { e.stopPropagation(); overlay.remove(); };

    // Boutons tracer
    const traceWrap = document.createElement('div');
    traceWrap.style.cssText = 'position:absolute; bottom:-30px; left:0; display:flex; gap:6px; cursor:default;';

    function makeTraceBtn(label, drawFn) {
        const b = document.createElement('button');
        b.className = 'geo-trace-btn';
        b.textContent = label;
        b.style.setProperty('cursor', 'pointer', 'important');
        b.onclick = e => { e.stopPropagation(); drawFn(); };
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

    traceWrap.appendChild(makeTraceBtn('✏️ Base', () => {
        traceOnCanvas([makeLine(ox() + OX, oy() + OY, ox() + OX + CAT, oy() + OY)]);
    }));

    traceWrap.appendChild(makeTraceBtn('✏️ Côté', () => {
        traceOnCanvas([makeLine(ox() + OX, oy() + OY, ox() + OX, oy() + OY - CAT)]);
    }));

    traceWrap.appendChild(makeTraceBtn('📐 Angle droit', () => {
        traceOnCanvas([
            makeLine(ox() + OX, oy() + OY, ox() + OX + CAT, oy() + OY),
            makeLine(ox() + OX, oy() + OY, ox() + OX,       oy() + OY - CAT)
        ]);
    }));

    // Fermer
    overlay.appendChild(svg);
    overlay.appendChild(rotH);
    overlay.appendChild(closeBtn);
    overlay.appendChild(traceWrap);
    board.appendChild(overlay);

    makeDraggableGeo(overlay);
    makeRotatableGeo(overlay, rotH);
}

// ── COMPAS ────────────────────────────────────────────────────────────────
function spawnCompas(board, cx, cy) {
    const MAX_R = 400, MIN_R = 20;
    let radius = 100;

    const overlay = document.createElement('div');
    overlay.className = 'geo-tool-overlay';
    overlay.dataset.angle = '0';
    overlay.style.cssText = `left:${cx - 190}px; top:${cy - 190}px; width:420px; height:500px;`;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '420');
    svg.setAttribute('height', '390');
    svg.style.cssText = 'display:block; pointer-events:none;';

    // Centre pivot (en haut au milieu)
    const PIV_X = 210, PIV_Y = 20;

    // Bras gauche (fixe, avec la pointe)
    const armLeft  = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    // Bras droit (avec le crayon), son angle change selon le rayon
    const armRight = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    // Cercle fantôme (preview)
    const circle   = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    // Pointe
    const pointe   = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    // Crayon
    const crayon   = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');

    const ARM_LEN = 350;

    function updateSvg() {
        // Angle d'ouverture : on calcule l'angle tel que la distance entre
        // la pointe et le crayon = radius
        // Les deux bras font ARM_LEN, angle entre eux = 2*asin(radius/2/ARM_LEN)
        const halfAngle = Math.min(Math.asin(Math.min(radius / (2 * ARM_LEN), 1)), Math.PI / 2);
        const aLeft  = Math.PI / 2 + halfAngle;  // bras gauche vers bas-gauche
        const aRight = Math.PI / 2 - halfAngle;  // bras droit vers bas-droite

        const lx = PIV_X + Math.cos(Math.PI - aLeft) * ARM_LEN;
        const ly = PIV_Y + Math.sin(aLeft) * ARM_LEN;
        const rx = PIV_X + Math.cos(aRight) * ARM_LEN;
        const ry = PIV_Y + Math.sin(Math.PI - aRight) * ARM_LEN + ARM_LEN;

        // Recalcul propre
        const lx2 = PIV_X - Math.sin(halfAngle) * ARM_LEN;
        const ly2 = PIV_Y + Math.cos(halfAngle) * ARM_LEN;
        const rx2 = PIV_X + Math.sin(halfAngle) * ARM_LEN;
        const ry2 = PIV_Y + Math.cos(halfAngle) * ARM_LEN;

        armLeft.setAttribute('x1', PIV_X); armLeft.setAttribute('y1', PIV_Y);
        armLeft.setAttribute('x2', lx2);   armLeft.setAttribute('y2', ly2);
        armLeft.setAttribute('stroke', '#555'); armLeft.setAttribute('stroke-width', '4');
        armLeft.setAttribute('stroke-linecap', 'round');

        armRight.setAttribute('x1', PIV_X); armRight.setAttribute('y1', PIV_Y);
        armRight.setAttribute('x2', rx2);   armRight.setAttribute('y2', ry2);
        armRight.setAttribute('stroke', '#555'); armRight.setAttribute('stroke-width', '4');
        armRight.setAttribute('stroke-linecap', 'round');

        // Pivot
        const pivCirc = svg.querySelector('.compas-pivot');
        if (pivCirc) {
            pivCirc.setAttribute('cx', PIV_X); pivCirc.setAttribute('cy', PIV_Y);
        }

        // Cercle preview centré sur la pointe
        circle.setAttribute('cx', lx2); circle.setAttribute('cy', ly2);
        circle.setAttribute('r', radius);
        circle.setAttribute('fill', 'none');
        circle.setAttribute('stroke', 'rgba(167,139,250,0.4)');
        circle.setAttribute('stroke-width', '1.5');
        circle.setAttribute('stroke-dasharray', '6 4');

        // Pointe (triangle)
        pointe.setAttribute('cx', lx2); pointe.setAttribute('cy', ly2);
        pointe.setAttribute('r', 5);
        pointe.setAttribute('fill', '#e74c3c');

        // Crayon
        const cpx = rx2, cpy = ry2;
        crayon.setAttribute('points',
            `${cpx-4},${cpy-4} ${cpx+4},${cpy-4} ${cpx},${cpy+10}`);
        crayon.setAttribute('fill', '#f39c12');

        // Stocker les coords pour le tracé
        overlay.dataset.pivX  = lx2;
        overlay.dataset.pivY  = ly2;
        overlay.dataset.radius = radius;
    }

    // Pivot visuel
    const pivCirc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    pivCirc.className.baseVal = 'compas-pivot';
    pivCirc.setAttribute('r', '8');
    pivCirc.setAttribute('fill', '#888');
    pivCirc.setAttribute('stroke', '#333'); pivCirc.setAttribute('stroke-width', '2');

    svg.appendChild(armLeft);
    svg.appendChild(armRight);
    svg.appendChild(circle);
    svg.appendChild(pointe);
    svg.appendChild(crayon);
    svg.appendChild(pivCirc);

    // Contrôle rayon
    const radiusWrap = document.createElement('div');
    radiusWrap.className = 'geo-compass-radius-wrap';
    radiusWrap.style.cssText = 'position:absolute; top:400px; left:50%; transform:translateX(-50%);';
    radiusWrap.innerHTML = `
        <span>Rayon</span>
        <input type="range" min="${MIN_R}" max="${MAX_R}" value="${radius}" step="2">
        <span class="geo-r-val">${radius}px</span>
    `;
    const slider = radiusWrap.querySelector('input');
    slider.style.setProperty('cursor', 'pointer', 'important');
    // Bloquer la propagation pour éviter que draw.js dessine pendant le glissement
    slider.addEventListener('mousedown', e => e.stopPropagation());
    slider.addEventListener('mousemove', e => e.stopPropagation());
    slider.addEventListener('mouseup',   e => e.stopPropagation());
    const rVal   = radiusWrap.querySelector('.geo-r-val');
    slider.addEventListener('input', function () {
        radius = parseInt(this.value);
        rVal.textContent = radius + 'px';
        updateSvg();
    });

    // Poignée rotation — coin haut-droit
    const rotH = document.createElement('div');
    rotH.className = 'geo-rot-handle';
    rotH.textContent = '↻';
    rotH.style.cssText = 'position:absolute; top:-10px; right:-10px; cursor:pointer !important;';

    // Fermer — coin haut-gauche
    const closeBtn = document.createElement('button');
    closeBtn.className = 'geo-close-tool';
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'position:absolute; top:-8px; left:-8px; cursor:pointer !important;';
    closeBtn.onclick = e => { e.stopPropagation(); overlay.remove(); };

    // Bouton tracer — centré en bas du SVG
    const traceBtn = document.createElement('button');
    traceBtn.className = 'geo-trace-btn';
    traceBtn.textContent = '⭕ Tracer le cercle';
    traceBtn.style.cssText = 'position:absolute; top:440px; left:50%; transform:translateX(-50%); cursor:pointer !important;';
    traceBtn.onclick = function (e) {
        e.stopPropagation();
        const t    = getOverlayTransform(overlay);
        const pivX = parseFloat(overlay.dataset.pivX || 0);
        const pivY = parseFloat(overlay.dataset.pivY || 0);
        const r    = parseFloat(overlay.dataset.radius || radius);
        const ox   = parseFloat(overlay.style.left || 0);
        const oy   = parseFloat(overlay.style.top  || 0);
        const worldPiv = rotatePoint(ox + pivX, oy + pivY, t.cx, t.cy, t.angle);

        // 3 strokes avec le même groupId pour former un objet unique
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

    overlay.appendChild(svg);
    overlay.appendChild(radiusWrap);
    overlay.appendChild(rotH);
    overlay.appendChild(traceBtn);
    overlay.appendChild(closeBtn);
    board.appendChild(overlay);

    updateSvg();
    makeDraggableGeo(overlay);
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
