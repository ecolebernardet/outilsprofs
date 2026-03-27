// =========================================================================
// MEDIA WIDGETS — Le Bureau du Prof
// PDF (via PDF.js), Fenêtre Web (iframe), YouTube
// =========================================================================

// Templates HTML : voir index.html (template-iframe, template-youtube, template-pdf)

// =========================================================================
// PDF WIDGET (rendu via PDF.js — pas d'iframe, pas d'ouverture navigateur)
// =========================================================================

// PDF WIDGET (rendu via PDF.js — pas d'iframe, pas d'ouverture navigateur)
// =========================================================================

// Charger PDF.js depuis CDN si pas encore chargé
function _ensurePdfJs(cb) {
    if (window.pdfjsLib) { cb(); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        cb();
    };
    document.head.appendChild(s);
}

// ── Support stylet VPI pour les boutons : ajoute pointerup pen en plus du click ──
// À appeler sur tout bouton qui n'a que onclick (toolbar wf-btn, onglets PDF, etc.)
function _addPenClick(el, fn) {
    if (!el || el._penClickAttached) return;
    el._penClickAttached = true;
    el.addEventListener('pointerup', (e) => {
        if (e.pointerType !== 'pen' && e.pointerType !== 'touch') return;
        if (el._penClickBusy) return; // anti-double
        el._penClickBusy = true;
        setTimeout(() => el._penClickBusy = false, 300);
        e.preventDefault();
        e.stopPropagation();
        fn(e);
    });
    // Feedback visuel immédiat au pointerdown (le :active CSS ne se déclenche pas toujours avec stylet)
    el.addEventListener('pointerdown', (e) => {
        if (e.pointerType !== 'pen' && e.pointerType !== 'touch') return;
        el.style.transform = 'scale(0.92)';
        el.style.filter    = 'brightness(0.82)';
    });
    el.addEventListener('pointerleave', () => {
        el.style.transform = '';
        el.style.filter    = '';
    });
    el.addEventListener('pointerup', () => {
        el.style.transform = '';
        el.style.filter    = '';
    }, { capture: false });
}

// Attache _addPenClick à tous les wf-btn d'un container PDF (toolbar)
function _attachPenSupportToPdfToolbar(container) {
    if (!container) return;
    // wf-btn (min, max, close)
    container.querySelectorAll('.wf-btn').forEach(btn => {
        _addPenClick(btn, () => btn.click());
    });
    // Bouton annotation ✏️
    const annotBtn = container.querySelector('.pdf-annot-widget-btn');
    if (annotBtn) _addPenClick(annotBtn, () => annotBtn.click());
    // Bouton export 💾
    const exportBtn = container.querySelector('.pdf-export-btn');
    if (exportBtn) _addPenClick(exportBtn, () => exportBtn.click());
    // Boutons nav ◀ ▶ : gérés directement dans reattach() avec _penHandled, pas besoin de _addPenClick ici
    // Bouton "Ouvrir un PDF" label
    const openLabel = container.querySelector('.pdf-placeholder label');
    if (openLabel) _addPenClick(openLabel, () => openLabel.querySelector('input')?.click());
}

function loadPdfWidget(input) {
    const file = input.files[0]; if (!file) return;
    const widget = input.closest('.widget');
    const container = input.closest('.editor-container');
    const reader = new FileReader();
    reader.onload = function(e) {
        const base64 = e.target.result;
        if (!widget.dataset.pdfId) {
            widget.dataset.pdfId = 'pdf_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
        }
        const pdfId = widget.dataset.pdfId;
        widget.dataset.pdfName = file.name;
        _showPdfInWidget(container, base64, file.name);
        pdfStorage.set(pdfId, base64).then(() => saveBoard());
    };
    reader.readAsDataURL(file);
}

function _showPdfInWidget(container, base64OrUrl, filename) {
    const placeholder   = container.querySelector('.pdf-placeholder');
    const nameSpan      = container.querySelector('.pdf-filename');
    const canvasWrap    = container.querySelector('.pdf-canvas-wrap');
    const pdfCanvas     = container.querySelector('.pdf-canvas');
    const annotCanvas   = container.querySelector('.pdf-annot-canvas');
    const navBar        = container.querySelector('.pdf-nav');
    const zoomBar       = container.querySelector('.pdf-zoom-bar');

    if (placeholder) placeholder.style.display = 'none';
    if (canvasWrap)  canvasWrap.style.display = 'block';
    if (navBar)      navBar.style.display = 'flex';
    if (zoomBar)     zoomBar.style.display = 'flex';
    const zoomFitBtn = container.querySelector('.pdf-zoom-fit');
    if (zoomFitBtn)  zoomFitBtn.style.display = 'inline-flex';
    const exportBtn = container.querySelector('.pdf-export-btn');
    if (exportBtn)   exportBtn.style.display = 'inline-flex';
    const annotBtn = container.querySelector('.pdf-annot-widget-btn');
    if (annotBtn)    annotBtn.style.display = 'inline-flex';
    // Curseur main par défaut sur le conteneur (pas sur annotCanvas qui a pointer-events:none)
    if (canvasWrap)  canvasWrap.style.cursor = 'grab';
    if (nameSpan && filename) { nameSpan.textContent = filename; nameSpan.title = filename; }
    // Support stylet VPI sur tous les boutons de la toolbar PDF
    _attachPenSupportToPdfToolbar(container.closest('.editor-container') || container);

    // ── Drag-to-scroll natif (quand le mode annotation draw.js n'est pas actif) ──
    let _dragScrolling = false, _dragStartX = 0, _dragStartY = 0, _dragScrollLeft = 0, _dragScrollTop = 0;
    canvasWrap.addEventListener('mousedown', e => {
        if (window._pdfAnnotMode) return; // draw.js gère le pan
        if (e.button !== 0) return;
        _dragScrolling = true;
        _dragStartX = e.clientX;
        _dragStartY = e.clientY;
        _dragScrollLeft = canvasWrap.scrollLeft;
        _dragScrollTop  = canvasWrap.scrollTop;
        canvasWrap.style.cursor = 'grabbing';
        e.preventDefault();
    });
    canvasWrap.addEventListener('mousemove', e => {
        if (!_dragScrolling) return;
        canvasWrap.scrollLeft = _dragScrollLeft - (e.clientX - _dragStartX);
        canvasWrap.scrollTop  = _dragScrollTop  - (e.clientY - _dragStartY);
    });
    const _endDrag = () => {
        if (!_dragScrolling) return;
        _dragScrolling = false;
        canvasWrap.style.cursor = window._pdfAnnotMode ? '' : 'grab';
    };
    canvasWrap.addEventListener('mouseup',    _endDrag);
    canvasWrap.addEventListener('mouseleave', _endDrag);
    // Supprimer les boutons overlay si l'utilisateur scrolle (position désynchronisée)
    canvasWrap.addEventListener('scroll', () => {
        ['_annot-delete-btn','_annot-resize-btn','_annot-rotate-btn','_annot-lock-btn'].forEach(id => {
            const el = document.getElementById(id); if (el) el.remove();
        });
    });

    // ── Drag-to-scroll tactile (hors mode annotation) ──
    canvasWrap.addEventListener('touchstart', e => {
        if (window._pdfAnnotMode) return; // draw.js gère le pan en mode annotation
        if (e.touches.length !== 1) return;
        _dragScrolling = true;
        _dragStartX = e.touches[0].clientX;
        _dragStartY = e.touches[0].clientY;
        _dragScrollLeft = canvasWrap.scrollLeft;
        _dragScrollTop  = canvasWrap.scrollTop;
    }, { passive: true });
    canvasWrap.addEventListener('touchmove', e => {
        if (!_dragScrolling || window._pdfAnnotMode) return;
        if (e.touches.length !== 1) return;
        canvasWrap.scrollLeft = _dragScrollLeft - (e.touches[0].clientX - _dragStartX);
        canvasWrap.scrollTop  = _dragScrollTop  - (e.touches[0].clientY - _dragStartY);
        e.preventDefault();
    }, { passive: false });
    canvasWrap.addEventListener('touchend', _endDrag);
    canvasWrap.addEventListener('touchcancel', _endDrag);

    function base64ToUint8Array(b64) {
        const raw = atob(b64.split(',')[1]);
        const arr = new Uint8Array(raw.length);
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
        return arr;
    }

    _ensurePdfJs(() => {
        const data = base64ToUint8Array(base64OrUrl);
        pdfjsLib.getDocument({ data }).promise.then(pdfDoc => {

            // ── État ────────────────────────────────────────────────────────
            let currentPage = 1;
            const totalPages = pdfDoc.numPages;
            let zoomScale = null; // null = fit-to-width
            const ZOOM_STEP = 0.2, ZOOM_MIN = 0.3, ZOOM_MAX = 5;

            // Annotations : tableau de couches, une par page
            // Chaque couche = { strokes: [{tool,color,size,pts:[],text,x,y}], ...}
            const annotLayers = {};
            function getLayer(p) {
                if (!annotLayers[p]) annotLayers[p] = { strokes: [] };
                return annotLayers[p];
            }

            // ── Rendu PDF ────────────────────────────────────────────────────
            let renderTask = null;
            function fitScale(page) {
                const vp0 = page.getViewport({ scale: 1 });
                return (canvasWrap.clientWidth - 24) / vp0.width;
            }

            function renderPage(num) {
                pdfDoc.getPage(num).then(page => {
                    const scale = zoomScale ?? fitScale(page);
                    const dpr = window.devicePixelRatio || 1;
                    const viewport = page.getViewport({ scale: scale * dpr });
                    // Taille physique du canvas (haute résolution)
                    pdfCanvas.width  = viewport.width;
                    pdfCanvas.height = viewport.height;
                    // Taille CSS = taille logique (sans DPR) → rendu net sur écrans HiDPI
                    pdfCanvas.style.width  = (viewport.width  / dpr) + 'px';
                    pdfCanvas.style.height = (viewport.height / dpr) + 'px';
                    // Le canvas d'annotation garde la même taille logique (les coords sont normalisées)
                    annotCanvas.width  = viewport.width;
                    annotCanvas.height = viewport.height;
                    annotCanvas.style.width  = (viewport.width  / dpr) + 'px';
                    annotCanvas.style.height = (viewport.height / dpr) + 'px';

                    // Centrage : margin auto quand le canvas est plus petit que le wrap,
                    // margin:8px (pas de centrage) quand il déborde → scroll gauche/droite natif
                    const canvasCssW = viewport.width / dpr;
                    const marginVal = canvasCssW <= canvasWrap.clientWidth ? '8px auto' : '8px';
                    pdfCanvas.style.display = 'block';
                    pdfCanvas.style.margin  = marginVal;
                    // annotCanvas : positionné en absolute par rapport au canvasStack (position:relative)
                    // sa position doit suivre le pdfCanvas (qui peut être centré ou non)
                    annotCanvas.style.display  = 'block';
                    annotCanvas.style.position = 'absolute';
                    annotCanvas.style.top  = '0';
                    annotCanvas.style.left = '0';
                    annotCanvas.style.margin = '0';
                    // Synchroniser left de l'annotCanvas avec le margin-left du pdfCanvas après layout
                    requestAnimationFrame(() => {
                        annotCanvas.style.left = pdfCanvas.offsetLeft + 'px';
                        annotCanvas.style.top  = pdfCanvas.offsetTop  + 'px';
                    });

                    // Mettre à jour label zoom
                    const zoomLabel = container.querySelector('.pdf-zoom-label');
                    if (zoomLabel) zoomLabel.textContent = Math.round(scale * 100) + '%';

                    // Mettre à jour le menu déroulant
                    const pageInput2 = container.querySelector('.pdf-page-input');
                    if (pageInput2) pageInput2.value = num;
                    if (container._updatePageBtn) container._updatePageBtn(num);

                    const ctx = pdfCanvas.getContext('2d');
                    if (renderTask) renderTask.cancel();
                    renderTask = page.render({ canvasContext: ctx, viewport });
                    renderTask.promise.then(() => {
                        renderTask = null;
                        redrawAnnotations(num);
                    }).catch(() => {});
                });
            }

            // ── Annotations ───────────────────────────────────────────────
            // Les coordonnées sont stockées en espace NORMALISÉ (0-1 relatif au canvas à scale=1).
            // Au dessin, on les multiplie par la taille courante du canvas → elles suivent le zoom.
            const actx = annotCanvas.getContext('2d');
            let activeTool = 'pen';
            let isDrawing  = false;
            let currentStrokeAnnot = null;

            // Convertit un point canvas-pixels → normalisé [0-1]
            function toNorm(px, py) {
                return { x: px / annotCanvas.width, y: py / annotCanvas.height };
            }
            // Convertit normalisé → pixels courants du canvas
            function fromNorm(nx, ny) {
                return { x: nx * annotCanvas.width, y: ny * annotCanvas.height };
            }

            // Redessiner toutes les annotations de la page (avec le zoom courant)
            function redrawAnnotations(pageNum) {
                actx.clearRect(0, 0, annotCanvas.width, annotCanvas.height);
                // Supprimer tous les boutons overlay de figure s'ils existent
                _removeAnnotFigureHandles();
                const layer = getLayer(pageNum);
                // Restaurer le snapshot s'il existe (après effacement)
                if (layer._snapshot) {
                    actx.putImageData(layer._snapshot, 0, 0);
                }
                for (const stroke of layer.strokes) {
                    drawStroke(actx, stroke);
                }
            }

            // ── Bouton ✕ overlay pour supprimer une annotation sélectionnée ──
            function _removeAnnotDeleteBtn() {
                const existing = document.getElementById('_annot-delete-btn');
                if (existing) existing.remove();
            }

            // Supprime tous les boutons overlay de figure
            function _removeAnnotFigureHandles() {
                ['_annot-delete-btn','_annot-resize-btn','_annot-rotate-btn','_annot-lock-btn'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.remove();
                });
            }

            // Crée un bouton overlay rond positionné à (canvasPx, canvasPy)
            function _makeAnnotHandle(id, canvasPx, canvasPy, bg, title, symbol, onMouseDown, onClick) {
                const existing = document.getElementById(id);
                if (existing) existing.remove();
                const rect   = annotCanvas.getBoundingClientRect();
                const scaleX = rect.width  / annotCanvas.width;
                const scaleY = rect.height / annotCanvas.height;
                const screenX = rect.left + canvasPx * scaleX;
                const screenY = rect.top  + canvasPy * scaleY;
                const btn = document.createElement('div');
                btn.id = id;
                btn.title = title;
                btn.style.cssText = `
                    position: fixed;
                    left: ${screenX - 10}px;
                    top:  ${screenY - 10}px;
                    width: 20px; height: 20px;
                    background: ${bg};
                    border: 2px solid #fff;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    cursor: ${id === '_annot-resize-btn' ? 'nwse-resize' : id === '_annot-rotate-btn' ? 'grab' : 'pointer'};
                    z-index: 99999;
                    font-size: 11px; font-weight: 700;
                    color: #fff;
                    line-height: 1;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.35);
                    user-select: none;
                    pointer-events: auto;
                    transition: transform 0.1s;
                `;
                btn.textContent = symbol;
                btn.onmouseenter = () => btn.style.transform = 'scale(1.2)';
                btn.onmouseleave = () => btn.style.transform = 'scale(1)';
                btn.onmousedown  = (e) => { e.stopPropagation(); e.preventDefault(); if (onMouseDown) onMouseDown(e); };
                // Stylet : pointerdown arrive avant mousedown — on l'intercepte aussi
                // Stylet : pointerdown avant mousedown
                btn.onpointerdown = (e) => {
                    e.stopPropagation(); e.preventDefault();
                    if (onMouseDown) onMouseDown(e);
                };
                btn.onclick      = (e) => { e.stopPropagation(); e.preventDefault(); if (onClick) onClick(e); };
                document.body.appendChild(btn);
                return btn;
            }

            // canvasPx, canvasPy : coordonnées en pixels canvas (haut-droit du cadre)
            function _showAnnotDeleteBtn(canvasPx, canvasPy, onDelete) {
                _removeAnnotDeleteBtn();
                _makeAnnotHandle('_annot-delete-btn', canvasPx, canvasPy,
                    '#ff4757', 'Supprimer', '✕',
                    null,
                    onDelete
                );
            }

            // Affiche les 2 boutons overlay pour une figure sélectionnée (supprimer + ancrer)
            // bbox : { x, y, w, h } en pixels canvas
            function _showAnnotFigureHandles(index, bbox) {
                _removeAnnotFigureHandles();
                const { x, y, w, h } = bbox;

                // ✕ haut-droit : supprimer
                _makeAnnotHandle('_annot-delete-btn', x + w, y,
                    '#ff4757', 'Supprimer', '✕',
                    null,
                    () => {
                        const layer2 = getLayer(currentPage);
                        if (!layer2.history) layer2.history = [];
                        layer2.history.push([...layer2.strokes]);
                        if (layer2.history.length > 30) layer2.history.shift();
                        layer2.strokes.splice(index, 1);
                        redrawAnnotations(currentPage);
                    }
                );

                // 🔒 haut-gauche : ancrer (verrouiller)
                _makeAnnotHandle('_annot-lock-btn', x, y,
                    '#e67e22', 'Ancrer la figure (ne plus pouvoir la sélectionner)', '🔒',
                    null,
                    () => {
                        const layer2 = getLayer(currentPage);
                        if (!layer2.history) layer2.history = [];
                        layer2.history.push([...layer2.strokes]);
                        if (layer2.history.length > 30) layer2.history.shift();
                        layer2.strokes[index] = { ...layer2.strokes[index], locked: true };
                        redrawAnnotations(currentPage);
                    }
                );
            }

            // Affiche les 2 boutons overlay pour un texte sélectionné
            // opts : { _deleteAt: {px,py}, _rotateAt: {px,py} } en pixels canvas
            function _showAnnotTextHandles(index, opts) {
                _removeAnnotFigureHandles();
                const del = opts._deleteAt;
                const rot = opts._rotateAt;

                // ✕ haut-droit : supprimer
                _makeAnnotHandle('_annot-delete-btn', del.px, del.py,
                    '#ff4757', 'Supprimer', '✕',
                    null,
                    () => {
                        const layer2 = getLayer(currentPage);
                        if (!layer2.history) layer2.history = [];
                        layer2.history.push([...layer2.strokes]);
                        if (layer2.history.length > 30) layer2.history.shift();
                        layer2.strokes.splice(index, 1);
                        redrawAnnotations(currentPage);
                    }
                );

                // ↻ bas-gauche : rotation
                _makeAnnotHandle('_annot-rotate-btn', rot.px, rot.py,
                    '#8e44ad', 'Faire pivoter', '↻',
                    (e) => {
                        if (typeof window._pdfTextRotateStart === 'function') {
                            window._pdfTextRotateStart(index, e);
                        }
                    },
                    null
                );
            }

            function drawStroke(ctx, stroke) {
                // Épaisseur proportionnelle à la taille courante du canvas
                const canvasW = annotCanvas.width;
                const sizeScaled = stroke.size * canvasW / 600; // 600 = référence arbitraire

                if (stroke.tool === 'text') {
                    const pos = fromNorm(stroke.nx, stroke.ny);
                    ctx.save();
                    const fontSize = Math.round(6 * Math.pow(1.12, stroke.size) * canvasW / 600);
                    ctx.font = `${fontSize}px 'Segoe UI', sans-serif`;
                    ctx.fillStyle = stroke.color;
                    ctx.textBaseline = 'top';
                    // Appliquer la rotation autour du centre du texte si elle existe
                    if (stroke.rotation) {
                        const lines = (stroke.text || '').split('\n');
                        ctx.font = `${fontSize}px 'Segoe UI', sans-serif`;
                        const textW = Math.max(...lines.map(l => ctx.measureText(l).width));
                        const textH = lines.length * fontSize * 1.3;
                        const cx = pos.x + textW / 2;
                        const cy = pos.y + textH / 2;
                        ctx.translate(cx, cy);
                        ctx.rotate(stroke.rotation);
                        ctx.translate(-cx, -cy);
                    }
                    const lines = (stroke.text || '').split('\n');
                    lines.forEach((line, i) => {
                        ctx.fillText(line, pos.x, pos.y + i * fontSize * 1.3);
                    });
                    ctx.restore();
                    return;
                }
                if (!stroke.pts || stroke.pts.length < 1) return;
                ctx.save();
                if (stroke.tool === 'figure') {
                    ctx.strokeStyle = stroke.color;
                    ctx.lineWidth = stroke.size * canvasW / 600;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.beginPath();
                    stroke.pts.forEach((p, i) => {
                        const cp = fromNorm(p.x, p.y);
                        i === 0 ? ctx.moveTo(cp.x, cp.y) : ctx.lineTo(cp.x, cp.y);
                    });
                    // Remplissage si défini
                    if (stroke.fillColor && stroke.fillOpacity > 0) {
                        ctx.save();
                        ctx.globalAlpha = stroke.fillOpacity;
                        ctx.fillStyle = stroke.fillColor;
                        ctx.fill();
                        ctx.restore();
                    }
                    ctx.stroke();
                    ctx.restore();
                    return;
                } else if (stroke.tool === 'highlighter') {
                    ctx.globalAlpha = 0.35;
                    ctx.globalCompositeOperation = 'multiply';
                    ctx.lineWidth = sizeScaled * 5;
                } else if (stroke.tool === 'eraser') {
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.lineWidth = sizeScaled * 2; // size = rayon → diameter
                } else {
                    ctx.lineWidth = sizeScaled;
                }
                ctx.strokeStyle = stroke.color;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                const p0 = fromNorm(stroke.pts[0].x, stroke.pts[0].y);
                // Cas dot (tap simple sans mouvement) : dessiner un cercle plein
                if (stroke.dot || stroke.pts.length === 1) {
                    const r = sizeScaled / 2;
                    ctx.arc(p0.x, p0.y, Math.max(r, 1), 0, Math.PI * 2);
                    ctx.fillStyle = stroke.tool === 'eraser' ? 'rgba(0,0,0,1)' : stroke.color;
                    ctx.fill();
                    ctx.restore();
                    return;
                }
                ctx.moveTo(p0.x, p0.y);
                if (stroke.pts.length === 2) {
                    const p1 = fromNorm(stroke.pts[1].x, stroke.pts[1].y);
                    ctx.lineTo(p1.x, p1.y);
                } else {
                    for (let i = 1; i < stroke.pts.length - 1; i++) {
                        const pi  = fromNorm(stroke.pts[i].x,     stroke.pts[i].y);
                        const pi1 = fromNorm(stroke.pts[i+1].x, stroke.pts[i+1].y);
                        const mx = pi.x + (pi1.x - pi.x) * 0.25;
                        const my = pi.y + (pi1.y - pi.y) * 0.25;
                        ctx.quadraticCurveTo(pi.x, pi.y, mx, my);
                    }
                    const last = fromNorm(stroke.pts[stroke.pts.length-1].x, stroke.pts[stroke.pts.length-1].y);
                    ctx.lineTo(last.x, last.y);
                }
                ctx.stroke();
                ctx.restore();
            }

            // Retourne la position en pixels canvas (tient compte du CSS scaling si le canvas est affiché plus petit)
            function getCanvasPx(e) {
                const rect = annotCanvas.getBoundingClientRect();
                const scaleX = annotCanvas.width  / rect.width;
                const scaleY = annotCanvas.height / rect.height;
                const clientX = e.touches ? e.touches[0].clientX : e.clientX;
                const clientY = e.touches ? e.touches[0].clientY : e.clientY;
                return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
            }

            // ── Barre annotations – sélection outil ──────────────────────
            const toolBtns = container.querySelectorAll('.pdf-tool-btn');
            function updateToolUI() {
                toolBtns.forEach(b => {
                    b.style.background = b.dataset.tool === activeTool ? '#4a90e2' : '#fff';
                    b.style.color      = b.dataset.tool === activeTool ? 'white' : '';
                });
                annotCanvas.style.cursor =
                    activeTool === 'eraser' ? 'cell' :
                    activeTool === 'text'   ? 'text' : 'crosshair';
            }
            toolBtns.forEach(b => {
                b.addEventListener('click', () => {
                    activeTool = b.dataset.tool;
                    updateToolUI();
                });
            });
            updateToolUI();

            // ── Events dessin ─────────────────────────────────────────────
            function onPointerDown(e) {
                if (e.button !== undefined && e.button !== 0) return;
                // Ne dessiner que si le mode annotation PDF est actif
                if (!window._pdfAnnotMode) return;
                e.preventDefault();
                const color = window._drawColor
                    || (typeof cpickGetValue === 'function' ? cpickGetValue('draw-color') : null)
                    || (document.querySelector('#cpick-draw-color .cpick-swatch') && document.querySelector('#cpick-draw-color .cpick-swatch').style.background)
                    || '#111111';
                // Si la gomme draw est active, forcer l'outil eraser et utiliser eraser-size
                const tool = (window.isEraserMode) ? 'eraser'
                           : (typeof _pdfAnnotTool !== 'undefined' && window._pdfAnnotMode) ? _pdfAnnotTool
                           : activeTool;
                const sizeElId = (tool === 'eraser') ? 'eraser-size' : 'draw-size';
                const sizeEl = document.getElementById(sizeElId);
                const _rawSize = sizeEl ? (parseInt(sizeEl.value) || 4) : 4;
                const size = (tool === 'text') ? Math.max(_rawSize, 8) : _rawSize; // taille min 8 pour le texte
                const px = getCanvasPx(e);
                const norm = toNorm(px.x, px.y);

                if (tool === 'text') {
                    // Éditeur inline positionné au clic
                    const canvasW    = annotCanvas.width;
                    const rect       = annotCanvas.getBoundingClientRect();
                    const cssScaleX  = rect.width / canvasW;
                    const fontSizePx = Math.round((size * 4 + 10) * canvasW / 600 * cssScaleX);
                    const clientX    = e.touches ? e.touches[0].clientX : e.clientX;
                    const clientY    = e.touches ? e.touches[0].clientY : e.clientY;

                    if (typeof _showPdfInlineTextEditor === 'function') {
                        _showPdfInlineTextEditor({
                            clientX, clientY, color, size, fontSizePx,
                            onValidate(textVal) {
                                if (!textVal.trim()) return;
                                const stroke = { tool: 'text', color, size, text: textVal, nx: norm.x, ny: norm.y };
                                getLayer(currentPage).strokes.push(stroke);
                                redrawAnnotations(currentPage);
                            }
                        });
                    } else {
                        const textVal = prompt('Texte à ajouter :');
                        if (!textVal) return;
                        const stroke = { tool: 'text', color, size, text: textVal, nx: norm.x, ny: norm.y };
                        getLayer(currentPage).strokes.push(stroke);
                        redrawAnnotations(currentPage);
                    }
                    return;
                }

                isDrawing = true;
                // Stocker pts en normalisé dès le départ
                currentStrokeAnnot = { tool: tool, color, size, pts: [norm] };
            }

            function onPointerMove(e) {
                if (!isDrawing || !currentStrokeAnnot) return;
                if (!window._pdfAnnotMode) return;
                e.preventDefault();
                const px   = getCanvasPx(e);
                const norm = toNorm(px.x, px.y);
                currentStrokeAnnot.pts.push(norm);
                // Mettre à jour couleur/taille depuis draw-toolbar en temps réel
                const color = window._drawColor
                    || (typeof cpickGetValue === 'function' ? cpickGetValue('draw-color') : null)
                    || currentStrokeAnnot.color;
                const sizeEl = document.getElementById('draw-size');
                const size = sizeEl ? (parseInt(sizeEl.value) || currentStrokeAnnot.size) : currentStrokeAnnot.size;
                currentStrokeAnnot.color = color;
                currentStrokeAnnot.size  = size;
                if (window.isEraserMode) {
                    currentStrokeAnnot.tool = 'eraser';
                } else if (typeof _pdfAnnotTool !== 'undefined' && window._pdfAnnotMode) {
                    currentStrokeAnnot.tool = _pdfAnnotTool;
                }

                // Dessin temps réel : convertir les 2 derniers points en pixels courants
                const pts = currentStrokeAnnot.pts;
                const canvasW = annotCanvas.width;
                const sizeScaled = currentStrokeAnnot.size * canvasW / 600;
                const prev = fromNorm(pts[pts.length - 2].x, pts[pts.length - 2].y);
                const cur  = fromNorm(pts[pts.length - 1].x, pts[pts.length - 1].y);

                actx.save();
                if (currentStrokeAnnot.tool === 'highlighter') {
                    actx.globalAlpha = 0.35;
                    actx.globalCompositeOperation = 'multiply';
                    actx.lineWidth = sizeScaled * 5;
                } else if (currentStrokeAnnot.tool === 'eraser') {
                    actx.globalCompositeOperation = 'destination-out';
                    actx.lineWidth = sizeScaled * 2;
                } else {
                    actx.lineWidth = sizeScaled;
                }
                actx.strokeStyle = currentStrokeAnnot.color;
                actx.lineCap = 'round';
                actx.lineJoin = 'round';
                actx.beginPath();
                actx.moveTo(prev.x, prev.y);
                actx.lineTo(cur.x, cur.y);
                actx.stroke();
                actx.restore();
            }

            function onPointerUp(e) {
                if (!isDrawing) return;
                isDrawing = false;
                if (currentStrokeAnnot && currentStrokeAnnot.pts.length > 0) {
                    getLayer(currentPage).strokes.push(currentStrokeAnnot);
                    redrawAnnotations(currentPage); // redessiner proprement
                }
                currentStrokeAnnot = null;
            }

            // annotCanvas transparent aux événements par défaut — draw.js le réactive en mode annotation
            annotCanvas.style.pointerEvents = 'none';
            // annotCanvas transparent aux événements par défaut — draw.js le réactive en mode annotation
            annotCanvas.style.pointerEvents = 'none';
            // annotCanvas transparent aux événements par défaut — draw.js le réactive en mode annotation
            annotCanvas.style.pointerEvents = 'none';
            annotCanvas.addEventListener('mousedown',  onPointerDown);
            annotCanvas.addEventListener('mousemove',  onPointerMove);
            annotCanvas.addEventListener('mouseup',    onPointerUp);
            annotCanvas.addEventListener('mouseleave', onPointerUp);
            annotCanvas.addEventListener('touchstart', onPointerDown, { passive: false });
            annotCanvas.addEventListener('touchmove',  onPointerMove, { passive: false });
            annotCanvas.addEventListener('touchend',   onPointerUp);

            // ── Undo / Clear ──────────────────────────────────────────────
            const undoBtn  = container.querySelector('.pdf-annot-undo');
            const clearBtn = container.querySelector('.pdf-annot-clear');
            if (undoBtn) {
                const newUndo = undoBtn.cloneNode(true);
                undoBtn.parentNode.replaceChild(newUndo, undoBtn);
                newUndo.addEventListener('click', () => {
                    const layer = getLayer(currentPage);
                    if (layer.strokes.length > 0) {
                        layer.strokes.pop();
                        redrawAnnotations(currentPage);
                    }
                });
            }
            if (clearBtn) {
                const newClear = clearBtn.cloneNode(true);
                clearBtn.parentNode.replaceChild(newClear, clearBtn);
                newClear.addEventListener('click', () => {
                    if (!confirm('Effacer toutes les annotations de cette page ?')) return;
                    getLayer(currentPage).strokes = [];
                    redrawAnnotations(currentPage);
                });
            }

            // Ctrl+Z dans le widget
            container.addEventListener('keydown', e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                    e.preventDefault();
                    const layer = getLayer(currentPage);
                    if (layer.strokes.length > 0) { layer.strokes.pop(); redrawAnnotations(currentPage); }
                }
            });

            // ── Zoom ──────────────────────────────────────────────────────
            const btnZoomIn  = container.querySelector('.pdf-zoom-in');
            const btnZoomOut = container.querySelector('.pdf-zoom-out');
            const btnZoomFit = container.querySelector('.pdf-zoom-fit');

            function applyZoom(newScale) {
                zoomScale = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, newScale));
                renderPage(currentPage);
            }

            // Cloner pour éviter doublons
            function reattach(sel, fn) {
                const el = container.querySelector(sel);
                if (!el) return;
                const clone = el.cloneNode(true);
                el.parentNode.replaceChild(clone, el);
                // Garde anti-double : un seul déclenchement par geste (stylet ou touch)
                clone._lastFired = 0;
                function _fireFn(e) {
                    const now = Date.now();
                    if (now - clone._lastFired < 400) return;
                    clone._lastFired = now;
                    fn(e);
                }
                clone.addEventListener('click', (e) => {
                    // Ignorer le click synthétique généré après pointerup stylet/touch
                    if (e.pointerType === 'pen' || e.pointerType === 'touch') return;
                    if (Date.now() - clone._lastFired < 400) return;
                    clone._lastFired = Date.now();
                    fn(e);
                });
                clone.addEventListener('pointerup', (e) => {
                    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
                        e.preventDefault();
                        _fireFn(e);
                    }
                });
            }

            reattach('.pdf-zoom-in',  () => {
                pdfDoc.getPage(currentPage).then(p => {
                    const base = zoomScale ?? fitScale(p);
                    applyZoom(base + ZOOM_STEP);
                });
            });
            reattach('.pdf-zoom-out', () => {
                pdfDoc.getPage(currentPage).then(p => {
                    const base = zoomScale ?? fitScale(p);
                    applyZoom(base - ZOOM_STEP);
                });
            });
            reattach('.pdf-zoom-fit', () => {
                zoomScale = null;
                renderPage(currentPage);
            });

            // Zoom molette (Ctrl+molette ou Shift+molette)
            canvasWrap.addEventListener('wheel', e => {
                if (!e.ctrlKey && !e.metaKey && !e.shiftKey) return;
                e.preventDefault();
                pdfDoc.getPage(currentPage).then(p => {
                    const base = zoomScale ?? fitScale(p);
                    applyZoom(base + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
                });
            }, { passive: false });

            // ── Navigation pages : input numérique + select déroulant + flèches ──
            const pageInput = container.querySelector('.pdf-page-input');
            if (pageInput) {
                pageInput.max = totalPages;
                pageInput.value = currentPage;
                pageInput.addEventListener('change', () => {
                    let p = parseInt(pageInput.value);
                    if (isNaN(p)) p = 1;
                    p = Math.max(1, Math.min(totalPages, p));
                    pageInput.value = p;
                    if (container._updatePageBtn) container._updatePageBtn(p);
                    currentPage = p;
                    renderPage(currentPage);
                });
                pageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') { pageInput.blur(); }
                });
                pageInput.addEventListener('focus', () => {
                    pageInput.select();
                });
            }
            const pageSelect2 = container.querySelector('.pdf-page-select');
            if (pageSelect2) {
                // ── Remplacement du <select> natif par un menu custom (stylet-compatible) ──

                // Créer le bouton qui affiche la page courante
                const customBtn = document.createElement('button');
                customBtn.className = 'pdf-page-custom-btn';
                customBtn.style.cssText = 'font-size:12px;border:none;background:transparent;cursor:pointer;padding:1px 4px;outline:none;min-width:28px;text-align:center;touch-action:manipulation;user-select:none;';
                customBtn.textContent = currentPage + ' / ' + totalPages;

                // Créer le menu déroulant custom
                const customMenu = document.createElement('div');
                customMenu.className = 'pdf-page-custom-menu';
                customMenu.style.cssText = 'display:none;position:absolute;z-index:99999;background:#fff;border:1px solid #ccc;border-radius:6px;box-shadow:0 4px 16px rgba(0,0,0,0.18);max-height:220px;overflow-y:auto;min-width:80px;left:0;top:100%;';

                for (let i = 1; i <= totalPages; i++) {
                    const item = document.createElement('div');
                    item.textContent = i + ' / ' + totalPages;
                    item.dataset.page = i;
                    item.style.cssText = 'padding:6px 14px;cursor:pointer;font-size:12px;white-space:nowrap;touch-action:manipulation;user-select:none;';
                    item.addEventListener('pointerenter', () => item.style.background = '#e8f0fe');
                    item.addEventListener('pointerleave', () => item.style.background = '');
                    // Agir au pointerdown : avant tout listener de fermeture
                    item.addEventListener('pointerdown', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        currentPage = i;
                        customBtn.textContent = i + ' / ' + totalPages;
                        if (pageInput) pageInput.value = i;
                        customMenu.style.display = 'none';
                        renderPage(currentPage);
                    });
                    customMenu.appendChild(item);
                }

                // Remplacer le select par le bouton custom + menu
                const menuWrap = document.createElement('div');
                menuWrap.style.cssText = 'position:relative;display:inline-flex;align-items:center;';
                pageSelect2.replaceWith(menuWrap);
                menuWrap.appendChild(customBtn);
                menuWrap.appendChild(customMenu);

                // Ouvrir/fermer le menu au clic sur le bouton
                customBtn.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const isOpen = customMenu.style.display !== 'none';
                    customMenu.style.display = isOpen ? 'none' : 'block';
                    if (!isOpen) {
                        const cur = customMenu.querySelector(`[data-page="${currentPage}"]`);
                        if (cur) cur.scrollIntoView({ block: 'nearest' });
                    }
                });

                // Fermer si on appuie ailleurs
                document.addEventListener('pointerdown', (e) => {
                    if (!menuWrap.contains(e.target)) customMenu.style.display = 'none';
                });

                // Exposer une fonction pour mettre à jour le bouton depuis l'extérieur
                container._updatePageBtn = (page) => {
                    customBtn.textContent = page + ' / ' + totalPages;
                };
            }

            reattach('.pdf-prev', () => {
                if (currentPage > 1) { currentPage--; renderPage(currentPage); }
            });
            reattach('.pdf-next', () => {
                if (currentPage < totalPages) { currentPage++; renderPage(currentPage); }
            });

            renderPage(currentPage);

            // ── ResizeObserver : maintenir le fit-to-width si zoomScale === null ──
            if (typeof ResizeObserver !== 'undefined') {
                let _resizeTimer = null;
                let _lastWrapWidth = canvasWrap.clientWidth;

                const _resizeObs = new ResizeObserver(() => {
                    if (zoomScale !== null) return;

                    const newWidth = canvasWrap.clientWidth;
                    if (newWidth === _lastWrapWidth) return;

                    // Re-rendu différé (une fois le resize terminé)
                    if (_resizeTimer) clearTimeout(_resizeTimer);
                    _resizeTimer = setTimeout(() => {
                        _resizeTimer = null;
                        _lastWrapWidth = canvasWrap.clientWidth;
                        renderPage(currentPage);
                    }, 150);
                });
                _resizeObs.observe(canvasWrap);
            }

            // ── API publique pour draw.js (mode annotation via draw-toolbar) ──
            // Exposée sur le widget DOM pour que draw.js puisse y accéder.
            const widget = container.closest('.widget');
            if (widget) {
                widget._pdfAnnotAPI = {
                    // Démarre un trait
                    startStroke(color, size, tool, px, py) {
                        const norm = toNorm(px, py);
                        currentStrokeAnnot = { tool, color, size, pts: [norm] };
                        isDrawing = true;
                    },
                    // Continue le trait en cours (dessin temps réel + accumule les points)
                    continueStroke(color, size, tool, px, py) {
                        if (!isDrawing || !currentStrokeAnnot) return;
                        const norm = toNorm(px, py);
                        currentStrokeAnnot.pts.push(norm);
                        currentStrokeAnnot.color = color;
                        currentStrokeAnnot.size  = size;
                        currentStrokeAnnot.tool  = tool;

                        // ── Filtre exponentiel IIR (lissage stylet) ──────────────
                        const alpha = (typeof SMOOTH_ALPHA !== 'undefined') ? SMOOTH_ALPHA : 0.45;
                        if (!currentStrokeAnnot._sl) {
                            currentStrokeAnnot._sl  = norm;
                            currentStrokeAnnot._spts = [norm];
                        } else {
                            const sl = currentStrokeAnnot._sl;
                            const sn = { x: sl.x + alpha * (norm.x - sl.x), y: sl.y + alpha * (norm.y - sl.y) };
                            currentStrokeAnnot._sl = sn;
                            currentStrokeAnnot._spts.push(sn);
                        }
                        const sPts = currentStrokeAnnot._spts;
                        const canvasW    = annotCanvas.width;
                        const sizeScaled = size * canvasW / 600;

                        // Redessiner le stroke en cours en entier (Bézier quadratique)
                        redrawAnnotations(currentPage);
                        actx.save();
                        if (tool === 'highlighter') {
                            actx.globalAlpha = 0.35;
                            actx.globalCompositeOperation = 'multiply';
                            actx.lineWidth = sizeScaled * 5;
                            actx.lineCap   = 'square';
                        } else if (tool === 'eraser') {
                            actx.globalCompositeOperation = 'destination-out';
                            actx.lineWidth = sizeScaled * 2;
                            actx.lineCap   = 'round';
                        } else {
                            actx.lineWidth = sizeScaled;
                            actx.lineCap   = 'round';
                        }
                        actx.strokeStyle = color;
                        actx.lineJoin    = 'round';
                        actx.beginPath();
                        const p0 = fromNorm(sPts[0].x, sPts[0].y);
                        actx.moveTo(p0.x, p0.y);
                        if (sPts.length === 2) {
                            const p1 = fromNorm(sPts[1].x, sPts[1].y);
                            actx.lineTo(p1.x, p1.y);
                        } else {
                            for (let i = 1; i < sPts.length - 1; i++) {
                                const pi  = fromNorm(sPts[i].x,     sPts[i].y);
                                const pi1 = fromNorm(sPts[i+1].x, sPts[i+1].y);
                                const mx = pi.x + (pi1.x - pi.x) * 0.25;
                                const my = pi.y + (pi1.y - pi.y) * 0.25;
                                actx.quadraticCurveTo(pi.x, pi.y, mx, my);
                            }
                            const last = fromNorm(sPts[sPts.length-1].x, sPts[sPts.length-1].y);
                            actx.lineTo(last.x, last.y);
                        }
                        actx.stroke();
                        actx.restore();
                    },
                    // Termine le trait et le sauvegarde dans annotLayers
                    endStroke() {
                        if (!isDrawing || !currentStrokeAnnot) return;
                        isDrawing = false;
                        if (currentStrokeAnnot.pts.length > 0) {
                            // Un seul point = tap simple → marquer comme dot (point plein)
                            if (currentStrokeAnnot.pts.length === 1) {
                                currentStrokeAnnot.dot = true;
                            }
                            const layer = getLayer(currentPage);
                            if (!layer.history) layer.history = [];
                            layer.redoHistory = []; // vider redo à chaque nouvelle action
                            layer.history.push([...layer.strokes]);
                            if (layer.history.length > 30) layer.history.shift();
                            layer.strokes.push(currentStrokeAnnot);
                        }
                        currentStrokeAnnot = null;
                        redrawAnnotations(currentPage);
                    },
                    // Annuler le dernier stroke
                    undo() {
                        const layer = getLayer(currentPage);
                        if (!layer.history) layer.history = [];
                        if (!layer.redoHistory) layer.redoHistory = [];
                        if (layer.history.length > 0) {
                            layer.redoHistory.push([...layer.strokes]);
                            layer.strokes = layer.history.pop();
                            redrawAnnotations(currentPage);
                        } else if (layer.strokes.length > 0) {
                            layer.redoHistory.push([...layer.strokes]);
                            layer.strokes.pop();
                            redrawAnnotations(currentPage);
                        }
                    },
                    // Refaire le dernier stroke annulé
                    redo() {
                        const layer = getLayer(currentPage);
                        if (!layer.redoHistory) layer.redoHistory = [];
                        if (layer.redoHistory.length > 0) {
                            if (!layer.history) layer.history = [];
                            layer.history.push([...layer.strokes]);
                            layer.strokes = layer.redoHistory.pop();
                            redrawAnnotations(currentPage);
                        }
                    },
                    // Effacer toutes les annotations de la page courante
                    clear() {
                        const layer = getLayer(currentPage);
                        if (!layer.history) layer.history = [];
                        layer.redoHistory = [];
                        if (layer.strokes.length > 0) {
                            layer.history.push([...layer.strokes]);
                        }
                        layer.strokes = [];
                        redrawAnnotations(currentPage);
                    },
                    // Accès au canvas pour récupérer les coordonnées
                    getAnnotCanvas() { return annotCanvas; },
                    getPdfDoc()      { return pdfDoc; },
                    getTotalPages()  { return totalPages; },
                    getAnnotLayers() { return annotLayers; },
                    drawStrokeOn(ctx, stroke, cw) {
                        // Redessine un stroke sur un contexte externe (pour export)
                        const savedW = annotCanvas.width;
                        // Remplacer temporairement la largeur de référence
                        const origW = annotCanvas.width;
                        // drawStroke utilise annotCanvas.width directement
                        // On passe ctx + on patch temporairement annotCanvas.width
                        const _orig = annotCanvas.width;
                        Object.defineProperty(annotCanvas, 'width', { value: cw, configurable: true });
                        drawStroke(ctx, stroke);
                        Object.defineProperty(annotCanvas, 'width', { value: _orig, configurable: true });
                    },
                    // Ajouter un texte (stocké dans annotLayers, survit au zoom/changement de page)
                    addTextStroke(text, color, size, px, py) {
                        const norm = toNorm(px, py);
                        const stroke = { tool: 'text', color, size, text: text, nx: norm.x, ny: norm.y };
                        const layer = getLayer(currentPage);
                        if (!layer.history) layer.history = [];
                        layer.redoHistory = [];
                        layer.history.push([...layer.strokes]);
                        if (layer.history.length > 30) layer.history.shift();
                        layer.strokes.push(stroke);
                        redrawAnnotations(currentPage);
                    },
                    // Preview d'une figure en cours de tracé (sans sauvegarder)
                    previewFigure(color, size, pts, fillColor, fillOpacity) {
                        redrawAnnotations(currentPage);
                        const canvasW = annotCanvas.width;
                        const sizeScaled = size * canvasW / 600;
                        actx.save();
                        actx.strokeStyle = color;
                        actx.lineWidth = sizeScaled;
                        actx.lineCap = 'round';
                        actx.lineJoin = 'round';
                        actx.setLineDash([6, 4]);
                        actx.globalAlpha = 0.7;
                        actx.beginPath();
                        pts.forEach((p, i) => {
                            i === 0 ? actx.moveTo(p.x, p.y) : actx.lineTo(p.x, p.y);
                        });
                        // Remplissage preview si défini
                        if (fillColor && fillOpacity > 0) {
                            actx.save();
                            actx.globalAlpha = fillOpacity * 0.7; // légèrement transparent en preview
                            actx.fillStyle = fillColor;
                            actx.setLineDash([]);
                            actx.fill();
                            actx.restore();
                            actx.setLineDash([6, 4]);
                        }
                        actx.stroke();
                        actx.setLineDash([]);
                        actx.restore();
                    },
                    // Ajouter une figure (stockée en normalisé dans annotLayers)
                    addFigureStroke(color, size, pts, fillColor, fillOpacity) {
                        const normPts = pts.map(p => toNorm(p.x, p.y));
                        const stroke = { tool: 'figure', color, size, pts: normPts };
                        if (fillColor && fillOpacity > 0) {
                            stroke.fillColor   = fillColor;
                            stroke.fillOpacity = fillOpacity;
                        }
                        const layer = getLayer(currentPage);
                        if (!layer.history) layer.history = [];
                        layer.redoHistory = [];
                        layer.history.push([...layer.strokes]);
                        if (layer.history.length > 30) layer.history.shift();
                        layer.strokes.push(stroke);
                        redrawAnnotations(currentPage);
                    },
                    // Prévisualisation du cercle gomme
                    previewEraser(px, py, r) {
                        // Toujours redessiner les annotations proprement
                        redrawAnnotations(currentPage);
                        // Si effacement en cours, redessiner le trait d'effacement accumulé
                        if (isDrawing && currentStrokeAnnot && currentStrokeAnnot.tool === 'eraser' && currentStrokeAnnot.pts.length > 1) {
                            const canvasW2 = annotCanvas.width;
                            actx.save();
                            actx.globalCompositeOperation = 'destination-out';
                            actx.lineWidth = currentStrokeAnnot.size * canvasW2 / 600 * 2;
                            actx.lineCap = 'round';
                            actx.lineJoin = 'round';
                            actx.beginPath();
                            const p0 = fromNorm(currentStrokeAnnot.pts[0].x, currentStrokeAnnot.pts[0].y);
                            actx.moveTo(p0.x, p0.y);
                            for (let i = 1; i < currentStrokeAnnot.pts.length; i++) {
                                const p = fromNorm(currentStrokeAnnot.pts[i].x, currentStrokeAnnot.pts[i].y);
                                actx.lineTo(p.x, p.y);
                            }
                            actx.stroke();
                            actx.restore();
                        }
                        // Dessiner le cercle preview
                        const canvasW = annotCanvas.width;
                        const rScaled = r * canvasW / 600;
                        actx.save();
                        actx.globalCompositeOperation = 'source-over';
                        actx.beginPath();
                        actx.arc(px, py, rScaled, 0, Math.PI * 2);
                        actx.strokeStyle = 'rgba(80,80,80,0.9)';
                        actx.lineWidth = 1.5;
                        actx.setLineDash([4, 3]);
                        actx.stroke();
                        actx.beginPath();
                        actx.arc(px, py, 2, 0, Math.PI * 2);
                        actx.fillStyle = 'rgba(80,80,80,0.7)';
                        actx.fill();
                        actx.restore();
                    },
                    // Redessiner les annotations (efface les previews)
                    redrawAnnotations() {
                        redrawAnnotations(currentPage);
                    },
                    // Effacement direct pixel par pixel (en temps réel)
                    eraseAt(px, py, r) {
                        const canvasW = annotCanvas.width;
                        const rScaled = r * canvasW / 600;
                        actx.save();
                        actx.globalCompositeOperation = 'destination-out';
                        actx.beginPath();
                        actx.arc(px, py, rScaled, 0, Math.PI * 2);
                        actx.fill();
                        actx.restore();
                    },
                    // Sauvegarder l'état après effacement (snapshot du canvas → annotLayers)
                    saveEraserSnapshot() {
                        // Stocker le canvas entier comme stroke spécial 'snapshot'
                        const layer = getLayer(currentPage);
                        const imgData = actx.getImageData(0, 0, annotCanvas.width, annotCanvas.height);
                        layer._snapshot = imgData;
                        // Nettoyer les strokes normaux car le snapshot les inclut
                        layer.strokes = [];
                    },
                    // Déplacer un stroke texte en temps réel (pendant le drag)
                    // Dessiner un cadre de sélection autour d'un stroke texte
                    drawTextSelection(index) {
                        const layer = getLayer(currentPage);
                        const s = layer.strokes[index];
                        if (!s || s.tool !== 'text') return;
                        redrawAnnotations(currentPage);
                        const canvasW  = annotCanvas.width;
                        const pos      = fromNorm(s.nx, s.ny);
                        const fontSize = Math.round(6 * Math.pow(1.12, s.size) * canvasW / 600);
                        actx.save();
                        actx.font = `${fontSize}px 'Segoe UI', sans-serif`;
                        const lines = (s.text || '').split('\n');
                        const textW = Math.max(...lines.map(l => actx.measureText(l).width));
                        actx.restore();
                        const textH = lines.length * fontSize * 1.3;
                        const pad = 4 * canvasW / 600;
                        // Si le texte est pivoté, dessiner le cadre pivoté aussi
                        const rot = s.rotation || 0;
                        const cx = pos.x + textW / 2;
                        const cy = pos.y + textH / 2;
                        const x = pos.x - pad;
                        const y = pos.y - pad;
                        const w = textW + pad * 2;
                        const h = textH + pad * 2;
                        actx.save();
                        if (rot) {
                            actx.translate(cx, cy);
                            actx.rotate(rot);
                            actx.translate(-cx, -cy);
                        }
                        actx.strokeStyle = '#4a90e2';
                        actx.lineWidth   = 2 * canvasW / 600;
                        actx.setLineDash([5, 3]);
                        actx.strokeRect(x, y, w, h);
                        const r = 4 * canvasW / 600;
                        actx.fillStyle = '#4a90e2';
                        [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([bx,by]) => {
                            actx.beginPath();
                            actx.arc(bx, by, r, 0, Math.PI*2);
                            actx.fill();
                        });
                        actx.restore();
                        // Boutons overlay : ✕ haut-droit, ↻ bas-gauche
                        // Calculer les coins réels après rotation pour positionner les boutons
                        const corners = [[x+w, y], [x, y+h]];
                        const rotatedCorners = corners.map(([bx, by]) => {
                            if (!rot) return [bx, by];
                            const dx = bx - cx, dy = by - cy;
                            return [cx + dx * Math.cos(rot) - dy * Math.sin(rot),
                                    cy + dx * Math.sin(rot) + dy * Math.cos(rot)];
                        });
                        _showAnnotTextHandles(index, {
                            x: rotatedCorners[0][0], y: rotatedCorners[0][1],
                            w: 0, h: 0,
                            // On passe directement les positions des coins
                            _deleteAt:  { px: rotatedCorners[0][0], py: rotatedCorners[0][1] },
                            _rotateAt:  { px: rotatedCorners[1][0], py: rotatedCorners[1][1] }
                        });
                    },
                    moveTextStroke(index, px, py) {
                        const layer = getLayer(currentPage);
                        if (!layer.strokes[index]) return;
                        const norm = toNorm(px, py);
                        layer.strokes[index] = { ...layer.strokes[index], nx: norm.x, ny: norm.y };
                        redrawAnnotations(currentPage);
                    },
                    // Sauvegarder la position finale après drag (ajoute à l'historique)
                    saveTextMove(index) {
                        const layer = getLayer(currentPage);
                        if (!layer.strokes[index]) return;
                        if (!layer.history) layer.history = [];
                        layer.history.push([...layer.strokes]);
                        if (layer.history.length > 30) layer.history.shift();
                    },

                    // Fait pivoter un texte (angle absolu en radians)
                    rotateTextStroke(index, angle) {
                        const layer = getLayer(currentPage);
                        if (!layer.strokes[index]) return;
                        layer.strokes[index] = { ...layer.strokes[index], rotation: angle };
                        redrawAnnotations(currentPage);
                    },

                    // Sauvegarde dans l'historique après rotation texte
                    saveTextTransform(index) {
                        const layer = getLayer(currentPage);
                        if (!layer.strokes[index]) return;
                        if (!layer.history) layer.history = [];
                        layer.history.push([...layer.strokes]);
                        if (layer.history.length > 30) layer.history.shift();
                    },
                    // px, py : coordonnées canvas pixels ; retourne le stroke trouvé ou null
                    findTextStrokeAt(px, py) {
                        const layer = getLayer(currentPage);
                        const canvasW = annotCanvas.width;
                        // Parcourir en sens inverse pour prendre le stroke le plus en avant
                        for (let i = layer.strokes.length - 1; i >= 0; i--) {
                            const s = layer.strokes[i];
                            if (s.tool !== 'text') continue;
                            const pos      = fromNorm(s.nx, s.ny);
                            const fontSize = Math.round(6 * Math.pow(1.12, s.size) * canvasW / 600);
                            actx.save();
                            actx.font = `${fontSize}px 'Segoe UI', sans-serif`;
                            const metrics = actx.measureText(s.text || '');
                            actx.restore();
                            const x0 = pos.x;
                            const y0 = pos.y;
                            const x1 = pos.x + metrics.width;
                            const y1 = pos.y + fontSize * 1.3;
                            // Zone de hit élargie de 6px
                            if (px >= x0 - 6 && px <= x1 + 6 && py >= y0 - 6 && py <= y1 + 6) {
                                return { index: i, stroke: s };
                            }
                        }
                        return null;
                    },
                    // Mettre à jour le texte d'un stroke existant
                    updateTextStroke(index, newText, newSize, newColor) {
                        const layer = getLayer(currentPage);
                        if (!layer.strokes[index]) return;
                        if (!layer.history) layer.history = [];
                        layer.history.push([...layer.strokes]);
                        if (layer.history.length > 30) layer.history.shift();
                        layer.strokes[index] = {
                            ...layer.strokes[index],
                            text: newText,
                            ...(newSize  !== undefined ? { size:  newSize  } : {}),
                            ...(newColor !== undefined ? { color: newColor } : {})
                        };
                        redrawAnnotations(currentPage);
                    },

                    // ── Sélection / déplacement des figures ──────────────────
                    // Trouve la figure sous le curseur (px, py en pixels canvas)
                    findFigureStrokeAt(px, py) {
                        const layer = getLayer(currentPage);
                        const canvasW = annotCanvas.width;
                        const HIT_PAD = 8 * canvasW / 600;
                        for (let i = layer.strokes.length - 1; i >= 0; i--) {
                            const s = layer.strokes[i];
                            if (s.tool !== 'figure' || !s.pts || s.pts.length < 2) continue;
                            if (s.locked) continue; // figure ancrée : invisible à la sélection
                            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                            s.pts.forEach(p => {
                                const cp = fromNorm(p.x, p.y);
                                if (cp.x < minX) minX = cp.x;
                                if (cp.y < minY) minY = cp.y;
                                if (cp.x > maxX) maxX = cp.x;
                                if (cp.y > maxY) maxY = cp.y;
                            });
                            if (px >= minX - HIT_PAD && px <= maxX + HIT_PAD &&
                                py >= minY - HIT_PAD && py <= maxY + HIT_PAD) {
                                return { index: i, stroke: s, bbox: { minX, minY, maxX, maxY } };
                            }
                        }
                        return null;
                    },

                    // Dessine un cadre de sélection autour d'une figure
                    drawFigureSelection(index) {
                        const layer = getLayer(currentPage);
                        const s = layer.strokes[index];
                        if (!s || s.tool !== 'figure' || !s.pts) return;
                        redrawAnnotations(currentPage);
                        const canvasW = annotCanvas.width;
                        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                        s.pts.forEach(p => {
                            const cp = fromNorm(p.x, p.y);
                            if (cp.x < minX) minX = cp.x;
                            if (cp.y < minY) minY = cp.y;
                            if (cp.x > maxX) maxX = cp.x;
                            if (cp.y > maxY) maxY = cp.y;
                        });
                        const pad = 6 * canvasW / 600;
                        const x = minX - pad, y = minY - pad;
                        const w = (maxX - minX) + pad * 2;
                        const h = (maxY - minY) + pad * 2;
                        actx.save();
                        actx.strokeStyle = '#4a90e2';
                        actx.lineWidth   = 2 * canvasW / 600;
                        actx.setLineDash([5, 3]);
                        actx.strokeRect(x, y, w, h);
                        const r = 4 * canvasW / 600;
                        actx.fillStyle = '#4a90e2';
                        [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([cx, cy]) => {
                            actx.beginPath();
                            actx.arc(cx, cy, r, 0, Math.PI * 2);
                            actx.fill();
                        });
                        actx.restore();
                        // Boutons overlay : ✕ haut-droit, ⤡ bas-droit, ↻ bas-gauche
                        _showAnnotFigureHandles(index, { x, y, w, h });
                    },

                    // Déplace une figure (delta en pixels canvas normalisés)
                    moveFigureStroke(index, dnx, dny) {
                        const layer = getLayer(currentPage);
                        const s = layer.strokes[index];
                        if (!s || s.tool !== 'figure') return;
                        layer.strokes[index] = {
                            ...s,
                            pts: s.pts.map(p => ({ x: p.x + dnx, y: p.y + dny }))
                        };
                        redrawAnnotations(currentPage);
                    },

                    // Sauvegarde le déplacement dans l'historique
                    saveFigureMove(index) {
                        const layer = getLayer(currentPage);
                        if (!layer.strokes[index]) return;
                        if (!layer.history) layer.history = [];
                        layer.history.push([...layer.strokes]);
                        if (layer.history.length > 30) layer.history.shift();
                    },

                    // Redimensionne une figure : scaleX/scaleY absolus depuis les pts d'origine
                    // origPts : tableau des pts normalisés au moment du début du drag
                    resizeFigureStroke(index, scaleX, scaleY, origPts) {
                        const layer = getLayer(currentPage);
                        const s = layer.strokes[index];
                        if (!s || s.tool !== 'figure') return;
                        const pts = origPts || s.pts;
                        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                        pts.forEach(p => {
                            if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
                            if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
                        });
                        const cx = (minX + maxX) / 2;
                        const cy = (minY + maxY) / 2;
                        layer.strokes[index] = {
                            ...s,
                            pts: pts.map(p => ({
                                x: cx + (p.x - cx) * scaleX,
                                y: cy + (p.y - cy) * scaleY
                            }))
                        };
                        redrawAnnotations(currentPage);
                    },

                    // Fait pivoter une figure d'un angle absolu autour de son centre d'origine
                    // origPts : pts normalisés capturés au début du drag
                    rotateFigureStroke(index, absAngle, origPts) {
                        const layer = getLayer(currentPage);
                        const s = layer.strokes[index];
                        if (!s || s.tool !== 'figure') return;
                        const pts = origPts || s.pts;
                        // Travailler en pixels canvas pour que la rotation soit isométrique
                        const pxPts = pts.map(p => fromNorm(p.x, p.y));
                        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                        pxPts.forEach(p => {
                            if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y;
                            if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y;
                        });
                        const cx = (minX + maxX) / 2;
                        const cy = (minY + maxY) / 2;
                        const cos = Math.cos(absAngle);
                        const sin = Math.sin(absAngle);
                        layer.strokes[index] = {
                            ...s,
                            pts: pxPts.map(p => {
                                const dx = p.x - cx, dy = p.y - cy;
                                return toNorm(cx + dx * cos - dy * sin, cy + dx * sin + dy * cos);
                            })
                        };
                        redrawAnnotations(currentPage);
                    },

                    // Sauvegarde dans l'historique (après resize ou rotate terminé)
                    saveFigureTransform(index) {
                        const layer = getLayer(currentPage);
                        if (!layer.strokes[index]) return;
                        if (!layer.history) layer.history = [];
                        layer.history.push([...layer.strokes]);
                        if (layer.history.length > 30) layer.history.shift();
                    }
                };
            }

        }).catch(err => {
            console.error('PDF.js erreur :', err);
            if (canvasWrap) canvasWrap.innerHTML = '<p style="color:red;padding:16px;">Impossible de lire ce PDF.</p>';
        });
    });
}

// =========================================================================
// PLEIN ÉCRAN, YOUTUBE, IFRAME
// =========================================================================
let _fsEl = null, _fsW = '', _fsH = '', _fsWidgetW = '', _fsWidgetH = '';

function toggleFullScreen(el) {
    if (!document.fullscreenElement) {
        _fsEl = el;
        _fsW  = el.style.width  || el.offsetWidth  + 'px';
        _fsH  = el.style.height || el.offsetHeight + 'px';
        const widget = el.closest('.widget');
        if (widget) {
            _fsWidgetW = widget.style.width  || '';
            _fsWidgetH = widget.style.height || '';
            // Snapshot complet pour restauration dans index.html fullscreenchange
            const wStyle = {};
            ['width','height','top','left','right','bottom','transform',
             'maxWidth','maxHeight','minWidth','minHeight','position'].forEach(function(p) {
                wStyle[p] = widget.style[p] || '';
            });
            window._fsWidgetSnapshot = { widget: widget, container: el, cW: _fsW, cH: _fsH, wStyle: wStyle };
        }
        el.requestFullscreen().catch(function(err) { console.log(err); });
    } else {
        document.exitFullscreen();
    }
}
document.addEventListener('fullscreenchange', function() {
    // La restauration complète est gérée dans index.html via window._fsWidgetSnapshot
    // On remet juste _fsEl à null ici
    if (!document.fullscreenElement) {
        _fsEl = null;
    }
});
function loadIframe(input) {
    const iframe = input.closest('.editor-container').querySelector('iframe');
    let url = input.value.trim();
    if (url && !url.startsWith('http')) url = 'https://' + url;
    iframe.src = url; saveBoard();
}
function loadYoutube(input) {
    const container = input.closest('.editor-container');
    const iframe = container.querySelector('iframe.yt-player');
    let url = input.value.trim();
    const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
    const videoId = match ? match[1] : null;
    if (videoId && window.electronAPI && typeof window.electronAPI.openYoutube === 'function') {
        window.electronAPI.openYoutube(videoId);
    } else {
        iframe.src = videoId ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1` : url;
    }
    saveBoard();
}
function toggleYoutubeView(btn, display) {
    const c = btn.closest('.editor-container');
    c.querySelector('iframe.yt-player').style.display = display;
    c.style.height = display === 'none' ? '50px' : '';
    saveBoard();
}
function ytSwitchTab(btn, tab) {
    const container = btn.closest('.editor-container');
    container.querySelectorAll('.yt-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    container.querySelector('.yt-url-bar').style.display    = tab === 'url'    ? 'flex' : 'none';
    container.querySelector('.yt-search-bar').style.display = tab === 'search' ? 'flex' : 'none';
    if (tab === 'search') container.querySelector('.yt-search-input').focus();
}
function ytSearchNewTab(container) {
    const query = container.querySelector('.yt-search-input').value.trim();
    if (!query) return;
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
}

// ── Bibliothèque YouTube ──────────────────────────────────────────
let _ytLibrary = [];

function _ytCurrentVideoId(container) {
    const src = container.querySelector('iframe.yt-player').src;
    const m = src.match(/embed\/([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
}

async function ytToggleFav(btn) {
    const container = btn.closest('.editor-container');
    const videoId = _ytCurrentVideoId(container);
    if (!videoId) { alert('Aucune vidéo chargée.'); return; }
    const existing = _ytLibrary.findIndex(v => v.id === videoId);
    if (existing !== -1) {
        if (!confirm('Retirer cette vidéo de la bibliothèque ?')) return;
        _ytLibrary.splice(existing, 1);
        btn.classList.remove('saved');
        btn.title = 'Ajouter à la bibliothèque';
    } else {
        const tag = prompt('Catégorie / tag (optionnel) :', '') || '';
        btn.textContent = '⏳';
        try {
            const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
            const data = await res.json();
            _ytLibrary.push({ id: videoId, title: data.title, thumb: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, tag });
        } catch {
            const title = prompt('Titre de la vidéo :', '') || videoId;
            _ytLibrary.push({ id: videoId, title, thumb: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`, tag });
        }
        btn.classList.add('saved');
        btn.title = 'Retirer de la bibliothèque';
    }
    btn.textContent = '♥';
    ytRenderLibrary(container);
}

function ytToggleLibrary(btn) {
    const container = btn.closest('.editor-container');
    const lib = container.querySelector('.yt-library');
    lib.classList.toggle('open');
    if (lib.classList.contains('open')) ytRenderLibrary(container);
}

function ytRenderLibrary(container) {
    const filter = (container.querySelector('.yt-lib-filter').value || '').toLowerCase();
    const grid = container.querySelector('.yt-lib-grid');
    const items = _ytLibrary.filter(v =>
        v.title.toLowerCase().includes(filter) || v.tag.toLowerCase().includes(filter)
    );
    if (items.length === 0) {
        grid.innerHTML = '<div class="yt-lib-empty">Bibliothèque vide.<br>Chargez une vidéo puis cliquez sur ♥</div>';
        return;
    }
    grid.innerHTML = items.map((v, i) => `
        <div class="yt-lib-card" onmousedown="event.stopPropagation()" onclick="ytPlayFromLib('${v.id}', this)">
            <img src="${v.thumb}" alt="${v.title.replace(/"/g,'&quot;')}" loading="lazy">
            <button class="yt-lib-del" onclick="event.stopPropagation();ytRemoveFromLib(${_ytLibrary.indexOf(v)},this)" title="Supprimer">×</button>
            <div class="yt-lib-info">
                <div class="yt-lib-title">${v.title}</div>
                ${v.tag ? `<div class="yt-lib-tag">🏷 ${v.tag}</div>` : ''}
            </div>
        </div>`).join('');
    // Marquer le favori actif
    const currentId = _ytCurrentVideoId(container);
    const favBtn = container.querySelector('.yt-fav-btn');
    const isSaved = _ytLibrary.some(v => v.id === currentId);
    favBtn.classList.toggle('saved', isSaved);
    favBtn.title = isSaved ? 'Retirer de la bibliothèque' : 'Ajouter à la bibliothèque';
}

function ytPlayFromLib(videoId, card) {
    const container = card.closest('.editor-container');
    const iframe = container.querySelector('iframe.yt-player');
    if (window.electronAPI && typeof window.electronAPI.openYoutube === 'function') {
        window.electronAPI.openYoutube(videoId);
    } else {
        iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
    }
    container.querySelector('.yt-library').classList.remove('open');
    const favBtn = container.querySelector('.yt-fav-btn');
    favBtn.classList.add('saved');
    favBtn.title = 'Retirer de la bibliothèque';
    saveBoard();
}

function ytRemoveFromLib(index, btn) {
    _ytLibrary.splice(index, 1);
    const container = btn.closest('.editor-container');
    ytRenderLibrary(container);
}

let _ytImportBtn = null;
function ytImportLibrary(btn) {
    _ytImportBtn = btn;
    document.getElementById('yt-lib-import-input').click();
}
function ytImportLibraryFromInput(event) {
    const file = event.target.files[0];
    event.target.value = '';
    if (!file) return;
    const btn = _ytImportBtn;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const data = JSON.parse(ev.target.result);
            if (!Array.isArray(data)) throw new Error();
            _ytLibrary = data;
            if (btn) {
                ytRenderLibrary(btn.closest('.editor-container'));
                btn.textContent = '✓ ' + data.length + ' importée(s)';
                setTimeout(() => btn.textContent = '⬆ Importer', 2500);
            }
        } catch {
            if (btn) {
                btn.textContent = '⚠ JSON invalide';
                setTimeout(() => btn.textContent = '⬆ Importer', 2500);
            }
        }
    };
    reader.readAsText(file);
}

function ytExportLibrary() {
    const btns = document.querySelectorAll('.yt-library-toolbar button');
    const btn = Array.from(btns).find(b => b.textContent.includes('Exporter'));
    if (_ytLibrary.length === 0) {
        if (btn) { const t = btn.textContent; btn.textContent = '⚠ Vide'; setTimeout(() => btn.textContent = t, 2000); }
        return;
    }
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(_ytLibrary, null, 2));
    a.download = 'bibliotheque-youtube.json';
    document.body.appendChild(a); a.click(); a.remove();
    if (btn) { const t = btn.textContent; btn.textContent = '✓ Exporté'; setTimeout(() => btn.textContent = t, 2000); }
}

// =========================================================================
// EXPORT PDF AVEC ANNOTATIONS
// =========================================================================
async function _exportPdfWithAnnotations(container) {
    const widget = container.closest('.widget');
    if (!widget || !widget._pdfAnnotAPI) {
        alert('Aucun PDF chargé dans ce widget.');
        return;
    }
    const api = widget._pdfAnnotAPI;
    const pdfDoc = api.getPdfDoc();
    const totalPages = api.getTotalPages();
    const annotLayers = api.getAnnotLayers();
    if (!pdfDoc) { alert('PDF non disponible.'); return; }

    // Charger jsPDF si pas encore chargé
    if (!window.jspdf) {
        await new Promise((res, rej) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
            s.onload = res; s.onerror = rej;
            document.head.appendChild(s);
        });
    }
    const { jsPDF } = window.jspdf;

    const btn = container.querySelector('.pdf-export-btn');
    if (btn) { btn.textContent = '⏳'; btn.disabled = true; }

    try {
        // Rendre chaque page à 2x pour la qualité
        const SCALE = 2;
        let pdf = null;

        for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: SCALE });
            const W = viewport.width, H = viewport.height;

            // Canvas PDF
            const pdfCanvas = document.createElement('canvas');
            pdfCanvas.width = W; pdfCanvas.height = H;
            const pdfCtx = pdfCanvas.getContext('2d');
            await page.render({ canvasContext: pdfCtx, viewport }).promise;

            // Canvas annotation
            const annotCanvas2 = document.createElement('canvas');
            annotCanvas2.width = W; annotCanvas2.height = H;
            const annotCtx = annotCanvas2.getContext('2d');

            const layer = annotLayers[pageNum];
            if (layer) {
                // Restaurer snapshot si existant
                if (layer._snapshot) {
                    // Redimensionner le snapshot au scale SCALE
                    const tmpC = document.createElement('canvas');
                    tmpC.width  = layer._snapshot.width;
                    tmpC.height = layer._snapshot.height;
                    tmpC.getContext('2d').putImageData(layer._snapshot, 0, 0);
                    annotCtx.drawImage(tmpC, 0, 0, W, H);
                }
                // Redessiner les strokes à l'échelle SCALE
                if (layer.strokes) {
                    for (const stroke of layer.strokes) {
                        _drawStrokeScaled(annotCtx, stroke, W, H);
                    }
                }
            }

            // Fusionner les deux canvas
            const merged = document.createElement('canvas');
            merged.width = W; merged.height = H;
            const mCtx = merged.getContext('2d');
            mCtx.drawImage(pdfCanvas, 0, 0);
            mCtx.drawImage(annotCanvas2, 0, 0);

            const imgData = merged.toDataURL('image/jpeg', 0.92);
            const pdfW = viewport.width / SCALE * 0.75; // px → pt (72dpi)
            const pdfH = viewport.height / SCALE * 0.75;

            if (!pdf) {
                pdf = new jsPDF({
                    orientation: pdfW > pdfH ? 'landscape' : 'portrait',
                    unit: 'pt',
                    format: [pdfW, pdfH]
                });
            } else {
                pdf.addPage([pdfW, pdfH], pdfW > pdfH ? 'landscape' : 'portrait');
            }
            pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH);
        }

        const pdfName = (widget.dataset.pdfName || 'document').replace(/\.pdf$/i, '');
        pdf.save(pdfName + '_annoté.pdf');

    } catch(err) {
        console.error('[Export PDF]', err);
        alert('Erreur lors de l\'export : ' + err.message);
    } finally {
        if (btn) { btn.textContent = '💾'; btn.disabled = false; }
    }
}

// Dessine un stroke sur un contexte externe avec W/H comme référence
function _drawStrokeScaled(ctx, stroke, W, H) {
    if (!stroke) return;
    function fromN(nx, ny) { return { x: nx * W, y: ny * H }; }

    if (stroke.tool === 'text') {
        const pos = fromN(stroke.nx, stroke.ny);
        const fontSize = Math.round(6 * Math.pow(1.12, stroke.size) * W / 600);
        ctx.save();
        ctx.font = `${fontSize}px 'Segoe UI', sans-serif`;
        ctx.fillStyle = stroke.color;
        ctx.textBaseline = 'top';
        const lines = (stroke.text || '').split('\n');
        if (stroke.rotation) {
            const textW = Math.max(...lines.map(l => ctx.measureText(l).width));
            const textH = lines.length * fontSize * 1.3;
            const cx = pos.x + textW / 2, cy = pos.y + textH / 2;
            ctx.translate(cx, cy);
            ctx.rotate(stroke.rotation);
            ctx.translate(-cx, -cy);
        }
        lines.forEach((line, i) => ctx.fillText(line, pos.x, pos.y + i * fontSize * 1.3));
        ctx.restore();
        return;
    }
    if (!stroke.pts || stroke.pts.length < 1) return;
    const sizeScaled = stroke.size * W / 600;
    ctx.save();
    if (stroke.tool === 'figure') {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = sizeScaled;
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.beginPath();
        stroke.pts.forEach((p, i) => {
            const cp = fromN(p.x, p.y);
            i === 0 ? ctx.moveTo(cp.x, cp.y) : ctx.lineTo(cp.x, cp.y);
        });
        // Remplissage si défini
        if (stroke.fillColor && stroke.fillOpacity > 0) {
            ctx.save();
            ctx.globalAlpha = stroke.fillOpacity;
            ctx.fillStyle = stroke.fillColor;
            ctx.fill();
            ctx.restore();
        }
        ctx.stroke();
        ctx.restore(); return;
    }
    if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.globalCompositeOperation = 'multiply';
        ctx.lineWidth = sizeScaled * 5;
    } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = sizeScaled * 2;
    } else {
        ctx.lineWidth = sizeScaled;
    }
    ctx.strokeStyle = stroke.color;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (stroke.dot) {
        const p0 = fromN(stroke.pts[0].x, stroke.pts[0].y);
        ctx.beginPath();
        ctx.arc(p0.x, p0.y, Math.max(sizeScaled / 2, 1), 0, Math.PI * 2);
        ctx.fillStyle = stroke.color;
        ctx.fill();
        ctx.restore(); return;
    }
    ctx.beginPath();
    const p0 = fromN(stroke.pts[0].x, stroke.pts[0].y);
    ctx.moveTo(p0.x, p0.y);
    if (stroke.pts.length === 2) {
        const p1 = fromN(stroke.pts[1].x, stroke.pts[1].y);
        ctx.lineTo(p1.x, p1.y);
    } else {
        for (let i = 1; i < stroke.pts.length - 1; i++) {
            const pi  = fromN(stroke.pts[i].x,     stroke.pts[i].y);
            const pi1 = fromN(stroke.pts[i+1].x, stroke.pts[i+1].y);
            const mx = pi.x + (pi1.x - pi.x) * 0.25;
            const my = pi.y + (pi1.y - pi.y) * 0.25;
            ctx.quadraticCurveTo(pi.x, pi.y, mx, my);
        }
        const last = fromN(stroke.pts[stroke.pts.length-1].x, stroke.pts[stroke.pts.length-1].y);
        ctx.lineTo(last.x, last.y);
    }
    ctx.stroke();
    ctx.restore();
}
