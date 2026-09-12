import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '../../../styles/fonts';

export const Field = styled(Pressable)`
  width: 100%;
  padding: 14px 16px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${(props) => (props.$error ? props.theme.dangerColor : props.theme.borderColor)};
  background-color: ${(props) => props.theme.bgPrimary};
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

export const FieldText = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 16px;
  color: ${(props) => (props.$placeholder ? props.theme.textSecondary : props.theme.textPrimary)};
`;

export const Overlay = styled(Pressable)`
  flex: 1;
  background-color: rgba(15, 23, 42, 0.85);
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const Sheet = styled.View`
  width: 100%;
  max-width: 360px;
  background-color: ${(props) => props.theme.bgSurface};
  border-radius: 24px;
  padding: 24px;
  elevation: 8;
`;

export const SheetTitle = styled.Text`
  font-family: ${fonts.bold};
  font-size: 18px;
  color: ${(props) => props.theme.textPrimary};
  text-align: center;
  margin-bottom: 4px;
`;

/* O valor escolhido fica grande e no topo: é o retorno imediato de cada toque
   nas colunas, sem precisar procurar qual item está destacado. */
export const Preview = styled.Text`
  font-family: ${fonts.extraBold};
  font-size: 40px;
  color: ${(props) => props.theme.primaryColor};
  text-align: center;
  margin-bottom: 16px;
`;

export const ColumnsRow = styled.View`
  flex-direction: row;
  gap: 12px;
  height: 220px;
`;

export const Column = styled.View`
  flex: 1;
`;

export const ColumnLabel = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${(props) => props.theme.textSecondary};
  text-align: center;
  margin-bottom: 8px;
`;

export const ColumnScroll = styled.ScrollView.attrs({
  showsVerticalScrollIndicator: false,
  contentContainerStyle: { paddingVertical: 4 },
})`
  flex: 1;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  border-radius: 12px;
  background-color: ${(props) => props.theme.bgPrimary};
`;

export const CellButton = styled(Pressable)`
  padding: 10px 0px;
  align-items: center;
  border-radius: 8px;
  margin: 2px 6px;
  background-color: ${(props) => (props.$active ? props.theme.primaryStrong : 'transparent')};
`;

export const CellText = styled.Text`
  font-family: ${(props) => (props.$active ? fonts.bold : fonts.regular)};
  font-size: 18px;
  color: ${(props) => (props.$active ? 'white' : props.theme.textPrimary)};
`;

export const Actions = styled.View`
  flex-direction: row;
  gap: 12px;
  margin-top: 20px;
`;

export const CancelButton = styled(Pressable)`
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  background-color: ${(props) => props.theme.bgPrimary};
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  align-items: center;
`;

export const CancelButtonText = styled.Text`
  font-family: ${fonts.bold};
  color: ${(props) => props.theme.textPrimary};
`;

export const ConfirmButton = styled(Pressable)`
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  background-color: ${(props) => props.theme.primaryStrong};
  align-items: center;
`;

export const ConfirmButtonText = styled.Text`
  font-family: ${fonts.bold};
  color: white;
`;

export const ClearButton = styled(Pressable)`
  margin-top: 12px;
  align-items: center;
  padding: 8px;
`;

export const ClearButtonText = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 13px;
  color: ${(props) => props.theme.textSecondary};
`;
