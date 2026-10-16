import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '@/styles/fonts';

export const Balao = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  border-radius: 18px;
  padding: 14px;
  gap: 10px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  elevation: 8;
`;

export const BalaoLinha = styled.View`
  flex-direction: row;
  gap: 10px;
  align-items: flex-start;
`;

export const AvatarCaixa = styled.View`
  width: 52px;
  height: 52px;
`;

export const BalaoTexto = styled.Text`
  flex: 1;
  font-family: ${fonts.semiBold};
  font-size: 15px;
  line-height: 21px;
  color: ${(props) => props.theme.textPrimary};
`;

export const BalaoRodape = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const BalaoContador = styled.Text`
  font-family: ${fonts.regular};
  font-size: 12px;
  color: ${(props) => props.theme.textSecondary};
`;

export const BalaoBotao = styled(Pressable)`
  background-color: ${(props) => props.theme.primaryStrong};
  border-radius: 999px;
  padding: 10px 18px;
  min-height: 44px;
  justify-content: center;
`;

export const BalaoBotaoTexto = styled.Text`
  font-family: ${fonts.bold};
  font-size: 14px;
  color: #ffffff;
`;

export const BalaoDica = styled.Text`
  flex-shrink: 1;
  font-family: ${fonts.semiBold};
  font-size: 13px;
  color: ${(props) => props.theme.primaryColor};
`;

export const LegendaLinha = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 6px;
`;

export const LegendaItem = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 5px;
`;

export const LegendaCor = styled.View`
  width: 10px;
  height: 10px;
  border-radius: 3px;
`;

export const LegendaTexto = styled.Text`
  font-family: ${fonts.regular};
  font-size: 12px;
  color: ${(props) => props.theme.textSecondary};
`;
