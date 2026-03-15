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

// ── ID du projet courant (stocké en localStorage) ────────────────────────
function getCurrentProjectId() {
    return localStorage.getItem('currentProjectId') || null;
}
function setCurrentProjectId(id) {
    if (id) localStorage.setItem('currentProjectId', id);
    else    localStorage.removeItem('currentProjectId');
}

// ── Sauvegarder le projet courant en DB ──────────────────────────────────
async function saveProjectToDB(name) {
    saveCurrentSceneData();
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

// ── Afficher/masquer le titre du projet courant ──────────────────────────
function _updateProjectTitle(name) {
    const el = document.getElementById('current-project-name');
    if (el) el.textContent = name ? '📁 ' + name : '';
    const label = document.getElementById('scenes-menu-project-label');
    if (label) label.textContent = name ? `Tableaux du projet "${name}"` : 'Tableaux du projet en cours';
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
// =========================================================================
async function openProjectsLibrary() {
    // Sauvegarder silencieusement pour que currentScene soit à jour dans la liste
    const curId = getCurrentProjectId();
    if (curId) {
        try {
            const cur = await dbGet(curId);
            await saveProjectToDB(cur?.name || 'Sans titre');
        } catch(e) {}
    }

    // Créer la modale si elle n'existe pas
    let overlay = document.getElementById('projects-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'projects-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);z-index:99999;display:flex;align-items:center;justify-content:center;';
        overlay.addEventListener('click', (e) => { if (e.target === overlay) closeProjectsLibrary(); });
        document.body.appendChild(overlay);
    }
    overlay.innerHTML = _buildLibraryHTML();
    overlay.style.display = 'flex';
    _renderProjectsList();

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
    return `
    <div style="background:#1e1e26;border-radius:18px;padding:28px 32px;width:580px;max-width:95vw;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;gap:16px;box-shadow:0 20px 60px rgba(0,0,0,0.5);border:1px solid #2e2e3e;">

        <!-- En-tête -->
        <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="font-size:18px;font-weight:800;color:#fff;">📁 Mes projets</div>
            <button onclick="closeProjectsLibrary()" style="background:none;border:none;color:#888;font-size:20px;cursor:pointer;padding:4px 8px;border-radius:6px;" title="Fermer">×</button>
        </div>

        <!-- Boutons sauvegarde globale -->
        <div style="display:flex;gap:8px;">
            <button id="proj-export-all-btn" onclick="exportAllProjects()" style="flex:1;background:#1a3520;color:#6dbf7e;border:1px solid #2a4a30;border-radius:10px;padding:9px;font-size:12px;font-weight:600;cursor:pointer;" title="Exporter tous vos projets en un seul fichier de sauvegarde">🗂️ Tout exporter</button>
            <button onclick="importAllProjects()" style="flex:1;background:#1a3520;color:#6dbf7e;border:1px solid #2a4a30;border-radius:10px;padding:9px;font-size:12px;font-weight:600;cursor:pointer;" title="Restaurer tous vos projets depuis une sauvegarde complète">📥 Tout importer</button>
        </div>

        <!-- Liste des projets -->
        <div style="font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.5px;margin-top:4px;">Projets sauvegardés</div>
        <div id="projects-list" style="flex:1;overflow-y:scroll;display:flex;flex-direction:column;gap:6px;min-height:80px;max-height:45vh;padding-right:4px;">
            <div style="color:#555;font-size:13px;text-align:center;padding:20px;">Chargement...</div>
        </div>
    </div>`;
}

async function _renderProjectsList() {
    const list = document.getElementById('projects-list');
    if (!list) return;

    let projects;
    try { projects = await dbGetAll(); }
    catch(e) { list.innerHTML = '<div style="color:#f66;text-align:center;padding:20px;">Erreur de chargement</div>'; return; }

    if (!projects.length) {
        list.innerHTML = '<div style="color:#555;font-size:13px;text-align:center;padding:20px;">Aucun projet sauvegardé</div>';
        return;
    }

    list.innerHTML = '';
    projects.forEach(p => {
        const isCurrent = p.id === getCurrentProjectId();
        const date = new Date(p.updatedAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
        const sceneList = p.scenes || [];
        const sceneCount = sceneList.length;

        // Conteneur global du projet (header + accordion)
        const wrapper = document.createElement('div');
        wrapper.style.cssText = `border-radius:10px;border:1px solid ${isCurrent ? '#4a90e2' : '#2e2e38'};background:${isCurrent ? '#1a3550' : '#28282f'};transition:border-color .15s;`;

        // ── Header du projet ──
        const row = document.createElement('div');
        row.style.cssText = `display:flex;align-items:center;gap:8px;padding:10px 12px;cursor:pointer;`;

        // Flèche accordion
        const arrow = document.createElement('span');
        arrow.textContent = '▶';
        arrow.style.cssText = `font-size:9px;color:#555;transition:transform .2s;flex-shrink:0;user-select:none;`;

        // Infos projet
        const info = document.createElement('div');
        info.style.cssText = `flex:1;min-width:0;`;
        info.innerHTML = `
            <div style="font-size:13px;font-weight:700;color:${isCurrent ? '#7ab8f5' : '#ddd'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                ${isCurrent ? '▶ ' : ''}${_escHtml(p.name)}
            </div>
            <div style="font-size:10px;color:#666;margin-top:2px;">${sceneCount} tableau${sceneCount > 1 ? 'x' : ''} · ${date}</div>
        `;

        // Boutons actions
        const btnRename = document.createElement('button');
        btnRename.textContent = '✏️';
        btnRename.title = 'Renommer';
        btnRename.style.cssText = 'background:#35353f;color:#aaa;border:1px solid #444;border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:12px;flex-shrink:0;';
        btnRename.addEventListener('click', (e) => { e.stopPropagation(); _projRename(p.id, p.name); });

        const btnDelete = document.createElement('button');
        btnDelete.textContent = '×';
        btnDelete.title = 'Supprimer';
        btnDelete.style.cssText = 'background:#2a1a1a;color:#ff6b6b;border:1px solid #3d2020;border-radius:7px;width:28px;height:28px;cursor:pointer;font-size:14px;font-weight:700;flex-shrink:0;';
        btnDelete.addEventListener('click', (e) => { e.stopPropagation(); _projDelete(p.id); });

        row.appendChild(arrow);
        row.appendChild(info);
        row.appendChild(btnRename);
        row.appendChild(btnDelete);

        // ── Panneau accordion des scènes ──
        const accordion = document.createElement('div');
        accordion.style.cssText = `display:none;border-top:1px solid ${isCurrent ? '#2a4a6a' : '#2e2e38'};background:${isCurrent ? '#122538' : '#222229'};padding:6px 8px;border-radius:0 0 10px 10px;`;

        if (sceneList.length === 0) {
            accordion.innerHTML = `<div style="font-size:11px;color:#555;padding:6px 8px;">Aucun tableau</div>`;
        } else {
            sceneList.forEach((sc, idx) => {
                const isCurrentSceneOfCurrentProj = isCurrent && idx === p.currentScene;
                const scRow = document.createElement('div');
                scRow.style.cssText = `display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:7px;font-size:11px;
                    color:${isCurrentSceneOfCurrentProj ? '#7ab8f5' : '#aaa'};
                    background:${isCurrentSceneOfCurrentProj ? '#1a3550' : 'transparent'};
                    font-weight:${isCurrentSceneOfCurrentProj ? '700' : '400'};
                    cursor:${isCurrentSceneOfCurrentProj ? 'default' : 'pointer'};
                    transition:background .15s,color .15s;`;

                const icon = document.createElement('span');
                icon.textContent = isCurrentSceneOfCurrentProj ? '▶' : '○';
                icon.style.cssText = `font-size:8px;flex-shrink:0;color:${isCurrentSceneOfCurrentProj ? '#4a90e2' : '#444'};transition:color .15s;`;

                const label = document.createElement('span');
                label.textContent = sc.name || `Tableau ${idx + 1}`;
                label.style.cssText = `flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`;

                if (!isCurrentSceneOfCurrentProj) {
                    scRow.addEventListener('mouseenter', () => {
                        scRow.style.background = isCurrent ? '#1a3550' : '#2e2e3e';
                        scRow.style.color = '#fff';
                        icon.style.color = '#4a90e2';
                        icon.textContent = '▶';
                    });
                    scRow.addEventListener('mouseleave', () => {
                        scRow.style.background = 'transparent';
                        scRow.style.color = '#aaa';
                        icon.style.color = '#444';
                        icon.textContent = '○';
                    });
                    scRow.addEventListener('click', () => _projLoadAtScene(p.id, idx));
                }

                scRow.appendChild(icon);
                scRow.appendChild(label);
                accordion.appendChild(scRow);
            });
        }

        // ── Toggle accordion ──
        let open = false;
        const toggleAccordion = () => {
            open = !open;
            accordion.style.display = open ? 'block' : 'none';
            arrow.style.transform = open ? 'rotate(90deg)' : 'rotate(0deg)';
            arrow.style.color = open ? '#4a90e2' : '#555';
        };

        row.addEventListener('click', (e) => {
            // Clic sur les boutons → pas de toggle
            if (e.target === btnRename || e.target === btnDelete) return;
            toggleAccordion();
        });

        // Double-clic sur le header = charger le projet (si pas courant)
        if (!isCurrent) {
            row.title = 'Cliquer pour voir les tableaux · Double-cliquer pour ouvrir';
            row.addEventListener('dblclick', (e) => {
                if (e.target === btnRename || e.target === btnDelete) return;
                _projLoad(p.id);
            });
            row.onmouseover = () => wrapper.style.borderColor = '#4a90e2';
            row.onmouseout  = () => { if (!open) wrapper.style.borderColor = '#2e2e38'; };
        } else {
            // Projet courant : ouvrir l'accordion par défaut
            open = true;
            accordion.style.display = 'block';
            arrow.style.transform = 'rotate(90deg)';
            arrow.style.color = '#4a90e2';
        }

        // Bouton "Ouvrir ce projet" en bas de l'accordion (si pas courant)
        if (!isCurrent) {
            const openBtn = document.createElement('button');
            openBtn.textContent = '📂 Ouvrir ce projet';
            openBtn.style.cssText = `display:block;width:100%;margin-top:6px;padding:6px;background:#1a3550;color:#7ab8f5;border:1px solid #2a4a6a;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer;text-align:center;`;
            openBtn.onmouseover = () => openBtn.style.background = '#1e3d5e';
            openBtn.onmouseout  = () => openBtn.style.background = '#1a3550';
            openBtn.addEventListener('click', () => _projLoad(p.id));
            accordion.appendChild(openBtn);
        }

        wrapper.appendChild(row);
        wrapper.appendChild(accordion);
        list.appendChild(wrapper);
    });
}

function _escHtml(str) {
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Actions de la bibliothèque ────────────────────────────────────────────

async function saveCurrentProject() {
    const input = document.getElementById('proj-current-name');
    const name  = (input?.value || '').trim() || 'Sans titre';
    await saveProjectToDB(name);
    _updateProjectTitle(name);
    _renderProjectsList();
    // Feedback visuel
    const btn = document.querySelector('#projects-overlay button[onclick="saveCurrentProject()"]');
    if (btn) { const orig = btn.textContent; btn.textContent = '✅ Enregistré !'; setTimeout(() => btn.textContent = orig, 1500); }
}

async function _projLoad(id) {
    // Sauvegarder silencieusement le projet courant
    const curId = getCurrentProjectId();
    if (curId) {
        try {
            const cur = await dbGet(curId);
            await saveProjectToDB(cur?.name || 'Sans titre');
        } catch(e) {}
    }
    const project = await loadProjectFromDB(id);
    if (project) {
        _updateProjectTitle(project.name);
        closeProjectsLibrary();
    }
}

async function _projLoadAtScene(id, sceneIndex) {
    // Sauvegarder silencieusement le projet courant
    const curId = getCurrentProjectId();
    if (curId) {
        try {
            const cur = await dbGet(curId);
            await saveProjectToDB(cur?.name || 'Sans titre');
        } catch(e) {}
    }
    const project = await loadProjectFromDB(id, sceneIndex);
    if (project) {
        _updateProjectTitle(project.name);
        closeProjectsLibrary();
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
    s.textContent = `
        #projects-list::-webkit-scrollbar { width: 5px; }
        #projects-list::-webkit-scrollbar-track { background: transparent; }
        #projects-list::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
        #proj-current-name:focus { border-color: #4a90e2 !important; }
    `;
    document.head.appendChild(s);
})();
