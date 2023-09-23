const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getDirectories: (localPath) => ipcRenderer.invoke('getDirectories', localPath),
    loadScripture: (fileName, translation) => ipcRenderer.invoke('loadScripture', fileName, translation),
    loadNotes: (group, book, chapter) => ipcRenderer.invoke('loadNotes', group, book, chapter),
    saveNote: (fileName, group, book, chapter, data) => ipcRenderer.invoke('saveNote', fileName, group, book, chapter, data),
    deleteNote: (fileName, group, book, chapter) => ipcRenderer.invoke('deleteNote', fileName, group, book, chapter),
    setupApp: () => ipcRenderer.invoke('setupApp')
});
