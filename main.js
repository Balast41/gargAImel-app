const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3-multiple-ciphers');
const crypto = require('crypto');
const apiKey = 'sk-bhoZYcmJakyYM1Uytfpev3x_PVAPzKhGSVVQ_gOyfXQ';
const REF_AUDIO = path.join(__dirname, 'audio', '001.wav');
const REF_TEXT = "La forêt empeste le bonheur et c'est Horripilant. Ça ne peut pas durer, et ça ne durera pas longtemps, c'est moi, Gargamel, qui vous le dis.";
const { spawn } = require('child_process');

function startTTS() {
  const backend = spawn('uvicorn', [
    'API_TTS.api_TTS:app',
    '--host',
    '127.0.0.1',
    '--port',
    '8000'
  ], {
    stdio: 'inherit',
    shell: true
  });

  backend.on('close', (code) => {
    console.log('TTS backend stopped with code', code);
  });

  return backend;
}


ipcMain.handle('send-payload', async (event, content,session_id) => {
  console.log('Contenu envoyé à l\'API :', content);
  if (session_id == null) {
    session_id = crypto.randomUUID();
  }
  const payload = {
      "output_type": "chat",
      "input_type": "chat",
      "input_value": content,
      "session_id": session_id
  };

  try {
    const response = await fetch('http://localhost:8080/api/v1/run/37f4bc5b-8f98-4a9c-b7cc-cf52fe2136d0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    const iaText = data.outputs[0].outputs[0].results.message.text;
    console.log('Réponse de l\'IA :', iaText);

    return iaText;
  } catch (err) {
    console.error(err);
    throw err;
  }
  
});



let win;
let db;
let stmts;

// Fenêtre principale

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(__dirname, 'img', 'LogoG3.ico'),
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
      shell.openExternal(url);
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// Base de données SQLite

function initDatabase() {
  db = new Database(path.join(app.getPath('userData'), 'gargaimel.db'));
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id     TEXT PRIMARY KEY,
      resume TEXT,
      date   TEXT,
      user   TEXT
    );
    CREATE TABLE IF NOT EXISTS messages (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      sender          TEXT NOT NULL,
      content         TEXT NOT NULL,
      FOREIGN KEY(conversation_id) REFERENCES conversations(id)
    );
  `);
}

function initStmts() {
  stmts = {
    insertConversation: db.prepare(`INSERT INTO conversations (date, resume, id) VALUES (?, ?, ?)`),
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
  startTTS();
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

ipcMain.handle('save-historique', (event, resume, session_id) => {
  if (session_id == null) {
    session_id = crypto.randomUUID();
  }
  const result = stmts.insertConversation.run(new Date().toISOString(), resume, String(session_id));
  return session_id;
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

ipcMain.handle('generate-tts', async (event, genText) => {
  // Remplace les caractères non-ASCII problématiques
  const cleanText = genText
    .normalize('NFD')                          // décompose les accents
    .replace(/[\u0300-\u036f]/g, '')           // supprime les diacritiques combinants
    .replace(/[\u2010-\u2015]/g, '-')          // tirets typographiques → tiret simple
    .replace(/[\u2018\u2019]/g, "'")           // guillemets courbes → apostrophe
    .replace(/[\u201C\u201D]/g, '"')           // guillemets doubles courbes → "
    .replace(/[\u2026]/g, '...')               // ellipse → ...
    .replace(/[^\x00-\xFF]/g, '');             // supprime tout ce qui dépasse Latin-1

  console.log('Génération TTS pour le texte :', cleanText);
  const response = await fetch('http://127.0.0.1:8000/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ref_file: REF_AUDIO,
      ref_text: REF_TEXT,
      gen_text: cleanText,
      seed: 42,
    }),
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`TTS failed: ${response.status} ${err}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  const outPath = path.join(__dirname, 'audio', `audio_${Date.now()}.wav`);
  fs.writeFileSync(outPath, buffer);
  console.log('TTS sauvegardé :', outPath);
  return buffer.toString('base64'); // pratique pour passer par IPC
});

