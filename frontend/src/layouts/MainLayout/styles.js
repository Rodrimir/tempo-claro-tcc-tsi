import styled from 'styled-components';

// @audit-ok [MainLayout — estilos (styled-components) do layout principal: área rolável + nav fixa]

export const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: ${(props) => props.theme.bgPrimary};
`;
export const MainContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;
