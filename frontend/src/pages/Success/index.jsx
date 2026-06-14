// @audit-ok: FRONTEND-index.jsx-01
import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Coins, Flame } from 'lucide-react';
import {
  SuccessContainer,
  ParticlesWrapper,
  Particle,
  ContentWrapper,
  IconWrapper,
  Title,
  Subtitle,
  RewardCard,
  Row,
  Label,
  Value,
  Divider,
  BackButton
} from './styles';

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isBonus = location.state?.bonus;
  const feedback = location.state?.feedback;
  
  const moedasGanhas = feedback?.moedas_ganhas || (isBonus ? 150 : 100);
  const diasSeguidos = feedback?.dias_seguidos || 1;
  const subtitleText = feedback?.texto_feedback || 'A excelência é um hábito.';

  const particles = useMemo(() => {
    return Array.from({ length: 50 }).map(() => ({
      size: Math.random() * 10 + 5,
      left: Math.random() * 100,
      duration: (Math.random() * 300) / 100 + 2,
      delay: (Math.random() * 200) / 100
    }));
  }, []);

  return (
    <SuccessContainer $isBonus={isBonus}>
      <ParticlesWrapper>
        {particles.map((p, i) => (
          <Particle 
            key={i} 
            $size={p.size} 
            $left={p.left} 
            $duration={p.duration} 
            $delay={p.delay} 
          />
        ))}
      </ParticlesWrapper>
      
      <ContentWrapper>
        <IconWrapper>
          {isBonus ? '🌟' : '✨'}
        </IconWrapper>
        
        <Title>
          {isBonus ? 'Incrível!' : 'Tarefa Concluída!'}
        </Title>
        <Subtitle>{subtitleText}</Subtitle>
        
        <RewardCard>
          <Row>
            <Label>Recompensa</Label>
            <Value>
              <Coins size={28} /> +{moedasGanhas}
            </Value>
          </Row>
          <Divider />
          <Row>
            <Label>Ofensiva Atual</Label>
            <Value>
              <Flame size={28} /> {diasSeguidos} dias
            </Value>
          </Row>
        </RewardCard>
        
        <BackButton 
          onClick={() => navigate('/home')}
          $isBonus={isBonus}
        >
          VOLTAR PARA A HOME
        </BackButton>
      </ContentWrapper>
    </SuccessContainer>
  );
};

export default Success;
