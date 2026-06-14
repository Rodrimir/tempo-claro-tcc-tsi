// @audit-ok: FRONTEND-styles.js-01
import styled, { keyframes } from 'styled-components';

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

export const LoginContainer = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  justify-content: center;
`;

export const MenuBtn = styled.button`
  position: absolute;
  top: 24px;
  right: 24px;
  background: none;
  border: none;
  cursor: pointer;
  color: ${({ theme }) => theme.textPrimary};
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const HeaderWrapper = styled.div`
  text-align: center;
  margin-bottom: 32px;
`;

export const LogoWrapper = styled.div`
  width: 160px;
  height: 160px;
  overflow: hidden;
  border-radius: 50%;
  margin: 0 auto 24px;
  animation: ${float} 4s ease-in-out infinite;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

export const Title = styled.h1`
  font-size: 32px;
  font-weight: 800;
  color: ${({ theme }) => theme.primaryColor};
  margin-bottom: 8px;
`;

export const Subtitle = styled.p`
  color: ${({ theme }) => theme.textSecondary};
`;

export const TabContainer = styled.div`
  display: flex;
  background: ${({ theme }) => theme.borderColor};
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;
`;

export const TabButton = styled.button`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  background: ${({ theme, $active }) => ($active ? theme.bgSurface : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.textPrimary : theme.textSecondary)};
  box-shadow: ${({ $active }) => ($active ? '0 2px 4px rgba(0,0,0,0.1)' : 'none')};
`;

export const FormContainer = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const Label = styled.label`
  font-weight: 600;
  font-size: 14px;
`;

export const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${({ theme }) => theme.borderColor};
  border-radius: 12px;
  font-size: 16px;
  background: ${({ theme }) => theme.bgSurface};
  color: ${({ theme }) => theme.textPrimary};
`;

export const SubmitButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme, disabled }) => (disabled ? theme.primaryLight : theme.primaryColor)};
  color: ${({ theme, disabled }) => (disabled ? theme.primaryColor : 'white')};
  font-weight: 700;
  font-size: 16px;
  border: none;
  margin-top: 8px;
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

export const Spinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid ${({ theme }) => theme.primaryColor};
  border-top-color: transparent;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

export const Divider = styled.div`
  text-align: center;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  margin: 16px 0;
  font-weight: 600;
`;

export const GoogleButton = styled.button`
  width: 100%;
  padding: 16px;
  font-size: 16px;
  background: ${({ theme }) => theme.bgSurface};
  border: 2px solid ${({ theme }) => theme.borderColor};
  color: ${({ theme }) => theme.textPrimary};
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
`;

export const SettingsModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: fade-in 0.3s ease-out;
`;

export const SettingsModalContent = styled.div`
  width: 100%;
  max-width: 432px;
  background: ${({ theme }) => theme.bgSurface};
  border-radius: 20px;
  padding: 24px;
  text-align: left;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  
  h3 {
    font-size: 20px;
    margin-bottom: 24px;
  }
`;

export const SettingsRow = styled.div`
  padding: 16px 0;
  border-bottom: 1px solid ${({ theme }) => theme.borderColor};
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: ${({ $clickable }) => ($clickable ? 'pointer' : 'default')};
  
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

export const ToggleSwitch = styled.div`
  width: 40px;
  height: 24px;
  background: ${({ theme, $active }) => ($active ? theme.primaryColor : theme.borderColor)};
  border-radius: 12px;
  position: relative;
  transition: background 0.3s;
  
  .dot {
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    position: absolute;
    left: ${({ $active }) => ($active ? '18px' : '2px')};
    top: 2px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    transition: left 0.3s;
  }
`;

export const LanguageButton = styled.button`
  background: ${({ theme }) => theme.primaryLight};
  border: 2px solid ${({ theme }) => theme.primaryColor};
  border-radius: 8px;
  padding: 4px 8px;
  font-size: 16px;
  cursor: pointer;
  color: ${({ theme }) => theme.textPrimary};
`;

export const SettingsCloseButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background: ${({ theme }) => theme.bgSurface};
  border: 1px solid ${({ theme }) => theme.borderColor};
  color: ${({ theme }) => theme.textPrimary};
  font-weight: 700;
  font-size: 16px;
  margin-top: 16px;
  cursor: pointer;
`;
