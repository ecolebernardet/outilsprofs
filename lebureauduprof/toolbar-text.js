// =========================================================================
// TOOLBAR TEXTE — Le Bureau du Prof
// Fonctions extraites de index.html
//
// Dépendances globales attendues (définies dans index.html) :
//   currentActiveWidget, savedSelection
//   snapshotNow(), saveBoard(), createWidget()
//   applyTransparency()  (définie dans widgets.js)
//   stopDrawing(), stopShapeToolbar()  (définies dans draw.js / shapes.js)
// =========================================================================

// =========================================================================
// FORMATAGE TEXTE
// =========================================================================
function format(cmd, val=null) { document.execCommand(cmd, false, val); saveBoard(); }

function formatFontSize(size) {
    const sel = window.getSelection(); if (!sel || sel.rangeCount===0) return;
    document.execCommand("fontSize", false, "7");
    Array.from(document.getElementsByTagName("font")).forEach(f => {
        if (f.size === "7") { f.removeAttribute("size"); f.style.fontSize = size + "px"; }
    });
    saveBoard();
}

function formatFontFamily(font) {
    document.execCommand('fontName', false, font);
    const sel = window.getSelection();
    if (sel.anchorNode) sel.anchorNode.parentElement.style.fontFamily = font;
    saveBoard();
}


function openTextToolbar(widget) {
    currentActiveWidget = widget;
    const tb = document.getElementById('global-toolbar');
    tb.style.display = 'flex';
    syncFontSizeGlobal();
    const opacity = parseFloat(widget.dataset.bgOpacity ?? 1);
    const slider = document.getElementById('widget-bg-opacity');
    const label  = document.getElementById('widget-bg-opacity-val');
    if (slider) { slider.value = Math.round(opacity * 100); }
    if (label)  { label.textContent = Math.round(opacity * 100) + '%'; }
}

// =========================================================================
// BARRE TEXTE GLOBALE
// =========================================================================
let isTextPlacementMode = false;

function toggleGlobalToolbar() {
    // Active le mode placement texte sur le bureau
    const boardEl = document.getElementById('board');
    if (!isTextPlacementMode) {
        isTextPlacementMode = true;
        boardEl.classList.add('cursor-pencil');
        if (typeof stopDrawing === 'function') stopDrawing();
        if (typeof stopShapeToolbar === 'function') stopShapeToolbar();
    } else {
        closeGlobalToolbar();
    }
}

function closeGlobalToolbar() {
    document.getElementById('global-toolbar').style.display = 'none';
    document.getElementById('board').classList.remove('cursor-pencil');
    isTextPlacementMode = false;
    // Sortir du mode édition sur le widget actif
    if (currentActiveWidget) {
        const ed = currentActiveWidget.querySelector('.editor-content');
        if (ed) {
            ed.contentEditable = 'false';
            ed.style.cursor = 'grab';
            ed.style.userSelect = 'none';
        }
        currentActiveWidget.style.cursor = 'grab';
        currentActiveWidget = null;
    }
}

document.getElementById('board').addEventListener('click', function(e) {
    if (isTextPlacementMode && e.target.id === 'board') {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        const widget = createWidget('text');
        widget.style.left = x + 'px'; widget.style.top = y + 'px';
        const editableArea = widget.querySelector('.editor-content');
        if (editableArea) setTimeout(() => editableArea.focus(), 10);
        isTextPlacementMode = false;
        this.classList.remove('cursor-pencil');
        window._nextTextOpenCreate = false; // déjà géré ci-dessous
        const editableArea2 = widget.querySelector('.editor-content');
        if (editableArea2) {
            setTimeout(() => {
                if (widget._enterEditMode) widget._enterEditMode();
                openTextToolbar(widget);
            }, 20);
        }
        saveBoard();
    } else if (e.target.id === 'board') {
        const tb = document.getElementById('global-toolbar');
        if (tb.style.display === 'block') closeGlobalToolbar();
    }
});

function formatGlobal(cmd, val=null) {
    if (!currentActiveWidget) return;
    if (savedSelection) { const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(savedSelection); savedSelection=null; }
    document.execCommand(cmd, false, val); saveBoard();
}

function formatFontSizeGlobal(size) {
    if (!currentActiveWidget) return;
    const editor = currentActiveWidget.querySelector('.editor-content');
    if (!editor) return;

    if (savedSelection) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedSelection);
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;

    // ── Approche : appliquer fontSize sur TOUS les éléments de l'éditeur
    // qui sont (au moins partiellement) dans la sélection
    const range = sel.getRangeAt(0);

    // Cas simple : toute la sélection est dans un seul nœud texte
    // → on le wrappe dans un span
    if (range.commonAncestorContainer.nodeType === 3) {
        const span = document.createElement('span');
        span.style.fontSize = size + 'px';
        range.surroundContents(span);
        const newRange = document.createRange();
        newRange.selectNodeContents(span);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedSelection = newRange.cloneRange();
        saveBoard();
        return;
    }

    // Cas général : sélection multi-éléments
    // On applique directement fontSize sur tous les descendants de l'ancêtre commun
    // qui intersectent la sélection
    const ancestor = range.commonAncestorContainer;
    const allElements = ancestor.querySelectorAll ? 
        [...ancestor.querySelectorAll('*')] : [];
    
    // Aussi traiter l'ancêtre lui-même si c'est un élément
    if (ancestor.nodeType === 1) allElements.unshift(ancestor);

    allElements.forEach(el => {
        if (range.intersectsNode(el)) {
            el.style.fontSize = size + 'px';
        }
    });

    // Traiter les nœuds texte nus directement dans l'ancêtre
    [...ancestor.childNodes].forEach(node => {
        if (node.nodeType === 3 && node.textContent.trim() && range.intersectsNode(node)) {
            const span = document.createElement('span');
            span.style.fontSize = size + 'px';
            node.parentNode.insertBefore(span, node);
            span.appendChild(node);
        }
    });

    // Maintenir la sélection
    try {
        const newRange = document.createRange();
        newRange.setStart(range.startContainer, range.startOffset);
        newRange.setEnd(range.endContainer, range.endOffset);
        sel.removeAllRanges();
        sel.addRange(newRange);
        savedSelection = newRange.cloneRange();
    } catch(e) {}

    saveBoard();
}

function adjustFontSize(delta) {
    if (!currentActiveWidget) return;
    const editor = currentActiveWidget.querySelector('.editor-content');
    if (!editor) return;

    // Restaurer la sélection sauvegardée (onmousedown du bouton)
    if (savedSelection) {
        try { const s = window.getSelection(); s.removeAllRanges(); s.addRange(savedSelection); } catch(e) {}
    }

    // Si toujours pas de sélection → sélectionner tout le contenu de l'éditeur
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        const range = document.createRange();
        range.selectNodeContents(editor);
        sel.removeAllRanges();
        sel.addRange(range);
        savedSelection = range.cloneRange();
    }

    // Lire la taille courante depuis le nœud ancre
    let currentSize = 40;
    if (sel.anchorNode) {
        const el = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
        if (el) currentSize = parseInt(window.getComputedStyle(el).fontSize) || 40;
    }
    const newSize = Math.max(8, Math.min(200, currentSize + delta));
    formatFontSizeGlobal(newSize);
}

function saveCurrentSelection() {
    const sel = window.getSelection();
    return (sel && sel.rangeCount>0) ? sel.getRangeAt(0).cloneRange() : null;
}

function formatFontFamilyGlobal(font) {
    if (!currentActiveWidget) return;
    document.execCommand('fontName', false, font);
    const sel = window.getSelection();
    if (sel.anchorNode) sel.anchorNode.parentElement.style.fontFamily = font;
    saveBoard();
}

function changeWidgetBgGlobal(input, color) {
    if (!currentActiveWidget) return;
    const c = currentActiveWidget.querySelector('.editor-container'); if (!c) return;
    snapshotNow();
    applyTransparency(currentActiveWidget, false); c.style.background=color; currentActiveWidget.dataset.bgColor=color; saveBoard();
}

function toggleTransparencyGlobal() {
    if (!currentActiveWidget) return;
    snapshotNow();
    applyTransparency(currentActiveWidget, currentActiveWidget.dataset.transparent!=="true"); saveBoard();
}

function applyTextColor(color) {
    if (!currentActiveWidget) return;
    if (savedSelection) { const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(savedSelection); savedSelection=null; }
    document.execCommand('foreColor', false, color); saveBoard();
}

function applyHighlightColor(color) {
    if (!currentActiveWidget) return;
    if (savedSelection) { const sel=window.getSelection(); sel.removeAllRanges(); sel.addRange(savedSelection); savedSelection=null; }
    document.execCommand('backColor', false, color); saveBoard();
}

function syncFontSizeGlobal() {
    // Plus d'input à synchroniser — boutons +/- seulement
}

function applyFontSizeOnBlur(input) {
    const size = parseInt(input.value);
    if (isNaN(size) || size < 8) { input.value = 8; return; }
    if (size > 100) { input.value = 100; return; }
    // savedSelection est déjà restauré dans formatFontSizeGlobal
    formatFontSizeGlobal(size);
}

document.addEventListener('click', (e) => {
    // Clic simple : fermer la toolbar si on clique en dehors, mais ne pas l'ouvrir
    const widget = e.target.closest('.widget');
    const isTextOrHomework = widget && (widget.dataset.type==='text' || widget.dataset.type==='homework');
    if (!e.target.closest('#global-toolbar') && !e.target.closest('#toolbar-toggle-btn') && !isTextOrHomework) {
        if (currentActiveWidget) { currentActiveWidget=null; document.getElementById('global-toolbar').style.display='none'; }
    }
});

document.addEventListener('dblclick', (e) => {
    // Double-clic sur widget texte : ouvrir la toolbar
    const widget = e.target.closest('.widget');
    const isTextOrHomework = widget && (widget.dataset.type==='text' || widget.dataset.type==='homework');
    if (isTextOrHomework) { currentActiveWidget=widget; document.getElementById('global-toolbar').style.display='flex'; syncFontSizeGlobal(); }
});
