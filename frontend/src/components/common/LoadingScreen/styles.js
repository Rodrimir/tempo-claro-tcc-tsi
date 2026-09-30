import styled from 'styled-components/native';
import Animated from 'react-native-reanimated';
import { Image } from 'expo-image';
import { fonts } from '../../../styles/fonts';

export const Container = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.theme.bgPrimary};
`;

export const LoadingText = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 24px;
  margin-bottom: 30px;
  min-width: 150px;
  text-align: center;
  color: ${(props) => props.theme.textPrimary};
`;

export const SunImage = styled(Animated.createAnimatedComponent(Image))`
  width: 120px;
  height: 120px;
`;
