// =========================================================================
// SAUVEGARDE / CHARGEMENT
// =========================================================================
function getInnerHTMLNormalized(widget) {
    const factor = 1920 / window.innerWidth;
    const clone = widget.cloneNode(true);
    clone.querySelectorAll('*').forEach(el => {
        if (!el.style?.fontSize) return;
        const m = el.style.fontSize.match(/^([\d.]+)px$/);
        if (m) el.style.fontSize = (parseFloat(m[1]) * factor) + 'px';
    });
    if (clone.style?.fontSize) {
        const m = clone.style.fontSize.match(/^([\d.]+)px$/);
        if (m) clone.style.fontSize = (parseFloat(m[1]) * factor) + 'px';
    }
    const agendaList = clone.querySelector('.agenda-list');
    const content    = clone.querySelector('.editor-content');
    return agendaList ? agendaList.innerHTML : (content ? content.innerHTML : null);
}

function getEditorStyleNormalized(widget, refWidth = 1920) {
    const editor = widget.querySelector('.editor-content');
    if (!editor) return null;
    const cs = window.getComputedStyle(editor);
    const curW = window.innerWidth || refWidth;
    const factor = refWidth / curW;
    const fontSizePx = parseFloat(cs.fontSize);
    return {
        fontFamily: cs.fontFamily || '',
        fontSizePx: Number.isFinite(fontSizePx) ? +(fontSizePx * factor).toFixed(2) : null,
        color:      cs.color || '',
        lineHeight: editor.style.lineHeight ? parseFloat(editor.style.lineHeight) : null,
        marginTop:  editor.style.marginTop  || null
    };
}

function applyEditorStyleFromConfig(widget, style) {
    if (!style) return;
    const editor = widget.querySelector('.editor-content');
    if (!editor) return;
    if (style.fontFamily) editor.style.fontFamily = style.fontFamily;
    if (style.color) editor.style.color = style.color;
    if (style.fontSizePx) editor.style.fontSize = style.fontSizePx + 'px';
    if (style.lineHeight) {
        editor.style.lineHeight = style.lineHeight;
        editor.dataset.lineHeightBase = style.lineHeight;
    }
    if (style.marginTop) editor.style.marginTop = style.marginTop;
}

function buildBoardState() {
    const curW = window.innerWidth, curVH = virtualH(curW);
    const widgets = [];
    document.querySelectorAll('.widget').forEach(w => {
        const iframe = w.querySelector('iframe');
        const c = w.querySelector('.editor-container');
        const html = getInnerHTMLNormalized(w);
        const isTextLike = w.dataset.type === 'text' || w.dataset.type === 'homework';
        let wP = 0, hP = 0;
        if (c) { wP = (c.offsetWidth / curW) * 100; hP = ((c.offsetHeight - getToolbarHeight(c)) / curVH) * 100; }
        const lP = (w.offsetLeft / curW) * 100;
        const tP = (w.offsetTop  / curVH) * 100;
        Object.assign(w.dataset, { widthPercent: wP, contentHPercent: hP, leftPercent: lP, topPercent: tP });
        // Données propres aux stickers
        let stickerUrl = null, stickerEmoji = null, stickerSize = null;
        if (w.dataset.type === 'sticker') {
            const sImg = w.querySelector('img');
            const sEmoji = w.querySelector('[data-sticker-type="emoji"]');
            if (sImg) stickerUrl = sImg.src;
            if (sEmoji) stickerEmoji = sEmoji.textContent;
            stickerSize = { w: w.offsetWidth, h: w.offsetHeight };
        }
        // Données propres au widget monnaie
        let monnaieData = null;
        if (w.dataset.type === 'monnaie') {
            const mc = w.querySelector('.monnaie-container');
            const mz = w.querySelector('.monnaie-items');
            monnaieData = {
                containerW: mc ? mc.offsetWidth  : null,
                itemsH:     mz ? mz.offsetHeight : null,
                level:      w.dataset.monnaieLevel || 'facile'
            };
        }
        widgets.push({
			type: w.dataset.type, topPercent: tP, leftPercent: lP, widthPercent: wP, contentHPercent: hP,
			html, content: html, iframeSrc: iframe?.src || null,
			transparent: w.dataset.transparent === "true",
			bgColor: w.dataset.bgColor || "#ffffff",
			bgOpacity: parseFloat(w.dataset.bgOpacity ?? 1),
			editorStyle: isTextLike ? getEditorStyleNormalized(w, 1920) : null,
			pinned: w.dataset.pinned === "true",
			background: w.dataset.background === "true",
			groupId: w.dataset.groupId || null,
			meteoCity: w.dataset.meteoCity || null,
			stickerUrl, stickerEmoji, stickerSize,
			transform: w.style.transform || null,
			pdfId: w.dataset.pdfId || null,
			pdfName: w.dataset.pdfName || null,
			animation: w.dataset.animation || null,
			monnaieData
		});
    });
    const shapes = [];
    document.querySelectorAll('.shape-widget').forEach(w => {
        const svg = w.querySelector('svg');
        if (!svg) return;
        const lP = (w.offsetLeft / curW) * 100;
        const tP = (w.offsetTop  / curVH) * 100;
        const wP = (parseFloat(svg.getAttribute('width') || 150) / curW) * 100;
        const hP = (parseFloat(svg.getAttribute('height') || 150) / curVH) * 100;
        w.dataset.leftPercent = lP; w.dataset.topPercent = tP;
        w.dataset.wPercent = wP; w.dataset.hPercent = hP;
        shapes.push({
            shapeType: w.dataset.shapeType, strokeColor: w.dataset.strokeColor,
            fillColor: w.dataset.fillColor, fillOpacity: w.dataset.fillOpacity,
            strokeWidth: parseInt(w.dataset.strokeWidth || 4),
            leftPercent: lP, topPercent: tP, wPercent: wP, hPercent: hP,
            transform: w.style.transform || '', pinned: w.dataset.pinned === "true",
            background: w.dataset.background === "true",
            groupId: w.dataset.groupId || null,
            flipX: parseFloat(w.dataset.flipX || 1),
            flipY: parseFloat(w.dataset.flipY || 1)
        });
    });
    return { widgets, shapes, refWidth: 1920, background: localStorage.getItem('boardBackground') || 'none', strokes: strokes || [] };
}

function buildBoardJSON() {
    try { return JSON.stringify(buildBoardState()); } catch(e) { return null; }
}

function saveBoard() {
    if (isInitialLoading || isRestoringState) return;
    const json = JSON.stringify(buildBoardState());
    localStorage.setItem('profBoardConfig', json);
    // Mettre à jour la scène courante
    if (scenes && scenes.length > 0) {
        scenes[currentScene].config     = json;
        scenes[currentScene].background = localStorage.getItem('boardBackground') || 'none';
        saveScenesMeta();
    }
    scheduleSaveSnapshot();
}

function loadBoard() {
    const raw = localStorage.getItem('profBoardConfig');
    if (raw) {
        // localStorage contient une sauvegarde → on la charge, fin de l'histoire
        restoreBoardFromJSON(raw);
    } else {
        // localStorage vide = première visite → on charge le modèle distant
        fetch('https://outilsprofs.fr/lebureauduprof/sauvegardes/lebureauduprof_bienvenue.json')
            .then(r => r.json())
            .then(data => {
                const json = JSON.stringify(data);
                localStorage.setItem('profBoardConfig', json); // ← sauvegardé en local dès la 1ère fois
                if (data.background) {
                    applyBackground(data.background);
                    localStorage.setItem('boardBackground', data.background);
                }
                restoreBoardFromJSON(json);
                // Après restauration complète (>50ms pour le contenu HTML), resauvegarder
                // pour que le localStorage et les scènes reflètent l'état réel avec le contenu
                setTimeout(() => {
                    if (!isRestoringState) saveBoard();
                }, 200);
            })
            .catch(err => {
                console.warn('Impossible de charger le modèle de bienvenue :', err);
            });
    }
}

function restoreBoardFromJSON(json) {
    // Bloquer saveBoard() pendant toute la restauration (y compris les setTimeout 50ms)
    isRestoringState = true;
    const parsed = JSON.parse(json);
    const data = Array.isArray(parsed) ? parsed : (parsed.widgets || []);
    const refW = parsed.refWidth || 1920;
    // Restaurer les traits canvas si présents dans le snapshot
    if (parsed.strokes && parsed.strokes.length > 0) {
        strokes = parsed.strokes;
        if (!drawCanvas) {
            initCanvas();
            drawCanvas.classList.add('inactive');
        }
        setTimeout(() => redrawStrokes(), 100);
    }
    const curW = window.innerWidth, curVH = virtualH(curW);
    // Compter les widgets non-stickers pour savoir quand tous les setTimeout(50ms) sont terminés
    const nonStickerCount = data.filter(w => w.type !== 'sticker').length;
    let restoredCount = 0;
    data.forEach(w => {
        // Restauration spéciale des stickers (pas de template HTML)
        if (w.type === 'sticker') {
            const curWW = window.innerWidth, curVVH = virtualH(curWW);
            const lx = (w.leftPercent / 100) * curWW;
            const ty = (w.topPercent  / 100) * curVVH;
            const sw = document.createElement('div');
            sw.className = 'widget';
            sw.dataset.type = 'sticker';
            sw.dataset.transparent = 'true';
            sw.tabIndex = 0;
            const HANDLES = '<div class="drag-handle" title="Déplacer">✥</div>'
                + '<div class="widget-rotate-handle" title="Faire pivoter">↻</div>'
                + '<div class="widget-action-bar">'
                + '<div class="widget-menu-handle" onclick="toggleCtxMenu(this.closest(\'.widget,.shape-widget\'))" title="Menu">☰</div>'
                + '<div class="widget-pin-handle" onclick="togglePin(this.closest(\'.widget\'))" title="Épingler">📌</div>'
                + '<div class="widget-back-handle" onclick="sendToBack(this.closest(\'.widget\'))" title="Envoyer derrière">🔽</div>'
                + '<div class="widget-close-handle" onclick="snapshotNow();this.closest(\'.widget\').remove();saveBoard();" title="Fermer">×</div>'
                + '</div>'
                + '<div class="widget-ctx-menu"></div>';
            if (w.stickerEmoji) {
                const sz = (w.stickerSize && w.stickerSize.w) ? w.stickerSize.w : 100;
                sw.style.cssText = `left:${lx}px;top:${ty}px;width:${sz}px;height:${sz}px;min-height:0!important;overflow:visible;flex-direction:row;flex-shrink:0;`;
                sw.style.setProperty('--sticker-h', sz + 'px');
                const econtent = document.createElement('div');
                econtent.dataset.stickerType = 'emoji';
                econtent.style.cssText = `position:absolute;top:0;left:0;width:${sz}px;height:${sz}px;display:flex;align-items:center;justify-content:center;font-size:${Math.round(sz*0.62)}px;line-height:1;user-select:none;pointer-events:none;`;
                econtent.textContent = w.stickerEmoji;
                sw.innerHTML = HANDLES;
                sw.appendChild(econtent);
            } else if (w.stickerUrl) {
                const szw = (w.stickerSize && w.stickerSize.w) ? w.stickerSize.w : 130;
                const szh = (w.stickerSize && w.stickerSize.h) ? w.stickerSize.h : 130;
                sw.style.cssText = `left:${lx}px;top:${ty}px;width:${szw}px;height:${szh}px;overflow:visible;flex-direction:row;`;
                sw.style.setProperty('--sticker-h', szh + 'px');
                const simg = document.createElement('img');
                simg.src = w.stickerUrl;
                simg.alt = '';
                simg.draggable = false;
                simg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;pointer-events:none;padding:6px;box-sizing:border-box;';
                sw.innerHTML = HANDLES;
                sw.appendChild(simg);
            } else {
                return; // sticker sans données valides, on ignore
            }
            if (w.transform) sw.style.transform = w.transform;
            if (w.pinned)    bringToFront(sw, true);
            if (w.background) { sw.style.zIndex = 1; sw.dataset.background = 'true'; }
            if (w.groupId)   sw.dataset.groupId = w.groupId;
            sw.tabIndex = 0;
            sw.addEventListener('mousedown', () => {
                bringToFront(sw);
                sw.focus();
                if (typeof positionActionBar === 'function') positionActionBar(sw);
            });
            board.appendChild(sw);
            makeDraggable(sw);
            makeDraggableRotate(sw);
            _addStickerResizeHandle(sw, 40);
            return; // widget sticker traité, on passe au suivant
        }
        let widget;
        if (w.type === 'deficalme') {
            widget = createDeficalmeWidget();
        } else if (w.type === 'monnaie') {
            widget = createMonnaieWidget();
            // Restaurer les dimensions sauvegardées
            if (w.monnaieData) {
                const mc = widget.querySelector('.monnaie-container');
                const mz = widget.querySelector('.monnaie-items');
                if (mc && w.monnaieData.containerW) mc.style.width   = w.monnaieData.containerW + 'px';
                if (mz && w.monnaieData.itemsH)     mz.style.height  = w.monnaieData.itemsH     + 'px';
                // Restaurer le niveau
                if (w.monnaieData.level && widget._setLevel) widget._setLevel(w.monnaieData.level);
            }
        } else {
            widget = createWidget(w.type, '100px', '100px', false);
        }
        const c = widget.querySelector('.editor-container');
        const hP = w.contentHPercent !== undefined ? w.contentHPercent : w.heightPercent;
        Object.assign(widget.dataset, { widthPercent: w.widthPercent || 0, contentHPercent: hP || 0, leftPercent: w.leftPercent ?? 0, topPercent: w.topPercent ?? 0 });
        if (w.meteoCity) widget.dataset.meteoCity = w.meteoCity;
        if (c) {
            if (w.widthPercent > 0) c.style.width = (w.widthPercent / 100) * curW + 'px';
            if (hP > 0) c.style.height = ((hP / 100) * curVH) + getToolbarHeight(c) + 'px';
        }
        widget.style.left = (w.leftPercent / 100) * curW + 'px';
        widget.style.top  = (w.topPercent  / 100) * curVH + 'px';
        // Appliquer transparence et fond immédiatement pour éviter le flash
        if (w.transparent) {
            applyTransparency(widget, true);
        } else if (w.bgColor) {
            widget.dataset.bgColor = w.bgColor;
            if (w.bgOpacity !== undefined && w.bgOpacity !== 1) {
                const rgb = hexToRgb(w.bgColor);
                if (rgb) {
                    const newBg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${w.bgOpacity})`;
                    widget.style.background = newBg;
                    const wc = widget.querySelector('.widget-content');
                    if (wc) wc.style.background = newBg;
                    const c2 = widget.querySelector('.editor-container');
                    if (c2) c2.style.background = newBg;
                    widget.dataset.bgOpacity = w.bgOpacity;
                } else {
                    widget.style.background = w.bgColor;
                    const wc = widget.querySelector('.widget-content');
                    if (wc) wc.style.background = w.bgColor;
                    const c2 = widget.querySelector('.editor-container');
                    if (c2) c2.style.background = w.bgColor;
                }
            } else {
                widget.style.background = w.bgColor;
                const wc = widget.querySelector('.widget-content');
                if (wc) wc.style.background = w.bgColor;
                const c2 = widget.querySelector('.editor-container');
                if (c2) c2.style.background = w.bgColor;
                widget.dataset.bgOpacity = 1;
            }
        }
        if (w.background) { widget.style.zIndex = 1; widget.dataset.background = "true"; }
        else if (w.pinned) bringToFront(widget, true);
        if (w.groupId) widget.dataset.groupId = w.groupId;
        // Restaurer l'animation si elle existe
        if (w.animation) {
            widget.dataset.animation = w.animation;
            const cssAnims = ['blink','bounce','swing','pendulum','fade','shimmer','zoompulse'];
            cssAnims.forEach(a => widget.classList.remove('anim-' + a));
            if (cssAnims.includes(w.animation)) {
                widget.classList.add('anim-' + w.animation);
            } else {
                setTimeout(() => {
                    if (w.animation === 'rainbow'    && typeof _rainbowStart    === 'function') _rainbowStart(widget);
                    if (w.animation === 'fire'       && typeof _fireStart       === 'function') _fireStart(widget);
                    if (w.animation === 'wave'       && typeof _waveStart       === 'function') _waveStart(widget);
                    if (w.animation === 'twinkle'    && typeof _twinkleStart    === 'function') _twinkleStart(widget);
                    if (w.animation === 'rain'       && typeof _rainStart       === 'function') _rainStart(widget);
                    if (w.animation === 'typewriter' && typeof _typewriterStart === 'function') _typewriterStart(widget);
                }, 150);
            }
        }

        // Widgets texte/devoirs : démarrer en mode non-éditable (drag par défaut)
        if (w.type === 'text' || w.type === 'homework') {
            const ed = widget.querySelector('.editor-content');
            if (ed) {
                ed.contentEditable = 'false';
                ed.style.cursor = 'grab';
                ed.style.userSelect = 'none';
            }
            widget.style.cursor = 'grab';
        }

        setTimeout(() => {
            const editor = widget.querySelector('.editor-content');
            const agenda = widget.querySelector('.agenda-list');
            const htmlContent = w.html ?? w.content ?? null;
            if (htmlContent) {
                if (agenda) { agenda.innerHTML = htmlContent; agenda.querySelectorAll('.agenda-item').forEach(attachAgendaItemEvents); }
                else if (editor) { editor.innerHTML = htmlContent; }
            }
            const iframe = widget.querySelector('iframe');
            if (w.iframeSrc && iframe) iframe.src = w.iframeSrc;
            // Restaurer le PDF depuis localStorage si disponible
            if (w.type === 'pdf' && w.pdfId) {
                widget.dataset.pdfId = w.pdfId;
                if (w.pdfName) widget.dataset.pdfName = w.pdfName;
                const base64 = localStorage.getItem(w.pdfId);
                if (base64) {
                    const container = widget.querySelector('.editor-container');
                    if (container) _showPdfInWidget(container, base64, w.pdfName || '');
                }
            }
            applyEditorStyleFromConfig(widget, w.editorStyle);
            scaleFontSizesFromRef(widget, refW);
            // Libérer isRestoringState une fois que tous les widgets ont leur contenu
            restoredCount++;
            if (restoredCount >= nonStickerCount) {
                isRestoringState = false;
            }
        }, 50);
    });
    // Si aucun widget non-sticker, libérer immédiatement
    if (nonStickerCount === 0) {
        isRestoringState = false;
    }
    if (parsed.shapes) {
        parsed.shapes.forEach(s => {
            const curW2 = window.innerWidth, curVH2 = virtualH(curW2);
            const sw = (s.wPercent / 100) * curW2, sh = (s.hPercent / 100) * curVH2;
            const lx = (s.leftPercent / 100) * curW2, ty = (s.topPercent / 100) * curVH2;
            const w2 = createShapeWidget(s.shapeType, s.strokeColor, s.fillColor, s.fillOpacity, sw, sh, lx + 'px', ty + 'px', false, s.strokeWidth || 4);
            if (s.transform) w2.style.transform = s.transform;
            if (s.flipX !== undefined) w2.dataset.flipX = s.flipX;
            if (s.flipY !== undefined) w2.dataset.flipY = s.flipY;
            const fsx = parseFloat(s.flipX || 1), fsy = parseFloat(s.flipY || 1);
            if (fsx !== 1 || fsy !== 1) {
                const svg2 = w2.querySelector('svg');
                if (svg2) {
                    svg2.style.transformBox    = 'fill-box';
                    svg2.style.transformOrigin = 'center center';
                    svg2.style.transform       = `scale(${fsx}, ${fsy})`;
                }
            }
            if (s.background) { w2.style.zIndex = 1; w2.dataset.background = "true"; }
            else if (s.pinned) bringToFront(w2, true);
            if (s.groupId) w2.dataset.groupId = s.groupId;
            w2.dataset.leftPercent = s.leftPercent; w2.dataset.topPercent = s.topPercent;
            w2.dataset.wPercent = s.wPercent; w2.dataset.hPercent = s.hPercent;
        });
    }
}

function exportConfig() {
    saveCurrentSceneData();
    const exportData = {
        scenes:       scenes,
        currentScene: currentScene,
        // Compatibilité avec l'ancien format (scène active)
        ...JSON.parse(scenes[currentScene].config || '{}')
    };
    const a = document.createElement('a');
    a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData));
    a.download = `lebureauduprof_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); a.remove();
}

function importConfig(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            // Format multi-scènes
            if (data.scenes && Array.isArray(data.scenes)) {
                scenes       = data.scenes;
                currentScene = data.currentScene || 0;
                saveScenesMeta();
                loadScene(currentScene);
                renderScenesBar();
            } else {
                // Format ancienne version (mono-scène)
                snapshotNow();
                document.querySelectorAll('.widget').forEach(w => w.remove());
                document.querySelectorAll('.shape-widget').forEach(w => w.remove());
                applyBackground(data.background || 'none');
                saveBg(data.background || 'none');
                const json = JSON.stringify(data);
                localStorage.setItem('profBoardConfig', json);
                scenes[currentScene].config = json;
                saveScenesMeta();
                restoreBoardFromJSON(json);
            }
            event.target.value = '';
        } catch(err) { showAlert('⚠️', 'Erreur d\'importation', err.message); }
    };
    reader.readAsText(file);
}

function clearBoard() { document.getElementById('modal-overlay').style.display = 'flex'; }
function closeModal() { document.getElementById('modal-overlay').style.display = 'none'; }
function confirmClearBoard() {
    snapshotNow();
    document.querySelectorAll('.widget').forEach(w => w.remove());
    document.querySelectorAll('.shape-widget').forEach(w => w.remove());
    // Effacer aussi les traits de dessin
    if (typeof strokes !== 'undefined') strokes = [];
    if (typeof selectedStrokes !== 'undefined') selectedStrokes = [];
    if (typeof redrawStrokes === 'function') redrawStrokes();
    saveBoard(); closeModal();
}


// updateClock / updateDateTime → widgets-datetime.js
