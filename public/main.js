// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')

const fs = require('fs')
const path = require('path')

function createWindow () {
  // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            enableRemoteModule: true,
            // contextIsolation: false
        }
    })

    // and load the index.html of the app.
    // mainWindow.loadFile('index.html')
    mainWindow.loadURL('http://localhost:3013');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    ipcMain.handle('getDirectories', (event, localPath) => handleDirectoryScan(localPath))
    ipcMain.handle('readFile', (event, fileName, localPath) => handleFileRead(fileName, localPath))
    ipcMain.handle('writeFile', (event, fileName, localPath, data) => handleFileWrite(fileName, localPath, data))
    ipcMain.handle('setupApp', (event) => handleInitialSetup())

    createWindow()

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
async function handleFileRead(fileName, localPath) {

    const dirName = app.getPath("documents");

    try {
        return await JSON.parse(fs.readFileSync(path.join(dirName, 'bible-app', localPath, fileName), 'utf8'));
    }
    catch (err) {
        return null;
    }

}

async function handleFileWrite(fileName, localPath, data) {

    const dirName = app.getPath("documents");

    fs.writeFile(path.join(dirName, 'bible-app', localPath, fileName), JSON.stringify(data), (err) => {
        if (err) {
            console.error('Error:', err);
            return false;
        }
    });
    return true;
}

async function handleDirectoryScan(localPath) {

    const dirName = app.getPath("documents");
    const directoryPath = path.join(dirName, 'bible-app', localPath);

    const items = fs.readdirSync(directoryPath);
    const directories = [];

    for (const item of items) {
        const itemPath = path.join(directoryPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            directories.push(item);
        }
    }

    return directories;
}

async function handleInitialSetup() {

    const dirName = app.getPath("documents");

    const rootDir = path.join(dirName, 'bible-app');
    createDirectoryIfNotExist(rootDir);

    ['Scripture', 'notes'].forEach(item => {
        const directoryPath = path.join(rootDir, item);
        createDirectoryIfNotExist(directoryPath);
    });
}

function createDirectoryIfNotExist(dirPath) {
    fs.access(dirPath, (nonExist) => {
        if (nonExist) {
            fs.mkdir(dirPath, (err) => {
                if (err) {
                    //throw err;
                }
            });
        }
    });
}

//TODO; make `documents/bible-app` dir if not exist