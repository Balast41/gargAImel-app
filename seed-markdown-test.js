/**
 * Insère une conversation de test avec du markdown côté IA.
 * Usage : npm run seed:markdown
 */
const { app, safeStorage } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Database = require('better-sqlite3-multiple-ciphers');

// Même dossier userData que `npm start` (electron . lit package.json "name").
// Sans ça, electron seed-markdown-test.js écrit dans AppData\Roaming\Electron\.
app.setName('gargaimel-app');

const USER_MESSAGE = 'GargAImel, montre-moi un exemple de réponse en markdown.';

const IA_MARKDOWN = `# Plan d'anéantissement des Schtroumpfs

Voici une **réponse de test** avec du *markdown* pour vérifier le rendu dans l'app.

## Étapes

1. Repérer le village
2. Couper l'approvisionnement en **salsepareille**
3. Désactiver le château de Gargamel

## Code d'exemple

\`\`\`javascript
const potion = {
  ingrédients: ['salsepareille', 'essence de schtroumpf'],
  efficacité: 0.99,
};
console.log('Potion prête !');
\`\`\`

## Tableau

| Cible | Priorité | Statut |
|-------|----------|--------|
| Schtroumpf Farceur | Haute | En cours |
| Grand Schtroumpf | Moyenne | À planifier |

> « Un bon markdown bien rendu vaut mieux qu'un long discours. » — GargAImel

---

Liens : [Electron](https://www.electronjs.org) · [Marked](https://marked.js.org)

- [x] Markdown inséré en BDD
- [ ] Rendu vérifié dans l'UI
`;

function getOrCreateKey() {
  const keyPath = path.join(app.getPath('userData'), 'key.enc');
  if (fs.existsSync(keyPath)) {
    return safeStorage.decryptString(fs.readFileSync(keyPath));
  }
  const key = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(keyPath, safeStorage.encryptString(key));
  return key;
}

function seed() {
  const dbPath = path.join(app.getPath('userData'), 'gargaimel.db');
  const db = new Database(dbPath);
  db.pragma(`key='${getOrCreateKey()}'`);

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

  const insertConv = db.prepare(`INSERT INTO conversations (date, resume) VALUES (?, ?)`);
  const insertMsg = db.prepare(
    `INSERT INTO messages (conversation_id, sender, content) VALUES (?, ?, ?)`
  );

  const { lastInsertRowid: conversationId } = insertConv.run(
    new Date().toISOString(),
    USER_MESSAGE
  );

  insertMsg.run(conversationId, 'user', USER_MESSAGE);
  insertMsg.run(conversationId, 'ia', IA_MARKDOWN);

  console.log('Conversation de test créée.');
  console.log('  ID          :', conversationId);
  console.log('  BDD         :', dbPath);
  console.log('  Messages    : 1 user + 1 ia (markdown)');
  console.log('\nLance npm start et ouvre cette conversation dans le menu Chats.');

  db.close();
}

app.whenReady().then(() => {
  seed();
  app.quit();
});
