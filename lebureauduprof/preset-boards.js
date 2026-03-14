// =========================================================================
// TABLEAUX ENREGISTRÉS EN DUR
// =========================================================================

const PRESET_BOARDS = {

    'tableau-vierge': {
        label:      'Tableau vierge',
        icon:       '🌑',
        background: '#274a61',
        description: 'Fond bleu nuit, aucun widget',

        build() {
            return {
                widgets:  [],
                shapes:   [],
                strokes:  [],
                refWidth: 1920,
                background: '#274a61'
            };
        }
    },

    'seyes-cursif': {
        label:       'Séyès cursif',
        icon:        '✍️',
        background:  'seyes-marge',
        description: 'Fond Séyès avec marge — police Belle Allure taille 37, interligne 1.72',

        build() {
            // Dimensions de référence 1920px
            // Marge rouge à 255px → widget texte commence à 258px
            // Première ligne principale du Séyès : cycle 64px, grande ligne à 63px
            // font-size 37px, line-height 1.42 → hauteur de ligne = 52.5px
            // Compensation margin-top = -((1.42 - 1.0) * 37) / 2 = -7.77px
            // Le widget est positionné pour que le texte s'aligne sur la ligne principale

            const refW  = 1920;
            const refVH = 937; // hauteur virtuelle de référence standard

            // Position en % pour refW=1920
            const leftPx = 261;           // juste après la marge (255px + 6px de marge)
            const topPx  = 0;             // widget part du haut du board pour ne pas couper les lettres hautes

            const leftPercent  = (leftPx / refW)  * 100;
            const topPercent   = (topPx  / refVH) * 100;
            const widthPercent = ((refW - leftPx - 20) / refW) * 100; // pleine largeur moins marges
            const contentHPercent = ((refVH - 80) / refVH) * 100; // 80px libres en bas

            const widget = {
                type:             'text',
                topPercent,
                leftPercent,
                widthPercent,
                contentHPercent,
                html:             '',
                content:          '',
                transparent:      true,
                bgColor:          '#ffffff',
                bgOpacity:        0,
                editorStyle: {
                    fontFamily: "'BelleAllureGS', cursive",
                    fontSizePx: 37,
                    color:      'rgb(30, 30, 30)'
                },
                pinned:    false,
                background: false,
                groupId:   null,
                transform: null,
                animation: null,
                lineHeight: 1.73,
                marginTop:  '12px'
            };

            return {
                widgets:  [widget],
                shapes:   [],
                strokes:  [],
                refWidth: refW,
                background: 'seyes-marge'
            };
        }
    }

};

/**
 * Charge un tableau preset par sa clé.
 * Applique le fond, restaure les widgets, ouvre le widget texte en mode édition.
 */
function loadPresetBoard(key) {
    const preset = PRESET_BOARDS[key];
    if (!preset) return;

    // Confirmation si le bureau n'est pas vide
    const hasContent = document.querySelectorAll('.widget, .shape-widget').length > 0;
    if (hasContent) {
        const ok = confirm('Cela remplacera le contenu actuel. Continuer ?');
        if (!ok) return;
    }

    closeMainMenu();

    // Vider le bureau
    document.querySelectorAll('.widget, .shape-widget').forEach(w => w.remove());
    if (typeof strokes !== 'undefined') { strokes = []; }
    if (typeof drawCtx !== 'undefined' && drawCtx) { if (typeof redrawStrokes === 'function') redrawStrokes(); }
    if (typeof clearSelection === 'function') clearSelection();
    if (typeof undoStack !== 'undefined') { undoStack = []; redoStack = []; }
    if (typeof updateUndoRedoBtns === 'function') updateUndoRedoBtns();

    // Appliquer le fond
    if (typeof applyBackground === 'function') applyBackground(preset.background);
    localStorage.setItem('boardBackground', preset.background);
    // Forcer le scale du lignage à 100%
    localStorage.setItem('boardBgScale', '1');
    if (typeof applyBgScale === 'function') applyBgScale(1);
    const slider = document.getElementById('bg-scale-slider');
    if (slider) { slider.value = 100; }
    const scaleLabel = document.getElementById('bg-scale-label');
    if (scaleLabel) scaleLabel.textContent = '100%';

    // Construire et restaurer le JSON
    const state = preset.build();
    const json  = JSON.stringify(state);
    localStorage.setItem('profBoardConfig', json);

    if (typeof restoreBoardFromJSON === 'function') {
        restoreBoardFromJSON(json);
    }

    // Après restauration : appliquer line-height, margin-top et ouvrir en édition
    setTimeout(() => {
        const widget = document.querySelector('.widget[data-type="text"]');
        if (!widget) return;

        const editor = widget.querySelector('.editor-content');
        if (editor) {
            // Appliquer line-height et compensation margin-top
            editor.style.lineHeight = '1.73';
            editor.style.marginTop  = '12px';
            editor.dataset.lineHeightBase = '1.73';

            // Passer en mode édition
            editor.contentEditable = 'true';
            editor.style.cursor    = 'text';
            editor.style.userSelect = 'auto';
            widget.style.cursor    = 'auto';

            // Focus et curseur en début de contenu
            editor.focus();
            const range = document.createRange();
            range.setStart(editor, 0);
            range.collapse(true);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }

        // Ouvrir la toolbar texte
        if (typeof openTextToolbar === 'function') openTextToolbar(widget);

        // Sauvegarder l'état initial
        if (typeof saveBoard === 'function') saveBoard();
        if (typeof snapshotNow === 'function') snapshotNow();

    }, 200);
}
