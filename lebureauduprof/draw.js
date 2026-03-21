// =========================================================================
// DESSIN LIBRE
// =========================================================================
var drawCanvas = null, drawCtx = null, isPainting = false, isDrawMode = false;
var drawCanvasTop = null, drawCtxTop = null; // canvas de premier plan pour strokes épinglés
var strokes = [], currentStroke = null;

// ── Helper : active/désactive un bouton de mode (styles inline + classe CSS pour le thème clair) ──
function _setBtnActive(id, active, colorScheme) {
    const btn = document.getElementById(id);
    if (!btn) return;
    if (colorScheme === 'figures') {
        // Bouton figures : bleu doux
        btn.style.borderColor = active ? '#4a90e2' : '#444';
        btn.style.background  = active ? '#1a2a4a' : '#2a2a2e';
        btn.style.color       = active ? '#7ab8f5' : '#aaa';
    } else {
        // Bouton standard (dessin libre, sélection)
        btn.style.borderColor = active ? '#4a90e2' : '#444';
        btn.style.background  = active ? '#1a3550' : '#2a2a2e';
        btn.style.color       = active ? '#fff'    : '#aaa';
    }
    btn.classList.toggle('btn-mode-active', active);
}

// Génère et applique un curseur SVG : point de la couleur courante + cercle gris r=8
function updateDrawCursor() {
    if (!isDrawMode || !board) return;
    const color = window._drawColor
        || (typeof cpickGetValue === 'function' ? cpickGetValue('draw-color') : null)
        || document.querySelector('#cpick-draw-color .cpick-swatch')?.style?.background
        || '#e84393';
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">`
        + `<circle cx="10" cy="10" r="8" fill="none" stroke="#999" stroke-width="1.5"/>`
        + `<circle cx="10" cy="10" r="2.5" fill="${color}"/>`
        + `</svg>`;
    const b64 = btoa(svg);
    const cursorUrl = `url("data:image/svg+xml;base64,${b64}") 10 10, crosshair`;
    board.style.cursor = cursorUrl;
}

function clearDrawCursor() {
    if (board) board.style.cursor = '';
}

function initCanvas() {
    if (drawCanvas) return;
    drawCanvas = document.createElement('canvas');
    drawCanvas.id = 'draw-canvas';
    // pointer-events:none : le canvas ne bloque JAMAIS les clics sur toolbar/boutons
    drawCanvas.style.pointerEvents = 'none';
    resizeCanvas();
    board.appendChild(drawCanvas);
    drawCtx = drawCanvas.getContext('2d');

    // Canvas de premier plan pour les strokes épinglés (au-dessus de tout)
    drawCanvasTop = document.createElement('canvas');
    drawCanvasTop.id = 'draw-canvas-top';
    drawCanvasTop.style.cssText = 'position:absolute;top:0;left:0;pointer-events:none;z-index:11000;';
    drawCanvasTop.width  = drawCanvas.width;
    drawCanvasTop.height = drawCanvas.height;
    board.appendChild(drawCanvasTop);
    drawCtxTop = drawCanvasTop.getContext('2d');
    // Les événements sont captés sur le board (pas le canvas)
    // pour que les éléments position:fixed restent toujours cliquables
    board.addEventListener('mousedown',  _boardDrawMouseDown);
    board.addEventListener('mousemove',  _boardDrawMouseMove);
    board.addEventListener('mouseup',    _boardDrawMouseUp);
    board.addEventListener('mouseleave', _boardDrawMouseLeave);
    board.addEventListener('touchstart', _boardDrawTouchStart, { passive:false });
    board.addEventListener('touchmove',  _boardDrawTouchMove,  { passive:false });
    board.addEventListener('touchend',   _boardDrawTouchEnd);
    board.addEventListener('contextmenu', _boardDrawContextMenu);
    // Pointer events pour stylet (plus fiables que mouse events sur Firefox/tablette)
    board.addEventListener('pointerdown', _boardDrawPointerDown);
    board.addEventListener('pointerup',   _boardDrawPointerUp);
    document.getElementById('draw-size').addEventListener('input', function() {
        document.getElementById('draw-size-label').textContent = this.value;
    });
    // Initialiser window._drawColor depuis la couleur de la swatch si pas encore défini
    if (!window._drawColor) {
        const swatch = document.querySelector('#cpick-draw-color .cpick-swatch');
        if (swatch && swatch.style.background) window._drawColor = swatch.style.background;
    }
    const opSlider = document.getElementById('shape-recog-opacity');
    if (opSlider) opSlider.addEventListener('input', function() {
        document.getElementById('shape-recog-opacity-val').textContent = this.value + '%';
    });
}

function resizeCanvas() {
    if (!drawCanvas) return;
    drawCanvas.width = board.offsetWidth; drawCanvas.height = board.offsetHeight;
    if (drawCanvasTop) { drawCanvasTop.width = drawCanvas.width; drawCanvasTop.height = drawCanvas.height; }
    redrawStrokes();
}

function getPos(e) {
    const rect = board.getBoundingClientRect();
    const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
}

// Proxy board → dessin/gomme (le canvas a pointer-events:none)
// Tolérance de déplacement pour le clic droit (utile avec stylet sur tablette)
var _rightClickDownX = null, _rightClickDownY = null;
var _rightClickPending = false;   // un appui bouton droit est en cours
var _rightClickDone = false;      // basculement déjà effectué (évite double-trigger)
var _RIGHT_CLICK_TOLERANCE = 30;  // px — large pour stylet

function _doToggleEraserDraw() {
    if (isEraserMode) {
        stopEraserMode();
        isDrawMode = true;
        if (drawCanvas) drawCanvas.classList.remove('inactive');
        board.classList.add('is-drawing');
    } else {
        toggleEraserMode();
    }
}

function _tryRightClickToggle(clientX, clientY) {
    if (!_rightClickPending) return false;
    if (!isDrawMode && !isEraserMode) return false;
    const dx = clientX - _rightClickDownX;
    const dy = clientY - _rightClickDownY;
    if (Math.hypot(dx, dy) <= _RIGHT_CLICK_TOLERANCE) {
        if (!_rightClickDone) {
            _rightClickDone = true;
            _doToggleEraserDraw();
        }
        return true;
    }
    return false;
}

// Pointer events — source la plus fiable pour stylet sous Firefox
function _boardDrawPointerDown(e) {
    if (e.button !== 2) return;
    _rightClickDownX = e.clientX;
    _rightClickDownY = e.clientY;
    _rightClickPending = true;
    _rightClickDone = false;
}
function _boardDrawPointerUp(e) {
    if (e.button !== 2) return;
    _tryRightClickToggle(e.clientX, e.clientY);
    _rightClickPending = false;
}

// contextmenu — fallback si pointer events n'ont pas déclenché le toggle
function _boardDrawContextMenu(e) {
    if (!isDrawMode && !isEraserMode) return;
    e.preventDefault();
    if (!_rightClickDone) {
        // Pointer events n'ont pas géré → on bascule directement (souris classique, etc.)
        _doToggleEraserDraw();
    }
    _rightClickPending = false;
    _rightClickDone = false;
    _rightClickDownX = null;
    _rightClickDownY = null;
}

function _boardDrawMouseDown(e)  {
    if (e.button === 2) return;
    if (_pdfAnnotMode) return;
    if (isDrawMode)   { startPaint(e); return; }
    if (isEraserMode) { startErase(e); return; }
}
function _boardDrawMouseUp(e) {
    if (e.button === 2) return;
    if (_pdfAnnotMode) return;
    if (isDrawMode && FIGURE_MODES.includes(currentDrawMode)) return;
    if (isDrawMode) endPaint(); else if (isEraserMode) endErase();
}
function _boardDrawMouseMove(e)  {
    if (_pdfAnnotMode) return;
    if (isDrawMode)   { if (currentDrawMode === 'free' || currentDrawMode === 'highlight') updateDrawCursor(); paint(e); return; }
    if (isEraserMode) { onEraserMouseMove(e); return; }
}
function _boardDrawMouseLeave(e) {
    if (isDrawMode && FIGURE_MODES.includes(currentDrawMode)) {
        // Ne pas terminer la figure si la souris sort du board — on attend le mouseup
        return;
    }
    if (isDrawMode) endPaint(); else if (isEraserMode) { endErase(); redrawStrokes(); }
}
function _boardDrawTouchStart(e) {
    if (!isDrawMode && !isEraserMode) return;
    e.preventDefault();
    if (isEraserMode) { snapshotNow(); isErasing = true; eraseAt(getPos(e.touches[0])); }
    else startPaint(e.touches[0]);
}
function _boardDrawTouchMove(e) {
    if (!isDrawMode && !isEraserMode) return;
    e.preventDefault();
    if (isEraserMode) { if (isErasing) eraseAt(getPos(e.touches[0])); }
    else paint(e.touches[0]);
}
function _boardDrawTouchEnd(e) {
    if (isDrawMode && FIGURE_MODES.includes(currentDrawMode) && e.changedTouches && e.changedTouches[0]) {
        _figureEnd = getPos(e.changedTouches[0]);
        _segmentEnd = _figureEnd;
    }
    if (isEraserMode) endErase(); else endPaint();
}

function startPaint(e) {
    if (!isDrawMode || isEraserMode) return;    isPainting = true;
    const _isHighlight = (currentDrawMode === 'highlight');
    currentStroke = {
        points: [getPos(e)],
        color: (window._drawColor || cpickGetValue('draw-color') || document.querySelector('#cpick-draw-color .cpick-swatch')?.style?.background || '#e84393'),
        size: parseInt(document.getElementById('draw-size').value)
    };
    if (_isHighlight) currentStroke.highlight = true;
    if (currentDrawMode === 'shape') _lastStrokePoints = [...currentStroke.points];
    if (FIGURE_MODES.includes(currentDrawMode)) {
        _figureStart = getPos(e); _figureEnd = null;
        _segmentStart = _figureStart; // compat
        const onDocUp = (ev) => {
            document.removeEventListener('mouseup', onDocUp);
            _figureEnd = getPos(ev); _segmentEnd = _figureEnd;
            endPaint();
        };
        document.addEventListener('mouseup', onDocUp);
    }
    if (currentDrawMode === 'text') clearTimeout(_hwRecogTimer);
}

function paint(e) {
    if (!isPainting || !isDrawMode || isEraserMode || !currentStroke) return;
    if (FIGURE_MODES.includes(currentDrawMode)) {
        if (!_figureStart) return;
        const cur = getPos(e);
        const pts = _buildFigurePoints(currentDrawMode, _figureStart, cur);
        if (currentDrawMode === 'cercle' && pts) {
            // Afficher le cercle + la croix centrale en preview
            const crossPts = _buildCrossPoints(_figureStart, currentStroke.size);
            redrawStrokes({ ...currentStroke, points: pts }, { ...currentStroke, points: crossPts });
        } else if (pts) {
            redrawStrokes({ ...currentStroke, points: pts });
        }
        return;
    }
    currentStroke.points.push(getPos(e));
    if (currentDrawMode === 'shape') _lastStrokePoints = [...currentStroke.points];
    redrawStrokes(currentStroke);
}

function endPaint() {
    if (!isPainting || !currentStroke) return;
    isPainting = false;
    if (FIGURE_MODES.includes(currentDrawMode) && _figureStart) {
        const endPt = _figureEnd || _figureStart;
        const pts   = _buildFigurePoints(currentDrawMode, _figureStart, endPt);
        const center = { ..._figureStart };
        const strokeSize = currentStroke.size;
        _figureStart = null; _figureEnd = null; _segmentStart = null; _segmentEnd = null;
        if (pts && pts.length >= 2) {
            if (currentDrawMode === 'cercle') {
                // Sauvegarder cercle + croix centrale groupés
                const gid = 'cercle-' + Date.now();
                const crossPts = _buildCrossPoints(center, strokeSize);
                strokes.push({ ...currentStroke, points: pts,      groupId: gid });
                strokes.push({ ...currentStroke, points: crossPts, groupId: gid });
            } else {
                strokes.push({ ...currentStroke, points: pts });
            }
            const cur = buildBoardJSON();
            if (cur) { undoStack.push(cur); if (undoStack.length > MAX_UNDO) undoStack.shift(); redoStack = []; updateUndoRedoBtns(); }
            saveBoard(true);
        }
        currentStroke = null; redrawStrokes();
        return;
    }
    // Tap stylet = 1 seul point → enregistrer comme dot (cercle plein)
    if (currentStroke.points.length === 1) {
        currentStroke.dot = true;
        currentStroke.points.push({ ...currentStroke.points[0] }); // besoin d'au moins 2 pts pour le stockage
    }
    if (currentStroke.points.length > 1) {
        if (currentDrawMode === 'shape') {
            currentStroke = null;
            redrawStrokes();
            recognizeAndReplaceShape({ points: _lastStrokePoints, color: (cpickGetValue('draw-color') || '#e84393'), size: parseInt(document.getElementById('draw-size').value) });
            _lastStrokePoints = null;
            return;
        }
        strokes.push(currentStroke);
        const cur = buildBoardJSON();
        if (cur) {
            undoStack.push(cur);
            if (undoStack.length > MAX_UNDO) undoStack.shift();
            redoStack = [];
            updateUndoRedoBtns();
        }
        saveBoard(true);
    }
    currentStroke = null; redrawStrokes();
}

var _lastStrokePoints = null;
var _segmentStart = null;  // conservé pour compat (alias _figureStart pour mode segment)
var _segmentEnd   = null;  // conservé pour compat
var _figureStart  = null;  // point de départ pour tous les modes figure
var _figureEnd    = null;  // point de relâchement

const FIGURE_MODES = ['segment','carre','rectangle','cercle','ovale','parallelo','losange','triangle','right-triangle','equilateral-triangle','scalene-triangle','pentagon','hexagon','octagon'];

// Construit les points d'une petite croix centrée sur un point (pour le centre du cercle)
function _buildCrossPoints(center, strokeSize) {
    const arm = Math.max(6, strokeSize * 2.5);
    return [
        { x: center.x - arm, y: center.y },
        { x: center.x + arm, y: center.y },
        { x: center.x,       y: center.y }, // retour au centre
        { x: center.x,       y: center.y - arm },
        { x: center.x,       y: center.y + arm }
    ];
}

// Construit les points d'une figure géométrique entre deux points (drag)
function _buildFigurePoints(mode, A, B) {
    const dx = B.x - A.x, dy = B.y - A.y;
    if (Math.hypot(dx, dy) < 3) return null;

    if (mode === 'segment') {
        return [A, B];
    }

    if (mode === 'rectangle') {
        // A = sommet haut-gauche, B = sommet bas-droit
        return [
            { x: A.x, y: A.y }, { x: B.x, y: A.y },
            { x: B.x, y: B.y }, { x: A.x, y: B.y },
            { x: A.x, y: A.y }
        ];
    }

    if (mode === 'carre') {
        // Côté = min(|dx|, |dy|), conserve le signe du drag
        const side = Math.min(Math.abs(dx), Math.abs(dy));
        const sx = Math.sign(dx) * side, sy = Math.sign(dy) * side;
        return [
            { x: A.x,      y: A.y      },
            { x: A.x + sx, y: A.y      },
            { x: A.x + sx, y: A.y + sy },
            { x: A.x,      y: A.y + sy },
            { x: A.x,      y: A.y      }
        ];
    }

    if (mode === 'cercle') {
        // A = centre, rayon = distance A→B
        const r = Math.hypot(dx, dy);
        const steps = Math.max(60, Math.round(2 * Math.PI * r / 3));
        const pts = [];
        for (let i = 0; i <= steps; i++) {
            const a = (i / steps) * 2 * Math.PI;
            pts.push({ x: A.x + Math.cos(a) * r, y: A.y + Math.sin(a) * r });
        }
        return pts;
    }

    if (mode === 'ovale') {
        // A = coin haut-gauche, B = coin bas-droit → ellipse inscrite
        const cx = (A.x + B.x) / 2, cy = (A.y + B.y) / 2;
        const rx = Math.abs(dx) / 2, ry = Math.abs(dy) / 2;
        const steps = Math.max(60, Math.round(2 * Math.PI * Math.max(rx, ry) / 3));
        const pts = [];
        for (let i = 0; i <= steps; i++) {
            const a = (i / steps) * 2 * Math.PI;
            pts.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry });
        }
        return pts;
    }

    if (mode === 'parallelo') {
        // A = sommet bas-gauche, B = sommet bas-droit
        // Le décalage horizontal du côté haut = moitié de la largeur
        const w = dx, h = dy;
        const shear = w * 0.3; // décalage horizontal du côté supérieur
        return [
            { x: A.x,          y: A.y     },
            { x: A.x + w,      y: A.y     },
            { x: A.x + w + shear, y: A.y + h },
            { x: A.x + shear,  y: A.y + h },
            { x: A.x,          y: A.y     }
        ];
    }

    if (mode === 'losange') {
        // Centre = milieu de A→B, demi-diagonales = dx/2 et dy/2
        const cx = (A.x + B.x) / 2, cy = (A.y + B.y) / 2;
        return [
            { x: cx,      y: A.y  },  // sommet haut
            { x: B.x,     y: cy   },  // sommet droite
            { x: cx,      y: B.y  },  // sommet bas
            { x: A.x,     y: cy   },  // sommet gauche
            { x: cx,      y: A.y  }   // fermeture
        ];
    }

    if (mode === 'triangle') {
        // Triangle isocèle : A = sommet haut-centre, B = coin bas-droit
        const cx = (A.x + B.x) / 2;
        return [
            { x: cx,   y: A.y },
            { x: B.x,  y: B.y },
            { x: A.x,  y: B.y },
            { x: cx,   y: A.y }
        ];
    }

    if (mode === 'right-triangle') {
        // Triangle rectangle : angle droit en A
        return [
            { x: A.x, y: A.y },
            { x: B.x, y: B.y },
            { x: A.x, y: B.y },
            { x: A.x, y: A.y }
        ];
    }

    if (mode === 'equilateral-triangle') {
        // Triangle équilatéral : A = sommet haut-centre, largeur = |dx|
        const side = Math.abs(dx);
        const h3 = side * Math.sqrt(3) / 2 * Math.sign(dy || 1);
        const cx = (A.x + B.x) / 2;
        return [
            { x: cx,            y: A.y      },
            { x: cx + side / 2, y: A.y + h3 },
            { x: cx - side / 2, y: A.y + h3 },
            { x: cx,            y: A.y      }
        ];
    }

    if (mode === 'scalene-triangle') {
        // Triangle quelconque : 3 sommets à positions distinctes
        return [
            { x: A.x + dx * 0.15, y: B.y },
            { x: A.x + dx * 0.72, y: A.y },
            { x: B.x,             y: B.y },
            { x: A.x + dx * 0.15, y: B.y }
        ];
    }

    if (mode === 'pentagon' || mode === 'hexagon' || mode === 'octagon') {
        const n = mode === 'pentagon' ? 5 : mode === 'hexagon' ? 6 : 8;
        const cx = A.x, cy = A.y;
        const rx = Math.abs(dx), ry = Math.abs(dy);
        const pts = [];
        for (let i = 0; i <= n; i++) {
            const a = (2 * Math.PI / n) * i - Math.PI / 2;
            pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) });
        }
        return pts;
    }

    return null;
}

// =========================================================================
// RECONNAISSANCE D'ÉCRITURE MANUSCRITE
// =========================================================================
var _hwRecogTimer = null;
var _hwPendingStrokes = []; // traits en attente de reconnaissance
var _hwRecognizedText = '';
var _hwBBox = null; // bounding box des traits manuscrits en cours

function scheduleHandwritingRecognition() {
    clearTimeout(_hwRecogTimer);
    _hwRecogTimer = setTimeout(() => {
        triggerHandwritingRecognition();
    }, 2000);
}

function cancelHandwritingRecognition() {
    clearTimeout(_hwRecogTimer);
    // Nettoyer le panneau preview si visible
    const preview = document.getElementById('handwriting-preview');
    if (preview) { preview.style.display = 'none'; preview._positioned = false; }
}

function triggerHandwritingRecognition() {
    // Collecter tous les traits textMode
    const hwStrokes = strokes.filter(s => s.textMode);
    if (hwStrokes.length === 0) return;

    // Calculer la bounding box globale
    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    hwStrokes.forEach(s => s.points.forEach(p => {
        if(p.x<minX)minX=p.x; if(p.y<minY)minY=p.y;
        if(p.x>maxX)maxX=p.x; if(p.y>maxY)maxY=p.y;
    }));
    const pad = 20;
    minX = Math.max(0, minX-pad); minY = Math.max(0, minY-pad);
    maxX = Math.min(drawCanvas.width,  maxX+pad);
    maxY = Math.min(drawCanvas.height, maxY+pad);
    _hwBBox = { x: minX, y: minY, w: maxX-minX, h: maxY-minY };

    // Afficher le panneau avec état de chargement
    showHandwritingPreview('', true, minX, minY, maxX-minX, maxY-minY);

    // OCR avec Tesseract.js (traitement local, pas d'API externe)
    callAnthropicOCR(null).then(text => {
        _hwRecognizedText = text && text.trim() ? text : '?';
        showHandwritingPreview(_hwRecognizedText, false, minX, minY, maxX-minX, maxY-minY);
    }).catch(err => {
        console.error('OCR error:', err);
        showHandwritingPreview('⚠️ ' + (err.message || 'Erreur'), false, minX, minY, maxX-minX, maxY-minY);
    });
}

// =========================================================================
// MYSCRIPT iink — Reconnaissance d'écriture manuscrite
// =========================================================================

function saveMyScriptKeys() {
    const appKey  = (document.getElementById('hw-appkey-input')?.value  || '').trim();
    const hmacKey = (document.getElementById('hw-hmackey-input')?.value || '').trim();
    localStorage.setItem('ms_app_key',  appKey);
    localStorage.setItem('ms_hmac_key', hmacKey);
    const status = document.getElementById('hw-apikey-status');
    if (status) {
        const ok = appKey.length > 8 && hmacKey.length > 8;
        status.textContent = ok ? '✓' : '●';
        status.style.color  = ok ? '#4caf50' : '#888';
    }
}

function getMyScriptKeys() {
    return {
        appKey:  localStorage.getItem('ms_app_key')  || '',
        hmacKey: localStorage.getItem('ms_hmac_key') || ''
    };
}

// Remplir les champs au chargement
window.addEventListener('load', () => {
    const { appKey, hmacKey } = getMyScriptKeys();
    const ai = document.getElementById('hw-appkey-input');
    const hi = document.getElementById('hw-hmackey-input');
    if (ai && appKey)  { ai.value  = appKey; }
    if (hi && hmacKey) { hi.value = hmacKey; }
    if (appKey || hmacKey) saveMyScriptKeys();
});

// Calcul HMAC-SHA512 pour l'authentification MyScript
async function computeHmac(appKey, hmacKey, body) {
    const enc = new TextEncoder();
    const keyData = enc.encode(appKey + hmacKey);
    const msgData = enc.encode(body);
    const cryptoKey = await crypto.subtle.importKey(
        'raw', keyData, { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convertir nos strokes en format MyScript iink (JIIX)
function buildMyScriptStrokePayload() {
    const hwStrokes = strokes.filter(s => s.textMode);
    const minX = _hwBBox ? _hwBBox.x : 0;
    const minY = _hwBBox ? _hwBBox.y : 0;

    const strokeList = hwStrokes.map((s, idx) => {
        const xs = s.points.map(p => Math.round(p.x - minX));
        const ys = s.points.map(p => Math.round(p.y - minY));
        // Timestamps artificiels espacés de 20ms par point
        const ts = s.points.map((_, i) => idx * 1000 + i * 20);
        return { x: xs, y: ys, t: ts };
    });

    const w = _hwBBox ? Math.ceil(_hwBBox.w) : 800;
    const h = _hwBBox ? Math.ceil(_hwBBox.h) : 400;

    return {
        configuration: {
            lang: 'fr_FR',
            export: { 'image-resolution': 96 }
        },
        contentType: 'Text',
        conversionState: 'DIGITAL_EDIT',
        height: h,
        width: w,
        strokeGroups: [{ strokes: strokeList }]
    };
}

async function callAnthropicOCR(_unused) {
    // Lire les clés depuis les champs EN PRIORITÉ, puis depuis localStorage
    const appKeyInput  = (document.getElementById('hw-appkey-input')?.value  || '').trim();
    const hmacKeyInput = (document.getElementById('hw-hmackey-input')?.value || '').trim();
    const appKey  = appKeyInput  || localStorage.getItem('ms_app_key')  || '';
    const hmacKey = hmacKeyInput || localStorage.getItem('ms_hmac_key') || '';

    if (!appKey || !hmacKey) {
        throw new Error('Clés MyScript manquantes — saisissez-les dans le panneau (mode ✍️ Écriture)');
    }

    // Sauvegarder si pas encore fait
    if (appKey)  localStorage.setItem('ms_app_key',  appKey);
    if (hmacKey) localStorage.setItem('ms_hmac_key', hmacKey);

    const payload = buildMyScriptStrokePayload();
    const bodyStr = JSON.stringify(payload);
    const hmac = await computeHmac(appKey, hmacKey, bodyStr);

    const resp = await fetch('https://cloud.myscript.com/api/v4.0/iink/batch', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json,application/vnd.myscript.jiix',
            'applicationKey': appKey,
            'hmac': hmac
        },
        body: bodyStr
    });

    if (!resp.ok) {
        const txt = await resp.text().catch(() => resp.status);
        throw new Error('MyScript API: ' + txt);
    }

    const result = await resp.json();
    const text = result?.label || result?.exports?.['text/plain'] || '';
    return text.trim() || '?';
}

function showHandwritingPreview(text, loading, bx, by, bw, bh) {
    const preview = document.getElementById('handwriting-preview');
    const textEl  = document.getElementById('handwriting-recognized-text');
    const loadEl  = document.getElementById('handwriting-loading');
    const convertBtn = document.getElementById('handwriting-convert-btn');

    if (loading) {
        textEl.textContent = '';
        loadEl.style.display = 'block';
        if (convertBtn) convertBtn.style.display = 'none';
    } else {
        textEl.textContent = text;
        loadEl.style.display = 'none';
        if (convertBtn) convertBtn.style.display = 'inline-block';
    }

    // Positionner le panneau au-dessus de la zone dessinée (seulement à la 1ère fois)
    if (preview.style.display === 'none' || !preview._positioned) {
        const boardRect = board.getBoundingClientRect();
        const panelX = boardRect.left + bx;
        const panelY = boardRect.top  + by;
        const maxLeft = window.innerWidth - 540;
        const maxTop  = window.innerHeight - 220;
        preview.style.left = Math.max(10, Math.min(panelX, maxLeft)) + 'px';
        preview.style.top  = Math.max(10, Math.min(panelY - 150, maxTop)) + 'px';
        preview._positioned = true;
    }
    preview.style.display = 'block';

    // Init drag si pas encore fait
    if (!preview._dragInited) {
        preview._dragInited = true;
        const header = document.getElementById('handwriting-preview-header');
        function startPanelDrag(clientX, clientY) {
            let ox = clientX - preview.offsetLeft;
            let oy = clientY - preview.offsetTop;
            function onMove(ev) {
                preview.style.left = Math.max(0, ev.clientX - ox) + 'px';
                preview.style.top  = Math.max(0, ev.clientY - oy) + 'px';
            }
            function onEnd() {
                header.removeEventListener('pointermove',   onMove);
                header.removeEventListener('pointerup',     onEnd);
                header.removeEventListener('pointercancel', onEnd);
            }
            header.addEventListener('pointermove',   onMove);
            header.addEventListener('pointerup',     onEnd);
            header.addEventListener('pointercancel', onEnd);
        }
        header.addEventListener('pointerdown', (e) => {
            if (e.button !== undefined && e.button !== 0) return;
            e.preventDefault();
            header.setPointerCapture(e.pointerId);
            startPanelDrag(e.clientX, e.clientY);
        });
    }
}

function convertHandwritingToWidget() {
    // Lire le texte potentiellement édité par l'utilisateur dans le panneau
    const editedEl = document.getElementById('handwriting-recognized-text');
    if (editedEl) _hwRecognizedText = editedEl.textContent.trim();
    if (!_hwRecognizedText || !_hwBBox) return;

    const preview = document.getElementById('handwriting-preview');
    if (preview) { preview.style.display = 'none'; preview._positioned = false; }

    // Créer un widget texte à l'emplacement du dessin
    snapshotNow();
    const widget = createWidget('text', _hwBBox.x + 'px', _hwBBox.y + 'px', false);
    const editor = widget.querySelector('.editor-content');
    if (editor) {
        editor.style.fontFamily = "'BelleAllureGS', cursive";
        editor.style.fontSize   = '52px';
        editor.innerHTML = `<span style="font-family:'BelleAllureGS', cursive;font-size:52px;">${_hwRecognizedText.replace(/\n/g, '<br>')}</span>`;
    }

    // Supprimer les traits manuscrits du canvas
    strokes = strokes.filter(s => !s.textMode);
    redrawStrokes();

    // Snapshot final avec le widget texte
    const cur = buildBoardJSON();
    if (cur) {
        undoStack.push(cur);
        if (undoStack.length > MAX_UNDO) undoStack.shift();
        redoStack = [];
        updateUndoRedoBtns();
        localStorage.setItem('profBoardConfig', cur);
    }

    _hwRecognizedText = '';
    _hwBBox = null;
}

function discardHandwriting() {
    const preview = document.getElementById('handwriting-preview');
    if (preview) { preview.style.display = 'none'; preview._positioned = false; }
    _hwRecognizedText = '';
    _hwBBox = null;
    // Garder les traits tels quels
}

function redrawStrokes(extra = null, extra2 = null) {
    if (!drawCtx) return;
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    if (drawCtxTop) drawCtxTop.clearRect(0, 0, drawCanvasTop.width, drawCanvasTop.height);

    strokes.forEach(s => {
        const ctx = (s.pinned && drawCtxTop) ? drawCtxTop : drawCtx;
        drawStroke(s, false, ctx);
    });
    if (extra) drawStroke(extra, false, drawCtx);
    if (extra2) drawStroke(extra2, false, drawCtx);
    selectedStrokes.forEach(s => {
        const ctx = (s.pinned && drawCtxTop) ? drawCtxTop : drawCtx;
        drawStroke(s, true, ctx);
    });
}

function drawStroke(stroke, highlight = false, ctx = drawCtx) {
    if (!stroke.points || stroke.points.length < 2) return;
    // Tap unique → cercle plein
    if (stroke.dot) {
        const p = stroke.points[0];
        const r = stroke.size / 2;
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = highlight ? '#4a90e2' : stroke.color;
        if (stroke.highlight) { ctx.globalAlpha = 0.4; ctx.globalCompositeOperation = 'multiply'; }
        ctx.fill();
        ctx.restore();
        return;
    }
    // Mode surligneur : trait très large, semi-transparent, effet fluo
    if (stroke.highlight) {
        ctx.save();
        ctx.beginPath();
        ctx.lineCap = 'square';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = Math.max(stroke.size * 6, 24);
        ctx.globalAlpha = 0.4;
        ctx.globalCompositeOperation = 'multiply';
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke();
        ctx.restore();
        return;
    }
    ctx.save();
    ctx.beginPath(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = highlight ? '#4a90e2' : stroke.color;
    ctx.lineWidth   = highlight ? stroke.size + 6 : stroke.size;
    if (highlight) ctx.globalAlpha = 0.5;
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.stroke(); ctx.restore();
    if (highlight) {
        ctx.save(); ctx.beginPath(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = stroke.color; ctx.lineWidth = stroke.size;
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.stroke(); ctx.restore();
    }
}

// =========================================================================
// MODES DESSIN
// =========================================================================
var currentDrawMode = 'free'; // 'free' | 'highlight' | 'shape' | 'text'

function setDrawMode(mode) {
    // Si on est en mode annotation PDF et qu'on clique sur le surligneur,
    // on bascule l'outil PDF highlighter au lieu de changer le mode dessin
    if (mode === 'highlight' && typeof _pdfAnnotMode !== 'undefined' && _pdfAnnotMode) {
        setPdfAnnotTool('highlighter');
        return;
    }
    // Désactiver la gomme si elle est active
    if (isEraserMode) stopEraserMode();
    // Recliqué sur le mode déjà actif → retour en dessin libre
    if (mode === currentDrawMode && mode !== 'free') mode = 'free';
    currentDrawMode = mode;
    // Bouton dessin libre — styles inline directs pour cohérence
    const freeBtn = document.getElementById('draw-free-btn');
    if (freeBtn) {
        if (mode === 'free') {
            freeBtn.style.borderColor = '#4a90e2';
            freeBtn.style.background  = '#1a3550';
            freeBtn.style.color       = '#fff';
            freeBtn.classList.add('btn-mode-active');
        } else {
            freeBtn.style.borderColor = '#444';
            freeBtn.style.background  = '#2a2a2e';
            freeBtn.style.color       = '#aaa';
            freeBtn.classList.remove('btn-mode-active');
        }
    }
    // Bouton surligneur — styles inline directs pour cohérence
    const hlBtn = document.getElementById('draw-highlight-btn');
    if (hlBtn) {
        if (mode === 'highlight') {
            hlBtn.style.borderColor = '#f5c518';
            hlBtn.style.background  = '#2a2200';
            hlBtn.style.color       = '#f5c518';
            hlBtn.classList.add('btn-mode-active');
        } else {
            hlBtn.style.borderColor = '#444';
            hlBtn.style.background  = '#2a2a2e';
            hlBtn.style.color       = '#aaa';
            hlBtn.classList.remove('btn-mode-active');
        }
    }    // Fermer le sous-menu figures si on choisit un mode non-figure (sauf si on choisit une figure)
    if (!FIGURE_MODES.includes(mode)) {
        const figSub = document.getElementById('figures-submenu');
        if (figSub) figSub.classList.remove('open');
        _setBtnActive('draw-figures-btn', false, 'figures');
    }
    // Boutons de modes figure
    FIGURE_MODES.forEach(m => {
        const btn = document.getElementById('draw-mode-'+m+'-btn');
        if (!btn) return;
        if (m === mode) {
            btn.style.borderColor = '#4a90e2'; btn.style.background = '#1a3550'; btn.style.color = '#fff';
        } else {
            btn.style.borderColor = '#444'; btn.style.background = '#2a2a2e'; btn.style.color = '#aaa';
        }
    });
    const shapeOpts = document.getElementById('shape-recog-options');
    const shapeHint = document.getElementById('shape-recog-hint');
    if (mode === 'shape') {
        if (shapeOpts) shapeOpts.style.display = 'flex';
        if (shapeHint) shapeHint.style.display = 'block';
    } else {
        if (shapeOpts) shapeOpts.style.display = 'none';
        if (shapeHint) shapeHint.style.display = 'none';
    }
    // Curseur crosshair en mode figure, curseur point en mode libre
    if (board) {
        if (FIGURE_MODES.includes(mode)) { board.classList.add('is-segment-mode'); clearDrawCursor(); }
        else board.classList.remove('is-segment-mode');
    }
    // Si on choisit un mode figure alors qu'on était en mode sélection, réactiver le dessin
    if (FIGURE_MODES.includes(mode) && !isDrawMode) {
        isDrawMode = true;
        isPainting = false;
        if (drawCanvas) drawCanvas.classList.remove('inactive');
        board.classList.add('is-drawing');
    }
    // Idem pour le mode dessin libre
    if ((mode === 'free' || mode === 'highlight') && !isDrawMode) {
        isDrawMode = true;
        isPainting = false;
        if (drawCanvas) drawCanvas.classList.remove('inactive');
        board.classList.add('is-drawing');
    }
    // Appliquer le curseur point si on est en mode libre ou surligneur
    if (mode === 'free' || mode === 'highlight') updateDrawCursor();
    // Fermer la toolbar géométrie (shapes.js) si un mode figure dessin est activé
    if (FIGURE_MODES.includes(mode)) {
        if (typeof stopShapeToolbar === 'function') stopShapeToolbar();
    }
    // Désactiver le bouton sélection
    _setBtnActive('draw-select-btn', false);
    // Si mode libre ou surligneur, fermer les deux sous-menus
    if (mode === 'free' || mode === 'highlight') {
        const figSub = document.getElementById('figures-submenu');
        if (figSub) figSub.classList.remove('open');
        _setBtnActive('draw-figures-btn', false, 'figures');
        if (typeof closeGeoSubmenu === 'function') closeGeoSubmenu();
    }
}

function activatePencil() {
    // En mode annotation PDF : déléguer à setPdfAnnotTool
    if (typeof _pdfAnnotMode !== 'undefined' && _pdfAnnotMode) {
        setPdfAnnotTool('pen');
        return;
    }
    currentDrawMode = 'free';
    _setBtnActive('draw-figures-btn', false, 'figures');
    const figSubA = document.getElementById('figures-submenu');
    if (figSubA) { figSubA.classList.remove('open'); figSubA.style.display = 'none'; }
    FIGURE_MODES.forEach(m => {
        const btn = document.getElementById('draw-mode-'+m+'-btn');
        if (btn) { btn.style.borderColor = '#444'; btn.style.background = '#2a2a2e'; btn.style.color = '#aaa'; }
    });
    // Bouton crayon actif
    const freeBtn = document.getElementById('draw-free-btn');
    if (freeBtn) {
        freeBtn.style.borderColor = '#4a90e2';
        freeBtn.style.background  = '#1a3550';
        freeBtn.style.color       = '#fff';
        freeBtn.classList.add('btn-mode-active');
    }
    // Bouton surligneur inactif
    const hlBtn = document.getElementById('draw-highlight-btn');
    if (hlBtn) {
        hlBtn.style.borderColor = '#444';
        hlBtn.style.background  = '#2a2a2e';
        hlBtn.style.color       = '#aaa';
        hlBtn.classList.remove('btn-mode-active');
    }
    if (isEraserMode) stopEraserMode();
    if (!isDrawMode) {
        isDrawMode = true;
        if (drawCanvas) drawCanvas.classList.remove('inactive');
        board.classList.add('is-drawing');
    }
    updateDrawCursor();
}

function activateHighlighter() {
    if (typeof _pdfAnnotMode !== 'undefined' && _pdfAnnotMode) {
        setPdfAnnotTool('highlighter');
        return;
    }
    currentDrawMode = 'highlight';
    // Bouton surligneur actif
    const hlBtn = document.getElementById('draw-highlight-btn');
    if (hlBtn) {
        hlBtn.style.borderColor = '#f5c518';
        hlBtn.style.background  = '#2a2200';
        hlBtn.style.color       = '#f5c518';
        hlBtn.classList.add('btn-mode-active');
    }
    // Bouton crayon inactif
    const freeBtn = document.getElementById('draw-free-btn');
    if (freeBtn) {
        freeBtn.style.borderColor = '#444';
        freeBtn.style.background  = '#2a2a2e';
        freeBtn.style.color       = '#aaa';
        freeBtn.classList.remove('btn-mode-active');
    }
    // Bouton figures inactif
    _setBtnActive('draw-figures-btn', false, 'figures');
    const figSub = document.getElementById('figures-submenu');
    if (figSub) { figSub.classList.remove('open'); figSub.style.display = 'none'; }
    if (isEraserMode) stopEraserMode();
    if (!isDrawMode) {
        isDrawMode = true;
        if (drawCanvas) drawCanvas.classList.remove('inactive');
        board.classList.add('is-drawing');
    }
    updateDrawCursor();
}

function toggleDrawToolbar() {
    const tb = document.getElementById('draw-toolbar');
    if (isDrawMode) { stopDrawing(); return; }
    stopEraserMode();
    if (typeof stopShapeToolbar === 'function') stopShapeToolbar();
    initCanvas(); enableDrawing();
    setDrawMode('free');
    // Valeurs par défaut à l'ouverture
    const _ds = document.getElementById('draw-size');
    const _dsl = document.getElementById('draw-size-label');
    if (_ds) { _ds.value = 2; if (_dsl) _dsl.textContent = 2; }
    const _es = document.getElementById('eraser-size');
    const _esl = document.getElementById('eraser-size-label');
    if (_es) { _es.value = 15; if (_esl) _esl.textContent = 15; }
    if (tb) {
        tb.classList.remove('horizontal');
        tb.style.width  = '';
        tb.style.bottom = 'auto';
        tb.style.right  = 'auto';
        tb.style.display = 'block';
        // Positionner à droite, centré verticalement
        requestAnimationFrame(function() {
            const scrollbarW = window.innerWidth - document.documentElement.clientWidth;
            tb.style.left = (window.innerWidth - tb.offsetWidth - scrollbarW - 12) + 'px';
            tb.style.top  = Math.max(10, (window.innerHeight - tb.offsetHeight) / 2) + 'px';
        });
    }
}
function enableDrawing() {
    isDrawMode = true;
    if (drawCanvas) drawCanvas.classList.remove('inactive');
    board.classList.add('is-drawing');
    updateDrawCursor();
    clearSelection();
    // Mettre à jour l'apparence du bouton sélection
    _setBtnActive('draw-select-btn', false);
    // Réinitialiser le bouton figures
    _setBtnActive('draw-figures-btn', false, 'figures');
}

function toggleFiguresSubmenu() {
    // En mode annotation PDF : activer l'outil figure ET ouvrir le sous-menu
    if (typeof _pdfAnnotMode !== 'undefined' && _pdfAnnotMode) {
        const sub = document.getElementById('figures-submenu');
        const isOpen = sub && sub.classList.contains('open');
        // N'activer 'figure' que si le sous-menu est fermé (premier clic)
        // Si déjà ouvert, le second clic referme juste le sous-menu
        if (!isOpen) setPdfAnnotTool('figure');
        if (!sub) return;
        sub.classList.toggle('open');
        sub.style.display = sub.classList.contains('open') ? 'flex' : 'none';
        if (sub.classList.contains('open') && typeof _positionSubmenuNextToDrawbar === 'function') {
            requestAnimationFrame(function() { _positionSubmenuNextToDrawbar(sub); });
        }
        return;
    }
    // Désactiver la gomme si elle est active
    if (isEraserMode) stopEraserMode();
    const sub = document.getElementById('figures-submenu');
    const btn = document.getElementById('draw-figures-btn');
    if (!sub) return;
    const isOpen = sub.classList.contains('open');
    // Fermer le sous-menu géométrie compact si ouvert
    const geoCompact = document.getElementById('geo-submenu-compact');
    if (geoCompact) geoCompact.style.display = 'none';
    if (!isOpen && typeof closeGeoSubmenu === 'function') closeGeoSubmenu();
    sub.classList.toggle('open');
    sub.style.display = sub.classList.contains('open') ? 'flex' : 'none';
    // Repositionner à côté de la draw-toolbar
    if (sub.classList.contains('open') && typeof _positionSubmenuNextToDrawbar === 'function') {
        requestAnimationFrame(function() { _positionSubmenuNextToDrawbar(sub); });
    }
    if (btn) {
        // Le bouton reste actif (surbrillance) si le sous-menu est ouvert OU si un mode figure est actif
        const figureActive = FIGURE_MODES.includes(currentDrawMode);
        _setBtnActive('draw-figures-btn', !isOpen || figureActive, 'figures');
    }
}

function toggleSelectMode() {
    if (!isDrawMode && !isEraserMode) {
        // Déjà en mode sélection → repasser en dessin libre
        initCanvas(); enableDrawing();
        setDrawMode('free');
        return;
    }
    // stopEraserMode remet isDrawMode=true et is-drawing → on appelle d'abord,
    // puis on écrase ses effets pour finir proprement en mode sélection
    stopEraserMode();
    // Passer en mode sélection : désactiver le dessin mais garder la toolbar
    isDrawMode = false;
    isPainting = false;
    if (drawCanvas) drawCanvas.classList.add('inactive');
    board.classList.remove('is-drawing');
    board.classList.remove('is-segment-mode');
    clearDrawCursor();
    // Fermer le sous-menu figures
    const figSub = document.getElementById('figures-submenu');
    if (figSub) figSub.classList.remove('open');
    // Fermer le sous-menu géométrie (règle/équerre/compas)
    if (typeof closeGeoSubmenu === 'function') closeGeoSubmenu();
    // Mettre à jour tous les boutons de mode
    FIGURE_MODES.forEach(m => {
        const btn = document.getElementById('draw-mode-'+m+'-btn');
        if (btn) { btn.style.borderColor = '#444'; btn.style.background = '#2a2a2e'; btn.style.color = '#aaa'; }
    });
    _setBtnActive('draw-figures-btn', false, 'figures');
    _setBtnActive('draw-free-btn', false);
    _setBtnActive('draw-select-btn', true);
}
function stopDrawing() {
    isDrawMode = false;
    isPainting = false;
    if (drawCanvas) drawCanvas.classList.add('inactive');
    board.classList.remove('is-drawing');
    board.classList.remove('is-segment-mode');
    clearDrawCursor();
    const figSub = document.getElementById('figures-submenu');
    if (figSub) { figSub.classList.remove('open'); figSub.style.display = 'none'; }
    if (typeof _closeGeoSubmenu === 'function') _closeGeoSubmenu();
    cancelHandwritingRecognition();
    stopEraserMode();
    // Repasser en mode sélection (curseur + bouton actif)
    FIGURE_MODES.forEach(m => {
        const btn = document.getElementById('draw-mode-'+m+'-btn');
        if (btn) { btn.style.borderColor = '#444'; btn.style.background = '#2a2a2e'; btn.style.color = '#aaa'; }
    });
    _setBtnActive('draw-figures-btn', false, 'figures');
    _setBtnActive('draw-free-btn', false);
    _setBtnActive('draw-select-btn', true);
    const tb = document.getElementById('draw-toolbar');
    if (tb) tb.style.display = 'none';
    if (typeof _updateDrawFabBtn === 'function') _updateDrawFabBtn();
}
function clearCanvas() {
    // Forcer le snapshot sans la garde de déduplication pour s'assurer que
    // TOUS les strokes actuels sont bien sauvegardés avant l'effacement.
    // snapshotNow() peut ignorer le snapshot si le JSON est identique au
    // dernier, ce qui peut arriver si des strokes ont été ajoutés sans
    // déclencher de snapshot intermédiaire.
    if (!isInitialLoading && !isRestoringState) {
        clearTimeout(_pendingSnapshotTimer);
        const cur = buildBoardJSON();
        if (cur) {
            undoStack.push(cur);
            if (undoStack.length > MAX_UNDO) undoStack.shift();
            redoStack = [];
            updateUndoRedoBtns();
        }
    }
    strokes = []; selectedStrokes = []; redrawStrokes();
    saveBoard();
}

// =========================================================================
// RECONNAISSANCE DE FORMES
// =========================================================================

function recognizeAndReplaceShape(stroke) {
    if (!stroke || stroke.points.length < 4) return false;
    const pts = stroke.points;

    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    pts.forEach(p => {
        if(p.x<minX)minX=p.x; if(p.y<minY)minY=p.y;
        if(p.x>maxX)maxX=p.x; if(p.y>maxY)maxY=p.y;
    });
    const w = maxX - minX, h = maxY - minY;
    if (w < 10 && h < 10) return false;

    const strokeColor = cpickGetValue('draw-color') || '#e84393';
    const strokeWidth = parseInt(document.getElementById('draw-size').value);
    const fillColor   = cpickGetValue('shape-recog-fill') || '#4a90e2';
    const fillOpacity = parseInt(document.getElementById('shape-recog-opacity').value) / 100;

    const firstPt = pts[0], lastPt = pts[pts.length-1];
    const closeDist = Math.hypot(firstPt.x-lastPt.x, firstPt.y-lastPt.y);
    const diagLen   = Math.hypot(w, h);
    const isClosed  = closeDist < diagLen * 0.35;

    if (!isClosed) {
        strokes.push({ ...stroke, recognized: false });
        const cur = buildBoardJSON();
        if (cur) { undoStack.push(cur); if (undoStack.length > MAX_UNDO) undoStack.shift(); redoStack=[]; updateUndoRedoBtns(); }
        saveBoard(); redrawStrokes();
        return false;
    }

    const cx = (minX+maxX)/2, cy = (minY+maxY)/2;
    const radii  = pts.map(p => Math.hypot(p.x-cx, p.y-cy));
    const avgR   = radii.reduce((a,b)=>a+b,0)/radii.length;
    const stdDev = Math.sqrt(radii.reduce((a,v)=>a+(v-avgR)**2,0)/radii.length);
    const cv     = stdDev / avgR; // coefficient de variation — faible = cercle
    const aspect = Math.min(w,h) / Math.max(w,h);

    // ── Critères améliorés ──
    // Cercle : cv très faible ET aspect proche de 1
    // On exige cv < 0.12 (était 0.20) pour éviter les faux positifs
    const isCircle = cv < 0.12 && aspect > 0.75;

    // Triangle : simplification agressive
    const isTriangle = !isCircle && isLikelyTriangle(pts);

    let shapeId;
    if (isCircle) {
        shapeId = 'circle';
    } else if (isTriangle) {
        shapeId = 'triangle';
    } else {
        // Carré vs rectangle : basé sur l'aspect ratio uniquement
        shapeId = aspect > 0.85 ? 'square' : 'rectangle';
    }

    let svgW = w, svgH = h;
    if (shapeId === 'circle') {
        const side = Math.max(w, h);
        svgW = side; svgH = side;
    }

    createShapeWidget(shapeId, strokeColor, fillColor, fillOpacity, svgW, svgH, minX + 'px', minY + 'px', false, strokeWidth);

    const snapCur = buildBoardJSON();
    if (snapCur) {
        undoStack.push(snapCur);
        if (undoStack.length > MAX_UNDO) undoStack.shift();
        redoStack = [];
        updateUndoRedoBtns();
        localStorage.setItem('profBoardConfig', snapCur);
    }
    redrawStrokes();
    return true;
}

function isLikelyTriangle(pts) {
    // Simplify and count corners — triangle = 3 corners
    const epsilon = Math.hypot(
        Math.max(...pts.map(p=>p.x)) - Math.min(...pts.map(p=>p.x)),
        Math.max(...pts.map(p=>p.y)) - Math.min(...pts.map(p=>p.y))
    ) * 0.10;
    const simplified = rdpSimplify(pts, epsilon);
    return simplified.length >= 3 && simplified.length <= 5;
}

function rdpSimplify(pts, epsilon) {
    if (pts.length < 3) return pts;
    let maxDist = 0, maxIdx = 0;
    const first = pts[0], last = pts[pts.length-1];
    for (let i=1; i<pts.length-1; i++) {
        const d = perpendicularDist(pts[i], first, last);
        if (d > maxDist) { maxDist = d; maxIdx = i; }
    }
    if (maxDist > epsilon) {
        const left = rdpSimplify(pts.slice(0, maxIdx+1), epsilon);
        const right = rdpSimplify(pts.slice(maxIdx), epsilon);
        return [...left.slice(0,-1), ...right];
    }
    return [first, last];
}

function perpendicularDist(pt, lineA, lineB) {
    const dx = lineB.x - lineA.x, dy = lineB.y - lineA.y;
    const len = Math.hypot(dx, dy);
    if (len === 0) return Math.hypot(pt.x - lineA.x, pt.y - lineA.y);
    return Math.abs(dy*pt.x - dx*pt.y + lineB.x*lineA.y - lineB.y*lineA.x) / len;
}



// =========================================================================
// GOMME
// =========================================================================
var isEraserMode = false, isErasing = false;

function toggleEraserMode() {
    if (isEraserMode) { stopEraserMode(); return; }
    // En mode annotation PDF : déléguer à setPdfAnnotTool
    if (typeof _pdfAnnotMode !== 'undefined' && _pdfAnnotMode) {
        setPdfAnnotTool('eraser');
        return;
    }
    // Désactiver le mode dessin SANS cacher la draw-toolbar
    isDrawMode = false;
    if (drawCanvas) drawCanvas.classList.add('inactive');
    board.classList.remove('is-drawing');
    cancelHandwritingRecognition();
    isEraserMode = true;
    initCanvas();
    drawCanvas.classList.remove('inactive');
    drawCanvas.classList.add('eraser-mode');
    board.classList.add('is-erasing');
    clearSelection();
    if (typeof _updateEraserBtnInPanel === 'function') _updateEraserBtnInPanel();
    // Désactiver visuellement crayon et surligneur quand la gomme s'active
    const hlBtnE = document.getElementById('draw-highlight-btn');
    if (hlBtnE) { hlBtnE.style.borderColor='#444'; hlBtnE.style.background='#2a2a2e'; hlBtnE.style.color='#aaa'; hlBtnE.classList.remove('btn-mode-active'); }
    const frBtnE = document.getElementById('draw-free-btn');
    if (frBtnE) { frBtnE.style.borderColor='#444'; frBtnE.style.background='#2a2a2e'; frBtnE.style.color='#aaa'; frBtnE.classList.remove('btn-mode-active'); }
    // En mode PDF : désactiver visuellement crayon et surligneur
    if (_pdfAnnotMode && typeof _updatePdfToolBtns === 'function') _updatePdfToolBtns();
}

function stopEraserMode() {
    if (!isEraserMode) return;
    isEraserMode = false; isErasing = false;
    if (drawCanvas) {
        drawCanvas.classList.remove('inactive');
        drawCanvas.classList.remove('eraser-mode');
        board.classList.remove('is-erasing');
        board.classList.add('is-drawing');
        redrawStrokes();
    }
    isDrawMode = true;
    if (typeof _updateEraserBtnInPanel === 'function') _updateEraserBtnInPanel();
    // En mode PDF : réactiver visuellement le bon outil
    if (_pdfAnnotMode && typeof _updatePdfToolBtns === 'function') _updatePdfToolBtns();
}

function eTouchStart(e) { e.preventDefault(); snapshotNow(); isErasing = true; eraseAt(getPos(e.touches[0])); }
function eTouchMove(e)  { e.preventDefault(); if (isErasing) eraseAt(getPos(e.touches[0])); }

function onEraserMouseMove(e) {
    const pos = getPos(e);
    const r = parseInt(document.getElementById('eraser-size').value);
    if (isErasing) eraseAt(pos);
    else drawEraserPreview(pos, r);
}
function onEraserLeave() { endErase(); redrawStrokes(); }
function startErase(e) { if (!isEraserMode) return; snapshotNow(); isErasing = true; eraseAt(getPos(e)); }
function endErase() { if (!isErasing) return; isErasing = false; saveBoard(); }

// =========================================================================
// DÉTECTION FORME SVG ENTIÈREMENT GOMMÉE
// =========================================================================
function isShapeFullyErased(widget) {
    const svg = widget.querySelector('svg');
    if (!svg) return false;
    if (!svg.querySelector('mask.eraser-mask')) return false;
    const svgW = parseFloat(svg.getAttribute('width')) || 100;
    const svgH = parseFloat(svg.getAttribute('height')) || 100;
    const tmpCanvas = document.createElement('canvas');
    const scale = Math.min(1, 200 / Math.max(svgW, svgH));
    tmpCanvas.width  = Math.ceil(svgW * scale);
    tmpCanvas.height = Math.ceil(svgH * scale);
    const tmpCtx = tmpCanvas.getContext('2d');
    const svgClone = svg.cloneNode(true);
    svgClone.setAttribute('width',  tmpCanvas.width);
    svgClone.setAttribute('height', tmpCanvas.height);
    svgClone.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    const svgStr = new XMLSerializer().serializeToString(svgClone);
    const blob = new Blob([svgStr], { type: 'image/svg+xml' });
    const url  = URL.createObjectURL(blob);
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
            tmpCtx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            const data = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height).data;
            for (let i = 3; i < data.length; i += 4) {
                if (data[i] > 5) { resolve(false); return; }
            }
            resolve(true);
        };
        img.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
        img.src = url;
    });
}

async function removeFullyErasedShapes() {
    const shapeWidgets = [...document.querySelectorAll('.shape-widget')];
    const toRemove = [];
    for (const widget of shapeWidgets) {
        const erased = await isShapeFullyErased(widget);
        if (erased) toRemove.push(widget);
    }
    if (toRemove.length > 0) {
        toRemove.forEach(w => w.remove());
        saveBoard();
    }
}

function eraseAt(pos) {
    const r = parseInt(document.getElementById('eraser-size').value);
    const NS = 'http://www.w3.org/2000/svg';

    // Densifie un stroke en interpolant des points tous les `step` px sur chaque segment
    // Nécessaire pour les figures géométriques qui n'ont que quelques points extrêmes
    function densify(pts, step) {
        if (pts.length < 2) return pts;
        const out = [pts[0]];
        for (let i = 0; i < pts.length - 1; i++) {
            const A = pts[i], B = pts[i + 1];
            const dist = Math.hypot(B.x - A.x, B.y - A.y);
            const n = Math.floor(dist / step);
            for (let j = 1; j <= n; j++) {
                const t = j / (n + 1);
                out.push({ x: A.x + t * (B.x - A.x), y: A.y + t * (B.y - A.y) });
            }
            out.push(B);
        }
        return out;
    }

    const newStrokes = [];
    strokes.forEach(stroke => {
        // Densifier à un pas de 4px pour que la gomme puisse couper n'importe où
        const pts = densify(stroke.points, 4);
        let current = [];
        for (let i = 0; i < pts.length; i++) {
            if (Math.hypot(pts[i].x - pos.x, pts[i].y - pos.y) <= r) {
                if (current.length >= 2) newStrokes.push({ ...stroke, points: current });
                current = [];
            } else {
                current.push(pts[i]);
            }
        }
        if (current.length >= 2) newStrokes.push({ ...stroke, points: current });
    });
    strokes = newStrokes;

    let shapesModified = false;
    document.querySelectorAll('.shape-widget').forEach(widget => {
        const svg = widget.querySelector('svg');
        if (!svg) return;
        const bRect = board.getBoundingClientRect();
        const svg2R = svg.getBoundingClientRect();
        const svgX = pos.x - (svg2R.left - bRect.left);
        const svgY = pos.y - (svg2R.top  - bRect.top);
        if (svgX < -r || svgY < -r || svgX > svg2R.width + r || svgY > svg2R.height + r) return;
        let mask = svg.querySelector('mask.eraser-mask');
        if (!mask) {
            const defs = document.createElementNS(NS, 'defs');
            mask = document.createElementNS(NS, 'mask');
            mask.setAttribute('class', 'eraser-mask');
            mask.setAttribute('id', 'em-' + Math.random().toString(36).slice(2));
            const bg = document.createElementNS(NS, 'rect');
            bg.setAttribute('x', '-500'); bg.setAttribute('y', '-500');
            bg.setAttribute('width', '9999'); bg.setAttribute('height', '9999');
            bg.setAttribute('fill', 'white');
            mask.appendChild(bg); defs.appendChild(mask);
            svg.insertBefore(defs, svg.firstChild);
            const g = document.createElementNS(NS, 'g');
            g.setAttribute('mask', 'url(#' + mask.id + ')');
            const toMove = [...svg.childNodes].filter(n => n !== defs);
            toMove.forEach(n => g.appendChild(n));
            svg.appendChild(g);
        }
        const circle = document.createElementNS(NS, 'circle');
        circle.setAttribute('cx', svgX); circle.setAttribute('cy', svgY);
        circle.setAttribute('r', r); circle.setAttribute('fill', 'black');
        mask.appendChild(circle);
        shapesModified = true;
    });
    drawEraserPreview(pos, r);
    if (shapesModified) {
        clearTimeout(eraseAt._checkTimer);
        eraseAt._checkTimer = setTimeout(() => {
            removeFullyErasedShapes();
        }, 150);
    }
}

function drawEraserPreview(pos, r) {
    if (!drawCtx) return;
    redrawStrokes();
    drawCtx.save();
    drawCtx.beginPath();
    drawCtx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    drawCtx.strokeStyle = 'rgba(60,60,60,0.7)';
    drawCtx.lineWidth = 1.5;
    drawCtx.setLineDash([4, 3]);
    drawCtx.stroke();
    drawCtx.beginPath();
    drawCtx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
    drawCtx.fillStyle = 'rgba(60,60,60,0.5)';
    drawCtx.fill();
    drawCtx.restore();
}

// =========================================================================
// SÉLECTION
// =========================================================================
var selectedWidgets = [], selectedStrokes = [];
var selectionRect = null;
var isSelectingRect = false, selectStartX = 0, selectStartY = 0;
var mouseDownClientX = 0, mouseDownClientY = 0;
var moveStartX = 0, moveStartY = 0;
var widgetMoveOrigins = [], strokeMoveOrigins = [];
var rotateCenterX = 0, rotateCenterY = 0, rotateStartAngle = 0;
var rotateOrigWidgetTransforms = [], rotateOrigStrokePoints = [];

function initSelectionRect() {
    if (selectionRect) return;
    selectionRect = document.createElement('div');
    selectionRect.id = 'selection-rect';
    board.appendChild(selectionRect);
}

function initBoardSelection() {
    initSelectionRect();
    board.addEventListener('mousedown', onBoardMouseDown);
    board.addEventListener('touchstart', (e) => {
        if (isDrawMode || isEraserMode) return; // géré par _boardDrawTouchStart
        if (e.touches.length !== 1) return;     // ignorer le multi-touch
        const t = e.touches[0];
        const target = t.target;
        // Laisser les overlays géométriques gérer leur propre touch
        if (target.closest('.geo-tool-overlay')) return;
        // Ne pas bloquer les clics sur les boutons interactifs (barre d'action, menus...)
        if (target.closest('button, a, input, select, textarea, .widget-action-bar, .widget-ctx-menu, #selection-controls, #toolbar-container, #shape-edit-panel')) return;
        // Empêcher scroll/zoom du navigateur pendant la sélection ou le drag
        e.preventDefault();
        // Construire un événement synthétique compatible avec onBoardMouseDown
        const synth = {
            clientX: t.clientX,
            clientY: t.clientY,
            target:  target,
            ctrlKey: false,
            metaKey: false,
        };
        onBoardMouseDown(synth);
    }, { passive: false });
}

function onBoardMouseDown(e) {
    if (document.body.classList.contains('presentation-mode')) return;
    if (isDrawMode || isEraserMode) return;
    const target = e.target || e.srcElement;
    if (target.closest('#selection-controls')) return;
    if (target.closest('#toolbar-container')) return;
    if (target.closest('.widget-ctx-menu')) return;
    if (target.closest('#shape-edit-panel')) return;

    // Fermer le menu widgets si ouvert
    document.getElementById('tools-menu')?.classList.remove('active');

    mouseDownClientX = e.clientX;
    mouseDownClientY = e.clientY;

    const widget = target.closest('.widget, .shape-widget');

    if (widget) {
        const gid = widget.dataset.groupId;
        // Membres DOM du groupe (widgets + shape-widgets)
        const domMembers = gid
            ? [...document.querySelectorAll(`.widget[data-group-id="${gid}"], .shape-widget[data-group-id="${gid}"]`)]
            : [widget];
        // Membres traits canvas du groupe
        const strokeMembers = gid ? strokes.filter(s => s.groupId === gid) : [];

        if (e.ctrlKey || e.metaKey) {
            const allDomSelected    = domMembers.every(m => selectedWidgets.includes(m));
            const allStrokeSel      = strokeMembers.every(s => selectedStrokes.includes(s));
            const allAlreadySelected = allDomSelected && allStrokeSel;
            if (allAlreadySelected) {
                domMembers.forEach(m => { selectedWidgets = selectedWidgets.filter(w => w !== m); m.classList.remove('selected'); });
                selectedStrokes = selectedStrokes.filter(s => !strokeMembers.includes(s));
            } else {
                domMembers.forEach(m => { if (!selectedWidgets.includes(m)) { selectedWidgets.push(m); m.classList.add('selected'); } });
                strokeMembers.forEach(s => { if (!selectedStrokes.includes(s)) selectedStrokes.push(s); });
            }
        } else {
            const allDomSelected    = domMembers.every(m => selectedWidgets.includes(m));
            const allStrokeSel      = strokeMembers.every(s => selectedStrokes.includes(s));
            const allAlreadySelected = allDomSelected && allStrokeSel
                && selectedWidgets.length === domMembers.length
                && selectedStrokes.length === strokeMembers.length;
            if (!allAlreadySelected) {
                clearSelection();
                domMembers.forEach(m => { selectedWidgets.push(m); m.classList.add('selected'); });
                strokeMembers.forEach(s => selectedStrokes.push(s));
            }
        }
        if (drawCtx) redrawStrokes();
        updateSelectionOverlay();
        return;
    }

    const pos = getBoardPos(e);

    const hitStroke = findStrokeAt(pos.x, pos.y);
	if (hitStroke) {
		const gid = hitStroke.groupId;
		const groupStrokes  = gid ? strokes.filter(s => s.groupId === gid) : [hitStroke];
		const groupWidgets  = gid
			? [...document.querySelectorAll(`.widget[data-group-id="${gid}"], .shape-widget[data-group-id="${gid}"]`)]
			: [];

		if (e.ctrlKey || e.metaKey) {
			const allInSel = groupStrokes.every(s => selectedStrokes.includes(s))
						  && groupWidgets.every(w => selectedWidgets.includes(w));
			if (allInSel) {
				selectedStrokes = selectedStrokes.filter(s => !groupStrokes.includes(s));
				groupWidgets.forEach(w => { selectedWidgets = selectedWidgets.filter(x => x !== w); w.classList.remove('selected'); });
			} else {
				groupStrokes.forEach(s => { if (!selectedStrokes.includes(s)) selectedStrokes.push(s); });
				groupWidgets.forEach(w => { if (!selectedWidgets.includes(w)) { selectedWidgets.push(w); w.classList.add('selected'); } });
			}
			if (drawCtx) redrawStrokes();
			updateSelectionOverlay();
			return;
		}

		// Sélection exclusive
		const allInSel = groupStrokes.every(s => selectedStrokes.includes(s))
					  && groupWidgets.every(w => selectedWidgets.includes(w))
					  && selectedStrokes.length === groupStrokes.length
					  && selectedWidgets.length === groupWidgets.length;
		if (!allInSel) {
			clearSelection();
			groupStrokes.forEach(s => selectedStrokes.push(s));
			groupWidgets.forEach(w => { selectedWidgets.push(w); w.classList.add('selected'); });
		}
		if (drawCtx) redrawStrokes();
		updateSelectionOverlay();

		// --- DRAG DIRECT sur le trait (sans poignée) ---
		snapshotNow();
		const dragStart = { x: pos.x, y: pos.y };
		widgetMoveOrigins = selectedWidgets.map(w => ({ widget: w, origLeft: w.offsetLeft, origTop: w.offsetTop }));
		strokeMoveOrigins = selectedStrokes.map(s => ({ stroke: s, origPoints: s.points.map(p => ({...p})) }));
		let hasMoved = false;

		const onStrokeDragMove = (ev) => {
			const p = getBoardPos(ev);
			const dx = p.x - dragStart.x, dy = p.y - dragStart.y;
			if (!hasMoved && Math.hypot(dx, dy) < 4) return;
			hasMoved = true;
			if (drawCanvas) drawCanvas.style.zIndex = 13000;
			widgetMoveOrigins.forEach(({ widget, origLeft, origTop }) => {
				widget.style.left = (origLeft + dx) + 'px';
				widget.style.top  = (origTop  + dy) + 'px';
			});
			strokeMoveOrigins.forEach(({ stroke, origPoints }) => {
				stroke.points = origPoints.map(p2 => ({ x: p2.x + dx, y: p2.y + dy }));
			});
			if (drawCtx) redrawStrokes();
			updateSelectionOverlay();
		};

		const onStrokeDragEnd = () => {
			document.removeEventListener('pointermove', onStrokeDragMove);
			document.removeEventListener('pointerup',   onStrokeDragEnd);
			document.removeEventListener('pointercancel', onStrokeDragEnd);
			if (drawCanvas) drawCanvas.style.zIndex = '';
			if (hasMoved) {
				const curW = window.innerWidth, curVH = virtualH(curW);
				selectedWidgets.forEach(w => {
					w.dataset.leftPercent = (w.offsetLeft / curW) * 100;
					w.dataset.topPercent  = (w.offsetTop  / curVH) * 100;
				});
				saveBoard();
			}
			updateSelectionOverlay();
		};

		document.addEventListener('pointermove', onStrokeDragMove);
		document.addEventListener('pointerup',   onStrokeDragEnd);
		document.addEventListener('pointercancel', onStrokeDragEnd);
		return;
	}

    clearSelection();
    isSelectingRect = true;
    selectStartX = pos.x;
    selectStartY = pos.y;
    selectionRect.style.cssText = `display:block;left:${pos.x}px;top:${pos.y}px;width:0;height:0;`;

    const onMove = (ev) => {
        if (!isSelectingRect) return;
        const p = getBoardPos(ev);
        const x = Math.min(p.x, selectStartX), y = Math.min(p.y, selectStartY);
        Object.assign(selectionRect.style, {
            left: x+'px', top: y+'px',
            width: Math.abs(p.x - selectStartX)+'px',
            height: Math.abs(p.y - selectStartY)+'px'
        });
    };

    const onUp = (ev) => {
        document.removeEventListener('pointermove',   onMove);
        document.removeEventListener('pointerup',     onUp);
        document.removeEventListener('pointercancel', onUp);
        if (!isSelectingRect) return;
        isSelectingRect = false;

        const src = ev;
        const dx = Math.abs(src.clientX - mouseDownClientX);
        const dy = Math.abs(src.clientY - mouseDownClientY);

        if (dx < 5 && dy < 5) {
            clearSelection();
            return;
        }

        const pos2 = getBoardPos({ clientX: src.clientX, clientY: src.clientY });
        const rx = Math.min(pos2.x, selectStartX), ry = Math.min(pos2.y, selectStartY);
        const rw = Math.abs(pos2.x - selectStartX), rh = Math.abs(pos2.y - selectStartY);
        const br = board.getBoundingClientRect();

        document.querySelectorAll('.widget, .shape-widget').forEach(w => {
            const r = w.getBoundingClientRect();
            const wl = r.left - br.left, wt = r.top - br.top;
            if (wl < rx+rw && wl+r.width > rx && wt < ry+rh && wt+r.height > ry) {
                selectedWidgets.push(w);
                w.classList.add('selected');
            }
        });

        if (strokes) {
            strokes.forEach(s => {
                if (s.points.some(p => p.x >= rx && p.x <= rx+rw && p.y >= ry && p.y <= ry+rh))
                    selectedStrokes.push(s);
            });
        }

        if (drawCtx) redrawStrokes();
        updateSelectionOverlay();
        if (selectionRect) selectionRect.style.display = 'none';
    };

    document.addEventListener('pointermove',   onMove);
    document.addEventListener('pointerup',     onUp);
    document.addEventListener('pointercancel', onUp);
}

function clearSelection() {
    selectedWidgets = selectedWidgets.filter(w => document.body.contains(w));
    selectedWidgets.forEach(w => w.classList.remove('selected'));
    selectedWidgets = []; selectedStrokes = [];
    if (drawCtx) redrawStrokes();
    document.getElementById('selection-controls').style.display = 'none';
    if (selectionRect) selectionRect.style.display = 'none';
    board.classList.remove('single-select');
    board.classList.remove('multi-select');
}


// =========================================================================
// MODE ANNOTATION PDF
// =========================================================================
// État global
var _pdfAnnotMode     = false;  // mode actif ?
var _pdfAnnotWidget   = null;   // widget PDF cible
var _pdfAnnotCanvas   = null;   // canvas d'annotations (référence, pour les events)
var _pdfAnnotEvTarget = null;   // élément sur lequel les events draw.js sont attachés
var _pdfAnnotTool     = 'pen';  // 'pen' | 'highlighter' | 'text' | 'eraser' | 'pan'
var _pdfAnnotPainting = false;
var _pdfPrevTool      = 'pen';  // outil mémorisé avant de passer en pan

// ── Outils boutons PDF extras dans la toolbar ──────────────────────────────

// Boutons supplémentaires (surligneur, texte, annuler, effacer) affichés
// uniquement quand le mode est actif.
var _PDF_EXTRA_BTNS = ['pdf-pan-btn','pdf-text-btn'];

function _dtClearAction() {
    if (_pdfAnnotMode) {
        pdfAnnotClear();
    } else {
        clearCanvas();
    }
}

function _showPdfExtraBtns(show) {
    _PDF_EXTRA_BTNS.forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.style.display = show ? 'flex' : 'none';
    });
    // Adapter le titre du bouton effacer selon le contexte
    const clearBtn = document.getElementById('dt-clear-btn');
    if (clearBtn) {
        clearBtn.title = show ? 'Effacer toutes les annotations PDF' : 'Effacer tout le dessin';
    }
}

// Met à jour l'aspect visuel des boutons outil PDF
// ── Curseurs SVG pour le mode annotation PDF ─────────────────────────────

function _pdfCursor(tool) {
    let svg;
    if (tool === 'pan') {
        return 'grab';
    }
    if (tool === 'pen') {
        svg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">'
            + '<line x1="10" y1="0" x2="10" y2="20" stroke="#4a90e2" stroke-width="1.5"/>'
            + '<line x1="0" y1="10" x2="20" y2="10" stroke="#4a90e2" stroke-width="1.5"/>'
            + '<circle cx="10" cy="10" r="2" fill="#4a90e2"/>'
            + '</svg>';
        return 'url("data:image/svg+xml;base64,' + btoa(svg) + '") 10 10, crosshair';
    }
    if (tool === 'highlighter') {
        svg = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20">'
            + '<line x1="10" y1="0" x2="10" y2="20" stroke="#f5c518" stroke-width="2.5"/>'
            + '<line x1="0" y1="10" x2="20" y2="10" stroke="#f5c518" stroke-width="2.5"/>'
            + '<circle cx="10" cy="10" r="3" fill="#f5c518"/>'
            + '</svg>';
        return 'url("data:image/svg+xml;base64,' + btoa(svg) + '") 10 10, crosshair';
    }
    if (tool === 'eraser') {
        svg = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="16">'
            + '<rect x="1" y="2" width="20" height="12" rx="2" fill="#ddd" stroke="#888" stroke-width="1.2"/>'
            + '<rect x="1" y="2" width="9" height="12" rx="2" fill="#ffb3b3" stroke="#888" stroke-width="1.2"/>'
            + '<line x1="1" y1="8" x2="21" y2="8" stroke="#aaa" stroke-width="0.8"/>'
            + '</svg>';
        return 'url("data:image/svg+xml;base64,' + btoa(svg) + '") 11 8, cell';
    }
    if (tool === 'figure') {
        svg = '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22">'
            + '<line x1="11" y1="0" x2="11" y2="22" stroke="#aaa" stroke-width="1.5"/>'
            + '<line x1="0" y1="11" x2="22" y2="11" stroke="#aaa" stroke-width="1.5"/>'
            + '<circle cx="11" cy="11" r="2" fill="#aaa"/>'
            + '<polygon points="14,14 21,14 14,21" fill="#7a9abf" stroke="#4a6a8a" stroke-width="1"/>'
            + '</svg>';
        return 'url("data:image/svg+xml;base64,' + btoa(svg) + '") 11 11, crosshair';
    }
    if (tool === 'text') {
        return 'text';
    }
    return 'crosshair';
}

// Active un outil PDF et désactive tous les autres — point d'entrée unique
function setPdfAnnotTool(tool) {
    if (!_pdfAnnotMode) return;

    // Bascule : recliqué sur le même outil → retour au crayon
    if (_pdfAnnotTool === tool) tool = 'pen';

    _pdfAnnotTool = tool;

    // Gérer isEraserMode manuellement (sans appeler stopEraserMode qui
    // déclenche _updatePdfToolBtns trop tôt avec le mauvais outil)
    if (tool === 'eraser') {
        isEraserMode = true;
        isErasing = false;
        if (drawCanvas) { drawCanvas.classList.remove('inactive'); drawCanvas.classList.add('eraser-mode'); }
        board.classList.add('is-erasing');
        if (typeof _updateEraserBtnInPanel === 'function') _updateEraserBtnInPanel();
    } else if (isEraserMode) {
        isEraserMode = false;
        isErasing = false;
        if (drawCanvas) { drawCanvas.classList.remove('eraser-mode'); board.classList.remove('is-erasing'); }
        if (typeof _updateEraserBtnInPanel === 'function') _updateEraserBtnInPanel();
    }

    // Désactiver le mode figure si on passe sur autre chose
    if (tool !== 'figure') {
        currentDrawMode = 'free';
        _setBtnActive('draw-figures-btn', false, 'figures');
        const figSub = document.getElementById('figures-submenu');
        if (figSub) { figSub.classList.remove('open'); figSub.style.display = 'none'; }
    }

    // Appliquer le curseur SVG
    const cursor = _pdfCursor(tool);
    if (_pdfAnnotEvTarget) _pdfAnnotEvTarget.style.setProperty('cursor', cursor, 'important');
    if (_pdfAnnotCanvas)   _pdfAnnotCanvas.style.cursor = cursor;

    _updatePdfToolBtns();
}

// Met à jour l'aspect visuel des 5 boutons — source de vérité : _pdfAnnotTool
function _updatePdfToolBtns() {
    const tool = _pdfAnnotTool;  // _pdfAnnotTool est toujours à jour avant cet appel

    // Helper : active ou désactive un bouton avec couleur donnée
    function _setBtn(id, active, activeColor) {
        const btn = document.getElementById(id);
        if (!btn) return;
        if (active) {
            btn.style.setProperty('background',    activeColor || '#1a3550', 'important');
            btn.style.setProperty('border-color',  activeColor ? activeColor.replace(/[^,]+\)/, '1)') : '#4a90e2', 'important');
            btn.style.setProperty('color',         '#fff', 'important');
            btn.style.setProperty('box-shadow',    `0 0 8px ${activeColor || '#4a90e2'}88`, 'important');
            btn.classList.add('btn-mode-active');
        } else {
            btn.style.removeProperty('background');
            btn.style.removeProperty('border-color');
            btn.style.removeProperty('color');
            btn.style.removeProperty('box-shadow');
            btn.style.background  = '#2a2a2e';
            btn.style.borderColor = '#444';
            btn.style.color       = '#aaa';
            btn.style.boxShadow   = 'none';
            btn.classList.remove('btn-mode-active');
        }
    }

    _setBtn('pdf-pan-btn',        tool === 'pan',         '#c8a000');
    _setBtn('draw-free-btn',      tool === 'pen',         '#1a3550');
    _setBtn('draw-highlight-btn', tool === 'highlighter', '#2a2200');
    _setBtn('eraser-btn',         tool === 'eraser',      '#3a1a1a');
    _setBtn('draw-figures-btn',   tool === 'figure',      '#1a2a4a');

    // Curseur sur le widget cible
    const cursor = _pdfCursor(tool);
    if (_pdfAnnotEvTarget) _pdfAnnotEvTarget.style.setProperty('cursor', cursor, 'important');
    if (_pdfAnnotCanvas)   _pdfAnnotCanvas.style.cursor = cursor;
}

// ── Sélection du widget PDF cible ─────────────────────────────────────────

function _findActivePdfWidget() {
    const pdfs = [...document.querySelectorAll('.widget[data-type="pdf"]')];
    if (pdfs.length === 0) return null;
    const loaded = pdfs.filter(w => {
        const wrap = w.querySelector('.pdf-canvas-wrap');
        return wrap && wrap.style.display !== 'none';
    });
    if (loaded.length === 0) return null;
    return loaded.reduce((best, w) => {
        return parseInt(w.style.zIndex || 0) >= parseInt(best.style.zIndex || 0) ? w : best;
    });
}

// ── Activer / désactiver le mode ──────────────────────────────────────────

function togglePdfAnnotMode() {
    if (_pdfAnnotMode) {
        _stopPdfAnnotMode();
    } else {
        _startPdfAnnotMode();
    }
}

function _startPdfAnnotMode() {
    const target = _findActivePdfWidget();
    if (!target) {
        _showPdfAnnotToast('⚠️ Ouvrez d\'abord un PDF dans un widget');
        return;
    }
    const annotCanvas = target.querySelector('.pdf-annot-canvas');
    if (!annotCanvas) {
        _showPdfAnnotToast('⚠️ Canvas d\'annotation introuvable');
        return;
    }

    // Désactiver le dessin sur le board pendant le mode annotation PDF
    if (isEraserMode) stopEraserMode();
    if (isDrawMode) stopDrawing_keepToolbar();

    _pdfAnnotMode   = true;
    _pdfAnnotWidget = target;
    _pdfAnnotCanvas = annotCanvas;
    _pdfAnnotTool   = 'pen'; // outil par défaut : crayon

    // Marquer le widget cible
    target.classList.add('pdf-annot-target');

    // Désactiver les pointer-events du canvas d'annotation pour que les listeners
    // natifs de media.js ne se déclenchent plus (ils utilisent #e74c3c par défaut).
    // draw.js écoute sur le board qui capture les événements à la place.
    annotCanvas.style.pointerEvents = 'none';

    // Désactiver aussi les listeners natifs via l'API si disponible
    const api0 = target._pdfAnnotAPI;
    if (api0 && api0.detachNativeEvents) api0.detachNativeEvents();

    // Mettre à jour le bouton
    const btn = document.getElementById('pdf-annot-mode-btn');
    if (btn) btn.classList.add('pdf-annot-active');

    // Afficher les boutons extras
    _showPdfExtraBtns(true);
    _updatePdfToolBtns();
    // Masquer les boutons inutiles en mode annotation PDF
    const selBtn = document.getElementById('draw-select-btn');
    if (selBtn) selBtn.style.display = 'none';
    const geoBtn = document.getElementById('geo-draw-btn');
    if (geoBtn) geoBtn.style.display = 'none';

    // Mettre pointerEvents:none sur le canvas pour bloquer les handlers natifs de media.js.
    _pdfAnnotCanvas.style.pointerEvents = 'none';

    // Attacher les événements sur le widget parent
    _pdfAnnotEvTarget = target;
    _pdfAnnotEvTarget.addEventListener('mousedown',   _pdfAnnotMouseDown);
    _pdfAnnotEvTarget.addEventListener('mousemove',   _pdfAnnotMouseMove);
    _pdfAnnotEvTarget.addEventListener('mouseup',     _pdfAnnotMouseUp);
    _pdfAnnotEvTarget.addEventListener('mouseleave',  _pdfAnnotMouseLeave);
    _pdfAnnotEvTarget.addEventListener('contextmenu', _pdfAnnotContextMenu);
    _pdfAnnotEvTarget.addEventListener('touchstart',  _pdfAnnotTouchStart, { passive: false });
    _pdfAnnotEvTarget.addEventListener('touchmove',   _pdfAnnotTouchMove,  { passive: false });
    _pdfAnnotEvTarget.addEventListener('touchend',    _pdfAnnotTouchEnd);

    // Appliquer le curseur SVG dès l'ouverture (outil par défaut : pan)
    const initCursor = _pdfCursor(_pdfAnnotTool);
    _pdfAnnotEvTarget.style.setProperty('cursor', initCursor, 'important');
    _pdfAnnotCanvas.style.cursor = initCursor;
    // Retirer le curseur grab du canvasWrap — draw.js gère maintenant le curseur
    const wrapAtStart = target.querySelector('.pdf-canvas-wrap');
    if (wrapAtStart) wrapAtStart.style.cursor = '';

    _showPdfAnnotToast('✏️ Mode annotation PDF actif — cliquez sur le PDF pour annoter');
}

function _stopPdfAnnotMode() {
    if (!_pdfAnnotMode) return;

    // Détacher les événements du widget parent
    if (_pdfAnnotEvTarget) {
        _pdfAnnotEvTarget.removeEventListener('mousedown',   _pdfAnnotMouseDown);
        _pdfAnnotEvTarget.removeEventListener('mousemove',   _pdfAnnotMouseMove);
        _pdfAnnotEvTarget.removeEventListener('mouseup',     _pdfAnnotMouseUp);
        _pdfAnnotEvTarget.removeEventListener('mouseleave',  _pdfAnnotMouseLeave);
        _pdfAnnotEvTarget.removeEventListener('contextmenu', _pdfAnnotContextMenu);
        _pdfAnnotEvTarget.removeEventListener('touchstart',  _pdfAnnotTouchStart);
        _pdfAnnotEvTarget.removeEventListener('touchmove',   _pdfAnnotTouchMove);
        _pdfAnnotEvTarget.removeEventListener('touchend',    _pdfAnnotTouchEnd);
        _pdfAnnotEvTarget.style.cursor = '';
        _pdfAnnotEvTarget = null;
    }

    // Remettre le canvas cliquable pour zoom/scroll natif
    if (_pdfAnnotCanvas) {
        _pdfAnnotCanvas.style.pointerEvents = 'auto';
        _pdfAnnotCanvas.style.cursor = '';
        const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
        if (api && api.reattachNativeEvents) api.reattachNativeEvents();
    }
    // Remettre le curseur grab sur le canvasWrap
    if (_pdfAnnotWidget) {
        const wrap = _pdfAnnotWidget.querySelector('.pdf-canvas-wrap');
        if (wrap) wrap.style.cursor = 'grab';
    }

    // Nettoyer le widget cible
    if (_pdfAnnotWidget) _pdfAnnotWidget.classList.remove('pdf-annot-target');

    _pdfAnnotMode     = false;
    _pdfAnnotWidget   = null;
    _pdfAnnotCanvas   = null;
    _pdfAnnotEvTarget = null;
    _pdfAnnotPainting = false;

    // Repasser en mode sélection (pas en mode dessin)
    isDrawMode = true; // toggleSelectMode attend isDrawMode=true pour basculer
    toggleSelectMode();

    // Bouton
    const btn = document.getElementById('pdf-annot-mode-btn');
    if (btn) btn.classList.remove('pdf-annot-active');

    // Réinitialiser le bouton main (pan)
    const panBtn = document.getElementById('pdf-pan-btn');
    if (panBtn) {
        panBtn.style.borderColor = '#444';
        panBtn.style.background  = '#2a2a2e';
        panBtn.style.color       = '#aaa';
        panBtn.style.boxShadow   = 'none';
    }
    _pdfPanLastX = null; _pdfPanLastY = null;    // Réinitialiser le bouton surligneur partagé
    const hlBtn = document.getElementById('draw-highlight-btn');    if (hlBtn) {
        hlBtn.style.borderColor = '#444';
        hlBtn.style.background  = '#2a2a2e';
        hlBtn.style.color       = '#aaa';
        hlBtn.classList.remove('btn-mode-active');
    }
    // Réinitialiser le bouton texte
    const textBtn = document.getElementById('pdf-text-btn');
    if (textBtn) {
        textBtn.style.borderColor = '#444';
        textBtn.style.background  = '#2a2a2e';
        textBtn.style.color       = '#aaa';
        textBtn.style.boxShadow   = 'none';
        textBtn.style.fontSize    = '13px';
    }

    // Cacher boutons extras
    _showPdfExtraBtns(false);
    // Réafficher les boutons masqués
    const selBtnStop = document.getElementById('draw-select-btn');
    if (selBtnStop) selBtnStop.style.display = '';
    const geoBtnStop = document.getElementById('geo-draw-btn');
    if (geoBtnStop) geoBtnStop.style.display = '';
}

// Variante de stopDrawing qui ne cache pas la toolbar (pour basculer depuis draw mode)
function stopDrawing_keepToolbar() {
    isDrawMode = false;
    if (drawCanvas) drawCanvas.classList.add('inactive');
    board.classList.remove('is-drawing');
    board.classList.remove('is-segment-mode');
    clearDrawCursor();
    cancelHandwritingRecognition();
    const figSub = document.getElementById('figures-submenu');
    if (figSub) { figSub.classList.remove('open'); figSub.style.display = 'none'; }
    if (typeof _closeGeoSubmenu === 'function') _closeGeoSubmenu();
}

// ── Coordonnées relatives au canvas d'annotations ─────────────────────────

function _getPdfAnnotPos(e) {
    const rect = _pdfAnnotCanvas.getBoundingClientRect();
    const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
    // Tenir compte du ratio canvas CSS vs canvas interne (zoom PDF)
    const scaleX = _pdfAnnotCanvas.width  / rect.width;
    const scaleY = _pdfAnnotCanvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top)  * scaleY
    };
}

// ── Undo / Clear — délèguent à l'API de media.js ──────────────────────────

function pdfAnnotUndo() {
    if (!_pdfAnnotMode) return;
    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (api) api.undo();
}

function pdfAnnotRedo() {
    if (!_pdfAnnotMode) return;
    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (api && api.redo) api.redo();
}

function pdfAnnotClear() {
    if (!_pdfAnnotMode) return;
    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (api) api.clear();
}

// ── Helpers : couleur + taille depuis la draw-toolbar ─────────────────────

function _pdfAnnotGetColor() {
    // window._drawColor est mis à jour par cpickDispatch à chaque changement de couleur
    if (window._drawColor) return window._drawColor;
    // Fallback : lire via cpickGetValue
    if (typeof cpickGetValue === 'function') {
        const c = cpickGetValue('draw-color');
        if (c) return c;
    }
    // Fallback : couleur de fond de la swatch (mise à jour par _setDrawColor et cpickSet)
    const swatch = document.querySelector('#cpick-draw-color .cpick-swatch');
    if (swatch) {
        const bg = swatch.style.background || swatch.style.backgroundColor;
        if (bg && bg !== '') return bg;
    }
    return '#111111';
}

function _pdfAnnotGetSize() {
    if (isEraserMode) return parseInt(document.getElementById('eraser-size').value) || 20;
    return parseInt(document.getElementById('draw-size').value) || 4;
}

// Récupère l'outil effectif : 'pen' | 'highlighter' | 'eraser' | 'text'
// (la gomme PDF utilise eraser-size mais reste 'eraser' côté tool)
function _pdfAnnotEffectiveTool() {
    return _pdfAnnotTool;
}

// ── Coordonnées en pixels canvas (tient compte du CSS scaling) ────────────
// Délègue au canvas exposé par l'API de media.js

function _getPdfAnnotPos(e) {
    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    const canvas = api ? api.getAnnotCanvas() : _pdfAnnotCanvas;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width  / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top)  * scaleY
    };
}

var _pdfPanLastY = null;
var _pdfPanLastX = null;

// ── Dessin — tout passe par l'API de media.js ─────────────────────────────

var _pdfFigureStart = null; // point de départ pour les figures PDF
var _pdfDragText = null;    // { index, stroke, startPos } lors d'un drag de texte

function _pdfAnnotStartStroke(e) {
    const tool = _pdfAnnotEffectiveTool();
    if (tool === 'text') {
        const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
        const pos = _getPdfAnnotPos(e);
        const found = api && api.findTextStrokeAt ? api.findTextStrokeAt(pos.x, pos.y) : null;

        if (found) {
            if (_pdfSelectedText && _pdfSelectedText.index === found.index) {
                // Texte déjà sélectionné + clic dessus → préparer drag ou édition
                const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
                const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
                _pdfDragText = { index: found.index, stroke: found.stroke, startPos: pos, startClientX: clientX, startClientY: clientY, moved: false };
                _pdfAnnotPainting = true;
                if (_pdfAnnotEvTarget) _pdfAnnotEvTarget.style.setProperty('cursor', 'grabbing', 'important');
            } else {
                // Nouveau texte cliqué → sélectionner
                _pdfAnnotSelectText(e);
            }
            return;
        }

        // Clic dans le vide → désélectionner et créer nouveau texte
        _pdfAnnotDeselect();
        _pdfAnnotInsertText(e);
        return;
    }

    // Mode pan : enregistrer le point de départ
    if (tool === 'pan') {
        const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);
        _pdfPanLastX = clientX;
        _pdfPanLastY = clientY;
        _pdfAnnotPainting = true;
        if (_pdfAnnotEvTarget) _pdfAnnotEvTarget.style.setProperty('cursor', 'grabbing', 'important');
        return;
    }

    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (!api) return;

    const pos = _getPdfAnnotPos(e);

    // Mode figure : enregistrer le point de départ (sauf si gomme active)
    if (FIGURE_MODES.includes(currentDrawMode) && tool !== 'eraser') {
        _pdfFigureStart = pos;
        _pdfAnnotPainting = true;
        return;
    }

    _pdfAnnotPainting = true;
    const eraserSize = tool === 'eraser' ? (parseInt((document.getElementById('eraser-size') || {}).value) || 20) : null;
    api.startStroke(_pdfAnnotGetColor(), eraserSize !== null ? eraserSize : _pdfAnnotGetSize(), tool, pos.x, pos.y);
}

function _pdfAnnotContinueStroke(e) {
    if (!_pdfAnnotPainting) return;
    const tool = _pdfAnnotEffectiveTool();

    // Drag d'un texte existant
    if (_pdfDragText) {
        const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
        const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
        const dx = clientX - _pdfDragText.startClientX;
        const dy = clientY - _pdfDragText.startClientY;
        if (!_pdfDragText.moved && Math.sqrt(dx*dx + dy*dy) > 5) {
            _pdfDragText.moved = true;
            if (_pdfAnnotEvTarget) _pdfAnnotEvTarget.style.setProperty('cursor', 'grabbing', 'important');
        }
        if (_pdfDragText.moved) {
            const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
            if (api) {
                const pos = _getPdfAnnotPos(e);
                api.moveTextStroke(_pdfDragText.index, pos.x, pos.y);
            }
        }
        return;
    }

    if (tool === 'text') return;

    // Mode pan : scroller le conteneur PDF
    if (tool === 'pan') {
        const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY);
        if (_pdfPanLastX !== null && _pdfAnnotWidget) {
            const dx = clientX - _pdfPanLastX;
            const dy = clientY - _pdfPanLastY;
            const wrap = _pdfAnnotWidget.querySelector('.pdf-canvas-wrap');
            if (wrap) {
                wrap.scrollLeft -= dx;
                wrap.scrollTop  -= dy;
            }
        }
        _pdfPanLastX = clientX;
        _pdfPanLastY = clientY;
        return;
    }

    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (!api) return;

    const pos = _getPdfAnnotPos(e);

    // Mode figure : preview en temps réel (sauf si gomme active)
    if (FIGURE_MODES.includes(currentDrawMode) && _pdfFigureStart && tool !== 'eraser') {
        const pts = _buildFigurePoints(currentDrawMode, _pdfFigureStart, pos);
        if (pts) api.previewFigure(_pdfAnnotGetColor(), _pdfAnnotGetSize(), pts);
        return;
    }

    const eraserSize2 = tool === 'eraser' ? (parseInt((document.getElementById('eraser-size') || {}).value) || 20) : null;
    api.continueStroke(_pdfAnnotGetColor(), eraserSize2 !== null ? eraserSize2 : _pdfAnnotGetSize(), tool, pos.x, pos.y);
}

function _pdfAnnotEndStroke(e) {
    if (!_pdfAnnotPainting) return;
    _pdfAnnotPainting = false;

    // Fin du drag texte
    if (_pdfDragText) {
        if (!_pdfDragText.moved) {
            // Pas de mouvement sur texte sélectionné → ouvrir l'éditeur
            const api2 = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
            const found2 = api2 && api2.findTextStrokeAt ? api2.findTextStrokeAt(_pdfDragText.startPos.x, _pdfDragText.startPos.y) : null;
            if (found2) {
                _pdfAnnotDeselect();
                _pdfAnnotOpenEditorForStroke(e, found2);
            }
        } else {
            // Drag terminé → sauvegarder
            const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
            if (api && api.saveTextMove) api.saveTextMove(_pdfDragText.index);
        }
        _pdfDragText = null;
        if (_pdfAnnotEvTarget) _pdfAnnotEvTarget.style.setProperty('cursor', _pdfCursor(_pdfAnnotTool), 'important');
        return;
    }

    // Mode pan : remettre le curseur grab
    if (_pdfAnnotTool === 'pan') {
        _pdfPanLastX = null;
        _pdfPanLastY = null;
        if (_pdfAnnotEvTarget) _pdfAnnotEvTarget.style.setProperty('cursor', _pdfCursor('pan'), 'important');
        return;
    }

    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (!api) return;

    // Mode figure : dessiner la figure finale (sauf si gomme active)
    if (FIGURE_MODES.includes(currentDrawMode) && _pdfFigureStart && e && !isEraserMode) {
        const pos = _getPdfAnnotPos(e);
        const pts = _buildFigurePoints(currentDrawMode, _pdfFigureStart, pos);
        _pdfFigureStart = null;
        if (pts && pts.length >= 2) api.addFigureStroke(_pdfAnnotGetColor(), _pdfAnnotGetSize(), pts);
        return;
    }
    _pdfFigureStart = null;
    _pdfFigureStart = null;
    api.endStroke();
}

// ── Insertion / édition de texte inline ──────────────────────────────────

function _pdfAnnotInsertText(e) {
    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (!api) return;
    const canvas = api.getAnnotCanvas();
    if (!canvas) return;

    const pos     = _getPdfAnnotPos(e);
    const color   = _pdfAnnotGetColor();
    const size    = _pdfAnnotGetSize();
    const rect       = canvas.getBoundingClientRect();
    const fontSizePx = Math.round(6 * Math.pow(1.12, size) * rect.width / 600);
    const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;

    _showPdfInlineTextEditor({
        clientX, clientY, color, size, fontSizePx,
        onValidate(text, finalSize, finalColor) {
            if (!text.trim()) return;
            if (api.addTextStroke) api.addTextStroke(text, finalColor ?? color, finalSize ?? size, pos.x, pos.y);
        }
    });
}

function _pdfAnnotOpenEditorForStroke(e, found) {
    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (!api) return;
    const { index, stroke } = found;
    const canvas     = api.getAnnotCanvas();
    const rect       = canvas.getBoundingClientRect();
    const fontSizePx = Math.round(6 * Math.pow(1.12, stroke.size) * rect.width / 600);
    const screenX    = rect.left + stroke.nx * rect.width;
    const screenY    = rect.top  + stroke.ny * rect.height;
    _showPdfInlineTextEditor({
        clientX: screenX, clientY: screenY,
        color: stroke.color, size: stroke.size, fontSizePx,
        initialText: stroke.text || '',
        onValidate(newText, finalSize, finalColor) {
            if (!newText.trim()) return;
            api.updateTextStroke(index, newText, finalSize ?? stroke.size, finalColor ?? stroke.color);
        }
    });
}

// ── Sélection d'un texte existant (clic droit) ───────────────────────────
var _pdfSelectedText = null; // { index, stroke }
var _pdfSelectColorInterval = null;

function _pdfAnnotSelectText(e) {
    const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
    if (!api || !api.findTextStrokeAt) return;
    const pos   = _getPdfAnnotPos(e);
    const found = api.findTextStrokeAt(pos.x, pos.y);

    // Clic droit ailleurs → désélectionner
    if (!found) {
        _pdfAnnotDeselect();
        return;
    }

    e.preventDefault();
    e.stopPropagation();

    // Sélectionner ce stroke
    _pdfSelectedText = { index: found.index, stroke: { ...found.stroke } };

    // Synchroniser le color picker ET le slider de taille avec le stroke
    window._drawColor = found.stroke.color;
    if (typeof cpickSet === 'function') cpickSet('draw-color', found.stroke.color, true);
    const drawSizeEl = document.getElementById('draw-size');
    const drawSizeLabelEl = document.getElementById('draw-size-label');
    if (drawSizeEl) { drawSizeEl.value = found.stroke.size; drawSizeEl.dispatchEvent(new Event('input')); }
    if (drawSizeLabelEl) drawSizeLabelEl.textContent = found.stroke.size;

    // Dessiner le cadre de sélection
    api.drawTextSelection(found.index);

    // Surveiller les changements de couleur et de taille du picker
    if (_pdfSelectColorInterval) clearInterval(_pdfSelectColorInterval);
    let lastPickerColor = found.stroke.color;
    let lastPickerSize  = found.stroke.size;
    _pdfSelectColorInterval = setInterval(() => {
        if (!_pdfSelectedText) { clearInterval(_pdfSelectColorInterval); return; }
        const pickerColor = _pdfAnnotGetColor();
        const pickerSize  = _pdfAnnotGetSize();
        let changed = false;
        if (pickerColor && pickerColor !== lastPickerColor) {
            lastPickerColor = pickerColor;
            _pdfSelectedText.stroke.color = pickerColor;
            changed = true;
        }
        if (pickerSize && pickerSize !== lastPickerSize) {
            lastPickerSize = pickerSize;
            _pdfSelectedText.stroke.size = pickerSize;
            changed = true;
        }
        if (changed) {
            api.updateTextStroke(_pdfSelectedText.index,
                _pdfSelectedText.stroke.text,
                _pdfSelectedText.stroke.size,
                _pdfSelectedText.stroke.color);
            api.drawTextSelection(_pdfSelectedText.index);
        }
    }, 100);
}

function _pdfAnnotDeselect() {
    if (_pdfSelectColorInterval) { clearInterval(_pdfSelectColorInterval); _pdfSelectColorInterval = null; }
    if (_pdfSelectedText) {
        const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
        if (api && api.redrawAnnotations) api.redrawAnnotations();
    }
    _pdfSelectedText = null;
}

function _pdfAnnotRightClick(e) {
    e.preventDefault();
    _pdfAnnotSelectText(e);
}

// Affiche un éditeur de texte inline positionné à (clientX, clientY)
function _showPdfInlineTextEditor({ clientX, clientY, color, size, fontSizePx, initialText = '', onValidate }) {
    // Fermer un éditeur déjà ouvert sans valider
    const existing = document.getElementById('_pdf-inline-text-editor-wrap');
    if (existing) existing.remove();

    // Taille courante (modifiable via +/-)
    let currentSize = size;
    let currentFontPx = fontSizePx;

    // Wrapper positionné à l'endroit du clic
    const wrap = document.createElement('div');
    wrap.id = '_pdf-inline-text-editor-wrap';
    wrap.style.cssText = `
        position: fixed;
        left: ${clientX}px;
        top: ${clientY - fontSizePx - 28}px;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        gap: 2px;
        filter: drop-shadow(0 2px 8px rgba(0,0,0,0.22));
    `;

    // Bandeau taille
    const toolbar = document.createElement('div');
    toolbar.style.cssText = `
        display: flex; align-items: center; gap: 4px;
        background: rgba(40,40,40,0.92); border-radius: 5px;
        padding: 2px 6px; width: fit-content;
        user-select: none;
    `;
    const btnMinus = document.createElement('button');
    btnMinus.textContent = '−';
    btnMinus.style.cssText = 'background:transparent;border:none;color:#fff;font-size:14px;cursor:pointer;padding:0 3px;line-height:1;';
    const sizeLabel = document.createElement('span');
    sizeLabel.style.cssText = 'color:#fff;font-size:11px;min-width:22px;text-align:center;';
    sizeLabel.textContent = currentSize;
    const btnPlus = document.createElement('button');
    btnPlus.textContent = '+';
    btnPlus.style.cssText = 'background:transparent;border:none;color:#fff;font-size:14px;cursor:pointer;padding:0 3px;line-height:1;';
    toolbar.append(btnMinus, sizeLabel, btnPlus);

    // Zone de texte
    const editor = document.createElement('div');
    editor.id = '_pdf-inline-text-editor';
    editor.contentEditable = 'true';
    editor.spellcheck = false;
    editor.style.cssText = `
        min-width: 80px;
        max-width: 500px;
        padding: 2px 5px;
        font-size: ${fontSizePx}px;
        font-family: 'Segoe UI', sans-serif;
        color: ${color};
        background: rgba(255,255,255,0.92);
        border: 1.5px dashed ${color};
        border-radius: 3px;
        outline: none;
        white-space: pre;
        cursor: text;
        line-height: 1.3;
    `;

    wrap.append(toolbar, editor);

    // Mise à jour de la taille
    function updateSize(delta) {
        currentSize = Math.max(1, Math.min(40, currentSize + delta));
        // Recalculer fontSizePx à partir de la même formule que drawStroke
        const canvas = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI && _pdfAnnotWidget._pdfAnnotAPI.getAnnotCanvas();
        const rect = canvas ? canvas.getBoundingClientRect() : { width: 600 };
        currentFontPx = Math.round((currentSize + 8) * rect.width / 600);
        editor.style.fontSize = currentFontPx + 'px';
        sizeLabel.textContent = currentSize;
    }
    btnMinus.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); ev.preventDefault(); updateSize(-1); editor.focus(); });
    btnPlus.addEventListener('pointerdown',  (ev) => { ev.stopPropagation(); ev.preventDefault(); updateSize(+1); editor.focus(); });

    // Synchronisation couleur depuis le color picker (window._drawColor)
    let currentColor = color;
    let lastPickerColor = _pdfAnnotGetColor(); // valeur picker au moment de l'ouverture
    const colorInterval = setInterval(() => {
        const pickerColor = _pdfAnnotGetColor();
        if (pickerColor && pickerColor !== lastPickerColor) {
            lastPickerColor = pickerColor;
            currentColor = pickerColor;
            editor.style.color = currentColor;
            editor.style.borderColor = currentColor;
            editor.focus();
        }
    }, 100);

    let validated = false;
    function validate() {
        if (validated) return;
        validated = true;
        clearInterval(colorInterval);
        const text = editor.innerText;
        wrap.remove();
        document.removeEventListener('pointerdown', onOutsideClick, true);
        onValidate(text, currentSize, currentColor);
    }
    function cancel() {
        if (validated) return;
        validated = true;
        clearInterval(colorInterval);
        wrap.remove();
        document.removeEventListener('pointerdown', onOutsideClick, true);
    }

    editor.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' && !ev.shiftKey) { ev.preventDefault(); validate(); }
        if (ev.key === 'Escape') cancel();
        ev.stopPropagation();
    });

    function onOutsideClick(ev) {
        if (wrap.contains(ev.target)) return;
        // Ne pas fermer si on clique sur le color picker draw
        const cpick = document.getElementById('cpick-draw-color');
        const cpickPop = document.getElementById('cpick-pop-draw-color');
        if ((cpick && cpick.contains(ev.target)) || (cpickPop && cpickPop.contains(ev.target))) return;
        document.removeEventListener('pointerdown', onOutsideClick, true);
        ev.stopPropagation();
        ev.preventDefault();
        validate();
    }
    setTimeout(() => {
        document.addEventListener('pointerdown', onOutsideClick, true);
    }, 300);

    wrap.addEventListener('pointerdown', (ev) => {
        if (ev.target !== btnMinus && ev.target !== btnPlus) ev.stopPropagation();
    });

    document.body.appendChild(wrap);
    if (initialText) editor.innerText = initialText;

    requestAnimationFrame(() => {
        editor.focus();
        const range = document.createRange();
        range.selectNodeContents(editor);
        range.collapse(false);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
    });
}

// ── Gestionnaires d'événements ────────────────────────────────────────────

function _pdfAnnotMouseDown(e)  {
    if (e.button !== 0) return;
    if (e.target.closest && e.target.closest('button')) return;
    // En mode texte, empêcher le mousedown de voler le focus à l'éditeur inline
    if (_pdfAnnotEffectiveTool() === 'text') e.preventDefault();
    _pdfAnnotStartStroke(e);
}
function _pdfAnnotContextMenu(e) {
    // En mode texte, le clic droit ne fait rien (sélection se fait au clic gauche)
    e.preventDefault();
}
function _pdfAnnotMouseMove(e)  {
    _pdfAnnotContinueStroke(e);
    // Prévisualisation du cercle gomme — toujours après le dessin/effacement
    if (_pdfAnnotMode && isEraserMode) {
        const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
        if (api) {
            const pos = _getPdfAnnotPos(e);
            const r = parseInt(document.getElementById('eraser-size').value) || 20;
            api.previewEraser(pos.x, pos.y, r);
        }
    }
    // Curseur adaptatif en mode texte : grab sur texte existant, text sinon
    if (!_pdfAnnotPainting && _pdfAnnotEffectiveTool() === 'text' && _pdfAnnotEvTarget) {
        const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
        if (api && api.findTextStrokeAt) {
            const pos = _getPdfAnnotPos(e);
            const found = api.findTextStrokeAt(pos.x, pos.y);
            _pdfAnnotEvTarget.style.setProperty('cursor', found ? 'grab' : 'text', 'important');
        }
    }
}
function _pdfAnnotMouseUp(e)    { _pdfAnnotEndStroke(e); }
function _pdfAnnotMouseLeave(e) {
    // Effacer le cercle gomme preview en redessinant les annotations
    if (_pdfAnnotMode && isEraserMode) {
        const api = _pdfAnnotWidget && _pdfAnnotWidget._pdfAnnotAPI;
        if (api && api.redrawAnnotations) api.redrawAnnotations();
    }
    // Remettre le curseur du mode courant
    if (_pdfAnnotEvTarget) {
        _pdfAnnotEvTarget.style.setProperty('cursor', _pdfCursor(_pdfAnnotEffectiveTool()), 'important');
    }
    _pdfAnnotEndStroke(e);
}

function _pdfAnnotTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) _pdfAnnotStartStroke(e.touches[0]);
}
function _pdfAnnotTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1) _pdfAnnotContinueStroke(e.touches[0]);
}
function _pdfAnnotTouchEnd(e) {
    if (e.changedTouches && e.changedTouches[0]) _pdfAnnotEndStroke(e.changedTouches[0]);
    else _pdfAnnotEndStroke(null);
}

// ── Intégration avec stopDrawing ──────────────────────────────────────────
// Quand on ferme la draw-toolbar, on coupe aussi le mode annotation PDF

const _origStopDrawing = stopDrawing;
stopDrawing = function() {
    _origStopDrawing();
    if (_pdfAnnotMode) _stopPdfAnnotMode();
};

// En mode annotation PDF, le bouton ↩ de la toolbar doit annuler
// uniquement la dernière annotation (pas un snapshot global du board)
const _origUndoAction = undoAction;
undoAction = function() {
    if (_pdfAnnotMode) { pdfAnnotUndo(); return; }
    _origUndoAction();
};

const _origRedoAction = redoAction;
redoAction = function() {
    if (_pdfAnnotMode) { pdfAnnotRedo(); return; }
    _origRedoAction();
};

// ── Toast d'information ───────────────────────────────────────────────────

function _showPdfAnnotToast(msg) {
    let toast = document.getElementById('pdf-annot-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'pdf-annot-toast';
        toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1a3a20;color:#5ddd7e;border:1px solid #3dbb5e;border-radius:10px;padding:8px 18px;font-size:13px;font-weight:700;z-index:99999;pointer-events:none;transition:opacity .3s;white-space:nowrap;';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

