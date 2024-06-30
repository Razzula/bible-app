import { isElectronApp } from "./general";

type Settings = {
    defaultTranslation: string;
    theme: string;
};

/**
 * A settings manager that provides methods to get and set settings.
 */
class SettingsManager {

    private static instance: SettingsManager;
    protected constructor() {
        void this.loadSettings();
    }

    public static getInstance(): SettingsManager {
        if (!SettingsManager.instance) {
            SettingsManager.instance = new SettingsManager();
        }
        return SettingsManager.instance;
    }

    private async loadSettings(): Promise<void> {
        if (isElectronApp()) {
            const settings = await window.electronAPI.loadSettings();
            this.settings = settings || this.defaultSettings();
        } else {
            this.settings = this.defaultSettings();
        }
    }

    private settings: any = {};

    public defaultSettings(): Settings {
        return {
            defaultTranslation: 'WEBBE',
            theme: 'mixed1',
        };
    }

    public getSetting(key: string): string {
        return this.settings[key];
    }

    public async awaitSetting(key: string): Promise<string> {
        if (!this.settings[key]) {
            await this.loadSettings();
        }
        return this.settings[key];
    }

    public setSetting(key: string, value: any): void {
        if (this.settings[key] !== value) {
            this.settings[key] = value;
            if (isElectronApp()) {
                void window.electronAPI.saveSettings(this.settings);
            }
        }
    }

}

export default SettingsManager;
