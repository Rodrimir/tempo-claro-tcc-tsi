import { createGlobalStyle } from 'styled-components';

// @audit-info : Styled Components
export const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;500;600;700;800&display=swap');
  :root {
    --primary-color: ${(props) => props.theme.primaryColor};
    --primary-light: ${(props) => props.theme.primaryLight};
    --bg-primary: ${(props) => props.theme.bgPrimary};
    --bg-surface: ${(props) => props.theme.bgSurface};
    --text-primary: ${(props) => props.theme.textPrimary};
    --text-secondary: ${(props) => props.theme.textSecondary};
    --success-color: ${(props) => props.theme.successColor};
    --warning-color: ${(props) => props.theme.warningColor};
    --danger-color: ${(props) => props.theme.dangerColor};
    --border-color: ${(props) => props.theme.borderColor};
  }
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: 'Lexend', sans-serif;
    background-color: ${(props) => props.theme.bgPrimary};
    color: ${(props) => props.theme.textPrimary};
    -webkit-font-smoothing: antialiased;
    transition: background-color 0.3s ease, color 0.3s ease;
  }
  .btn {
    font-family: 'Lexend', sans-serif;
    transition: all 0.2s ease;
  }
  .btn:active {
    transform: scale(0.98);
  }
`;
