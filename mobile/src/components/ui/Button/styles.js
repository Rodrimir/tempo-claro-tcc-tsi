import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '../../../styles/fonts';

const CORES_POR_VARIANTE = {
  primary: (theme) => theme.primaryStrong,
  danger: (theme) => theme.dangerStrong,
  secondary: (theme) => theme.bgPrimary,
  ghost: () => 'transparent',
};

const TEXTO_POR_VARIANTE = {
  primary: () => 'white',
  danger: () => 'white',
  secondary: (theme) => theme.textPrimary,
  ghost: (theme) => theme.primaryColor,
};

export const StyledButton = styled(Pressable)`
  width: ${(props) => (props.$fullWidth === false ? 'auto' : '100%')};
  padding: ${(props) => (props.$compact ? '12px 20px' : '17px')};
  border-radius: 9999px;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
  background-color: ${(props) =>
    props.$variant === 'secondary' || props.$variant === 'ghost'
      ? CORES_POR_VARIANTE[props.$variant](props.theme)
      : CORES_POR_VARIANTE[props.$variant || 'primary'](props.theme)};
  border-width: ${(props) => (props.$variant === 'secondary' ? '1px' : '0px')};
  border-color: ${(props) => props.theme.borderColor};
`;

export const ButtonText = styled.Text`
  font-family: ${fonts.bold};
  font-size: ${(props) => (props.$compact ? '14px' : '17px')};
  color: ${(props) => TEXTO_POR_VARIANTE[props.$variant || 'primary'](props.theme)};
`;
