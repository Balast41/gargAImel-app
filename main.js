const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');
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
      sandbox:false
    },
  });

  win.loadFile('app.html');
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

// Base de données SQLite
const Database = require('better-sqlite3');
const db = new Database(path.join(__dirname, 'gargaimel.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resume TEXT,
    date TEXT,
    user TEXT
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    sender TEXT NOT NULL,
    content TEXT NOT NULL,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id)
  );
`);

const stmts = {
  insertConversation: db.prepare(
    `INSERT INTO conversations (date) VALUES (?)`
  ),
  insertMessage: db.prepare(
    `INSERT INTO messages (conversation_id, sender, content) VALUES (?, ?, ?)`
  ),
  getConversations: db.prepare(
    `SELECT * FROM conversations ORDER BY date DESC`
  ),
  getMessages: db.prepare(
    `SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC`
  ),
  updateResume: db.prepare(
    `UPDATE conversations SET resume = ? WHERE id = ?`
  ),
  deleteConversation: db.prepare(
    `DELETE FROM conversations WHERE id = ?`
  ),
};

ipcMain.handle('save-historique', () => {
  const result = stmts.insertConversation.run(new Date().toISOString());
  return result.lastInsertRowid;
});

ipcMain.handle('save-message', (event, { conversationId, sender, content }) => {
  stmts.insertMessage.run(conversationId, sender, content);
});

ipcMain.handle('read-historique', () => {
  const conversations = stmts.getConversations.all();
  return conversations.map(conv => ({
    ...conv,
    messages: stmts.getMessages.all(conv.id)
  }));
});

ipcMain.handle('update-resume', (event, { conversationId, resume }) => {
  stmts.updateResume.run(resume, conversationId);
});

ipcMain.handle('delete-conversation', (event, conversationId) => {
  db.transaction(() => {
    db.prepare(`DELETE FROM messages WHERE conversation_id = ?`).run(conversationId);
    stmts.deleteConversation.run(conversationId);
  })();
});