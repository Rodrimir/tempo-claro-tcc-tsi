import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '../../styles/fonts';

export const StatsContainer = styled.View`
  flex: 1;
  padding: 24px;
`;

export const Title = styled.Text`
  font-family: ${fonts.bold};
  font-size: 24px;
  margin-bottom: 8px;
  color: ${(props) => props.theme.textPrimary};
`;

export const HabitTitle = styled.Text`
  color: ${(props) => props.theme.primaryColor};
  font-family: ${fonts.semiBold};
  margin-bottom: 24px;
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

export const BarColumn = styled.View`
  flex: 1;
  align-items: center;
  justify-content: flex-end;
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
