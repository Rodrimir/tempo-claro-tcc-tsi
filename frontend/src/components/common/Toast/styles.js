import styled from 'styled-components/native';
import Animated from 'react-native-reanimated';
import { fonts } from '../../../styles/fonts';

export const ToastContainer = styled.View`
  position: absolute;
  top: ${(props) => 24 + (props.$insetTop || 0)}px;
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
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 16px 24px;
  border-radius: 12px;
  elevation: 8;
  min-width: 250px;
`;

export const ToastText = styled.Text`
  flex-shrink: 1;
  font-family: ${fonts.semiBold};
  font-size: 14px;
  color: ${(props) => (props.$type === 'default' ? props.theme.textPrimary : 'white')};
`;
