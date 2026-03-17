// =========================================================================
// FOND D'ÉCRAN
// =========================================================================

// Injection du CSS des vignettes de prévisualisation
(function () {
    const style = document.createElement('style');
    style.textContent = `
        .bg-thumb { width: 70px; height: 50px; border-radius: 6px; border: 2px solid #eee; cursor: pointer; background-size: cover; background-position: center; transition: 0.2s; }
        .bg-thumb:hover { transform: scale(1.05); border-color: var(--primary-color); }
        .bg-thumb-seyes {
            background-color: #fffef5;
            background-image:
                repeating-linear-gradient(to bottom,
                    transparent 0%, transparent calc(25% - 1px), #c8d8eb calc(25% - 1px), #c8d8eb 25%,
                    transparent 25%, transparent calc(50% - 1px), #c8d8eb calc(50% - 1px), #c8d8eb 50%,
                    transparent 50%, transparent calc(75% - 1px), #c8d8eb calc(75% - 1px), #c8d8eb 75%,
                    transparent 75%, transparent calc(100% - 1px), #9aadbe calc(100% - 1px), #9aadbe 100%
                ),
                repeating-linear-gradient(to right, #9aadbe 0px, #9aadbe 1px, transparent 1px, transparent 100%);
            background-size: auto 32px, 32px auto;
        }
        .bg-thumb-seyes-white {
            background-color: #ffffff;
            background-image:
                repeating-linear-gradient(to bottom,
                    transparent 0%, transparent calc(25% - 1px), #c8d8eb calc(25% - 1px), #c8d8eb 25%,
                    transparent 25%, transparent calc(50% - 1px), #c8d8eb calc(50% - 1px), #c8d8eb 50%,
                    transparent 50%, transparent calc(75% - 1px), #c8d8eb calc(75% - 1px), #c8d8eb 75%,
                    transparent 75%, transparent calc(100% - 1px), #9aadbe calc(100% - 1px), #9aadbe 100%
                ),
                repeating-linear-gradient(to right, #9aadbe 0px, #9aadbe 1px, transparent 1px, transparent 100%);
            background-size: auto 32px, 32px auto;
        }
        .bg-thumb-lignes {
            background-color: #fffef5;
            background-image: repeating-linear-gradient(to bottom,
                transparent 0%, transparent calc(100% - 1px), #a8c8f0 calc(100% - 1px), #a8c8f0 100%);
            background-size: auto 16px;
        }
        .bg-thumb-grands {
            background-color: #fffef5;
            background-image:
                repeating-linear-gradient(to right,  transparent 0%, transparent calc(100% - 1px), #a8c8f0 calc(100% - 1px), #a8c8f0 100%),
                repeating-linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), #a8c8f0 calc(100% - 1px), #a8c8f0 100%);
            background-size: 25px 25px;
        }
        .bg-thumb-petits {
            background-color: #ffffff;
            background-image:
                repeating-linear-gradient(to right,  transparent 0%, transparent calc(100% - 1px), #c8ddf5 calc(100% - 1px), #c8ddf5 100%),
                repeating-linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), #c8ddf5 calc(100% - 1px), #c8ddf5 100%);
            background-size: 10px 10px;
        }
        .bg-thumb-ardoise-lignes {
            background-color: #2f3542;
            background-image: repeating-linear-gradient(to bottom,
                transparent 0%, transparent calc(100% - 1px), rgba(255,255,255,0.15) calc(100% - 1px), rgba(255,255,255,0.15) 100%);
            background-size: auto 16px;
        }
        .bg-thumb-seyes-marge {
            background-color: #fffef5;
            background-image:
                linear-gradient(to right, transparent 0px, transparent 19px, #e05050 19px, #e05050 21px, transparent 21px),
                repeating-linear-gradient(to bottom,
                    transparent 0%, transparent calc(25% - 1px), #c8d8eb calc(25% - 1px), #c8d8eb 25%,
                    transparent 25%, transparent calc(50% - 1px), #c8d8eb calc(50% - 1px), #c8d8eb 50%,
                    transparent 50%, transparent calc(75% - 1px), #c8d8eb calc(75% - 1px), #c8d8eb 75%,
                    transparent 75%, transparent calc(100% - 1px), #9aadbe calc(100% - 1px), #9aadbe 100%
                ),
                linear-gradient(to right, #fffef5 0px, #fffef5 19px, transparent 19px),
                repeating-linear-gradient(to right, #c8d8eb 0px, #c8d8eb 1px, transparent 1px, transparent 100%);
            background-size: 100% 100%, auto 32px, 100% 100%, 32px auto;
            background-position: top left, top left, top left, 21px top;
        }
    `;
    document.head.appendChild(style);
})();

// Fonds Séyès et carreaux — CSS gradient purs (fiables cross-browser, pas de data URI)

/**
 * Génère un SVG data URI pour une ligne verticale pixel-perfect.
 * La ligne est à x=0.5 dans une tuile de `size`px de large.
 * Évite les artefacts sub-pixel des repeating-linear-gradient.
 */
function _svgVertical(size, color) {
    const s = Math.round(size);
    const c = encodeURIComponent(color);
    return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${s}' height='1'%3E%3Cline x1='0.5' y1='0' x2='0.5' y2='1' stroke='${c}' stroke-width='1'/%3E%3C/svg%3E")`;
}

const PRESET_BACKGROUNDS = {
    // Séyès jaune paille — stops en % : 3 interlignes (25/50/75%) + 1 grande ligne (100%)
    'seyes': {
        backgroundColor: '#fffef5',
        backgroundImage: [
            'repeating-linear-gradient(to bottom, transparent 0%, transparent calc(25% - 1px), #c8d8eb calc(25% - 1px), #c8d8eb 25%, transparent 25%, transparent calc(50% - 1px), #c8d8eb calc(50% - 1px), #c8d8eb 50%, transparent 50%, transparent calc(75% - 1px), #c8d8eb calc(75% - 1px), #c8d8eb 75%, transparent 75%, transparent calc(100% - 1px), #9aadbe calc(100% - 1px), #9aadbe 100%)',
            _svgVertical(64, '#9aadbe')
        ].join(', '),
        backgroundSize: 'auto 64px, 64px 1px',
    },
    // Séyès clair avec marge
    'seyes-marge': {
        backgroundColor: '#fffef5',
        backgroundImage: [
            'linear-gradient(to right, transparent 0px, transparent 254px, #e05050 254px, #e05050 256px, transparent 256px)',
            'repeating-linear-gradient(to bottom, transparent 0%, transparent calc(25% - 1px), #c8d8eb calc(25% - 1px), #c8d8eb 25%, transparent 25%, transparent calc(50% - 1px), #c8d8eb calc(50% - 1px), #c8d8eb 50%, transparent 50%, transparent calc(75% - 1px), #c8d8eb calc(75% - 1px), #c8d8eb 75%, transparent 75%, transparent calc(100% - 1px), #9aadbe calc(100% - 1px), #9aadbe 100%)',
            'linear-gradient(to right, #fffef5 0px, #fffef5 254px, transparent 254px)',
            _svgVertical(64, '#c8d8eb')
        ].join(', '),
        backgroundSize: '100% 100%, auto 64px, 100% 100%, 64px 1px',
        backgroundPosition: 'top left, top left, top left, 256px top',
    },
    // Séyès blanc
    'seyes-white': {
        backgroundColor: '#ffffff',
        backgroundImage: [
            'repeating-linear-gradient(to bottom, transparent 0%, transparent calc(25% - 1px), #c8d8eb calc(25% - 1px), #c8d8eb 25%, transparent 25%, transparent calc(50% - 1px), #c8d8eb calc(50% - 1px), #c8d8eb 50%, transparent 50%, transparent calc(75% - 1px), #c8d8eb calc(75% - 1px), #c8d8eb 75%, transparent 75%, transparent calc(100% - 1px), #9aadbe calc(100% - 1px), #9aadbe 100%)',
            _svgVertical(64, '#9aadbe')
        ].join(', '),
        backgroundSize: 'auto 64px, 64px 1px',
    },
    // Grands carreaux
    'grands-carreaux': {
        backgroundColor: '#fffef5',
        backgroundImage: [
            'repeating-linear-gradient(to right,  transparent 0%, transparent calc(100% - 1px), #a8c8f0 calc(100% - 1px), #a8c8f0 100%)',
            'repeating-linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), #a8c8f0 calc(100% - 1px), #a8c8f0 100%)'
        ].join(', '),
        backgroundSize: '40px 40px',
    },
    // Petits carreaux
    'petits-carreaux': {
        backgroundColor: '#ffffff',
        backgroundImage: [
            'repeating-linear-gradient(to right,  transparent 0%, transparent calc(100% - 1px), #c8ddf5 calc(100% - 1px), #c8ddf5 100%)',
            'repeating-linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), #c8ddf5 calc(100% - 1px), #c8ddf5 100%)'
        ].join(', '),
        backgroundSize: '16px 16px',
    },
    // Lignes simples
    'lignes-simples': {
        backgroundColor: '#fffef5',
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), #a8c8f0 calc(100% - 1px), #a8c8f0 100%)',
        backgroundSize: 'auto 32px',
    },
    // Ardoise avec lignes blanches
    'ardoise': {
        backgroundColor: '#2f3542',
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0%, transparent calc(100% - 1px), rgba(255,255,255,0.15) calc(100% - 1px), rgba(255,255,255,0.15) 100%)',
        backgroundSize: 'auto 32px',
    },
};

/**
 * Applique un fond d'écran au tableau.
 * @param {string} value - Clé d'un preset, couleur CSS (#hex / rgb), URL d'image, ou 'none'.
 */
function applyBackground(value) {
    const board = document.getElementById('board');
    if (!board) return;
    if (!value || value === 'none') {
        board.style.backgroundImage = '';
        board.style.backgroundSize  = '';
        board.style.backgroundColor = '#eef2f5';
    } else if (PRESET_BACKGROUNDS[value]) {
        const p = PRESET_BACKGROUNDS[value];
        board.style.backgroundImage    = p.backgroundImage;
        board.style.backgroundSize     = p.backgroundSize || 'auto';
        board.style.backgroundRepeat   = 'repeat';
        board.style.backgroundPosition = 'top left';
        board.style.backgroundColor    = p.backgroundColor || '';
    } else if (value.startsWith('#') || value.startsWith('rgb')) {
        board.style.backgroundImage = '';
        board.style.backgroundSize  = '';
        board.style.backgroundColor = value;
    } else {
        board.style.backgroundImage = '';
        board.style.backgroundSize  = '';
        board.style.background      = value;
    }
}

/**
 * Sauvegarde le fond en localStorage (et crée un snapshot undo).
 * @param {string} value
 */
function saveBg(value) {
    snapshotNow();
    localStorage.setItem('boardBackground', value);
}

/**
 * Gère l'import d'une image locale comme fond d'écran.
 * @param {HTMLInputElement} input
 */
function handleBgUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        const v = `url(${e.target.result})`;
        applyBackground(v);
        saveBg(v);
    };
    reader.readAsDataURL(file);
}

// Compatibilité : ancienne fonction (désormais sans effet, le bg-submenu est intégré dans le menu Affichage)
function toggleSubMenu(event) { /* bg-submenu intégré dans le menu Affichage */ }

// =========================================================================
// ÉCHELLE DES RÉGLURES
// =========================================================================

var _currentBgKey  = null;  // clé du preset actif
var _bgScaleFactor = 1.0;   // facteur d'échelle courant (0.5 → 2.0)

// Liste des presets "réglures" (ceux qui ont un slider d'échelle)
const RULING_PRESETS = ['seyes', 'seyes-white', 'seyes-marge', 'lignes-simples', 'grands-carreaux', 'petits-carreaux', 'ardoise'];

/**
 * Applique le facteur d'échelle en scalant uniquement les px de backgroundSize.
 * Les gradients étant en %, tout le motif se redimensionne proportionnellement.
 */
function applyBgScale(factor) {
    const board = document.getElementById('board');
    if (!board || !_currentBgKey || !PRESET_BACKGROUNDS[_currentBgKey]) return;
    _bgScaleFactor = factor;
    const p = PRESET_BACKGROUNDS[_currentBgKey];

    if (_currentBgKey === 'seyes-marge') {
        // La marge rouge reste toujours à 255px du bord — seules les lignes scalent
        const m = 254; // position fixe
        const sz = (64 * factor).toFixed(1);
        const layers = [
            `linear-gradient(to right, transparent 0px, transparent ${m}px, #e05050 ${m}px, #e05050 ${m+2}px, transparent ${m+2}px)`,
            'repeating-linear-gradient(to bottom, transparent 0%, transparent calc(25% - 1px), #c8d8eb calc(25% - 1px), #c8d8eb 25%, transparent 25%, transparent calc(50% - 1px), #c8d8eb calc(50% - 1px), #c8d8eb 50%, transparent 50%, transparent calc(75% - 1px), #c8d8eb calc(75% - 1px), #c8d8eb 75%, transparent 75%, transparent calc(100% - 1px), #9aadbe calc(100% - 1px), #9aadbe 100%)',
            `linear-gradient(to right, #fffef5 0px, #fffef5 ${m}px, transparent ${m}px)`,
            _svgVertical(64 * factor, '#c8d8eb')
        ];
        board.style.backgroundImage    = layers.join(', ');
        board.style.backgroundSize     = `100% 100%, auto ${sz}px, 100% 100%, ${sz}px 1px`;
        board.style.backgroundPosition = `top left, top left, top left, ${m+2}px top`;
    } else if (_currentBgKey === 'seyes' || _currentBgKey === 'seyes-white') {
        // Pour seyes et seyes-white : regénérer le SVG vertical avec la bonne taille
        const sz = (64 * factor).toFixed(1);
        const color = _currentBgKey === 'seyes' ? '#9aadbe' : '#9aadbe';
        board.style.backgroundImage = [
            p.backgroundImage.split(', ').slice(0, -1).join(', '),
            _svgVertical(64 * factor, color)
        ].join(', ');
        board.style.backgroundSize  = `auto ${sz}px, ${sz}px 1px`;
    } else {
        // Pour tous les autres presets : scaler uniquement les px dans backgroundSize
        const scaledSize = p.backgroundSize.replace(/([\d.]+)px/g, (_, n) =>
            (parseFloat(n) * factor).toFixed(1) + 'px'
        );
        board.style.backgroundImage = p.backgroundImage;
        board.style.backgroundSize  = scaledSize;
        if (p.backgroundPosition) board.style.backgroundPosition = p.backgroundPosition;
    }

    localStorage.setItem('boardBgScale', factor);
    _updateScaleLabel(factor);
}

function _updateScaleLabel(factor) {
    const lbl = document.getElementById('bg-scale-label');
    if (lbl) lbl.textContent = Math.round(factor * 100) + '%';
}

/**
 * Crée et injecte le panneau flottant de zoom des réglures.
 */
function _initRulingScalePanel() {
    if (document.getElementById('ruling-scale-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'ruling-scale-panel';
    panel.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 12000;
        background: rgba(20,20,28,0.35);
        border: 1px solid rgba(255,255,255,0.10);
        border-radius: 12px;
        padding: 8px 14px;
        display: flex;
        align-items: center;
        gap: 10px;
        opacity: 0.18;
        transition: opacity 0.25s;
        pointer-events: auto;
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
    `;
    panel.innerHTML = `
        <span style="font-size:14px;line-height:1;">📏</span>
        <input type="range" id="bg-scale-slider" min="50" max="250" value="100" step="25"
            style="width:90px;cursor:pointer;accent-color:#7ab8f5;">
        <span id="bg-scale-label" style="color:#fff;font-size:11px;font-weight:600;min-width:34px;text-align:right;">100%</span>
    `;
    panel.addEventListener('mouseenter', () => panel.style.opacity = '1');
    panel.addEventListener('mouseleave', () => panel.style.opacity = '0.18');

    panel.querySelector('#bg-scale-slider').addEventListener('input', function() {
        applyBgScale(parseInt(this.value) / 100);
    });

    document.body.appendChild(panel);
    _updateRulingPanelVisibility();
}

function _updateRulingPanelVisibility() {
    const panel = document.getElementById('ruling-scale-panel');
    if (!panel) return;
    const visible = RULING_PRESETS.includes(_currentBgKey);
    panel.style.display = visible ? 'flex' : 'none';
}

// Patch applyBackground pour tracker le preset actif et afficher/masquer le panneau
const _origApplyBackground = applyBackground;
applyBackground = function(value) {
    _origApplyBackground(value);
    _currentBgKey = RULING_PRESETS.includes(value) ? value : null;
    // Restaurer l'échelle sauvegardée
    if (_currentBgKey) {
        const saved = parseFloat(localStorage.getItem('boardBgScale') || '1');
        _bgScaleFactor = saved;
        const slider = document.getElementById('bg-scale-slider');
        if (slider) slider.value = Math.round(saved * 100);
        applyBgScale(saved);
    }
    _updateRulingPanelVisibility();
};

// Init au chargement
window.addEventListener('load', () => {
    _initRulingScalePanel();
    // Restaurer si un preset réglure était actif
    const savedBg = localStorage.getItem('boardBackground');
    if (RULING_PRESETS.includes(savedBg)) {
        _currentBgKey = savedBg;
        const savedScale = parseFloat(localStorage.getItem('boardBgScale') || '1');
        _bgScaleFactor = savedScale;
        const slider = document.getElementById('bg-scale-slider');
        if (slider) slider.value = Math.round(savedScale * 100);
        applyBgScale(savedScale);
        _updateRulingPanelVisibility();
    }
});
