import { isElectronApp } from "./general";

/**
 * A file manager that provides methods to load and save files from the file system.
 * @abstract
 */
class FileManager {
    private static instance: FileManager;
    protected constructor() {
        fetch(`${this.SEVER_URL}/test`); // ping server to wake it up, in case it is sleeping

        void this.findDownloadedDirectories();
    }

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

    protected SEVER_URL = (import.meta as any).env.VITE_SERVER_URL;
    protected fileCache: any = {
        'resources': {},
        'Scripture': {},
    };
    protected downloadedDirectories: any = {
        'resources': {},
        'Scripture': {},
    };

    private async findDownloadedDirectories() {
        const waitForNonNullInstance = setInterval(() => {
            if (FileManager.instance === null) {
                return;
            }
            clearInterval(waitForNonNullInstance);

            FileManager.instance.getDirectories('resource').then((dirs) => {
                dirs.forEach((dir) => {
                    this.downloadedDirectories[dir] = true;
                });
            });
            FileManager.instance.getDirectories('Scripture').then((dirs) => {
                dirs.forEach((dir) => {
                    this.downloadedDirectories[dir] = true;
                });
            });
        }, 1000)
    }

    public getDownloadedDirectories() {
        return this.downloadedDirectories;
    }

    public async loadScripture(book: string, chapter: string, translation?: string): Promise<any> {
        return await fetch(`${this.SEVER_URL}/file/Scripture/${translation}/${book}.${chapter}`)
            .then(response => response.json());
    }

    public async loadResource(path: string, fileName: string): Promise<any> {
        const filePath = path + (fileName ? `/${fileName}` : '');

        return await fetch(`${this.SEVER_URL}/file/resources/${filePath}`)
            .then(response => response.text())
            .then(data => {
                if (fileName.endsWith('.json') || path.endsWith('.json')) {
                    return JSON.parse(data);
                }
                return data;
            });
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
        return await fetch(`${this.SEVER_URL}/dir/resources/${path}`)
            .then(response => response.json());
    }

    public async getDirectories(path: string): Promise<string[]> {
        return await fetch(`${this.SEVER_URL}/dir/${path}`)
            .then(response => response.json())
            .catch(() => []);
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

        if (this.fileCache['Scripture'][book]) {
            if (this.fileCache['Scripture'][book][chapter]) {
                if (this.fileCache['Scripture'][book][chapter][translation]) {
                    return this.fileCache['Scripture'][book][chapter][translation];
                }
            }
            else {
                this.fileCache['Scripture'][book][chapter] = {};
            }
        }
        else {
            this.fileCache['Scripture'][book] = { [chapter]: {} };
        }

        let result = await window.electronAPI.loadScripture(`${book}.${chapter}`, translation);
        if (!result) {
            // resort to fetching from the server
            result = super.loadScripture(book, chapter, translation);
            }
        // cache result
        this.fileCache['Scripture'][book][chapter][translation] = result;
        return result;
    }

    public async loadResource(path: string, fileName: string): Promise<any> {
        // currently we don't cache resources, as they are not expected to be accessed frequently
        const res = await window.electronAPI.loadResource(path, fileName);
        if (res) {
            return res;
        }
        // if the resource is not found, attempt to fetch it from the server
        return super.loadResource(path, fileName);
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
        const res = await window.electronAPI.getResourceChildren(path, mode);
        if (res && res.length > 0) {
            return res;
        }
        // if the resource is not found, attempt to fetch it from the server
        return super.getResourceChildren(path, mode);
    }

    public async getDirectories(path: string): Promise<string[]> {
        const localDirectories = await window.electronAPI.getDirectories(path);
        const serverDirectories = await super.getDirectories(path); // TODO: this should be separated, so as to not block
        return [...new Set([...localDirectories, ...serverDirectories])];
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

    public constructor() {
        super();
        this.manifest = {} as any;
        this.init();
    }

    private async init() {
        this.manifest = JSON.parse(await this.loadFile('manifest.json'));
    }

    private async loadFile(path: string): Promise<any> {
        const response = await fetch(`example/${path}`);
        if (response.status === 200) {
            return response.text();
        }
        return null;
    }

    public async loadScripture(book: string, chapter: string, translation?: string): Promise<any> {
        // TODO: caching
        let data = await this.loadFile(`Scripture/${translation}/${book}.${chapter}`);
        if (data) {
            try {
                return data ? JSON.parse(data) : null;
            } catch (e) {
                console.error('404: ' + `Scripture/${translation}/${book}.${chapter}`);
            }
        }
        return super.loadScripture(book, chapter, translation);
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

    public async getDirectories(path: string): Promise<string[]> {
        const pathList = path.split('/');
        let temp: any = this.manifest;
        pathList.forEach((dir) => {
            temp = temp[dir];
        });

        let localDirectories = [];
        if (temp) {
            localDirectories = Array.isArray(temp) ? temp : Object.keys(temp);
        }

        const serverDirectories = await super.getDirectories(path);
        return [...new Set([...localDirectories, ...serverDirectories])];
    }

}

export default FileManager;
