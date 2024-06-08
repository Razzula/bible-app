import { isElectronApp } from "./general";

/**
 * A file manager that provides methods to load and save files from the file system.
 * @abstract
 */
class FileManager {
    private static instance: FileManager;
    protected constructor() { }

    public static getInstance(): FileManager {
        if (!FileManager.instance) {
            if (isElectronApp()) {
                FileManager.instance = new ElectronFileManager();
            }
            else {
                FileManager.instance = new MockFileManager();
            }
        }
        return FileManager.instance;
    }

    protected scriptureCache: any = {};

    public async loadScripture(book: string, chapter: string, translation?: string): Promise<any> {
        console.error('loadScripture not implemented');
    }

    public async loadResource(path: string, fileName: string): Promise<any> {
        console.error('loadResource not implemented');
    }

    public async loadNotes(group: string, book: string, chapter: string): Promise<any> {
        console.error('loadNotes not implemented');
    }

    public async saveNote(id: string, selectedNoteGroup: string, book: string, chapter: string, newNoteContents: any): Promise<boolean> {
        console.error('saveNote not implemented');
        return false;
    }

    public async deleteNote(id: string, selectedNoteGroup: string, book: string, chapter: string): Promise<boolean> {
        console.error('deleteNote not implemented');
        return false;
    }

    public async getResourceChildren(path: string, mode: any): Promise<any[]> {
        console.error('getResourceChildren not implemented');
        return [];
    }

    public async getDirectories(path: string): Promise<string[]> {
        console.error('getDirectories not implemented');
        return [];
    }

}

/**
 * A file manager that uses the electron API to load files from the file system.
 * @extends FileManager
 */
class ElectronFileManager extends FileManager {

    public async loadScripture(book: string, chapter: string, translation?: string): Promise<any> {

        if (!translation) {
            translation = 'NKJV'; // TODO: (BIBLE-82) make this a setting
        }

        if (this.scriptureCache[book]) {
            if (this.scriptureCache[book][chapter]) {
                if (this.scriptureCache[book][chapter][translation]) {
                    return this.scriptureCache[book][chapter][translation];
                }
            }
            else {
                this.scriptureCache[book][chapter] = {};
            }
        }
        else {
            this.scriptureCache[book] = { [chapter]: {} };
        }

        // cache result
        const result = await window.electronAPI.loadScripture(`${book}.${chapter}`, translation);
        this.scriptureCache[book][chapter][translation] = result;
        return result;
    }

    public async loadResource(path: string, fileName: string): Promise<any> {
        // currently we don't cache resources, as they are not expected to be accessed frequently
        return await window.electronAPI.loadResource(path, fileName);
    }

    public async loadNotes(group: string, book: string, chapter: string): Promise<any> {
        return await window.electronAPI.loadNotes(group, book, chapter);
    }

    public async saveNote(id: string, selectedNoteGroup: string, book: string, chapter: string, newNoteContents: any): Promise<boolean> {
        return await window.electronAPI.saveNote(id, selectedNoteGroup, book, chapter, newNoteContents);
    }

    public async deleteNote(id: string, selectedNoteGroup: string, book: string, chapter: string): Promise<boolean> {
        return await window.electronAPI.deleteNote(id, selectedNoteGroup, book, chapter);
    }

    public async getResourceChildren(path: string, mode: any): Promise<any[]> {
        return await window.electronAPI.getResourceChildren(path, mode);
    }

    public async getDirectories(path: string): Promise<string[]> {
        return await window.electronAPI.getDirectories(path);
    }

}

/**
 * A mock file manager that uses fetch to load files from the public directory.
 * This is used when the application is not running in an electron environment.
 * @extends FileManager
 */
class MockFileManager extends FileManager {

    private manifest: {
        resources: {
            [key: string]: {
                [key: string]: {
                    [key: string]: string[]
                }
            }
        },
        Scripture: string[],
        notes: {
            [key: string]: {
                [key: string]: {
                    [key: string]: string[]
                }
            }
        }
    };

    private constructor() {
        super();
        this.manifest = {} as any;
        this.init();
    }

    private async init() {
        this.manifest = JSON.parse(await this.loadFile('manifest.json'));
        console.log(this.manifest);
    }

    private async loadFile(path: string): Promise<any> {
        const response = await fetch(`example/${path}`);
        if (response.status === 200) {
            return response.text();
        }
        return null;
    }

    public async loadScripture(book: string, chapter: string, translation?: string): Promise<any> {
        const data = await this.loadFile(`Scripture/${translation}/${book}.${chapter}`);
        return data ? JSON.parse(data) : null;
    }

    public async loadResource(path: string, fileName: string): Promise<any> {
        const filePath = `resources/${path}` + (fileName ? `/${fileName}` : '');
        return (
            this.loadFile(filePath)
            .then(data => {
                if (fileName.endsWith('.json')) {
                    return JSON.parse(data);
                }
                return data;
            })
        );
    }

    public async loadNotes(group: string, book: string, chapter: string): Promise<any> {
        const notes: string[] = this.manifest.notes[group][book][chapter];

        return await Promise.all(
            notes.map(async (note) => {
                const data = JSON.parse(await this.loadFile(`notes/${group}/${book}/${chapter}/${note}`));
                data.id = note;
                return data;
            })
        );
    }

    public async getResourceChildren(path: string, mode: any): Promise<any[]> {

        // get manifest of current directory
        const manifest = JSON.parse(await this.loadFile(`resources/${path}/manifest.json`));
        const filesToIgnore = ['manifest.json', manifest?.landing];

        // get list of subdirectories
        const pathList = ['resources'].concat(path.split('/'));
        let temp: any = this.manifest;
        pathList.forEach((dir) => {
            temp = temp[dir];
        });
        const children: string[] = mode === 'dir' ? Object.keys(temp) : temp;

        // load manifest for each child
        return await Promise.all(
            children.filter((child) => !filesToIgnore.includes(child))
                .map(async (child) => {
                    if (mode === 'dir') {
                        const childManifest = await this.loadFile(`resources/${path}/${child}/manifest.json`);
                        return { title: JSON.parse(childManifest).title, path: child };
                    }
                    return { path: child };
                }
            )
        );
    }

    public async getDirectories(path: string): Promise<string[]> {
        const pathList = path.split('/');
        let temp: any = this.manifest;
        pathList.forEach((dir) => {
            temp = temp[dir];
        });

        if (Array.isArray(temp)) {
            return temp;
        }
        return Object.keys(temp);
    }

}

export default FileManager;
