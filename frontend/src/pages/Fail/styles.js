import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { fonts } from '../../styles/fonts';

export const FailContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background-color: ${(props) => props.$bgColor};
`;

export const ContentWrapper = styled.View`
  align-items: center;
  width: 100%;
  max-width: 320px;
`;

export const IconWrapper = styled(Animated.View)`
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
`;

export const Title = styled.Text`
  font-family: ${fonts.extraBold};
  font-size: 32px;
  margin-bottom: 16px;
  color: white;
  text-align: center;
`;

export const Subtitle = styled.Text`
  font-size: 18px;
  opacity: 0.9;
  line-height: 27px;
  margin-bottom: 24px;
  color: white;
  text-align: center;
`;

export const CoinsCard = styled.View`
  background-color: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border-radius: 16px;
  margin-bottom: 48px;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

export const CoinsCardText = styled.Text`
  font-family: ${fonts.bold};
  font-size: 20px;
  color: white;
`;

export const ActionButton = styled(Pressable)`
  width: 100%;
  padding: 20px;
  border-radius: 9999px;
  background-color: white;
  align-items: center;
  elevation: 8;
`;

export const ActionButtonText = styled.Text`
  font-family: ${fonts.extraBold};
  font-size: 18px;
  color: ${(props) => props.$bgColor};
`;
