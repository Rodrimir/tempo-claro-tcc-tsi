import { useEffect, useRef } from 'react';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { SEGUNDOS_PARA_SE_COMPROMETER } from '@/onboarding/passos';
import { BotaoSegurar, BotaoPrincipalTexto, DicaDoBotao } from './styles';

const DURACAO_MS = SEGUNDOS_PARA_SE_COMPROMETER * 1000;

// "Eu me comprometo" só vale segurando o botão: a barra enche em 2 segundos e soltar antes desfaz.
// O gesto deliberado é o que transforma o botão num compromisso. Com leitor de tela, o toque duplo
// confirma direto, porque o gesto de segurar não chega ao app.
export function BotaoDeCompromisso({ rotulo, dica, dicaLeitor, desabilitado, onConfirmar }) {
  const progresso = useSharedValue(0);
  const temporizador = useRef(null);
  const confirmado = useRef(false);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  const comecar = () => {
    if (desabilitado) return;
    confirmado.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    progresso.value = withTiming(1, { duration: DURACAO_MS, easing: Easing.linear });
    temporizador.current = setTimeout(() => {
      confirmado.current = true;
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onConfirmar();
    }, DURACAO_MS);
  };

  const soltar = () => {
    clearTimeout(temporizador.current);
    if (confirmado.current) return;
    cancelAnimation(progresso);
    progresso.value = withTiming(0, { duration: 200 });
  };

  const barra = useAnimatedStyle(() => ({ width: `${progresso.value * 100}%` }));

  return (
    <>
      <BotaoSegurar
        accessibilityRole="button"
        accessibilityLabel={rotulo}
        accessibilityHint={dicaLeitor}
        accessibilityState={{ disabled: desabilitado, busy: desabilitado }}
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={(evento) => {
          if (evento.nativeEvent.actionName === 'activate' && !desabilitado) onConfirmar();
        }}
        disabled={desabilitado}
        onPressIn={comecar}
        onPressOut={soltar}
      >
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.28)' }, barra]}
        />
        <BotaoPrincipalTexto>{rotulo}</BotaoPrincipalTexto>
      </BotaoSegurar>
      <DicaDoBotao>{dica}</DicaDoBotao>
    </>
  );
}
