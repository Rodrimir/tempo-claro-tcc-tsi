import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '../../styles/fonts';

export const ProfileContainer = styled.ScrollView.attrs(() => ({
  contentContainerStyle: { padding: 24, paddingBottom: 100 },
}))`
  flex: 1;
`;

export const Title = styled.Text`
  font-family: ${fonts.bold};
  font-size: 24px;
  margin-bottom: 24px;
  color: ${(props) => props.theme.textPrimary};
`;

export const FormContainer = styled.View`
  gap: 16px;
`;

export const SectionTitle = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 18px;
  margin-bottom: 8px;
  color: ${(props) => props.theme.textPrimary};
`;

export const FormGroup = styled.View``;

export const Label = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 14px;
  margin-bottom: 8px;
  color: ${(props) => props.theme.textPrimary};
`;

export const Input = styled.TextInput`
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  background-color: ${(props) => props.theme.bgSurface};
  color: ${(props) => props.theme.textPrimary};
`;

export const ErrorText = styled.Text`
  font-size: 12px;
  color: ${(props) => props.theme.dangerColor};
  margin-top: 4px;
`;

export const SelectField = styled(Pressable)`
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  background-color: ${(props) => props.theme.bgSurface};
`;

export const SelectFieldText = styled.Text`
  color: ${(props) => props.theme.textPrimary};
`;

export const SubmitButton = styled(Pressable)`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background-color: ${(props) => props.theme.primaryStrong};
  align-items: center;
  margin-top: 16px;
`;

export const SubmitButtonText = styled.Text`
  font-family: ${fonts.bold};
  color: white;
`;

export const LogoutButton = styled(Pressable)`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background-color: rgba(239, 68, 68, 0.1);
  border-width: 1px;
  border-color: rgba(239, 68, 68, 0.3);
  align-items: center;
  margin-top: 32px;
`;

export const LogoutButtonText = styled.Text`
  font-family: ${fonts.bold};
  color: ${(props) => props.theme.dangerColor};
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

export const LanguageChip = styled.View`
  background-color: ${(props) => props.theme.primaryLight};
  border-width: 2px;
  border-color: ${(props) => props.theme.primaryColor};
  border-radius: 8px;
  padding: 4px 8px;
`;

export const LanguageChipText = styled.Text`
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

export const PickerOverlay = styled(Pressable)`
  flex: 1;
  background-color: rgba(15, 23, 42, 0.85);
  justify-content: flex-end;
`;

export const PickerSheet = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 24px;
  max-height: 70%;
`;

export const PickerGroupLabel = styled.Text`
  font-family: ${fonts.bold};
  font-size: 12px;
  text-transform: uppercase;
  color: ${(props) => props.theme.textSecondary};
  margin-top: 16px;
  margin-bottom: 4px;
`;

export const PickerOption = styled(Pressable)`
  padding: 14px 8px;
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.borderColor};
`;

export const PickerOptionText = styled.Text`
  font-size: 15px;
  color: ${(props) => props.theme.textPrimary};
`;
