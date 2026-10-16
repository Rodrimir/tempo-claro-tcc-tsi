import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '@/styles/fonts';

export const StatsContainer = styled.ScrollView.attrs((props) => ({
  contentContainerStyle: { padding: 24, paddingTop: 24 + (props.$insetTop || 0), paddingBottom: 60 },
}))`
  flex: 1;
  background-color: ${(props) => props.theme.bgPrimary};
`;

export const Title = styled.Text`
  font-family: ${fonts.bold};
  font-size: 24px;
  margin-bottom: 8px;
  color: ${(props) => props.theme.textPrimary};
`;

export const HabitTitleButton = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-bottom: 24px;
  align-self: flex-start;
`;

export const HabitTitle = styled.Text`
  color: ${(props) => props.theme.primaryColor};
  font-family: ${fonts.semiBold};
  font-size: 18px;
`;

export const ContentWrapper = styled.View`
  flex: 1;
  gap: 24px;
`;

export const GridRow = styled.View`
  flex-direction: row;
  gap: 16px;
`;

export const StatCard = styled.View`
  flex: 1;
  background-color: ${(props) => props.theme.bgSurface};
  padding: 16px;
  border-radius: 16px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
`;

export const CardHeader = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
`;

export const CardHeaderText = styled.Text`
  color: ${(props) => props.theme.textSecondary};
  font-size: 12px;
  font-family: ${fonts.semiBold};
`;

export const CardValue = styled.Text`
  font-family: ${fonts.extraBold};
  font-size: ${(props) => (props.$large ? '24px' : '20px')};
  color: ${(props) => props.theme.textPrimary};
`;

export const CardSubtext = styled.Text`
  color: ${(props) => props.theme.textSecondary};
  font-size: 12px;
  margin-top: 4px;
`;

export const RecordeRow = styled.View`
  flex-direction: row;
  align-items: center;
  padding-top: 10px;
  padding-bottom: 10px;
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.borderColor};
`;

export const RecordePosicao = styled.Text`
  font-family: ${fonts.bold};
  font-size: 14px;
  width: 28px;
  color: ${(props) => (props.$first ? props.theme.warningColor : props.theme.textSecondary)};
`;

export const RecordeData = styled.Text`
  flex: 1;
  font-family: ${fonts.regular};
  font-size: 14px;
  color: ${(props) => props.theme.textSecondary};
`;

export const RecordeValor = styled.Text`
  font-family: ${(props) => (props.$first ? fonts.bold : fonts.semiBold)};
  font-size: 15px;
  color: ${(props) => (props.$first ? props.theme.textPrimary : props.theme.textSecondary)};
`;

export const ChartCard = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  padding: 20px;
  border-radius: 24px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
`;

export const ChartTitle = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 16px;
  margin-bottom: 24px;
  color: ${(props) => props.theme.textPrimary};
`;

export const ChartWrapper = styled.View`
  height: 180px;
  flex-direction: row;
`;

export const BarLabel = styled.Text`
  font-size: 12px;
  margin-top: 8px;
  color: ${(props) => props.theme.textSecondary};
`;

export const RetryButton = styled(Pressable)`
  margin-top: 20px;
  padding: 16px 32px;
  border-radius: 100px;
  background-color: ${(props) => props.theme.primaryStrong};
  elevation: 6;
`;

export const RetryButtonText = styled.Text`
  font-family: ${fonts.bold};
  color: white;
`;

export const PickerOverlay = styled(Pressable)`
  flex: 1;
  background-color: rgba(15, 23, 42, 0.85);
  justify-content: flex-end;
`;

export const PickerSheet = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px;
  max-height: 70%;
`;

export const PickerTitulo = styled.Text`
  font-family: ${fonts.bold};
  font-size: 18px;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 12px;
`;

export const PickerOption = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 8px;
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.borderColor};
`;

export const PickerOptionText = styled.Text`
  flex: 1;
  font-size: 16px;
  font-family: ${(props) => (props.$active ? fonts.bold : fonts.regular)};
  color: ${(props) => (props.$active ? props.theme.primaryColor : props.theme.textPrimary)};
`;

export const SeletorPeriodo = styled.View`
  flex-direction: row;
  align-self: flex-start;
  background-color: ${(props) => props.theme.bgSurface};
  border-radius: 999px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  padding: 3px;
  margin-top: 12px;
`;

export const OpcaoPeriodo = styled(Pressable)`
  padding: 8px 16px;
  min-height: 36px;
  border-radius: 999px;
  justify-content: center;
  background-color: ${(props) => (props.$ativo ? props.theme.primaryStrong : 'transparent')};
`;

export const OpcaoPeriodoTexto = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 13px;
  color: ${(props) => (props.$ativo ? '#ffffff' : props.theme.textSecondary)};
`;

export const GraficoArea = styled.View`
  position: relative;
  margin-top: 8px;
`;

export const LinhaDaMeta = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  height: 2px;
`;

export const RotuloDaMeta = styled.Text`
  position: absolute;
  right: 0;
  bottom: 4px;
  font-family: ${fonts.semiBold};
  font-size: 11px;
  color: ${(props) => props.theme.textSecondary};
  background-color: ${(props) => props.theme.bgSurface};
  padding: 0px 4px;
`;

export const RotuloEixo = styled.Text`
  position: absolute;
  left: 0;
  top: -4px;
  font-size: 10px;
  color: ${(props) => props.theme.textSecondary};
`;

export const BarraRotulo = styled.Text`
  font-size: 11px;
  margin-top: 6px;
  text-align: center;
  color: ${(props) => props.theme.textSecondary};
`;

export const Dica = styled.View`
  background-color: ${(props) => props.theme.bgPrimary};
  border-radius: 12px;
  padding: 10px 12px;
  margin-bottom: 8px;
`;

export const DicaTitulo = styled.Text`
  font-family: ${fonts.bold};
  font-size: 13px;
  color: ${(props) => props.theme.textPrimary};
`;

export const DicaTexto = styled.Text`
  font-size: 13px;
  margin-top: 2px;
  color: ${(props) => props.theme.textSecondary};
`;

export const Legenda = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
`;

export const LegendaItem = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
`;

export const LegendaCor = styled.View`
  width: 12px;
  height: 12px;
  border-radius: 3px;
`;

export const LegendaTexto = styled.Text`
  font-size: 12px;
  color: ${(props) => props.theme.textSecondary};
`;

export const ComoLer = styled.Text`
  font-size: 12px;
  line-height: 18px;
  margin-top: 10px;
  color: ${(props) => props.theme.textSecondary};
`;
