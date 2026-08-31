import styled from 'styled-components';
export const ProfileContainer = styled.div`
  padding: 24px;
  padding-bottom: 100px;
`;
export const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 24px;
`;
export const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;
export const SectionTitle = styled.h2`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
`;
export const FormGroup = styled.div``;
export const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
`;
export const Input = styled.input`
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid ${(props) => props.theme.borderColor};
  background: ${(props) => props.theme.bgSurface};
  color: ${(props) => props.theme.textPrimary};
`;
export const Select = styled.select`
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid ${(props) => props.theme.borderColor};
  background: ${(props) => props.theme.bgSurface};
  color: ${(props) => props.theme.textPrimary};
  outline: none;
`;
export const SubmitButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background: ${(props) => props.theme.primaryStrong};
  color: white;
  font-weight: 700;
  border: none;
  cursor: pointer;
  margin-top: 16px;
`;
export const LogoutButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.1);
  color: ${(props) => props.theme.dangerColor};
  border: 1px solid rgba(239, 68, 68, 0.3);
  font-weight: 700;
  cursor: pointer;
  margin-top: 32px;
`;
export const SettingsRow = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid ${(props) => props.theme.borderColor};
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: ${(props) => props.$clickable ? 'pointer' : 'default'};
  
  &:last-of-type {
    border-bottom: none;
  }

  .label {
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
  }
`;

// @audit-ok [E3.4 (item 2/4) — substitui o antigo ToggleSwitch binário (só
// claro/escuro, sem estado 'sistema' e sem foco de teclado). São botões
// nativos de verdade: Tab e Enter/Espaço funcionam sem cablagem extra.]
export const ThemeSegmentedControl = styled.div`
  display: flex;
  background: ${(props) => props.theme.borderColor};
  border-radius: 12px;
  padding: 3px;
  gap: 2px;
`;

export const ThemeOptionButton = styled.button`
  padding: 6px 12px;
  border-radius: 9px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => props.$active ? props.theme.bgSurface : 'transparent'};
  color: ${(props) => props.$active ? props.theme.primaryColor : props.theme.textSecondary};
  box-shadow: ${(props) => props.$active ? '0 1px 3px rgba(0,0,0,0.15)' : 'none'};
  transition: all 0.2s ease;

  &:focus-visible {
    outline: 2px solid ${(props) => props.theme.primaryColor};
    outline-offset: 2px;
  }
`;
