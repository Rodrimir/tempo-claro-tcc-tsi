import styled from 'styled-components/native';
import { Pressable } from 'react-native';

/* Mesmo visual do Input de texto simples usado em Login e Profile — reproduzido
   aqui em vez de importado de um dos dois, para este componente não depender de
   qual tela o está usando. A diferença é o padding à direita, que abre espaço
   para o ícone de olho sem que o texto digitado passe por baixo dele. */
export const Wrapper = styled.View`
  width: 100%;
  position: relative;
  justify-content: center;
`;

export const StyledInput = styled.TextInput`
  width: 100%;
  padding: 12px;
  padding-right: 44px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  border-radius: 12px;
  font-size: 16px;
  background-color: ${(props) => props.theme.bgSurface};
  color: ${(props) => props.theme.textPrimary};
`;

export const ToggleButton = styled(Pressable)`
  position: absolute;
  right: 4px;
  height: 40px;
  width: 40px;
  align-items: center;
  justify-content: center;
`;
