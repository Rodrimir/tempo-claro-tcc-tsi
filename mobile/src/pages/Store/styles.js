import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '../../styles/fonts';

export const StoreContainer = styled.ScrollView.attrs((props) => ({
  contentContainerStyle: { padding: 24, paddingBottom: 100, flexGrow: 1 },
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

export const Subtitle = styled.Text`
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 32px;
`;

export const BuyCard = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  border-radius: 24px;
  padding: 24px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  align-items: center;
  margin-bottom: 24px;
`;

export const IconWrapper = styled.View`
  background-color: ${(props) => props.theme.primaryLight};
  width: 64px;
  height: 64px;
  border-radius: 32px;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`;

export const CardTitle = styled.Text`
  font-family: ${fonts.bold};
  font-size: 20px;
  margin-bottom: 8px;
  color: ${(props) => props.theme.textPrimary};
  text-align: center;
`;

export const CardText = styled.Text`
  font-size: 14px;
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 24px;
  text-align: center;
`;

export const FormGroup = styled.View`
  width: 100%;
  margin-bottom: 24px;
`;

export const Label = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 14px;
  margin-bottom: 8px;
  color: ${(props) => props.theme.textPrimary};
`;

export const SelectField = styled(Pressable)`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  background-color: ${(props) => props.theme.bgPrimary};
`;

export const SelectFieldText = styled.Text`
  font-size: 16px;
  color: ${(props) => (props.$placeholder ? props.theme.textSecondary : props.theme.textPrimary)};
`;

export const BuyButton = styled(Pressable)`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background-color: ${(props) => props.theme.primaryStrong};
  align-items: center;
  elevation: 4;
`;

export const BuyButtonText = styled.Text`
  font-family: ${fonts.bold};
  color: white;
  font-size: 18px;
`;

export const InventorySection = styled.View`
  margin-top: 24px;
`;

export const InventoryTitle = styled.Text`
  font-family: ${fonts.bold};
  font-size: 16px;
  margin-bottom: 16px;
  color: ${(props) => props.theme.textPrimary};
`;

export const InventoryList = styled.View`
  gap: 12px;
`;

export const InventoryItem = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background-color: ${(props) => props.theme.bgSurface};
  border-radius: 12px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
`;

export const ItemInfo = styled.View``;

export const ItemTitle = styled.Text`
  font-family: ${fonts.semiBold};
  color: ${(props) => props.theme.textPrimary};
`;

export const ItemSubtitle = styled.Text`
  font-size: 12px;
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

export const InventoryEmptyText = styled.Text`
  color: ${(props) => props.theme.textSecondary};
  font-size: 14px;
  line-height: 21px;
  text-align: center;
  padding: 16px 0px;
`;

export const ItemCount = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const ItemCountText = styled.Text`
  font-family: ${fonts.bold};
  color: ${(props) => props.theme.primaryColor};
`;

export const PickerOverlay = styled(Pressable)`
  flex: 1;
  background-color: rgba(15, 23, 42, 0.85);
  justify-content: flex-end;
`;

export const PickerSheet = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  padding: 24px;
  max-height: 70%;
`;

export const PickerOption = styled(Pressable)`
  padding: 16px 8px;
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.borderColor};
`;

export const PickerOptionText = styled.Text`
  font-size: 16px;
  color: ${(props) => props.theme.textPrimary};
`;
