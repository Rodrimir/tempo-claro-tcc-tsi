import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '../../styles/fonts';


export const Container = styled.View`
  flex: 1;
  background-color: ${(props) => props.theme.bgPrimary};
`;

export const Content = styled.ScrollView`
  flex: 1;
  padding-left: 24px;
  padding-right: 24px;
`;

export const ProgressTrack = styled.View`
  height: 4px;
  border-radius: 9999px;
  background-color: ${(props) => props.theme.borderColor};
  margin-left: 24px;
  margin-right: 24px;
  margin-bottom: 24px;
  overflow: hidden;
`;

export const ProgressFill = styled.View`
  height: 4px;
  border-radius: 9999px;
  background-color: ${(props) => props.theme.primaryColor};
  width: ${(props) => props.$percent}%;
`;

export const TopBar = styled.View`
  flex-direction: row;
  align-items: center;
  padding: 16px 24px 8px 24px;
`;

export const BackButton = styled(Pressable)`
  width: 40px;
  height: 40px;
  align-items: center;
  justify-content: center;
  margin-left: -8px;
`;

export const Pergunta = styled.Text`
  font-family: ${fonts.extraBold};
  font-size: 26px;
  line-height: 34px;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 8px;
`;

export const Ajuda = styled.Text`
  font-family: ${fonts.regular};
  font-size: 15px;
  line-height: 22px;
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 24px;
`;

export const Opcao = styled(Pressable)`
  background-color: ${(props) => (props.$active ? props.theme.primaryLight : props.theme.bgSurface)};
  border-width: 2px;
  border-color: ${(props) => (props.$active ? props.theme.primaryColor : props.theme.borderColor)};
  border-radius: ${(props) => props.theme.radiusMd}px;
  padding: 18px;
  margin-bottom: 12px;
`;

export const OpcaoTexto = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 16px;
  color: ${(props) => props.theme.textPrimary};
`;

export const OpcaoDetalhe = styled.Text`
  font-family: ${fonts.regular};
  font-size: 13px;
  color: ${(props) => props.theme.textSecondary};
  margin-top: 4px;
`;

export const DiasRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 24px;
`;

export const DiaCirculo = styled(Pressable)`
  width: 42px;
  height: 42px;
  border-radius: 9999px;
  align-items: center;
  justify-content: center;
  border-width: 2px;
  border-color: ${(props) => (props.$active ? props.theme.primaryStrong : props.theme.borderColor)};
  background-color: ${(props) => (props.$active ? props.theme.primaryStrong : props.theme.bgSurface)};
`;

export const DiaTexto = styled.Text`
  font-family: ${fonts.bold};
  font-size: 14px;
  color: ${(props) => (props.$active ? '#ffffff' : props.theme.textSecondary)};
`;

export const ChipsRow = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  margin-bottom: 24px;
`;

export const Chip = styled(Pressable)`
  width: 52px;
  height: 52px;
  border-radius: ${(props) => props.theme.radiusMd}px;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  margin-bottom: 12px;
  border-width: 2px;
  border-color: ${(props) => (props.$active ? props.theme.primaryColor : props.theme.borderColor)};
  background-color: ${(props) => (props.$active ? props.theme.primaryLight : props.theme.bgSurface)};
`;

export const ChipTexto = styled.Text`
  font-family: ${fonts.bold};
  font-size: 18px;
  color: ${(props) => (props.$active ? props.theme.primaryColor : props.theme.textSecondary)};
`;

export const HorarioLinha = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  background-color: ${(props) => props.theme.bgSurface};
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  border-radius: ${(props) => props.theme.radiusMd}px;
  padding: 16px;
  margin-bottom: 12px;
`;

export const HorarioRotulo = styled.Text`
  font-family: ${fonts.regular};
  font-size: 15px;
  color: ${(props) => props.theme.textSecondary};
`;

export const HorarioCampo = styled.View`
  width: 150px;
`;

export const PrimaryButton = styled(Pressable)`
  background-color: ${(props) => (props.$disabled ? props.theme.borderColor : props.theme.primaryStrong)};
  border-radius: 9999px;
  padding: 18px;
  align-items: center;
  margin-top: 8px;
  margin-bottom: 12px;
`;

export const PrimaryButtonText = styled.Text`
  font-family: ${fonts.bold};
  font-size: 16px;
  color: #ffffff;
`;

export const SecondaryButton = styled(Pressable)`
  padding: 14px;
  align-items: center;
  margin-bottom: 24px;
`;

export const SecondaryButtonText = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 15px;
  color: ${(props) => props.theme.textSecondary};
`;

export const SugestaoCard = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  border-radius: ${(props) => props.theme.radiusMd}px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  padding: 20px;
  margin-bottom: 20px;
`;

export const SugestaoMeta = styled.Text`
  font-family: ${fonts.extraBold};
  font-size: 36px;
  color: ${(props) => props.theme.primaryColor};
`;

export const SugestaoMetaUnidade = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 16px;
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 16px;
`;

export const SugestaoLinha = styled.View`
  flex-direction: row;
  align-items: center;
  padding-top: 10px;
  padding-bottom: 10px;
  border-top-width: 1px;
  border-top-color: ${(props) => props.theme.borderColor};
`;

export const SugestaoRotulo = styled.Text`
  flex: 1;
  font-family: ${fonts.regular};
  font-size: 14px;
  color: ${(props) => props.theme.textSecondary};
`;

export const SugestaoValor = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 14px;
  color: ${(props) => props.theme.textPrimary};
`;

export const Explicacao = styled.Text`
  font-family: ${fonts.regular};
  font-size: 15px;
  line-height: 23px;
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 20px;
`;
