import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '@/styles/fonts';

export const Container = styled.View`
  flex: 1;
  background-color: ${(props) => props.theme.bgPrimary};
  padding-left: 20px;
  padding-right: 20px;
  gap: 20px;
`;

export const Cabecalho = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const BotaoVoltar = styled(Pressable)`
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
`;

export const Pontos = styled.View`
  flex-direction: row;
  gap: 8px;
`;

export const Ponto = styled.View`
  width: ${(props) => (props.$ativo ? '22px' : '8px')};
  height: 8px;
  border-radius: 4px;
  background-color: ${(props) => (props.$ativo ? props.theme.primaryColor : props.theme.borderColor)};
`;

export const AvatarCaixa = styled.View`
  width: 64px;
  height: 64px;
`;

export const Balao = styled.View`
  flex: 1;
  background-color: ${(props) => props.theme.bgSurface};
  border-radius: 18px;
  border-top-left-radius: 4px;
  padding: 14px 16px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
`;

export const BalaoTexto = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 16px;
  line-height: 22px;
  color: ${(props) => props.theme.textPrimary};
`;

export const Conteudo = styled.View`
  gap: 12px;
`;

export const CartaoIdioma = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  gap: 14px;
  padding: 18px;
  min-height: 64px;
  border-radius: 16px;
  border-width: 2px;
  border-color: ${(props) => (props.$ativo ? props.theme.primaryColor : props.theme.borderColor)};
  background-color: ${(props) => props.theme.bgSurface};
`;

export const Bandeira = styled.Text`
  font-size: 28px;
`;

export const NomeIdioma = styled.Text`
  flex: 1;
  font-family: ${fonts.bold};
  font-size: 17px;
  color: ${(props) => (props.$ativo ? props.theme.primaryColor : props.theme.textPrimary)};
`;

export const Lista = styled.ScrollView`
  flex: 1;
`;

export const GrupoTitulo = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${(props) => props.theme.textSecondary};
  margin: 14px 0px 6px;
`;

export const OpcaoFuso = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 14px 12px;
  min-height: 48px;
  border-radius: 12px;
  background-color: ${(props) => (props.$ativo ? props.theme.primaryLight : 'transparent')};
`;

export const OpcaoFusoTexto = styled.Text`
  flex: 1;
  font-size: 15px;
  font-family: ${(props) => (props.$ativo ? fonts.bold : fonts.regular)};
  color: ${(props) => (props.$ativo ? props.theme.primaryColor : props.theme.textPrimary)};
`;

export const Sugerido = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 11px;
  color: ${(props) => props.theme.successColor};
`;

export const Rodape = styled.View`
  padding-top: 4px;
`;

export const BotaoPrincipal = styled(Pressable)`
  background-color: ${(props) => props.theme.primaryStrong};
  border-radius: 14px;
  min-height: 52px;
  align-items: center;
  justify-content: center;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`;

export const BotaoPrincipalTexto = styled.Text`
  font-family: ${fonts.bold};
  font-size: 16px;
  color: #ffffff;
`;
