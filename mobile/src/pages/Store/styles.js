import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import { fonts } from '../../styles/fonts';

export const StoreRoot = styled.View`
  flex: 1;
  background-color: ${(props) => props.theme.bgPrimary};
`;

/* A arte da loja ocupa a tela inteira. O conteúdo rola por cima dela, e o que
   precisa ficar visível da ilustração (a placa "ESCUDOS" e os mascotes) é
   preservado pelo respiro no topo do ScrollView, não por recorte da imagem. */
export const Fundo = styled.ImageBackground.attrs({
  resizeMode: 'cover',
})`
  flex: 1;
`;

/* Véu sobre a arte: sem ele, texto claro sobre as partes claras da ilustração
   (o céu, a placa bege) fica ilegível. */
export const Veu = styled.View`
  flex: 1;
  background-color: rgba(6, 12, 30, 0.45);
`;

export const Conteudo = styled.ScrollView.attrs((props) => ({
  contentContainerStyle: {
    paddingHorizontal: 20,
    paddingTop: 12 + (props.$insetTop || 0),
    paddingBottom: 110,
    flexGrow: 1,
  },
}))`
  flex: 1;
`;

export const TopBar = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

/* Pílula de vidro: fundo translúcido escuro por cima da arte, para os dois
   indicadores do topo ficarem legíveis sem tapar a ilustração. */
export const Pilula = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  background-color: rgba(6, 12, 30, 0.62);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.22);
  border-radius: 9999px;
  padding: 10px 16px;
`;

export const PilulaValor = styled.Text`
  font-family: ${fonts.extraBold};
  font-size: 17px;
  color: white;
`;

export const PilulaRotulo = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 12px;
  color: rgba(255, 255, 255, 0.75);
`;

export const EspacoArte = styled.View`
  flex: 1;
  min-height: 150px;
`;

/* O cartão de compra fica na base: a metade de cima da arte (placa e mascotes)
   continua à vista, e a ação principal cai onde o polegar alcança. */
export const PainelCompra = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  border-radius: 28px;
  padding: 22px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  elevation: 12;
`;

export const PainelCabecalho = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
`;

export const IconWrapper = styled.View`
  background-color: ${(props) => props.theme.primaryLight};
  width: 46px;
  height: 46px;
  border-radius: 23px;
  align-items: center;
  justify-content: center;
`;

export const CardTitle = styled.Text`
  flex: 1;
  font-family: ${fonts.bold};
  font-size: 19px;
  color: ${(props) => props.theme.textPrimary};
`;

export const CardText = styled.Text`
  font-size: 13px;
  line-height: 19px;
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 18px;
`;

export const FormGroup = styled.View`
  width: 100%;
  margin-bottom: 16px;
`;

export const Label = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 13px;
  margin-bottom: 8px;
  color: ${(props) => props.theme.textPrimary};
`;

export const SelectField = styled(Pressable)`
  width: 100%;
  padding: 15px 16px;
  border-radius: 14px;
  border-width: 1px;
  border-color: ${(props) => (props.$aberto ? props.theme.primaryColor : props.theme.borderColor)};
  background-color: ${(props) => props.theme.bgPrimary};
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
`;

export const SelectFieldText = styled.Text`
  flex: 1;
  font-size: 15px;
  font-family: ${(props) => (props.$placeholder ? fonts.regular : fonts.semiBold)};
  color: ${(props) => (props.$placeholder ? props.theme.textSecondary : props.theme.textPrimary)};
`;

/* Saldo do hábito escolhido, logo abaixo do seletor: a moeda é por hábito
   (moedas_locais), então o número do topo muda conforme a escolha aqui. */
export const SaldoLinha = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 14px;
  background-color: ${(props) => props.theme.bgPrimary};
  margin-bottom: 18px;
`;

export const SaldoRotulo = styled.Text`
  font-size: 13px;
  color: ${(props) => props.theme.textSecondary};
`;

export const SaldoValor = styled.Text`
  font-family: ${fonts.bold};
  font-size: 15px;
  color: ${(props) => props.theme.warningColor};
`;

export const BuyButton = styled(Pressable)`
  width: 100%;
  padding: 17px;
  border-radius: 9999px;
  background-color: ${(props) => (props.$disabled ? props.theme.borderColor : props.theme.primaryStrong)};
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 10px;
  elevation: 4;
`;

export const BuyButtonText = styled.Text`
  font-family: ${fonts.bold};
  color: ${(props) => (props.$disabled ? props.theme.textSecondary : 'white')};
  font-size: 17px;
`;

export const EmptyStateContainer = styled.View`
  flex: 1;
  padding: 24px;
  justify-content: center;
  align-items: center;
`;

export const EmptyIconWrapper = styled.View`
  background-color: rgba(6, 12, 30, 0.62);
  border-width: 1px;
  border-color: rgba(255, 255, 255, 0.22);
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
  color: white;
  text-align: center;
`;

export const EmptyText = styled.Text`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 21px;
  text-align: center;
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
  font-size: 17px;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 8px;
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

export const PickerOptionMoedas = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 13px;
  color: ${(props) => props.theme.warningColor};
`;

/* --- Conteúdo do inventário, dentro da gaveta --- */

export const DrawerResumo = styled.View`
  background-color: ${(props) => props.theme.primaryLight};
  border-radius: 18px;
  padding: 16px;
  margin-bottom: 20px;
  gap: 4px;
`;

export const DrawerResumoValor = styled.Text`
  font-family: ${fonts.extraBold};
  font-size: 28px;
  color: ${(props) => props.theme.primaryColor};
`;

export const DrawerResumoRotulo = styled.Text`
  font-size: 13px;
  color: ${(props) => props.theme.textPrimary};
`;

export const InventoryList = styled.View`
  gap: 12px;
`;

export const InventoryItem = styled.View`
  padding: 16px;
  background-color: ${(props) => props.theme.bgPrimary};
  border-radius: 16px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  gap: 10px;
`;

export const ItemTitle = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 15px;
  color: ${(props) => props.theme.textPrimary};
`;

export const ItemLinha = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

export const ItemLinhaRotulo = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

export const ItemLinhaTexto = styled.Text`
  font-size: 13px;
  color: ${(props) => props.theme.textSecondary};
`;

export const ItemLinhaValor = styled.Text`
  font-family: ${fonts.bold};
  font-size: 15px;
  color: ${(props) => props.$cor || props.theme.textPrimary};
`;

export const InventoryEmptyText = styled.Text`
  color: ${(props) => props.theme.textSecondary};
  font-size: 14px;
  line-height: 21px;
  text-align: center;
  padding: 24px 0px;
`;
