import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { fonts } from '../../../styles/fonts';

export const Backdrop = styled(Pressable)`
  flex: 1;
  background-color: rgba(15, 23, 42, 0.6);
`;

/* O painel encosta na borda direita e ocupa a altura toda: é o formato de gaveta
   lateral, diferente do modal centralizado usado nas confirmações. */
export const Panel = styled(Animated.View)`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  width: 86%;
  max-width: 380px;
  background-color: ${(props) => props.theme.bgSurface};
  border-top-left-radius: 24px;
  border-bottom-left-radius: 24px;
  elevation: 16;
`;

export const PanelHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 20px 20px 16px;
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.borderColor};
`;

export const PanelTitle = styled.Text`
  flex: 1;
  font-family: ${fonts.bold};
  font-size: 20px;
  color: ${(props) => props.theme.textPrimary};
`;

export const CloseButton = styled(Pressable)`
  width: 36px;
  height: 36px;
  border-radius: 18px;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.theme.bgPrimary};
`;

export const PanelBody = styled.ScrollView.attrs({
  contentContainerStyle: { padding: 20, paddingBottom: 40 },
})`
  flex: 1;
`;
