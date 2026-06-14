// @audit-ok: FRONTEND-ThemeToggleContext.jsx-01
import React, { createContext, useContext, useState, useEffect } from 'react';
const ThemeToggleContext = createContext();
export const useThemeToggle = () => useContext(ThemeToggleContext);
export const ThemeToggleProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    return document.body.classList.contains('dark-mode');
  });
  useEffect(() => {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDark]);
  const toggleTheme = () => setIsDark(!isDark);
  return (
    <ThemeToggleContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeToggleContext.Provider>
  );
};
