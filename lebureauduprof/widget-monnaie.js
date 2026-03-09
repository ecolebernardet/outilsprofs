// =========================================================================
// WIDGET MONNAIE — Le Bureau du Prof
// Affiche un ensemble de pièces et billets euros à additionner.
// 3 niveaux : facile / moyen / difficile
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    const s = document.createElement('style');
    s.textContent = `
        .widget[data-type="monnaie"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .monnaie-container {
            background: #fffdf4;
            border: 2px solid #e8d89a;
            border-radius: 16px;
            padding: 14px 16px 12px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 10px;
            width: 480px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
        }
        .monnaie-container input {
            user-select: text;
            -webkit-user-select: text;
        }

        /* En-tête */
        .monnaie-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
        }
        .monnaie-title {
            font-size: 13px;
            font-weight: 800;
            color: #7a5c00;
            letter-spacing: 0.3px;
        }
        .monnaie-level-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 20px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .monnaie-level-badge.facile   { background: #d4edda; color: #1a7a3a; }
        .monnaie-level-badge.moyen    { background: #fff3cd; color: #8a5c00; }
        .monnaie-level-badge.difficile{ background: #f8d7da; color: #842029; }

        /* Contrôles */
        .monnaie-controls {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            align-items: center;
        }
        .monnaie-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            transition: background .15s, transform .1s;
        }
        .monnaie-btn:active { transform: scale(0.96); }
        .monnaie-btn-new {
            background: #4a90e2;
            color: white;
        }
        .monnaie-btn-new:hover { background: #357abd; }
        .monnaie-btn-answer {
            background: #f0f0f0;
            color: #333;
            border: 1px solid #ddd;
        }
        .monnaie-btn-answer:hover { background: #e0e0e0; }
        .monnaie-btn-answer.revealed {
            background: #28a745;
            color: white;
            border-color: #28a745;
        }

        .monnaie-level-btns {
            display: flex;
            gap: 4px;
            margin-left: auto;
        }
        .monnaie-lvl-btn {
            padding: 4px 9px;
            border-radius: 6px;
            border: 1px solid #ddd;
            background: #f5f5f5;
            font-size: 10px;
            font-weight: 700;
            cursor: pointer;
            color: #666;
            transition: background .15s;
        }
        .monnaie-lvl-btn:hover { background: #e0e0e0; }
        .monnaie-lvl-btn.active-facile    { background: #d4edda; color: #1a7a3a; border-color: #a3d4b0; }
        .monnaie-lvl-btn.active-moyen     { background: #fff3cd; color: #8a5c00; border-color: #ffd97a; }
        .monnaie-lvl-btn.active-difficile { background: #f8d7da; color: #842029; border-color: #f5a8ae; }

        /* Zone items */
        .monnaie-items {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            align-items: center;
            align-content: center;
            height: 160px;
            overflow: hidden;
            padding: 8px;
            background: #fff9e6;
            border: 1px solid #edd;
            border-radius: 10px;
            flex-shrink: 0;
            box-sizing: border-box;
        }

        .monnaie-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3px;
            position: relative;
        }
        .monnaie-item img {
            display: block;
            object-fit: contain;
            pointer-events: none;
            filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
        }
        .monnaie-item .monnaie-qty {
            font-size: 10px;
            font-weight: 700;
            color: #666;
            background: rgba(255,255,255,0.85);
            border-radius: 8px;
            padding: 1px 5px;
        }

        /* Réponse */
        .monnaie-answer-zone {
            min-height: 28px;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .monnaie-answer-text {
            font-size: 15px;
            font-weight: 800;
            color: #28a745;
            opacity: 0;
            transition: opacity .3s;
        }
        .monnaie-answer-text.show { opacity: 1; }
        .monnaie-answer-input {
            flex: 1;
            max-width: 110px;
            padding: 5px 10px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 700;
            outline: none;
            text-align: right;
            transition: border-color .2s;
        }
        .monnaie-answer-input:focus { border-color: #4a90e2; }
        .monnaie-answer-input.correct { border-color: #28a745; background: #f0fff4; color: #1a7a3a; }
        .monnaie-answer-input.wrong   { border-color: #dc3545; background: #fff5f5; color: #9c1c28; }
        .monnaie-answer-label {
            font-size: 12px;
            color: #888;
        }
        .monnaie-check-btn {
            padding: 5px 12px;
            border-radius: 8px;
            border: none;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            background: #4a90e2;
            color: white;
            transition: background .15s;
        }
        .monnaie-check-btn:hover { background: #357abd; }

        /* Resize handle */
        .monnaie-resize-handle {
            position: absolute;
            right: 0; bottom: 0;
            width: 18px; height: 18px;
            cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0;
            opacity: 0;
            transition: opacity .2s;
            z-index: 5;
        }
        .monnaie-container:hover .monnaie-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Données monnaie ───────────────────────────────────────────────────────
const MONNAIE_DATA = {
    billets: [
        { valeur: 500,  label: '5 €',   src: 'images/monnaie-billet-5.jpg',   w: 110, h: 55,  type: 'billet' },
        { valeur: 1000, label: '10 €',  src: 'images/monnaie-billet-10.jpg',  w: 110, h: 55,  type: 'billet' },
        { valeur: 2000, label: '20 €',  src: 'images/monnaie-billet-20.jpg',  w: 110, h: 55,  type: 'billet' },
        { valeur: 5000, label: '50 €',  src: 'images/monnaie-billet-50.jpg',  w: 110, h: 55,  type: 'billet' },
        { valeur:10000, label: '100 €', src: 'images/monnaie-billet-100.jpg', w: 110, h: 55,  type: 'billet' },
    ],
    pieces: [
        { valeur:   1, label: '1 c',   src: 'images/monnaie-piece-001.png',  w: 42,  h: 42,  type: 'piece' },
        { valeur:   2, label: '2 c',   src: 'images/monnaie-piece-002.png',  w: 44,  h: 44,  type: 'piece' },
        { valeur:   5, label: '5 c',   src: 'images/monnaie-piece-005.png',  w: 46,  h: 46,  type: 'piece' },
        { valeur:  10, label: '10 c',  src: 'images/monnaie-piece-010.png',  w: 48,  h: 48,  type: 'piece' },
        { valeur:  20, label: '20 c',  src: 'images/monnaie-piece-020.png',  w: 50,  h: 50,  type: 'piece' },
        { valeur:  50, label: '50 c',  src: 'images/monnaie-piece-050.png',  w: 52,  h: 52,  type: 'piece' },
        { valeur: 100, label: '1 €',   src: 'images/monnaie-piece-1.png',    w: 54,  h: 54,  type: 'piece' },
        { valeur: 200, label: '2 €',   src: 'images/monnaie-piece-2.png',    w: 58,  h: 58,  type: 'piece' },
    ]
};

// Toutes les valeurs en centimes
// valeur billet * 100 pour avoir des centimes (ex. 5€ = 500c)
// valeur pièce directement en centimes

const NIVEAUX = {
    facile: {
        label: 'Facile',
        // Billets : 5, 10, 20, 50 €  (max total 50€ = 5000c)
        billets: [500, 1000, 2000, 5000],
        // Pièces : max 100 centimes au total
        maxCentimes: 100,
        // Montant billet max (en centimes)
        maxBillets: 5000,
        // Nb items
        minItems: 2, maxItems: 5
    },
    moyen: {
        label: 'Moyen',
        // Billets : 5, 10, 20, 50 € (pas de 100)
        billets: [500, 1000, 2000, 5000],
        maxCentimes: 120,
        maxBillets: 9999,
        minItems: 3, maxItems: 7
    },
    difficile: {
        label: 'Difficile',
        // Tous les billets
        billets: [500, 1000, 2000, 5000, 10000],
        minCentimes: 100,
        maxCentimes: 300,
        maxBillets: 99999,
        minItems: 4, maxItems: 9
    }
};

// ── Générateur d'exercice ─────────────────────────────────────────────────
function _genMonnaie(niveauKey) {
    const niveau = NIVEAUX[niveauKey];
    const selected = [];
    let totalCentimes = 0;

    // Pièces "centimes" (1c à 50c) — celles dont on contrôle le total
    const PIECES_CENTIMES = MONNAIE_DATA.pieces.filter(p => p.valeur <= 50);
    // Pièces "euro" (1€ et 2€) — traitées comme des billets
    const PIECES_EURO     = MONNAIE_DATA.pieces.filter(p => p.valeur >= 100);

    // ── 1. Billets ───────────────────────────────────────────────────────
    const billetsDispos = MONNAIE_DATA.billets.filter(b => niveau.billets.includes(b.valeur));
    const billMix = [...billetsDispos].sort(() => Math.random() - 0.5);
    const nbTypeBillets = Math.floor(Math.random() * 3); // 0, 1 ou 2 types
    for (let i = 0; i < Math.min(nbTypeBillets, billMix.length); i++) {
        const b = billMix[i];
        const maxQty = Math.min(3, Math.floor((niveau.maxBillets - totalCentimes) / b.valeur));
        if (maxQty < 1) continue;
        const qty = Math.floor(Math.random() * maxQty) + 1;
        if (totalCentimes + b.valeur * qty > niveau.maxBillets) continue;
        selected.push({ item: b, qty });
        totalCentimes += b.valeur * qty;
    }

    // ── 2. Pièces euro (1€, 2€) — optionnelles selon le niveau ──────────
    if (niveauKey === 'moyen' || niveauKey === 'difficile') {
        const peMix = [...PIECES_EURO].sort(() => Math.random() - 0.5);
        for (const p of peMix) {
            if (Math.random() < 0.5) continue;
            const qty = Math.floor(Math.random() * 3) + 1;
            selected.push({ item: p, qty });
            totalCentimes += p.valeur * qty;
        }
    }

    // ── 3. Pièces centimes ───────────────────────────────────────────────
    const minC = niveau.minCentimes || 0;
    const maxC = niveau.maxCentimes;

    if (minC > 0) {
        // Mode difficile : total pièces centimes STRICTEMENT dans [minC, maxC]
        // On choisit une cible aléatoire dans cet intervalle
        const target = minC + Math.floor(Math.random() * (maxC - minC + 1));
        let remaining = target;

        // Algorithme : on mélange les pièces centimes et on remplit aléatoirement
        // en s'assurant de ne pas dépasser `remaining`
        const pcMix = [...PIECES_CENTIMES].sort(() => Math.random() - 0.5);
        for (const p of pcMix) {
            if (remaining <= 0) break;
            const maxQty = Math.min(4, Math.floor(remaining / p.valeur));
            if (maxQty < 1) continue;
            if (Math.random() < 0.35) continue; // pas toujours toutes les pièces
            const qty = Math.floor(Math.random() * maxQty) + 1;
            selected.push({ item: p, qty });
            remaining -= p.valeur * qty;
            totalCentimes += p.valeur * qty;
        }
        // Combler l'écart restant avec la pièce la plus adaptée
        if (remaining > 0) {
            // Chercher la plus grande pièce qui rentre dans remaining
            const piecesDesc = [...PIECES_CENTIMES].sort((a, b) => b.valeur - a.valeur);
            for (const p of piecesDesc) {
                if (remaining <= 0) break;
                const qty = Math.min(4, Math.floor(remaining / p.valeur));
                if (qty < 1) continue;
                const existing = selected.find(s => s.item.valeur === p.valeur);
                const addQty = Math.min(qty, 4 - (existing ? existing.qty : 0));
                if (addQty < 1) continue;
                if (existing) { existing.qty += addQty; }
                else { selected.push({ item: p, qty: addQty }); }
                remaining -= p.valeur * addQty;
                totalCentimes += p.valeur * addQty;
            }
        }
    } else {
        // Mode facile/moyen : total pièces centimes entre 0 et maxC
        const pcMix = [...PIECES_CENTIMES].sort(() => Math.random() - 0.5);
        let cUsed = 0;
        for (const p of pcMix) {
            if (cUsed >= maxC) break;
            const maxQty = Math.min(4, Math.floor((maxC - cUsed) / p.valeur));
            if (maxQty < 1) continue;
            if (Math.random() < 0.5) continue;
            const qty = Math.floor(Math.random() * maxQty) + 1;
            selected.push({ item: p, qty });
            cUsed += p.valeur * qty;
            totalCentimes += p.valeur * qty;
        }
    }

    // ── 4. Garantir au moins 2 items ─────────────────────────────────────
    if (selected.length < 2) {
        selected.length = 0;
        totalCentimes = 0;
        const b = billetsDispos[Math.floor(Math.random() * billetsDispos.length)];
        selected.push({ item: b, qty: 1 });
        totalCentimes += b.valeur;
        const p = PIECES_CENTIMES[Math.floor(Math.random() * PIECES_CENTIMES.length)];
        selected.push({ item: p, qty: 1 });
        totalCentimes += p.valeur;
    }

    return { items: selected, total: totalCentimes };
}

// ── Formatage du montant ──────────────────────────────────────────────────
function _formatMontant(centimes) {
    const euros = Math.floor(centimes / 100);
    const cts   = centimes % 100;
    if (cts === 0) return euros + ',00 €';
    return euros + ',' + String(cts).padStart(2, '0') + ' €';
}

// ── Création du widget ────────────────────────────────────────────────────
function createMonnaieWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'monnaie';
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

    // Contenu principal
    const container = document.createElement('div');
    container.className = 'monnaie-container';

    // En-tête
    const header = document.createElement('div');
    header.className = 'monnaie-header';
    header.innerHTML = `
        <span class="monnaie-title">💶 Combien y a-t-il en tout ?</span>
        <span class="monnaie-level-badge facile">Facile</span>
    `;
    const badge = header.querySelector('.monnaie-level-badge');
    container.appendChild(header);

    // Boutons contrôle
    const controls = document.createElement('div');
    controls.className = 'monnaie-controls';
    controls.innerHTML = `
        <button class="monnaie-btn monnaie-btn-new">🔄 Nouveau</button>
        <button class="monnaie-btn monnaie-btn-answer">👁 Voir la réponse</button>
        <div class="monnaie-level-btns">
            <button class="monnaie-lvl-btn active-facile" data-level="facile">😊 Facile</button>
            <button class="monnaie-lvl-btn" data-level="moyen">😐 Moyen</button>
            <button class="monnaie-lvl-btn" data-level="difficile">😤 Difficile</button>
        </div>
    `;
    const newBtn    = controls.querySelector('.monnaie-btn-new');
    const showBtn   = controls.querySelector('.monnaie-btn-answer');
    container.appendChild(controls);

    // Zone images
    const itemsZone = document.createElement('div');
    itemsZone.className = 'monnaie-items';
    container.appendChild(itemsZone);

    // Zone réponse
    const answerZone = document.createElement('div');
    answerZone.className = 'monnaie-answer-zone';

    const answerLabel = document.createElement('span');
    answerLabel.className = 'monnaie-answer-label';
    answerLabel.textContent = 'Ta réponse :';

    const answerInput = document.createElement('input');
    answerInput.className = 'monnaie-answer-input';
    answerInput.type = 'text';
    answerInput.placeholder = '0,00 €';

    const checkBtn = document.createElement('button');
    checkBtn.className = 'monnaie-check-btn';
    checkBtn.textContent = '✓ Vérifier';

    const answerText = document.createElement('span');
    answerText.className = 'monnaie-answer-text';

    answerZone.appendChild(answerLabel);
    answerZone.appendChild(answerInput);
    answerZone.appendChild(checkBtn);
    answerZone.appendChild(answerText);
    container.appendChild(answerZone);

    // Poignée resize
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'monnaie-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État interne ──────────────────────────────────────────────────────
    let currentLevel = 'facile';
    let currentTotal = 0;
    let answerRevealed = false;

    // ── Tailles de référence (base 1x) ────────────────────────────────────
    const BASE_W = 480;       // largeur initiale du container
    const BASE_ITEMS_H = 160; // hauteur initiale de la zone items
    let currentScale = 1;
    let lastExercice = null;

    // ── Calcul du scale à partir des dimensions actuelles ─────────────────
    function computeScale() {
        const cw = container.offsetWidth  || BASE_W;
        const zh = itemsZone.offsetHeight || BASE_ITEMS_H;
        const scaleW = cw / BASE_W;
        const scaleH = zh / BASE_ITEMS_H;
        return Math.max(0.25, Math.min(5, Math.min(scaleW, scaleH)));
    }

    // ── Applique le scale sur toutes les images existantes ─────────────────
    function applyScaleToImages() {
        currentScale = computeScale();
        itemsZone.querySelectorAll('.monnaie-item img').forEach(img => {
            const bw = parseFloat(img.dataset.baseW);
            const bh = parseFloat(img.dataset.baseH);
            if (!isNaN(bw) && !isNaN(bh)) {
                img.width  = Math.round(bw * currentScale);
                img.height = Math.round(bh * currentScale);
            }
        });
    }

    // ── Rendu des items ───────────────────────────────────────────────────
    function renderItems(exercice) {
        lastExercice = exercice;
        itemsZone.innerHTML = '';
        answerRevealed = false;
        answerText.textContent = '';
        answerText.classList.remove('show');
        answerInput.value = '';
        answerInput.className = 'monnaie-answer-input';
        showBtn.textContent = '👁 Voir la réponse';
        showBtn.classList.remove('revealed');

        currentScale = computeScale();

        exercice.items.forEach(({ item, qty }) => {
            for (let i = 0; i < qty; i++) {
                const el = document.createElement('div');
                el.className = 'monnaie-item';
                const img = document.createElement('img');
                img.src = item.src;
                img.alt = item.label;
                img.dataset.baseW = item.w;
                img.dataset.baseH = item.h;
                img.width  = Math.round(item.w * currentScale);
                img.height = Math.round(item.h * currentScale);
                el.appendChild(img);
                itemsZone.appendChild(el);
            }
        });
    }

    // ── Génère un nouvel exercice ─────────────────────────────────────────
    function newExercice() {
        const ex = _genMonnaie(currentLevel);
        currentTotal = ex.total;
        renderItems(ex);
        saveBoard();
    }

    // ── Changer de niveau ─────────────────────────────────────────────────
    function setLevel(level) {
        currentLevel = level;
        badge.className = `monnaie-level-badge ${level}`;
        badge.textContent = NIVEAUX[level].label;

        container.querySelectorAll('.monnaie-lvl-btn').forEach(btn => {
            btn.className = 'monnaie-lvl-btn';
            if (btn.dataset.level === level) btn.classList.add(`active-${level}`);
        });

        newExercice();
    }

    // ── Vérifier la réponse ───────────────────────────────────────────────
    function checkAnswer() {
        let raw = answerInput.value.replace(/\s/g, '').replace('€', '').replace(',', '.');
        let userCentimes = null;
        if (raw.includes('.')) {
            const parts = raw.split('.');
            const euros = parseInt(parts[0]) || 0;
            const cts   = parseInt((parts[1] + '0').substring(0, 2)) || 0;
            userCentimes = euros * 100 + cts;
        } else {
            const val = parseFloat(raw);
            if (!isNaN(val)) userCentimes = Math.round(val * 100);
        }
        if (userCentimes === null || isNaN(userCentimes)) {
            answerInput.className = 'monnaie-answer-input wrong';
            return;
        }
        if (userCentimes === currentTotal) {
            answerInput.className = 'monnaie-answer-input correct';
            answerText.textContent = '✅ Bravo !';
            answerText.classList.add('show');
        } else {
            answerInput.className = 'monnaie-answer-input wrong';
            answerText.textContent = '❌ Essaie encore !';
            answerText.classList.add('show');
        }
    }

    // ── Afficher / cacher la réponse ──────────────────────────────────────
    function toggleAnswer() {
        if (!answerRevealed) {
            answerRevealed = true;
            answerText.textContent = '= ' + _formatMontant(currentTotal);
            answerText.classList.add('show');
            showBtn.textContent = '🙈 Cacher';
            showBtn.classList.add('revealed');
        } else {
            answerRevealed = false;
            answerText.textContent = '';
            answerText.classList.remove('show');
            showBtn.textContent = '👁 Voir la réponse';
            showBtn.classList.remove('revealed');
        }
    }

    // ── Event listeners ───────────────────────────────────────────────────
    newBtn.addEventListener('click', newExercice);
    showBtn.addEventListener('click', toggleAnswer);
    checkBtn.addEventListener('click', checkAnswer);
    answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkAnswer();
    });
    container.querySelectorAll('.monnaie-lvl-btn').forEach(btn => {
        btn.addEventListener('click', () => setLevel(btn.dataset.level));
    });

    // Resize 2D (horizontal + vertical) avec mise à l'échelle des images
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth;
        const startItemsH = itemsZone.offsetHeight;

        document.onmousemove = (ev) => {
            const newW = Math.max(300, startW + ev.clientX - startX);
            const newItemsH = Math.max(80, startItemsH + ev.clientY - startY);
            container.style.width = newW + 'px';
            itemsZone.style.height = newItemsH + 'px';
            applyScaleToImages();
        };
        document.onmouseup = () => { document.onmousemove = null; saveBoard(); };
    });

    // Empêcher le widget de voler le focus quand on clique sur l'input
    answerInput.addEventListener('mousedown', (e) => {
        e.stopPropagation();
    });
    answerInput.addEventListener('click', (e) => {
        e.stopPropagation();
        answerInput.focus();
    });

    // ── Init ──────────────────────────────────────────────────────────────
    widget.addEventListener('mousedown', (e) => {
        // Ne pas voler le focus si on clique sur un input ou bouton
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    // Premier exercice
    setLevel('facile');

    saveBoard();
    return widget;
}
