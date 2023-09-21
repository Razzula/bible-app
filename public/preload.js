const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getDirectories: (localPath) => ipcRenderer.invoke('getDirectories', localPath),
    loadScripture: (fileName, translation) => ipcRenderer.invoke('loadScripture', fileName, translation),
    loadNotes: (book, chapter) => ipcRenderer.invoke('loadNotes', book, chapter),
    saveNote: (fileName, book, chapter, data) => ipcRenderer.invoke('saveNote', fileName, book, chapter, data),
    deleteNote: (fileName, book, chapter) => ipcRenderer.invoke('deleteNote', fileName, book, chapter),
    setupApp: () => ipcRenderer.invoke('setupApp')
});
