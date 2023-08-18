const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getDirectories: (localPath) => ipcRenderer.invoke('getDirectories', localPath),
    readFile: (fileName, localPath) => ipcRenderer.invoke('readFile', fileName, localPath),
    writeFile: (fileName, localPath, data) => ipcRenderer.invoke('writeFile', fileName, localPath, data)
});
