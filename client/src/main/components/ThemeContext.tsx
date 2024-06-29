import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import SettingsManager from '../utils/SettingsManager';

export type Theme = 'Light' | 'Dark' | 'Mixed' | undefined;

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
        console.warn('Theme:', theme);
        const primary = theme === 'Light' ? 'primary-light' : 'primary-dark';
        const secondary = theme === 'Dark' ? 'secondary-dark' : 'secondary-light';
        document.body.className = `${primary} ${secondary}`
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
