// =========================================================================
// PANNEAU LATÉRAL PROJETS — Le Bureau du Prof
// Panneau gauche sur le modèle de la bibliothèque PDF
// =========================================================================

(function() {

// ── Helpers DOM ───────────────────────────────────────────────────────────
function _panel()  { return document.getElementById('projects-panel'); }
function _list()   { return document.getElementById('proj-panel-list'); }

// ── Ouverture / fermeture du panneau ─────────────────────────────────────
function toggleProjectsPanel() {
    const panel = _panel();
    if (!panel) return;
    const open = panel.classList.toggle('proj-panel-open');
    try { localStorage.setItem('projectsPanelOpen', open ? '1' : '0'); } catch(e) {}
    // Mettre à jour l'onglet déclencheur
    const tab = document.getElementById('projects-panel-tab');
    if (tab) tab.classList.toggle('proj-panel-tab-open', open);
    // Mettre à jour le bouton menu si présent
    const menuBtn = document.getElementById('projects-library-menu-btn');
    if (menuBtn) menuBtn.classList.toggle('btn-mode-active', open);
    // Rafraîchir la liste à l'ouverture
    if (open) _renderProjPanelList();
}
window.toggleProjectsPanel = toggleProjectsPanel;
window.refreshProjectsPanel = function() {
    const panel = document.getElementById('projects-panel');
    if (panel && panel.classList.contains('proj-panel-open')) _renderProjPanelList();
};

// ── Rendu de la liste des projets ─────────────────────────────────────────
async function _renderProjPanelList() {
    const list = _list();
    if (!list) return;
    list.innerHTML = '<div class="proj-panel-loading">Chargement…</div>';

    let projects;
    try { projects = await dbGetAll(); }
    catch(e) {
        list.innerHTML = '<div class="proj-panel-empty">Erreur de chargement</div>';
        return;
    }

    if (!projects.length) {
        list.innerHTML = '<div class="proj-panel-empty">Aucun projet sauvegardé</div>';
        return;
    }

    list.innerHTML = '';

    // ── Section favoris ──
    const favIds = _getFavoriteIds();
    const favProjects = favIds.map(id => projects.find(p => p.id === id)).filter(Boolean);

    if (favProjects.length) {
        const favLabel = document.createElement('div');
        favLabel.className = 'proj-panel-section-label proj-panel-section-fav';
        favLabel.textContent = '⭐ Favoris';
        list.appendChild(favLabel);
        favProjects.forEach(p => _buildProjPanelRow(p, list));

        const sep = document.createElement('div');
        sep.className = 'proj-panel-sep';
        list.appendChild(sep);

        const allLabel = document.createElement('div');
        allLabel.className = 'proj-panel-section-label';
        allLabel.textContent = '📁 Tous les projets';
        list.appendChild(allLabel);
    }

    projects.forEach(p => _buildProjPanelRow(p, list));
}

function _buildProjPanelRow(p, list) {
    const isCurrent = p.id === getCurrentProjectId();
    const sceneList = p.scenes || [];
    const sceneCount = sceneList.length;
    const date = new Date(p.updatedAt).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'proj-panel-item-wrap' + (isCurrent ? ' proj-panel-item-current' : '');

    // ── Header du projet ──
    const header = document.createElement('div');
    header.className = 'proj-panel-item-header';

    const arrow = document.createElement('span');
    arrow.className = 'proj-panel-arrow';
    arrow.textContent = '▶';

    const info = document.createElement('div');
    info.className = 'proj-panel-item-info';
    info.innerHTML = `
        <div class="proj-panel-item-name">${_escHtmlPanel(p.name)}</div>
        <div class="proj-panel-item-meta">${sceneCount} tableau${sceneCount > 1 ? 'x' : ''} · ${date}</div>
    `;

    // Boutons d'action
    const actions = document.createElement('div');
    actions.className = 'proj-panel-item-actions';

    if (!isCurrent) {
        const btnOpen = document.createElement('button');
        btnOpen.className = 'proj-panel-btn proj-panel-btn-open';
        btnOpen.textContent = '📂';
        btnOpen.title = 'Ouvrir ce projet';
        btnOpen.addEventListener('click', (e) => { e.stopPropagation(); _projLoad(p.id); });
        actions.appendChild(btnOpen);
    }

    const btnRename = document.createElement('button');
    btnRename.className = 'proj-panel-btn';
    btnRename.textContent = '✏️';
    btnRename.title = 'Renommer';
    btnRename.addEventListener('click', (e) => { e.stopPropagation(); _projRename(p.id, p.name); });

    const isFav = _isFavorite(p.id);
    const btnFav = document.createElement('button');
    btnFav.className = 'proj-panel-btn' + (isFav ? ' proj-panel-btn-fav-active' : '');
    btnFav.textContent = isFav ? '⭐' : '☆';
    btnFav.title = isFav ? 'Retirer des favoris' : 'Ajouter aux favoris';
    btnFav.addEventListener('click', (e) => {
        e.stopPropagation();
        _toggleFavorite(p.id);
        _renderProjPanelList();
        refreshFavoritesMenu();
    });

    const btnDelete = document.createElement('button');
    btnDelete.className = 'proj-panel-btn proj-panel-btn-delete';
    btnDelete.textContent = '×';
    btnDelete.title = 'Supprimer';
    btnDelete.addEventListener('click', (e) => { e.stopPropagation(); _projDelete(p.id).then(() => _renderProjPanelList()); });

    actions.appendChild(btnRename);
    actions.appendChild(btnFav);
    actions.appendChild(btnDelete);

    header.appendChild(arrow);
    header.appendChild(info);
    header.appendChild(actions);

    // ── Accordion scènes ──
    const accordion = document.createElement('div');
    accordion.className = 'proj-panel-accordion';

    if (!sceneList.length) {
        accordion.innerHTML = '<div class="proj-panel-empty" style="padding:6px 12px;">Aucun tableau</div>';
    } else {
        sceneList.forEach((sc, idx) => {
            const isCurrentScene = isCurrent && idx === p.currentScene;
            const scRow = document.createElement('div');
            scRow.className = 'proj-panel-scene' + (isCurrentScene ? ' proj-panel-scene-active' : '');

            const scIcon = document.createElement('span');
            scIcon.className = 'proj-panel-scene-icon';
            scIcon.textContent = isCurrentScene ? '▶' : '○';

            const scLabel = document.createElement('span');
            scLabel.className = 'proj-panel-scene-label';
            scLabel.textContent = sc.name || `Tableau ${idx + 1}`;

            scRow.appendChild(scIcon);
            scRow.appendChild(scLabel);

            if (!isCurrentScene) {
                scRow.addEventListener('click', () => {
                    _projLoadAtScene(p.id, idx);
                });
            }
            accordion.appendChild(scRow);
        });
    }

    // ── Toggle accordion ──
    let open = false;
    header.addEventListener('click', (e) => {
        if (e.target.closest('.proj-panel-btn')) return;
        open = !open;
        accordion.classList.toggle('proj-panel-accordion-open', open);
        arrow.style.transform = open ? 'rotate(90deg)' : '';
        arrow.style.color = open ? '#4a90e2' : '';
    });

    if (!isCurrent) {
        header.addEventListener('dblclick', (e) => {
            if (e.target.closest('.proj-panel-btn')) return;
            _projLoad(p.id);
        });
    }

    wrapper.appendChild(header);
    wrapper.appendChild(accordion);
    list.appendChild(wrapper);
}

function _escHtmlPanel(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ──────────────────────────────────────────────────────────────────
function _init() {
    const RESIZE_KEY = 'projectsPanelWidth';
    const MIN_W = 220, MAX_W = 560, DEFAULT_W = 300;

    // Restaurer la largeur
    try {
        const savedW = parseInt(localStorage.getItem(RESIZE_KEY));
        if (savedW >= MIN_W && savedW <= MAX_W) {
            document.documentElement.style.setProperty('--proj-panel-w', savedW + 'px');
        }
    } catch(e) {}

    // Logique drag de la poignée de resize
    const handle = document.getElementById('projects-panel-resize-handle');
    const panel  = _panel();
    const tab    = document.getElementById('projects-panel-tab');
    if (handle && panel) {
        let _startX = 0, _startW = 0, _dragging = false;

        handle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            _dragging = true;
            _startX = e.clientX;
            _startW = panel.offsetWidth;
            panel.classList.add('proj-panel-resizing');
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'ew-resize';
        });

        document.addEventListener('mousemove', (e) => {
            if (!_dragging) return;
            const dx = e.clientX - _startX;
            const newW = Math.max(MIN_W, Math.min(MAX_W, _startW + dx));
            document.documentElement.style.setProperty('--proj-panel-w', newW + 'px');
        });

        document.addEventListener('mouseup', () => {
            if (!_dragging) return;
            _dragging = false;
            panel.classList.remove('proj-panel-resizing');
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            try { localStorage.setItem(RESIZE_KEY, panel.offsetWidth); } catch(e) {}
        });
    }

    // Restaurer l'état ouvert/fermé
    try {
        if (localStorage.getItem('projectsPanelOpen') === '1') {
            if (panel) panel.classList.add('proj-panel-open');
            if (tab) tab.classList.add('proj-panel-tab-open');
            _renderProjPanelList();
        }
    } catch(e) {}
}

// ── Fermeture au clic en dehors ───────────────────────────────────────────
document.addEventListener('pointerdown', (e) => {
    const panel = _panel();
    const tab   = document.getElementById('projects-panel-tab');
    if (!panel || !panel.classList.contains('proj-panel-open')) return;
    if (panel.contains(e.target) || (tab && tab.contains(e.target))) return;
    // Ne pas fermer si on clique sur un dialog/overlay (ex: modale projets)
    if (e.target.closest('#projects-overlay')) return;
    panel.classList.remove('proj-panel-open');
    if (tab) tab.classList.remove('proj-panel-tab-open');
    const menuBtn = document.getElementById('projects-library-menu-btn');
    if (menuBtn) menuBtn.classList.remove('btn-mode-active');
    try { localStorage.setItem('projectsPanelOpen', '0'); } catch(e) {}
});

document.addEventListener('DOMContentLoaded', _init);

})();
