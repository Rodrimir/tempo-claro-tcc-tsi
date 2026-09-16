import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { fonts } from '../../styles/fonts';

/* A tela de perfil é uma gaveta lateral, não uma página de formulário: o fundo
   escurecido só existe para o painel da direita parecer sobreposto ao app. */
export const Scrim = styled(Pressable)`
  flex: 1;
  background-color: rgba(15, 23, 42, 0.55);
`;

export const Panel = styled(Animated.View)`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 88%;
  max-width: 400px;
  background-color: ${(props) => props.theme.bgSurface};
  border-top-left-radius: 28px;
  border-bottom-left-radius: 28px;
  elevation: 16;
`;

export const PanelScroll = styled.ScrollView.attrs((props) => ({
  contentContainerStyle: {
    paddingTop: 20 + (props.$insetTop || 0),
    paddingBottom: 40,
  },
}))`
  flex: 1;
`;

export const IdentidadeBloco = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 14px;
  padding: 0px 20px 20px;
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.borderColor};
`;

export const Avatar = styled.View`
  width: 52px;
  height: 52px;
  border-radius: 26px;
  background-color: ${(props) => props.theme.primaryLight};
  align-items: center;
  justify-content: center;
`;

export const AvatarLetra = styled.Text`
  font-family: ${fonts.extraBold};
  font-size: 22px;
  color: ${(props) => props.theme.primaryColor};
`;

export const IdentidadeTexto = styled.View`
  flex: 1;
`;

export const Nome = styled.Text`
  font-family: ${fonts.bold};
  font-size: 18px;
  color: ${(props) => props.theme.textPrimary};
`;

export const Email = styled.Text`
  font-size: 13px;
  color: ${(props) => props.theme.textSecondary};
`;

export const FecharButton = styled(Pressable)`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.theme.bgPrimary};
`;

export const SectionTitle = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${(props) => props.theme.textSecondary};
  padding: 22px 20px 10px;
`;

/* Linha de menu: rótulo à esquerda, e à direita ou o valor atual (quando abre um
   popup ou uma tela) ou o próprio controle (idioma e tema, que resolvem aqui). */
export const MenuRow = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  gap: 14px;
  padding: 16px 20px;
  background-color: ${(props) => (props.$danger ? 'transparent' : props.theme.bgSurface)};
`;

export const MenuIcone = styled.View`
  width: 38px;
  height: 38px;
  border-radius: 12px;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => (props.$danger ? props.theme.dangerLight : props.theme.primaryLight)};
`;

export const MenuTexto = styled.View`
  flex: 1;
  gap: 2px;
`;

export const MenuLabel = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 15px;
  color: ${(props) => (props.$danger ? props.theme.dangerColor : props.theme.textPrimary)};
`;

export const MenuValor = styled.Text`
  font-size: 13px;
  color: ${(props) => props.theme.textSecondary};
`;

/* Legenda do tema dinâmico (G): só aparece quando ele está selecionado, sob a
   linha de tema — explica o horário sem precisar de outra tela. */
export const MenuValorDinamico = styled.Text`
  font-size: 12px;
  color: ${(props) => props.theme.textSecondary};
  padding: 0px 20px 14px;
  margin-top: -8px;
`;

export const Separador = styled.View`
  height: 1px;
  margin-left: 72px;
  background-color: ${(props) => props.theme.borderColor};
`;

export const SegmentedControl = styled.View`
  flex-direction: row;
  background-color: ${(props) => props.theme.bgPrimary};
  border-radius: 12px;
  padding: 4px;
  gap: 4px;
`;

export const LanguageChip = styled(Pressable)`
  background-color: ${(props) => (props.$active ? props.theme.bgSurface : 'transparent')};
  border-radius: 9px;
  padding: 7px 11px;
  flex-direction: row;
  align-items: center;
  gap: 5px;
`;

export const LanguageChipText = styled.Text`
  font-family: ${(props) => (props.$active ? fonts.bold : fonts.regular)};
  font-size: 13px;
  color: ${(props) => (props.$active ? props.theme.primaryColor : props.theme.textSecondary)};
`;

export const ThemeOptionButton = styled(Pressable)`
  background-color: ${(props) => (props.$active ? props.theme.bgSurface : 'transparent')};
  border-radius: 9px;
  padding: 8px 12px;
`;

/* --- Popups (fuso, nome, confirmação de saída) --- */

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
  max-height: 75%;
`;

export const PickerTitulo = styled.Text`
  font-family: ${fonts.bold};
  font-size: 18px;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 12px;
`;

export const PickerGroupLabel = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: ${(props) => props.theme.textSecondary};
  margin: 16px 0px 6px;
`;

export const PickerOption = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 8px;
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.borderColor};
`;

export const PickerOptionText = styled.Text`
  flex: 1;
  font-size: 15px;
  font-family: ${(props) => (props.$active ? fonts.bold : fonts.regular)};
  color: ${(props) => (props.$active ? props.theme.primaryColor : props.theme.textPrimary)};
`;

export const CenterOverlay = styled.View`
  flex: 1;
  background-color: rgba(15, 23, 42, 0.85);
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const DialogCard = styled.View`
  width: 100%;
  max-width: 400px;
  background-color: ${(props) => props.theme.bgSurface};
  border-radius: 22px;
  padding: 24px;
  elevation: 8;
`;

export const DialogTitle = styled.Text`
  font-family: ${fonts.bold};
  font-size: 18px;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 10px;
`;

export const DialogText = styled.Text`
  font-size: 14px;
  line-height: 20px;
  color: ${(props) => props.theme.textSecondary};
  margin-bottom: 22px;
`;

export const DialogInput = styled.TextInput.attrs((props) => ({
  placeholderTextColor: props.theme.textSecondary,
}))`
  width: 100%;
  padding: 15px 16px;
  border-radius: 12px;
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  background-color: ${(props) => props.theme.bgPrimary};
  color: ${(props) => props.theme.textPrimary};
  font-size: 16px;
  margin-bottom: 22px;
`;

export const DialogActions = styled.View`
  flex-direction: row;
  gap: 12px;
`;

export const DialogCancel = styled(Pressable)`
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  background-color: ${(props) => props.theme.bgPrimary};
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  align-items: center;
`;

export const DialogCancelText = styled.Text`
  font-family: ${fonts.bold};
  color: ${(props) => props.theme.textPrimary};
`;

export const DialogConfirm = styled(Pressable)`
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  background-color: ${(props) => (props.$danger ? props.theme.dangerStrong : props.theme.primaryStrong)};
  align-items: center;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`;

export const DialogConfirmText = styled.Text`
  font-family: ${fonts.bold};
  color: white;
`;
