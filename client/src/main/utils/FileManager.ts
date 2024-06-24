import { isElectronApp } from "./general";
import SettingsManager from "./SettingsManager";

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
                const electronFileManager = new ElectronFileManager();
                electronFileManager.loadLocalConcordance('strongs');
                FileManager.instance = electronFileManager;
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
        'concordance': {},
    };
    protected downloadedDirectories: any = {
        'resources': {},
        'Scripture': {},
    };
    protected concordanceData: any = null;
    protected settings = SettingsManager.getInstance();

    private async findDownloadedDirectories() {
        const waitForNonNullInstance = setInterval(() => {
            if (FileManager.instance === null) {
                return;
            }
            clearInterval(waitForNonNullInstance);

            FileManager.instance.getDirectories('resources').then((dirs) => {
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

    public async loadScripture(book: string, chapter: string, translation?: string, interlinear=false): Promise<any> {
        const mode = interlinear ? 'interlinear' : 'Scripture';
        return await fetch(`${this.SEVER_URL}/file/${mode}/${translation}/${book}.${chapter}`)
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

    public async getDirectories(path: string): Promise<any[]> {
        return await fetch(`${this.SEVER_URL}/dir/${path}`)
            .then(response => response.json())
            .catch(() => []);
    }

    public async loadFromConcordance(strongsNumber: string): Promise<any> {
        return await fetch(`${this.SEVER_URL}/data/strongs/${strongsNumber}`)
            .then(response => response.json())
            .then(data => {
                this.fileCache['concordance'][strongsNumber] = data; // cache result
                return data;
            });
    }

}

/**
 * A file manager that uses the electron API to load files from the file system.
 * @extends FileManager
 */
class ElectronFileManager extends FileManager {

    public async loadScripture(book: string, chapter: string, translation?: string, interlinear=false): Promise<any> {

        if (!translation) {
            translation = this.settings.getSetting('defaultTranslation');
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

        const mode = interlinear ? 'interlinear' : 'Scripture';
        let result = await window.electronAPI.loadScripture(`${book}.${chapter}`, translation, mode);
        if (!result) {
            // resort to fetching from the server
            result = super.loadScripture(book, chapter, translation, interlinear);
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

    public async getDirectories(path: string): Promise<any[]> {
        const directories: any = {};

        const localDirectories = await window.electronAPI.getDirectories(path);
        const serverDirectories = await super.getDirectories(path); // TODO: this should be separated, so as to not block

        localDirectories.forEach((dir: any) => {
            if (!directories[dir.path]) {
                directories[dir.path] = dir;
            }
        });
        serverDirectories.forEach((dir: any) => {
            if (!directories[dir.path]) {
                directories[dir.path] = dir;
            }
        });

        return Object.values(directories);
    }

    /**
     * If possible, fetch entry from the cached concordance. Otherwise, resort to fetching from the server.
     * @param strongsNumber
     * @returns
     */
    public async loadFromConcordance(strongsNumber: string): Promise<any> {

        if (this.concordanceData === null) {
            await new Promise<void>((resolve) => {
                const interval = setInterval(() => {
                    if (this.concordanceData !== null) {
                        clearInterval(interval);
                        resolve();
                    }
                }, 10);
            });
        }
        if (this.concordanceData[strongsNumber]) {
            return this.concordanceData[strongsNumber];
        }
        // if the concordance is not found, attempt to fetch it from the server
        return super.loadFromConcordance(strongsNumber);
    }

    /**
     * Attempt to load a whole concordance from the local file system.
     * @param concordanceName
     */
    public loadLocalConcordance(concordanceName: string): void {
        window.electronAPI.loadConcordance(concordanceName)
            .then((concordance: any) => {
                    if (concordance) {
                        this.concordanceData = concordance;
                        console.log('Concordance loaded', concordance);
                    }
            });
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

    public async loadScripture(book: string, chapter: string, translation?: string, interlinear=false): Promise<any> {
        // TODO: caching
        let data = await this.loadFile(`Scripture/${translation}/${book}.${chapter}`);
        if (data) {
            try {
                return data ? JSON.parse(data) : null;
            } catch (e) {
                console.error('404: ' + `Scripture/${translation}/${book}.${chapter}`);
            }
        }
        return super.loadScripture(book, chapter, translation, interlinear);
    }

    public async loadNotes(group: string, book: string, chapter: string): Promise<any> {
        const notes: any = this.manifest.notes[group];

        if (notes) {
            return await Promise.all(
                notes[book][chapter].map(async (note: string) => {
                    const data = JSON.parse(await this.loadFile(`notes/${group}/${book}/${chapter}/${note}`));
                    data.id = note;
                    return data;
                })
            );
        }
        return [];
    }

    public async getDirectories(path: string): Promise<any[]> {
        const pathList = path.split('/');
        let temp: any = this.manifest;
        pathList.forEach((dir) => {
            temp = temp[dir];
        });

        let localDirectories = [];
        if (temp) {
            const tempDirectories = Array.isArray(temp) ? temp : Object.keys(temp);
            for (const dir of tempDirectories) {
                if (typeof dir === 'string') {
                    localDirectories.push({ path: dir, state: 'demo' });
                }
                else {
                    dir.state = 'demo';
                    localDirectories.push(dir);
                }
            }
        }

        const serverDirectories = await super.getDirectories(path);
        return [...new Set([...localDirectories, ...serverDirectories])];
    }

}

export default FileManager;
