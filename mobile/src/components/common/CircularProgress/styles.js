import styled from 'styled-components/native';
import { Svg, Circle } from 'react-native-svg';
import { fonts } from '../../../styles/fonts';

export const ProgressContainer = styled.View`
  width: 200px;
  height: 200px;
  align-items: center;
  justify-content: center;
`;

export const SvgElement = styled(Svg)`
  position: absolute;
  top: 0;
  left: 0;
`;

export const BackgroundCircle = styled(Circle)`
  stroke: ${(props) => props.theme.primaryLight};
`;

export const ProgressCircle = styled(Circle)`
  stroke: ${(props) => (props.$isDone ? props.theme.successColor : props.theme.primaryColor)};
`;

export const TextContainer = styled.View`
  align-items: center;
`;

export const QuantityText = styled.Text`
  font-family: ${fonts.extraBold};
  font-size: 32px;
  color: ${(props) => props.theme.textPrimary};
`;

export const QuantityInput = styled.TextInput`
  font-family: ${fonts.extraBold};
  font-size: 32px;
  color: ${(props) => props.theme.textPrimary};
  border-bottom-width: 2px;
  border-bottom-color: ${(props) => props.theme.primaryColor};
  text-align: center;
  width: 100px;
  padding: 0px;
`;

export const MetaText = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 14px;
  color: ${(props) => props.theme.textSecondary};
`;
