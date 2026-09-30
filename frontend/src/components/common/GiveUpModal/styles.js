import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '../../../styles/fonts';

export const Overlay = styled.View`
  flex: 1;
  background-color: rgba(15, 23, 42, 0.85);
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const ModalCard = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  width: 100%;
  border-radius: 24px;
  padding: 24px;
  align-items: center;
`;

export const Title = styled.Text`
  font-family: ${fonts.bold};
  font-size: 20px;
  margin-bottom: 8px;
  color: ${(props) => props.theme.textPrimary};
  text-align: center;
`;

export const Subtitle = styled.Text`
  font-size: 14px;
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 24px;
  text-align: center;
`;

export const ButtonContainer = styled.View`
  width: 100%;
  gap: 12px;
`;

export const PrimaryButton = styled(Pressable)`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background-color: ${(props) => props.theme.successStrong};
  align-items: center;
  elevation: 4;
`;

export const PrimaryButtonText = styled.Text`
  font-family: ${fonts.bold};
  color: white;
  font-size: 18px;
`;

export const ShieldButton = styled(Pressable)`
  padding: 16px;
  border-radius: 12px;
  background-color: ${(props) => props.theme.warningStrong};
  align-items: center;
  margin-top: 8px;
`;

export const ShieldButtonText = styled.Text`
  font-family: ${fonts.bold};
  color: white;
  font-size: 16px;
`;

export const DangerButton = styled(Pressable)`
  padding: 16px;
  border-radius: 12px;
  background-color: rgba(239, 68, 68, 0.1);
  border-width: 1px;
  border-color: rgba(239, 68, 68, 0.3);
  align-items: center;
  margin-top: 8px;
`;

export const DangerButtonText = styled.Text`
  font-family: ${fonts.semiBold};
  color: ${(props) => props.theme.dangerColor};
  font-size: 16px;
`;
