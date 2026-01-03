'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage for saved preference - default to light mode
    const savedTheme = localStorage.getItem('fcc-theme');
    const themeMigrated = localStorage.getItem('fcc-theme-migrated-v2');
    
    // Force migration to light mode for existing users (one-time reset)
    if (!themeMigrated) {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fcc-theme', 'light');
      localStorage.setItem('fcc-theme-migrated-v2', 'true');
      return;
    }
    
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      // Default to light mode regardless of system preference
      // Users can manually enable dark mode if they want
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
      localStorage.setItem('fcc-theme', 'light');
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      // Save to localStorage
      localStorage.setItem('fcc-theme', darkMode ? 'dark' : 'light');
      // Update document class for Tailwind dark mode
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode, mounted]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Prevent flash of incorrect theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
