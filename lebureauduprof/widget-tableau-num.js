// ══════════════════════════════════════════════════════════════════
//  widget-tableau-num.js  —  Tableau de numération décimale
// ══════════════════════════════════════════════════════════════════

function createTableauNumWidget() {

    // ── Créer le widget conteneur standard ──────────────────────────
    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'tableau-num';
    widget.tabIndex = 0;

    const p = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 80, y: 80 };
    widget.style.left = p.x + 'px';
    widget.style.top  = p.y + 'px';

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
        <div class="widget-ctx-menu"></div>
        <div class="widget-content">
            <div class="editor-container tnum-editor-container">
                <div class="tnum-container">

                  <div class="tnum-settings-bar">
                    <span class="tnum-settings-title">⚙️</span>
                    <label class="tnum-toggle-label" title="Classe des milliards">
                      <input type="checkbox" class="tnum-chk" data-col-group="milliards"> Milliards
                    </label>
                    <label class="tnum-toggle-label" title="Classe des millions">
                      <input type="checkbox" class="tnum-chk" data-col-group="millions"> Millions
                    </label>
                    <label class="tnum-toggle-label" title="Classe des milliers">
                      <input type="checkbox" class="tnum-chk" data-col-group="milliers" checked> Milliers
                    </label>
                    <label class="tnum-toggle-label" title="Classe des unités — toujours visible">
                      <input type="checkbox" class="tnum-chk" data-col-group="unites" checked disabled> Unités
                    </label>
                    <span class="tnum-sep-v"></span>
                    <label class="tnum-toggle-label" title="Partie décimale">
                      <input type="checkbox" class="tnum-chk" data-col-group="decimales"> Décimales
                    </label>
                    <span class="tnum-sep-v"></span>
                    <div class="tnum-mode-toggle" title="Changer de mode">
                      <button class="tnum-mode-btn tnum-mode-active" data-mode="libre"   title="Mode libre : chaque case est indépendante">Libre</button>
                      <button class="tnum-mode-btn"                  data-mode="nombre"  title="Mode nombre : +1 propage comme un vrai nombre">Nombre</button>
                    </div>
                  </div>

                  <div class="tnum-scroll-wrap">
                    <table class="tnum-table">
                      <thead class="tnum-thead"></thead>
                      <tbody class="tnum-tbody"></tbody>
                    </table>
                  </div>

                  <div class="tnum-footer">
                    <button class="tnum-add-row-btn" title="Ajouter une ligne">＋</button>
                    <button class="tnum-reset-btn" title="Effacer toutes les cases">🗑️</button>
                  </div>

                </div>
            </div>
        </div>`;

    const board = document.getElementById('board');
    board.appendChild(widget);
    if (typeof bringToFront            === 'function') bringToFront(widget);
    if (typeof makeDraggable           === 'function') makeDraggable(widget);
    if (typeof makeDraggableRotate     === 'function') makeDraggableRotate(widget);
    if (typeof makeResizableByHandle   === 'function') makeResizableByHandle(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);

    // ── Scaling proportionnel via ResizeObserver ───────────────────
    _initTableauNumResize(widget);

    // ── Init comportement interne ──────────────────────────────────
    _initTableauNumWidget(widget);

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

    if (typeof saveBoard === 'function' && !window.isInitialLoading && !window.isRestoringState) saveBoard();

    return widget;
}

// ── Scaling proportionnel ──────────────────────────────────────────
// Largeur de référence 600 px → font-size 14 px
// Tout le CSS du widget est en em, donc tout scale automatiquement.
const TNUM_REF_W   = 600;
const TNUM_BASE_FS = 14;

function _initTableauNumResize(widget) {
    const ec = widget.querySelector('.editor-container');
    if (!ec || typeof ResizeObserver === 'undefined') return;

    function _applyScale() {
        const w = ec.offsetWidth;
        if (!w) return;
        const fs = Math.max(6, Math.round((w / TNUM_REF_W) * TNUM_BASE_FS * 10) / 10);
        ec.style.fontSize = fs + 'px';
    }

    const ro = new ResizeObserver(_applyScale);
    ro.observe(ec);
    requestAnimationFrame(_applyScale);
}

// ── Définition des colonnes ────────────────────────────────────────
const TNUM_COLS = [
    // Milliards
    { id: 'Cmds', label: 'centaines de milliards', abbr: 'c', group: 'milliards', cls: 'tnum-milliards', color: '#7c3aed' },
    { id: 'Dmds', label: 'dizaines de milliards', abbr: 'd', group: 'milliards', cls: 'tnum-milliards', color: '#7c3aed' },
    { id: 'Mmds', label: 'unités de milliards',        abbr: 'u', group: 'milliards', cls: 'tnum-milliards', color: '#7c3aed' },
    // Millions
    { id: 'CM',   label: 'centaines de millions',  abbr: 'c', group: 'millions',  cls: 'tnum-millions',  color: '#0891b2' },
    { id: 'DM',   label: 'dizaines de millions',  abbr: 'd', group: 'millions',  cls: 'tnum-millions',  color: '#0891b2' },
    { id: 'M',    label: 'unités de millions',          abbr: 'u', group: 'millions',  cls: 'tnum-millions',  color: '#0891b2' },
    // Milliers
    { id: 'Cde',  label: 'centaines de mille',  abbr: 'c', group: 'milliers',  cls: 'tnum-milliers',  color: '#059669' },
    { id: 'Dde',  label: 'dizaine de mille',  abbr: 'd', group: 'milliers',  cls: 'tnum-milliers',  color: '#059669' },
    { id: 'mde',  label: 'unités de mille',          abbr: 'u', group: 'milliers',  cls: 'tnum-milliers',  color: '#059669' },
    // Unités
    { id: 'C',    label: 'centaines',        abbr: 'c', group: 'unites',    cls: 'tnum-centaines', color: '#e07b2a' },
    { id: 'D',    label: 'dizaines',          abbr: 'd', group: 'unites',    cls: 'tnum-dizaines',  color: '#e07b2a' },
    { id: 'U',    label: 'unités',            abbr: 'u', group: 'unites',    cls: 'tnum-unites',    color: '#e07b2a' },
    // Décimales
    { id: 'dix',  label: 'dixièmes',          abbr: '1/10',   group: 'decimales', cls: 'tnum-dixiemes',  color: '#be185d', decimal: true },
    { id: 'cen',  label: 'centièmes',         abbr: '1/100',  group: 'decimales', cls: 'tnum-centiemes', color: '#be185d', decimal: true },
    { id: 'mil',  label: 'millièmes',         abbr: '1/1000', group: 'decimales', cls: 'tnum-milliemes', color: '#be185d', decimal: true },
];

const TNUM_CLASS_HEADERS = [
    { label: 'classe des milliards', labelCourt: 'milliards', group: 'milliards' },
    { label: 'classe des millions',  labelCourt: 'millions',  group: 'millions'  },
    { label: 'classe des milliers',  labelCourt: 'milliers',  group: 'milliers'  },
    { label: 'classe des unités',    labelCourt: 'unités',    group: 'unites'    },
    { label: 'partie décimale',       labelCourt: 'décimales', group: 'decimales' },
];

// ── Init logique du widget ─────────────────────────────────────────
function _initTableauNumWidget(widget) {
    const container = widget.querySelector('.tnum-container');
    if (!container) return;

    const state = {
        groups: { milliards: false, millions: false, milliers: true, unites: true, decimales: false },
        mode:   'libre',   // 'libre' | 'nombre'
        rows:   [ { id: _tnumRowId(), cells: {} } ]
    };

    // ── API sauvegarde/restauration ────────────────────────────────
    widget._tnumGetData = () => ({
        groups: { ...state.groups },
        mode:   state.mode,
        rows:   state.rows.map(r => ({ id: r.id, cells: { ...r.cells } }))
    });

    widget._tnumSetData = (data) => {
        if (!data) return;
        if (data.groups) Object.assign(state.groups, data.groups);
        if (data.mode)   state.mode = data.mode;
        if (data.rows)   state.rows = data.rows.map(r => ({ id: r.id || _tnumRowId(), cells: { ...r.cells } }));
        _syncCheckboxes();
        _syncModeBtns();
        _renderAll();
    };

    function _syncCheckboxes() {
        container.querySelectorAll('.tnum-chk').forEach(chk => {
            const g = chk.dataset.colGroup;
            if (g === 'unites') return;
            chk.checked = !!state.groups[g];
        });
    }

    function _syncModeBtns() {
        container.querySelectorAll('.tnum-mode-btn').forEach(btn => {
            btn.classList.toggle('tnum-mode-active', btn.dataset.mode === state.mode);
        });
    }

    function _visibleCols() {
        return TNUM_COLS.filter(c => state.groups[c.group] !== false);
    }

    function _renderAll() { _renderHead(); _renderBody(); }

    // ── En-têtes ──────────────────────────────────────────────────
    function _renderHead() {
        const thead = container.querySelector('.tnum-thead');
        if (!thead) return;
        const vis = _visibleCols();

        // Nombre de classes actives → label court si ≥ 3
        const activeGroups = TNUM_CLASS_HEADERS.filter(ch =>
            vis.some(c => c.group === ch.group)
        ).length;
        const useShort = activeGroups >= 3;

        let r1 = '<tr class="tnum-head-classes"><th class="tnum-head-actions" rowspan="2"></th>';
        TNUM_CLASS_HEADERS.forEach(ch => {
            const span = vis.filter(c => c.group === ch.group).length;
            if (!span) return;
            const txt = useShort ? ch.labelCourt : ch.label;
            r1 += `<th class="tnum-head-class tnum-cls-${ch.group}" colspan="${span}" title="${ch.label}">${txt}</th>`;
        });
        r1 += '</tr>';

        let r2 = '<tr class="tnum-head-cols">';
        vis.forEach((col, idx) => {
            const isFirstDec = col.decimal && (idx === 0 || !vis[idx - 1]?.decimal);
            r2 += `<th class="tnum-head-col ${col.cls}${isFirstDec ? ' tnum-virgule-col' : ''}"
                       style="--tnum-col-color:${col.color}" title="${col.label}">${col.abbr}</th>`;
        });
        r2 += '</tr>';

        thead.innerHTML = r1 + r2;
    }

    // ── Corps ──────────────────────────────────────────────────────
    function _renderBody() {
        const tbody = container.querySelector('.tnum-tbody');
        if (!tbody) return;
        const vis = _visibleCols();
        tbody.innerHTML = '';

        state.rows.forEach((row, rowIdx) => {
            const tr = document.createElement('tr');
            tr.dataset.rowId = row.id;

            // Bouton supprimer ligne
            const tdAct = document.createElement('td');
            tdAct.className = 'tnum-row-actions';
            const delBtn = document.createElement('button');
            delBtn.className = 'tnum-del-row-btn';
            delBtn.title = 'Supprimer cette ligne';
            delBtn.textContent = '×';
            delBtn.addEventListener('click', () => {
                if (state.rows.length <= 1) return;
                state.rows.splice(rowIdx, 1);
                _renderBody();
                if (typeof snapshotNow === 'function') snapshotNow();
                if (typeof saveBoard   === 'function') saveBoard();
            });
            tdAct.appendChild(delBtn);
            tr.appendChild(tdAct);

            // Cellules chiffres
            vis.forEach((col, colIdx) => {
                const isFirstDec = col.decimal && (colIdx === 0 || !vis[colIdx - 1]?.decimal);
                const td = document.createElement('td');
                td.className = `tnum-cell ${col.cls}${isFirstDec ? ' tnum-virgule-col' : ''}`;
                td.dataset.colId = col.id;
                td.style.setProperty('--tnum-col-color', col.color);

                const val = row.cells[col.id] ?? '';

                const inner   = document.createElement('div');
                inner.className = 'tnum-cell-inner';

                const btnUp   = document.createElement('button');
                btnUp.className = 'tnum-step tnum-step-up';
                btnUp.tabIndex  = -1;
                btnUp.title     = 'Augmenter (+1)';
                btnUp.textContent = '+';

                const input   = document.createElement('input');
                input.className   = 'tnum-digit';
                input.type        = 'text';
                input.inputMode   = 'numeric';
                input.maxLength   = 1;
                input.value       = val;
                input.autocomplete = 'off';

                const btnDown = document.createElement('button');
                btnDown.className = 'tnum-step tnum-step-down';
                btnDown.tabIndex  = -1;
                btnDown.title     = 'Diminuer (-1)';
                btnDown.textContent = '−';

                inner.append(btnUp, input, btnDown);
                td.appendChild(inner);

                // Saisie clavier
                input.addEventListener('input', () => {
                    let v = input.value.replace(/[^0-9]/g, '');
                    if (v.length > 1) v = v.slice(-1);
                    input.value     = v;
                    row.cells[col.id] = v;
                    if (typeof saveBoard === 'function') saveBoard();
                });

                input.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowUp')   { e.preventDefault(); _stepCell(row, col.id, input, +1); }
                    if (e.key === 'ArrowDown') { e.preventDefault(); _stepCell(row, col.id, input, -1); }
                    if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
                        e.preventDefault();
                        const next = _siblingInput(tr, input, +1);
                        if (next) next.focus();
                    }
                    if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
                        e.preventDefault();
                        const prev = _siblingInput(tr, input, -1);
                        if (prev) prev.focus();
                    }
                });

                input.addEventListener('focus', () => input.select());

                btnUp.addEventListener('mousedown',   e => e.preventDefault());
                btnDown.addEventListener('mousedown', e => e.preventDefault());
                btnUp.addEventListener('click',   () => { _stepCell(row, col.id, input, +1); if (state.mode !== 'nombre') _focusNoSelect(input); });
                btnDown.addEventListener('click', () => { _stepCell(row, col.id, input, -1); if (state.mode !== 'nombre') _focusNoSelect(input); });

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });
    }

    function _stepCell(row, colId, input, dir) {
        if (state.mode === 'nombre') {
            _stepWithRetenue(row, colId, dir);
            // Re-render complet de la ligne pour garantir la cohérence
            const tr = input.closest('tr');
            if (tr) {
                const rowId = tr.dataset.rowId;
                _renderBody();
                // Redonner le focus à la même case après re-render
                const newTr = container.querySelector(`tr[data-row-id="${rowId}"]`);
                if (newTr) {
                    const newInput = newTr.querySelector(`td[data-col-id="${colId}"] .tnum-digit`);
                    if (newInput) _focusNoSelect(newInput);
                }
            }
        } else {
            // Mode libre : case isolée, rotation 0↔9
            const cur = parseInt(input.value, 10);
            let next;
            if (isNaN(cur)) { next = dir > 0 ? 1 : 9; }
            else { next = cur + dir; if (next > 9) next = 0; if (next < 0) next = 9; }
            input.value      = next;
            row.cells[colId] = String(next);
        }
        if (typeof saveBoard === 'function') saveBoard();
    }

    // ── Logique mode Nombre ────────────────────────────────────────
    // Lit toutes les cases comme un entier, applique ±1 sur le rang
    // ciblé, propage les retenues/emprunts en cascade, puis réécrit.
    function _stepWithRetenue(row, colId, dir) {
        const vis     = _visibleCols();
        const allCols = vis;
        const colIdx  = allCols.findIndex(c => c.id === colId);
        if (colIdx === -1) {
            const cur = parseInt(row.cells[colId] ?? '0', 10) || 0;
            let next = cur + dir; if (next > 9) next = 0; if (next < 0) next = 9;
            row.cells[colId] = String(next);
            return;
        }

        // Lire les chiffres (case vide = 0)
        const digits = allCols.map(c => {
            const v = parseInt(row.cells[c.id], 10);
            return isNaN(v) ? 0 : v;
        });

        // Appliquer le pas sur le rang ciblé
        digits[colIdx] += dir;

        // Propagation complète gauche (retenues et emprunts) — sans break prématuré
        for (let i = allCols.length - 1; i > 0; i--) {
            if (digits[i] >= 10) {
                digits[i] -= 10;
                digits[i - 1] += 1;
            } else if (digits[i] < 0) {
                digits[i] += 10;
                digits[i - 1] -= 1;
            }
        }

        // Rang le plus fort : saturation (pas de débordement ni négatif)
        if (digits[0] > 9) digits[0] = 9;
        if (digits[0] < 0) {
            // En dessous de zéro → tout à zéro
            for (let i = 0; i < digits.length; i++) digits[i] = 0;
        }

        // Réécriture avec suppression des zéros de tête
        // Règle spéciale : si la partie entière est nulle mais qu'il y a des
        // décimales non nulles, on affiche 0 sur la dernière colonne entière.
        const entierCols  = allCols.filter(c => !c.decimal);
        const decimalCols = allCols.filter(c =>  c.decimal);
        const entierSum   = entierCols.reduce((s, c, i) => s + digits[allCols.indexOf(c)], 0);
        const decimalSum  = decimalCols.reduce((s, c, i) => s + digits[allCols.indexOf(c)], 0);
        const needZeroEntier = entierSum === 0 && decimalSum > 0 && entierCols.length > 0;

        const isAllZero = digits.every(d => d === 0);
        let leadingZero = true;
        allCols.forEach((c, i) => {
            if (isAllZero) {
                // Nombre nul : 0 sur la dernière colonne entière, vide ailleurs
                const lastEntierIdx = allCols.reduce(
                    (last, col, idx) => col.decimal ? last : idx, -1
                );
                const showAt = lastEntierIdx >= 0 ? lastEntierIdx : allCols.length - 1;
                row.cells[c.id] = i === showAt ? '0' : '';
            } else if (needZeroEntier) {
                // Partie entière = 0 mais décimales non nulles : 0 sur dernière colonne entière
                if (!c.decimal) {
                    const lastEntierIdx = allCols.reduce(
                        (last, col, idx) => col.decimal ? last : idx, -1
                    );
                    row.cells[c.id] = i === lastEntierIdx ? '0' : '';
                } else {
                    row.cells[c.id] = String(digits[i]);
                }
            } else {
                if (leadingZero && digits[i] === 0 && !c.decimal) {
                    row.cells[c.id] = '';   // zéro de tête entier → vide
                } else {
                    leadingZero = false;
                    row.cells[c.id] = String(digits[i]);
                }
            }
        });
    }

    function _siblingInput(tr, current, dir) {
        const inputs = Array.from(tr.querySelectorAll('.tnum-digit'));
        const idx = inputs.indexOf(current);
        if (idx === -1) return null;
        return inputs[idx + dir] || null;
    }

    // ── Ajouter une ligne ──────────────────────────────────────────
    const addBtn = container.querySelector('.tnum-add-row-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            state.rows.push({ id: _tnumRowId(), cells: {} });
            _renderBody();
            if (typeof snapshotNow === 'function') snapshotNow();
            if (typeof saveBoard   === 'function') saveBoard();
        });
    }

    // ── Réinitialiser ──────────────────────────────────────────────
    const resetBtn = container.querySelector('.tnum-reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            state.rows.forEach(row => { row.cells = {}; });
            _renderBody();
            if (typeof snapshotNow === 'function') snapshotNow();
            if (typeof saveBoard   === 'function') saveBoard();
        });
    }

    // ── Checkboxes colonnes ────────────────────────────────────────
    container.querySelectorAll('.tnum-chk').forEach(chk => {
        const g = chk.dataset.colGroup;
        if (g === 'unites') return;
        chk.addEventListener('change', () => {
            state.groups[g] = chk.checked;
            _renderAll();
            if (typeof snapshotNow === 'function') snapshotNow();
            if (typeof saveBoard   === 'function') saveBoard();
        });
    });

    // ── Boutons de mode Libre / Retenue ────────────────────────────
    container.querySelectorAll('.tnum-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            state.mode = btn.dataset.mode;
            _syncModeBtns();
            if (typeof snapshotNow === 'function') snapshotNow();
            if (typeof saveBoard   === 'function') saveBoard();
        });
    });

    // ── Rendu initial ──────────────────────────────────────────────
    _syncCheckboxes();
    _syncModeBtns();
    _renderAll();
}

// ── Focus sans sélection (après +/-) ──────────────────────────────
function _focusNoSelect(input) {
    input.focus();
    // Déplacer le curseur à la fin sans sélectionner
    const len = input.value.length;
    input.setSelectionRange(len, len);
}

// ── ID unique de ligne ─────────────────────────────────────────────
function _tnumRowId() {
    return 'r' + Math.random().toString(36).slice(2, 9);
}
