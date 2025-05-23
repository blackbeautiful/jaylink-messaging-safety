/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect, createContext, useContext } from 'react';

interface EnhancedSettings {
  reducedMotion: boolean;
  compactView: boolean;
  highContrast: boolean;
}

interface EnhancedSettingsContext {
  settings: EnhancedSettings;
  updateSettings: (settings: Partial<EnhancedSettings>) => void;
}

const defaultSettings: EnhancedSettings = {
  reducedMotion: false,
  compactView: false,
  highContrast: false,
};

// Create context
const EnhancedSettingsContext = createContext<EnhancedSettingsContext>({
  settings: defaultSettings,
  updateSettings: () => {},
});

// Create provider component
export function EnhancedSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<EnhancedSettings>(() => {
    // Check if settings exist in localStorage
    const savedSettings = localStorage.getItem('enhanced-settings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (error) {
        console.error('Failed to parse settings:', error);
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Update settings function
  const updateSettings = (newSettings: Partial<EnhancedSettings>) => {
    setSettings((prevSettings) => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      localStorage.setItem('enhanced-settings', JSON.stringify(updatedSettings));
      return updatedSettings;
    });
  };

  // Apply settings effects when they change
  useEffect(() => {
    // Apply reduced motion
    if (settings.reducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    // Apply compact view
    if (settings.compactView) {
      document.documentElement.classList.add('compact-view');
    } else {
      document.documentElement.classList.remove('compact-view');
    }

    // Apply high contrast
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [settings]);

  return (
    <EnhancedSettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </EnhancedSettingsContext.Provider>
  );
}

// Custom hook to use the context
export function useEnhancedSettings() {
  const context = useContext(EnhancedSettingsContext);

  if (context === undefined) {
    throw new Error('useEnhancedSettings must be used within an EnhancedSettingsProvider');
  }

  return context;
}
