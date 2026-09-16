import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '../../../styles/fonts';

export const Overlay = styled(Pressable)`
  flex: 1;
  background-color: ${(props) => props.theme.overlayColor};
  justify-content: flex-end;
`;

export const Sheet = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px;
  padding-bottom: 32px;
  max-height: 75%;
`;

export const Titulo = styled.Text`
  font-family: ${fonts.bold};
  font-size: 18px;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 16px;
`;

export const Option = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 4px;
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.borderColor};
`;

export const OptionText = styled.Text`
  flex: 1;
  font-size: 16px;
  font-family: ${(props) => (props.$active ? fonts.bold : fonts.regular)};
  color: ${(props) => (props.$active ? props.theme.primaryColor : props.theme.textPrimary)};
`;
