// @audit-ok: FRONTEND-LoadingScreen-index.jsx-01
import React, { useState, useEffect } from 'react';
import { Container, SunImage, LoadingText } from './styles';
import solFlutuando from '../../../assets/sol_flutuando.webp';

const LoadingScreen = ({ message = "Carregando" }) => {
  const [dots, setDots] = useState('.');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
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
      <SunImage src={solFlutuando} alt="Carregando..." />
    </Container>
  );
};

export default LoadingScreen;
