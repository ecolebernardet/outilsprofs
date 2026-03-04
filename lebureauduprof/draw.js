// =========================================================================
// DESSIN LIBRE
// =========================================================================
var drawCanvas = null, drawCtx = null, isPainting = false, isDrawMode = false;
var strokes = [], currentStroke = null;

function initCanvas() {
    if (drawCanvas) return;
    drawCanvas = document.createElement('canvas');
    drawCanvas.id = 'draw-canvas';
    // pointer-events:none : le canvas ne bloque JAMAIS les clics sur toolbar/boutons
    drawCanvas.style.pointerEvents = 'none';
    resizeCanvas();
    board.appendChild(drawCanvas);
    drawCtx = drawCanvas.getContext('2d');
    // Les événements sont captés sur le board (pas le canvas)
    // pour que les éléments position:fixed restent toujours cliquables
    board.addEventListener('mousedown',  _boardDrawMouseDown);
    board.addEventListener('mousemove',  _boardDrawMouseMove);
    board.addEventListener('mouseup',    _boardDrawMouseUp);
    board.addEventListener('mouseleave', _boardDrawMouseLeave);
    board.addEventListener('touchstart', _boardDrawTouchStart, { passive:false });
    board.addEventListener('touchmove',  _boardDrawTouchMove,  { passive:false });
    board.addEventListener('touchend',   _boardDrawTouchEnd);
    document.getElementById('draw-size').addEventListener('input', function() {
        document.getElementById('draw-size-label').textContent = this.value;
    });
    const opSlider = document.getElementById('shape-recog-opacity');
    if (opSlider) opSlider.addEventListener('input', function() {
        document.getElementById('shape-recog-opacity-val').textContent = this.value + '%';
    });
}

function resizeCanvas() {
    if (!drawCanvas) return;
    drawCanvas.width = board.offsetWidth; drawCanvas.height = board.offsetHeight;
    redrawStrokes();
}

function getPos(e) {
    const rect = board.getBoundingClientRect();
    const clientX = (e.touches && e.touches[0]) ? e.touches[0].clientX : e.clientX;
    const clientY = (e.touches && e.touches[0]) ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
}

// Proxy board → dessin/gomme (le canvas a pointer-events:none)
function _boardDrawMouseDown(e)  {
    if (isDrawMode)   { startPaint(e); return; }
    if (isEraserMode) { startErase(e); return; }
}
function _boardDrawMouseMove(e)  {
    if (isDrawMode)   { paint(e);            return; }
    if (isEraserMode) { onEraserMouseMove(e); return; }
}
function _boardDrawMouseUp()    { if (isDrawMode) endPaint(); else if (isEraserMode) endErase(); }
function _boardDrawMouseLeave() { if (isDrawMode) endPaint(); else if (isEraserMode) { endErase(); redrawStrokes(); } }
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
function _boardDrawTouchEnd() { if (isEraserMode) endErase(); else endPaint(); }

function startPaint(e) {
    if (!isDrawMode || isEraserMode) return;
    isPainting = true;
    currentStroke = { points:[getPos(e)], color:(cpickGetValue('draw-color') || document.getElementById('cpick-native-draw-color')?.value || '#e84393'), size:parseInt(document.getElementById('draw-size').value) };
    if (currentDrawMode === 'shape') _lastStrokePoints = [...currentStroke.points];
    if (currentDrawMode === 'text') {
        // Annuler le timer de reconnaissance en cours
        clearTimeout(_hwRecogTimer);
    }
}

function paint(e) {
    if (!isPainting || !isDrawMode || isEraserMode || !currentStroke) return;
    currentStroke.points.push(getPos(e));
    if (currentDrawMode === 'shape') _lastStrokePoints = [...currentStroke.points];
    redrawStrokes(currentStroke);
}

function endPaint() {
    if (!isPainting || !currentStroke) return;
    isPainting = false;
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
        saveBoard();
    }
    currentStroke = null; redrawStrokes();
}

var _lastStrokePoints = null;

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
        header.addEventListener('mousedown', (e) => {
            e.preventDefault();
            let ox = e.clientX - preview.offsetLeft;
            let oy = e.clientY - preview.offsetTop;
            const onMove = (ev) => {
                preview.style.left = Math.max(0, ev.clientX - ox) + 'px';
                preview.style.top  = Math.max(0, ev.clientY - oy) + 'px';
            };
            const onUp = () => {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
            };
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
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

function redrawStrokes(extra = null) {
    if (!drawCtx) return;
    drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
    strokes.forEach(s => drawStroke(s));
    if (extra) drawStroke(extra);
    selectedStrokes.forEach(s => drawStroke(s, true));
}

function drawStroke(stroke, highlight = false) {
    if (!stroke.points || stroke.points.length < 2) return;
    drawCtx.save();
    drawCtx.beginPath(); drawCtx.lineCap = 'round'; drawCtx.lineJoin = 'round';
    drawCtx.strokeStyle = highlight ? '#4a90e2' : stroke.color;
    drawCtx.lineWidth   = highlight ? stroke.size + 6 : stroke.size;
    if (highlight) drawCtx.globalAlpha = 0.5;
    drawCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points.forEach(p => drawCtx.lineTo(p.x, p.y));
    drawCtx.stroke(); drawCtx.restore();
    if (highlight) {
        drawCtx.save(); drawCtx.beginPath(); drawCtx.lineCap = 'round'; drawCtx.lineJoin = 'round';
        drawCtx.strokeStyle = stroke.color; drawCtx.lineWidth = stroke.size;
        drawCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
        stroke.points.forEach(p => drawCtx.lineTo(p.x, p.y));
        drawCtx.stroke(); drawCtx.restore();
    }
}

// =========================================================================
// MODES DESSIN
// =========================================================================
var currentDrawMode = 'free'; // 'free' | 'shape' | 'text'

function setDrawMode(mode) {
    currentDrawMode = mode;
    ['free','shape'].forEach(m => {
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
}

function toggleDrawToolbar() {
    const tb = document.getElementById('draw-toolbar');
    if (isDrawMode) { stopDrawing(); return; }
    stopEraserMode();
    if (typeof stopShapeToolbar === 'function') stopShapeToolbar();
    initCanvas(); enableDrawing();
    setDrawMode('free');
    if (tb) tb.style.display = 'block';
}
function enableDrawing() {
    isDrawMode = true;
    if (drawCanvas) drawCanvas.classList.remove('inactive');
    board.classList.add('is-drawing');
    clearSelection();
}
function stopDrawing() {
    isDrawMode = false;
    if (drawCanvas) drawCanvas.classList.add('inactive');
    board.classList.remove('is-drawing');
    const tb = document.getElementById('draw-toolbar');
    if (tb) tb.style.display = 'none';
    cancelHandwritingRecognition();
}
function clearCanvas() {
    snapshotNow();
    strokes = []; selectedStrokes = []; redrawStrokes();
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
    stopDrawing();
    document.getElementById('global-toolbar').style.display = 'none';
    isEraserMode = true;
    initCanvas();
    drawCanvas.classList.remove('inactive');
    drawCanvas.classList.add('eraser-mode');
    board.classList.add('is-erasing');
    // Les événements sont gérés par les listeners du board (_boardDraw*)
    clearSelection();
    if (typeof _updateEraserBtnInPanel === 'function') _updateEraserBtnInPanel();
}

function stopEraserMode() {
    if (!isEraserMode) return;
    isEraserMode = false; isErasing = false;
    if (drawCanvas) {
        drawCanvas.classList.add('inactive');
        drawCanvas.classList.remove('eraser-mode');
        board.classList.remove('is-erasing');
        // Les listeners sont sur le board, pas sur le canvas
        redrawStrokes();
    }
    if (typeof _updateEraserBtnInPanel === 'function') _updateEraserBtnInPanel();
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
    const newStrokes = [];
    strokes.forEach(stroke => {
        const pts = stroke.points;
        let current = [];
        for (let i = 0; i < pts.length; i++) {
            if (Math.hypot(pts[i].x - pos.x, pts[i].y - pos.y) <= r) {
                if (current.length >= 2) newStrokes.push({ ...stroke, points: current });
                current = [];
            } else { current.push(pts[i]); }
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
}

function onBoardMouseDown(e) {
    if (document.body.classList.contains('presentation-mode')) return;
    if (isDrawMode || isEraserMode) return;
    if (e.target.closest('#selection-controls')) return;
    if (e.target.closest('#toolbar-container')) return;
    if (e.target.closest('.widget-ctx-menu')) return;
    if (e.target.closest('#shape-edit-panel')) return;

    // Fermer le menu widgets si ouvert
    document.getElementById('tools-menu')?.classList.remove('active');

    mouseDownClientX = e.clientX;
    mouseDownClientY = e.clientY;

    const widget = e.target.closest('.widget, .shape-widget');

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
			document.removeEventListener('mousemove', onStrokeDragMove);
			document.removeEventListener('mouseup', onStrokeDragEnd);
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

		document.addEventListener('mousemove', onStrokeDragMove);
		document.addEventListener('mouseup', onStrokeDragEnd);
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
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
        if (!isSelectingRect) return;
        isSelectingRect = false;

        const dx = Math.abs(ev.clientX - mouseDownClientX);
        const dy = Math.abs(ev.clientY - mouseDownClientY);

        if (dx < 5 && dy < 5) {
            clearSelection();
            return;
        }

        const pos2 = getBoardPos(ev);
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

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
}

function clearSelection() {
    selectedWidgets.forEach(w => w.classList.remove('selected'));
    selectedWidgets = []; selectedStrokes = [];
    if (drawCtx) redrawStrokes();
    document.getElementById('selection-controls').style.display = 'none';
    if (selectionRect) selectionRect.style.display = 'none';
    board.classList.remove('single-select');
    board.classList.remove('multi-select');
}

