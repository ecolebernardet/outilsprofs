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
        try {
            localStorage.setItem(pdfId, base64);
        } catch(err) {
            alert('⚠️ Le fichier PDF est trop volumineux pour être sauvegardé automatiquement. Il restera disponible jusqu\'à la fermeture de l\'onglet.');
        }
        widget.dataset.pdfName = file.name;
        _showPdfInWidget(container, base64, file.name);
        saveBoard();
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
    const annotBar      = container.querySelector('.pdf-annot-bar');
    const pageInfo      = container.querySelector('.pdf-page-info');

    if (placeholder) placeholder.style.display = 'none';
    if (canvasWrap)  canvasWrap.style.display = 'block';
    if (navBar)      navBar.style.display = 'flex';
    if (zoomBar)     zoomBar.style.display = 'flex';
    if (annotBar)    annotBar.style.display = 'flex';
    if (nameSpan && filename) { nameSpan.textContent = filename; nameSpan.title = filename; }

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
                    const viewport = page.getViewport({ scale });
                    pdfCanvas.width  = viewport.width;
                    pdfCanvas.height = viewport.height;
                    annotCanvas.width  = viewport.width;
                    annotCanvas.height = viewport.height;

                    // Mettre à jour label zoom
                    const zoomLabel = container.querySelector('.pdf-zoom-label');
                    if (zoomLabel) zoomLabel.textContent = Math.round(scale * 100) + '%';

                    if (pageInfo) pageInfo.textContent = num + ' / ' + totalPages;

                    const btnPrev = container.querySelector('.pdf-prev');
                    const btnNext = container.querySelector('.pdf-next');
                    if (btnPrev) btnPrev.disabled = num <= 1;
                    if (btnNext) btnNext.disabled = num >= totalPages;

                    if (renderTask) renderTask.cancel();
                    renderTask = page.render({ canvasContext: pdfCanvas.getContext('2d'), viewport });
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
                    ctx.font = `${(stroke.size * 4 + 10) * canvasW / 600}px 'Segoe UI', sans-serif`;
                    ctx.fillStyle = stroke.color;
                    ctx.fillText(stroke.text || '', pos.x, pos.y);
                    ctx.restore();
                    return;
                }
                if (!stroke.pts || stroke.pts.length < 1) return;
                ctx.save();
                if (stroke.tool === 'highlighter') {
                    ctx.globalAlpha = 0.35;
                    ctx.globalCompositeOperation = 'multiply';
                    ctx.lineWidth = sizeScaled * 5;
                } else if (stroke.tool === 'eraser') {
                    ctx.globalCompositeOperation = 'destination-out';
                    ctx.lineWidth = sizeScaled * 6;
                } else {
                    ctx.lineWidth = sizeScaled;
                }
                ctx.strokeStyle = stroke.color;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                const p0 = fromNorm(stroke.pts[0].x, stroke.pts[0].y);
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
                e.preventDefault();
                const colorInput = container.querySelector('.pdf-annot-color');
                const sizeSelect = container.querySelector('.pdf-annot-size');
                const color = colorInput ? colorInput.value : '#e74c3c';
                const size  = sizeSelect ? parseInt(sizeSelect.value) : 4;
                const px = getCanvasPx(e);
                const norm = toNorm(px.x, px.y);

                if (activeTool === 'text') {
                    const textVal = prompt('Texte à ajouter :');
                    if (!textVal) return;
                    // Stocker en normalisé
                    const stroke = { tool: 'text', color, size, text: textVal, nx: norm.x, ny: norm.y };
                    getLayer(currentPage).strokes.push(stroke);
                    redrawAnnotations(currentPage);
                    return;
                }

                isDrawing = true;
                // Stocker pts en normalisé dès le départ
                currentStrokeAnnot = { tool: activeTool, color, size, pts: [norm] };
            }

            function onPointerMove(e) {
                if (!isDrawing || !currentStrokeAnnot) return;
                e.preventDefault();
                const px   = getCanvasPx(e);
                const norm = toNorm(px.x, px.y);
                currentStrokeAnnot.pts.push(norm);

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
                    actx.lineWidth = sizeScaled * 6;
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
                zoomScale = null; // retour fit-to-width
                renderPage(currentPage);
            });

            // Zoom molette
            canvasWrap.addEventListener('wheel', e => {
                if (!e.ctrlKey && !e.metaKey) return;
                e.preventDefault();
                pdfDoc.getPage(currentPage).then(p => {
                    const base = zoomScale ?? fitScale(p);
                    applyZoom(base + (e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
                });
            }, { passive: false });

            // ── Navigation pages ──────────────────────────────────────────
            reattach('.pdf-prev', () => {
                if (currentPage > 1) { redrawAnnotations(currentPage); currentPage--; renderPage(currentPage); }
            });
            reattach('.pdf-next', () => {
                if (currentPage < totalPages) { redrawAnnotations(currentPage); currentPage++; renderPage(currentPage); }
            });

            renderPage(currentPage);

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
        _fsW  = el.style.width;
        _fsH  = el.style.height;
        const widget = el.closest('.widget');
        if (widget) { _fsWidgetW = widget.style.width; _fsWidgetH = widget.style.height; }
        el.requestFullscreen().catch(err => console.log(err));
    } else {
        document.exitFullscreen();
    }
}
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && _fsEl) {
        _fsEl.style.width  = _fsW;
        _fsEl.style.height = _fsH;
        const widget = _fsEl.closest('.widget');
        if (widget) {
            widget.style.width  = _fsWidgetW;
            widget.style.height = _fsWidgetH;
        }
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
    iframe.src = match ? `https://www.youtube.com/embed/${match[1]}?autoplay=1` : url;
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
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
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
