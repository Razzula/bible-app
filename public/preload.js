const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    readFile: (fileName,  localPath) => ipcRenderer.invoke('readFile', fileName, localPath)
});