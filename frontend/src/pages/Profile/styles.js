// @audit-ok: FRONTEND-styles.js-01
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
export const StoreBanner = styled.div`
  background: ${(props) => props.theme.primaryLight};
  padding: 16px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 32px;
  cursor: pointer;
`;
export const BannerContent = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;
export const BannerIcon = styled.div`
  background: ${(props) => props.theme.primaryColor};
  color: white;
  padding: 8px;
  border-radius: 50%;
`;
export const BannerTitle = styled.h3`
  font-weight: 700;
  font-size: 16px;
  color: ${(props) => props.theme.textPrimary};
`;
export const BannerText = styled.p`
  font-size: 12px;
  color: ${(props) => props.theme.textSecondary};
`;
export const BannerAction = styled.div`
  font-weight: 700;
  color: ${(props) => props.theme.primaryColor};
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
  background: ${(props) => props.theme.primaryColor};
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
export const StoreModalOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;
export const StoreModalContent = styled.div`
  background: ${(props) => props.theme.bgSurface};
  width: 100%;
  border-radius: 24px;
  padding: 24px;
  text-align: center;
`;
export const ModalIconWrapper = styled.div`
  background: ${(props) => props.theme.primaryLight};
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: ${(props) => props.theme.primaryColor};
`;
export const ModalTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
`;
export const ModalText = styled.p`
  font-size: 14px;
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 24px;
`;
export const ModalSelect = styled(Select)`
  margin-bottom: 24px;
  font-size: 16px;
  background: ${(props) => props.theme.bgPrimary};
`;
export const ModalBuyButton = styled(SubmitButton)`
  margin-bottom: 12px;
  margin-top: 0;
`;
export const ModalCancelButton = styled.button`
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  background: transparent;
  color: ${(props) => props.theme.textSecondary};
  font-weight: 600;
  border: none;
  cursor: pointer;
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

export const ToggleSwitch = styled.div`
  width: 40px;
  height: 24px;
  background: ${(props) => props.$active ? props.theme.primaryColor : props.theme.borderColor};
  border-radius: 12px;
  position: relative;
  transition: background 0.3s;
  
  .dot {
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    position: absolute;
    left: ${(props) => props.$active ? '18px' : '2px'};
    top: 2px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    transition: left 0.3s;
  }
`;
