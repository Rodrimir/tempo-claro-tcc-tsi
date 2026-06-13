import React from 'react';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from './styles/GlobalStyles';
import { lightTheme, darkTheme } from './styles/theme';

import { useThemeToggle } from './contexts/ThemeToggleContext';
import AppRoutes from './routes';

const App = () => {
  const { isDark } = useThemeToggle();
  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <GlobalStyle />
      <AppRoutes />
    </ThemeProvider>
  );
};

export default App;