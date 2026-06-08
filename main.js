const { app, BrowserWindow, ipcMain, safeStorage, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3-multiple-ciphers');

let win;
let db;
let stmts;

// Fenêtre principale

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 600,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
  });

  win.loadFile('app.html');

  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      console.warn('Navigation bloquée :', url);
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Base de données SQLite Chiffrée

function getOrCreateKey() {
  const keyPath = path.join(app.getPath('userData'), 'key.enc');
  if (fs.existsSync(keyPath)) {
    const encrypted = fs.readFileSync(keyPath);
    return safeStorage.decryptString(encrypted);
  } else {
    const key = crypto.randomBytes(32).toString('hex');
    const encrypted = safeStorage.encryptString(key);
    fs.writeFileSync(keyPath, encrypted);
    return key;
  }
}

function initDatabase() {
  const key = getOrCreateKey();
  db = new Database(path.join(app.getPath('userData'), 'gargaimel.db'));
  db.pragma(`key='${key}'`);
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      resume TEXT,
      date   TEXT,
      user   TEXT
    );
    CREATE TABLE IF NOT EXISTS messages (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      sender          TEXT NOT NULL,
      content         TEXT NOT NULL,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id)
    );
  `);
}

function initStmts() {
  stmts = {
    insertConversation: db.prepare(`INSERT INTO conversations (date, resume) VALUES (?, ?)`),
    insertMessage:      db.prepare(`INSERT INTO messages (conversation_id, sender, content) VALUES (?, ?, ?)`),
    getConversations:   db.prepare(`SELECT * FROM conversations ORDER BY date DESC`),
    getMessages:        db.prepare(`SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC`),
    updateResume:       db.prepare(`UPDATE conversations SET resume = ? WHERE id = ?`),
    deleteConversation: db.prepare(`DELETE FROM conversations WHERE id = ?`),
  };
}

// App

app.whenReady().then(() => {
  initDatabase();
  initStmts();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC

ipcMain.on('win-minimize', () => win.minimize());
ipcMain.on('win-maximize', () => win.isMaximized() ? win.unmaximize() : win.maximize());
ipcMain.on('win-close',    () => win.close());

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'png', 'gif'] },
      { name: 'Tous les fichiers', extensions: ['*'] }
    ]
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('save-historique', (event, resume) => {
  const result = stmts.insertConversation.run(new Date().toISOString(), resume);
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