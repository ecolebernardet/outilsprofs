// =========================================================================
// FORMES GÉOMÉTRIQUES
// =========================================================================
var SHAPES = [
    { id: 'circle',        label: 'Cercle',         svg: (w,h,sw,f,o) => `<ellipse cx="${w/2}" cy="${h/2}" rx="${w/2-sw/2}" ry="${h/2-sw/2}" stroke="${sw}" stroke-width="${sw}" fill="${f}" fill-opacity="${o}"/>` },
    { id: 'square',        label: 'Carré',           svg: (w,h,sw,f,o) => `<rect x="${sw/2}" y="${sw/2}" width="${w-sw}" height="${h-sw}" stroke="${sw}" stroke-width="${sw}" fill="${f}" fill-opacity="${o}"/>` },
    { id: 'rectangle',     label: 'Rectangle',       svg: (w,h,sw,f,o) => `<rect x="${sw/2}" y="${sw/2}" width="${w-sw}" height="${h-sw}" stroke="${sw}" stroke-width="${sw}" fill="${f}" fill-opacity="${o}"/>` },
    { id: 'diamond',       label: 'Losange',         svg: (w,h,sw,f,o) => `<polygon points="${w/2},${sw} ${w-sw},${h/2} ${w/2},${h-sw} ${sw},${h/2}" stroke="${sw}" stroke-width="${sw}" stroke-linejoin="round" fill="${f}" fill-opacity="${o}"/>` },
    { id: 'parallelogram', label: 'Parallélogramme', svg: (w,h,sw,f,o) => `<polygon points="${w*0.25},${sw} ${w-sw},${sw} ${w*0.75},${h-sw} ${sw},${h-sw}" stroke="${sw}" stroke-width="${sw}" stroke-linejoin="round" fill="${f}" fill-opacity="${o}"/>` },
    { id: 'line',          label: 'Ligne',           svg: (w,h,sw,f,o) => `<line x1="${sw}" y1="${h/2}" x2="${w-sw}" y2="${h/2}" stroke="STROKECOLOR" stroke-width="${sw}" stroke-linecap="round"/>` },
    { id: 'arrow',         label: 'Flèche',          svg: (w,h,sw,f,o) => `<polygon points="${sw},${h*0.35} ${w*0.6},${h*0.35} ${w*0.6},${sw} ${w-sw},${h/2} ${w*0.6},${h-sw} ${w*0.6},${h*0.65} ${sw},${h*0.65}" stroke="${sw}" stroke-width="${sw}" stroke-linejoin="round" fill="${f}" fill-opacity="${o}"/>` },
    { id: 'triangle',      label: 'Triangle',        svg: (w,h,sw,f,o) => `<polygon points="${w/2},${sw} ${w-sw},${h-sw} ${sw},${h-sw}" stroke="${sw}" stroke-width="${sw}" stroke-linejoin="round" fill="${f}" fill-opacity="${o}"/>` },
];

var selectedShapeId = 'circle';

function buildShapeSVG(shapeId, w, h, strokeColor, fillColor, fillOpacity, strokeWidth) {
    const sw = (strokeWidth != null && strokeWidth !== "") ? strokeWidth : 4;
    if (sw === 0) strokeColor = 'none';
    const shape = SHAPES.find(s => s.id === shapeId);
    if (!shape) return '';
    let raw = shape.svg(w, h, sw, fillColor, fillOpacity);
    raw = raw.replace(/stroke="(\d+(?:\.\d+)?)"/g, `stroke="${strokeColor}"`);
    raw = raw.replace(/stroke="STROKECOLOR"/g, `stroke="${strokeColor}"`);
    return raw;
}

function initShapeToolbar() {
    const grid = document.getElementById('shape-grid');
    if (!grid) return;
    if (grid.children.length > 0) return; // déjà initialisé
    SHAPES.forEach(s => {
        const btn = document.createElement('div');
        btn.className = 'shape-choice' + (s.id === selectedShapeId ? ' active' : '');
        btn.dataset.id = s.id;
        btn.title = s.label;
        const previewSVG = `<svg width="36" height="36" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">${buildShapeSVG(s.id, 40, 40, '#ffffff', '#ffffff', 0.5)}</svg>`;
        btn.innerHTML = previewSVG + `<span class="shape-choice-label">${s.label}</span>`;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.shape-choice').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedShapeId = s.id;
            addShapeWidget();
        });
        grid.appendChild(btn);
    });
    document.getElementById('shape-opacity-slider').addEventListener('input', function() {
        document.getElementById('shape-opacity-val').textContent = this.value + '%';
    });
    document.getElementById('shape-stroke-width').addEventListener('input', function() {
        document.getElementById('shape-stroke-width-val').textContent = this.value;
    });
}

var editingShapeWidget = null;

function openShapeEditPanel(widget) {
    editingShapeWidget = widget;
    const panel = document.getElementById('shape-edit-panel');
    document.getElementById('edit-stroke-color').value = widget.dataset.strokeColor || '#2c3e50';
    document.getElementById('edit-fill-color').value   = widget.dataset.fillColor   || '#4a90e2';
    const opPct = Math.round(parseFloat(widget.dataset.fillOpacity || 0.6) * 100);
    document.getElementById('edit-fill-opacity').value = opPct;
    document.getElementById('edit-fill-opacity-val').textContent = opPct + '%';
    const sw = widget.dataset.strokeWidth != null ? parseInt(widget.dataset.strokeWidth) : 4;
    document.getElementById('edit-stroke-width').value = sw;
    document.getElementById('edit-stroke-width-val').textContent = sw + 'px';
    const br = widget.getBoundingClientRect();
    panel.style.left = Math.min(br.right + 10, window.innerWidth - 320) + 'px';
    panel.style.top  = Math.max(10, br.top) + 'px';
    panel.style.display = 'block';
}

function closeShapeEditPanel() {
    const panel = document.getElementById('shape-edit-panel');
    if (panel) panel.style.display = 'none';
    editingShapeWidget = null;
}

function applyShapeEdit() {
    if (!editingShapeWidget) return;
    const sc = document.getElementById('edit-stroke-color').value;
    const fc = document.getElementById('edit-fill-color').value;
    const fo = parseFloat(document.getElementById('edit-fill-opacity').value) / 100;
    const sw = parseInt(document.getElementById('edit-stroke-width').value);
    const svg = editingShapeWidget.querySelector('svg');
    if (!svg) return;
    const w = parseFloat(svg.getAttribute('width'));
    const h = parseFloat(svg.getAttribute('height'));
    editingShapeWidget.dataset.strokeColor = sc;
    editingShapeWidget.dataset.fillColor   = fc;
    editingShapeWidget.dataset.fillOpacity = fo;
    editingShapeWidget.dataset.strokeWidth = sw;
    svg.innerHTML = buildShapeSVG(editingShapeWidget.dataset.shapeType, w, h, sc, fc, fo, sw);
    saveBoard();
}

function cloneShapeWidget(widget) {
    snapshotNow();
    const svg = widget.querySelector('svg');
    const sw = parseFloat(svg.getAttribute('width') || 150);
    const sh = parseFloat(svg.getAttribute('height') || 150);
    const newW = createShapeWidget(
        widget.dataset.shapeType, widget.dataset.strokeColor, widget.dataset.fillColor,
        parseFloat(widget.dataset.fillOpacity), sw, sh,
        (widget.offsetLeft + 30) + 'px', (widget.offsetTop + 30) + 'px', true,
        widget.dataset.strokeWidth != null ? parseInt(widget.dataset.strokeWidth) : 4
    );
    const rot = getCurrentRotation(widget);
    if (rot) newW.style.transform = `rotate(${rot}deg)`;
}

function toggleShapeToolbar() {
    const tb = document.getElementById('shape-toolbar');
    if (tb && tb.style.display === 'block') { stopShapeToolbar(); return; }
    if (typeof stopDrawing    === 'function') stopDrawing();
    if (typeof stopEraserMode === 'function') stopEraserMode();
    if (tb) { tb.style.display = 'block'; initShapeToolbar(); }
}

function stopShapeToolbar() {
    const tb = document.getElementById('shape-toolbar');
    if (tb) tb.style.display = 'none';
    if (typeof stopEraserMode === 'function') stopEraserMode();
}

function addShapeWidget() {
    const strokeColor = cpickGetValue('shape-stroke-color') || '#2c3e50';
    const fillColor   = cpickGetValue('shape-fill-color') || '#4a90e2';
    const fillOpacity = parseFloat(document.getElementById('shape-opacity-slider').value) / 100;
    const strokeWidth = parseInt(document.getElementById('shape-stroke-width').value);
    snapshotNow();
    const p = findFreePosition();
    const isLine = (selectedShapeId === 'line');
    const defaultW = isLine ? Math.min(window.innerWidth * 0.18, 280) : Math.min(window.innerWidth * 0.12, 180);
    const defaultH = isLine ? 20 : defaultW;
    createShapeWidget(selectedShapeId, strokeColor, fillColor, fillOpacity, defaultW, defaultH, p.x + 'px', p.y + 'px', true, strokeWidth);
    document.getElementById('shape-toolbar').classList.remove('active');
    document.getElementById('shape-btn').classList.remove('active-tool');
}

function createShapeWidget(shapeId, strokeColor, fillColor, fillOpacity, svgW, svgH, x, y, doSave = true, strokeWidth = 4) {
    const widget = document.createElement('div');
    widget.className = 'shape-widget';
    widget.dataset.shapeType   = shapeId;
    widget.dataset.strokeColor = strokeColor;
    widget.dataset.fillColor   = fillColor;
    widget.dataset.fillOpacity = fillOpacity;
    widget.dataset.strokeWidth = strokeWidth;
    widget.style.left = x; widget.style.top = y;
    widget.tabIndex = 0;
    widgetZCounter++;
    widget.style.zIndex = widgetZCounter;

    const svgContent = buildShapeSVG(shapeId, svgW, svgH, strokeColor, fillColor, fillOpacity, strokeWidth);

    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-pin-handle" onclick="togglePin(this.closest('.widget, .shape-widget'))" title="Épingler">📌</div>
        <div class="widget-back-handle" onclick="sendToBack(this.closest('.widget, .shape-widget'))" title="Envoyer derrière">🔽</div>
        <div class="widget-menu-handle" onclick="toggleCtxMenu(this)" title="Menu">☰</div>
        <div class="widget-close-handle" onclick="snapshotNow();closeCtxMenuAll();this.closest('.shape-widget').remove();saveBoard();" title="Fermer">×</div>
        <div class="widget-ctx-menu"></div>
        <div class="shape-svg-wrap">
            <svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="overflow:visible;">${svgContent}</svg>
        </div>
        <div class="flip-h-btn" title="Symétrie horizontale">↔</div>
        <div class="flip-v-btn" title="Symétrie verticale">↕</div>
        <div class="resize-lock-btn" title="Verrouiller les proportions (ou Shift)">🔓</div>
        <div class="shape-resize-handle" title="Redimensionner"></div>
    `;

    board.appendChild(widget);
		widget.addEventListener('contextmenu', (e) => {
		e.preventDefault();
		e.stopPropagation();
		snapshotNow();
		widget.remove();
		saveBoard();
	});
    makeDraggable(widget);
    makeDraggableRotate(widget);
    makeShapeResizable(widget);

    widget.addEventListener('mousedown', (e) => {
        if (isDrawMode || isEraserMode) return;
        if (widget.dataset.background !== "true") bringToFront(widget);
    });
    widget.addEventListener('dblclick', (e) => {
        const ignore = '.drag-handle,.widget-close-handle,.widget-pin-handle,.widget-back-handle,.widget-rotate-handle,.widget-menu-handle,.widget-ctx-menu,.shape-resize-handle';
        if (!e.target.closest(ignore)) openShapeEditPanel(widget);
    });

    const curW = window.innerWidth, curVH = virtualH(curW);
    widget.dataset.leftPercent = (parseFloat(x) / curW) * 100;
    widget.dataset.topPercent  = (parseFloat(y) / curVH) * 100;
    widget.dataset.wPercent    = (svgW / curW) * 100;
    widget.dataset.hPercent    = (svgH / curVH) * 100;

    if (doSave && !isInitialLoading && !isRestoringState) saveBoard();
    return widget;
}

function makeShapeResizable(widget) {
    const handle  = widget.querySelector('.shape-resize-handle');
    const lockBtn = widget.querySelector('.resize-lock-btn');
    const flipH   = widget.querySelector('.flip-h-btn');
    const flipV   = widget.querySelector('.flip-v-btn');
    if (!handle) return;

    if (lockBtn) {
        lockBtn.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); });
        lockBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const locked = lockBtn.classList.toggle('locked');
            lockBtn.textContent = locked ? '🔒' : '🔓';
        });
    }
    if (flipH) {
        flipH.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
        flipH.addEventListener('click', e => { e.stopPropagation(); snapshotNow(); flipWidget(widget, 'h'); });
    }
    if (flipV) {
        flipV.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
        flipV.addEventListener('click', e => { e.stopPropagation(); snapshotNow(); flipWidget(widget, 'v'); });
    }

    handle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        snapshotNow();
        const svg = widget.querySelector('svg');
        const startX = e.clientX, startY = e.clientY;
        const startW = parseFloat(svg.getAttribute('width'));
        const startH = parseFloat(svg.getAttribute('height'));
        const ratio = startH / startW;
        const shapeId = widget.dataset.shapeType;
        const sc = widget.dataset.strokeColor, fc = widget.dataset.fillColor;
        const fo = widget.dataset.fillOpacity, sw = widget.dataset.strokeWidth != null ? parseInt(widget.dataset.strokeWidth) : 4;
        document.onmousemove = (ev) => {
            const proportional = ev.shiftKey || (lockBtn && lockBtn.classList.contains('locked'));
            const rawW = Math.max(40, startW + ev.clientX - startX);
            const rawH = Math.max(40, startH + ev.clientY - startY);
            let newW, newH;
            if (proportional) {
                newW = rawW;
                newH = Math.max(40, newW * ratio);
            } else {
                newW = rawW; newH = rawH;
            }
            svg.setAttribute('width', newW); svg.setAttribute('height', newH);
            svg.setAttribute('viewBox', `0 0 ${newW} ${newH}`);
            svg.innerHTML = buildShapeSVG(shapeId, newW, newH, sc, fc, fo, sw);
            const curW = window.innerWidth, curVH = virtualH(curW);
            widget.dataset.wPercent = (newW / curW) * 100;
            widget.dataset.hPercent = (newH / curVH) * 100;
        };
        document.onmouseup = () => { document.onmousemove = null; saveBoard(); };
    });
}

// Applique une symétrie à un widget forme ou texte
// axis : 'h' (retournement gauche/droite) ou 'v' (retournement haut/bas)
function flipWidget(widget, axis) {
    // Extraire la rotation existante (rotation seule sur le widget)
    const rotMatch = (widget.style.transform || '').match(/rotate\(([-\d.]+)deg\)/);
    const rot = rotMatch ? parseFloat(rotMatch[1]) : 0;

    // Mettre à jour les données de flip
    let sx = parseFloat(widget.dataset.flipX || 1);
    let sy = parseFloat(widget.dataset.flipY || 1);
    if (axis === 'h') sx = -sx;
    if (axis === 'v') sy = -sy;
    widget.dataset.flipX = sx;
    widget.dataset.flipY = sy;

    // Le widget ne porte QUE la rotation — les boutons restent à leur place
    widget.style.transform = rot !== 0 ? `rotate(${rot}deg)` : '';

    // Le flip est appliqué sur le SVG uniquement via CSS (transform-origin: center)
    const svg = widget.querySelector('svg');
    if (svg) {
        svg.style.transformBox    = 'fill-box';
        svg.style.transformOrigin = 'center center';
        svg.style.transform       = (sx !== 1 || sy !== 1) ? `scale(${sx}, ${sy})` : '';
        svg.removeAttribute('transform'); // nettoyer l'ancien attribut SVG si présent
    } else {
        // Widget texte : flip sur le container interne
        const container = widget.querySelector('.editor-container');
        if (container) {
            container.style.transformBox    = 'border-box';
            container.style.transformOrigin = 'center center';
            container.style.transform       = (sx !== 1 || sy !== 1) ? `scale(${sx}, ${sy})` : '';
        }
    }
    saveBoard();
}

// Applique une symétrie aux traits canvas sélectionnés
// axis : 'h' ou 'v' — miroir autour du centre de leur bounding box
function flipStrokes(strokesList, axis) {
    if (!strokesList.length) return;
    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    strokesList.forEach(s => s.points.forEach(p => {
        if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
    }));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    strokesList.forEach(s => {
        s.points = s.points.map(p => ({
            x: axis === 'h' ? 2 * cx - p.x : p.x,
            y: axis === 'v' ? 2 * cy - p.y : p.y
        }));
    });
    if (drawCtx) redrawStrokes();
}

// =========================================================================
