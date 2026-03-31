// =========================================================================
// WIDGET CONJUGAISON — Le Bureau du Prof
// Génère un test flash de conjugaison : 10 questions, 3 temps, verbes libres
//
// Dépendances : board, findFreePosition(), makeDraggable(),
//   makeDraggableRotate(), bringToFront(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
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
            widget.style.top = MARGIN_TOP + 'px'; widget.style.left = occupiedX + 'px';
            widget.style.width = COLLAPSED_W + 'px'; widget.style.height = COLLAPSED_H + 'px';
            widget.style.zIndex = '9000'; widget.style.background = '#2a2a3e';
            widget.style.borderRadius = '8px'; widget.style.border = 'none';
            widget.style.display = 'block'; widget.style.overflow = 'hidden'; widget.style.padding = '0';
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
            expandBtn.title = 'Déplier'; expandBtn.textContent = '▲';
            expandBtn.style.cssText = 'flex-shrink:0;background:transparent;border:1px solid #555;color:#aaa;border-radius:4px;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;padding:0;position:relative;z-index:2;';
            expandBtn.addEventListener('pointerdown', e => e.stopPropagation());
            expandBtn.addEventListener('mousedown', e => e.stopPropagation());
            expandBtn.addEventListener('click', e => {
                e.stopPropagation(); e.preventDefault();
                widget.style.top = widget.dataset.wfMiniSavedTop || widget.style.top;
                widget.style.left = widget.dataset.wfMiniSavedLeft || widget.style.left;
                widget.style.width = widget.dataset.wfMiniSavedW || '';
                widget.style.height = widget.dataset.wfMiniSavedH || '';
                widget.style.zIndex = ''; widget.style.background = ''; widget.style.borderRadius = '';
                widget.style.border = ''; widget.style.display = ''; widget.style.overflow = ''; widget.style.padding = '';
                const wc2 = widget.querySelector('.widget-content');
                if (wc2) { wc2.style.padding = ''; wc2.style.background = ''; wc2.style.borderRadius = ''; }
                widget.querySelectorAll('.drag-handle,.widget-action-bar,.widget-rotate-handle,.custom-resize-handle').forEach(el => el.style.display = '');
                miniBar.remove();
                const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                if (onExpand) onExpand();
                if (typeof saveBoard === 'function') saveBoard();
            });
            miniBar.appendChild(labelEl); miniBar.appendChild(expandBtn); widget.appendChild(miniBar);
            miniBar.addEventListener('pointerdown', e => {
                if (e.target === expandBtn || expandBtn.contains(e.target)) return;
                e.stopPropagation(); e.preventDefault(); miniBar.setPointerCapture(e.pointerId);
                const startX = e.clientX - widget.offsetLeft, startY = e.clientY - widget.offsetTop;
                const onMove = ev => { widget.style.left = Math.max(0, ev.clientX - startX) + 'px'; widget.style.top = Math.max(0, ev.clientY - startY) + 'px'; };
                const onUp = () => {
                    miniBar.removeEventListener('pointermove', onMove); miniBar.removeEventListener('pointerup', onUp);
                    const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
                    widget.dataset.leftPercent = (widget.offsetLeft / curW) * 100;
                    widget.dataset.topPercent  = (widget.offsetTop  / curVH) * 100;
                    if (typeof saveBoard === 'function') saveBoard();
                };
                miniBar.addEventListener('pointermove', onMove); miniBar.addEventListener('pointerup', onUp);
            });
            const curW = window.innerWidth, curVH = typeof virtualH === 'function' ? virtualH(curW) : window.innerHeight;
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

    if (document.getElementById('wconj-style')) return;
    const s = document.createElement('style');
    s.id = 'wconj-style';
    s.textContent = `
        .widget[data-type="conjugaison"] {
            min-width: unset;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
        }
        .conj-container {
            background: #ffffff;
            border: 1.5px solid #d1d5db;
            border-radius: 16px;
            padding: 14px 16px 12px 52px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            box-shadow: 0 4px 18px rgba(0,0,0,0.12);
            position: relative;
            user-select: none;
            overflow: hidden;
        }
        .conj-container input, .conj-container textarea {
            user-select: text; -webkit-user-select: text;
        }
        .conj-container.wf-minimized > *:not(.conj-header) { display: none !important; }
        .conj-container.wf-minimized { gap: 0; }
        .conj-container.wf-fullboard {
            position: fixed !important; inset: 0 !important;
            width: 100% !important; height: 100% !important;
            z-index: 9999 !important; border-radius: 0 !important; overflow-y: auto;
        }

        /* Header */
        .conj-header {
            display: flex; align-items: center; gap: 8px;
            cursor: move; user-select: none; flex-wrap: wrap;
        }
        .conj-title {
            font-size: 13px; font-weight: 800; color: #374151;
            letter-spacing: 0.3px; pointer-events: none; white-space: nowrap;
        }

        /* Contrôles */
        .conj-controls {
            display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
        }
        .conj-btn {
            padding: 5px 12px; border-radius: 8px; border: none;
            font-size: 11px; font-weight: 700; cursor: pointer;
            transition: background .15s, transform .1s; white-space: nowrap;
        }
        .conj-btn:active { transform: scale(0.96); }
        .conj-btn-gen    { background: #4a90e2; color: white; }
        .conj-btn-gen:hover { background: #357abd; }
        .conj-btn-corr   { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .conj-btn-corr:hover { background: #e0e0e0; }
        .conj-btn-corr.active { background: #28a745; color: white; border-color: #28a745; }
        .conj-btn-new    { background: #f0f0f0; color: #333; border: 1px solid #ddd; }
        .conj-btn-new:hover { background: #e0e0e0; }

        /* Zone config */
        .conj-setup {
            display: flex; flex-direction: column; gap: 10px;
            background: #f8f9fa; border: 1px solid #e5e7eb;
            border-radius: 10px; padding: 12px;
        }
        .conj-setup-label {
            font-size: 9px; font-weight: 800; color: #9ca3af;
            text-transform: uppercase; letter-spacing: 1px;
        }
        .conj-verbes-input {
            width: 100%; box-sizing: border-box;
            padding: 7px 10px; border: 1.5px solid #d1d5db; border-radius: 8px;
            font-size: 13px; font-family: 'Segoe UI', system-ui, sans-serif;
            resize: vertical; min-height: 70px; outline: none;
            transition: border-color .2s; background: #fff;
        }
        .conj-verbes-input:focus { border-color: #4a90e2; }
        .conj-temps-row {
            display: flex; gap: 16px; flex-wrap: wrap; align-items: center;
        }
        .conj-temps-label {
            display: flex; align-items: center; gap: 6px;
            cursor: pointer; font-size: 12px; font-weight: 700; color: #374151;
        }
        .conj-temps-label input[type="checkbox"] {
            width: 15px; height: 15px; cursor: pointer; accent-color: #4a90e2;
        }
        .conj-example-btns {
            display: flex; gap: 6px;
        }
        .conj-example-btn {
            padding: 4px 10px; border-radius: 6px; border: 1px solid #ddd;
            background: #fff; font-size: 10px; font-weight: 700; cursor: pointer;
            color: #666; transition: background .15s;
        }
        .conj-example-btn:hover { background: #f0f0f0; }
        .conj-example-btn.g1 { border-color: #06b6d4; color: #06b6d4; }
        .conj-example-btn.g1:hover { background: #e0f9fd; }
        .conj-example-btn.freq { border-color: #f97316; color: #f97316; }
        .conj-example-btn.freq:hover { background: #fff4ed; }

        /* Grille de questions */
        .conj-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            overflow-y: auto;
        }
        .conj-q-card {
            background: #f8f9fa; border: 1px solid #e5e7eb;
            border-radius: 10px; padding: 10px 12px;
        }
        .conj-q-top {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 8px;
        }
        .conj-q-num {
            font-size: 11px; font-weight: 800; color: #9ca3af;
        }
        .conj-badge {
            font-size: 10px; font-weight: 800; text-transform: uppercase;
            padding: 2px 8px; border-radius: 20px; letter-spacing: 0.4px;
        }
        .conj-badge.present  { background: #cffafe; color: #0e7490; }
        .conj-badge.imparfait { background: #f3e8ff; color: #7e22ce; }
        .conj-badge.futur    { background: #ffedd5; color: #c2410c; }
        .conj-line {
            display: flex; align-items: center; gap: 8px;
        }
        .conj-pronom {
            font-size: 18px; font-weight: 700; color: #374151;
            min-width: 72px; flex-shrink: 0;
        }
        .conj-answer-input {
            flex: 1; background: transparent;
            border: none; border-bottom: 2px solid #d1d5db;
            outline: none; font-size: 20px; font-weight: 700;
            color: #4a90e2; text-align: center; padding: 2px 4px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            transition: border-color .2s, color .2s;
            min-width: 60px;
        }
        .conj-answer-input:focus { border-bottom-color: #4a90e2; }
        .conj-answer-input.correct { color: #16a34a; border-bottom-color: #16a34a; }
        .conj-answer-input.wrong   { color: #dc2626; border-bottom-color: #dc2626; }
        .conj-answer-input:disabled { cursor: default; }

        /* Resize handle */
        .conj-resize-handle {
            position: absolute; right: 0; bottom: 0;
            width: 18px; height: 18px; cursor: se-resize;
            background: linear-gradient(135deg, transparent 50%, #aaa 50%);
            border-radius: 0 0 14px 0; opacity: 0; transition: opacity .2s; z-index: 5;
        }
        .conj-container:hover .conj-resize-handle { opacity: 1; }
    `;
    document.head.appendChild(s);
})();

// ── Données conjugaison (reprises de gene_conjugaison.html) ───────────────
const CONJ_PRONOMS = ["Je", "Tu", "Il/Elle", "Nous", "Vous", "Ils/Elles"];

const CONJ_VERBES = {
    "être":      { present: ["suis","es","est","sommes","êtes","sont"], imparfait: ["étais","étais","était","étions","étiez","étaient"], futur: ["serai","seras","sera","serons","serez","seront"] },
    "avoir":     { present: ["ai","as","a","avons","avez","ont"], imparfait: ["avais","avais","avait","avions","aviez","avaient"], futur: ["aurai","auras","aura","aurons","aurez","auront"] },
    "aller":     { present: ["vais","vas","va","allons","allez","vont"], imparfait: ["allais","allais","allait","allions","alliez","allaient"], futur: ["irai","iras","ira","irons","irez","iront"] },
    "faire":     { present: ["fais","fais","fait","faisons","faites","font"], imparfait: ["faisais","faisais","faisait","faisions","faisiez","faisaient"], futur: ["ferai","feras","fera","ferons","ferez","feront"] },
    "dire":      { present: ["dis","dis","dit","disons","dites","disent"], imparfait: ["disais","disais","disait","disions","disiez","disaient"], futur: ["dirai","diras","dira","dirons","direz","diront"] },
    "voir":      { present: ["vois","vois","voit","voyons","voyez","voient"], imparfait: ["voyais","voyais","voyait","voyions","voyiez","voyaient"], futur: ["verrai","verras","verra","verrons","verrez","verront"] },
    "venir":     { present: ["viens","viens","vient","venons","venez","viennent"], imparfait: ["venais","venais","venait","venions","veniez","venaient"], futur: ["viendrai","viendras","viendra","viendrons","viendrez","viendront"] },
    "tenir":     { present: ["tiens","tiens","tient","tenons","tenez","tiennent"], imparfait: ["tenais","tenais","tenait","tenions","teniez","tenaient"], futur: ["tiendrai","tiendras","tiendra","tiendrons","tiendrez","tiendront"] },
    "prendre":   { present: ["prends","prends","prend","prenons","prenez","prennent"], imparfait: ["prenais","prenais","prenait","prenions","preniez","prenaient"], futur: ["prendrai","prendras","prendra","prendrons","prendrez","prendront"] },
    "pouvoir":   { present: ["peux","peux","peut","pouvons","pouvez","peuvent"], imparfait: ["pouvais","pouvais","pouvait","pouvions","pouviez","pouvaient"], futur: ["pourrai","pourras","pourra","pourrons","pourrez","pourront"] },
    "vouloir":   { present: ["veux","veux","veut","voulons","voulez","veulent"], imparfait: ["voulais","voulais","voulait","voulions","vouliez","voulaient"], futur: ["voudrai","voudras","voudra","voudrons","voudrez","voudront"] },
    "savoir":    { present: ["sais","sais","sait","savons","savez","savent"], imparfait: ["savais","savais","savait","savions","saviez","savaient"], futur: ["saurai","sauras","saura","saurons","saurez","sauront"] },
    "devoir":    { present: ["dois","dois","doit","devons","devez","doivent"], imparfait: ["devais","devais","devait","devions","deviez","devaient"], futur: ["devrai","devras","devra","devrons","devrez","devront"] },
    "mettre":    { present: ["mets","mets","met","mettons","mettez","mettent"], imparfait: ["mettais","mettais","mettait","mettions","mettiez","mettaient"], futur: ["mettrai","mettras","mettra","mettrons","mettrez","mettront"] },
    "partir":    { present: ["pars","pars","part","partons","partez","partent"], imparfait: ["partais","partais","partait","partions","partiez","partaient"], futur: ["partirai","partiras","partira","partirons","partirez","partiront"] },
    "sortir":    { present: ["sors","sors","sort","sortons","sortez","sortent"], imparfait: ["sortais","sortais","sortait","sortions","sortiez","sortaient"], futur: ["sortirai","sortiras","sortira","sortirons","sortirez","sortiront"] },
    "dormir":    { present: ["dors","dors","dort","dormons","dormez","dorment"], imparfait: ["dormais","dormais","dormait","dormions","dormiez","dormaient"], futur: ["dormirai","dormiras","dormira","dormirons","dormirez","dormiront"] },
    "lire":      { present: ["lis","lis","lit","lisons","lisez","lisent"], imparfait: ["lisais","lisais","lisait","lisions","lisiez","lisaient"], futur: ["lirai","liras","lira","lirons","lirez","liront"] },
    "écrire":    { present: ["écris","écris","écrit","écrivons","écrivez","écrivent"], imparfait: ["écrivais","écrivais","écrivait","écrivions","écriviez","écrivaient"], futur: ["écrirai","écriras","écrira","écrirons","écrirez","écriront"] },
    "croire":    { present: ["crois","crois","croit","croyons","croyez","croient"], imparfait: ["croyais","croyais","croyait","croyions","croyiez","croyaient"], futur: ["croirai","croiras","croira","croirons","croirez","croiront"] },
    "connaître": { present: ["connais","connais","connaît","connaissons","connaissez","connaissent"], imparfait: ["connaissais","connaissais","connaissait","connaissions","connaissiez","connaissaient"], futur: ["connaîtrai","connaîtras","connaîtra","connaîtrons","connaîtrez","connaîtront"] },
    "vivre":     { present: ["vis","vis","vit","vivons","vivez","vivent"], imparfait: ["vivais","vivais","vivait","vivions","viviez","vivaient"], futur: ["vivrai","vivras","vivra","vivrons","vivrez","vivront"] },
    "boire":     { present: ["bois","bois","boit","buvons","buvez","boivent"], imparfait: ["buvais","buvais","buvait","buvions","buviez","buvaient"], futur: ["boirai","boiras","boira","boirons","boirez","boiront"] },
    "recevoir":  { present: ["reçois","reçois","reçoit","recevons","recevez","reçoivent"], imparfait: ["recevais","recevais","recevait","recevions","receviez","recevaient"], futur: ["recevrai","recevras","recevra","recevrons","recevrez","recevront"] },
    "entendre":  { present: ["entends","entends","entend","entendons","entendez","entendent"], imparfait: ["entendais","entendais","entendait","entendions","entendiez","entendaient"], futur: ["entendrai","entendras","entendra","entendrons","entendrez","entendront"] },
    "ouvrir":    { present: ["ouvre","ouvres","ouvre","ouvrons","ouvrez","ouvrent"], imparfait: ["ouvrais","ouvrais","ouvrait","ouvrions","ouvriez","ouvraient"], futur: ["ouvrirai","ouvriras","ouvrira","ouvrirons","ouvrirez","ouvriront"] },
    "offrir":    { present: ["offre","offres","offre","offrons","offrez","offrent"], imparfait: ["offrais","offrais","offrait","offrions","offriez","offraient"], futur: ["offrirai","offriras","offrira","offrirons","offrirez","offriront"] },
    "mourir":    { present: ["meurs","meurs","meurt","mourons","mourez","meurent"], imparfait: ["mourais","mourais","mourait","mourions","mouriez","mouraient"], futur: ["mourrai","mourras","mourra","mourrons","mourrez","mourront"] },
    "rejoindre": { present: ["rejoins","rejoins","rejoint","rejoignons","rejoignez","rejoignent"], imparfait: ["rejoignais","rejoignais","rejoignait","rejoignions","rejoigniez","rejoignaient"], futur: ["rejoindrai","rejoindras","rejoindra","rejoindrons","rejoindrez","rejoindront"] },
    "revenir":   { present: ["reviens","reviens","revient","revenons","revenez","reviennent"], imparfait: ["revenais","revenais","revenait","revenions","reveniez","revenaient"], futur: ["reviendrai","reviendras","reviendra","reviendrons","reviendrez","reviendront"] },
    "devenir":   { present: ["deviens","deviens","devient","devenons","devenez","deviennent"], imparfait: ["devenais","devenais","devenait","devenions","deveniez","devenaient"], futur: ["deviendrai","deviendras","deviendra","deviendrons","deviendrez","deviendront"] },
    "rire":      { present: ["ris","ris","rit","rions","riez","rient"], imparfait: ["riais","riais","riait","riions","riiez","riaient"], futur: ["rirai","riras","rira","rirons","rirez","riront"] },
    "valoir":    { present: ["vaux","vaux","vaut","valons","valez","valent"], imparfait: ["valais","valais","valait","valions","valiez","valaient"], futur: ["vaudrai","voudras","vaudra","vaudrons","vaudrez","vaudront"] },
    "falloir":   { present: ["—","—","faut","—","—","—"], imparfait: ["—","—","fallait","—","—","—"], futur: ["—","—","faudra","—","—","—"] },
    "pleuvoir":  { present: ["—","—","pleut","—","—","—"], imparfait: ["—","—","pleuvait","—","—","—"], futur: ["—","—","pleuvra","—","—","—"] }
};

const CONJ_TERMINAISONS = {
    er: {
        present:   ["e","es","e","ons","ez","ent"],
        imparfait: ["ais","ais","ait","ions","iez","aient"],
        futur:     ["ai","as","a","ons","ez","ont"]
    },
    ir: {
        present:   ["is","is","it","issons","issez","issent"],
        imparfait: ["issais","issais","issait","issions","issiez","issaient"],
        futur:     ["ai","as","a","ons","ez","ont"]
    }
};

// ── Logique de conjugaison ────────────────────────────────────────────────
function _conjObtenir(verbe, pronom, temps) {
    const v = verbe.toLowerCase().trim();
    const pIdx = CONJ_PRONOMS.indexOf(pronom);
    if (CONJ_VERBES[v]) return CONJ_VERBES[v][temps][pIdx];

    if (v.endsWith("er")) {
        const term = CONJ_TERMINAISONS.er[temps][pIdx];
        if (temps === "futur") {
            if (v.endsWith("yer")) return v.slice(0, -3) + "i" + "er" + term;
            return v + term;
        }
        const rad = v.slice(0, -2);
        const d = term[0];
        if (v.endsWith("cer")) { const r = rad.slice(0,-1); return (d==='a'||d==='o') ? r+"ç"+term : r+"c"+term; }
        if (v.endsWith("ger")) { return (d==='a'||d==='o') ? rad+"e"+term : rad+term; }
        if (v.endsWith("yer")) { const r = v.slice(0,-3); return (pIdx===3||pIdx===4) ? r+"y"+term : r+"i"+term; }
        return rad + term;
    }
    if (v.endsWith("ir")) {
        const rad = v.slice(0, -2);
        if (temps === "futur") return v + CONJ_TERMINAISONS.er.futur[pIdx];
        return rad + CONJ_TERMINAISONS.ir[temps][pIdx];
    }
    return "?";
}

// ── Génère 10 questions équilibrées ───────────────────────────────────────
function _conjGenerer(verbesText, tempsCoches) {
    const verbs = verbesText.split('\n').map(v => v.trim()).filter(Boolean);
    if (!verbs.length || !tempsCoches.length) return null;

    const NB = 10;
    const combos = {};
    verbs.forEach(v => {
        tempsCoches.forEach(t => {
            const cle = `${v}|${t}`;
            combos[cle] = CONJ_PRONOMS.map((p, i) => ({ verbe: v, pronom: p, temps: t, pIdx: i }))
                .sort(() => Math.random() - 0.5);
        });
    });

    const nbV = verbs.length, nbT = tempsCoches.length;
    const seq = [];
    for (let s = 0; s < nbV * 6; s++) {
        const vi = Math.floor(s / nbT) % nbV;
        const ti = s % nbT;
        seq.push(`${verbs[vi]}|${tempsCoches[ti]}`);
    }
    const idx = {};
    Object.keys(combos).forEach(c => { idx[c] = 0; });

    const pool = [];
    let tour = 0;
    while (pool.length < NB && tour < seq.length * 20) {
        const cle = seq[tour % seq.length];
        if (combos[cle] && idx[cle] < combos[cle].length) {
            pool.push(combos[cle][idx[cle]++]);
        }
        tour++;
    }
    return pool;
}

// ── Création du widget ────────────────────────────────────────────────────
function createConjugaisonWidget() {
    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'conjugaison';
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

    const container = document.createElement('div');
    container.className = 'conj-container';
    const initW = Math.min(Math.round(window.innerWidth * 0.65), 820);
    container.style.width = initW + 'px';

    // ── Header ────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    header.className = 'conj-header';
    header.innerHTML = `
        <span class="conj-title">✏️ Conjugaison Flash</span>
        <div class="wf-btns" style="margin-left:auto">
            <button class="wf-btn wf-btn-min"   data-role="wf-min"   title="Réduire"></button>
            <button class="wf-btn wf-btn-max"   data-role="wf-max"   title="Plein écran"></button>
            <button class="wf-btn wf-btn-close" data-role="wf-close" title="Fermer"></button>
        </div>
    `;
    container.appendChild(header);

    // ── Zone config ───────────────────────────────────────────────────────
    const setupZone = document.createElement('div');
    setupZone.className = 'conj-setup';
    setupZone.innerHTML = `
        <div>
            <div class="conj-setup-label">Verbes (un par ligne)</div>
            <textarea class="conj-verbes-input" placeholder="être&#10;avoir&#10;chanter"></textarea>
            <div class="conj-example-btns" style="margin-top:6px;">
                <button class="conj-example-btn g1">Exemples G1</button>
                <button class="conj-example-btn freq">Verbes fréquents</button>
            </div>
        </div>
        <div>
            <div class="conj-setup-label" style="margin-bottom:6px;">Temps</div>
            <div class="conj-temps-row">
                <label class="conj-temps-label"><input type="checkbox" value="present" checked> Présent</label>
                <label class="conj-temps-label"><input type="checkbox" value="imparfait"> Imparfait</label>
                <label class="conj-temps-label"><input type="checkbox" value="futur"> Futur simple</label>
            </div>
        </div>
    `;
    const verbesInput = setupZone.querySelector('.conj-verbes-input');
    container.appendChild(setupZone);

    // ── Contrôles ─────────────────────────────────────────────────────────
    const controls = document.createElement('div');
    controls.className = 'conj-controls';
    controls.innerHTML = `
        <button class="conj-btn conj-btn-gen">▶ Générer</button>
        <button class="conj-btn conj-btn-new" style="display:none;">🔄 Nouveau</button>
        <button class="conj-btn conj-btn-corr" style="display:none;">👁 Correction</button>
    `;
    const genBtn  = controls.querySelector('.conj-btn-gen');
    const newBtn  = controls.querySelector('.conj-btn-new');
    const corrBtn = controls.querySelector('.conj-btn-corr');
    container.appendChild(controls);

    // ── Grille de questions ───────────────────────────────────────────────
    const grid = document.createElement('div');
    grid.className = 'conj-grid';
    grid.style.display = 'none';
    container.appendChild(grid);

    // ── Resize handle ─────────────────────────────────────────────────────
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'conj-resize-handle';
    container.appendChild(resizeHandle);

    widget.appendChild(container);

    // ── État ──────────────────────────────────────────────────────────────
    let questions     = [];
    let sauvegardes   = {};
    let corrVisible   = false;

    // ── Rendu des questions ───────────────────────────────────────────────
    function renderQuestions(qs) {
        questions   = qs;
        sauvegardes = {};
        corrVisible = false;
        corrBtn.textContent = '👁 Correction';
        corrBtn.classList.remove('active');
        grid.innerHTML = '';

        qs.forEach((q, i) => {
            const card = document.createElement('div');
            card.className = 'conj-q-card';
            card.innerHTML = `
                <div class="conj-q-top">
                    <span class="conj-q-num">${i + 1})</span>
                    <span class="conj-badge ${q.temps}">${q.temps === 'present' ? 'Présent' : q.temps === 'imparfait' ? 'Imparfait' : 'Futur'}</span>
                </div>
                <div class="conj-line">
                    <span class="conj-pronom">${q.pronom}</span>
                    <input type="text" class="conj-answer-input" placeholder="${q.verbe.toLowerCase()}" data-index="${i}">
                </div>
            `;
            const inp = card.querySelector('.conj-answer-input');
            inp.addEventListener('mousedown', e => e.stopPropagation());
            inp.addEventListener('click', e => { e.stopPropagation(); inp.focus(); });
            inp.addEventListener('keydown', e => { if (e.key === 'Enter') toggleCorrection(); });
            grid.appendChild(card);
        });

        grid.style.display = 'grid';
        setupZone.style.display = 'none';
        genBtn.style.display  = 'none';
        newBtn.style.display  = '';
        corrBtn.style.display = '';
    }

    // ── Correction ────────────────────────────────────────────────────────
    function toggleCorrection() {
        if (!corrVisible) {
            grid.querySelectorAll('.conj-answer-input').forEach(inp => {
                const q = questions[inp.dataset.index];
                const attendu = _conjObtenir(q.verbe, q.pronom, q.temps);
                const saisi = inp.value.trim();
                sauvegardes[inp.dataset.index] = saisi;
                const ok = saisi.toLowerCase() === attendu.toLowerCase();
                inp.classList.toggle('correct', ok);
                inp.classList.toggle('wrong', !ok);
                if (!ok) inp.value = (saisi || '—') + '  →  ' + attendu;
                inp.disabled = true;
            });
            corrBtn.textContent = '🙈 Masquer';
            corrBtn.classList.add('active');
            corrVisible = true;
        } else {
            grid.querySelectorAll('.conj-answer-input').forEach(inp => {
                inp.value = sauvegardes[inp.dataset.index] || '';
                inp.classList.remove('correct', 'wrong');
                inp.disabled = false;
            });
            corrBtn.textContent = '👁 Correction';
            corrBtn.classList.remove('active');
            corrVisible = false;
        }
    }

    // ── Retour config ─────────────────────────────────────────────────────
    function retourSetup() {
        grid.style.display  = 'none';
        setupZone.style.display = '';
        genBtn.style.display  = '';
        newBtn.style.display  = 'none';
        corrBtn.style.display = 'none';
        questions   = [];
        corrVisible = false;
    }

    // ── Générer ───────────────────────────────────────────────────────────
    function generer() {
        const tempsCoches = Array.from(setupZone.querySelectorAll('input[type="checkbox"]:checked')).map(c => c.value);
        if (!verbesInput.value.trim() || !tempsCoches.length) return;
        const qs = _conjGenerer(verbesInput.value, tempsCoches);
        if (qs && qs.length) renderQuestions(qs);
    }

    // ── Event listeners ───────────────────────────────────────────────────
    genBtn.addEventListener('click', generer);
    newBtn.addEventListener('click', () => { retourSetup(); });
    corrBtn.addEventListener('click', toggleCorrection);

    setupZone.querySelector('.conj-example-btn.g1').addEventListener('click', () => {
        verbesInput.value = "chanter\ndanser\nmanger\nregarder\nparler\nécouter\njouer\naimer";
    });
    setupZone.querySelector('.conj-example-btn.freq').addEventListener('click', () => {
        verbesInput.value = "être\navoir\naller\nfaire\ndire\npouvoir\nvouloir\nprendre\nvenir\nvoir";
    });

    // Empêcher drag sur le textarea
    verbesInput.addEventListener('mousedown', e => e.stopPropagation());
    verbesInput.addEventListener('click', e => { e.stopPropagation(); verbesInput.focus(); });

    // Resize 2D
    resizeHandle.addEventListener('mousedown', e => {
        e.preventDefault(); e.stopPropagation();
        const startX = e.clientX, startY = e.clientY;
        const startW = container.offsetWidth, startH = grid.offsetHeight || 400;
        const onMove = ev => {
            container.style.width = Math.max(380, startW + ev.clientX - startX) + 'px';
            if (grid.style.display !== 'none') grid.style.height = Math.max(200, startH + ev.clientY - startY) + 'px';
        };
        const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); saveBoard(); };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    });
    resizeHandle.addEventListener('touchstart', e => {
        e.preventDefault(); e.stopPropagation();
        const t0 = e.touches[0], startX = t0.clientX, startY = t0.clientY;
        const startW = container.offsetWidth, startH = grid.offsetHeight || 400;
        const onMove = ev => {
            container.style.width = Math.max(380, startW + ev.touches[0].clientX - startX) + 'px';
            if (grid.style.display !== 'none') grid.style.height = Math.max(200, startH + ev.touches[0].clientY - startY) + 'px';
        };
        const onEnd = () => { document.removeEventListener('touchmove', onMove); document.removeEventListener('touchend', onEnd); saveBoard(); };
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, { passive: false });

    // Boutons fenêtre
    const wfMin   = header.querySelector('[data-role="wf-min"]');
    const wfMax   = header.querySelector('[data-role="wf-max"]');
    const wfClose = header.querySelector('[data-role="wf-close"]');
    let _isMax = false, _savedW = null;

    if (wfMin) wfMin.addEventListener('click', e => { e.stopPropagation(); if (_isMax) wfMax.click(); window._wfMiniBarCollapse(widget, '✏️ Conjugaison', {}); });
    if (wfMax) wfMax.addEventListener('click', e => {
        e.stopPropagation(); _isMax = !_isMax;
        if (_isMax) { _savedW = container.style.width; container.classList.add('wf-fullboard'); }
        else { container.classList.remove('wf-fullboard'); if (_savedW) container.style.width = _savedW; }
    });
    if (wfClose) wfClose.addEventListener('click', e => {
        e.stopPropagation();
        if (typeof snapshotNow === 'function') snapshotNow();
        widget.remove();
        if (typeof saveBoard === 'function') saveBoard();
    });

    widget.addEventListener('mousedown', e => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'TEXTAREA') return;
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    if (typeof clampWidgetToBoardRight === 'function') clampWidgetToBoardRight(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);

    saveBoard();
    return widget;
}
