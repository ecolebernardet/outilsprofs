	// =========================================================================
	// SCÈNES
	// =========================================================================
var MAX_SCENES = 10;
var scenes        = [];   // [{ id, name, config, background }]
var currentScene  = 0;    // index de la scène active

	function scenesInit() {
		const saved = localStorage.getItem('profScenes');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				scenes       = parsed.scenes       || [];
				currentScene = parsed.currentScene || 0;
				if (currentScene >= scenes.length) currentScene = 0;
			} catch(e) { scenes = []; }
		}
		// Migration : si pas de scènes mais un bureau existant → scène 1 = bureau actuel
		if (scenes.length === 0) {
			const existing = localStorage.getItem('profBoardConfig');
			const bg       = localStorage.getItem('boardBackground') || 'none';
			scenes.push({ id: Date.now(), name: 'Scène 1', config: existing || null, background: bg });
			currentScene = 0;
			saveScenesMeta();
		}
		renderScenesBar();
	}

	function saveScenesMeta() {
		localStorage.setItem('profScenes', JSON.stringify({ scenes, currentScene }));
	}

	function saveCurrentSceneData() {
		if (scenes.length === 0) return;
		scenes[currentScene].config     = buildBoardJSON();
		scenes[currentScene].background = localStorage.getItem('boardBackground') || 'none';
		saveScenesMeta();
	}

	function switchScene(index) {
		if (index === currentScene) return;
		saveCurrentSceneData();
		currentScene = index;
		loadScene(index);
		renderScenesBar();
		saveScenesMeta();
	}

	function loadScene(index) {
		const scene = scenes[index];
		// Vider le bureau
		document.querySelectorAll('.widget').forEach(w => w.remove());
		document.querySelectorAll('.shape-widget').forEach(w => w.remove());
		strokes = []; if (drawCtx) redrawStrokes();
		clearSelection();
		undoStack = []; redoStack = []; updateUndoRedoBtns();
		// Appliquer le fond
		const bg = scene.background || 'none';
		applyBackground(bg);
		localStorage.setItem('boardBackground', bg);
		// Charger le contenu
		if (scene.config) {
			localStorage.setItem('profBoardConfig', scene.config);
			_lastW = window.innerWidth;
			restoreBoardFromJSON(scene.config);
			// Réinitialiser l'historique avec cet état
			setTimeout(() => {
				const cur = buildBoardJSON();
				if (cur) { undoStack = [cur]; updateUndoRedoBtns(); }
			}, 600);
		} else {
			localStorage.removeItem('profBoardConfig');
		}
	}

	function addScene() {
		if (scenes.length >= MAX_SCENES) return;
		saveCurrentSceneData();
		const newName   = 'Scène ' + (scenes.length + 1);
		// Copie de la scène actuelle
		const newConfig = scenes[currentScene]?.config || null;
		const newBg     = scenes[currentScene]?.background || 'none';
		scenes.push({ id: Date.now(), name: newName, config: newConfig, background: newBg });
		currentScene = scenes.length - 1;
		loadScene(currentScene);
		renderScenesBar();
		saveScenesMeta();
		// Focus sur le nom pour le renommer tout de suite
		setTimeout(() => {
			const tabs = document.querySelectorAll('.scene-tab');
			const lastTab = tabs[tabs.length - 1];
			if (lastTab) {
				const nameEl = lastTab.querySelector('.scene-tab-name');
				if (nameEl) { nameEl.focus(); selectAllText(nameEl); }
			}
		}, 100);
	}

	function deleteScene(index, e) {
		e.stopPropagation();
		if (scenes.length <= 1) return;
		const ok = confirm(`Voulez-vous vraiment supprimer "${scenes[index].name}" ?`);
		if (!ok) return;
		scenes.splice(index, 1);
		if (currentScene >= scenes.length) currentScene = scenes.length - 1;
		else if (currentScene > index) currentScene--;
		loadScene(currentScene);
		renderScenesBar();
		saveScenesMeta();
	}

	function renameScene(index, newName) {
		const name = newName.trim() || ('Scène ' + (index + 1));
		scenes[index].name = name;
		saveScenesMeta();
	}

	// --- Drag-to-reorder scenes ---
var _sceneDragIdx = null;
var _sceneDragOverIdx = null;

	function _sceneDragStart(e, i) {
		_sceneDragIdx = i;
		e.dataTransfer.effectAllowed = 'move';
		e.dataTransfer.setData('text/plain', i);
		setTimeout(() => { if (e.target.closest('[data-scene-row]')) e.target.closest('[data-scene-row]').style.opacity = '0.4'; }, 0);
	}
	function _sceneDragEnd(e) {
		document.querySelectorAll('[data-scene-row]').forEach(r => { r.style.opacity = ''; r.style.borderTop = ''; r.style.borderBottom = ''; });
		_sceneDragIdx = null; _sceneDragOverIdx = null;
	}
	function _sceneDragOverHandler(e, i) {
		e.preventDefault();
		e.dataTransfer.dropEffect = 'move';
		document.querySelectorAll('[data-scene-row]').forEach(r => { r.style.borderTop = ''; r.style.borderBottom = ''; });
		const row = document.querySelector(`[data-scene-row="${i}"]`);
		if (row && _sceneDragIdx !== null && i !== _sceneDragIdx) {
			if (i < _sceneDragIdx) row.style.borderTop = '2px solid #4a90e2';
			else row.style.borderBottom = '2px solid #4a90e2';
		}
		_sceneDragOverIdx = i;
	}
	function _sceneDrop(e, i) {
		e.preventDefault();
		if (_sceneDragIdx === null || _sceneDragIdx === i) return;
		saveCurrentSceneData();
		const dragged = scenes.splice(_sceneDragIdx, 1)[0];
		const newIdx = i > _sceneDragIdx ? i - 1 : i;
		scenes.splice(newIdx, 0, dragged);
		// Ajuster currentScene
		if (currentScene === _sceneDragIdx) currentScene = newIdx;
		else if (_sceneDragIdx < currentScene && newIdx >= currentScene) currentScene--;
		else if (_sceneDragIdx > currentScene && newIdx <= currentScene) currentScene++;
		saveScenesMeta();
		renderScenesBar();
	}

	function renderScenesBar() {
		const list   = document.getElementById('scenes-menu-list');
		const addBtn = document.getElementById('scene-add-btn');
		if (!list) return;
		list.innerHTML = '';

		scenes.forEach((scene, i) => {
			const row = document.createElement('div');
			row.setAttribute('data-scene-row', i);
			row.style.cssText = 'display:flex;align-items:center;gap:5px;';
			row.draggable = true;
			row.addEventListener('dragstart', (e) => _sceneDragStart(e, i));
			row.addEventListener('dragend',   _sceneDragEnd);
			row.addEventListener('dragover',  (e) => _sceneDragOverHandler(e, i));
			row.addEventListener('drop',      (e) => _sceneDrop(e, i));

			// Poignée de réorganisation
			const grip = document.createElement('div');
			grip.title = 'Réorganiser';
			grip.textContent = '⠿';
			grip.style.cssText = 'color:#555;font-size:16px;cursor:grab;flex-shrink:0;width:18px;text-align:center;user-select:none;line-height:1;padding:4px 0;transition:color .15s;';
			grip.onmouseover = () => grip.style.color = '#4a90e2';
			grip.onmouseout  = () => grip.style.color = '#555';
			row.appendChild(grip);

			// Bouton principal
			const btn = document.createElement('button');
			const isActive = i === currentScene;
			btn.style.cssText = `
				flex:1;text-align:left;padding:8px 12px;border-radius:10px;
				border:1px solid ${isActive ? '#4a90e2' : '#2e2e38'};
				cursor:pointer;font-size:12px;font-weight:700;transition:background 0.15s;
				background:${isActive ? '#1a3550' : '#28282f'};
				color:${isActive ? '#7ab8f5' : '#aaa'};
				overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
			`;
			btn.textContent = (isActive ? '▶ ' : '') + scene.name;
			btn.title = scene.name;
			btn.addEventListener('click', () => { switchScene(i); toggleScenesMenu(); });
			row.appendChild(btn);

			// Bouton renommer ✏️
			const editBtn = document.createElement('button');
			editBtn.textContent = '✏️';
			editBtn.title = 'Renommer';
			editBtn.style.cssText = 'background:#28282f;color:#aaa;border:1px solid #2e2e38;border-radius:8px;width:28px;height:28px;cursor:pointer;font-size:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:background .15s;';
			editBtn.onmouseover = () => editBtn.style.background = '#35353f';
			editBtn.onmouseout  = () => editBtn.style.background = '#28282f';
			editBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				const newName = prompt('Renommer la scène :', scene.name);
				if (newName !== null) { renameScene(i, newName); renderScenesBar(); }
			});
			row.appendChild(editBtn);

			// Bouton supprimer ×
			if (scenes.length > 1) {
				const del = document.createElement('button');
				del.textContent = '×';
				del.title = 'Supprimer';
				del.style.cssText = 'background:#2a1a1a;color:#ff6b6b;border:1px solid #3d2020;border-radius:8px;width:28px;height:28px;cursor:pointer;font-size:15px;font-weight:700;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:background .15s;';
				del.onmouseover = () => del.style.background = '#3d1a1a';
				del.onmouseout  = () => del.style.background = '#2a1a1a';
				del.addEventListener('click', (e) => deleteScene(i, e));
				row.appendChild(del);
			}

			list.appendChild(row);
		});

		if (addBtn) {
			addBtn.disabled = scenes.length >= MAX_SCENES;
			addBtn.style.opacity = scenes.length >= MAX_SCENES ? '0.4' : '1';
			addBtn.style.cursor  = scenes.length >= MAX_SCENES ? 'not-allowed' : 'pointer';
		}

		// scenes-btn intégré dans le sous-menu Affichage — pas de mise à jour textContent nécessaire
	}
	
	function toggleScenesMenu() {
		// Le panneau scènes est désormais un sous-sous-menu CSS dans Affichage — pas d'action JS
	}

	// Fermer scènes au clic extérieur — géré par CSS hover

	function selectAllText(el) {
		const range = document.createRange();
		range.selectNodeContents(el);
		const sel = window.getSelection();
		sel.removeAllRanges(); sel.addRange(range);
	}

