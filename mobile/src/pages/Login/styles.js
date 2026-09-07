import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';
import { fonts } from '../../styles/fonts';

export const LoginContainer = styled.View`
  flex: 1;
  padding: 24px;
  justify-content: center;
  background-color: ${(props) => props.theme.bgPrimary};
`;

export const MenuBtn = styled(Pressable)`
  position: absolute;
  top: 24px;
  right: 24px;
`;

export const HeaderWrapper = styled.View`
  align-items: center;
  margin-bottom: 32px;
`;

export const LogoWrapper = styled(Animated.View)`
  width: 160px;
  height: 160px;
  overflow: hidden;
  border-radius: 80px;
  margin-bottom: 24px;
`;

export const LogoImage = styled(Image)`
  width: 100%;
  height: 100%;
`;

export const Title = styled.Text`
  font-family: ${fonts.extraBold};
  font-size: 32px;
  color: ${(props) => props.theme.primaryColor};
  margin-bottom: 8px;
`;

export const Subtitle = styled.Text`
  color: ${(props) => props.theme.textSecondary};
`;

export const TabContainer = styled.View`
  flex-direction: row;
  background-color: ${(props) => props.theme.borderColor};
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 24px;
`;

export const TabButton = styled(Pressable)`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  align-items: center;
  background-color: ${(props) => (props.$active ? props.theme.bgSurface : 'transparent')};
  elevation: ${(props) => (props.$active ? 2 : 0)};
`;

export const TabButtonText = styled.Text`
  font-family: ${fonts.semiBold};
  color: ${(props) => (props.$active ? props.theme.textPrimary : props.theme.textSecondary)};
`;

export const FormContainer = styled.View`
  gap: 16px;
`;

export const FormGroup = styled.View`
  gap: 8px;
`;

export const Label = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 14px;
  color: ${(props) => props.theme.textPrimary};
`;

export const Input = styled.TextInput`
  width: 100%;
  padding: 12px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  border-radius: 12px;
  font-size: 16px;
  background-color: ${(props) => props.theme.bgSurface};
  color: ${(props) => props.theme.textPrimary};
`;

export const ErrorText = styled.Text`
  font-size: 12px;
  color: ${(props) => props.theme.dangerColor};
`;

export const SubmitButton = styled(Pressable)`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background-color: ${(props) => (props.disabled ? props.theme.primaryLight : props.theme.primaryStrong)};
  margin-top: 8px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

export const SubmitButtonText = styled.Text`
  font-family: ${fonts.bold};
  font-size: 16px;
  color: ${(props) => (props.disabled ? props.theme.primaryColor : 'white')};
`;

export const SettingsModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(15, 23, 42, 0.85);
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const SettingsModalContent = styled.View`
  width: 100%;
  max-width: 432px;
  background-color: ${(props) => props.theme.bgSurface};
  border-radius: 20px;
  padding: 24px;
  elevation: 8;
`;

export const ModalTitle = styled.Text`
  font-family: ${fonts.bold};
  font-size: 20px;
  margin-bottom: 24px;
  color: ${(props) => props.theme.textPrimary};
`;

export const SettingsRow = styled.View`
  padding: 16px 0px;
  border-bottom-width: ${(props) => (props.$last ? '0px' : '1px')};
  border-bottom-color: ${(props) => props.theme.borderColor};
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const SettingsRowLabel = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
`;

export const SettingsRowLabelText = styled.Text`
  font-family: ${fonts.semiBold};
  color: ${(props) => props.theme.textPrimary};
`;

export const ThemeSegmentedControl = styled.View`
  flex-direction: row;
  background-color: ${(props) => props.theme.borderColor};
  border-radius: 12px;
  padding: 3px;
  gap: 2px;
`;

export const ThemeOptionButton = styled(Pressable)`
  padding: 6px 12px;
  border-radius: 9px;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => (props.$active ? props.theme.bgSurface : 'transparent')};
`;

export const LanguageChip = styled.View`
  background-color: ${(props) => props.theme.primaryLight};
  border-width: 2px;
  border-color: ${(props) => props.theme.primaryColor};
  border-radius: 8px;
  padding: 4px 8px;
`;

export const LanguageChipText = styled.Text`
  font-size: 16px;
  color: ${(props) => props.theme.textPrimary};
`;

export const SettingsCloseButton = styled(Pressable)`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background-color: ${(props) => props.theme.bgSurface};
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  align-items: center;
  margin-top: 16px;
`;

export const SettingsCloseButtonText = styled.Text`
  font-family: ${fonts.bold};
  font-size: 16px;
  color: ${(props) => props.theme.textPrimary};
`;
