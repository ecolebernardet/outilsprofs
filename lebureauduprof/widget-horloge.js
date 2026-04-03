// ══════════════════════════════════════════════════════════════════
//  widget-horloge.js  —  Horloge interactive (aiguilles manipulables)
// ══════════════════════════════════════════════════════════════════

function createHorlogeWidget() {

    // ── Injecter le CSS une seule fois ────────────────────────────
    if (!document.getElementById('hrlg-style')) {
        const s = document.createElement('style');
        s.id = 'hrlg-style';
        s.textContent = `
        .widget[data-type="horloge"] {
            cursor: move;
            overflow: visible !important;
        }
        .widget[data-type="horloge"] button    { cursor: pointer; }
        .widget[data-type="horloge"] .hrlg-drag-hour,
        .widget[data-type="horloge"] .hrlg-drag-minute { cursor: grab; }
        .widget[data-type="horloge"] .hrlg-drag-hour:active,
        .widget[data-type="horloge"] .hrlg-drag-minute:active { cursor: grabbing; }
        .widget[data-type="horloge"] .custom-resize-handle { cursor: se-resize; }
        .widget[data-type="horloge"] .drag-handle { cursor: move; }

        .hrlg-ec {
            overflow: visible !important;
            display: flex;
            flex-direction: column;
            height: auto !important;
        }
        .hrlg-container.wf-fullboard {
            position: fixed !important;
            inset: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 9999 !important;
            border-radius: 0 !important;
            overflow-y: auto !important;
            font-size: 14px !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
        }
        .hrlg-container.wf-fullboard .hrlg-header {
            width: 100% !important;
            box-sizing: border-box !important;
            border-radius: 0 !important;
            flex-shrink: 0 !important;
        }
        .hrlg-container.wf-fullboard .hrlg-body {
            width: min(650px, 80vmin) !important;
            flex: 1 !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
        }
        .hrlg-container {
            display: flex;
            flex-direction: column;
            background: #12122a;
            border-radius: 14px;
            border: 0.07em solid #2e2e50;
            box-shadow: 0 0.3em 1.4em rgba(0,0,0,.35);
            font-size: 14px;
            min-width: 200px;
            width: 100%;
        }
        .hrlg-header {
            display: flex;
            align-items: center;
            gap: 0.5em;
            padding: 0.55em 0.85em;
            background: #1a1a38;
            border-bottom: 0.07em solid #2e2e50;
            cursor: move;
            user-select: none;
            flex-shrink: 0;
            border-radius: 14px 14px 0 0;
        }
        .hrlg-ec.wf-fullboard .hrlg-header { border-radius: 0; }
        .hrlg-title { font-size: 0.82em; font-weight: 700; color: #a5b4fc; letter-spacing: 0.03em; }
        .hrlg-help-btn {
            background: rgba(165,180,252,.12); border: 0.07em solid rgba(165,180,252,.3);
            color: #a5b4fc; font-size: 0.65em; font-weight: 700;
            width: 1.7em; height: 1.7em; border-radius: 50%; cursor: pointer;
            display: flex; align-items: center; justify-content: center; padding: 0;
        }
        .hrlg-help-popup {
            display: none; position: absolute; top: 3em; left: 0.8em; right: 0.8em;
            background: #1e1e40; border: 1px solid #3a3a60; border-radius: 10px;
            padding: 0.8em 1em; z-index: 200; box-shadow: 0 4px 20px rgba(0,0,0,.5);
            color: #c7d2fe; font-size: 0.8em; line-height: 1.5;
        }
        .hrlg-help-popup.hrlg-help-show { display: block; }
        .hrlg-help-popup h4 { margin: 0 0 0.5em; color: #a5b4fc; font-size: 1em; }
        .hrlg-help-section { margin-bottom: 0.5em; }
        .hrlg-help-section:last-child { margin-bottom: 0; }
        .hrlg-body {
            display: flex; flex-direction: column; align-items: center;
            padding: 1.1em 1em 0.9em; gap: 0.9em;
        }
        .hrlg-clock-wrap { width: 100%; }
        .hrlg-svg { width: 100%; height: auto; display: block; overflow: visible; }
        .hrlg-face   { fill: #1c1c3a; filter: drop-shadow(0 2px 12px rgba(0,0,0,.5)); }
        .hrlg-border { stroke: #4a4a80; stroke-width: 2.5; fill: none; }
        .hrlg-tick-min  { stroke: #3a3a65; stroke-width: 1; stroke-linecap: round; }
        .hrlg-tick-hour { stroke: #6366f1; stroke-width: 2.5; stroke-linecap: round; }
        .hrlg-number { font-family: 'BelleAllureGS', cursive !important; font-weight: 700; fill: #c7d2fe; }
        .hrlg-hand { stroke-linecap: round; pointer-events: none; }
        .hrlg-hand-hour   { stroke: #ef4444; stroke-width: 5; }
        .hrlg-hand-minute { stroke: #6366f1; stroke-width: 3; }
        .hrlg-drag-hour, .hrlg-drag-minute { stroke: transparent; stroke-width: 18; }
        .hrlg-center { fill: #6366f1; filter: drop-shadow(0 0 3px rgba(99,102,241,.8)); }
        .hrlg-digital-wrap { display: flex; flex-direction: column; align-items: center; gap: 0.55em; width: 100%; }
        .hrlg-digital {
            background: rgba(99,102,241,.1); border: 1px solid rgba(99,102,241,.3);
            border-radius: 0.5em; padding: 0.3em 1em; min-width: 5em; text-align: center;
        }
        .hrlg-time-display {
            font-family: 'BelleAllureGS', cursive !important;
            font-size: 3em; font-weight: 700; color: #a5b4fc;
            letter-spacing: 0.05em; display: block; line-height: 1.2;
        }
        .hrlg-colon { font-family: 'Nunito', sans-serif !important; font-weight: 700; }
        .hrlg-controls { display: flex; gap: 0.5em; align-items: center; justify-content: center; }
        .hrlg-toggle-time-btn {
            background: rgba(99,102,241,.12); border: 0.07em solid rgba(99,102,241,.35);
            color: #a5b4fc; font-size: 0.62em; font-weight: 600;
            padding: 0.35em 0.9em; border-radius: 0.5em; cursor: pointer; white-space: nowrap;
        }
        .hrlg-reset-btn {
            background: rgba(239,68,68,.1); border: 0.07em solid rgba(239,68,68,.35);
            font-size: 0.65em; width: 2em; height: 2em;
            display: flex; align-items: center; justify-content: center;
            border-radius: 0.5em; cursor: pointer;
        }
        body.menu-light .hrlg-container { background: #f4f5ff; border-color: #d4d4e8; }
        body.menu-light .hrlg-header { background: #eef0f8; border-bottom-color: #d4d4e8; }
        body.menu-light .hrlg-title { color: #4338ca; }
        body.menu-light .hrlg-face { fill: #ffffff; }
        body.menu-light .hrlg-border { stroke: #9090c0; }
        body.menu-light .hrlg-tick-min { stroke: #c8c8e0; }
        body.menu-light .hrlg-tick-hour { stroke: #4338ca; }
        body.menu-light .hrlg-number { fill: #333366; }
        body.menu-light .hrlg-hand-hour { stroke: #dc2626; }
        body.menu-light .hrlg-hand-minute { stroke: #4338ca; }
        body.menu-light .hrlg-center { fill: #4338ca; }
        body.menu-light .hrlg-digital { background: rgba(67,56,202,.07); border-color: rgba(67,56,202,.25); }
        body.menu-light .hrlg-time-display { color: #312e81; }
        body.menu-light .hrlg-toggle-time-btn { background: rgba(67,56,202,.08); border-color: rgba(67,56,202,.3); color: #4338ca; }
        `;
        document.head.appendChild(s);
    }

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'horloge';
    widget.dataset.transparent = 'true';
    widget.tabIndex = 0;

    const p = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 80, y: 80 };
    widget.style.left  = p.x + 'px';
    widget.style.top   = p.y + 'px';
    widget.style.cssText = `left:${p.x}px; top:${p.y}px; overflow:visible; flex-direction:row;`;

    widget.addEventListener('mousedown', () => {
        if (typeof isDrawMode   !== 'undefined' && isDrawMode)   return;
        if (typeof isEraserMode !== 'undefined' && isEraserMode) return;
        if (widget.dataset.background !== 'true' && typeof bringToFront === 'function') bringToFront(widget);
    });

    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle"  onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle"   onclick="togglePin(this.closest('.widget,.shape-widget'))"    title="Épingler">📌</div>
            <div class="widget-back-handle"  onclick="sendToBack(this.closest('.widget,.shape-widget'))"   title="Envoyer derrière">🔽</div>
            <div class="widget-close-handle" onclick="(function(w){snapshotNow();closeCtxMenuAll();w.remove();saveBoard();})(this.closest('.widget'))" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>`;

    // Construire le container avec overflow:visible en inline style
    const ec = document.createElement('div');
    ec.className = 'hrlg-ec';
    ec.style.overflow = 'visible';

    const initW = Math.min(Math.round(window.innerWidth * 0.25), 400);
    ec.innerHTML = `
        <div class="hrlg-container" style="width:${initW}px">
            <div class="hrlg-header">
                <span class="hrlg-title">🕐 Horloge</span>
                <button class="hrlg-help-btn" title="Aide">?</button>
                <div class="wf-btns" style="margin-left:auto">
                    <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
                    <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran board"></button>
                    <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
                </div>
            </div>
            <div class="hrlg-help-popup">
                <h4>💡 Horloge interactive</h4>
                <div class="hrlg-help-section">
                    <strong>🖱️ Manipuler les aiguilles</strong><br>
                    Faites glisser l'aiguille des <em>heures</em> (courte, rouge) ou des <em>minutes</em> (longue, violette).
                </div>
                <div class="hrlg-help-section">
                    <strong>👁️ Affichage numérique</strong><br>
                    Cacher/afficher l'heure pour les exercices.
                </div>
                <div class="hrlg-help-section">
                    <strong>🔄 Réinitialiser</strong><br>
                    Remettre à 12h00.
                </div>
            </div>
            <div class="hrlg-body">
                <div class="hrlg-clock-wrap">
                    <svg class="hrlg-svg" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                        <circle class="hrlg-face"   cx="100" cy="100" r="96"/>
                        <circle class="hrlg-border" cx="100" cy="100" r="96"/>
                        <g class="hrlg-ticks-min"></g>
                        <g class="hrlg-ticks-hour"></g>
                        <g class="hrlg-numbers"></g>
                        <line class="hrlg-hand hrlg-hand-hour"   x1="100" y1="100" x2="100" y2="46"/>
                        <line class="hrlg-hand hrlg-hand-minute" x1="100" y1="100" x2="100" y2="20"/>
                        <circle class="hrlg-center" cx="100" cy="100" r="4"/>
                        <line class="hrlg-drag-hour"   x1="100" y1="100" x2="100" y2="46"/>
                        <line class="hrlg-drag-minute" x1="100" y1="100" x2="100" y2="20"/>
                    </svg>
                </div>
                <div class="hrlg-digital-wrap">
                    <div class="hrlg-digital">
                        <span class="hrlg-time-display">12<span class="hrlg-colon">:</span>00</span>
                    </div>
                    <div class="hrlg-controls">
                        <button class="hrlg-toggle-time-btn">👁️ Cacher l'heure</button>
                        <button class="hrlg-reset-btn" title="Remettre à 12:00">🔄</button>
                    </div>
                </div>
            </div>
        </div>`;

    widget.appendChild(ec);

    const board = document.getElementById('board');
    board.appendChild(widget);

    if (typeof bringToFront            === 'function') bringToFront(widget);
    if (typeof makeDraggable           === 'function') makeDraggable(widget);
    if (typeof makeDraggableRotate     === 'function') makeDraggableRotate(widget);
    if (typeof makeResizableByHandle   === 'function') makeResizableByHandle(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);

    _initHorlogeResize(widget);

    // ── Injecter CSS wf-btns si pas encore présent ────────────────
    if (!document.getElementById('wf-btns-style')) {
        const ws = document.createElement('style');
        ws.id = 'wf-btns-style';
        ws.textContent = `
    .wf-btns { display:flex; gap:5px; align-items:center; flex-shrink:0; }
    .wf-btn { width:13px; height:13px; border-radius:50%; border:none; cursor:pointer;
              display:flex; align-items:center; justify-content:center; padding:0; font-size:0; flex-shrink:0; }
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

    // ── Header comme poignée de déplacement ───────────────────────
    const hrlgHeader = widget.querySelector('.hrlg-header');
    if (hrlgHeader && typeof startWidgetDrag === 'function') {
        hrlgHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('button')) return;
            e.stopPropagation(); widget.focus();
            startWidgetDrag(e, widget);
        });
        hrlgHeader.addEventListener('touchstart', (e) => {
            if (e.target.closest('button')) return;
            e.stopPropagation();
            startWidgetDrag({ clientX: e.touches[0].clientX, clientY: e.touches[0].clientY, target: e.target }, widget);
        }, { passive: false });
    }

    // ── Boutons wf ────────────────────────────────────────────────
    const wfMin   = widget.querySelector('[data-role="wf-min"]');
    const wfMax   = widget.querySelector('[data-role="wf-max"]');
    const wfClose = widget.querySelector('[data-role="wf-close"]');
    const container = widget.querySelector('.hrlg-container');
    let _hrlgIsMax = false;
    let _savedW = '';

    if (wfMin) {
        wfMin.addEventListener('click', (e) => {
            e.stopPropagation();
            if (_hrlgIsMax) wfMax.click();
            if (typeof window._wfMiniBarCollapse === 'function') {
                ec.style.display = 'none';
                window._wfMiniBarCollapse(widget, '🕐 Horloge', {
                    onExpand: () => { ec.style.display = ''; }
                });
            }
        });
    }
    if (wfMax) {
        wfMax.addEventListener('click', (e) => {
            e.stopPropagation();
            _hrlgIsMax = !_hrlgIsMax;
            if (_hrlgIsMax) {
                _savedW = container.style.width;
                container.classList.add('wf-fullboard');
            } else {
                container.classList.remove('wf-fullboard');
                if (_savedW) container.style.width = _savedW;
                requestAnimationFrame(() => { if (widget._hrlgApplyScale) widget._hrlgApplyScale(); });
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

    // ── Aide ──────────────────────────────────────────────────────
    const helpBtn   = widget.querySelector('.hrlg-help-btn');
    const helpPopup = widget.querySelector('.hrlg-help-popup');
    if (helpBtn && helpPopup) {
        helpBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            helpPopup.classList.toggle('hrlg-help-show');
        });
        document.addEventListener('click', () => helpPopup.classList.remove('hrlg-help-show'));
    }

    widget.addEventListener('keydown', (e) => {
        if (e.key !== 'Delete' && e.key !== 'Backspace') return;
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (document.activeElement?.isContentEditable) return;
        e.preventDefault(); e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    _initHorlogeWidget(widget);

    if (typeof saveBoard === 'function' && !window.isInitialLoading && !window.isRestoringState) saveBoard();

    return widget;
}

// ── Scaling proportionnel ──────────────────────────────────────────
const HRLG_REF_W   = 320;
const HRLG_BASE_FS = 14;

function _initHorlogeResize(widget) {
    const cont = widget.querySelector('.hrlg-container');
    const ec   = widget.querySelector('.hrlg-ec');
    if (!cont || typeof ResizeObserver === 'undefined') return;

    function _applyScale() {
        if (cont.classList.contains('wf-fullboard')) return;
        const w = cont.offsetWidth;
        if (!w) return;
        const fs = Math.max(8, Math.round((w / HRLG_REF_W) * HRLG_BASE_FS * 10) / 10);
        cont.style.fontSize = fs + 'px';
    }

    const ro = new ResizeObserver(_applyScale);
    ro.observe(cont);
    requestAnimationFrame(_applyScale);
    widget._hrlgApplyScale = _applyScale;
}

// ── Logique interne ────────────────────────────────────────────────
function _initHorlogeWidget(widget) {
    const svg         = widget.querySelector('.hrlg-svg');
    const handHour    = widget.querySelector('.hrlg-hand-hour');
    const handMin     = widget.querySelector('.hrlg-hand-minute');
    const dragHour    = widget.querySelector('.hrlg-drag-hour');
    const dragMin     = widget.querySelector('.hrlg-drag-minute');
    const timeDisplay = widget.querySelector('.hrlg-time-display');
    const toggleBtn   = widget.querySelector('.hrlg-toggle-time-btn');
    const resetBtn    = widget.querySelector('.hrlg-reset-btn');

    const state = { hours: 12, minutes: 0, showTime: true };

    widget._hrlgGetData = () => {
        const cont = widget.querySelector('.hrlg-container');
        const isFullboard = cont && cont.classList.contains('wf-fullboard');
        return { ...state, containerW: (!isFullboard && cont) ? cont.offsetWidth : null };
    };
    widget._hrlgSetData = (data) => {
        if (!data) return;
        if (data.hours    !== undefined) state.hours    = data.hours;
        if (data.minutes  !== undefined) state.minutes  = data.minutes;
        if (data.showTime !== undefined) state.showTime = data.showTime;
        if (data.containerW) {
            const cont = widget.querySelector('.hrlg-container');
            if (cont && !cont.classList.contains('wf-fullboard')) cont.style.width = data.containerW + 'px';
        }
        _render();
    };

    _buildClockFace(svg);

    function _render() { _updateHands(); _updateDigital(); _updateToggleBtn(); }

    function _updateHands() {
        const hAngle = ((state.hours % 12) * 30) + (state.minutes * 0.5);
        const mAngle = state.minutes * 6;
        _setHandAngle(handHour,  hAngle, 46);
        _setHandAngle(handMin,   mAngle, 20);
        _setHandAngle(dragHour,  hAngle, 46);
        _setHandAngle(dragMin,   mAngle, 20);
    }

    function _setHandAngle(line, angleDeg, tipY) {
        const rad = (angleDeg - 90) * Math.PI / 180;
        const len = 100 - tipY;
        line.setAttribute('x2', (100 + Math.cos(rad) * len).toFixed(2));
        line.setAttribute('y2', (100 + Math.sin(rad) * len).toFixed(2));
    }

    function _updateDigital() {
        const h = String(state.hours % 12 || 12).padStart(2, '0');
        const m = String(state.minutes).padStart(2, '0');
        timeDisplay.innerHTML = h + '<span class="hrlg-colon">:</span>' + m;
        timeDisplay.style.visibility = state.showTime ? 'visible' : 'hidden';
    }

    function _updateToggleBtn() {
        toggleBtn.textContent = state.showTime ? '👁️ Cacher l\'heure' : '👁️ Afficher l\'heure';
    }

    function _getAngleFromEvent(e) {
        const rect = svg.getBoundingClientRect();
        const cx   = rect.left + rect.width  / 2;
        const cy   = rect.top  + rect.height / 2;
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        let angle = Math.atan2(clientX - cx, -(clientY - cy)) * 180 / Math.PI;
        if (angle < 0) angle += 360;
        return angle;
    }

    function _makeDrag(onMove) {
        return function(e) {
            e.preventDefault(); e.stopPropagation();
            const move = (ev) => { onMove(_getAngleFromEvent(ev)); _render(); };
            const up   = () => {
                document.removeEventListener('mousemove', move);
                document.removeEventListener('mouseup',   up);
                document.removeEventListener('touchmove', move);
                document.removeEventListener('touchend',  up);
                if (typeof snapshotNow === 'function') snapshotNow();
                if (typeof saveBoard   === 'function') saveBoard();
            };
            document.addEventListener('mousemove', move);
            document.addEventListener('mouseup',   up);
            document.addEventListener('touchmove', move, { passive: false });
            document.addEventListener('touchend',  up);
        };
    }

    dragHour.addEventListener('mousedown',  _makeDrag(a => { state.hours = Math.floor(a / 30); state.minutes = Math.round((a % 30) / 30 * 60) % 60; }));
    dragHour.addEventListener('touchstart', _makeDrag(a => { state.hours = Math.floor(a / 30); state.minutes = Math.round((a % 30) / 30 * 60) % 60; }), { passive: false });
    dragMin.addEventListener('mousedown',   _makeDrag(a => { state.minutes = Math.round(a / 6) % 60; }));
    dragMin.addEventListener('touchstart',  _makeDrag(a => { state.minutes = Math.round(a / 6) % 60; }), { passive: false });

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); state.showTime = !state.showTime; _render();
        if (typeof snapshotNow === 'function') snapshotNow();
        if (typeof saveBoard   === 'function') saveBoard();
    });
    resetBtn.addEventListener('click', (e) => {
        e.stopPropagation(); state.hours = 12; state.minutes = 0; _render();
        if (typeof snapshotNow === 'function') snapshotNow();
        if (typeof saveBoard   === 'function') saveBoard();
    });

    _render();
}

// ── Cadran ────────────────────────────────────────────────────────
function _buildClockFace(svg) {
    const ticksMin  = svg.querySelector('.hrlg-ticks-min');
    const ticksHour = svg.querySelector('.hrlg-ticks-hour');
    const numbers   = svg.querySelector('.hrlg-numbers');
    if (!ticksMin || !ticksHour || !numbers) return;

    for (let i = 0; i < 60; i++) {
        const a = (i * 6 - 90) * Math.PI / 180;
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('x1', (100 + Math.cos(a) * 88).toFixed(2)); l.setAttribute('y1', (100 + Math.sin(a) * 88).toFixed(2));
        l.setAttribute('x2', (100 + Math.cos(a) * 93).toFixed(2)); l.setAttribute('y2', (100 + Math.sin(a) * 93).toFixed(2));
        l.setAttribute('class', 'hrlg-tick-min'); ticksMin.appendChild(l);
    }
    for (let i = 0; i < 12; i++) {
        const a = (i * 30 - 90) * Math.PI / 180;
        const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        l.setAttribute('x1', (100 + Math.cos(a) * 82).toFixed(2)); l.setAttribute('y1', (100 + Math.sin(a) * 82).toFixed(2));
        l.setAttribute('x2', (100 + Math.cos(a) * 93).toFixed(2)); l.setAttribute('y2', (100 + Math.sin(a) * 93).toFixed(2));
        l.setAttribute('class', 'hrlg-tick-hour'); ticksHour.appendChild(l);
    }
    [12,1,2,3,4,5,6,7,8,9,10,11].forEach((n, i) => {
        const a = (i * 30 - 90) * Math.PI / 180;
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', (100 + Math.cos(a) * 73).toFixed(2));
        t.setAttribute('y', (100 + Math.sin(a) * 73).toFixed(2));
        t.setAttribute('class', 'hrlg-number');
        t.setAttribute('font-size', '13');
        t.setAttribute('text-anchor', 'middle');
        t.setAttribute('dominant-baseline', 'central');
        t.textContent = n;
        numbers.appendChild(t);
    });
}
