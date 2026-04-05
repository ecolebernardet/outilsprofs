// =========================================================================
// WIDGET IMAGE — Le Bureau du Prof
// Permet d'insérer une image depuis le dossier /images sur le bureau.
//
// Dépendances globales (définies dans widgets.js / save-load.js) :
//   board, findFreePosition(), makeDraggable(), makeDraggableRotate(),
//   bringToFront(), _addStickerResizeHandle(), snapshotNow(), saveBoard()
// =========================================================================

// ── Catégories d'images ───────────────────────────────────────────────────
// Pour ajouter une catégorie : { id, label, icon, images: [{src, label}, ...] }
// Pour ajouter une image     : ajouter { src, label } dans images[] de la bonne catégorie
// ─────────────────────────────────────────────────────────────────────────
if (!window.IMAGE_CATEGORIES) {
    window.IMAGE_CATEGORIES = [
        {
            id: 'maths',
            label: 'Maths',
            icon: '🧮️',
            images: [
                { src: 'images/maths-table-pythagore.jpg',                          label: 'Maths (table de Pythagore)' },
				{ src: 'images/maths-tableau-conversion-contenances.jpg',           label: 'Maths (tableau de conversion des mesures de contenances)' },
                { src: 'images/maths-tableau-conversion-longueurs.jpg',             label: 'Maths (tableau de conversion des mesures de longueurs)' },
				{ src: 'images/maths-tableau-conversion-masses.jpg',                label: 'Maths (tableau de conversion des mesures de masses)' },
                { src: 'images/maths-tableau-numeration-decimaux.jpg',              label: 'Maths (tableau de numération des nombres décimaux)' },
				{ src: 'images/maths-tableau-numeration-entiers.jpg',               label: 'Maths (tableau de numération des nombres entiers)' },
				{ src: 'images/maths-droite-numerique-petits-carreaux.jpg',         label: 'Maths (droite numérique - centièmes))' },
				{ src: 'images/maths-droite-numerique-millimetre.jpg',              label: 'Maths (droite numérique - dixièmes)' },
				{ src: 'images/maths-graphique.jpg',                                label: 'Maths (graphique)' },
				{ src: 'images/maths-equerre.png',                                  label: 'Maths (équerre)' },
				{ src: 'images/maths-tangram-24x24.jpg',                            label: 'Maths (tangram)' },
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
				{ src: 'images/saisons-ete01.png',          label: 'Été' },
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
            id: 'BD',
            label: 'BD',
            icon: '💬',
            images: [
                { src: 'images/BD01.png',    label: 'BD' },
				{ src: 'images/BD02.png',    label: 'BD' },
				{ src: 'images/BD03.png',    label: 'BD' },
				{ src: 'images/BD04.png',    label: 'BD' },
				{ src: 'images/BD05.png',    label: 'BD' },
				{ src: 'images/BD06.png',    label: 'BD' },
				{ src: 'images/BD07.png',    label: 'BD' },
				{ src: 'images/BD08.png',    label: 'BD' },
				{ src: 'images/BD09.png',    label: 'BD' },
				{ src: 'images/BD10.png',    label: 'BD' },
				{ src: 'images/BD11.png',    label: 'BD' },
				{ src: 'images/BD12.png',    label: 'BD' },
				{ src: 'images/BD13.png',    label: 'BD' },
				{ src: 'images/BD14.png',    label: 'BD' },
				{ src: 'images/BD15.png',    label: 'BD' },
				{ src: 'images/BD16.png',    label: 'BD' },
				{ src: 'images/BD17.png',    label: 'BD' },
				{ src: 'images/BD18.png',    label: 'BD' },
				{ src: 'images/BD19.png',    label: 'BD' },
				{ src: 'images/BD20.png',    label: 'BD' },
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
            id: 'météo',
            label: 'Météo',
            icon: '⛅',
            images: [
                { src: 'images/meteo-arcenciel1.png',    label: 'Arc en ciel' },
				{ src: 'images/meteo-arcenciel2.png',    label: 'Arc en ciel' },
				{ src: 'images/meteo-arcenciel3.png',    label: 'Arc en ciel' },
				{ src: 'images/meteo-arcenciel4.png',           label: 'Arc en ciel' },
				{ src: 'images/meteo-nuage1.png',               label: 'Nuage' },
				{ src: 'images/meteo-pluie1.png',               label: 'Pluie' },
				{ src: 'images/meteo-soleil-rayons1.png',       label: 'Soleil' },
				{ src: 'images/meteo-soleil-rayons2.png',       label: 'Soleil' },
            ]
        },
		{
            id: 'cadres',
            label: 'Cadres',
            icon: '🖼️',
            images: [
                { src: 'images/cadre01.png',    label: 'Cadre' },
				{ src: 'images/cadre02.png',    label: 'Cadre' },
				{ src: 'images/cadre03.png',    label: 'Cadre' },
				{ src: 'images/cadre04.png',    label: 'Cadre' },
				{ src: 'images/cadre05.png',    label: 'Cadre' },
				{ src: 'images/cadre06.png',    label: 'Cadre' },
				{ src: 'images/cadre07.png',    label: 'Cadre' },
				{ src: 'images/cadre08.png',    label: 'Cadre' },
				{ src: 'images/cadre09.png',    label: 'Cadre' },
				{ src: 'images/cadre10.png',    label: 'Cadre' },
            ]
        },
		{
            id: 'textures',
            label: 'Textures',
            icon: '📜',
            images: [
                { src: 'images/texture01.png',    label: 'Texture' },
				{ src: 'images/texture02.png',    label: 'Texture' },
				{ src: 'images/texture03.png',    label: 'Texture' },
				{ src: 'images/texture04.png',    label: 'Texture' },
				{ src: 'images/texture05.png',    label: 'Texture' },
				{ src: 'images/texture06.png',    label: 'Texture' },
				{ src: 'images/texture07.png',    label: 'Texture' },
				{ src: 'images/texture08.png',    label: 'Texture' },
				{ src: 'images/texture09.png',    label: 'Texture' },
				{ src: 'images/texture10.png',    label: 'Texture' },
				{ src: 'images/texture11.png',    label: 'Texture' },
				{ src: 'images/texture12.png',    label: 'Texture' },
            ]
        },
		{
            id: 'geographie',
            label: 'Géographie',
            icon: '🌍',
            images: [
                { src: 'images/carte-france01.png',              label: 'France (vierge)' },
				{ src: 'images/carte-france02.png',              label: 'France (contour)' },
                { src: 'images/carte-france-departements01.png', label: 'Départements français (numéros)' },
				{ src: 'images/carte-france-departements02.png', label: 'Départements français (vierge)' },
                { src: 'images/carte-france-regions01.png',      label: 'Régions françaises (vierge)' },
				{ src: 'images/carte-france-regions02.png',      label: 'Régions françaises (noms)' },
                { src: 'images/carte-europe-pays01.png',         label: "Pays d'Europe (vierge)" },
				{ src: 'images/carte-europe-pays02.png',         label: "Pays d'Europe (vierge)" },
                { src: 'images/carte-monde01.png',               label: 'Monde (vierge)' },
				{ src: 'images/carte-monde02.png',               label: 'Monde (vierge)' },
                { src: 'images/carte-monde-pays01.png',          label: 'Pays du monde (noms)' },
				{ src: 'images/carte-monde-drapeaux01.png',      label: 'Globe (drapeaux)' },
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

function _doInsertImageWidget(src, label, naturalW, naturalH, opts) {
    const MAX_W = 900;
    const MAX_H = 600;
    let w = naturalW, h = naturalH;
    if (w > MAX_W || h > MAX_H) {
        const ratio = Math.min(MAX_W / w, MAX_H / h);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
    }
    if (w < 80) { h = Math.round(h * 80 / w); w = 80; }
    if (h < 80) { w = Math.round(w * 80 / h); h = 80; }

    snapshotNow();
    const pos = (opts && opts.skipFreePos)
        ? { x: opts.left || 0, y: opts.top || 0 }
        : findFreePosition(w, h);

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
    `;
    widget.appendChild(img);

    // ── Flip horizontal ──
    const flipHBtn = widget.querySelector('.flip-h-btn');
    const flipVBtn = widget.querySelector('.flip-v-btn');
    const lockBtn  = widget.querySelector('.resize-lock-btn');

    flipHBtn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
    flipHBtn.addEventListener('touchstart', e => { e.stopPropagation(); }, { passive: true });
    flipHBtn.addEventListener('click', e => {
        e.stopPropagation();
        snapshotNow();
        widget.dataset.flipX = String(parseFloat(widget.dataset.flipX || 1) * -1);
        _applyImgFlip(widget, img);
    });

    // ── Flip vertical ──
    flipVBtn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
    flipVBtn.addEventListener('touchstart', e => { e.stopPropagation(); }, { passive: true });
    flipVBtn.addEventListener('click', e => {
        e.stopPropagation();
        snapshotNow();
        widget.dataset.flipY = String(parseFloat(widget.dataset.flipY || 1) * -1);
        _applyImgFlip(widget, img);
    });

    // ── Verrouillage proportions ──
    lockBtn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
    lockBtn.addEventListener('touchstart', e => { e.stopPropagation(); }, { passive: true });
    lockBtn.addEventListener('click', e => {
        e.stopPropagation();
        const locked = lockBtn.classList.toggle('locked');
        lockBtn.textContent = locked ? '🔒' : '🔓';
    });

    // ── Poignée resize custom (même système que les autres widgets) ──
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'custom-resize-handle';
    resizeHandle.title = 'Redimensionner';
    widget.appendChild(resizeHandle);

    resizeHandle.addEventListener('pointerdown', e => {
        if (e.button !== undefined && e.button !== 0) return;
        e.preventDefault(); e.stopPropagation();
        resizeHandle.setPointerCapture(e.pointerId);
        snapshotNow();
        const startX = e.clientX, startY = e.clientY;
        const startW = widget.offsetWidth, startH = widget.offsetHeight;
        const ratio  = startH / startW;

        function onMove(ev) {
            ev.preventDefault();
            const proportional = ev.shiftKey || lockBtn.classList.contains('locked');
            let newW = Math.max(40, startW + ev.clientX - startX);
            let newH = Math.max(40, startH + ev.clientY - startY);
            if (proportional) newH = Math.round(newW * ratio);
            widget.style.width  = newW + 'px';
            widget.style.height = newH + 'px';
            widget.style.setProperty('--sticker-h', newH + 'px');
        }
        function onUp() {
            resizeHandle.removeEventListener('pointermove',   onMove);
            resizeHandle.removeEventListener('pointerup',     onUp);
            resizeHandle.removeEventListener('pointercancel', onUp);
            saveBoard();
        }
        resizeHandle.addEventListener('pointermove',   onMove);
        resizeHandle.addEventListener('pointerup',     onUp);
        resizeHandle.addEventListener('pointercancel', onUp);
    });

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
    return widget;
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
        if (stickerPanel && stickerPanel.classList.contains('active')) {
            stickerPanel.classList.remove('active');
            const sb = document.getElementById('sticker-btn');
            if (sb) sb.classList.remove('active-tool');
            const st = document.getElementById('sticker-panel-tab');
            if (st) st.classList.remove('active');
        }
        panel.classList.add('active');
        const tab = document.getElementById('image-panel-tab');
        if (tab) tab.classList.add('active');
    }
}

function closeImagePanel() {
    const panel = document.getElementById('image-panel');
    if (panel) panel.classList.remove('active');
    const tab = document.getElementById('image-panel-tab');
    if (tab) tab.classList.remove('active');
}

// Fermer le panneau au clic en dehors
document.addEventListener('mousedown', (e) => {
    const panel = document.getElementById('image-panel');
    if (!panel || !panel.classList.contains('active')) return;
    if (panel.contains(e.target)) return;
    if (e.target.closest('#image-panel-btn')) return;
    if (e.target.closest('#image-panel-tab')) return;
    closeImagePanel();
});

// Créer l'onglet déclencheur dès le chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    if (!document.getElementById('image-panel-tab')) {
        const tab = document.createElement('button');
        tab.id = 'image-panel-tab';
        tab.title = 'Images';
        tab.textContent = '🖼️ Images';
        tab.addEventListener('click', toggleImagePanel);
        document.body.appendChild(tab);
    }
});
