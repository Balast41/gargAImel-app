const { contextBridge, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');

contextBridge.exposeInMainWorld('api', {
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  minimize: () => ipcRenderer.send('win-minimize'),
  maximize: () => ipcRenderer.send('win-maximize'),
  close: () => ipcRenderer.send('win-close'),
  readHistorique: () => ipcRenderer.invoke('read-historique'),
  saveHistorique: () => ipcRenderer.invoke('save-historique'),
  saveMessage: (data) => ipcRenderer.invoke('save-message', data),
  updateResume: (data) => ipcRenderer.invoke('update-resume', data),
  deleteConversation: (id) => ipcRenderer.invoke('delete-conversation', id)
});