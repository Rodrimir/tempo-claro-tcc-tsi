import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '../../styles/fonts';

export const Container = styled.ScrollView.attrs((props) => ({
  contentContainerStyle: {
    padding: 24,
    paddingTop: 16 + (props.$insetTop || 0),
    paddingBottom: 60,
    flexGrow: 1,
    justifyContent: 'center',
  },
}))`
  flex: 1;
  background-color: ${(props) => props.theme.bgPrimary};
`;

export const BackButton = styled(Pressable)`
  position: absolute;
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
`;

export const Title = styled.Text`
  font-family: ${fonts.bold};
  font-size: 22px;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 8px;
  text-align: center;
`;

export const Subtitle = styled.Text`
  font-size: 14px;
  line-height: 20px;
  color: ${(props) => props.theme.textSecondary};
  text-align: center;
  margin-bottom: 28px;
`;

export const Card = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  border-radius: 20px;
  padding: 22px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  gap: 18px;
`;

export const FormGroup = styled.View`
  gap: 8px;
`;

export const Label = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 14px;
  color: ${(props) => props.theme.textPrimary};
`;

export const CodeInput = styled.TextInput.attrs((props) => ({
  placeholderTextColor: props.theme.textSecondary,
  keyboardType: 'number-pad',
  maxLength: 6,
}))`
  width: 100%;
  padding: 14px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  border-radius: 12px;
  font-family: ${fonts.bold};
  font-size: 24px;
  letter-spacing: 8px;
  text-align: center;
  background-color: ${(props) => props.theme.bgPrimary};
  color: ${(props) => props.theme.textPrimary};
`;

export const ErrorText = styled.Text`
  color: ${(props) => props.theme.dangerColor};
  font-size: 13px;
`;

export const PrimaryButton = styled(Pressable)`
  width: 100%;
  padding: 17px;
  border-radius: 9999px;
  background-color: ${(props) => (props.$disabled ? props.theme.borderColor : props.theme.primaryStrong)};
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

export const PrimaryButtonText = styled.Text`
  font-family: ${fonts.bold};
  font-size: 17px;
  color: ${(props) => (props.$disabled ? props.theme.textSecondary : 'white')};
`;

export const ResendRow = styled.View`
  align-items: center;
  margin-top: 4px;
`;

export const ResendLink = styled(Pressable)`
  padding: 8px;
`;

export const ResendText = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 14px;
  color: ${(props) => (props.$disabled ? props.theme.textSecondary : props.theme.primaryColor)};
`;
