// ============================================================
// Le Bureau du Prof — Application Electron
// ============================================================

const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs   = require('fs');

let mainWindow = null;

// PDF passé en argument (double-clic sur un .pdf)
let pendingPdfPath = null;

// ── Récupérer le chemin PDF passé en argument ────────────────────────────
// Quand Windows ouvre un PDF avec cette app : electron.exe "C:\chemin\fichier.pdf"
function getPdfFromArgs(argv) {
    // Chercher un argument qui se termine par .pdf
    return argv.find(a => a.toLowerCase().endsWith('.pdf') && fs.existsSync(a)) || null;
}

// ── Créer la fenêtre principale ──────────────────────────────────────────
function createWindow(pdfPath) {
    mainWindow = new BrowserWindow({
        width:  1280,
        height: 800,
        title:  'Le Bureau du Prof',
        icon:   path.join(__dirname, 'favicon.ico'), // optionnel
        webPreferences: {
            preload:          path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration:  false,
            // Autoriser le chargement de fichiers locaux
            webSecurity:      false,
        }
    });

    // Charger le bureau
    mainWindow.loadFile('index.html');

    // Quand la page est prête, envoyer le PDF si on en a un
    mainWindow.webContents.on('did-finish-load', () => {
        const pdf = pdfPath || pendingPdfPath;
        if (pdf) {
            console.log('[Electron] Envoi PDF à la page :', pdf);
            mainWindow.webContents.send('open-pdf', pdf);
            pendingPdfPath = null;
        }
    });

    mainWindow.on('closed', () => { mainWindow = null; });
}

// ── Démarrage de l'app ───────────────────────────────────────────────────
app.whenReady().then(() => {
    const pdfArg = getPdfFromArgs(process.argv);
    createWindow(pdfArg);
});

// ── Si on double-clique sur un PDF alors que l'app est déjà ouverte ─────
app.on('second-instance', (event, argv) => {
    const pdfArg = getPdfFromArgs(argv);
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        if (pdfArg) {
            console.log('[Electron] Nouvelle instance PDF :', pdfArg);
            mainWindow.webContents.send('open-pdf', pdfArg);
        }
    }
});

// Instance unique — évite d'ouvrir plusieurs fenêtres
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
    app.quit();
}

// ── IPC : lire un fichier PDF depuis le disque ───────────────────────────
// La page demande le contenu binaire d'un PDF via preload.js
ipcMain.handle('read-pdf-file', async (event, filePath) => {
    try {
        const data = fs.readFileSync(filePath);
        // Retourner en base64
        return 'data:application/pdf;base64,' + data.toString('base64');
    } catch(err) {
        console.error('[Electron] Erreur lecture PDF :', err.message);
        return null;
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (mainWindow === null) createWindow(null);
});
