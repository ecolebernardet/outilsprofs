// =========================================================================
// WIDGET CALENDRIER — Le Bureau du Prof
// =========================================================================

// =========================================================================
// CAL EVENT STORAGE — IndexedDB (même pattern que pdfStorage dans board.js)
// DB : 'BureauDuProf_CalEvents'  |  Store : 'events'
// Clé : calId (string uuid par widget)
// API : calEventStorage.set(id, events), .get(id) → Promise, .remove(id)
// =========================================================================
const calEventStorage = (() => {
    const DB_NAME = 'BureauDuProf_CalEvents';
    const STORE   = 'events';
    let _db = null;

    function openDB() {
        if (_db) return Promise.resolve(_db);
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = e => e.target.result.createObjectStore(STORE);
            req.onsuccess = e => { _db = e.target.result; resolve(_db); };
            req.onerror   = () => reject(req.error);
        });
    }

    function tx(mode) {
        return openDB().then(db => db.transaction(STORE, mode).objectStore(STORE));
    }

    return {
        // Sauvegarde les événements (objet JSON) sous la clé calId
        set(calId, eventsObj) {
            return tx('readwrite').then(store => new Promise((res) => {
                const r = store.put(JSON.stringify(eventsObj), calId);
                r.onsuccess = () => res();
                r.onerror   = () => { console.warn('[calEventStorage] Erreur écriture:', r.error); res(); };
            })).catch(err => { console.warn('[calEventStorage] set échoué:', err); });
        },
        // Lit les événements → retourne un objet {} ou null
        get(calId) {
            return tx('readonly').then(store => new Promise((res) => {
                const r = store.get(calId);
                r.onsuccess = () => {
                    try { res(r.result ? JSON.parse(r.result) : null); }
                    catch(e) { res(null); }
                };
                r.onerror = () => res(null);
            })).catch(() => Promise.resolve(null));
        },
        // Supprime les événements d'un widget
        remove(calId) {
            return tx('readwrite').then(store => new Promise((res) => {
                store.delete(calId).onsuccess = () => res();
            })).catch(() => {});
        },
        // Liste tous les calIds stockés (pour purge des orphelins)
        listIds() {
            return tx('readonly').then(store => new Promise((res) => {
                const r = store.getAllKeys();
                r.onsuccess = () => res(r.result || []);
                r.onerror   = () => res([]);
            })).catch(() => []);
        },
        // Supprime les entrées dont le calId n'est plus utilisé sur le board
        async purgeOrphans() {
            const usedIds = new Set(
                [...document.querySelectorAll('.widget[data-type="calendrier"][data-cal-id]')]
                    .map(w => w.dataset.calId)
            );
            const storedIds = await this.listIds();
            let removed = 0;
            for (const id of storedIds) {
                if (!usedIds.has(id)) { await this.remove(id); removed++; }
            }
            if (removed > 0) console.log(`[calEventStorage] ${removed} entrée(s) orpheline(s) supprimée(s)`);
        }
    };
})();

// ─── Génère un ID unique pour chaque widget calendrier ────────────────────
function _calGenId() {
    return 'cal_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// =========================================================================
// CONSTANTES
// =========================================================================
const CALENDRIER_JOURS  = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const CALENDRIER_MOIS   = [
    'Janvier','Février','Mars','Avril','Mai','Juin',
    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'
];
const CALENDRIER_THEMES = {
    bleu:   { bg: '#4a90e2', text: '#fff' },
    vert:   { bg: '#27ae60', text: '#fff' },
    rouge:  { bg: '#e74c3c', text: '#fff' },
    orange: { bg: '#f39c12', text: '#fff' },
    violet: { bg: '#8e44ad', text: '#fff' },
    rose:   { bg: '#e84393', text: '#fff' },
};
const CAL_REF_WIDTH = 320;

// =========================================================================
// CRÉATION DU WIDGET
// =========================================================================
function createCalendrierWidget() {
    if (typeof snapshotNow === 'function') snapshotNow();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type  = 'calendrier';
    widget.dataset.calId = _calGenId();   // identifiant unique pour IndexedDB
    widget.tabIndex = 0;

    const p = findFreePosition(320, 400);
    widget.style.left = p.x + 'px';
    widget.style.top  = p.y + 'px';

    widget.innerHTML = `
        <div class="drag-handle" title="Déplacer">✥</div>
        <div class="widget-rotate-handle" title="Faire pivoter">↻</div>
        <div class="widget-action-bar">
            <div class="widget-menu-handle" onclick="toggleCtxMenu(this.closest('.widget,.shape-widget'))" title="Menu">☰</div>
            <div class="widget-pin-handle" onclick="togglePin(this.closest('.widget, .shape-widget'))" title="Épingler">📌</div>
            <div class="widget-back-handle" onclick="sendToBack(this.closest('.widget, .shape-widget'))" title="Envoyer derrière">🔽</div>
            <div class="widget-close-handle" onclick="(function(w){snapshotNow();closeCtxMenuAll();if(w.dataset.calId)calEventStorage.remove(w.dataset.calId);w.remove();saveBoard();})(this.closest('.widget'))" title="Fermer">×</div>
        </div>
        <div class="widget-ctx-menu"></div>
        <div class="widget-content">
            <div class="cal-container editor-container"></div>
        </div>`;

    board.appendChild(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    widget.addEventListener('mousedown', (e) => {
        if (typeof isDrawMode !== 'undefined' && isDrawMode) return;
        if (typeof isEraserMode !== 'undefined' && isEraserMode) return;
        if (widget.dataset.background !== 'true') bringToFront(widget);
    });

    widget.addEventListener('keydown', (e) => {
        if (e.key !== 'Delete' && e.key !== 'Backspace') return;
        const tag = document.activeElement?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (document.activeElement?.isContentEditable) return;
        e.preventDefault(); e.stopPropagation();
        snapshotNow();
        calEventStorage.remove(widget.dataset.calId);
        widget.remove();
        saveBoard();
    });

    const now = new Date();
    widget._calState = {
        year:         now.getFullYear(),
        month:        now.getMonth(),
        events:       {},
        showWeekends: true,
        showWeekNums: false,
        darkMode:     false,
    };

    _calRender(widget);

    // ResizeObserver : font-size proportionnel + barre action compacte
    if (typeof ResizeObserver !== 'undefined') {
        const con = widget.querySelector('.cal-container');
        if (con) {
            const ro = new ResizeObserver(() => {
                _calScaleFont(con);
                if (typeof _updateActionBarCompact === 'function') _updateActionBarCompact(widget);
            });
            ro.observe(con);
        }
    }

    if (!isInitialLoading && !isRestoringState) saveBoard();

    if (typeof _updateActionBarCompact === 'function') {
        requestAnimationFrame(() => _updateActionBarCompact(widget));
        setTimeout(() => _updateActionBarCompact(widget), 200);
    }

    return widget;
}

// ─── Font-size proportionnel à la largeur ────────────────────────────────
function _calScaleFont(con) {
    const w = con.offsetWidth;
    if (!w) return;
    const basePx = Math.max(9, Math.round(13 * w / CAL_REF_WIDTH));
    con.style.fontSize = basePx + 'px';
}

// =========================================================================
// RENDU COMPLET
// =========================================================================
function _calRender(widget) {
    const s   = widget._calState;
    const con = widget.querySelector('.cal-container');
    if (!con) return;

    const { year, month, events, showWeekends, showWeekNums, darkMode } = s;
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

    con.classList.toggle('cal-light', !darkMode);

    const firstDay = new Date(year, month, 1);
    let startDow = firstDay.getDay();
    startDow = (startDow === 0) ? 6 : startDow - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev  = new Date(year, month, 0).getDate();

    const cols      = showWeekends ? 7 : 5;
    const colLabels = showWeekends ? CALENDRIER_JOURS : CALENDRIER_JOURS.slice(0, 5);

    // Colonnes grisées : Mer=2, Sam=5, Dim=6  (lundi=0)
    const GREY_COLS = new Set(showWeekends ? [2, 5, 6] : [2]);

    const themeIcon  = darkMode ? '☀️' : '🌙';
    const themeTitle = darkMode ? 'Passer en mode clair' : 'Passer en mode sombre';

    let html = `
    <div class="cal-header">
        <button class="cal-nav cal-prev" title="Mois précédent">‹</button>
        <span class="cal-title">${CALENDRIER_MOIS[month]} ${year}</span>
        <button class="cal-nav cal-next" title="Mois suivant">›</button>
        <button class="cal-today-btn" title="Aujourd'hui">Auj.</button>
        <button class="cal-theme-btn" title="${themeTitle}">${themeIcon}</button>
        <button class="cal-opts-btn" title="Options">⚙</button>
    </div>
    <div class="cal-opts-panel" style="display:none;">
        <label class="cal-opt-check"><input type="checkbox" class="cal-cb-we" ${showWeekends?'checked':''}> Week-ends</label>
        <label class="cal-opt-check"><input type="checkbox" class="cal-cb-wn" ${showWeekNums?'checked':''}> N° semaine</label>
        <div class="cal-opts-sep"></div>
        <button class="cal-idb-status" title="État de la sauvegarde IndexedDB">💾 …</button>
        <button class="cal-export-btn" title="Exporter les événements en JSON">⬇ JSON</button>
        <label class="cal-import-lbl" title="Importer des événements depuis un fichier JSON">⬆ JSON<input type="file" class="cal-import-input" accept=".json" style="display:none;"></label>
    </div>
    <div class="cal-grid" style="grid-template-columns:${showWeekNums ? '2em ' : ''}repeat(${cols}, 1fr);">`;

    // En-têtes jours
    if (showWeekNums) html += `<div class="cal-cell cal-wn-head"></div>`;
    colLabels.forEach((j, i) => {
        const isWE   = showWeekends && (i === 5 || i === 6);
        const isGrey = GREY_COLS.has(i);
        let cls = 'cal-cell cal-day-head';
        if (isWE)   cls += ' cal-we';
        if (isGrey) cls += ' cal-grey-col';
        html += `<div class="${cls}">${j}</div>`;
    });

    // Cellules
    let cellDay = 1 - startDow;
    const totalCells = Math.ceil((startDow + daysInMonth) / cols) * cols;
    const totalRows  = totalCells / cols;

    for (let i = 0; i < totalCells; i++) {
        const row = Math.floor(i / cols);
        const col = i % cols;
        const isLastRow = row === totalRows - 1;
        const isLastCol = col === cols - 1;

        if (showWeekNums && col === 0) {
            const d = cellDay > 0 && cellDay <= daysInMonth
                ? new Date(year, month, cellDay)
                : cellDay <= 0
                    ? new Date(year, month - 1, daysInPrev + cellDay)
                    : new Date(year, month + 1, cellDay - daysInMonth);
            const wnCls = 'cal-cell cal-wn' + (isLastRow ? '' : ' cal-border-b');
            html += `<div class="${wnCls}">${_getWeekNumber(d)}</div>`;
        }

        const isWE   = showWeekends && (col === 5 || col === 6);
        const isGrey = GREY_COLS.has(col);
        let cls = 'cal-cell cal-day';
        if (!isLastRow) cls += ' cal-border-b';
        if (!isLastCol) cls += ' cal-border-r';
        if (isGrey)     cls += ' cal-grey-col';

        let labelNum = '';
        let evtHtml  = '';

        if (cellDay < 1) {
            cls += ' cal-other-month';
            labelNum = daysInPrev + cellDay;
        } else if (cellDay > daysInMonth) {
            cls += ' cal-other-month';
            labelNum = cellDay - daysInMonth;
        } else {
            if (isCurrentMonth && cellDay === today.getDate()) cls += ' cal-today';
            if (isWE) cls += ' cal-we';
            const key = `${year}-${String(month+1).padStart(2,'0')}-${String(cellDay).padStart(2,'0')}`;
            if (events[key]) {
                const ev = events[key];
                const th = CALENDRIER_THEMES[ev.color] || CALENDRIER_THEMES.bleu;
                evtHtml = `<div class="cal-event" style="background:${th.bg};color:${th.text};" title="${ev.label}">${ev.label}</div>`;
            }
            labelNum = cellDay;
        }

        const dataAttr = (cellDay >= 1 && cellDay <= daysInMonth)
            ? `data-day="${cellDay}" data-month="${month}" data-year="${year}"`
            : '';

        html += `<div class="${cls}" ${dataAttr}><span class="cal-day-num">${labelNum}</span>${evtHtml}</div>`;
        cellDay++;
    }

    html += `</div>
    <div class="cal-event-bar" style="display:none;">
        <input class="cal-ev-input" type="text" placeholder="Étiquette…" maxlength="30">
        <select class="cal-ev-color">
            ${Object.keys(CALENDRIER_THEMES).map(c=>`<option value="${c}">${c}</option>`).join('')}
        </select>
        <button class="cal-ev-save">✓</button>
        <button class="cal-ev-del">🗑</button>
        <button class="cal-ev-cancel">✕</button>
    </div>`;

    con.innerHTML = html;
    _calScaleFont(con);
    _calBindEvents(widget);
    _calUpdateIdbStatus(widget);
}

// =========================================================================
// SAUVEGARDE IndexedDB + helpers
// =========================================================================

// Sauvegarde les événements dans IndexedDB et met à jour l'indicateur
function _calSaveEvents(widget) {
    const calId = widget.dataset.calId;
    if (!calId) return;
    const events = widget._calState?.events || {};
    calEventStorage.set(calId, events)
        .then(() => _calUpdateIdbStatus(widget))
        .catch(() => _calUpdateIdbStatus(widget, true));
}

// Met à jour le badge "💾" dans le panneau options
function _calUpdateIdbStatus(widget, error = false) {
    const btn = widget.querySelector('.cal-idb-status');
    if (!btn) return;
    const count = Object.keys(widget._calState?.events || {}).length;
    if (error) {
        btn.textContent = '💾 ❌';
        btn.title = 'Erreur de sauvegarde IndexedDB';
    } else {
        btn.textContent = count > 0 ? `💾 ${count} évent.` : '💾 Vide';
        btn.title = `${count} événement(s) sauvegardé(s) dans IndexedDB`;
    }
}

// =========================================================================
// EXPORT / IMPORT JSON
// =========================================================================

function _calExportJSON(widget) {
    const s      = widget._calState;
    const calId  = widget.dataset.calId || 'calendrier';
    const mois   = CALENDRIER_MOIS[s.month];
    const events = s.events || {};
    const count  = Object.keys(events).length;

    const payload = {
        _source:    'Le Bureau du Prof — Widget Calendrier',
        _calId:     calId,
        _exportedAt: new Date().toISOString(),
        _eventCount: count,
        events
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `calendrier-events-${calId.slice(-8)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function _calImportJSON(widget, file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            // Accepter soit { events: {...} } soit directement { "YYYY-MM-DD": {...} }
            const events = data.events || data;

            // Valider que c'est bien un objet de paires date → { label, color }
            let valid = typeof events === 'object' && events !== null;
            if (valid) {
                for (const [k, v] of Object.entries(events)) {
                    if (!/^\d{4}-\d{2}-\d{2}$/.test(k) || typeof v.label !== 'string') {
                        valid = false; break;
                    }
                }
            }
            if (!valid) { alert('Fichier JSON invalide — format attendu : { "YYYY-MM-DD": { "label": "...", "color": "..." } }'); return; }

            if (typeof snapshotNow === 'function') snapshotNow();
            widget._calState.events = events;
            calEventStorage.set(widget.dataset.calId, events);
            _calRender(widget);
            if (typeof saveBoard === 'function') saveBoard();
        } catch(err) {
            alert('Impossible de lire le fichier JSON : ' + err.message);
        }
    };
    reader.readAsText(file);
}

// =========================================================================
// LIAISON DES ÉVÉNEMENTS
// =========================================================================
function _calBindEvents(widget) {
    const s   = widget._calState;
    const con = widget.querySelector('.cal-container');

    // ── Navigation ──
    con.querySelector('.cal-prev').addEventListener('click', (e) => {
        e.stopPropagation();
        s.month--; if (s.month < 0) { s.month = 11; s.year--; }
        _calRender(widget); saveBoard();
    });
    con.querySelector('.cal-next').addEventListener('click', (e) => {
        e.stopPropagation();
        s.month++; if (s.month > 11) { s.month = 0; s.year++; }
        _calRender(widget); saveBoard();
    });
    con.querySelector('.cal-today-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const now = new Date(); s.year = now.getFullYear(); s.month = now.getMonth();
        _calRender(widget); saveBoard();
    });
    con.querySelector('.cal-theme-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        s.darkMode = !s.darkMode;
        _calRender(widget); saveBoard();
    });

    // ── Options ──
    const optsBtn   = con.querySelector('.cal-opts-btn');
    const optsPanel = con.querySelector('.cal-opts-panel');
    optsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        optsPanel.style.display = optsPanel.style.display === 'none' ? 'flex' : 'none';
    });
    con.querySelector('.cal-cb-we').addEventListener('change', function(e) {
        e.stopPropagation(); s.showWeekends = this.checked; _calRender(widget); saveBoard();
    });
    con.querySelector('.cal-cb-wn').addEventListener('change', function(e) {
        e.stopPropagation(); s.showWeekNums = this.checked; _calRender(widget); saveBoard();
    });

    // ── Export JSON ──
    con.querySelector('.cal-export-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        _calExportJSON(widget);
    });

    // ── Import JSON ──
    const importInput = con.querySelector('.cal-import-input');
    importInput.addEventListener('change', (e) => {
        e.stopPropagation();
        _calImportJSON(widget, importInput.files[0]);
        importInput.value = '';
    });

    // ── Badge IDB (clic = forcer re-sauvegarde) ──
    con.querySelector('.cal-idb-status').addEventListener('click', (e) => {
        e.stopPropagation();
        _calSaveEvents(widget);
    });

    // ── Clic sur un jour ──
    con.querySelectorAll('.cal-day[data-day]').forEach(cell => {
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            const key = `${cell.dataset.year}-${String(parseInt(cell.dataset.month)+1).padStart(2,'0')}-${String(cell.dataset.day).padStart(2,'0')}`;
            const ev  = s.events[key] || { label: '', color: 'bleu' };
            const bar = con.querySelector('.cal-event-bar');
            con.querySelectorAll('.cal-day.cal-selected').forEach(c => c.classList.remove('cal-selected'));
            cell.classList.add('cal-selected');
            bar.querySelector('.cal-ev-input').value = ev.label;
            bar.querySelector('.cal-ev-color').value = ev.color || 'bleu';
            bar.dataset.key = key;
            bar.style.display = 'flex';
            bar.querySelector('.cal-ev-input').focus();
        });
    });

    // ── Barre événement ──
    const bar = con.querySelector('.cal-event-bar');

    bar.querySelector('.cal-ev-save').addEventListener('click', (e) => {
        e.stopPropagation();
        const label = bar.querySelector('.cal-ev-input').value.trim();
        const color = bar.querySelector('.cal-ev-color').value;
        if (label) s.events[bar.dataset.key] = { label, color };
        else delete s.events[bar.dataset.key];
        _calSaveEvents(widget);   // → IndexedDB
        _calRender(widget);
        saveBoard();              // → localStorage
    });
    bar.querySelector('.cal-ev-del').addEventListener('click', (e) => {
        e.stopPropagation();
        delete s.events[bar.dataset.key];
        _calSaveEvents(widget);
        _calRender(widget);
        saveBoard();
    });
    bar.querySelector('.cal-ev-cancel').addEventListener('click', (e) => {
        e.stopPropagation();
        bar.style.display = 'none';
        con.querySelectorAll('.cal-day.cal-selected').forEach(c => c.classList.remove('cal-selected'));
    });
    bar.querySelector('.cal-ev-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter')  bar.querySelector('.cal-ev-save').click();
        if (e.key === 'Escape') bar.querySelector('.cal-ev-cancel').click();
        e.stopPropagation();
    });

    // Bloquer drag sur tous les contrôles
    con.querySelectorAll('button, input, select, label').forEach(el => {
        el.addEventListener('mousedown', e => e.stopPropagation());
    });
}

// =========================================================================
// UTILITAIRES
// =========================================================================
function _getWeekNumber(d) {
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

// =========================================================================
// SÉRIALISATION (save-load board)
// =========================================================================
function _calGetSaveData(widget) {
    return widget._calState ? JSON.stringify(widget._calState) : null;
}

// Restauration depuis le JSON du board — charge aussi les événements depuis IndexedDB
function _calRestoreData(widget, json) {
    try {
        widget._calState = JSON.parse(json);
        if (widget._calState.darkMode === undefined) widget._calState.darkMode = false;
    } catch(e) {
        const now = new Date();
        widget._calState = { year: now.getFullYear(), month: now.getMonth(), events: {}, showWeekends: true, showWeekNums: false, darkMode: false };
    }

    // Tenter de fusionner avec les données IndexedDB (source de vérité des événements)
    const calId = widget.dataset.calId;
    if (calId) {
        calEventStorage.get(calId).then(idbEvents => {
            if (idbEvents && Object.keys(idbEvents).length > 0) {
                // IndexedDB prime : plus fiable que le JSON du board pour les événements
                widget._calState.events = idbEvents;
            }
            _calRender(widget);
        }).catch(() => {
            _calRender(widget);
        });
    } else {
        _calRender(widget);
    }
}
