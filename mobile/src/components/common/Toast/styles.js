import styled from 'styled-components/native';
import Animated from 'react-native-reanimated';
import { fonts } from '../../../styles/fonts';

export const ToastContainer = styled.View`
  position: absolute;
  top: 24px;
  right: 24px;
  gap: 12px;
`;

export const ToastMessage = styled(Animated.View)`
  background-color: ${(props) =>
    props.$type === 'error'
      ? props.theme.dangerStrong
      : props.$type === 'success'
        ? props.theme.successStrong
        : props.theme.bgSurface};
  padding: 16px 24px;
  border-radius: 12px;
  elevation: 8;
  min-width: 250px;
`;

export const ToastText = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 14px;
  color: ${(props) => (props.$type === 'default' ? props.theme.textPrimary : 'white')};
`;
