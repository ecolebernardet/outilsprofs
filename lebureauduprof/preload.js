// ============================================================
// Le Bureau du Prof — Preload Electron
// Expose des fonctions sécurisées à la page web
// ============================================================

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Écouter l'événement "ouvrir un PDF" envoyé par main.js
    onOpenPdf: (callback) => {
        ipcRenderer.on('open-pdf', (event, filePath) => callback(filePath));
    },
    // Lire le contenu d'un fichier PDF (retourne base64)
    readPdfFile: (filePath) => {
        return ipcRenderer.invoke('read-pdf-file', filePath);
    },
    // Savoir si on tourne dans Electron
    isElectron: true
});
