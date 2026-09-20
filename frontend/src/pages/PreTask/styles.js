import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '../../styles/fonts';

export const PreTaskContainer = styled.View`
  flex: 1;
  padding: 24px;
  justify-content: center;
  background-color: ${(props) => props.theme.primaryStrong};
`;

export const BackButtonWrapper = styled.View`
  position: absolute;
  top: 24px;
  left: 24px;
`;

export const BackButton = styled(Pressable)``;

export const ContentWrapper = styled.View`
  flex: 1;
  justify-content: center;
  max-width: 320px;
  align-self: center;
  width: 100%;
`;

export const HabitName = styled.Text`
  font-family: ${fonts.extraBold};
  font-size: 28px;
  line-height: 34px;
  margin-bottom: 8px;
  color: white;
`;

export const GatilhoText = styled.Text`
  font-size: 15px;
  font-style: italic;
  opacity: 0.85;
  margin-bottom: 24px;
  color: white;
`;

export const QuoteText = styled.Text`
  font-family: ${fonts.bold};
  font-size: 24px;
  line-height: 34px;
  margin-bottom: 16px;
  color: white;
`;

export const ActionWrapper = styled.View`
  padding-bottom: 24px;
  width: 100%;
`;

export const ReadyButton = styled(Pressable)`
  background-color: white;
  font-size: 18px;
  padding: 20px;
  width: 100%;
  border-radius: 9999px;
  align-items: center;
  elevation: 8;
`;

export const ReadyButtonText = styled.Text`
  font-family: ${fonts.bold};
  color: ${(props) => props.theme.primaryStrong};
  font-size: 18px;
`;
