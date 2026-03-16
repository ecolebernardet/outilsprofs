// =========================================================================
// WIDGET IMAGE — Le Bureau du Prof
// Permet d'insérer une image depuis le dossier /images sur le bureau.
//
// Dépendances globales (définies dans widgets.js / save-load.js) :
//   board, findFreePosition(), makeDraggable(), makeDraggableRotate(),
//   bringToFront(), _addStickerResizeHandle(), snapshotNow(), saveBoard()
// =========================================================================

// ── CSS ───────────────────────────────────────────────────────────────────
(function () {
    const s = document.createElement('style');
    s.textContent = `
        /* ── Panneau galerie d'images ── */
        #image-panel {
            display: none;
            position: fixed;
            top: 0; right: 0;
            width: 450px; height: 100vh;
            background: #1e1e28;
            border-left: 1px solid #2e2e3a;
            z-index: 9200;
            flex-direction: column;
            box-shadow: -4px 0 24px rgba(0,0,0,0.5);
            font-family: 'Segoe UI', system-ui, sans-serif;
        }
        #image-panel.active { display: flex; }

        #image-panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 14px 16px;
            background: #28282f;
            border-bottom: 1px solid #2e2e3a;
            flex-shrink: 0;
        }
        #image-panel-header h3 {
            margin: 0;
            font-size: 14px;
            font-weight: 700;
            color: #ddd;
        }
        #image-panel-close {
            background: none;
            border: none;
            color: #aaa;
            font-size: 20px;
            cursor: pointer;
            line-height: 1;
            padding: 0 0px;
            transition: color .15s;
        }
        #image-panel-close:hover { color: #fff; }

        #image-panel-search {
            padding: 10px 12px;
            flex-shrink: 0;
            border-bottom: 1px solid #2e2e3a;
        }
        #image-panel-search input {
            width: 100%;
            box-sizing: border-box;
            background: #28282f;
            border: 1px solid #3a3a4a;
            border-radius: 8px;
            color: #ddd;
            font-size: 12px;
            padding: 7px 10px;
            outline: none;
        }
        #image-panel-search input::placeholder { color: #666; }
        #image-panel-search input:focus { border-color: #4a90e2; }

        #image-panel-grid {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            align-content: start;
        }
        #image-panel-grid::-webkit-scrollbar { width: 6px; }
        #image-panel-grid::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        #image-panel-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }

        /* ── Onglets catégories ── */
        #image-panel-tabs {
            display: flex;
            flex-shrink: 0;
            border-bottom: 1px solid #2e2e3a;
            overflow-x: auto;
            scrollbar-width: none;
        }
        #image-panel-tabs::-webkit-scrollbar { display: none; }

        .img-tab-btn {
            flex-shrink: 0;
            padding: 8px 14px;
            background: none;
            border: none;
            border-bottom: 2px solid transparent;
            color: #777;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: color .15s, border-color .15s;
            white-space: nowrap;
        }
        .img-tab-btn:hover { color: #bbb; }
        .img-tab-btn.active {
            color: #4a90e2;
            border-bottom-color: #4a90e2;
        }

        /* ── Titre de catégorie dans la grille (mode recherche) ── */
        .img-category-title {
            grid-column: 1 / -1;
            font-size: 11px;
            font-weight: 700;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 6px 2px 2px;
            margin-top: 4px;
        }

        .img-panel-thumb {
            background: #28282f;
            border: 2px solid #2e2e3a;
            border-radius: 10px;
            overflow: hidden;
            cursor: pointer;
            transition: border-color .15s, transform .15s;
            aspect-ratio: 4/4;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
        }
        .img-panel-thumb:hover {
            border-color: #4a90e2;
            transform: scale(1.03);
        }
        .img-panel-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            pointer-events: none;
        }
        .img-panel-thumb .img-panel-label {
            position: absolute;
            bottom: 0; left: 0; right: 0;
            background: rgba(0,0,0,0.55);
            color: #ddd;
            font-size: 10px;
            padding: 3px 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            opacity: 0;
            transition: opacity .2s;
        }
        .img-panel-thumb:hover .img-panel-label { opacity: 1; }

        #image-panel-empty {
            display: none;
            grid-column: 1 / -1;
            text-align: center;
            color: #555;
            font-size: 12px;
            padding: 30px 0;
        }

        /* Zone upload */
        #image-panel-footer {
            flex-shrink: 0;
            padding: 10px 12px;
            border-top: 1px solid #2e2e3a;
            background: #1e1e28;
        }
        #image-upload-btn {
            width: 100%;
            padding: 9px;
            background: #28282f;
            border: 1px dashed #3a3a4a;
            border-radius: 8px;
            color: #888;
            font-size: 12px;
            cursor: pointer;
            text-align: center;
            transition: background .15s, border-color .15s, color .15s;
        }
        #image-upload-btn:hover {
            background: #35353f;
            border-color: #4a90e2;
            color: #ddd;
        }
        #image-upload-input { display: none; }

        /* ── Boutons flip/lock/resize sur widget image — mêmes classes que shapes ── */
        /* On étend les règles focus-within au .widget[data-image-widget] */
        .widget[data-image-widget]:focus-within .shape-resize-handle { opacity: 1; }
        .widget[data-image-widget]:focus-within .resize-lock-btn      { opacity: 1; pointer-events: auto; }
        .widget[data-image-widget]:focus-within .flip-h-btn           { opacity: 1; pointer-events: auto; }
        .widget[data-image-widget]:focus-within .flip-v-btn           { opacity: 1; pointer-events: auto; }

        /* ── Menu transparence image (double-clic) ── */
        .img-opacity-menu {
            position: fixed;
            z-index: 99999;
            background: #1e1e28;
            border: 1px solid #3a3a4a;
            border-radius: 10px;
            padding: 10px 14px 12px;
            box-shadow: 0 6px 24px rgba(0,0,0,0.5);
            font-family: 'Segoe UI', system-ui, sans-serif;
            min-width: 180px;
            user-select: none;
        }
        .img-opacity-menu-title {
            font-size: 11px;
            font-weight: 700;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .img-opacity-row {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .img-opacity-slider {
            flex: 1;
            -webkit-appearance: none;
            height: 4px;
            border-radius: 2px;
            background: #3a3a4a;
            outline: none;
            cursor: pointer;
        }
        .img-opacity-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 14px; height: 14px;
            border-radius: 50%;
            background: #4a90e2;
            cursor: pointer;
            border: 2px solid #fff;
            box-shadow: 0 1px 4px rgba(0,0,0,0.4);
        }
        .img-opacity-slider::-moz-range-thumb {
            width: 14px; height: 14px;
            border-radius: 50%;
            background: #4a90e2;
            cursor: pointer;
            border: 2px solid #fff;
        }
        .img-opacity-val {
            font-size: 11px;
            font-weight: 700;
            color: #ddd;
            min-width: 34px;
            text-align: right;
        }
    `;
    document.head.appendChild(s);
})();

// ── Catégories d'images ───────────────────────────────────────────────────
// Pour ajouter une catégorie : { id, label, icon, images: [{src, label}, ...] }
// Pour ajouter une image     : ajouter { src, label } dans images[] de la bonne catégorie
// ─────────────────────────────────────────────────────────────────────────
if (!window.IMAGE_CATEGORIES) {
    window.IMAGE_CATEGORIES = [
        {
            id: 'geographie',
            label: 'Géographie',
            icon: '🌍',
            images: [
                { src: 'images/carte-france01.png',              label: 'France (vierge)' },
                { src: 'images/carte-france-departements01.png', label: 'Départements français (numéros)' },
                { src: 'images/carte-france-regions01.png',      label: 'Régions françaises (vierge)' },
				{ src: 'images/carte-france-regions02.png',      label: 'Régions françaises (noms)' },
                { src: 'images/carte-europe-pays01.png',         label: "Pays d'Europe (vierge)" },
                { src: 'images/carte-monde01.png',               label: 'Monde (vierge)' },
                { src: 'images/carte-monde-pays01.png',          label: 'Pays du monde (noms)' },
            ]
        },
        {
            id: 'monnaie',
            label: 'Monnaie',
            icon: '💶',
            images: [
                { src: 'images/monnaie-billet-5.jpg',   label: 'Billet de 5 euros' },
                { src: 'images/monnaie-billet-10.jpg',  label: 'Billet de 10 euros' },
                { src: 'images/monnaie-billet-20.jpg',  label: 'Billet de 20 euros' },
                { src: 'images/monnaie-billet-50.jpg',  label: 'Billet de 50 euros' },
                { src: 'images/monnaie-billet-100.jpg', label: 'Billet de 100 euros' },
                { src: 'images/monnaie-piece-001.png',  label: 'Pièce de 1 centime' },
                { src: 'images/monnaie-piece-002.png',  label: 'Pièce de 2 centimes' },
                { src: 'images/monnaie-piece-005.png',  label: 'Pièce de 5 centimes' },
                { src: 'images/monnaie-piece-010.png',  label: 'Pièce de 10 centimes' },
                { src: 'images/monnaie-piece-020.png',  label: 'Pièce de 20 centimes' },
                { src: 'images/monnaie-piece-050.png',  label: 'Pièce de 50 centimes' },
                { src: 'images/monnaie-piece-1.png',    label: 'Pièce de 1 euro' },
                { src: 'images/monnaie-piece-2.png',    label: 'Pièce de 2 euros' },
            ]
        },
		{
            id: 'animaux',
            label: 'Animaux',
            icon: '😺',
            images: [
                { src: 'images/animaux-cerf.png',        label: 'Le cerf' },
				{ src: 'images/animaux-chat.png',        label: 'Le chat' },
				{ src: 'images/animaux-cheval.png',      label: 'Le cheval' },
				{ src: 'images/animaux-chevre.png',      label: 'La chèvre' },
				{ src: 'images/animaux-chien.png',       label: 'Le chien' },
				{ src: 'images/animaux-cochon.png',      label: 'Le cochon' },
				{ src: 'images/animaux-ecureuil.png',    label: 'L\'écureuil' },
				{ src: 'images/animaux-elephant.png',    label: 'L\'éléphant' },
				{ src: 'images/animaux-girafe.png',      label: 'La girafe' },
				{ src: 'images/animaux-hippopotame.png', label: 'L\'hippopotame' },
				{ src: 'images/animaux-kangourou.png',   label: 'Le kangoutou' },
				{ src: 'images/animaux-lion.png',        label: 'Le lion' },
				{ src: 'images/animaux-loup.png',        label: 'Le loup' },
				{ src: 'images/animaux-mouton.png',      label: 'Le mouton' },
				{ src: 'images/animaux-renard.png',      label: 'Le renard' },
				{ src: 'images/animaux-rhinoceros.png',  label: 'Le rhinocéros' },
				{ src: 'images/animaux-tigre.png',       label: 'Le tigre' },
				{ src: 'images/animaux-vache.png',       label: 'La vache' },
				{ src: 'images/animaux-zebre.png',       label: 'Le zèbre' },
            ]
        },
		{
            id: 'saisons',
            label: 'Saisons',
            icon: '🌼',
            images: [
                { src: 'images/saisons-printemps01.png',    label: 'Printemps' },
				{ src: 'images/saisons-printemps02.png',    label: 'Printemps' },
				{ src: 'images/saisons-printemps03.png',    label: 'Printemps' },
				{ src: 'images/saisons-printemps04.png',    label: 'Printemps' },
				{ src: 'images/saisons-printemps05.png',    label: 'Printemps' },
				{ src: 'images/saisons-printemps06.png',    label: 'Printemps' },
				{ src: 'images/saisons-printemps07.png',    label: 'Printemps' },
				{ src: 'images/saisons-printemps08.png',    label: 'Printemps' },
            ]
        },
    ];
}

// IMAGE_LIBRARY : reconstruction automatique pour la recherche globale et la rétrocompatibilité
if (!window.IMAGE_LIBRARY) {
    window.IMAGE_LIBRARY = window.IMAGE_CATEGORIES.flatMap(cat =>
        cat.images.map(img => ({ ...img, _catId: cat.id, _catLabel: cat.label, _catIcon: cat.icon }))
    );
}

// ── État du panneau ───────────────────────────────────────────────────────
let _imagePanelBuilt = false;
let _imagePanelExtraImages = []; // images ajoutées via upload (data URLs)
let _imagePanelActiveTab = null; // id de la catégorie active, null = toutes

// ── Panneau HTML ──────────────────────────────────────────────────────────
function _buildImagePanel() {
    if (_imagePanelBuilt) return;
    _imagePanelBuilt = true;

    // Onglet actif par défaut = première catégorie
    _imagePanelActiveTab = window.IMAGE_CATEGORIES[0]?.id || null;

    const panel = document.createElement('div');
    panel.id = 'image-panel';
    panel.innerHTML = `
        <div id="image-panel-header">
            <h3>🖼️ Images</h3>
            <button id="image-panel-close" title="Fermer">×</button>
        </div>
        <div id="image-panel-search">
            <input type="text" id="image-search-input" placeholder="🔍 Rechercher une image…">
        </div>
        <div id="image-panel-tabs"></div>
        <div id="image-panel-grid">
            <div id="image-panel-empty">Aucune image trouvée.</div>
        </div>
        <div id="image-panel-footer">
            <div id="image-upload-btn" title="Importer une image depuis votre ordinateur">
                ＋ Importer une image…
            </div>
            <input type="file" id="image-upload-input" accept="image/*" multiple>
        </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('image-panel-close').addEventListener('click', closeImagePanel);

    // Onglets — un bouton par catégorie
    const tabsContainer = document.getElementById('image-panel-tabs');
    window.IMAGE_CATEGORIES.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'img-tab-btn' + (cat.id === _imagePanelActiveTab ? ' active' : '');
        btn.dataset.catId = cat.id;
        btn.textContent = cat.icon + ' ' + cat.label;
        btn.addEventListener('click', () => {
            _imagePanelActiveTab = cat.id;
            document.getElementById('image-search-input').value = '';
            tabsContainer.querySelectorAll('.img-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            _renderImageGrid();
        });
        tabsContainer.appendChild(btn);
    });

    // Recherche — désactive les onglets et affiche tous les résultats
    document.getElementById('image-search-input').addEventListener('input', (e) => {
        const q = e.target.value.trim().toLowerCase();
        if (q) {
            // Mode recherche : aucun onglet actif
            tabsContainer.querySelectorAll('.img-tab-btn').forEach(b => b.classList.remove('active'));
            _imagePanelActiveTab = null;
        } else {
            // Retour à l'onglet actif précédent (ou premier)
            _imagePanelActiveTab = window.IMAGE_CATEGORIES[0]?.id || null;
            tabsContainer.querySelectorAll('.img-tab-btn').forEach(b => {
                b.classList.toggle('active', b.dataset.catId === _imagePanelActiveTab);
            });
        }
        _renderImageGrid(q);
    });

    document.getElementById('image-upload-btn').addEventListener('click', () => {
        document.getElementById('image-upload-input').click();
    });

    document.getElementById('image-upload-input').addEventListener('change', (e) => {
        const files = Array.from(e.target.files || []);
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
                _imagePanelExtraImages.push({ src: ev.target.result, label: file.name, dataUrl: true });
                // Basculer sur l'onglet "Importées" et le créer si besoin
                _imagePanelActiveTab = '__imported__';
                _refreshImportedTab();
                _renderImageGrid();
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    });

    _renderImageGrid();
}

function _refreshImportedTab() {
    const tabsContainer = document.getElementById('image-panel-tabs');
    if (!tabsContainer) return;
    // Créer l'onglet "Importées" s'il n'existe pas encore
    if (!tabsContainer.querySelector('[data-cat-id="__imported__"]')) {
        const btn = document.createElement('button');
        btn.className = 'img-tab-btn';
        btn.dataset.catId = '__imported__';
        btn.textContent = '📎 Importées';
        btn.addEventListener('click', () => {
            _imagePanelActiveTab = '__imported__';
            document.getElementById('image-search-input').value = '';
            tabsContainer.querySelectorAll('.img-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            _renderImageGrid();
        });
        tabsContainer.appendChild(btn);
    }
    // Activer cet onglet visuellement
    tabsContainer.querySelectorAll('.img-tab-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.catId === '__imported__');
    });
}

function _renderImageGrid(filter = '') {
    const grid = document.getElementById('image-panel-grid');
    const emptyMsg = document.getElementById('image-panel-empty');
    if (!grid) return;

    grid.querySelectorAll('.img-panel-thumb, .img-category-title').forEach(el => el.remove());

    if (filter) {
        // ── Mode recherche : toutes catégories + importées, avec titres de section ──
        const allImages = [...window.IMAGE_LIBRARY, ..._imagePanelExtraImages];
        const filtered = allImages.filter(img => img.label.toLowerCase().includes(filter));

        if (filtered.length === 0) { emptyMsg.style.display = 'block'; return; }
        emptyMsg.style.display = 'none';

        const bycat = {};
        filtered.forEach(img => {
            const key = img._catLabel || '📎 Importées';
            if (!bycat[key]) bycat[key] = [];
            bycat[key].push(img);
        });
        Object.entries(bycat).forEach(([catLabel, imgs]) => {
            const title = document.createElement('div');
            title.className = 'img-category-title';
            title.textContent = catLabel;
            grid.appendChild(title);
            imgs.forEach(img => grid.appendChild(_makeThumb(img)));
        });

    } else if (_imagePanelActiveTab === '__imported__') {
        // ── Onglet Importées ──
        if (_imagePanelExtraImages.length === 0) { emptyMsg.style.display = 'block'; return; }
        emptyMsg.style.display = 'none';
        _imagePanelExtraImages.forEach(img => grid.appendChild(_makeThumb(img)));

    } else {
        // ── Onglet catégorie normale ──
        const cat = window.IMAGE_CATEGORIES.find(c => c.id === _imagePanelActiveTab);
        const images = cat ? cat.images : [];

        if (images.length === 0) { emptyMsg.style.display = 'block'; return; }
        emptyMsg.style.display = 'none';
        images.forEach(img => grid.appendChild(_makeThumb(img)));
    }
}

function _makeThumb(img) {
    const thumb = document.createElement('div');
    thumb.className = 'img-panel-thumb';
    thumb.title = img.label;

    const image = document.createElement('img');
    image.src = img.src;
    image.alt = img.label;
    image.loading = 'lazy';

    const label = document.createElement('div');
    label.className = 'img-panel-label';
    label.textContent = img.label;

    thumb.appendChild(image);
    thumb.appendChild(label);
    thumb.addEventListener('click', () => _insertImageWidget(img.src, img.label));
    return thumb;
}

// ── Menu de transparence (double-clic sur image widget) ──────────────────
let _imgOpacityMenu = null;

function _closeImgOpacityMenu() {
    if (_imgOpacityMenu) { _imgOpacityMenu.remove(); _imgOpacityMenu = null; }
}

function _openImgOpacityMenu(widget, img, clientX, clientY) {
    _closeImgOpacityMenu();

    const menu = document.createElement('div');
    menu.className = 'img-opacity-menu';
    _imgOpacityMenu = menu;

    // Lire l'opacité courante (stockée en dataset ou 1 par défaut)
    const currentOpacity = parseFloat(widget.dataset.imgOpacity ?? 1);
    const currentPct = Math.round(currentOpacity * 100);

    menu.innerHTML = `
        <div class="img-opacity-menu-title">☀ Transparence</div>
        <div class="img-opacity-row">
            <input class="img-opacity-slider" type="range" min="0" max="100" value="${currentPct}">
            <span class="img-opacity-val">${currentPct}%</span>
        </div>
    `;

    document.body.appendChild(menu);

    // Positionner près du curseur, en restant dans l'écran
    const mw = 200, mh = 70;
    let x = clientX + 12, y = clientY + 12;
    if (x + mw > window.innerWidth)  x = clientX - mw - 4;
    if (y + mh > window.innerHeight) y = clientY - mh - 4;
    menu.style.left = x + 'px';
    menu.style.top  = y + 'px';

    const slider = menu.querySelector('.img-opacity-slider');
    const valEl  = menu.querySelector('.img-opacity-val');

    slider.addEventListener('input', () => {
        const pct = parseInt(slider.value);
        valEl.textContent = pct + '%';
        const opacity = pct / 100;
        img.style.opacity = opacity;
        widget.dataset.imgOpacity = opacity;
    });

    slider.addEventListener('change', () => saveBoard());

    // Fermer au clic en dehors
    setTimeout(() => {
        document.addEventListener('mousedown', function onOut(e) {
            if (menu.contains(e.target)) return;
            _closeImgOpacityMenu();
            document.removeEventListener('mousedown', onOut);
        });
    }, 10);
}

// ── Insertion d'une image sur le bureau ───────────────────────────────────
function _insertImageWidget(src, label) {
    const tmpImg = new Image();
    tmpImg.onload = () => {
        _doInsertImageWidget(src, label, tmpImg.naturalWidth, tmpImg.naturalHeight);
    };
    tmpImg.onerror = () => {
        _doInsertImageWidget(src, label, 400, 300);
    };
    tmpImg.src = src;
}

function _doInsertImageWidget(src, label, naturalW, naturalH) {
    const MAX_SIZE = 600;
    let w = naturalW, h = naturalH;
    if (w > MAX_SIZE || h > MAX_SIZE) {
        const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
    }
    if (w < 80) { h = Math.round(h * 80 / w); w = 80; }
    if (h < 80) { w = Math.round(w * 80 / h); h = 80; }

    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'sticker';
    widget.dataset.transparent = 'true';
    widget.dataset.imageWidget = 'true';
    widget.dataset.imgOpacity = '1';
    widget.dataset.flipX = '1';
    widget.dataset.flipY = '1';
    widget.style.cssText = `left:${pos.x}px; top:${pos.y}px; width:${w}px; height:${h}px; overflow:visible; flex-direction:row;`;
    widget.style.setProperty('--sticker-h', h + 'px');
    widget.tabIndex = 0;

    const img = document.createElement('img');
    img.src = src;
    img.alt = label || 'Image';
    img.draggable = false;
    img.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; object-fit:fill; pointer-events:none; padding:0; box-sizing:border-box; transform-origin:center center;';

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
        <div class="flip-h-btn"      title="Symétrie horizontale">↔</div>
        <div class="flip-v-btn"      title="Symétrie verticale">↕</div>
        <div class="resize-lock-btn" title="Verrouiller les proportions (ou Shift)">🔓</div>
        <div class="shape-resize-handle" title="Redimensionner"></div>
    `;
    widget.appendChild(img);

    // ── Flip horizontal ──
    const flipHBtn = widget.querySelector('.flip-h-btn');
    const flipVBtn = widget.querySelector('.flip-v-btn');
    const lockBtn  = widget.querySelector('.resize-lock-btn');

    flipHBtn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
    flipHBtn.addEventListener('click', e => {
        e.stopPropagation();
        snapshotNow();
        widget.dataset.flipX = String(parseFloat(widget.dataset.flipX || 1) * -1);
        _applyImgFlip(widget, img);
    });

    // ── Flip vertical ──
    flipVBtn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
    flipVBtn.addEventListener('click', e => {
        e.stopPropagation();
        snapshotNow();
        widget.dataset.flipY = String(parseFloat(widget.dataset.flipY || 1) * -1);
        _applyImgFlip(widget, img);
    });

    // ── Verrouillage proportions ──
    lockBtn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
    lockBtn.addEventListener('click', e => {
        e.stopPropagation();
        const locked = lockBtn.classList.toggle('locked');
        lockBtn.textContent = locked ? '🔒' : '🔓';
    });

    // ── Resize (poignée coin bas-droite, comme shapes) ──
    const resizeHandle = widget.querySelector('.shape-resize-handle');
    resizeHandle.addEventListener('mousedown', e => {
        e.preventDefault(); e.stopPropagation();
        snapshotNow();
        const startX = e.clientX, startY = e.clientY;
        const startW = widget.offsetWidth, startH = widget.offsetHeight;
        const ratio  = startH / startW;

        document.onmousemove = ev => {
            const proportional = ev.shiftKey || lockBtn.classList.contains('locked');
            let newW = Math.max(40, startW + ev.clientX - startX);
            let newH = Math.max(40, startH + ev.clientY - startY);
            if (proportional) newH = Math.round(newW * ratio);
            widget.style.width  = newW + 'px';
            widget.style.height = newH + 'px';
            widget.style.setProperty('--sticker-h', newH + 'px');
        };
        document.onmouseup = () => { document.onmousemove = null; saveBoard(); };
    });
    resizeHandle.addEventListener('touchstart', e => {
        e.preventDefault(); e.stopPropagation();
        snapshotNow();
        const t0 = e.touches[0];
        const startX = t0.clientX, startY = t0.clientY;
        const startW = widget.offsetWidth, startH = widget.offsetHeight;
        const ratio  = startH / startW;
        function onMove(ev) {
            const t = ev.touches[0];
            const proportional = lockBtn.classList.contains('locked');
            let newW = Math.max(40, startW + t.clientX - startX);
            let newH = Math.max(40, startH + t.clientY - startY);
            if (proportional) newH = Math.round(newW * ratio);
            widget.style.width  = newW + 'px';
            widget.style.height = newH + 'px';
            widget.style.setProperty('--sticker-h', newH + 'px');
        }
        function onEnd() {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend',  onEnd);
            saveBoard();
        }
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend',  onEnd);
    }, { passive: false });

    widget.addEventListener('mousedown', () => {
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    widget.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        e.preventDefault();
        _openImgOpacityMenu(widget, img, e.clientX, e.clientY);
    });

    board.appendChild(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);
    saveBoard();
}

function _applyImgFlip(widget, img) {
    const sx = parseFloat(widget.dataset.flipX || 1);
    const sy = parseFloat(widget.dataset.flipY || 1);
    img.style.transform = (sx !== 1 || sy !== 1) ? `scale(${sx}, ${sy})` : '';
    saveBoard();
}

// ── Ouverture / fermeture du panneau ─────────────────────────────────────
function toggleImagePanel() {
    _buildImagePanel();
    const panel = document.getElementById('image-panel');
    if (!panel) return;
    const isOpen = panel.classList.contains('active');
    if (isOpen) {
        closeImagePanel();
    } else {
        // Fermer les autres panneaux latéraux si nécessaire
        const stickerPanel = document.getElementById('sticker-panel');
        if (stickerPanel) stickerPanel.classList.remove('active');
        panel.classList.add('active');
    }
}

function closeImagePanel() {
    const panel = document.getElementById('image-panel');
    if (panel) panel.classList.remove('active');
}

// Fermer le panneau au clic en dehors
document.addEventListener('mousedown', (e) => {
    const panel = document.getElementById('image-panel');
    if (!panel || !panel.classList.contains('active')) return;
    if (panel.contains(e.target)) return;
    // Ne pas fermer si on clique sur le bouton d'ouverture
    if (e.target.closest('#image-panel-btn')) return;
    closeImagePanel();
});
