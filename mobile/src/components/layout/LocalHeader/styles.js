import styled from 'styled-components/native';
import { fonts } from '../../../styles/fonts';

export const HeaderContainer = styled.View`
  gap: 6px;
  padding: 12px 24px 16px;
  background-color: ${(props) => props.theme.bgSurface};
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.borderColor};
`;

export const HabitNameRow = styled.Text`
  font-family: ${fonts.semiBold};
  text-align: center;
  font-size: 13px;
  color: ${(props) => props.theme.textSecondary};
`;

export const IndicatorsRow = styled.View`
  flex-direction: row;
  align-items: center;
`;

export const SideSlotStart = styled.View`
  flex: 1;
  align-items: flex-start;
`;

export const SideSlotEnd = styled.View`
  flex: 1;
  align-items: flex-end;
`;

export const IconRow = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const IndicatorValue = styled.Text`
  font-family: ${fonts.bold};
  font-size: ${(props) => (props.$size ? `${props.$size}px` : '16px')};
  color: ${(props) => props.color};
`;

export const IconLabel = styled.Text`
  font-family: ${fonts.bold};
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-top: 3px;
  color: ${(props) => props.color};
`;

export const CoinsWrapper = styled.View`
  align-items: center;
  gap: 8px;
  background-color: ${(props) => props.theme.warningLight};
  padding: 6px 16px 8px;
  border-radius: 20px;
`;

export const FlameWrapper = styled.View`
  align-items: center;
  gap: 8px;
`;

export const ShieldWrapper = styled.View`
  align-items: center;
  gap: 8px;
  background-color: ${(props) => props.theme.primaryLight};
  padding: 6px 16px 8px 16px;
  border-radius: 20px;
  border-width: 1px;
  border-color: ${(props) => props.theme.primaryColor};
`;
