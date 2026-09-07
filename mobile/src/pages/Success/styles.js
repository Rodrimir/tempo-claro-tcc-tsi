import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { fonts } from '../../styles/fonts';

export const SuccessContainer = styled.View`
  flex: 1;
  overflow: hidden;
  background-color: ${(props) => (props.$isBonus ? props.theme.bonusStrong : props.theme.successStrong)};
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const ParticlesWrapper = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

export const ParticleView = styled(Animated.View)`
  position: absolute;
  bottom: -20px;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 999px;
`;

export const ContentWrapper = styled.View`
  z-index: 1;
  align-items: center;
  width: 100%;
  max-width: 320px;
`;

export const IconWrapper = styled(Animated.Text)`
  font-size: 80px;
  margin-bottom: 16px;
`;

export const Title = styled.Text`
  font-family: ${fonts.extraBold};
  font-size: 32px;
  margin-bottom: 8px;
  color: white;
  text-align: center;
`;

export const Subtitle = styled.Text`
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 32px;
  color: white;
  text-align: center;
`;

export const RewardCard = styled.View`
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  padding: 24px;
  gap: 16px;
  margin-bottom: 40px;
  width: 100%;
`;

export const Row = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

export const Label = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 18px;
  color: white;
`;

export const Value = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const ValueText = styled.Text`
  font-family: ${fonts.extraBold};
  color: white;
  font-size: 24px;
`;

export const Divider = styled.View`
  height: 1px;
  background-color: rgba(255, 255, 255, 0.2);
`;

export const BackButton = styled(Pressable)`
  width: 100%;
  padding: 20px;
  border-radius: 9999px;
  background-color: white;
  align-items: center;
  elevation: 6;
`;

export const BackButtonText = styled.Text`
  font-family: ${fonts.extraBold};
  color: ${(props) => (props.$isBonus ? props.theme.bonusStrong : props.theme.successStrong)};
  font-size: 18px;
`;
