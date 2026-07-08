import React, { createContext, useContext, useState, useEffect } from 'react';

// @audit-ok [Tema — contexto global de alternância entre tema claro e escuro, espelhado na classe do body]

const ThemeToggleContext = createContext();
export const useThemeToggle = () => useContext(ThemeToggleContext);
export const ThemeToggleProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    return document.body.classList.contains('dark-mode');
  });
  // @audit-info [Tema — sincroniza a classe 'dark-mode' do body a cada mudança de isDark]
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
