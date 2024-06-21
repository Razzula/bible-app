const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getDirectories: (localPath) => ipcRenderer.invoke('getDirectories', localPath),
    loadScripture: (fileName, translation) => ipcRenderer.invoke('loadScripture', fileName, translation),
    loadNotes: (group, book, chapter) => ipcRenderer.invoke('loadNotes', group, book, chapter),
    loadResource: (filePath, fileName) => ipcRenderer.invoke('loadResource', filePath, fileName),
    saveNote: (fileName, group, book, chapter, data) => ipcRenderer.invoke('saveNote', fileName, group, book, chapter, data),
    deleteNote: (fileName, group, book, chapter) => ipcRenderer.invoke('deleteNote', fileName, group, book, chapter),
    loadDocument: (documentName) => ipcRenderer.invoke('loadDocument', documentName),
    getResourceChildren: (parentDirectory, detectionMode) => ipcRenderer.invoke('getResourceChildren', parentDirectory, detectionMode),
    loadSettings: () => ipcRenderer.invoke('loadSettings'),
    saveSettings: (settingsJSON) => ipcRenderer.invoke('saveSettings', settingsJSON),
    setupApp: () => ipcRenderer.invoke('setupApp')
});
