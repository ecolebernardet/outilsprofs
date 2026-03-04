// =========================================================================
// GROUPEMENT DE WIDGETS
// =========================================================================
let groupCounter = 0;

function mergeWidgets() {
    const totalItems = selectedWidgets.length + selectedStrokes.length;
    if (totalItems < 2) return;
    snapshotNow();
    groupCounter++;
    const groupId = 'grp-' + Date.now() + '-' + groupCounter;
    selectedWidgets.forEach(w => {
        const existingGroup = w.dataset.groupId;
        if (existingGroup && existingGroup !== groupId) {
            document.querySelectorAll(`.widget[data-group-id="${existingGroup}"], .shape-widget[data-group-id="${existingGroup}"]`).forEach(m => {
                m.dataset.groupId = groupId;
            });
            strokes.filter(s => s.groupId === existingGroup).forEach(s => { s.groupId = groupId; });
        }
        w.dataset.groupId = groupId;
    });
    selectedStrokes.forEach(s => {
        const existingGroup = s.groupId;
        if (existingGroup && existingGroup !== groupId) {
            document.querySelectorAll(`.widget[data-group-id="${existingGroup}"], .shape-widget[data-group-id="${existingGroup}"]`).forEach(m => {
                m.dataset.groupId = groupId;
            });
            strokes.filter(st => st.groupId === existingGroup).forEach(st => { st.groupId = groupId; });
        }
        s.groupId = groupId;
    });
    updateSelectionOverlay();
    saveBoard();
}

function ungroupWidgets() {
    if (selectedWidgets.length === 0 && selectedStrokes.length === 0) return;
    snapshotNow();
    const groupIds = new Set([
        ...selectedWidgets.map(w => w.dataset.groupId),
        ...selectedStrokes.map(s => s.groupId)
    ].filter(Boolean));
    groupIds.forEach(gid => {
        document.querySelectorAll(`.widget[data-group-id="${gid}"], .shape-widget[data-group-id="${gid}"]`).forEach(w => {
            delete w.dataset.groupId;
        });
        strokes.filter(s => s.groupId === gid).forEach(s => { delete s.groupId; });
    });
    clearSelection();
    saveBoard();
}

function initSelectionControls() {
    document.getElementById('sc-move-btn').onmousedown = (e) => {
		e.preventDefault(); e.stopPropagation();
		snapshotNow();
		const pos = getBoardPos(e);
		moveStartX = pos.x; moveStartY = pos.y;
		widgetMoveOrigins = selectedWidgets.map(w => ({ widget: w, origLeft: w.offsetLeft, origTop: w.offsetTop }));
		strokeMoveOrigins = selectedStrokes.map(s => ({ stroke: s, origPoints: s.points.map(p => ({...p})) }));

		// Bloquer les iframes pendant le drag
		const overlays = [];
		document.querySelectorAll('.widget iframe, .widget embed').forEach(el => {
			const overlay = document.createElement('div');
			overlay.style.cssText = 'position:absolute;inset:0;z-index:9999;background:transparent;';
			el.parentElement.style.position = 'relative';
			el.parentElement.appendChild(overlay);
			overlays.push(overlay);
		});

		const onMoveEnd_patched = () => {
			document.removeEventListener('mousemove', onMoveMove);
			document.removeEventListener('mouseup', onMoveEnd_patched);
			overlays.forEach(o => o.remove());
			const curW = window.innerWidth, curVH = virtualH(curW);
			selectedWidgets.forEach(w => {
				w.dataset.leftPercent = (w.offsetLeft / curW) * 100;
				w.dataset.topPercent  = (w.offsetTop  / curVH) * 100;
			});
			saveBoard(); updateSelectionOverlay();
		};

		document.addEventListener('mousemove', onMoveMove);
		document.addEventListener('mouseup', onMoveEnd_patched);
	};
    document.getElementById('sc-rotate-btn').ondblclick = (e) => {
        e.preventDefault(); e.stopPropagation();
        snapshotNow();
        selectedWidgets.forEach(w => {
            if (w.dataset.preRotLeft !== undefined) {
                w.style.left      = w.dataset.preRotLeft;
                w.style.top       = w.dataset.preRotTop;
                w.style.transform = w.dataset.preRotTransform || '';
                delete w.dataset.preRotLeft;
                delete w.dataset.preRotTop;
                delete w.dataset.preRotTransform;
            } else {
                w.style.transform = '';
            }
        });
        hideRotationIndicator();
        saveBoard(); updateSelectionOverlay();
    };
    document.getElementById('sc-rotate-btn').onmousedown = (e) => {
        e.preventDefault(); e.stopPropagation();
        snapshotNow();
        selectedWidgets.forEach(w => {
            if (w.dataset.preRotLeft === undefined) {
                w.dataset.preRotLeft      = w.style.left;
                w.dataset.preRotTop       = w.style.top;
                w.dataset.preRotTransform = w.style.transform || '';
            }
        });
        const center = getSelectionCenter();
        rotateCenterX = center.x; rotateCenterY = center.y;
        const br = board.getBoundingClientRect();
        rotateStartAngle = Math.atan2(e.clientY - br.top - rotateCenterY, e.clientX - br.left - rotateCenterX);
        rotateOrigWidgetTransforms = selectedWidgets.map(w => ({ widget: w, origLeft: w.offsetLeft, origTop: w.offsetTop, origRot: getCurrentRotation(w) }));
        rotateOrigStrokePoints = selectedStrokes.map(s => ({ stroke: s, origPoints: s.points.map(p => ({...p})) }));
        const indicator = document.getElementById('rotation-indicator');
        const onMove = (ev) => {
            const br2 = board.getBoundingClientRect();
            const angle = Math.atan2(ev.clientY - br2.top - rotateCenterY, ev.clientX - br2.left - rotateCenterX);
            const delta = (angle - rotateStartAngle) * 180 / Math.PI;
            rotateOrigWidgetTransforms.forEach(({ widget, origLeft, origTop, origRot }) => {
                const cx2 = origLeft + widget.offsetWidth/2  - rotateCenterX;
                const cy2 = origTop  + widget.offsetHeight/2 - rotateCenterY;
                const rad = delta * Math.PI / 180;
                widget.style.left      = (rotateCenterX + cx2*Math.cos(rad) - cy2*Math.sin(rad) - widget.offsetWidth/2)  + 'px';
                widget.style.top       = (rotateCenterY + cx2*Math.sin(rad) + cy2*Math.cos(rad) - widget.offsetHeight/2) + 'px';
                widget.style.transform = `rotate(${snapRotation(origRot + delta)}deg)`;
            });
            rotateOrigStrokePoints.forEach(({ stroke, origPoints }) => {
                const rad = delta * Math.PI / 180;
                stroke.points = origPoints.map(p => ({
                    x: rotateCenterX + (p.x-rotateCenterX)*Math.cos(rad) - (p.y-rotateCenterY)*Math.sin(rad),
                    y: rotateCenterY + (p.x-rotateCenterX)*Math.sin(rad) + (p.y-rotateCenterY)*Math.cos(rad)
                }));
            });
            if (indicator && rotateOrigWidgetTransforms.length > 0) {
                const deg = Math.round(((snapRotation(rotateOrigWidgetTransforms[0].origRot + delta) % 360) + 360) % 360);
                document.getElementById('rot-deg').textContent = deg + '°';
                indicator.style.display = 'block';
                indicator.style.left = ev.clientX + 'px';
                indicator.style.top  = ev.clientY + 'px';
                indicator.querySelector('.rot-reset-hint').style.display = deg === 0 ? 'none' : 'inline';
            }
            if (drawCtx) redrawStrokes(); updateSelectionOverlay();
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            hideRotationIndicator();
            saveBoard(); updateSelectionOverlay();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };
    document.getElementById('sc-delete-btn').onclick = (e) => {
        e.stopPropagation();
        snapshotNow();
        selectedWidgets.forEach(w => { w.classList.remove('selected'); w.remove(); });
        selectedWidgets = [];
        strokes = strokes.filter(s => !selectedStrokes.includes(s));
        selectedStrokes = [];
        if (drawCtx) redrawStrokes();
        document.getElementById('selection-controls').style.display = 'none';
        saveBoard();
    };
    document.getElementById('sc-menu-btn').onclick = (e) => {
        e.stopPropagation();
        const menu = document.getElementById('sc-ctx-menu');
        const isOpen = menu.classList.contains('open');
        menu.classList.toggle('open', !isOpen);
        if (!isOpen) buildScCtxMenu(menu);
    };
    // Bouton verrou de l'overlay groupe
    const scLockBtn = document.getElementById('sc-lock-btn');
    if (scLockBtn) {
        scLockBtn.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
        scLockBtn.addEventListener('click', e => {
            e.stopPropagation();
            const locked = scLockBtn.classList.toggle('locked');
            scLockBtn.textContent = locked ? '🔒' : '🔓';
        });
    }
    // Boutons symétrie de l'overlay groupe
    const scFlipH = document.getElementById('sc-flip-h-btn');
    const scFlipV = document.getElementById('sc-flip-v-btn');
    if (scFlipH) {
        scFlipH.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
        scFlipH.addEventListener('click', e => {
            e.stopPropagation(); snapshotNow();
            selectedWidgets.forEach(w => flipWidget(w, 'h'));
            flipStrokes(selectedStrokes, 'h');
            saveBoard();
        });
    }
    if (scFlipV) {
        scFlipV.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
        scFlipV.addEventListener('click', e => {
            e.stopPropagation(); snapshotNow();
            selectedWidgets.forEach(w => flipWidget(w, 'v'));
            flipStrokes(selectedStrokes, 'v');
            saveBoard();
        });
    }

    document.getElementById('sc-resize-btn').onmousedown = (e) => {
        e.preventDefault(); e.stopPropagation();
        const totalSel = selectedWidgets.length + selectedStrokes.length;
        if (totalSel < 1) return;
        snapshotNow();
        const br = board.getBoundingClientRect();
        let bMinX=Infinity, bMinY=Infinity, bMaxX=-Infinity, bMaxY=-Infinity;
        selectedWidgets.forEach(w => {
            const r = w.getBoundingClientRect();
            const l = r.left - br.left, t = r.top - br.top;
            const rr = r.right - br.left, rb = r.bottom - br.top;
            if (l  < bMinX) bMinX = l;  if (t  < bMinY) bMinY = t;
            if (rr > bMaxX) bMaxX = rr; if (rb > bMaxY) bMaxY = rb;
        });
        selectedStrokes.forEach(s => s.points.forEach(p => {
            if (p.x < bMinX) bMinX = p.x; if (p.y < bMinY) bMinY = p.y;
            if (p.x > bMaxX) bMaxX = p.x; if (p.y > bMaxY) bMaxY = p.y;
        }));
        const origBoxW = bMaxX - bMinX, origBoxH = bMaxY - bMinY;
        if (origBoxW < 1 || origBoxH < 1) return;
        const boxRatio = origBoxH / origBoxW;
        const startClientX = e.clientX, startClientY = e.clientY;
        const widgetOrigins = selectedWidgets.map(w => {
            const r = w.getBoundingClientRect();
            const wL = r.left  - br.left, wT = r.top    - br.top;
            const c = w.querySelector('.editor-container');
            const svg = w.querySelector('svg');
            return {
                widget: w,
                relL: (wL - bMinX) / origBoxW,
                relT: (wT - bMinY) / origBoxH,
                container: c,
                origCW: c   ? c.offsetWidth  : 0,
                origCH: c   ? c.offsetHeight : 0,
                svg: svg,
                origSW: svg ? parseFloat(svg.getAttribute('width')  || svg.getBoundingClientRect().width)  : 0,
                origSH: svg ? parseFloat(svg.getAttribute('height') || svg.getBoundingClientRect().height) : 0,
            };
        });
        const strokeOrigins = selectedStrokes.map(s => ({
            stroke: s,
            origPoints: s.points.map(p => ({ x: p.x, y: p.y }))
        }));
        const onMove = (ev) => {
            const proportional = ev.shiftKey || (scLockBtn && scLockBtn.classList.contains('locked'));
            const newBoxW = Math.max(20, origBoxW + ev.clientX - startClientX);
            const newBoxH = proportional ? Math.max(20, newBoxW * boxRatio)
                                         : Math.max(20, origBoxH + ev.clientY - startClientY);
            const scaleX = newBoxW / origBoxW, scaleY = newBoxH / origBoxH;
            widgetOrigins.forEach(({ widget, relL, relT, container, origCW, origCH, svg, origSW, origSH }) => {
                widget.style.left = (bMinX + relL * newBoxW) + 'px';
                widget.style.top  = (bMinY + relT * newBoxH) + 'px';
                if (container && origCW > 0) {
                    container.style.width  = (origCW * scaleX) + 'px';
                    container.style.height = (origCH * scaleY) + 'px';
                }
                if (svg && origSW > 0) {
                    const newSW = origSW * scaleX, newSH = origSH * scaleY;
                    svg.setAttribute('width', newSW); svg.setAttribute('height', newSH);
                    widget.style.width = newSW + 'px'; widget.style.height = newSH + 'px';
                }
            });
            strokeOrigins.forEach(({ stroke, origPoints }) => {
                stroke.points = origPoints.map(p => ({
                    x: bMinX + (p.x - bMinX) * scaleX,
                    y: bMinY + (p.y - bMinY) * scaleY
                }));
            });
            if (drawCtx) redrawStrokes();
            updateSelectionOverlay();
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            const curW = window.innerWidth, curVH = virtualH(curW);
            selectedWidgets.forEach(w => {
                w.dataset.leftPercent = (w.offsetLeft / curW) * 100;
                w.dataset.topPercent  = (w.offsetTop  / curVH) * 100;
                const c = w.querySelector('.editor-container');
                if (c) {
                    w.dataset.widthPercent    = (c.offsetWidth  / curW) * 100;
                    w.dataset.contentHPercent = (c.offsetHeight / curVH) * 100;
                }
            });
            saveBoard();
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };
    document.getElementById('sc-merge-btn').onclick = (e) => {
        e.stopPropagation();
        mergeWidgets();
    };
    document.getElementById('sc-ungroup-btn').onclick = (e) => {
        e.stopPropagation();
        const groupIds = new Set([
            ...selectedWidgets.map(w => w.dataset.groupId),
            ...selectedStrokes.map(s => s.groupId)
        ].filter(Boolean));
        if (groupIds.size === 0) return;
        snapshotNow();
        groupIds.forEach(gid => {
            document.querySelectorAll(`.widget[data-group-id="${gid}"], .shape-widget[data-group-id="${gid}"]`).forEach(w => {
                delete w.dataset.groupId;
            });
            strokes.filter(s => s.groupId === gid).forEach(s => { delete s.groupId; });
        });
        clearSelection();
        saveBoard();
    };
}

function buildScCtxMenu(menu) {
    menu.innerHTML = '';
    const addBtn = (label, fn) => {
        const b = document.createElement('button');
        b.innerHTML = label;
        b.onmousedown = ev => ev.stopPropagation();
        b.onclick = () => { menu.classList.remove('open'); fn(); };
        menu.appendChild(b);
    };
    const addSep = () => menu.appendChild(document.createElement('hr'));

    addBtn('⬆️ Premier plan', () => {
        snapshotNow();
        selectedWidgets.forEach(w => { pinnedZCounter++; w.style.zIndex = pinnedZCounter; });
        saveBoard();
    });
    addBtn('⬇️ Envoyer derrière', () => {
        snapshotNow();
        selectedWidgets.forEach(w => { w.style.zIndex = 1; w.dataset.background = "true"; w.dataset.pinned = "false"; w.classList.remove('pinned'); });
        saveBoard();
    });
    addSep();
    addBtn('⧉ Dupliquer', () => {
        snapshotNow();
        const toClone = [...selectedWidgets];
        clearSelection();
        toClone.forEach(w => {
            if (w.classList.contains('shape-widget')) cloneShapeWidget(w);
            else cloneWidget(w);
        });
    });
    const hasGroup = selectedWidgets.some(w => w.dataset.groupId);
    if (hasGroup) {
        const groupIds = new Set(selectedWidgets.map(w => w.dataset.groupId).filter(Boolean));
        addSep();
        addBtn('⛓️‍💥 Dissocier le groupe', () => {
            snapshotNow();
            groupIds.forEach(gid => {
                document.querySelectorAll(`.widget[data-group-id="${gid}"], .shape-widget[data-group-id="${gid}"]`).forEach(w => {
                    delete w.dataset.groupId;
                });
            });
            clearSelection();
            saveBoard();
        });
    }
}

function onMoveMove(e) {
    const pos = getBoardPos(e);
    const dx = pos.x - moveStartX, dy = pos.y - moveStartY;
    widgetMoveOrigins.forEach(({ widget, origLeft, origTop }) => {
        widget.style.left = (origLeft + dx) + 'px'; widget.style.top = (origTop + dy) + 'px';
    });
    strokeMoveOrigins.forEach(({ stroke, origPoints }) => {
        stroke.points = origPoints.map(p => ({ x: p.x + dx, y: p.y + dy }));
    });
    if (drawCtx) redrawStrokes(); updateSelectionOverlay();
}

function onMoveEnd() {
    document.removeEventListener('mousemove', onMoveMove);
    document.removeEventListener('mouseup',   onMoveEnd);
    const curW = window.innerWidth, curVH = virtualH(curW);
    selectedWidgets.forEach(w => {
        w.dataset.leftPercent = (w.offsetLeft / curW) * 100;
        w.dataset.topPercent  = (w.offsetTop  / curVH) * 100;
    });
    saveBoard(); updateSelectionOverlay();
}

function getSelectionCenter() {
    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    const br = board.getBoundingClientRect();
    selectedWidgets.forEach(w => {
        const r = w.getBoundingClientRect();
        minX=Math.min(minX,r.left-br.left); minY=Math.min(minY,r.top-br.top);
        maxX=Math.max(maxX,r.right-br.left); maxY=Math.max(maxY,r.bottom-br.top);
    });
    selectedStrokes.forEach(s => s.points.forEach(p => {
        minX=Math.min(minX,p.x); minY=Math.min(minY,p.y); maxX=Math.max(maxX,p.x); maxY=Math.max(maxY,p.y);
    }));
    return { x:(minX+maxX)/2, y:(minY+maxY)/2 };
}

function updateSelectionOverlay() {
    const has = selectedWidgets.length > 0 || selectedStrokes.length > 0;
    const ctrl = document.getElementById('selection-controls');
    if (!has) {
        ctrl.style.display = 'none';
        board.classList.remove('single-select');
        board.classList.remove('multi-select');
        return;
    }
    // Widget seul SANS groupe → poignées natives bleues, pas d'overlay
    if (selectedWidgets.length === 1 && selectedStrokes.length === 0 && !selectedWidgets[0].dataset.groupId) {
        board.classList.add('single-select');
        board.classList.remove('multi-select');
        ctrl.style.display = 'none';
        if (typeof positionActionBar === 'function') positionActionBar(selectedWidgets[0]);
        return;
    }

    board.classList.remove('single-select');
    board.classList.add('multi-select');

    let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
    const br = board.getBoundingClientRect();
    selectedWidgets.forEach(w => {
        const r = w.getBoundingClientRect();
        minX=Math.min(minX,r.left-br.left); minY=Math.min(minY,r.top-br.top);
        maxX=Math.max(maxX,r.right-br.left); maxY=Math.max(maxY,r.bottom-br.top);
    });
    selectedStrokes.forEach(s => {
        const pad = (s.size||4)/2;
        s.points.forEach(p => {
            minX=Math.min(minX,p.x-pad); minY=Math.min(minY,p.y-pad);
            maxX=Math.max(maxX,p.x+pad); maxY=Math.max(maxY,p.y+pad);
        });
    });
    ctrl.style.display = 'block';
    ctrl.style.left   = minX + 'px'; ctrl.style.top    = minY + 'px';
    ctrl.style.width  = (maxX - minX) + 'px'; ctrl.style.height = (maxY - minY) + 'px';

    // Positionner la barre d'action au-dessus si trop proche du bas
    const scActionBar = document.getElementById('sc-action-bar');
    if (scActionBar) {
        const boardH = board.offsetHeight;
        if (boardH - maxY < 55) scActionBar.classList.add('above');
        else                    scActionBar.classList.remove('above');
    }

    const resizeBtnO  = document.getElementById('sc-resize-btn');
    const scLockBtnO  = document.getElementById('sc-lock-btn');
    const scFlipHO    = document.getElementById('sc-flip-h-btn');
    const scFlipVO    = document.getElementById('sc-flip-v-btn');
    const mergeBtn    = document.getElementById('sc-merge-btn');
    const ungroupBtn  = document.getElementById('sc-ungroup-btn');
    if (resizeBtnO)  resizeBtnO.style.display  = '';
    if (scLockBtnO)  scLockBtnO.style.display  = 'flex';
    if (scFlipHO)    scFlipHO.style.display    = 'flex';
    if (scFlipVO)    scFlipVO.style.display    = 'flex';

    if (mergeBtn && ungroupBtn) {
        const totalSel  = selectedWidgets.length + selectedStrokes.length;
        const multi     = totalSel >= 2;
        const allGroupIds = [
            ...selectedWidgets.map(w => w.dataset.groupId),
            ...selectedStrokes.map(s => s.groupId)
        ].filter(Boolean);
        const groupIdSet   = new Set(allGroupIds);
        const allSameGroup = groupIdSet.size === 1 && allGroupIds.length === totalSel;

        if (allSameGroup) {
            mergeBtn.style.display   = 'none';
            ungroupBtn.style.display = 'flex';
        } else if (multi) {
            mergeBtn.style.display   = 'flex';
            ungroupBtn.style.display = 'none';
        } else {
            mergeBtn.style.display   = 'none';
            ungroupBtn.style.display = 'none';
        }
    }
}

function getBoardPos(e) {
    const r = board.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function findStrokeAt(x, y) {
    for (let i = strokes.length - 1; i >= 0; i--) {
        const s = strokes[i], tol = s.size / 2 + 5;
        for (let j = 1; j < s.points.length; j++) {
            if (distToSegment(x, y, s.points[j-1], s.points[j]) <= tol) return s;
        }
    }
    return null;
}

function distToSegment(px, py, a, b) {
    const dx = b.x-a.x, dy = b.y-a.y, lenSq = dx*dx + dy*dy;
    if (lenSq === 0) return Math.hypot(px-a.x, py-a.y);
    const t = Math.max(0, Math.min(1, ((px-a.x)*dx + (py-a.y)*dy) / lenSq));
    return Math.hypot(px - (a.x + t*dx), py - (a.y + t*dy));
}
