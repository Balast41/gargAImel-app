const { app, BrowserWindow } = require('electron');
const path = require('path');
const { ipcMain } = require('electron');
ipcMain.handle('ping', () => 'pong depuis le main process');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // obligatoire en prod
      nodeIntegration: false,   // ne pas exposer Node dans la page
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});