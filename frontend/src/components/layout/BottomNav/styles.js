import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '../../../styles/fonts';

export const NavContainer = styled.View`
  flex-direction: row;
  justify-content: space-around;
  background-color: ${(props) => props.theme.bgSurface};
  border-top-width: 1px;
  border-top-color: ${(props) => props.theme.borderColor};
  padding-top: 12px;
`;

export const PlayButtonWrapper = styled.View`
  transform: translateY(-16px);
`;

export const PlayButton = styled(Pressable)`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: ${(props) => (props.$completed ? props.theme.successStrong : props.theme.primaryStrong)};
  align-items: center;
  justify-content: center;
  elevation: 6;
`;

export const NavItemContainer = styled(Pressable)`
  align-items: center;
  gap: 4px;
`;

export const NavLabel = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 12px;
  color: ${(props) => (props.$active ? props.theme.primaryColor : props.theme.textSecondary)};
  opacity: ${(props) => (props.$active ? 1 : 0.7)};
`;
