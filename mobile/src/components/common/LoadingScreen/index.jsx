import { useState, useEffect } from 'react';
import { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Container, SunImage, LoadingText } from './styles';

const LoadingScreen = ({ message = 'Carregando' }) => {
  const [dots, setDots] = useState('.');
  const rotacao = useSharedValue(0);

  useEffect(() => {
    rotacao.value = withRepeat(withTiming(360, { duration: 4000, easing: Easing.linear }), -1);
  }, []);

  const estiloRotacao = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotacao.value}deg` }],
  }));

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '.') return '..';
        if (prev === '..') return '...';
        return '.';
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container>
      <LoadingText>{message}{dots}</LoadingText>
      <SunImage
        source={require('../../../../assets/sol_flutuando.webp')}
        style={estiloRotacao}
        contentFit="contain"
      />
    </Container>
  );
};

export default LoadingScreen;
