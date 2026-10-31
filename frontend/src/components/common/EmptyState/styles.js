import styled from 'styled-components/native';
import { fonts } from '@/styles/fonts';

export const EmptyStateContainer = styled.View`
  flex: 1;
  padding: 24px;
  justify-content: center;
  align-items: center;
  background-color: ${(props) => (props.$variant === 'dark' ? 'transparent' : props.theme.bgPrimary)};
`;

export const EmptyIconWrapper = styled.View`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  background-color: ${(props) => (props.$variant === 'dark' ? 'rgba(6, 12, 30, 0.62)' : props.theme.bgSurface)};
  border-width: ${(props) => (props.$variant === 'dark' ? '1px' : '0px')};
  border-color: rgba(255, 255, 255, 0.22);
`;

export const EmptyTitle = styled.Text`
  font-family: ${fonts.bold};
  font-size: 18px;
  margin-bottom: 8px;
  text-align: center;
  color: ${(props) => (props.$variant === 'dark' ? 'white' : props.theme.textPrimary)};
`;

export const EmptyText = styled.Text`
  font-size: 14px;
  line-height: 21px;
  text-align: center;
  color: ${(props) => (props.$variant === 'dark' ? 'rgba(255, 255, 255, 0.8)' : props.theme.textSecondary)};
`;
