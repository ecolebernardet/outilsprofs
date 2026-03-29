// =========================================================================
// WIDGET TIRAGE AU SORT — Le Bureau du Prof
// Inspiré de outils_tirage.html (OutilsProfs)
//
// 📌 Intégration dans index.html :
//   1. Ajouter avant </body> (après widgets.js) :
//      <script src="widget-tirage.js"></script>
//
//   2. Ajouter dans le menu (sous-menu Outils) :
//      <div class="mm-sub-item" onclick="createTirageWidget();closeMainMenu()">
//          <span class="mm-ico">🎡</span>Tirage au Sort
//      </div>
// =========================================================================

(function () {

    // ── CSS injecté une seule fois ────────────────────────────────────────
    const STYLE = `
    /* ── Widget transparent ── */
    .widget[data-type="tirage"] {
        min-width: unset;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
    }

    /* ── Wrapper externe ── */
    .widget[data-type="tirage"] .tirage-outer {
        position: relative;
        width: 600px;
        height: 700px;
        min-width: 280px;
        min-height: 200px;
        overflow: hidden;
        resize: none;
        box-sizing: border-box;
        border-radius: 20px;
    }
    .widget[data-type="tirage"] .tirage-outer::-webkit-resizer { display: none; }
    .widget[data-type="tirage"]:hover .tirage-outer,
    .widget[data-type="tirage"]:focus-within .tirage-outer {
        outline: 2px dashed rgba(59,130,246,0.35);
        outline-offset: 1px;
    }

    /* ── Container intérieur plein ── */
    .tirage-inner {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background: #ffffff;
        border: 1.5px solid #dddddd;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 4px 20px rgba(0,0,0,0.12);
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
        color: #111111;
        user-select: none;
        box-sizing: border-box;
        position: relative;
    }

    /* ── Header ── */
    .tirage-header {
        background: #f5f5f5;
        border-bottom: 1px solid #e0e0e0;
        padding: 10px 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        flex-shrink: 0;
        cursor: move;
    }
    .tirage-header-title {
        font-size: 12px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 1px;
        flex-grow: 1;
        text-align: center;
        color: #111;
    }
    .tirage-header-btn {
        width: 30px; height: 30px;
        border-radius: 50%;
        border: none;
        cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px;
        background: #e0e0e0;
        color: #333;
        transition: transform .15s, background .15s;
        flex-shrink: 0;
    }
    .tirage-header-btn:hover { transform: scale(1.1); background: #cccccc; }

    /* ── Import zone ── */
    .tirage-import-zone {
        padding: 20px 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        flex: 1;
    }
    .tirage-import-btn {
        padding: 10px 20px;
        border-radius: 50px;
        border: none;
        font-size: 11px;
        font-weight: 900;
        text-transform: uppercase;
        cursor: pointer;
        transition: transform .1s, opacity .2s;
        font-family: inherit;
        background: #3b82f6;
        color: #fff;
    }
    .tirage-import-btn:active { transform: scale(0.95); }
    .tirage-status {
        font-size: 11px;
        font-weight: 600;
        color: #999;
        text-align: center;
    }
    .tirage-status.ok  { color: #059669; }
    .tirage-status.err { color: #dc2626; }

    /* ── Filtres niveau ── */
    .tirage-level-tabs {
        display: none;
        flex-wrap: wrap;
        gap: 5px;
        padding: 8px 14px;
        justify-content: center;
        flex-shrink: 0;
        border-bottom: 1px solid #f0f0f0;
    }
    .tirage-level-tab {
        padding: 3px 10px;
        border-radius: 50px;
        font-size: 10px;
        font-weight: 900;
        text-transform: uppercase;
        cursor: pointer;
        border: 1.5px solid #e0e0e0;
        transition: all .15s;
        font-family: inherit;
        background: #f0f0f0;
        color: #999;
    }

    /* ── Grille élèves ── */
    .tirage-body {
        padding: 10px 14px 8px;
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
        overflow-y: auto;
        min-height: 0;
        scrollbar-width: thin;
        scrollbar-color: #ccc transparent;
        --pill-fs: 9px;
        --pill-pad: 4px;
        --pill-gap: 4px;
    }
    .tirage-level-label {
        font-size: 9px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 1px;
		margin-top: 10px;
        margin-bottom: 10px;
        text-align: center;
    }
    .tirage-grid {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: var(--pill-gap, 4px);
    }
    .tirage-pill {
        padding: var(--pill-pad, 4px) 2px;
        border-radius: 999px;
        font-size: var(--pill-fs, 9px);
        font-weight: 800;
        text-align: center;
        cursor: pointer;
        background: #f5f5f5;
        border: 1px solid #e0e0e0;
        transition: all .15s;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        -webkit-tap-highlight-color: transparent;
    }
    .tirage-pill:hover { border-color: #bbb; background: #eeeeee; }
    .tirage-pill.girl { color: #16a34a; }
    .tirage-pill.boy  { color: #ea580c; }
    .tirage-pill.drawn {
        background: #ebebeb !important;
        color: #bbbbbb !important;
        text-decoration: line-through;
        border-color: #dddddd !important;
        opacity: 0.7;
        transform: scale(0.94);
    }

    /* ── Carte résultat ── */
    .tirage-result-card {
		display: block; /* Indispensable pour que margin: auto fonctionne */
        margin: 0 auto; /* Centre horizontalement */
        background: #f8f8f8;
        border: 1px solid #e8e8e8;
        border-radius: 14px;
        padding: 12px;
		width: 30%;
		min-width: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
		margin-bottom: 20px;
    }
    .tirage-result-display {
        background: #ffffff;
        border: 1px solid #dddddd;
        border-radius: 10px;
        height: 60px;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: 900;
        transition: transform .2s cubic-bezier(0.175, 0.885, 0.32, 1.275), color .2s;
    }
    .tirage-draw-btn {
        width: 80%;
        padding: 10px;
        font-size: 10px;
        font-weight: 900;
        border-radius: 50px;
        text-transform: uppercase;
        border: none;
        cursor: pointer;
		margin-top: 20px;
		padding: 20px;
        transition: transform .1s, opacity .2s;
        font-family: inherit;
        background: #3b82f6;
        color: #fff;
    }
    .tirage-draw-btn:active { transform: scale(0.95); }
    .tirage-draw-btn:disabled { opacity: 0.45; cursor: not-allowed; filter: grayscale(0.5); }
    .tirage-stats {
        font-size: 9px;
        color: #aaa;
        font-weight: 800;
    }

    /* ── Footer RàZ ── */
    .tirage-footer {
        padding: 0 12px 12px;
        flex-shrink: 0;
    }
    .tirage-reset-btn {
		display: block; /* Indispensable pour que margin: auto fonctionne */
        margin: 0 auto; /* Centre horizontalement */
        width: 25%;
		min-width: 200px;
        padding: 10px;
        border-radius: 50px;
        font-size: 10px;
        font-weight: 900;
        cursor: pointer;
        border: none;
        font-family: inherit;
        background: #F87C63;
        color: #fff;
        transition: transform .2s, opacity .2s;
    }
    .tirage-reset-btn:active { transform: scale(0.98); }

    /* ── Modal confirmation ── */
    .tirage-modal-overlay {
        display: none;
        position: absolute;
        inset: 0;
        z-index: 200;
        background: rgba(0,0,0,0.4);
        backdrop-filter: blur(4px);
        align-items: center;
        justify-content: center;
        padding: 20px;
        border-radius: 20px;
        box-sizing: border-box;
    }
    .tirage-modal-overlay.open { display: flex; }
    .tirage-modal-box {
        background: #fff;
        padding: 20px;
        border-radius: 18px;
        width: 100%;
        max-width: 290px;
        color: #111;
        box-shadow: 0 20px 40px rgba(0,0,0,0.25);
    }
    .tirage-modal-title {
        font-size: 14px;
        font-weight: 900;
        text-transform: uppercase;
        text-align: center;
        margin-bottom: 7px;
        color: #111;
    }
    .tirage-modal-text {
        font-size: 12px;
        color: #555;
        text-align: center;
        line-height: 1.5;
        font-weight: 500;
        white-space: pre-line;
    }
    .tirage-modal-btns {
        display: flex;
        gap: 8px;
        margin-top: 14px;
    }
    .tirage-modal-btn {
        flex: 1;
        padding: 10px;
        border: none;
        border-radius: 12px;
        font-weight: 900;
        font-size: 11px;
        text-transform: uppercase;
        cursor: pointer;
        font-family: inherit;
        transition: transform .15s;
    }
    .tirage-modal-btn:active { transform: scale(0.95); }
    .tirage-modal-cancel { background: #eee; color: #666; }
    `;

    if (!document.getElementById('tirage-widget-style')) {
        const s = document.createElement('style');
        s.id = 'tirage-widget-style';
        s.textContent = STYLE;
        document.head.appendChild(s);
    }

    // ── Constantes ────────────────────────────────────────────────────────
    const TIRAGE_LEVEL_COLORS = {
        'CP': '#ec4899', 'CE1': '#3b82f6', 'CE2': '#eab308',
        'CM1': '#ef4444', 'CM2': '#22c55e', 'AUTRE': '#a855f7'
    };
    const TIRAGE_LEVEL_ORDER = ['CP','CE1','CE2','CM1','CM2','AUTRE'];
    const TIRAGE_THEME       = '#3b82f6';
    const DRAW_ITERATIONS    = 15;
    const DRAW_INTERVAL      = 70;

    // ── HTML interne partagé (création + restauration) ────────────────────
    function tirageInnerHTML() {
        return `
        <div class="tirage-inner">
            <div class="tirage-header">
                <button class="tirage-header-btn tirage-import-header-btn" title="Importer une liste">📂</button>
                <div class="tirage-header-title">🎲 Tirage au Sort</div>
                <button class="tirage-header-btn tirage-help-btn" title="Aide">💡</button>
            </div>
            <div class="tirage-import-zone">
                <button class="tirage-import-btn">📄 Importer une liste d'élèves</button>
                <input type="file" class="tirage-file-input" accept=".txt,.csv" style="display:none;">
                <div class="tirage-status">Format : Prénom;NOM;sexe;NIVEAU;date</div>
            </div>
            <div class="tirage-level-tabs"></div>
            <div class="tirage-body" style="display:none;"></div>
            <div class="tirage-result-card" style="display:none;">
                <div class="tirage-result-display" style="color:#3b82f6;">PRÊT</div>
                <button class="tirage-draw-btn" disabled>🎲 Tirer un prénom</button>
                <div class="tirage-stats">--</div>
            </div>
            <div class="tirage-footer" style="display:none;">
                <button class="tirage-reset-btn">⚠️ RàZ du tirage</button>
            </div>
            <div class="tirage-modal-overlay">
                <div class="tirage-modal-box">
                    <div class="tirage-modal-title">Confirmation</div>
                    <p class="tirage-modal-text"></p>
                    <div class="tirage-modal-btns">
                        <button class="tirage-modal-btn tirage-modal-cancel">Annuler</button>
                        <button class="tirage-modal-btn tirage-modal-confirm" style="background:#3b82f6;color:#fff;">Confirmer</button>
                    </div>
                </div>
            </div>
        </div>`;
    }

    // =========================================================================
    // INITIALISATION (création ET restauration)
    // =========================================================================
    window.initTirageWidget = function (widget) {

        const outer = widget.querySelector('.tirage-outer');

        // Bloquer la remontée mousedown depuis l'intérieur (sinon le drag se déclenche)
        outer.addEventListener('mousedown', e => e.stopPropagation());

        // ── Header draggable (une seule fois) ─────────────────────────────
        const tirageHeader = widget.querySelector('.tirage-header');
        if (tirageHeader && !tirageHeader._dragInit) {
            tirageHeader._dragInit = true;
            const onHeaderDown = (e) => {
                if (typeof isDrawMode !== 'undefined' && (isDrawMode || isEraserMode)) return;
                if (e.target.closest('button')) return;
                if (typeof bringToFront === 'function') bringToFront(widget);
                widget.focus();
                if (typeof startWidgetDrag === 'function') startWidgetDrag(e.touches ? e.touches[0] : e, widget);
            };
            tirageHeader.addEventListener('mousedown',  onHeaderDown);
            tirageHeader.addEventListener('touchstart', onHeaderDown, { passive: false });
        }

        // ── Références DOM ────────────────────────────────────────────────
        const importZone      = widget.querySelector('.tirage-import-zone');
        const importBtn       = widget.querySelector('.tirage-import-btn');
        const importHeaderBtn = widget.querySelector('.tirage-import-header-btn');
        const fileInput       = widget.querySelector('.tirage-file-input');
        const statusEl        = widget.querySelector('.tirage-status');
        const levelTabs       = widget.querySelector('.tirage-level-tabs');
        const body            = widget.querySelector('.tirage-body');
        const resultCard      = widget.querySelector('.tirage-result-card');
        const resultDisplay   = widget.querySelector('.tirage-result-display');
        const drawBtn         = widget.querySelector('.tirage-draw-btn');
        const statsEl         = widget.querySelector('.tirage-stats');
        const footer          = widget.querySelector('.tirage-footer');
        const resetBtn        = widget.querySelector('.tirage-reset-btn');
        const modalOverlay    = widget.querySelector('.tirage-modal-overlay');
        const helpBtn         = widget.querySelector('.tirage-help-btn');

        // ── État ──────────────────────────────────────────────────────────
        let allStudents  = [];
        let remaining    = [];
        let isDrawing    = false;
        let currentLevel = 'tous';

        // Restaurer depuis dataset si données présentes (priorité board JSON)
        // Sinon, chercher dans localStorage (liste permanente)
        if (widget.dataset.tirageStudents) {
            try {
                allStudents = JSON.parse(widget.dataset.tirageStudents);
                remaining   = JSON.parse(widget.dataset.tirageRemaining || '[]').map(Number);
                if (!remaining.length && allStudents.length)
                    remaining = allStudents.map(s => Number(s.id));
                showLoadedState();
            } catch(e) { console.warn('tirage: erreur restauration dataset', e); }
        } else {
            // Charger la liste depuis localStorage si disponible
            try {
                const saved = localStorage.getItem('tirage_students_list');
                if (saved) {
                    allStudents = JSON.parse(saved);
                    remaining   = allStudents.map(s => s.id); // toujours full au premier chargement
                    setStatus('✓ ' + allStudents.length + ' élève(s) (liste mémorisée)', 'ok');
                    showLoadedState();
                }
            } catch(e) {}
        }

        // ── Import ────────────────────────────────────────────────────────
        importBtn.addEventListener('click', () => fileInput.click());
        importHeaderBtn.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => parseStudents(ev.target.result);
            reader.readAsText(file, 'UTF-8');
            e.target.value = '';
        });

        function parseStudents(text) {
            const lines = text.trim().split('\n').filter(l => l.trim());
            const students = [];
            lines.forEach((line, i) => {
                const parts = line.split(';').map(s => s.trim());
                if (!parts[0]) return;
                students.push({
                    id:     i,
                    prenom: parts[0],
                    nom:    parts[1] || '',
                    sexe:   parts[2] || '',
                    niveau: (parts[3] || 'AUTRE').trim().toUpperCase(),
                    dob:    parts[4] || ''
                });
            });
            if (!students.length) { setStatus('Aucun élève trouvé.', 'err'); return; }
            allStudents = students;
            remaining   = students.map(s => s.id);
            setStatus('✓ ' + students.length + ' élève(s) chargé(s)', 'ok');
            persistData();
            showLoadedState();
        }

        function showLoadedState() {
            importZone.style.display  = 'none';
            body.style.display        = 'flex';
            resultCard.style.display  = 'flex';
            footer.style.display      = 'block';
            drawBtn.disabled          = false;
            buildLevelTabs();
            renderList();
        }

        function setStatus(msg, cls) {
            statusEl.textContent = msg;
            statusEl.className   = 'tirage-status' + (cls ? ' ' + cls : '');
        }

        function normalizeRemaining() {
            remaining = [...new Set(remaining.map(Number))];
        }

        function persistData() {
            normalizeRemaining();
            widget.dataset.tirageStudents  = JSON.stringify(allStudents);
            widget.dataset.tirageRemaining = JSON.stringify(remaining);
            if (allStudents.length) {
                try { localStorage.setItem('tirage_students_list', JSON.stringify(allStudents)); } catch(e) {}
            }
            // NE PAS appeler saveBoard() ici — cela déclencherait restoreBoardFromJSON
            // qui rappellerait initTirageWidget et écraserait remaining en mémoire
        }

        // ── Onglets niveau ────────────────────────────────────────────────
        function buildLevelTabs() {
            const niveaux = [...new Set(allStudents.map(s => s.niveau))].sort((a, b) =>
                (TIRAGE_LEVEL_ORDER.indexOf(a) === -1 ? 99 : TIRAGE_LEVEL_ORDER.indexOf(a)) -
                (TIRAGE_LEVEL_ORDER.indexOf(b) === -1 ? 99 : TIRAGE_LEVEL_ORDER.indexOf(b))
            );
            levelTabs.innerHTML = '';
            if (niveaux.length <= 1) { levelTabs.style.display = 'none'; return; }
            levelTabs.style.display = 'flex';
            levelTabs.appendChild(makeTab('Tous', 'tous'));
            niveaux.forEach(niv => levelTabs.appendChild(makeTab(niv, niv)));
            setActiveTab('tous');
        }

        function makeTab(label, value) {
            const tab = document.createElement('button');
            tab.className    = 'tirage-level-tab';
            tab.textContent  = label;
            tab.dataset.level = value;
            tab.addEventListener('click', () => { currentLevel = value; setActiveTab(value); renderList(); });
            return tab;
        }

        function setActiveTab(value) {
            levelTabs.querySelectorAll('.tirage-level-tab').forEach(t => {
                const isActive = t.dataset.level === value;
                const color    = t.dataset.level === 'tous' ? TIRAGE_THEME : getLevelColor(t.dataset.level);
                t.style.backgroundColor = isActive ? color  : '#f0f0f0';
                t.style.borderColor     = isActive ? color  : '#e0e0e0';
                t.style.color           = isActive ? '#fff' : '#999';
            });
        }

        function getLevelColor(niv) { return TIRAGE_LEVEL_COLORS[niv] || '#a855f7'; }

        // ── Rendu grille ──────────────────────────────────────────────────
        function getFiltered() {
            return currentLevel === 'tous' ? allStudents : allStudents.filter(s => s.niveau === currentLevel);
        }

        function hasDupPrenom(p) {
            return allStudents.filter(s => s.prenom.toLowerCase() === p.toLowerCase()).length > 1;
        }

        function displayName(s) {
            return hasDupPrenom(s.prenom) ? s.prenom + ' ' + s.nom.charAt(0) + '.' : s.prenom;
        }

        function renderList() {
            body.innerHTML = '';
            const students = getFiltered();
            const groups   = {};
            students.forEach(s => { if (!groups[s.niveau]) groups[s.niveau] = []; groups[s.niveau].push(s); });

            const sortedLevels = Object.keys(groups).sort((a, b) =>
                (TIRAGE_LEVEL_ORDER.indexOf(a) === -1 ? 99 : TIRAGE_LEVEL_ORDER.indexOf(a)) -
                (TIRAGE_LEVEL_ORDER.indexOf(b) === -1 ? 99 : TIRAGE_LEVEL_ORDER.indexOf(b))
            );

            sortedLevels.forEach(niv => {
                const block = document.createElement('div');
                if (sortedLevels.length > 1) {
                    const lbl = document.createElement('div');
                    lbl.className = 'tirage-level-label';
                    lbl.style.color = getLevelColor(niv);
                    lbl.textContent = niv;
                    block.appendChild(lbl);
                }
                const grid = document.createElement('div');
                grid.className = 'tirage-grid';
                groups[niv].sort((a, b) => a.prenom.localeCompare(b.prenom)).forEach(s => {
                    const pill = document.createElement('div');
                    pill.className = 'tirage-pill';
                    const isDrawn = !remaining.includes(Number(s.id));
                    pill.classList.add(isDrawn ? 'drawn' : (s.sexe.toLowerCase().startsWith('f') ? 'girl' : 'boy'));
                    pill.textContent = displayName(s);
                    pill.title       = s.prenom + ' ' + s.nom + (isDrawn ? ' (tiré)' : '');
                    pill.addEventListener('click', () => toggleStudent(s.id));
                    grid.appendChild(pill);
                });
                block.appendChild(grid);
                body.appendChild(block);
            });
            updateStats();
        }

        function updateStats() {
            const filtered = getFiltered();
            const remFilt  = filtered.filter(s => remaining.includes(Number(s.id))).length;
            statsEl.textContent = remFilt + ' restant' + (remFilt > 1 ? 's' : '') + ' / ' + filtered.length;
            const hasRem = remaining.length > 0;
            drawBtn.disabled    = !hasRem || isDrawing;
            drawBtn.textContent = hasRem ? '🎲 Tirer un prénom' : 'Session terminée';
        }

        function toggleStudent(id) {
            id = Number(id);
            if (remaining.includes(id)) remaining = remaining.filter(r => Number(r) !== id);
            else remaining = [...new Set([...remaining.map(Number), id])];
            persistData();
            renderList();
        }

        // ── Tirage ────────────────────────────────────────────────────────
        drawBtn.addEventListener('click', drawName);

        function drawName() {
            const pool = getFiltered().map(s => Number(s.id)).filter(id => remaining.includes(id));
            if (!pool.length || isDrawing) return;
            isDrawing = true;
            drawBtn.disabled = true;
            resultDisplay.style.color     = '#ccc';
            resultDisplay.style.transform = 'scale(0.95)';

            const winnerId = Number(pool[Math.floor(Math.random() * pool.length)]);
            const winner   = allStudents.find(s => Number(s.id) === winnerId);

            const STEP_MS   = 70;
            const NB_STEPS  = 14;
            let step = 0;
            // Rotation sur TOUT le pool (y compris le gagnant) pour un défilement fluide
            let rotIdx = Math.floor(Math.random() * pool.length);

            function nextStep() {
                if (step < NB_STEPS) {
                    const tempId = pool[rotIdx % pool.length];
                    rotIdx++;
                    resultDisplay.textContent = displayName(allStudents.find(s => s.id === tempId));
                    step++;
                    setTimeout(nextStep, STEP_MS);
                } else {
                    remaining = remaining.filter(r => Number(r) !== winnerId);
                    resultDisplay.textContent     = displayName(winner);
                    resultDisplay.style.color     = TIRAGE_THEME;
                    resultDisplay.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        resultDisplay.style.transform = 'scale(1)';
                        isDrawing = false;
                        persistData();
                        renderList();
                    }, 250);
                }
            }

            nextStep();
        }

        // ── RàZ ───────────────────────────────────────────────────────────
        resetBtn.addEventListener('click', () => {
            showConfirm('Remettre à zéro ?', 'Tous les élèves seront à nouveau disponibles.', () => {
                remaining = allStudents.map(s => s.id);
                resultDisplay.textContent = 'PRÊT';
                resultDisplay.style.color = TIRAGE_THEME;
                persistData();
                renderList();
            });
        });

        // ── Aide ──────────────────────────────────────────────────────────
        helpBtn.addEventListener('click', () => {
            showConfirm('💡 Comment ça marche',
                '• Cliquez sur un prénom pour l\'exclure (absent).\n• Cliquez à nouveau pour le remettre.\n• Le tirage se fait parmi les élèves restants du niveau affiché.',
                null, 'Compris !');
        });

        // ── Modal ─────────────────────────────────────────────────────────
        function showConfirm(title, text, onConfirm, confirmLabel) {
            modalOverlay.querySelector('.tirage-modal-title').textContent = title;
            modalOverlay.querySelector('.tirage-modal-text').textContent  = text;
            const cancelBtn  = modalOverlay.querySelector('.tirage-modal-cancel');
            const confirmBtn = modalOverlay.querySelector('.tirage-modal-confirm');
            confirmBtn.textContent = confirmLabel || 'Confirmer';
            if (onConfirm) {
                cancelBtn.style.display = '';
                confirmBtn.onclick = () => { closeModal(); onConfirm(); };
            } else {
                cancelBtn.style.display = 'none';
                confirmBtn.onclick = closeModal;
            }
            modalOverlay.classList.add('open');
        }
        function closeModal() { modalOverlay.classList.remove('open'); }
        modalOverlay.querySelector('.tirage-modal-cancel').addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

        // ── Mise à l'échelle des pills selon la largeur du widget ─────────
        function updatePillScale() {
            const w = outer.offsetWidth || 380;
            // On interpole la font-size et le padding entre 280px et 700px
            const minW = 280, maxW = 700;
            const t = Math.max(0, Math.min(1, (w - minW) / (maxW - minW)));
            const fs  = (9  + t * 9).toFixed(1)  + 'px'; // 9px → 18px
            const pad = (4  + t * 6).toFixed(1)  + 'px'; // 4px → 10px
            const gap = (4  + t * 6).toFixed(1)  + 'px'; // 4px → 10px
            body.style.setProperty('--pill-fs',  fs);
            body.style.setProperty('--pill-pad', pad);
            body.style.setProperty('--pill-gap', gap);
        }

        // ── Sauvegarder la taille via ResizeObserver ──────────────────────
        if (window.ResizeObserver) {
            const ro = new ResizeObserver(() => {
                if (outer.offsetWidth  > 0) widget.dataset.tirageW = outer.offsetWidth;
                if (outer.offsetHeight > 0) widget.dataset.tirageH = outer.offsetHeight;
                updatePillScale();
            });
            ro.observe(outer);
            updatePillScale(); // appel initial
            const guard = new MutationObserver(() => {
                if (!document.contains(widget)) { ro.disconnect(); guard.disconnect(); }
            });
            guard.observe(document.body, { childList: true, subtree: true });
        }
    };

    // =========================================================================
    // CRÉATION D'UN NOUVEAU WIDGET
    // =========================================================================
    window.createTirageWidget = function () {
        if (typeof snapshotNow === 'function') snapshotNow();
        const pos = (typeof findFreePosition === 'function') ? findFreePosition() : { x: 120, y: 80 };

        const widget = document.createElement('div');
        widget.className = 'widget';
        widget.dataset.type = 'tirage';
        widget.dataset.transparent = 'true';
        widget.style.cssText = `left:${pos.x}px; top:${pos.y}px;`;
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
            <div class="tirage-outer editor-container">${tirageInnerHTML()}</div>
        `;

        board.appendChild(widget);
        if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
        makeDraggable(widget);
        makeDraggableRotate(widget);
        bringToFront(widget);
        widget.focus();
        initTirageWidget(widget);
        saveBoard();
        return widget;
    };

    // =========================================================================
    // HOOK buildBoardState — inclure dimensions + données dans le JSON
    // =========================================================================
    (function patchBuildBoardState() {
        const _orig = window.buildBoardState;
        if (typeof _orig !== 'function') return;
        window.buildBoardState = function () {
            const state = _orig.apply(this, arguments);
            document.querySelectorAll('.widget[data-type="tirage"]').forEach(widget => {
                const outer = widget.querySelector('.tirage-outer');
                if (!outer) return;
                const match = (state.widgets || []).find(w =>
                    w.type === 'tirage' &&
                    Math.abs(parseFloat(w.leftPercent) - parseFloat(widget.dataset.leftPercent)) < 0.5
                );
                if (match) {
                    if (outer.offsetWidth  > 0) { match.tirageW = outer.offsetWidth;  widget.dataset.tirageW = outer.offsetWidth; }
                    if (outer.offsetHeight > 0) { match.tirageH = outer.offsetHeight; widget.dataset.tirageH = outer.offsetHeight; }
                    if (widget.dataset.tirageStudents)  match.tirageStudents  = widget.dataset.tirageStudents;
                    if (widget.dataset.tirageRemaining) match.tirageRemaining = widget.dataset.tirageRemaining;
                }
            });
            return state;
        };
    })();

    // =========================================================================
    // HOOK restoreBoardFromJSON — reconstruire + réinitialiser après chargement
    // =========================================================================
    (function patchRestoreTirage() {
        function doPatch() {
            const _orig = window.restoreBoardFromJSON;
            if (typeof _orig !== 'function') return;
            window.restoreBoardFromJSON = function (json) {
                // Pré-parser pour stocker les données tirage par position
                let tirageData = {};
                try {
                    const parsed  = JSON.parse(json);
                    const widgets = Array.isArray(parsed) ? parsed : (parsed.widgets || []);
                    widgets.forEach(w => {
                        if (w.type === 'tirage') {
                            const key = (w.leftPercent || 0).toFixed(1) + '_' + (w.topPercent || 0).toFixed(1);
                            tirageData[key] = w;
                        }
                    });
                } catch(e) {}

                _orig.apply(this, arguments);

                // Après restauration, injecter le HTML et initialiser chaque widget tirage
                setTimeout(() => {
                    document.querySelectorAll('.widget[data-type="tirage"]').forEach(widget => {
                        let outer = widget.querySelector('.tirage-outer');

                        // Si le moteur de restauration a créé un placeholder vide, le remplacer
                        if (!outer) {
                            outer = document.createElement('div');
                            outer.className = 'tirage-outer editor-container';
                            widget.appendChild(outer);
                        }

                        // Injecter le HTML interne si absent
                        if (!outer.querySelector('.tirage-inner')) {
                            outer.innerHTML = tirageInnerHTML();
                        }

                        // Récupérer les données sauvegardées
                        const key   = (parseFloat(widget.dataset.leftPercent) || 0).toFixed(1) + '_' +
                                      (parseFloat(widget.dataset.topPercent)  || 0).toFixed(1);
                        const saved = tirageData[key];

                        if (saved) {
                            if (saved.tirageStudents)  widget.dataset.tirageStudents  = saved.tirageStudents;
                            if (saved.tirageRemaining) widget.dataset.tirageRemaining = saved.tirageRemaining;
                            const w = saved.tirageW || parseFloat(widget.dataset.tirageW);
                            const h = saved.tirageH || parseFloat(widget.dataset.tirageH);
                            if (w > 0) outer.style.width  = w + 'px';
                            if (h > 0) outer.style.height = h + 'px';
                        }

                        initTirageWidget(widget);
                    });
                }, 150);
            };
        }

        if (typeof window.restoreBoardFromJSON === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

    // =========================================================================
    // HOOK createWidget — intercepter type 'tirage'
    // =========================================================================
    (function patchCreateWidget() {
        function doPatch() {
            const _orig = window.createWidget;
            if (typeof _orig !== 'function') return;
            window.createWidget = function (type) {
                if (type === 'tirage') return window.createTirageWidget();
                return _orig.apply(this, arguments);
            };
        }
        if (typeof window.createWidget === 'function') doPatch();
        else document.addEventListener('DOMContentLoaded', doPatch);
    })();

})();
