import { useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';

export function useFloat(duration = 3000, distance = 8) {
  const valor = useSharedValue(0);
  useEffect(() => {
    valor.value = withRepeat(
      withSequence(
        withTiming(-distance, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, []);
  return useAnimatedStyle(() => ({ transform: [{ translateY: valor.value }] }));
}

export function usePulse() {
  const escala = useSharedValue(1);
  useEffect(() => {
    escala.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, []);
  return useAnimatedStyle(() => ({ transform: [{ scale: escala.value }] }));
}
