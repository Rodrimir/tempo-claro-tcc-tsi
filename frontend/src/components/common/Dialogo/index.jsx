import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';
import { Cartao, Folha, Titulo, LinhaDeBotoes } from './styles';
import { LARGURA_MAXIMA, medidasDoDialogo } from './medidas';

export { LARGURA_MAXIMA, LARGURA_PARA_EMPILHAR, medidasDoDialogo } from './medidas';

// Diálogo comum do app. "centro" é o alerta no meio da tela; "folha" é a lista que sobe de baixo
// (seletores). Fecha ao tocar fora, se onClose vier, e acompanha o teclado.
export default function Dialogo({ visible, onClose, titulo, children, acoes, variante = 'centro', accessibilityLabel }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const medidas = medidasDoDialogo(width, height, insets);
  const Caixa = variante === 'folha' ? Folha : Cartao;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View
          style={[
            styles.fundo,
            { backgroundColor: theme.overlayColor, paddingTop: insets.top, paddingBottom: insets.bottom },
            variante === 'folha' ? styles.fundoFolha : styles.fundoCentro,
          ]}
        >
          {onClose ? (
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
            />
          ) : null}
          <Caixa
            accessibilityViewIsModal
            style={{
              width: variante === 'folha' ? width : medidas.largura,
              maxWidth: variante === 'folha' ? undefined : LARGURA_MAXIMA,
              maxHeight: medidas.alturaMaxima,
            }}
          >
            {titulo ? <Titulo accessibilityRole="header">{titulo}</Titulo> : null}
            <ScrollView
              style={{ flexGrow: 0 }}
              contentContainerStyle={{ flexGrow: 0 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
            {acoes ? <LinhaDeBotoes $empilhar={medidas.empilharBotoes}>{acoes}</LinhaDeBotoes> : null}
          </Caixa>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fundo: { flex: 1 },
  fundoCentro: { alignItems: 'center', justifyContent: 'center' },
  fundoFolha: { justifyContent: 'flex-end' },
});

export { BotaoDoDialogo, TextoDoBotao, TextoDoDialogo } from './styles';
