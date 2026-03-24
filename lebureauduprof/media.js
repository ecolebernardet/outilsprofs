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
                    const pageSelect3 = container.querySelector('.pdf-page-select');
                    if (pageSelect3) pageSelect3.value = num;

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
                const layer = getLayer(pageNum);
                // Restaurer le snapshot s'il existe (après effacement)
                if (layer._snapshot) {
                    actx.putImageData(layer._snapshot, 0, 0);
                }
                for (const stroke of layer.strokes) {
                    drawStroke(actx, stroke);
                }
            }

            function drawStroke(ctx, stroke) {
                // Épaisseur proportionnelle à la taille courante du canvas
                const canvasW = annotCanvas.width;
                const sizeScaled = stroke.size * canvasW / 600; // 600 = référence arbitraire

                if (stroke.tool === 'text') {
                    const pos = fromNorm(stroke.nx, stroke.ny);
                    ctx.save();
                    // fontSize proportionnel à la largeur du canvas (suit le zoom/redimensionnement)
                    const fontSize = Math.round(6 * Math.pow(1.12, stroke.size) * canvasW / 600);
                    ctx.font = `${fontSize}px 'Segoe UI', sans-serif`;
                    ctx.fillStyle = stroke.color;
                    ctx.textBaseline = 'top';
                    // Gérer les retours à la ligne
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
                for (let i = 1; i < stroke.pts.length; i++) {
                    const p = fromNorm(stroke.pts[i].x, stroke.pts[i].y);
                    ctx.lineTo(p.x, p.y);
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
                clone.addEventListener('click', fn);
                // Support tactile / stylet VPI : touchend + pointerup
                clone.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    fn(e);
                }, { passive: false });
                clone.addEventListener('pointerup', (e) => {
                    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
                        e.preventDefault();
                        fn(e);
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
                    if (pageSelect2) pageSelect2.value = p;
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
                pageSelect2.innerHTML = '';
                for (let i = 1; i <= totalPages; i++) {
                    const opt = document.createElement('option');
                    opt.value = i;
                    opt.textContent = i + ' / ' + totalPages;
                    pageSelect2.appendChild(opt);
                }
                pageSelect2.value = currentPage;
                const newSelect = pageSelect2.cloneNode(true);
                pageSelect2.parentNode.replaceChild(newSelect, pageSelect2);
                newSelect.addEventListener('change', () => {
                    currentPage = parseInt(newSelect.value);
                    if (pageInput) pageInput.value = currentPage;
                    renderPage(currentPage);
                });
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

                        const canvasW    = annotCanvas.width;
                        const sizeScaled = size * canvasW / 600;
                        const pts  = currentStrokeAnnot.pts;
                        const prev = fromNorm(pts[pts.length - 2].x, pts[pts.length - 2].y);
                        const cur  = fromNorm(norm.x, norm.y);

                        actx.save();
                        if (tool === 'highlighter') {
                            actx.globalAlpha = 0.35;
                            actx.globalCompositeOperation = 'multiply';
                            actx.lineWidth = sizeScaled * 5;
                        } else if (tool === 'eraser') {
                            actx.globalCompositeOperation = 'destination-out';
                            actx.lineWidth = sizeScaled * 2;
                        } else {
                            actx.lineWidth = sizeScaled;
                        }
                        actx.strokeStyle = color;
                        actx.lineCap  = 'round';
                        actx.lineJoin = 'round';
                        actx.beginPath();
                        actx.moveTo(prev.x, prev.y);
                        actx.lineTo(cur.x, cur.y);
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
                        const metrics = actx.measureText(s.text || '');
                        actx.restore();
                        const pad = 4 * canvasW / 600;
                        const x = pos.x - pad;
                        const y = pos.y - pad;
                        const w = metrics.width + pad * 2;
                        const h = fontSize * 1.3 + pad * 2;
                        actx.save();
                        actx.strokeStyle = '#4a90e2';
                        actx.lineWidth   = 2 * canvasW / 600;
                        actx.setLineDash([5, 3]);
                        actx.strokeRect(x, y, w, h);
                        const r = 4 * canvasW / 600;
                        actx.fillStyle = '#4a90e2';
                        [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([cx,cy]) => {
                            actx.beginPath();
                            actx.arc(cx, cy, r, 0, Math.PI*2);
                            actx.fill();
                        });
                        actx.restore();
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
    for (let i = 1; i < stroke.pts.length; i++) {
        const p = fromN(stroke.pts[i].x, stroke.pts[i].y);
        ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.restore();
}
