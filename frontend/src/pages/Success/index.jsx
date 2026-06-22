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

// @audit-ok [Sucesso (1) — tela de feedback positivo; lê dados da recompensa do estado de navegação]

const Success = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // @audit-ok [Sucesso (2) — extrai flag de bônus do estado de navegação]
  const isBonus = location.state?.bonus;
  // @audit-ok [Sucesso (3) — extrai dados da recompensa retornados pela API de execução]
  const feedback = location.state?.feedback;

  const moedasGanhas = feedback?.moedas_ganhas || (isBonus ? 150 : 100);
  const diasSeguidos = feedback?.dias_seguidos || 1;
  const subtitleText = feedback?.texto_feedback || 'A excelência é um hábito.';

  // @audit-ok [Sucesso (4) — gera 50 partículas com posições e durações aleatórias para a animação]
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
          <Particle key={i} $size={p.size} $left={p.left} $duration={p.duration} $delay={p.delay} />
        ))}
      </ParticlesWrapper>

      <ContentWrapper>
        {/* @audit-ok [Sucesso (5) — exibe emoji, título e subtítulo diferenciados para conclusão padrão e extra] */}
        <IconWrapper>{isBonus ? '🌟' : '✨'}</IconWrapper>
        <Title>{isBonus ? 'Incrível!' : 'Tarefa Concluída!'}</Title>
        <Subtitle>{subtitleText}</Subtitle>

        <RewardCard>
          <Row>
            <Label>Recompensa</Label>
            <Value><Coins size={28} /> +{moedasGanhas}</Value>
          </Row>
          <Divider />
          <Row>
            <Label>Ofensiva Atual</Label>
            <Value><Flame size={28} /> {diasSeguidos} dias</Value>
          </Row>
        </RewardCard>

        {/* @audit-ok [Sucesso (6) — retorna ao dashboard] */}
        <BackButton onClick={() => navigate('/home')} $isBonus={isBonus}>
          VOLTAR PARA A HOME
        </BackButton>
      </ContentWrapper>
    </SuccessContainer>
  );
};

export default Success;
