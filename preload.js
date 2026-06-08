const { contextBridge, ipcRenderer } = require('electron');
const { marked } = require('marked');

marked.setOptions({
  breaks: true,
  gfm: true,
});

function parseMarkdown(markdown) {
  return marked.parse(markdown ?? '');
}

contextBridge.exposeInMainWorld('api', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  minimize: () => ipcRenderer.send('win-minimize'),
  maximize: () => ipcRenderer.send('win-maximize'),
  close: () => ipcRenderer.send('win-close'),
  readHistorique: () => ipcRenderer.invoke('read-historique'),
  saveHistorique: (resume) => ipcRenderer.invoke('save-historique', resume),
  saveMessage: (data) => ipcRenderer.invoke('save-message', data),
  updateResume: (data) => ipcRenderer.invoke('update-resume', data),
  deleteConversation: (id) => ipcRenderer.invoke('delete-conversation', id),
  parseMarkdown,
});
