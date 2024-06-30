import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import SettingsManager from '../utils/SettingsManager';

export type Theme = 'light' | 'dark' | 'mixed1' | 'mixed2' | undefined;

interface ThemeContextProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {

    const [theme, setTheme] = useState<Theme>(undefined);

    useEffect(() => {
        SettingsManager.getInstance().awaitSetting('theme').then((theme) => {
            setTheme(theme as Theme);
        });
    }, []);

    useEffect(() => {
        if (theme) {
            const primary = theme === 'light' ? 'primary-light' : 'primary-dark';
            const secondary = (function () {
                switch (theme) {
                    case 'light':
                    case 'mixed1':
                        return 'secondary-light';
                    case 'dark':
                    case 'mixed2':
                        return 'secondary-dark';
                }
            })();
            const tertiary = (function () {
                switch (theme) {
                    case 'light':
                        return 'tertiary-light';
                    case 'mixed1':
                    case 'mixed2':
                        return 'tertiary-dark';
                    case 'dark':
                        return 'tertiary-darkest';
                }
            })();

            document.body.className = `${primary} ${secondary} ${tertiary}`
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
