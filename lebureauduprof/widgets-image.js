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
            width: 400px; height: 100vh;
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
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            align-content: start;
        }
        #image-panel-grid::-webkit-scrollbar { width: 6px; }
        #image-panel-grid::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
        #image-panel-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }

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
    `;
    document.head.appendChild(s);
})();

// ── Liste des images disponibles dans /images ─────────────────────────────
// Ces images sont déclarées en dur (le navigateur ne peut pas lister un dossier).
// Pour ajouter une image : l'ajouter dans le tableau IMAGE_LIBRARY
// en respectant le format { src: 'images/NOM_FICHIER', label: 'Nom affiché' }
//
// ⚠️  Pour que le panneau se remplisse automatiquement, vous pouvez aussi
//     définir window.IMAGE_LIBRARY avant le chargement de ce script.
// ─────────────────────────────────────────────────────────────────────────
if (!window.IMAGE_LIBRARY) {
    window.IMAGE_LIBRARY = [
        // Exemples – remplacer par les vrais fichiers du dossier images/
        { src: 'images/monnaie-billet-5.jpg',   label: 'Billet de 5 euros' },
        { src: 'images/monnaie-billet-10.jpg',   label: 'Billet de 10 euros' },
        { src: 'images/monnaie-billet-20.jpg',   label: 'Billet de 20 euros' },
		{ src: 'images/monnaie-billet-50.jpg',   label: 'Billet de 50 euros' },
		{ src: 'images/monnaie-billet-100.jpg',   label: 'Billet de 100 euros' },
		{ src: 'images/monnaie-piece-001.png',   label: 'Pièce de 1 centime' },
		{ src: 'images/monnaie-piece-002.png',   label: 'Pièce de 2 centimes' },
		{ src: 'images/monnaie-piece-005.png',   label: 'Pièce de 5 centimes' },
		{ src: 'images/monnaie-piece-010.png',   label: 'Pièce de 10 centimes' },
		{ src: 'images/monnaie-piece-020.png',   label: 'Pièce de 20 centimes' },
		{ src: 'images/monnaie-piece-050.png',   label: 'Pièce de 50 centimes' },
		{ src: 'images/monnaie-piece-1.png',   label: 'Pièce de 1 euros' },
		{ src: 'images/monnaie-piece-2.png',   label: 'Pièce de 2 euros' },
		{ src: 'images/carte-france01.png',   label: 'Carte de France' },
		{ src: 'images/carte-monde01.png',   label: 'Carte du monde' },
		{ src: 'images/carte-monde-pays01.png',   label: 'Carte des pays du monde' },
    ];
}

// ── État du panneau ───────────────────────────────────────────────────────
let _imagePanelBuilt = false;
let _imagePanelExtraImages = []; // images ajoutées via upload (data URLs)

// ── Panneau HTML ──────────────────────────────────────────────────────────
function _buildImagePanel() {
    if (_imagePanelBuilt) return;
    _imagePanelBuilt = true;

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

    document.getElementById('image-search-input').addEventListener('input', (e) => {
        _renderImageGrid(e.target.value.trim().toLowerCase());
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
                _renderImageGrid(document.getElementById('image-search-input').value.trim().toLowerCase());
            };
            reader.readAsDataURL(file);
        });
        e.target.value = ''; // reset pour permettre le même fichier
    });

    _renderImageGrid();
}

function _renderImageGrid(filter = '') {
    const grid = document.getElementById('image-panel-grid');
    const emptyMsg = document.getElementById('image-panel-empty');
    if (!grid) return;

    // Supprimer les anciens thumbs (pas le message vide)
    grid.querySelectorAll('.img-panel-thumb').forEach(el => el.remove());

    const allImages = [...window.IMAGE_LIBRARY, ..._imagePanelExtraImages];
    const filtered = filter
        ? allImages.filter(img => img.label.toLowerCase().includes(filter))
        : allImages;

    if (filtered.length === 0) {
        emptyMsg.style.display = 'block';
        return;
    }
    emptyMsg.style.display = 'none';

    filtered.forEach(img => {
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

        thumb.addEventListener('click', () => {
            _insertImageWidget(img.src, img.label);
        });

        grid.appendChild(thumb);
    });
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
    // Minimum raisonnable
    if (w < 80) { h = Math.round(h * 80 / w); w = 80; }
    if (h < 80) { w = Math.round(w * 80 / h); h = 80; }

    snapshotNow();
    const pos = findFreePosition();

    const widget = document.createElement('div');
    widget.className = 'widget';
    widget.dataset.type = 'sticker';      // Réutilise le type sticker (sauvegarde identique)
    widget.dataset.transparent = 'true';
    widget.dataset.imageWidget = 'true';  // marqueur pour distinguer des stickers émoji
    widget.style.cssText = `left:${pos.x}px; top:${pos.y}px; width:${w}px; height:${h}px; overflow:visible; flex-direction:row;`;
    widget.style.setProperty('--sticker-h', h + 'px');
    widget.tabIndex = 0;

    const img = document.createElement('img');
    img.src = src;
    img.alt = label || 'Image';
    img.draggable = false;
    img.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; object-fit:contain; pointer-events:none; padding:0; box-sizing:border-box;';

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
    widget.appendChild(img);

    widget.addEventListener('mousedown', () => {
        bringToFront(widget);
        widget.focus();
        if (typeof positionActionBar === 'function') positionActionBar(widget);
    });

    board.appendChild(widget);
    bringToFront(widget);
    makeDraggable(widget);
    makeDraggableRotate(widget);
    _addStickerResizeHandle(widget, 40);
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
