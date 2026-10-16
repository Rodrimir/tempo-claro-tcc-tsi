import styled from 'styled-components/native';
import { fonts } from '@/styles/fonts';

export const Cartao = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  border-radius: 22px;
  padding: 24px;
  elevation: 8;
`;

export const Folha = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px 20px 28px;
  elevation: 8;
`;

export const Titulo = styled.Text`
  font-family: ${fonts.bold};
  font-size: 18px;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 12px;
`;

// Em telas estreitas os botões ficam um embaixo do outro, para o texto não quebrar no meio.
export const LinhaDeBotoes = styled.View`
  flex-direction: ${(props) => (props.$empilhar ? 'column-reverse' : 'row')};
  gap: 12px;
  margin-top: 18px;
`;

const FUNDO_DO_BOTAO = {
  primario: (theme) => theme.primaryStrong,
  perigo: (theme) => theme.dangerStrong,
  secundario: (theme) => theme.bgPrimary,
};

// flex-grow com base automática serve nos dois arranjos: lado a lado dividem a linha, empilhados
// ocupam a largura inteira sem encolher.
export const BotaoDoDialogo = styled.Pressable`
  flex-grow: 1;
  flex-basis: auto;
  min-height: 48px;
  padding: 13px 16px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => (FUNDO_DO_BOTAO[props.$tipo] || FUNDO_DO_BOTAO.secundario)(props.theme)};
  border-width: ${(props) => (props.$tipo === 'secundario' || !props.$tipo ? '1px' : '0px')};
  border-color: ${(props) => props.theme.borderColor};
  opacity: ${(props) => (props.disabled ? 0.55 : 1)};
`;

export const TextoDoBotao = styled.Text`
  font-family: ${fonts.bold};
  font-size: 15px;
  text-align: center;
  color: ${(props) => (props.$tipo === 'secundario' || !props.$tipo ? props.theme.textPrimary : '#ffffff')};
`;

export const TextoDoDialogo = styled.Text`
  font-family: ${fonts.regular};
  font-size: 14px;
  line-height: 20px;
  color: ${(props) => props.theme.textSecondary};
`;
