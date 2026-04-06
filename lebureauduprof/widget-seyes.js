// =========================================================================
// WIDGET ÉCRITURE SÉYÈS — Le Bureau du Prof
// Zone d'écriture cursive sur fond Séyès clair avec marge.
// Police BelleAllure alignée sur le lignage séyès (interligne = 16px,
// grande ligne = 64px).
//
// Règles Séyès :
//   • Corps de la lettre (minuscule sans jambage) = 1 interligne = 16px
//   • Boucles hautes (l, b, d, f, h, k…)         = 3 interlignes = 48px au-dessus de la ligne de base
//   • Barres hautes (t, d, p côté haut…)          = 2 interlignes = 32px au-dessus de la ligne de base
//   • Boucles basses (g, j, p, q, y, z…)         = 2 interlignes = 32px en-dessous de la ligne de base
//   • Ligne de base = grande ligne (toutes les 64px)
//
// La zone de texte est un <div contenteditable> transparent par-dessus
// le fond séyès, avec line-height = 64px (une grande ligne par ligne de texte)
// et font-size calé pour que les minuscules fassent exactement 16px de haut
// (soit 1 interligne).
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    // Déclaration de la police BelleAllureGS (une seule fois)
    if (!document.getElementById('bellealluregs-face')) {
        const ff = document.createElement('style');
        ff.id = 'bellealluregs-face';
        ff.textContent = `
            @font-face {
                font-family: 'BelleAllureGS';
                src: url('polices/BelleAllureGS-Gros.otf') format('opentype');
                font-weight: normal;
                font-style: normal;
                font-display: swap;
            }
        `;
        document.head.appendChild(ff);
    }

    // Réutiliser les helpers globaux si déjà injectés
    if (!window._wfMiniBarCollapse) {
        window._wfMiniBarCollapse = function(widget, label, opts) {
            const COLLAPSED_W = 300, COLLAPSED_H = 50, GAP = 10, MARGIN_TOP = 8;
            const onExpand = opts && opts.onExpand;
            widget.dataset.wfMiniSavedTop  = widget.style.top;
            widget.dataset.wfMiniSavedLeft = widget.style.left;
            widget.dataset.wfMiniSavedW    = widget.style.width  || '';
            widget.dataset.wfMiniSavedH    = widget.style.height || '';
            const others = Array.from(document.querySelectorAll('.widget')).filter(w =>
                w !== widget && w.querySelector('.wf-mini-bar')
            );
            const occupiedX = others.reduce((maxX, w) => Math.max(maxX, w.offsetLeft + COLLAPSED_W + GAP), MARGIN_TOP);
            widget.style.top          = MARGIN_TOP + 'px';
            widget.style.left         = occupiedX + 'px';
            widget.style.width        = COLLAPSED_W + 'px';
            widget.style.height       = COLLAPSED_H + 'px';
            widget.style.zIndex       = '9000';
            widget.style.background   = '#2a2a3e';
            widget.style.borderRadius = '8px';
            widget.style.border       = 'none';
            widget.style.display      = 'block';
            widget.style.overflow     = 'hidden';
            widget.style.padding      = '0';
            const wc = widget.querySelector('.widget-content');
            if (wc) { wc.style.padding = '0'; wc.style.background = 'transparent'; wc.style.borderRadius = '0'; }
            widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = 'none');
            const miniBar = document.createElement('div');
            miniBar.className = 'wf-mini-bar';
            miniBar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:' + COLLAPSED_H + 'px;display:flex;align-items:center;padding:0 8px;box-sizing:border-box;background:#2a2a3e;border-radius:8px;cursor:move;user-select:none;gap:6px;z-index:1;';
            const labelEl = document.createElement('span');
            labelEl.textContent = label;
            labelEl.style.cssText = 'font-size:11px;color:#ccc;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;pointer-events:none;';
            const expandBtn = document.createElement('button');
            expandBtn.title = 'Déplier';
            expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;position:relative;z-index:2;';
            expandBtn.addEventListener('pointerdown', (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('mousedown',   (e) => { e.stopPropagation(); });
            expandBtn.addEventListener('click', (e) => {
                e.stopPropagation(); e.preventDefault();
                widget.style.top          = widget.dataset.wfMiniSavedTop  || widget.style.top;
                widget.style.left         = widget.dataset.wfMiniSavedLeft || widget.style.left;
                widget.style.width        = widget.dataset.wfMiniSavedW    || '';
                widget.style.height       = widget.dataset.wfMiniSavedH    || '';
                widget.style.zIndex       = '';
                widget.style.background   = '';
                widget.style.borderRadius = '';
                widget.style.border       = '';
                widget.style.display      = '';
                widget.style.overflow     = '';
                widget.style.padding      = '';
                const wc2 = widget.querySelector('.widget-content');
                if (wc2) { wc2.style.padding = ''; wc2.style.background = ''; wc2.style.borderRadius = ''; }
                widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = '');
                miniBar.remove();
                const curW = window.innerWidth;
                const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (onExpand) onExpand();
                if (typeof saveBoard === 'function') saveBoard();
            });
            miniBar.appendChild(labelEl);
            miniBar.appendChild(expandBtn);
            widget.appendChild(miniBar);
            miniBar.addEventListener('pointerdown', (e) => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault();
                miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft;
                const startY = e.clientY - widget.offsetTop;
                const onMove = (ev) => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp = () => {
                    miniBar.removeEventListener('pointermove', onMove);
                    miniBar.removeEventListener('pointerup', onUp);
                    const curW = window.innerWidth;
                    const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove);
                miniBar.addEventListener('pointerup', onUp);
            });
            const curW = window.innerWidth;
            const curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
            widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
            widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
            if (typeof saveBoard === 'function') saveBoard();
        };
    }

    if (!document.getElementById('wf-btns-style')) {
        const ws = document.createElement('style');
        ws.id = 'wf-btns-style';
        ws.textContent = `
    .wf-btns { display:flex; gap:5px; align-items:center; flex-shrink:0; }
    .wf-btn { width:13px; height:13px; border-radius:50%; border:none; cursor:pointer;
        display:flex; align-items:center; justify-content:center; font-size:0;
        transition:filter .15s, transform .1s; flex-shrink:0; position:relative; }
    .wf-btn:hover { filter:brightness(0.82); transform:scale(1.15); }
    .wf-btn:active { transform:scale(0.92); }
    .wf-btn-min   { background:#febc2e; }
    .wf-btn-max   { background:#28c840; }
    .wf-btn-close { background:#ff5f57; }
    .wf-btns:hover .wf-btn::after { font-size:8px; font-weight:900; color:rgba(0,0,0,0.5); line-height:1; }
    .wf-btns:hover .wf-btn-min::after   { content:'−'; }
    .wf-btns:hover .wf-btn-max::after   { content:'⤢'; font-size:7px; }
    .wf-btns:hover .wf-btn-close::after { content:'×'; font-size:10px; }
        `;
        document.head.appendChild(ws);
    }

    if (!document.getElementById('widget-seyes-style')) {
        const s = document.createElement('style');
        s.id = 'widget-seyes-style';

        // ── Variables Séyès ──────────────────────────────────────────────
        // Grande ligne  : 64px  (= 4 interlignes)
        // Interligne    : 16px  (= corps de la lettre minuscule)
        // Marge rouge   : à 256px du bord gauche (identique au preset bg)
        // Corps police  : font-size calibré pour que x-height ≈ 16px
        //   → BelleAllure a un x-height ratio ≈ 0.45, donc font-size = 16/0.45 ≈ 36px
        //   → On ajuste avec padding-top pour caler la ligne de base sur la grande ligne

        s.textContent = `
        /* ── Conteneur principal ─────────────────────────── */
        .widget[data-type="seyes"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }

        .seyes-container {
            background-color: #fafcff;
            outline: none;
            border: 1.5px solid #c8d8eb;
            border-radius: 4px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 2px 12px rgba(0,0,0,0.10);
            position: relative;
            overflow: hidden;
        }

        /* ── En-tête / barre d'édition ──────────────────── */
        .seyes-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            padding: 6px 10px;
            background: rgba(255,254,245,0.95);
            border-bottom: 1px solid #d4e4f0;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
            z-index: 2;
            backdrop-filter: blur(2px);
        }

        .seyes-title {
            font-size: 12px;
            font-weight: 800;
            color: #4a6580;
            letter-spacing: 0.3px;
            pointer-events: none;
            flex-shrink: 0;
        }

        /* ── Barre d'outils texte ────────────────────────── */
        .seyes-toolbar {
            display: flex;
            align-items: center;
            gap: 4px;
            flex: 1;
            flex-wrap: wrap;
            justify-content: center;
        }

        .seyes-tool-btn {
            padding: 3px 8px;
            border-radius: 5px;
            border: 1px solid #d0dcea;
            background: #f0f5fa;
            color: #4a6580;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, border-color .15s;
            line-height: 1.4;
            white-space: nowrap;
        }
        .seyes-tool-btn:hover { background: #ddeaf5; border-color: #9aadbe; }
        .seyes-tool-btn:active { transform: scale(0.95); }
        .seyes-tool-btn.active { background: #9aadbe; color: #fff; border-color: #7a9ab0; }

        .seyes-sep {
            width: 1px;
            height: 20px;
            background: #d0dcea;
            flex-shrink: 0;
            margin: 0 2px;
        }

        /* ── Zone d'écriture ─────────────────────────────── */
        .seyes-writing-area {
            flex: 1;
            position: relative;
            overflow-x: hidden;
            overflow-y: auto;
            min-height: 192px;
            background-color: #fafcff;
        }

        /* Couche de fond (derrière l'éditeur, grandit avec lui) */
        .seyes-bg-layer {
            position: absolute;
            top: 0; left: 0; right: 0;
            min-height: 100%;
            pointer-events: none;
            z-index: 0;
        }

        /* Le contenteditable principal — commence APRÈS la marge */
        .seyes-editor {
            position: absolute;
            top: 0; right: 0;
            left: 256px;
            min-height: 100%;
            line-height: 64px;
            padding: 0 16px 0 16px;
            box-sizing: border-box;
            background: transparent;
            outline: none;
            cursor: text;
            color: #1a1a2e;
            font-family: 'BelleAllureGS', cursive;
            font-size: 36px;
            word-break: break-word;
            overflow-wrap: break-word;
            white-space: pre-wrap;
            user-select: text;
            -webkit-user-select: text;
            min-height: 192px;
            -webkit-line-break: after-white-space;
            z-index: 2;
        }

        /* Zone d'écriture dans la marge */
        .seyes-editor-marge {
            position: absolute;
            top: 0; left: 0;
            width: max-content;
            max-width: none;
            min-height: 100%;
            padding: 2px 8px 0 8px;
            box-sizing: border-box;
            background: transparent;
            outline: none;
            cursor: default;
            color: #1a1a2e;
            font-family: 'BelleAllureGS', cursive;
            font-size: 36px;
            line-height: 64px;
            white-space: nowrap;
            word-break: normal;
            overflow-wrap: normal;
            overflow: visible;
            user-select: none;
            -webkit-user-select: none;
            pointer-events: none;
            z-index: 2;
        }
        .seyes-editor-marge.active {
            pointer-events: auto;
            cursor: text;
            user-select: text;
            -webkit-user-select: text;
        }
        .seyes-editor-marge:empty::before {
            content: attr(data-placeholder);
            color: #c8d8eb;
            font-style: italic;
            pointer-events: none;
        }

        /* Calque invisible qui capte les clics dans la marge */
        .seyes-marge-catcher {
            position: absolute;
            top: 0; left: 0;
            width: 256px;
            min-height: 100%;
            cursor: text;
            z-index: 3;
            background: transparent;
        }
        /* Quand la marge est active, le catcher s'efface pour laisser passer les clics à editorMarge */
        .seyes-editor-marge.active ~ .seyes-marge-catcher,
        .seyes-marge-catcher.hidden {
            display: none;
        }

        .seyes-editor:empty::before {
            content: attr(data-placeholder);
            color: #b0c4d8;
            font-style: italic;
            pointer-events: none;
        }

        /* ── Barre de redimensionnement ─────────────────── */
        .seyes-resize-handle {
            position: absolute;
            right: 0; bottom: 0;
            width: 18px; height: 18px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #9aadbe 50%);
            border-radius: 0 0 2px 0;
            opacity: 0;
            transition: opacity .2s;
            z-index: 5;
        }
        .seyes-container:hover .seyes-resize-handle { opacity: 0.7; }
        .seyes-resize-handle:hover { opacity: 1 !important; }

        /* ── État réduit ────────────────────────────────── */
        .seyes-container.wf-minimized > *:not(.seyes-header) { display: none !important; }
        .seyes-container.wf-minimized { gap: 0; }

        /* ── État plein écran board ─────────────────────── */
        .seyes-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto;
        }
        .seyes-container.wf-fullboard .seyes-writing-area { flex: 1; min-height: unset; }
        .seyes-container.wf-fullboard .seyes-editor { min-height: unset; }

        /* ── Modale confirmation effacement ─────────────── */
        .seyes-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(30, 40, 60, 0.45);
            backdrop-filter: blur(3px);
            -webkit-backdrop-filter: blur(3px);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: seyes-modal-fadein .18s ease;
        }
        @keyframes seyes-modal-fadein {
            from { opacity: 0; }
            to   { opacity: 1; }
        }
        .seyes-modal {
            background: #fafcff;
            border-radius: 16px;
            box-shadow: 0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.10);
            padding: 32px 36px 28px;
            min-width: 320px;
            max-width: 420px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 12px;
            animation: seyes-modal-popin .22s cubic-bezier(.34,1.56,.64,1);
            border: 1.5px solid #d4e4f0;
        }
        @keyframes seyes-modal-popin {
            from { opacity: 0; transform: scale(.88) translateY(12px); }
            to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .seyes-modal-icon {
            font-size: 38px;
            line-height: 1;
            margin-bottom: 4px;
        }
        .seyes-modal-title {
            font-size: 16px;
            font-weight: 800;
            color: #2c3e50;
            text-align: center;
            letter-spacing: 0.2px;
        }
        .seyes-modal-body {
            font-size: 13px;
            color: #7a9ab0;
            text-align: center;
            line-height: 1.5;
        }
        .seyes-modal-btns {
            display: flex;
            gap: 10px;
            margin-top: 8px;
        }
        .seyes-modal-btn {
            padding: 9px 24px;
            border-radius: 10px;
            border: none;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: transform .1s, filter .15s;
        }
        .seyes-modal-btn:hover  { filter: brightness(.92); }
        .seyes-modal-btn:active { transform: scale(.96); }
        .seyes-modal-btn-cancel {
            background: #eef2f7;
            color: #4a6580;
        }
        .seyes-modal-btn-confirm {
            background: #e05050;
            color: #fff;
        }

        /* ── Bouton aide ─────────────────────────────────── */
        .seyes-help-btn {
            width: 18px; height: 18px;
            border-radius: 50%;
            border: 1.5px solid #9aadbe;
            background: #eef5fb;
            color: #4a7a9b;
            font-size: 11px;
            font-weight: 800;
            cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            flex-shrink: 0;
            transition: background .15s, border-color .15s;
            line-height: 1;
            padding: 0;
        }
        .seyes-help-btn:hover { background: #c8d8eb; border-color: #7a9ab0; }

        /* ── Modale aide ─────────────────────────────────── */
        .seyes-help-modal {
            background: #fafcff;
            border-radius: 18px;
            box-shadow: 0 8px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.10);
            padding: 28px 32px 24px;
            width: 460px;
            max-width: calc(100vw - 32px);
            display: flex;
            flex-direction: column;
            gap: 16px;
            animation: seyes-modal-popin .22s cubic-bezier(.34,1.56,.64,1);
            border: 1.5px solid #d4e4f0;
        }
        .seyes-help-modal-title {
            font-size: 17px;
            font-weight: 800;
            color: #2c3e50;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .seyes-help-section {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .seyes-help-section-title {
            font-size: 12px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #9aadbe;
        }
        .seyes-help-row {
            display: flex;
            align-items: flex-start;
            gap: 10px;
            font-size: 12.5px;
            color: #4a6580;
            line-height: 1.5;
        }
        .seyes-help-row-icon {
            font-size: 16px;
            flex-shrink: 0;
            margin-top: 1px;
        }
        .seyes-help-close {
            align-self: center;
            margin-top: 4px;
            padding: 8px 28px;
            border-radius: 10px;
            border: none;
            background: #4a7a9b;
            color: #fff;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            transition: filter .15s;
        }
        .seyes-help-close:hover { filter: brightness(.9); }
        `;
        document.head.appendChild(s);
    }
})();

// ── Création du widget ────────────────────────────────────────────────────
function createSeyesWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'seyes';
    widget.dataset.transparent = 'true';
    widget.style.cssText = `left:${pos.x}px; top:${pos.y}px; overflow:visible; flex-direction:row;`;
    widget.tabIndex = 0;

    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle" onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle" onclick="togglePin(this.closest('.widget'))" title="Épingler">📌</div>
            <div class="widget-back-handle" onclick="sendToBack(this.closest('.widget'))" title="Envoyer derrière">🔽</div>
            <div class="widget-close-handle" onclick="snapshotNow();this.closest('.widget').remove();saveBoard();" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>
    `;

    // ── Conteneur principal ───────────────────────────────────────────────
    const container = document.createElement('div');
    container.className = 'seyes-container';

    const initW = Math.round(window.innerWidth * 0.72);
    container.style.width  = initW + 'px';
    container.style.height = (640 + 40) + 'px'; // 10 grandes lignes (640px) + header (~40px)

    // ── En-tête ───────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'seyes-header';
    header.innerHTML = `
        <span class="seyes-title">✏️ Écriture Séyès</span>
        <div class="seyes-toolbar" id="seyes-toolbar-inner"></div>
        <div class="wf-btns" style="margin-left:4px">
            <button class="seyes-help-btn" data-role="wf-pdf"  title="Exporter / Imprimer" style="width:auto;padding:0 6px;border-radius:6px;font-size:10px;font-weight:800;letter-spacing:0.3px;border-color:#c8d8eb;">PDF</button>
            <button class="seyes-help-btn" data-role="wf-help" title="Aide">?</button>
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);

    const toolbar = header.querySelector('#seyes-toolbar-inner');

    // ── Barre d'outils ────────────────────────────────────────────────────
    // Couleur du texte via cpick
    const seyesCpickId = 'seyes-color-' + Date.now(); // id unique par instance
    const colorWrap = document.createElement('div');
    colorWrap.className = 'seyes-color-wrap cpick-wrap';
    colorWrap.id = 'cpick-' + seyesCpickId;
    colorWrap.title = 'Couleur du texte';
    colorWrap.innerHTML = `
        <div class="cpick-swatch seyes-color-swatch" style="background:#1a1a2e;width:22px;height:22px;border-radius:50%;border:2px solid #d0dcea;cursor:pointer;flex-shrink:0;"
             onclick="cpickOpen('${seyesCpickId}', this)"></div>
        <div class="cpick-popup" id="cpick-pop-${seyesCpickId}"></div>
    `;
    toolbar.appendChild(colorWrap);

    // Initialiser cpick et brancher l'action couleur sur la sélection
    const _origDispatch = window.cpickDispatch;
    let _seyesSavedSelection = null; // sélection sauvegardée avant ouverture du picker

    const _seyesCpickHandler = (id, color) => {
        if (id === seyesCpickId) {
            const swatch = colorWrap.querySelector('.cpick-swatch');
            if (swatch) swatch.style.background = color;
            // Restaurer la sélection et appliquer la couleur au texte sélectionné
            if (_seyesSavedSelection) {
                const sel = window.getSelection();
                sel.removeAllRanges();
                sel.addRange(_seyesSavedSelection);
            }
            // Si une sélection existe → colorier uniquement le texte sélectionné
            // Sinon → changer la couleur par défaut de l'éditeur actif
            const sel = window.getSelection();
            if (sel && !sel.isCollapsed) {
                document.execCommand('foreColor', false, color);
            } else {
                const activeEd = document.activeElement;
                const targetEd = (activeEd === editorMarge || editorMarge.contains(activeEd)) ? editorMarge : editor;
                targetEd.style.color = color;
            }
            saveBoard();
        } else if (typeof _origDispatch === 'function') {
            _origDispatch(id, color);
        }
    };
    window.cpickDispatch = _seyesCpickHandler;

    // Sauvegarder la sélection juste avant l'ouverture du picker
    colorWrap.addEventListener('mousedown', () => {
        const sel = window.getSelection();
        _seyesSavedSelection = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
    });

    // Séparateur
    const sep1 = document.createElement('div');
    sep1.className = 'seyes-sep';
    toolbar.appendChild(sep1);

    // Police : label fixe
    const fontLabel = document.createElement('span');
    fontLabel.textContent = 'BelleAllureGS';
    fontLabel.style.cssText = 'font-size:11px;color:#7a9ab0;white-space:nowrap;font-style:italic;';
    toolbar.appendChild(fontLabel);

    // Séparateur
    const sep2 = document.createElement('div');
    sep2.className = 'seyes-sep';
    toolbar.appendChild(sep2);

    // Gras / Italique
    [
        { cmd: 'bold',   label: 'G', title: 'Gras (Ctrl+B)',     style: 'font-weight:700;' },
        { cmd: 'italic', label: 'I', title: 'Italique (Ctrl+I)', style: 'font-style:italic;' },
    ].forEach(({ cmd, label, title, style }) => {
        const btn = document.createElement('button');
        btn.className = 'seyes-tool-btn';
        btn.title = title;
        btn.innerHTML = `<span style="${style}">${label}</span>`;
        btn.addEventListener('mousedown', (e) => {
            e.preventDefault(); e.stopPropagation();
            const activeEd = document.activeElement;
            const targetEd = (activeEd === editorMarge || editorMarge.contains(activeEd)) ? editorMarge : editor;
            targetEd.focus();
            document.execCommand(cmd, false, null);
            saveBoard();
        });
        toolbar.appendChild(btn);
    });

    // Souligné + swatch couleur de soulignage (groupés visuellement)
    let _underlineColor = '#1a1a2e';

    const underlineGroup = document.createElement('div');
    underlineGroup.style.cssText = 'display:flex;align-items:center;gap:2px;';

    const underlineBtn = document.createElement('button');
    underlineBtn.className = 'seyes-tool-btn';
    underlineBtn.title = 'Souligné (Ctrl+U)';
    underlineBtn.innerHTML = `<span style="text-decoration:underline;">S</span>`;
    underlineBtn.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const activeEd = document.activeElement;
        const targetEd = (activeEd === editorMarge || editorMarge.contains(activeEd)) ? editorMarge : editor;
        // Sauvegarder la sélection
        const sel = window.getSelection();
        const savedRange = (sel && sel.rangeCount > 0) ? sel.getRangeAt(0).cloneRange() : null;
        if (!savedRange || savedRange.collapsed) {
            // Pas de sélection : basculer le soulignage standard
            targetEd.focus();
            document.execCommand('underline', false, null);
        } else {
            // Sélection : appliquer un span avec text-decoration-color
            targetEd.focus();
            sel.removeAllRanges();
            sel.addRange(savedRange);
            const span = document.createElement('span');
            span.style.textDecoration = 'underline';
            span.style.textDecorationColor = _underlineColor;
            try {
                savedRange.surroundContents(span);
            } catch(err) {
                // surroundContents échoue si la sélection coupe des balises
                document.execCommand('underline', false, null);
            }
        }
        saveBoard();
    });
    underlineGroup.appendChild(underlineBtn);

    // Swatch couleur de soulignage
    const seyesUlCpickId = 'seyes-ul-' + Date.now();
    const ulColorWrap = document.createElement('div');
    ulColorWrap.className = 'cpick-wrap';
    ulColorWrap.id = 'cpick-' + seyesUlCpickId;
    ulColorWrap.title = 'Couleur du soulignage';
    ulColorWrap.innerHTML = `
        <div class="cpick-swatch" style="background:#1a1a2e;width:14px;height:14px;border-radius:3px;border:1.5px solid #d0dcea;cursor:pointer;flex-shrink:0;margin-bottom:-1px;"
             onclick="cpickOpen('${seyesUlCpickId}', this)"></div>
        <div class="cpick-popup" id="cpick-pop-${seyesUlCpickId}"></div>
    `;
    // Brancher l'action couleur de soulignage
    const _origDispatch2 = window.cpickDispatch;
    window.cpickDispatch = (id, color) => {
        if (id === seyesUlCpickId) {
            _underlineColor = color;
            const ulSwatch = ulColorWrap.querySelector('.cpick-swatch');
            if (ulSwatch) ulSwatch.style.background = color;
            // Mettre à jour le bas du bouton S pour refléter la couleur
            underlineBtn.querySelector('span').style.textDecorationColor = color;
            saveBoard();
        } else {
            window.cpickDispatch._prev(id, color);
        }
    };
    window.cpickDispatch._prev = _origDispatch2;

    underlineGroup.appendChild(ulColorWrap);
    toolbar.appendChild(underlineGroup);

    // Séparateur
    const sep4 = document.createElement('div');
    sep4.className = 'seyes-sep';
    toolbar.appendChild(sep4);

    // Effacer tout
    const clearBtn = document.createElement('button');
    clearBtn.className = 'seyes-tool-btn';
    clearBtn.textContent = '🗑️';
    clearBtn.title = 'Effacer tout le texte';
    clearBtn.addEventListener('click', () => {
        // Modale de confirmation
        const overlay = document.createElement('div');
        overlay.className = 'seyes-modal-overlay';
        overlay.innerHTML = `
            <div class="seyes-modal">
                <div class="seyes-modal-icon">🗑️</div>
                <div class="seyes-modal-title">Effacer tout le texte ?</div>
                <div class="seyes-modal-body">Cette action supprimera tout ce qui a été écrit,<br>y compris dans la marge.</div>
                <div class="seyes-modal-btns">
                    <button class="seyes-modal-btn seyes-modal-btn-cancel">Annuler</button>
                    <button class="seyes-modal-btn seyes-modal-btn-confirm">Effacer</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);
        // Focus sur Annuler par défaut
        const cancelBtn = overlay.querySelector('.seyes-modal-btn-cancel');
        const confirmBtn = overlay.querySelector('.seyes-modal-btn-confirm');
        cancelBtn.focus();
        cancelBtn.addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        confirmBtn.addEventListener('click', () => {
            overlay.remove();
            editor.innerHTML = '';
            editorMarge.innerHTML = '';
            editor.focus();
            saveBoard();
        });
        // Fermer avec Échap
        overlay.addEventListener('keydown', (e) => { if (e.key === 'Escape') overlay.remove(); });
    });
    toolbar.appendChild(clearBtn);

    // ── Zone d'écriture ───────────────────────────────────────────────────
    const writingArea = document.createElement('div');
    writingArea.className = 'seyes-writing-area';

    const editor = document.createElement('div');
    editor.className = 'seyes-editor';
    editor.contentEditable = 'true';
    editor.dataset.placeholder = 'Écris ici…';
    editor.setAttribute('spellcheck', 'true');

    // Taille initiale : Normal (36px / 64px line-height)
    const LH = 64;
    const pt = _seyesPaddingTop(36, LH);
    editor.style.fontSize   = '36px';
    editor.style.lineHeight = LH + 'px';
    editor.style.paddingTop = pt + 'px';

    // ── Fond séyès SVG tile ───────────────────────────────────────────────
    // Deux SVG tiles appliqués sur writingArea :
    // - svgMarge (sans colonnes) couvre toute la largeur depuis x=0
    // - svgCols  (avec colonnes) couvre depuis x=256px
    // offsetY = pt - (LH - 1) place la grande ligne (bas du tile) sur la baseline
    function _seyesMakeBg() {
        const il = LH / 4;
        // Grande ligne en bas du tile, à y = LH - 1
        const lignes = (withCol) => {
            const col = withCol
                ? `<line x1="${LH - 0.5}" y1="0" x2="${LH - 0.5}" y2="${LH}" stroke="#c8d8eb" stroke-width="0.8"/>`
                : '';
            return [
                `<svg xmlns="http://www.w3.org/2000/svg" width="${LH}" height="${LH}">`,
                `<line x1="0" y1="${il * 1}" x2="${LH}" y2="${il * 1}" stroke="#c8d8eb" stroke-width="0.7"/>`,
                `<line x1="0" y1="${il * 2}" x2="${LH}" y2="${il * 2}" stroke="#c8d8eb" stroke-width="0.7"/>`,
                `<line x1="0" y1="${il * 3}" x2="${LH}" y2="${il * 3}" stroke="#c8d8eb" stroke-width="0.7"/>`,
                `<line x1="0" y1="${LH - 0.5}" x2="${LH}" y2="${LH - 0.5}" stroke="#9aadbe" stroke-width="1"/>`,
                col,
                `</svg>`
            ].join('');
        };

        const enc = (svg) => 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")';
        const urlMarge = enc(lignes(false));
        const urlCols  = enc(lignes(true));
        const urlRed   = 'linear-gradient(to right, transparent 254px, #e05050 254px, #e05050 256px, transparent 256px)';

        // offsetY : la grande ligne (y=LH-1 dans le tile) doit coïncider avec
        // la baseline de la 1ère ligne de texte (y = pt dans writingArea,
        // car le paddingTop de l'éditeur = pt et la baseline ≈ bas de la zone corps)
        // On veut : offsetY + (LH - 1) = pt  →  offsetY = pt - LH + 1
        const offsetY = pt - LH + 170;

        writingArea.style.backgroundImage    = `${urlRed}, ${urlMarge}, ${urlCols}`;
        writingArea.style.backgroundSize     = `100% 100%, ${LH}px ${LH}px, ${LH}px ${LH}px`;
        writingArea.style.backgroundRepeat   = 'no-repeat, repeat, repeat';
        writingArea.style.backgroundPosition = `0 0, 0 ${offsetY}px, 256px ${offsetY}px`;
        writingArea.style.backgroundAttachment = 'local, local, local';
    }
    _seyesMakeBg();

    writingArea.appendChild(editor);

    // ── Zone d'écriture dans la marge ─────────────────────────────────────
    const editorMarge = document.createElement('div');
    editorMarge.className = 'seyes-editor-marge';
    editorMarge.contentEditable = 'true';
    editorMarge.dataset.placeholder = '…';
    editorMarge.setAttribute('spellcheck', 'true');
    editorMarge.style.fontSize   = '36px';
    editorMarge.style.lineHeight = '64px';
    editorMarge.style.paddingTop = _seyesPaddingTop(36, 64) + 'px';
    writingArea.appendChild(editorMarge);

    // Calque transparent qui capte les clics dans la zone marge
    const margeCatcher = document.createElement('div');
    margeCatcher.className = 'seyes-marge-catcher';
    writingArea.appendChild(margeCatcher);

    container.appendChild(writingArea);

    // ── Handle redimensionnement ─────────────────────────────────────────
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'seyes-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── Interactions éditeur ──────────────────────────────────────────────

    // Éditeur principal (zone après la marge)
    editor.addEventListener('mousedown', (e) => { e.stopPropagation(); });
    editor.addEventListener('click',     (e) => { e.stopPropagation(); editor.focus(); });
    editor.addEventListener('keydown',   (e) => { e.stopPropagation(); });
    editor.addEventListener('input',     ()  => { saveBoard(); });
    editor.addEventListener('focus', () => {
        editorMarge.classList.remove('active');
        margeCatcher.classList.remove('hidden');
    });

    // Calque marge-catcher : capte le premier clic dans la zone marge
    margeCatcher.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        editorMarge.classList.add('active');
        margeCatcher.classList.add('hidden');
        editorMarge.focus();
        // Placer le curseur à la position exacte du clic
        const placeCaretAt = (x, y) => {
            if (document.caretRangeFromPoint) {
                const range = document.caretRangeFromPoint(x, y);
                if (range) { const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range); }
            } else if (document.caretPositionFromPoint) {
                const pos = document.caretPositionFromPoint(x, y);
                if (pos) {
                    const range = document.createRange();
                    range.setStart(pos.offsetNode, pos.offset);
                    range.collapse(true);
                    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(range);
                }
            }
        };
        placeCaretAt(e.clientX, e.clientY);
    });

    // Éditeur marge
    editorMarge.addEventListener('mousedown', (e) => { e.stopPropagation(); });
    editorMarge.addEventListener('click',     (e) => { e.stopPropagation(); });
    editorMarge.addEventListener('keydown',   (e) => { e.stopPropagation(); });
    editorMarge.addEventListener('input',     ()  => { saveBoard(); });
    editorMarge.addEventListener('blur', () => {
        setTimeout(() => {
            if (document.activeElement !== editorMarge) {
                editorMarge.classList.remove('active');
                margeCatcher.classList.remove('hidden');
            }
        }, 100);
    });

    editor.addEventListener('paste', (e) => {
        // Coller en texte brut uniquement
        e.preventDefault();
        const text = (e.clipboardData || window.clipboardData).getData('text/plain');
        document.execCommand('insertText', false, text);
    });

    // ── Redimensionnement ─────────────────────────────────────────────────
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth;
        const startH = container.offsetHeight;
        document.onmousemove = (ev) => {
            const newW = Math.max(400, startW + ev.clientX - startX);
            const newH = Math.max(128, startH + ev.clientY - startY);
            container.style.width  = newW + 'px';
            container.style.height = newH + 'px';
        };
        document.onmouseup = () => { document.onmousemove = null; saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', (e) => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth;
        const startH = container.offsetHeight;
        function onMove(ev) {
            const t = ev.touches[0];
            const newW = Math.max(400, startW + t.clientX - startX);
            const newH = Math.max(128, startH + t.clientY - startY);
            container.style.width  = newW + 'px';
            container.style.height = newH + 'px';
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    // ── Boutons fenêtre ───────────────────────────────────────────────────
    const wfPdf   = header.querySelector('[data-role="wf-pdf"]');
    const wfHelp  = header.querySelector('[data-role="wf-help"]');
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');

    let _isMax = false;

    if (wfPdf) {
        wfPdf.addEventListener('click', (e) => {
            e.stopPropagation();

            const fontUrl      = new URL('polices/BelleAllureGS-Gros.otf', window.location.href).href;
            const editorHTML   = editor.innerHTML  || '';
            const margeHTML    = editorMarge.innerHTML || '';
            const hasMargeContent = editorMarge.textContent.trim().length > 0;

            // ── Dimensions page A4 à 96dpi ──────────────────────────────
            // A4 = 210×297mm. Zone imprimable avec marges 15/12mm :
            //   largeur = 210 - 24 = 186mm = ~703px
            //   hauteur = 297 - 30 = 252mm = ~953px
            // Grande ligne séyès = 8mm = ~30.24px → on arrondit à 30px
            const LINE_H   = 30;   // px — 1 grande ligne (4 interlignes)
            const IL       = LINE_H / 4; // 7.5px — 1 interligne
            const PAGE_W   = 703;  // px zone imprimable
            const PAGE_H   = 953;  // px zone imprimable
            const MARGE_X  = 128;  // px — largeur marge (≈34mm)
            const NB_LINES = Math.floor(PAGE_H / LINE_H);

            // ── Génération SVG du fond séyès ─────────────────────────────
            // On génère un SVG de PAGE_W × PAGE_H avec toutes les lignes
            let svgLines = '';
            for (let i = 0; i <= NB_LINES; i++) {
                const y = i * LINE_H;
                // Grande ligne (bleue foncée) — toute la largeur
                svgLines += `<line x1="0" y1="${y}" x2="${PAGE_W}" y2="${y}" stroke="#9aadbe" stroke-width="0.8"/>`;
                if (i < NB_LINES) {
                    // 3 interlignes (bleue claire) — toute la largeur (marge incluse)
                    for (let j = 1; j <= 3; j++) {
                        const yil = y + j * IL;
                        svgLines += `<line x1="0" y1="${yil}" x2="${PAGE_W}" y2="${yil}" stroke="#c8d8eb" stroke-width="0.5"/>`;
                    }
                }
            }
            // Colonnes verticales (après la marge, toutes les LINE_H px)
            for (let x = MARGE_X + LINE_H; x < PAGE_W; x += LINE_H) {
                svgLines += `<line x1="${x}" y1="0" x2="${x}" y2="${PAGE_H}" stroke="#c8d8eb" stroke-width="0.5"/>`;
            }
            // Ligne rouge de marge
            svgLines += `<line x1="${MARGE_X}" y1="0" x2="${MARGE_X}" y2="${PAGE_H}" stroke="#e05050" stroke-width="1.2"/>`;

            const bgSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${PAGE_W}" height="${PAGE_H}">${svgLines}</svg>`;
            const bgSvgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(bgSvg);

            // ── Alignement baseline sur la grande ligne ──────────────────
            // La première grande ligne est à y=LINE_H (pas y=0).
            // baseline = top + ascent  →  top = LINE_H - ascent
            // ascent BelleAllureGS ≈ 0.80 * fontSize
            const fsPrint  = Math.round(LINE_H * 0.62); // légèrement plus grand que 36/64
            const ascent   = fsPrint * 1.0;
            const ptPrint  = Math.round(LINE_H - ascent);  // top du bloc texte

            const printHTML = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Écriture Séyès</title>
<style>
    @font-face {
        font-family: 'BelleAllureGS';
        src: url('${fontUrl}') format('opentype');
        font-display: block;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page { size: A4 portrait; margin: 15mm 12mm 15mm 12mm; }
    html, body { width: ${PAGE_W}px; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page {
        position: relative;
        width: ${PAGE_W}px;
        min-height: ${PAGE_H}px;
        background-color: #fafcff;
        background-image: url('${bgSvgUrl}');
        background-repeat: no-repeat;
        background-size: ${PAGE_W}px ${PAGE_H}px;
        background-position: top left;
    }
    .print-editor {
        position: absolute;
        top: ${ptPrint}px;
        left: ${MARGE_X + 8}px;
        right: 0;
        font-family: 'BelleAllureGS', cursive;
        font-size: ${fsPrint}px;
        line-height: ${LINE_H}px;
        color: #1a1a2e;
        white-space: pre-wrap;
        word-break: break-word;
        overflow-wrap: break-word;
    }
    .print-editor div, .print-editor p,
    .print-marge div, .print-marge p {
        margin: 0; padding: 0;
        min-height: ${LINE_H}px;
        line-height: ${LINE_H}px;
    }
    .print-marge {
        position: absolute;
        top: ${ptPrint}px;
        left: 4px;
        width: ${MARGE_X - 6}px;
        font-family: 'BelleAllureGS', cursive;
        font-size: ${fsPrint}px;
        line-height: ${LINE_H}px;
        color: #1a1a2e;
        white-space: nowrap;
        overflow: visible;
    }
</style>
</head>
<body>
<div class="page">
    <div class="print-editor">${editorHTML}</div>
    ${hasMargeContent ? `<div class="print-marge">${margeHTML}</div>` : ''}
</div>
</body>
</html>`;

            const printWin = window.open('', '_blank', 'width=794,height=1123');
            if (!printWin) {
                alert('Le navigateur a bloqué la fenêtre popup. Autorisez les popups pour ce site.');
                return;
            }
            printWin.document.write(printHTML);
            printWin.document.close();
            printWin.onload = () => {
                // Délai pour laisser la police se charger
                setTimeout(() => { printWin.focus(); printWin.print(); }, 800);
            };
        });
    }

    if (wfHelp) {
        wfHelp.addEventListener('click', (e) => {
            e.stopPropagation();
            const overlay = document.createElement('div');
            overlay.className = 'seyes-modal-overlay';
            overlay.innerHTML = `
                <div class="seyes-help-modal">
                    <div class="seyes-help-modal-title">✏️ Aide — Écriture Séyès</div>

                    <div class="seyes-help-section">
                        <div class="seyes-help-section-title">Le lignage</div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">📏</span><span>Le fond reproduit un vrai séyès : 3 petits interlignes (16 px) pour 1 grande ligne (64 px). Les boucles hautes montent sur 3 interlignes, les barres (t, d…) sur 2, les jambages descendent sur 2.</span></div>
                    </div>

                    <div class="seyes-help-section">
                        <div class="seyes-help-section-title">Écrire dans la marge</div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">🖊️</span><span>Par défaut, le curseur se place après la ligne rouge. Pour écrire <strong>dans la marge</strong> (date, numéro…), cliquez à gauche de la ligne rouge : la zone marge s'active. Le texte déborde naturellement vers la droite si besoin.</span></div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">↩️</span><span>Pour revenir à l'écriture principale, cliquez à droite de la ligne rouge.</span></div>
                    </div>

                    <div class="seyes-help-section">
                        <div class="seyes-help-section-title">Mise en forme</div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">🎨</span><span>Sélectionnez un mot et cliquez sur le <strong>swatch couleur</strong> pour colorier uniquement ce mot. Sans sélection, cela change la couleur de tout l'éditeur.</span></div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon"><span style="text-decoration:underline;font-size:13px;">S</span></span><span>Le petit carré à côté du <u>S</u> permet de choisir la couleur du soulignage indépendamment de la couleur du texte.</span></div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">⌨️</span><span><strong>Ctrl+B</strong> gras · <strong>Ctrl+I</strong> italique · <strong>Ctrl+U</strong> souligné</span></div>
                    </div>

                    <div class="seyes-help-section">
                        <div class="seyes-help-section-title">Fenêtre</div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">🟢</span><span>Plein écran / fenêtré — la poignée ↘ en bas à droite redimensionne le widget.</span></div>
                        <div class="seyes-help-row"><span class="seyes-help-row-icon">🟡</span><span>Réduit le widget en mini-barre déplaçable en haut de l'écran.</span></div>
                    </div>

                    <button class="seyes-help-close">Compris !</button>
                </div>
            `;
            document.body.appendChild(overlay);
            overlay.querySelector('.seyes-help-close').addEventListener('click', () => overlay.remove());
            overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.remove(); });
            overlay.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') overlay.remove(); });
        });
    }

    if (wfMin) {
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_isMax) wfMax.click();
            // Sauvegarder la largeur du container avant de réduire
            const savedContainerW = container.offsetWidth + 'px';
            // Synchroniser la taille du widget avec le container
            // (_wfMiniBarCollapse lit/écrit widget.style.width/height)
            widget.style.width  = container.offsetWidth  + 'px';
            widget.style.height = container.offsetHeight + 'px';
            // Masquer le container pour que overflow:hidden fonctionne proprement
            container.style.display = 'none';
            window._wfMiniBarCollapse(widget, '✏️ Écriture Séyès', {
                onExpand: () => {
                    // Restaurer la largeur sur le container, pas sur le widget
                    container.style.width   = savedContainerW;
                    container.style.display = '';
                    widget.style.width      = '';
                    widget.style.height     = '';
                }
            });
        });
    }

    if (wfMax) {
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            _isMax = !_isMax;
            if (_isMax) {
                container.classList.add('wf-fullboard');
            } else {
                container.classList.remove('wf-fullboard');
            }
        });
    }

    if (wfClose) {
        wfClose.addEventListener('click', (e) => {
            e.stopPropagation();
            if (typeof snapshotNow === 'function') snapshotNow();
            widget.remove();
            if (typeof saveBoard === 'function') saveBoard();
        });
    }

    // ── Drag sur le header (sauf toolbar) ────────────────────────────────
    header.addEventListener('mousedown', (e) => {
        if (e.target.closest('.seyes-toolbar, .wf-btns, .cpick-wrap, .cpick-popup')) return;
        bringToFront(widget);
    });

    // ── Focus widget ──────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' ||
            e.target.tagName === 'SELECT' || editor.contains(e.target)) return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    // Ouvrir directement en plein écran board
    _isMax = true;
    container.classList.add('wf-fullboard');

    // Focus auto sur l'éditeur
    requestAnimationFrame(() => requestAnimationFrame(() => editor.focus()));

    saveBoard();
    return widget;
}

// ── Utilitaire : calcule padding-top pour coller la baseline sur la grande ligne ──
// La grande ligne séyès est en bas de chaque bloc line-height.
// On veut que la baseline du texte tombe dessus.
// Estimation : ascent ≈ 0.80 * font-size pour BelleAllure
// baseline_y = paddingTop + ascent
// On veut baseline_y ≡ 0 (mod line-height), donc proche du bas du premier bloc.
// → baseline_y ≈ line-height - descent
// → descent ≈ 0.20 * font-size (2 interlignes sous baseline pour les jambages)
// → paddingTop = line-height - descent - ascent = line-height - font-size
// Avec un léger ajustement visuel de +4px pour BelleAllure.
function _seyesPaddingTop(fontSize, lineHeight) {
    const ascent = fontSize * 0.80;
    let pt = Math.round(lineHeight - ascent - 4 + 16);
    if (pt < 0) pt = 0;
    return pt;
}
