// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')

const fs = require('fs')
const path = require('path')

function createWindow() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            // nodeIntegration: true,
            enableRemoteModule: true,
            // contextIsolation: false
        },
        autoHideMenuBar: true,
    })

    // and load the index.html of the app.
    // mainWindow.loadFile('index.html')
    mainWindow.loadURL('http://localhost:3180');

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
    ipcMain.handle('setupApp', () => handleInitialSetup())
    ipcMain.handle('getDirectories', (event, localPath) => handleDirectoryScan(localPath))
    ipcMain.handle('loadNotes', (event, group, book, chapter) => handleLoadNotes(group, book, chapter))
    ipcMain.handle('saveNote', (event, fileName, group, book, chapter, data) => handleSaveNote(fileName, group, book, chapter, data))
    ipcMain.handle('deleteNote', (event, fileName, group, book, chapter) => handleDeleteNote(fileName, group, book, chapter))
    ipcMain.handle('loadScripture', (event, fileName, localPath, mode) => handleLoadScripture(fileName, localPath, mode))
    ipcMain.handle('loadDocument', (event, fileName) => handleLoadDocument(fileName))
    ipcMain.handle('loadResource', (event, filePath, fileName) => handleLoadResource(filePath, fileName))
    ipcMain.handle('getResourceChildren', (event, parentDirectory, detectionMode) => getResourceChildren(parentDirectory, detectionMode))
    ipcMain.handle('loadSettings', (event) => loadSettings())
    ipcMain.handle('saveSettings', (event, settingsJSON) => saveSettings(settingsJSON))
    ipcMain.handle('loadConcordance', (event, concordanceName) => handleLoadConcordance(concordanceName))

    createWindow()

    app.on('activate', () => {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
async function readJSONFile(fileName, localPath) {

    try {
        return JSON.parse(await readFile(fileName, localPath));
    }
    catch (err) {
        console.error('Error:', err);
        return null;
    }

}

async function readFile(fileName, localPath) {

    const dirName = app.getPath("documents");
    try {
        return await fs.readFileSync(path.join(dirName, 'bible-app', localPath, fileName), 'utf8');
    }
    catch (err) {
        console.error('Error:', err);
        return null;
    }

}

async function writeFile(fileName, localPath, data) {

    const rootDir = app.getPath("documents");

    const localDir = path.join(rootDir, 'bible-app', localPath);
    createDirectoryIfNotExist(localDir);

    fs.writeFile(path.join(localDir, fileName), JSON.stringify(data), (err) => {
        if (err) {
            console.error('Error:', err);
            return false;
        }
    });
    return true;
}

async function deleteFile(fileName, localPath) {

    const rootDir = app.getPath("documents");

    fs.unlink(path.join(rootDir, 'bible-app', localPath, fileName), (err) => {
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

    const directories = [];
    let items = [];
    try {
        items = fs.readdirSync(directoryPath);
    }
    catch (err) {
        return directories;
    }

    let manifest = [];
    try {
        manifest = await readJSONFile('manifest.json', localPath);
    }
    catch (err) { }

    for (const item of items) {
        const itemPath = path.join(directoryPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            if (manifest && manifest.children === 'dir') {
                const childManifest = await readJSONFile('manifest.json', path.join(localPath, item));
                if (childManifest) {
                    childManifest.path = item;
                    childManifest.state = 'local';
                    directories.push(childManifest);
                }
            }
            else {
                directories.push({ title: item, path: item, state: 'local' });
            }
        }
    }
    return directories;
}

async function handleSaveNote(fileName, group, book, chapter, data) {
    return await writeFile(
        fileName,
        path.join('notes', group, book, chapter),
        data
    );
}

async function handleLoadNotes(group, book, chapter) {

    const notes = [];
    const localPath = path.join('notes', group, book, chapter);

    let fileNames = [];
    try {
        fileNames = fs.readdirSync(path.join(app.getPath("documents"), 'bible-app', localPath));
    }
    catch (err) {
        console.error('Error:', err);
        return notes;
    }

    for await (const fileName of fileNames) {
        const fileContents = await readJSONFile(fileName, localPath);

        if (fileContents) {
            fileContents.id = fileName;
            notes.push(fileContents);
        }
    }

    return notes;
}

async function handleDeleteNote(fileName, group, book, chapter) {
    return await deleteFile(
        fileName,
        path.join('notes', group, book, chapter)
    );
}

async function handleLoadScripture(fileName, localPath, mode) {
    return await readJSONFile(
        fileName,
        path.join(mode, localPath)
    );
}

async function handleLoadDocument(filename) {

    const fileContents = await readJSONFile(filename, 'documents');

    return fileContents;
}

async function handleLoadResource(filePath, filename) {

    const fileContents = await readFile(filename, path.join('resources', filePath));
    if (filename.endsWith('.json') || filePath.endsWith('.json')) {
        return JSON.parse(fileContents);
    }
    return fileContents;
}

async function handleInitialSetup() {

    const dirName = app.getPath("documents");

    const rootDir = path.join(dirName, 'bible-app');
    createDirectoryIfNotExist(rootDir);

    ['Scripture', 'notes', 'resources', 'documents'].forEach(item => {
        const directoryPath = path.join(rootDir, item);
        createDirectoryIfNotExist(directoryPath);
    });
}

function createDirectoryIfNotExist(dirPath) {

    try {
        fs.accessSync(dirPath, fs.constants.F_OK);
    }
    catch (err) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

}

async function getResourceChildren(parentDirectory, detectionMode) {

    const dirName = app.getPath("documents");
    const resourcePath = path.join('resources', parentDirectory);
    const fullResourcePath = path.join(dirName, 'bible-app', resourcePath);

    const resources = [];
    let items = [];
    try {
        items = fs.readdirSync(fullResourcePath);
    }
    catch (err) {
        return resources;
    }

    const manifest = await readJSONFile('manifest.json', resourcePath);
    if (!manifest) {
        console.error('Error:', 'Manifest not found');
        return resources;
    }

    const filesToIgnore = ['manifest.json', manifest?.landing];

    for (const item of items) {
        const itemPath = path.join(fullResourcePath, item);
        const stat = fs.statSync(itemPath);

        if (detectionMode === 'dir' && stat.isDirectory()) {
            const childManifest = await readJSONFile('manifest.json', path.join(resourcePath, item));
            if (childManifest) {
                resources.push({ title: childManifest.title, path: item, state: 'local' });
            }
        }
        else if (stat.isFile() && !filesToIgnore.includes(item)) {
            resources.push({ path: item, state: 'local' });
        }
    }

    return resources;

}

async function loadSettings() {
    return await readJSONFile('settings.json', '');
}

async function saveSettings(settings) {
    return await writeFile('settings.json', '', settings);
}

async function handleLoadConcordance(concordanceName) {
    return await readJSONFile(
        `${concordanceName}.json`,
        'concordances'
    );
}
