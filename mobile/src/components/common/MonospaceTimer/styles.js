import styled from 'styled-components/native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { fonts } from '../../../styles/fonts';

export const TimerContainer = styled.View`
  align-items: center;
`;

export const TimeDisplay = styled.Text`
  font-family: ${fonts.extraBold};
  font-size: 80px;
  color: ${(props) => (props.$isOverachieving ? props.theme.successColor : props.theme.primaryColor)};
`;

export const BonusWrapper = styled.View`
  height: 40px;
  margin-top: 16px;
`;

export const BonusBadge = styled(Animated.View).attrs({
  entering: ZoomIn.duration(500),
})`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const BonusText = styled.Text`
  font-family: ${fonts.bold};
  color: ${(props) => props.theme.successColor};
`;
