const { app, BrowserWindow } = require('electron');
const path = require('path');

// Funzione per creare la finestra principale dell'applicazione
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      // La sicurezza è importante, queste impostazioni sono consigliate
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Carica il file index.html della tua web app
  // Questo percorso punta alla cartella 'dist', che verrà creata dal comando 'npm run build'
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));

  // Opzionale: apri gli strumenti di sviluppo (come in Chrome)
  // mainWindow.webContents.openDevTools();
}

// Questo metodo viene chiamato quando Electron ha finito l'inizializzazione
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    // Su macOS è comune ricreare una finestra quando si clicca sull'icona nel dock
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Esci dall'applicazione quando tutte le finestre sono chiuse (tranne su macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});