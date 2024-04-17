

class FileManager {
    private static instance: FileManager;
    private constructor() { }

    public static getInstance(): FileManager {
        if (!FileManager.instance) {
            FileManager.instance = new FileManager();
        }
        return FileManager.instance;
    }

    private scriptureCache: any = {};

    public async loadScripture(book: string, chapter: string, translation?: string): Promise<any> {

        if (!translation) {
            translation = 'NKJV'; // TODO: make this a setting
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

    public async loadNotes(group: string, book: string, chapter: string): Promise<any> {
        return await window.electronAPI.loadNotes(group, book, chapter);
    }

    public async saveNote(id: string, selectedNoteGroup: string, book: string, chapter: string, newNoteContents: any): Promise<boolean> {
        return await window.electronAPI.saveNote(id, selectedNoteGroup, book, chapter, newNoteContents);
    }

    public async deleteNote(id: string, selectedNoteGroup: string, book: string, chapter: string): Promise<boolean> {
        return await window.electronAPI.deleteNote(id, selectedNoteGroup, book, chapter);
    }
}

export default FileManager;
