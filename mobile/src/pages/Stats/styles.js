import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '../../styles/fonts';

/* Virou ScrollView: com recordes + gráfico de 30 dias, o conteúdo passava da
   tela em aparelhos menores e não havia como rolar até o fim. */
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

/* Agora é um seletor, não só um rótulo: existe mais de um hábito ativo
   possível (RF03), e antes só dava pra ver as estatísticas do que estivesse
   focado na Home. */
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

/* Pódio dos três melhores dias do mês (F18). O primeiro lugar ganha destaque de cor
   e peso; os outros dois ficam em texto secundário, para o olho achar o topo antes
   de ler a lista. */
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

export const EmptyStateContainer = styled.View`
  flex: 1;
  padding: 24px;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => props.theme.bgPrimary};
`;

export const EmptyIconWrapper = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  width: 80px;
  height: 80px;
  border-radius: 40px;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`;

export const EmptyTitle = styled.Text`
  font-family: ${fonts.bold};
  font-size: 18px;
  margin-bottom: 8px;
  color: ${(props) => props.theme.textPrimary};
  text-align: center;
`;

export const EmptyText = styled.Text`
  color: ${(props) => props.theme.textSecondary};
  font-size: 14px;
  line-height: 21px;
  text-align: center;
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
