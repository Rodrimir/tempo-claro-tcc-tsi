import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { fonts } from '../../styles/fonts';

export const ExecutionContainer = styled.View`
  flex: 1;
  background-color: ${(props) => props.theme.bgSurface};
  padding: 24px;
`;

export const HeaderWrapper = styled.View`
  align-items: center;
  margin-bottom: 40px;
  margin-top: 20px;
`;

export const HeaderLabel = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 20px;
  color: ${(props) => props.theme.textSecondary};
`;

export const HeaderTitle = styled.Text`
  font-family: ${fonts.extraBold};
  font-size: 32px;
  text-align: center;
  color: ${(props) => props.theme.textPrimary};
`;

export const ContentWrapper = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

export const ControlsWrapper = styled.View`
  flex-direction: row;
  gap: 24px;
  margin-top: 40px;
`;

export const SubButton = styled(Pressable)`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.theme.bgPrimary};
  elevation: 2;
`;

export const SubButtonText = styled.Text`
  font-family: ${fonts.bold};
  font-size: 24px;
  color: ${(props) => props.theme.textPrimary};
`;

export const AddButton = styled(Pressable)`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.theme.primaryStrong};
  elevation: 6;
`;

export const AddButtonText = styled.Text`
  font-family: ${fonts.bold};
  font-size: 24px;
  color: white;
`;

export const ActionsWrapper = styled.View`
  gap: 16px;
  padding-bottom: 24px;
`;

export const CompleteButtonWrapper = styled(Animated.View)`
  width: 100%;
`;

export const CompleteButton = styled(Pressable)`
  width: 100%;
  padding: 20px;
  border-radius: 9999px;
  background-color: ${(props) => props.theme.successStrong};
  align-items: center;
  elevation: 6;
`;

export const CompleteButtonText = styled.Text`
  font-family: ${fonts.bold};
  color: white;
  font-size: 18px;
`;

export const GiveUpButton = styled(Pressable)`
  width: 100%;
  padding: 20px;
  border-radius: 9999px;
  background-color: ${(props) => props.theme.bgSurface};
  border-width: 2px;
  border-color: ${(props) => props.theme.borderColor};
  align-items: center;
`;

export const GiveUpButtonText = styled.Text`
  font-family: ${fonts.bold};
  color: ${(props) => props.theme.textSecondary};
  font-size: 16px;
`;
