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
            background-image: repeating-linear-gradient(
                to bottom,
                transparent 0px, transparent 7px,
                #a8c8f0 7px, #a8c8f0 8px,
                transparent 8px, transparent 15px,
                #a8c8f0 15px, #a8c8f0 16px,
                transparent 16px, transparent 23px,
                #a8c8f0 23px, #a8c8f0 24px,
                transparent 24px, transparent 31px,
                #93759c 31px, #93759c 32px
            ),
            repeating-linear-gradient(to right, transparent 0px, transparent 19px, #93759c 19px, #93759c 20px);
        }
        .bg-thumb-seyes-white {
            background-color: #ffffff;
            background-image: repeating-linear-gradient(
                to bottom,
                transparent 0px, transparent 7px,
                #b8d4f5 7px, #b8d4f5 8px,
                transparent 8px, transparent 15px,
                #b8d4f5 15px, #b8d4f5 16px,
                transparent 16px, transparent 23px,
                #b8d4f5 23px, #b8d4f5 24px,
                transparent 24px, transparent 31px,
                #93759c 31px, #93759c 32px
            ),
            repeating-linear-gradient(to right, transparent 0px, transparent 19px, #93759c 19px, #93759c 20px);
        }
        .bg-thumb-lignes {
            background-color: #fffef5;
            background-image: repeating-linear-gradient(
                to bottom,
                transparent 0px, transparent 30px,
                #a8c8f0 30px, #a8c8f0 31px
            );
        }
        .bg-thumb-grands {
            background-color: #fffef5;
            background-image: repeating-linear-gradient(to right, #a8c8f0 0px, #a8c8f0 1px, transparent 1px, transparent 25px),
                              repeating-linear-gradient(to bottom, #a8c8f0 0px, #a8c8f0 1px, transparent 1px, transparent 25px);
        }
        .bg-thumb-petits {
            background-color: #ffffff;
            background-image: repeating-linear-gradient(to right, #c8ddf5 0px, #c8ddf5 1px, transparent 1px, transparent 10px),
                              repeating-linear-gradient(to bottom, #c8ddf5 0px, #c8ddf5 1px, transparent 1px, transparent 10px);
        }
        .bg-thumb-ardoise-lignes {
            background-color: #2f3542;
            background-image: repeating-linear-gradient(
                to bottom,
                transparent 0px, transparent 30px,
                rgba(255,255,255,0.15) 30px, rgba(255,255,255,0.15) 31px
            );
        }
    `;
    document.head.appendChild(style);
})();

// Fonds Séyès et carreaux — CSS gradient purs (fiables cross-browser, pas de data URI)

const PRESET_BACKGROUNDS = {
    // Séyès jaune paille : 3 interlignes bleus (8px) + 1 ligne rouge (32px) + marge rouge verticale
    'seyes': {
        backgroundColor: '#fffef5',
        backgroundImage: [
            'repeating-linear-gradient(to bottom, transparent 0px, transparent 15px, #a8c8f0 15px, #a8c8f0 16px, transparent 16px, transparent 31px, #a8c8f0 31px, #a8c8f0 32px, transparent 32px, transparent 47px, #a8c8f0 47px, #a8c8f0 48px, transparent 48px, transparent 63px, #93759c 63px, #93759c 64px)',
            'repeating-linear-gradient(to right, transparent 0px, transparent 63px, #93759c 63px, #93759c 64px)'
        ].join(', '),
        backgroundSize: 'auto 64px, 64px auto',
    },
    // Séyès blanc
    'seyes-white': {
        backgroundColor: '#ffffff',
        backgroundImage: [
            'repeating-linear-gradient(to bottom, transparent 0px, transparent 15px, #a8c8f0 15px, #a8c8f0 16px, transparent 16px, transparent 31px, #a8c8f0 31px, #a8c8f0 32px, transparent 32px, transparent 47px, #a8c8f0 47px, #a8c8f0 48px, transparent 48px, transparent 63px, #93759c 63px, #93759c 64px)',
            'repeating-linear-gradient(to right, transparent 0px, transparent 63px, #93759c 63px, #93759c 64px)'
        ].join(', '),
        backgroundSize: 'auto 64px, 64px auto',
    },
    // Grands carreaux 40px
    'grands-carreaux': {
        backgroundColor: '#fffef5',
        backgroundImage: [
            'repeating-linear-gradient(to right,  transparent 0px, transparent 39px, #a8c8f0 39px, #a8c8f0 40px)',
            'repeating-linear-gradient(to bottom, transparent 0px, transparent 39px, #a8c8f0 39px, #a8c8f0 40px)'
        ].join(', '),
        backgroundSize: '40px 40px',
    },
    // Petits carreaux 16px
    'petits-carreaux': {
        backgroundColor: '#ffffff',
        backgroundImage: [
            'repeating-linear-gradient(to right,  transparent 0px, transparent 15px, #c8ddf5 15px, #c8ddf5 16px)',
            'repeating-linear-gradient(to bottom, transparent 0px, transparent 15px, #c8ddf5 15px, #c8ddf5 16px)'
        ].join(', '),
        backgroundSize: '16px 16px',
    },
    // Lignes simples
    'lignes-simples': {
        backgroundColor: '#fffef5',
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, #a8c8f0 31px, #a8c8f0 32px)',
        backgroundSize: 'auto 32px',
    },
    // Ardoise avec lignes blanches
    'ardoise': {
        backgroundColor: '#2f3542',
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 31px, rgba(255,255,255,0.15) 31px, rgba(255,255,255,0.15) 32px)',
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
