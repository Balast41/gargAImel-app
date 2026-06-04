const { app, BrowserWindow } = require('electron');
const path = require('path');
let win;


function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 600,
    frame: false,
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


const { ipcMain, dialog } = require('electron');

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
      { name: 'Tous les fichiers', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    return result.filePaths[0]; // retourne le chemin du fichier
  }
  return null;
});

ipcMain.on('win-minimize', (event) => { win.minimize(); });
ipcMain.on('win-maximize', (event) => { win.isMaximized() ? win.unmaximize() : win.maximize(); });
ipcMain.on('win-close', (event) => { win.close(); });