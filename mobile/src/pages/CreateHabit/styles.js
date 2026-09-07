import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '../../styles/fonts';

export const Container = styled.ScrollView.attrs((props) => ({
  contentContainerStyle: { padding: 24, paddingTop: 24 + (props.$insetTop || 0), paddingBottom: 100, gap: 24 },
}))`
  flex: 1;
  background-color: ${(props) => props.theme.bgPrimary};
`;

export const Header = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 16px;
`;

export const BackButton = styled(Pressable)``;

export const HeaderText = styled.View``;

export const Title = styled.Text`
  font-family: ${fonts.bold};
  font-size: 24px;
  color: ${(props) => props.theme.textPrimary};
`;

export const Subtitle = styled.Text`
  color: ${(props) => props.theme.textSecondary};
  font-size: 14px;
`;

export const StepContainer = styled.View``;

export const StepTitle = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 18px;
  margin-bottom: 16px;
  color: ${(props) => props.theme.textPrimary};
`;

export const MoldeScrollContentContainer = { gap: 16, paddingHorizontal: 24, paddingVertical: 16 };

export const MoldeCard = styled(Pressable)`
  width: 240px;
  background-color: ${(props) => (props.$active ? props.theme.primaryLight : props.theme.bgSurface)};
  border-width: 2px;
  border-color: ${(props) => (props.$active ? props.theme.primaryColor : 'transparent')};
  border-radius: 24px;
  padding: 24px;
  align-items: center;
`;

export const MoldeEmoji = styled.Text`
  font-size: 64px;
  margin-bottom: 16px;
`;

export const MoldeTitle = styled.Text`
  font-family: ${fonts.bold};
  font-size: 20px;
  margin-bottom: 8px;
  color: ${(props) => props.theme.textPrimary};
`;

export const MoldeDesc = styled.Text`
  font-size: 14px;
  color: ${(props) => props.theme.textSecondary};
  text-align: center;
`;

export const NextButton = styled(Pressable)`
  width: 100%;
  margin-top: 24px;
  padding: 20px;
  border-radius: 9999px;
  background-color: ${(props) => props.theme.primaryStrong};
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;
  elevation: 6;
`;

export const NextButtonText = styled.Text`
  font-family: ${fonts.bold};
  color: white;
  font-size: 18px;
`;

export const OptionsContainer = styled.View`
  gap: 16px;
`;

export const OptionCard = styled(Pressable)`
  padding: 24px;
  background-color: ${(props) => props.theme.bgSurface};
  border-radius: 16px;
  border-width: ${(props) => (props.$primary ? '2px' : '1px')};
  border-color: ${(props) => (props.$primary ? props.theme.primaryColor : props.theme.borderColor)};
  flex-direction: row;
  align-items: center;
  gap: 16px;
`;

export const StaticOptionCard = styled.View`
  padding: 24px;
  background-color: ${(props) => props.theme.bgSurface};
  border-radius: 16px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  border-style: dashed;
  flex-direction: row;
  align-items: center;
  gap: 16px;
  opacity: 0.6;
`;

export const OptionIconWrapper = styled.View`
  background-color: ${(props) => props.theme.primaryLight};
  padding: 12px;
  border-radius: 24px;
`;

export const OptionText = styled.View`
  flex: 1;
`;

export const OptionTitle = styled.Text`
  font-family: ${fonts.bold};
  font-size: 16px;
  color: ${(props) => props.theme.textPrimary};
`;

export const OptionSubtitle = styled.Text`
  font-size: 12px;
  color: ${(props) => props.theme.textSecondary};
`;

export const FormSection = styled.View`
  gap: 20px;
`;

export const FormCard = styled.View`
  gap: 16px;
  background-color: ${(props) => props.theme.bgSurface};
  padding: 20px;
  border-radius: 16px;
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
  border-width: 1px;
  border-color: ${(props) => (props.$error ? props.theme.dangerColor : props.theme.borderColor)};
  border-radius: 12px;
  font-size: 16px;
  background-color: ${(props) => props.theme.bgPrimary};
  color: ${(props) => props.theme.textPrimary};
`;

export const ErrorText = styled.Text`
  color: ${(props) => props.theme.dangerColor};
  font-size: 12px;
  margin-top: 6px;
`;

export const GridRow = styled.View`
  flex-direction: row;
  gap: 12px;
`;

export const GridCell = styled.View`
  flex: 1;
`;

export const OcorrenciaRow = styled.View`
  padding: 12px 0px;
  border-top-width: ${(props) => (props.$primeira ? '0px' : '1px')};
  border-top-color: ${(props) => props.theme.borderColor};
`;

export const OcorrenciaAlvo = styled.Text`
  font-family: ${fonts.bold};
  font-size: 14px;
  color: ${(props) => props.theme.primaryColor};
  margin-bottom: 8px;
`;

export const WeekDaysContainer = styled.View`
  flex-direction: row;
  gap: 8px;
  justify-content: space-between;
`;

export const DayButton = styled(Pressable)`
  min-width: 40px;
  height: 32px;
  padding: 0px 4px;
  border-radius: 10px;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => (props.$active ? props.theme.primaryStrong : props.theme.bgPrimary)};
`;

export const DayButtonText = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 11px;
  color: ${(props) => (props.$active ? 'white' : props.theme.textSecondary)};
`;

export const ReviewCard = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  padding: 24px;
  border-radius: 16px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
`;

export const ReviewText = styled.Text`
  font-size: 16px;
  line-height: 27px;
  color: ${(props) => props.theme.textPrimary};
`;

export const ReviewStrong = styled.Text`
  font-family: ${fonts.bold};
  color: ${(props) => props.theme.primaryColor};
`;

export const SubmitButton = styled(Pressable)`
  width: 100%;
  padding: 20px;
  border-radius: 9999px;
  background-color: ${(props) => (props.disabled ? props.theme.primaryLight : props.theme.primaryStrong)};
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;
  elevation: ${(props) => (props.disabled ? 0 : 6)};
`;

export const SubmitButtonText = styled.Text`
  font-family: ${fonts.bold};
  font-size: 18px;
  color: ${(props) => (props.disabled ? props.theme.primaryColor : 'white')};
`;
