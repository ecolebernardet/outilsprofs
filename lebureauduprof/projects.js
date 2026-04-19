// =========================================================================
// BIBLIOTHÈQUE DE PROJETS — Le Bureau du Prof
// Stockage des projets en IndexedDB (local, sans serveur)
// =========================================================================

const DB_NAME    = 'ProfBureauDB';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

let _db = null;

// ── Ouverture / init de la base ───────────────────────────────────────────
function dbOpen() {
    return new Promise((resolve, reject) => {
        if (_db) { resolve(_db); return; }
        const req = indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('updatedAt', 'updatedAt', { unique: false });
            }
        };
        req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
        req.onerror   = (e) => reject(e.target.error);
    });
}

function dbGet(id) {
    return dbOpen().then(db => new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
    }));
}

function dbPut(obj) {
    return dbOpen().then(db => new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).put(obj);
        req.onsuccess = () => resolve(req.result);
        req.onerror   = () => reject(req.error);
    }));
}

function dbDelete(id) {
    return dbOpen().then(db => new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).delete(id);
        req.onsuccess = () => resolve();
        req.onerror   = () => reject(req.error);
    }));
}

function dbGetAll() {
    return dbOpen().then(db => new Promise((resolve, reject) => {
        const tx  = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).index('updatedAt').getAll();
        req.onsuccess = () => resolve((req.result || []).reverse()); // plus récent en premier
        req.onerror   = () => reject(req.error);
    }));
}

// ── Mode brouillon (aucune persistance jusqu'à sauvegarde explicite) ──────
let _isDraft = false;
function isDraftMode() { return _isDraft; }

// ── Favoris (stockés en localStorage) ────────────────────────────────────
function _getFavoriteIds() {
    try { return JSON.parse(localStorage.getItem('profFavoriteProjects') || '[]'); }
    catch(e) { return []; }
}
function _saveFavoriteIds(ids) {
    localStorage.setItem('profFavoriteProjects', JSON.stringify(ids));
}
function _isFavorite(id) { return _getFavoriteIds().includes(id); }
function _toggleFavorite(id) {
    const ids = _getFavoriteIds();
    const idx = ids.indexOf(id);
    if (idx === -1) ids.push(id);
    else ids.splice(idx, 1);
    _saveFavoriteIds(ids);
}

// ── ID du projet courant (stocké en localStorage) ────────────────────────
function getCurrentProjectId() {
    if (_isDraft) return null;
    return localStorage.getItem('currentProjectId') || null;
}
function setCurrentProjectId(id) {
    if (_isDraft) return; // En mode brouillon, on ne touche pas au localStorage
    if (id) localStorage.setItem('currentProjectId', id);
    else    localStorage.removeItem('currentProjectId');
}

// ── Sauvegarder le projet courant en DB ──────────────────────────────────
async function saveProjectToDB(name) {
    saveCurrentSceneData();
    if (_isDraft) return null; // Mode brouillon : aucune persistance
    let id = getCurrentProjectId();
    if (!id) return null; // Pas de projet courant → ne pas créer silencieusement
    const project = {
        id,
        name:      name || 'Sans titre',
        scenes,
        currentScene,
        updatedAt: Date.now(),
    };
    await dbPut(project);
    return project;
}

// ── Charger un projet depuis la DB ───────────────────────────────────────
async function loadProjectFromDB(id, sceneIndex) {
    const project = await dbGet(id);
    if (!project) return false;
    setCurrentProjectId(project.id);
    scenes       = project.scenes       || [];
    // Si un index de scène est demandé, l'utiliser directement
    if (sceneIndex !== undefined && sceneIndex >= 0 && sceneIndex < scenes.length) {
        currentScene = sceneIndex;
    } else {
        currentScene = project.currentScene || 0;
        if (currentScene >= scenes.length) currentScene = 0;
    }
    saveScenesMeta();
    loadScene(currentScene);
    renderScenesBar();
    return project;
}

// ── Nouveau projet vierge ────────────────────────────────────────────────
async function newProject(name) {
    // Sauvegarder l'état actuel si un projet est ouvert, en conservant son nom existant
    const curId = getCurrentProjectId();
    if (curId) {
        try {
            const cur = await dbGet(curId);
            await saveProjectToDB(cur?.name || 'Sans titre');
        } catch(e) {
            await saveProjectToDB('Sans titre');
        }
    }

    _isDraft = false; // On sort du mode brouillon si on y était
    // Réinitialiser
    setCurrentProjectId(null);
    scenes = [{ id: Date.now(), name: 'Tableau 1', config: null, background: 'none' }];
    currentScene = 0;
    saveScenesMeta();
    loadScene(0);
    renderScenesBar();

    // Créer l'entrée DB avec le nom
    const newId = 'proj_' + Date.now();
    setCurrentProjectId(newId);
    await dbPut({ id: newId, name: name || 'Nouveau projet', scenes, currentScene, updatedAt: Date.now() });
    _updateProjectTitle(name || 'Nouveau projet');
}

// ── Nouveau projet brouillon (aucune persistance) ─────────────────────────
async function newDraftProject() {
    // Sauvegarder silencieusement le projet courant s'il existe
    if (!_isDraft) {
        const curId = getCurrentProjectId();
        if (curId) {
            try {
                const cur = await dbGet(curId);
                await saveProjectToDB(cur?.name || 'Sans titre');
            } catch(e) {}
        }
    }

    _isDraft = true;
    localStorage.removeItem('currentProjectId');
    scenes = [{ id: Date.now(), name: 'Tableau 1', config: null, background: '#BAA09B' }];
    currentScene = 0;
    // Ne pas appeler saveScenesMeta → pas de localStorage
    loadScene(0);
    renderScenesBar();
    _updateProjectTitle(''); // Pas de nom affiché
}

// ── Afficher/masquer le titre du projet courant ──────────────────────────
function _updateProjectTitle(name) {
    const el = document.getElementById('current-project-name');
    if (el) el.textContent = name ? '📁 ' + name : '';
    const label = document.getElementById('scenes-menu-project-label');
    if (label) label.textContent = 'Tableaux de ce projet';
    const rubriquelabel = document.getElementById('sub-fichier-tableaux-label');
    if (rubriquelabel) rubriquelabel.textContent = name ? `🗂️ Projet "${name}"` : '🗂️ Projet';
}

// ── Charger le nom du projet courant au démarrage ────────────────────────
async function initCurrentProjectName() {
    const id = getCurrentProjectId();
    if (!id) return;
    try {
        const p = await dbGet(id);
        if (p) _updateProjectTitle(p.name);
    } catch(e) {}
}

// =========================================================================
// MODALE BIBLIOTHÈQUE DE PROJETS

// ── Palette thème (suit body.menu-light comme le menu principal) ──────────
function _projTheme() {
    const light = document.body.classList.contains('menu-light');
    return {
        light,
        overlayBg:        light ? 'rgba(0,0,0,0.35)'    : 'rgba(0,0,0,0.7)',
        modalBg:          light ? '#f0f2f5'              : '#111',
        modalBorder:      light ? '#ccc'                 : '#2e2e3a',
        titleColor:       light ? '#1a1a2e'              : '#fff',
        closeColor:       light ? '#666'                 : '#888',
        sectionLabel:     light ? '#555'                 : '#888',
        emptyColor:       light ? '#aaa'                 : '#555',
        sepColor:         light ? '#ccc'                 : '#2e2e38',
        exportBtnBg:      light ? '#e8f5ed'              : '#1a3520',
        exportBtnColor:   light ? '#2a7a42'              : '#6dbf7e',
        exportBtnBorder:  light ? '#b0d8bc'              : '#2a4a30',
        draftBg:          light ? '#fffbea'              : '#2a2a1a',
        draftBorder:      light ? '#e8d87a'              : '#5a5020',
        draftTitle:       light ? '#7a6000'              : '#f0c040',
        draftSub:         light ? '#888'                 : '#888',
        draftBtnBg:       light ? '#fff3c0'              : '#4a3a00',
        draftBtnColor:    light ? '#7a6000'              : '#f0c040',
        draftBtnBorder:   light ? '#c8a800'              : '#6a5a10',
        cardBgNormal:     light ? '#ffffff'              : '#1a1a1a',
        cardBgActive:     light ? '#ddeeff'              : '#1a3550',
        cardBorderNorm:   light ? '#d0d4da'              : '#2e2e38',
        cardBorderAct:    light ? '#4a90e2'              : '#4a90e2',
        cardNameNorm:     light ? '#1a1a2e'              : '#ddd',
        cardNameAct:      light ? '#1a5a9a'              : '#7ab8f5',
        cardMeta:         light ? '#777'                 : '#666',
        accordionBgNorm:  light ? '#f5f5f5'              : '#222229',
        accordionBgAct:   light ? '#e8f0fb'              : '#122538',
        accordionBorderN: light ? '#ddd'                 : '#2e2e38',
        accordionBorderA: light ? '#b8d0ea'              : '#2a4a6a',
        btnRenameBg:      light ? '#e4e6ea'              : '#2a2a36',
        btnRenameColor:   light ? '#555'                 : '#aaa',
        btnRenameBorder:  light ? '#bbb'                 : '#444',
        btnDeleteBg:      light ? '#fde8e8'              : '#2a1a1a',
        btnDeleteBorder:  light ? '#e8a0a0'              : '#3d2020',
        btnOpenBg:        light ? '#ddeeff'              : '#1a3550',
        btnOpenColor:     light ? '#1a5a9a'              : '#7ab8f5',
        btnOpenBorder:    light ? '#a0c8e8'              : '#2a4a6a',
        btnOpenHoverBg:   light ? '#c8e0f8'              : '#1e3d5e',
        favBtnBgOn:       light ? '#fffacc'              : '#2a2a10',
        favBtnColorOn:    light ? '#b08000'              : '#f0c040',
        favBtnBorderOn:   light ? '#d4a800'              : '#5a5020',
        favBtnBgOff:      light ? '#f0f2f5'              : '#1a1a1a',
        favBtnColorOff:   light ? '#aaa'                 : '#555',
        favBtnBorderOff:  light ? '#ccc'                 : '#3a3a4a',
        sceneColorAct:    light ? '#1a5a9a'              : '#7ab8f5',
        sceneColorNorm:   light ? '#777'                 : '#aaa',
        sceneBgAct:       light ? 'rgba(74,144,226,0.1)' : '#1a3550',
        sceneHoverBg:     light ? 'rgba(74,144,226,0.08)': '#2e2e3e',
        sceneIconAct:     '#4a90e2',
        sceneIconNorm:    light ? '#bbb'                 : '#444',
        arrowColor:       light ? '#bbb'                 : '#555',
        favLabelColor:    light ? '#b08000'              : '#f0c040',
        allLabelColor:    light ? '#555'                 : '#888',
        scrollbarThumb:   light ? '#ccc'                 : '#444',
    };
}
// =========================================================================
async function openProjectsLibrary() {
    // Sauvegarder silencieusement pour que currentScene soit à jour dans la liste (sauf brouillon)
    if (!_isDraft) {
        const curId = getCurrentProjectId();
        if (curId) {
            try {
                const cur = await dbGet(curId);
                await saveProjectToDB(cur?.name || 'Sans titre');
            } catch(e) {}
        }
    }

    // Créer la modale si elle n'existe pas
    let overlay = document.getElementById('projects-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'projects-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;display:flex;align-items:center;justify-content:center;';
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeProjectsLibrary(); });
        document.body.appendChild(overlay);
    }
    const t = _projTheme();
    overlay.style.background = t.overlayBg;
    overlay.innerHTML = _buildLibraryHTML();
    overlay.style.display = 'flex';
    _renderProjectsList();
    refreshFavoritesMenu();

    // Fermeture avec Echap
    overlay._escHandler = (e) => { if (e.key === 'Escape') closeProjectsLibrary(); };
    document.addEventListener('keydown', overlay._escHandler);
}

function closeProjectsLibrary() {
    const overlay = document.getElementById('projects-overlay');
    if (!overlay) return;
    overlay.style.display = 'none';
    if (overlay._escHandler) document.removeEventListener('keydown', overlay._escHandler);
}

function _buildLibraryHTML() {
    const t = _projTheme();

    const draftBanner = _isDraft ? `
        <div style="background:${t.draftBg};border:1px solid ${t.draftBorder};border-radius:10px;padding:12px 16px;display:flex;align-items:center;gap:12px;">
            <span style="font-size:20px;">📝</span>
            <div style="flex:1;min-width:0;">
                <div style="font-size:13px;font-weight:700;color:${t.draftTitle};">Brouillon en cours</div>
                <div style="font-size:11px;color:${t.draftSub};margin-top:2px;">Non sauvegardé · Sera perdu si vous ouvrez un autre projet</div>
            </div>
            <button onclick="_projSaveDraft()" style="background:${t.draftBtnBg};color:${t.draftBtnColor};border:1px solid ${t.draftBtnBorder};border-radius:8px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">💾 Enregistrer</button>
        </div>` : '';

    return `
    <div style="background:${t.modalBg};border-radius:18px;padding:28px 32px;width:580px;max-width:95vw;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;gap:16px;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid ${t.modalBorder};">

        <!-- En-tête -->
        <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="font-size:18px;font-weight:800;color:${t.titleColor};">📁 Mes projets</div>
            <button onclick="closeProjectsLibrary()" style="background:none;border:none;color:${t.closeColor};font-size:20px;cursor:pointer;padding:4px 8px;border-radius:6px;" title="Fermer">×</button>
        </div>

        ${draftBanner}

        <!-- Boutons sauvegarde globale -->
        <div style="display:flex;gap:8px;">
            <button id="proj-export-all-btn" onclick="exportAllProjects()" style="flex:1;background:${t.exportBtnBg};color:${t.exportBtnColor};border:1px solid ${t.exportBtnBorder};border-radius:10px;padding:5px;font-size:12px;font-weight:600;cursor:pointer;" title="Exporter tous les projets en un seul fichier de sauvegarde"><span style=font-size:18px;>📤</span>Tout exporter<br><span style=font-size:9px;>Exporter tous les projets en un seul fichier de sauvegarde</span></button>
            <button onclick="importAllProjects()" style="flex:1;background:${t.exportBtnBg};color:${t.exportBtnColor};border:1px solid ${t.exportBtnBorder};border-radius:10px;padding:5px;font-size:12px;font-weight:600;cursor:pointer;" title="Restaurer tous les projets depuis une sauvegarde complète"><span style=font-size:18px;>📥</span>Tout importer<br><span style=font-size:9px;>Restaurer tous les projets depuis une sauvegarde complète</span></button>
        </div>

        <!-- Liste des projets -->
        <div style="font-size:11px;color:${t.sectionLabel};font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-top:4px;">Projets sauvegardés</div>
        <div id="projects-list" style="flex:1;overflow-y:scroll;display:flex;flex-direction:column;gap:6px;min-height:80px;max-height:45vh;padding-right:4px;">
            <div style="color:${t.emptyColor};font-size:13px;text-align:center;padding:20px;">Chargement...</div>
        </div>
    </div>`;
}

async function _renderProjectsList() {
    const list = document.getElementById('projects-list');
    if (!list) return;
    const t = _projTheme();

    let projects;
    try { projects = await dbGetAll(); }
    catch(e) { list.innerHTML = `<div style="color:#f66;text-align:center;padding:20px;">Erreur de chargement</div>`; return; }

    if (!projects.length) {
        list.innerHTML = `<div style="color:${t.emptyColor};font-size:13px;text-align:center;padding:20px;">Aucun projet sauvegardé</div>`;
        return;
    }

    list.innerHTML = '';

    // ── Section favoris ──
    const favIds = _getFavoriteIds();
    const favProjects = favIds.map(id => projects.find(p => p.id === id)).filter(Boolean);
    if (favProjects.length) {
        const favLabel = document.createElement('div');
        favLabel.style.cssText = `font-size:11px;color:${t.favLabelColor};font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:2px 2px 4px;`;
        favLabel.textContent = '⭐ Favoris';
        list.appendChild(favLabel);
        favProjects.forEach(p => _buildProjectRow(p, list, projects));
        const sep = document.createElement('div');
        sep.style.cssText = `height:1px;background:${t.sepColor};margin:6px 0;`;
        list.appendChild(sep);
        const allLabel = document.createElement('div');
        allLabel.style.cssText = `font-size:11px;color:${t.allLabelColor};font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:2px 2px 4px;`;
        allLabel.textContent = '📁 Tous les projets';
        list.appendChild(allLabel);
    }

    projects.forEach(p => _buildProjectRow(p, list, projects));
}

function _buildProjectRow(p, list, allProjects) {
        const t = _projTheme();
        const isCurrent = p.id === getCurrentProjectId();
        const date = new Date(p.updatedAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
        const sceneList = p.scenes || [];
        const sceneCount = sceneList.length;

        // Conteneur global du projet (header + accordion)
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `border-radius:10px;border:1px solid ${isCurrent ? t.cardBorderAct : t.cardBorderNorm};background:${isCurrent ? t.cardBgActive : t.cardBgNormal};transition:border-color .15s;`;

        // ── Header du projet ──
        const row = document.createElement('div');
        row.style.cssText = `display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:pointer;`;

        // Flèche accordion
        const arrow = document.createElement('span');
        arrow.textContent = '▶';
        arrow.style.cssText = `font-size:9px;color:${t.arrowColor};transition:transform .2s;flex-shrink:0;user-select:none;`;

        // Infos projet
        const info = document.createElement('div');
        info.style.cssText = `flex:1;min-width:0;`;
        info.innerHTML = `
            <div style="font-size:13px;font-weight:700;color:${isCurrent ? t.cardNameAct : t.cardNameNorm};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${_escHtml(p.name)}
            </div>
            <div style="font-size:10px;color:${t.cardMeta};margin-top:2px;">${sceneCount} tableau${sceneCount > 1 ? 'x' : ''} · ${date}</div>
        `;

        // Boutons actions
        const btnRename = document.createElement('button');
        btnRename.textContent = '✏️';
        btnRename.title = 'Renommer';
        btnRename.style.cssText = `background:${t.btnRenameBg};color:${t.btnRenameColor};border:1px solid ${t.btnRenameBorder};border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:12px;flex-shrink:0;`;
        btnRename.addEventListener('click', (e) => { e.stopPropagation(); _projRename(p.id, p.name); });

        const btnDelete = document.createElement('button');
        btnDelete.textContent = '×';
        btnDelete.title = 'Supprimer';
        btnDelete.style.cssText = `background:${t.btnDeleteBg};color:#ff6b6b;border:1px solid ${t.btnDeleteBorder};border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:14px;font-weight:700;flex-shrink:0;`;
        btnDelete.addEventListener('click', (e) => { e.stopPropagation(); _projDelete(p.id); });

        // Bouton favori ⭐
        const isFav = _isFavorite(p.id);
        const btnFav = document.createElement('button');
        btnFav.textContent = isFav ? '⭐' : '☆';
        btnFav.title = isFav ? 'Retirer des favoris' : 'Ajouter aux favoris';
        btnFav.style.cssText = `background:${isFav ? t.favBtnBgOn : t.favBtnBgOff};color:${isFav ? t.favBtnColorOn : t.favBtnColorOff};border:1px solid ${isFav ? t.favBtnBorderOn : t.favBtnBorderOff};border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:14px;flex-shrink:0;transition:all .15s;`;
        btnFav.addEventListener('click', (e) => {
            e.stopPropagation();
            _toggleFavorite(p.id);
            _renderProjectsList();
            refreshFavoritesMenu();
        });

        row.appendChild(arrow);
        row.appendChild(info);

        // Bouton "Ouvrir ce projet" dans le header (si pas courant)
        if (!isCurrent) {
            const btnOpen = document.createElement('button');
            btnOpen.textContent = '📂';
            btnOpen.title = 'Ouvrir ce projet';
            btnOpen.style.cssText = `background:${t.btnOpenBg};color:${t.btnOpenColor};border:1px solid ${t.btnOpenBorder};border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:13px;flex-shrink:0;`;
            btnOpen.onmouseover = () => btnOpen.style.background = t.btnOpenHoverBg;
            btnOpen.onmouseout  = () => btnOpen.style.background = t.btnOpenBg;
            btnOpen.addEventListener('click', (e) => { e.stopPropagation(); _projLoad(p.id); });
            row.appendChild(btnOpen);
        }

        row.appendChild(btnRename);
        row.appendChild(btnDelete);
        row.appendChild(btnFav);

        // ── Panneau accordion des scènes ──
        const accordion = document.createElement('div');
        accordion.style.cssText = `display:none;border-top:1px solid ${isCurrent ? t.accordionBorderA : t.accordionBorderN};background:${isCurrent ? t.accordionBgAct : t.accordionBgNorm};padding:6px 8px;border-radius:0 0 10px 10px;`;

        if (sceneList.length === 0) {
            accordion.innerHTML = `<div style="font-size:11px;color:${t.emptyColor};padding:6px 8px;">Aucun tableau</div>`;
        } else {
            sceneList.forEach((sc, idx) => {
                const isCurrentSceneOfCurrentProj = isCurrent && idx === p.currentScene;
                const scRow = document.createElement('div');
                scRow.style.cssText = `display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:7px;font-size:11px;
                    color:${isCurrentSceneOfCurrentProj ? t.sceneColorAct : t.sceneColorNorm};
                    background:${isCurrentSceneOfCurrentProj ? t.sceneBgAct : 'transparent'};
                    font-weight:${isCurrentSceneOfCurrentProj ? '700' : '400'};
                    cursor:${isCurrentSceneOfCurrentProj ? 'default' : 'pointer'};
                    transition:background .15s,color .15s;`;

                const icon = document.createElement('span');
                icon.textContent = isCurrentSceneOfCurrentProj ? '▶' : '○';
                icon.style.cssText = `font-size:8px;flex-shrink:0;color:${isCurrentSceneOfCurrentProj ? t.sceneIconAct : t.sceneIconNorm};transition:color .15s;`;

                const label = document.createElement('span');
                label.textContent = sc.name || `Tableau ${idx + 1}`;
                label.style.cssText = `flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;

                // Bouton renommer le tableau
                const btnRenameScene = document.createElement('button');
                btnRenameScene.textContent = '✏️';
                btnRenameScene.title = 'Renommer ce tableau';
                btnRenameScene.style.cssText = `background:${t.btnRenameBg};color:${t.btnRenameColor};border:1px solid ${t.btnRenameBorder};border-radius:5px;width:22px;height:22px;cursor:pointer;font-size:10px;flex-shrink:0;opacity:0;transition:opacity .15s;padding:0;`;
                btnRenameScene.addEventListener('click', (e) => {
                    e.stopPropagation();
                    _projRenameScene(p.id, idx, sc.name || `Tableau ${idx + 1}`);
                });

                if (!isCurrentSceneOfCurrentProj) {
                    scRow.addEventListener('mouseenter', () => {
                        scRow.style.background = t.sceneHoverBg;
                        scRow.style.color = t.cardNameNorm;
                        icon.style.color = t.sceneIconAct;
                        icon.textContent = '▶';
                        btnRenameScene.style.opacity = '1';
                    });
                    scRow.addEventListener('mouseleave', () => {
                        scRow.style.background = 'transparent';
                        scRow.style.color = t.sceneColorNorm;
                        icon.style.color = t.sceneIconNorm;
                        icon.textContent = '○';
                        btnRenameScene.style.opacity = '0';
                    });
                    scRow.addEventListener('click', () => _projLoadAtScene(p.id, idx));
                } else {
                    // Pour le tableau courant, on affiche le bouton renommer en permanence
                    btnRenameScene.style.opacity = '0.6';
                    scRow.addEventListener('mouseenter', () => btnRenameScene.style.opacity = '1');
                    scRow.addEventListener('mouseleave', () => btnRenameScene.style.opacity = '0.6');
                }

                scRow.appendChild(icon);
                scRow.appendChild(label);
                scRow.appendChild(btnRenameScene);
                accordion.appendChild(scRow);
            });
        }

        // ── Toggle accordion ──
        let open = false;
        const toggleAccordion = () => {
            open = !open;
            accordion.style.display = open ? 'block' : 'none';
            arrow.style.transform = open ? 'rotate(90deg)' : 'rotate(0deg)';
            arrow.style.color = open ? '#4a90e2' : t.arrowColor;
        };

        row.addEventListener('click', (e) => {
            if (e.target === btnRename || e.target === btnDelete) return;
            toggleAccordion();
        });

        if (!isCurrent) {
            row.title = 'Cliquer pour voir les tableaux · Double-cliquer pour ouvrir';
            row.addEventListener('dblclick', (e) => {
                if (e.target === btnRename || e.target === btnDelete) return;
                _projLoad(p.id);
            });
            row.onmouseover = () => wrapper.style.borderColor = '#4a90e2';
            row.onmouseout  = () => { if (!open) wrapper.style.borderColor = t.cardBorderNorm; };
        } else {
            open = true;
            accordion.style.display = 'block';
            arrow.style.transform = 'rotate(90deg)';
            arrow.style.color = '#4a90e2';
        }

        wrapper.appendChild(row);
        wrapper.appendChild(accordion);
        list.appendChild(wrapper);
}

function _escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Rafraîchir le sous-menu Favoris dans le menu principal ────────────────
async function refreshFavoritesMenu() {
    const container = document.getElementById('sub-favorites-list');
    if (!container) return;
    const favIds = _getFavoriteIds();
    if (!favIds.length) {
        container.innerHTML = '<div style="color:#555;font-size:12px;padding:6px 12px;font-style:italic;">Aucun favori</div>';
        return;
    }
    let projects;
    try { projects = await dbGetAll(); } catch(e) { return; }
    container.innerHTML = '';
    favIds.forEach(id => {
        const p = projects.find(pr => pr.id === id);
        if (!p) return;
        const item = document.createElement('div');
        item.className = 'mm-sub-item';
        item.innerHTML = `<span class="mm-ico">⭐</span>&nbsp;&nbsp;${_escHtml(p.name)}`;
        item.addEventListener('click', () => { _projLoad(p.id); closeMainMenu(); });
        container.appendChild(item);
    });
}

// ── Actions de la bibliothèque ────────────────────────────────────────────

async function saveCurrentProject() {
    // Si brouillon, demander un nom avant de persister
    if (_isDraft) {
        await _projSaveDraft();
        return;
    }
    const input = document.getElementById('proj-current-name');
    const name  = (input?.value || '').trim() || 'Sans titre';
    await saveProjectToDB(name);
    _updateProjectTitle(name);
    _renderProjectsList();
    // Feedback visuel
    const btn = document.querySelector('#projects-overlay button[onclick="saveCurrentProject()"]');
    if (btn) { const orig = btn.textContent; btn.textContent = '✅ Enregistré !'; setTimeout(() => btn.textContent = orig, 1500); }
}

// ── Enregistrer un brouillon pour la première fois ────────────────────────
async function _projSaveDraft() {
    const name = prompt('Donner un nom à ce projet :', 'Nouveau projet');
    if (name === null) return;
    const finalName = name.trim() || 'Nouveau projet';
    // Maintenant on sort du mode brouillon et on crée l'entrée DB
    _isDraft = false;
    const newId = 'proj_' + Date.now();
    localStorage.setItem('currentProjectId', newId);
    saveCurrentSceneData(); // maintenant saveScenesMeta va écrire en localStorage
    await dbPut({ id: newId, name: finalName, scenes, currentScene, updatedAt: Date.now() });
    _updateProjectTitle(finalName);
    // Rafraîchir la modale si ouverte
    const overlay = document.getElementById('projects-overlay');
    if (overlay && overlay.style.display !== 'none') {
        overlay.innerHTML = _buildLibraryHTML();
        _renderProjectsList();
        document.addEventListener('keydown', overlay._escHandler);
    }
}

async function _projLoad(id) {
    // Sauvegarder silencieusement le projet courant (sauf si brouillon)
    if (!_isDraft) {
        const curId = getCurrentProjectId();
        if (curId) {
            try {
                const cur = await dbGet(curId);
                await saveProjectToDB(cur?.name || 'Sans titre');
            } catch(e) {}
        }
    }
    _isDraft = false; // On quitte le brouillon
    const project = await loadProjectFromDB(id);
    if (project) {
        _updateProjectTitle(project.name);
        closeProjectsLibrary();
        if (typeof refreshProjectsPanel === 'function') refreshProjectsPanel();
    }
}

async function _projLoadAtScene(id, sceneIndex) {
    // Sauvegarder silencieusement le projet courant (sauf si brouillon)
    if (!_isDraft) {
        const curId = getCurrentProjectId();
        if (curId) {
            try {
                const cur = await dbGet(curId);
                await saveProjectToDB(cur?.name || 'Sans titre');
            } catch(e) {}
        }
    }
    _isDraft = false; // On quitte le brouillon
    const project = await loadProjectFromDB(id, sceneIndex);
    if (project) {
        _updateProjectTitle(project.name);
        closeProjectsLibrary();
        if (typeof refreshProjectsPanel === 'function') refreshProjectsPanel();
    }
}


async function _projNewProject() {
    const name = prompt('Nom du nouveau projet :', 'Nouveau projet');
    if (name === null) return;
    await newProject(name.trim() || 'Nouveau projet');
    _updateProjectTitle(name.trim() || 'Nouveau projet');
    closeProjectsLibrary();
}

async function _projRename(id, currentName) {
    const newName = prompt('Renommer le projet :', currentName);
    if (newName === null || !newName.trim()) return;
    const p = await dbGet(id);
    if (!p) return;
    p.name = newName.trim();
    await dbPut(p);
    if (id === getCurrentProjectId()) _updateProjectTitle(p.name);
    _renderProjectsList();
}

async function _projRenameScene(projectId, sceneIndex, currentName) {
    const newName = prompt('Renommer le tableau :', currentName);
    if (newName === null || !newName.trim()) return;
    const p = await dbGet(projectId);
    if (!p || !p.scenes || sceneIndex >= p.scenes.length) return;
    p.scenes[sceneIndex].name = newName.trim();
    p.updatedAt = Date.now();
    await dbPut(p);
    // Si c'est le projet courant, mettre à jour la variable globale scenes et la barre
    if (projectId === getCurrentProjectId()) {
        scenes[sceneIndex].name = newName.trim();
        if (typeof renderScenesBar === 'function') renderScenesBar();
    }
    _renderProjectsList();
}

async function _projDelete(id) {
    const p = await dbGet(id);
    if (!p) return;
    if (!confirm(`Supprimer le projet "${p.name}" ?`)) return;
    await dbDelete(id);
    if (id === getCurrentProjectId()) {
        setCurrentProjectId(null);
        _updateProjectTitle('');
    }
    _renderProjectsList();
}

function exportCurrentProject() {
    saveCurrentSceneData();
    const exportData = {
        scenes, currentScene,
        ...JSON.parse(scenes[currentScene]?.config || '{}')
    };
    const name = document.getElementById('proj-current-name')?.value || 'projet';
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData));
    a.download = `lebureauduprof_${name.replace(/\s+/g,'-')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a); a.click(); a.remove();
}

// ── Export ALL : tous les projets en un seul fichier ─────────────────────
async function exportAllProjects() {
    const curId = getCurrentProjectId();
    if (curId) {
        try { const cur = await dbGet(curId); await saveProjectToDB(cur?.name || 'Sans titre'); } catch(e) {}
    }
    const allProjects = await dbGetAll();
    if (!allProjects.length) { alert('Aucun projet à exporter.'); return; }
    const exportData = {
        _type: 'prof-bureau-all-projects',
        _version: 1,
        exportedAt: Date.now(),
        currentProjectId: getCurrentProjectId(),
        projects: allProjects
    };
    const date = new Date().toISOString().split('T')[0];
    const a = document.createElement('a');
    a.href = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData));
    a.download = `lebureauduprof_TOUS-LES-PROJETS_${date}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    const btn = document.getElementById('proj-export-all-btn');
    if (btn) { const orig = btn.textContent; btn.textContent = '✅ Exporté !'; setTimeout(() => btn.textContent = orig, 2000); }
}

// ── Import ALL : restaurer tous les projets depuis un fichier complet ─────
function importAllProjects() {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json';
    input.onchange = async (e) => {
        const file = e.target.files[0]; if (!file) return;
        const text = await file.text();
        try {
            const data = JSON.parse(text);
            if (data._type !== 'prof-bureau-all-projects' || !Array.isArray(data.projects)) {
                alert('Ce fichier ne contient pas une sauvegarde complète.\n\nPour importer un seul projet, utilisez "Importer JSON" dans le menu Fichier.');
                return;
            }
            const count = data.projects.length;
            if (!confirm(`Ce fichier contient ${count} projet${count > 1 ? 's' : ''}.\n\nAttention : cela va remplacer tous vos projets actuels.\n\nContinuer ?`)) return;
            const db = await dbOpen();
            await new Promise((resolve, reject) => {
                const tx = db.transaction(STORE_NAME, 'readwrite');
                const req = tx.objectStore(STORE_NAME).clear();
                req.onsuccess = resolve; req.onerror = reject;
            });
            for (const p of data.projects) await dbPut(p);
            const restoredCurId = data.currentProjectId || data.projects[0]?.id;
            if (restoredCurId) {
                const project = await loadProjectFromDB(restoredCurId);
                if (project) _updateProjectTitle(project.name);
            }
            _renderProjectsList();
            alert(`✅ ${count} projet${count > 1 ? 's' : ''} restauré${count > 1 ? 's' : ''} avec succès !`);
        } catch(err) {
            alert('Erreur lors de l\'importation : ' + err.message);
        }
    };
    input.click();
}

// ── Scrollbar discrète pour la liste ─────────────────────────────────────
(function() {
    const s = document.createElement('style');
    s.id = 'projects-scrollbar-style';
    s.textContent = `
        #projects-list::-webkit-scrollbar { width: 5px; }
        #projects-list::-webkit-scrollbar-track { background: transparent; }
        #projects-list::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
        body.menu-light #projects-list::-webkit-scrollbar-thumb { background: #ccc; }
        #proj-current-name:focus { border-color: #4a90e2 !important; }
    `;
    document.head.appendChild(s);
})();
