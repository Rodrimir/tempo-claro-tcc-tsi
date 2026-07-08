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

  // @audit-ok [Concluir Hoje (F04) — modo "meta diária": encerramento do dia com a recompensa apurada]
  const isMetaDiaria = location.state?.metaDiaria;
  // @audit-ok [Sucesso (3) — dados retornados pela API (execução de progresso ou conclusão do dia)]
  const feedback = location.state?.feedback;

  // @audit-info [Sucesso (3) — economia diferida: a execução não credita moeda (só no fim do dia / Concluir Hoje)]
  const metaConcluida = feedback?.meta_concluida_hoje;
  const moedasGanhas = feedback?.moedas_ganhas ?? 0;
  const diasSeguidos = feedback?.dias_seguidos;

  // @audit-info [Sucesso (3) — celebra quando o dia foi concluído (Concluir Hoje) ou quando a execução fechou a meta diária]
  const celebrar = isMetaDiaria || metaConcluida;
  const icone = celebrar ? '🏆' : '✅';
  const titulo = celebrar ? 'Meta de Hoje Atingida!' : 'Parte Concluída!';
  const subtitleText = isMetaDiaria
    ? 'Parabéns, você atingiu sua meta hoje! 🎉'
    : (metaConcluida
        ? 'Você bateu sua meta! Toque em "Concluir Hoje" na Home para receber suas moedas.'
        : 'Continue rumo à sua meta. As moedas são creditadas ao concluir o dia.');

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
    <SuccessContainer $isBonus={celebrar}>
      <ParticlesWrapper>
        {particles.map((p, i) => (
          <Particle key={i} $size={p.size} $left={p.left} $duration={p.duration} $delay={p.delay} />
        ))}
      </ParticlesWrapper>

      <ContentWrapper>
        {/* @audit-ok [Sucesso (5) — meta atingida (🏆) × parte concluída (✅); moedas só no fechamento do dia] */}
        <IconWrapper>{icone}</IconWrapper>
        <Title>{titulo}</Title>
        <Subtitle>{subtitleText}</Subtitle>

        {/* @audit-ok [Concluir Hoje (F04) — recompensa só aparece quando o dia foi apurado/creditado] */}
        <RewardCard>
          {isMetaDiaria && moedasGanhas > 0 ? (
            <>
              <Row>
                <Label>Recompensa</Label>
                <Value><Coins size={28} /> +{moedasGanhas}</Value>
              </Row>
              {diasSeguidos != null && (
                <>
                  <Divider />
                  <Row>
                    <Label>Ofensiva Atual</Label>
                    <Value><Flame size={28} /> {diasSeguidos} dias</Value>
                  </Row>
                </>
              )}
            </>
          ) : (
            <Row>
              <Label>Recompensa do dia</Label>
              <Value style={{ fontSize: '15px', fontWeight: 600 }}>Creditada ao concluir o dia</Value>
            </Row>
          )}
        </RewardCard>

        {/* @audit-ok [Sucesso (6) — retorna ao dashboard] */}
        <BackButton onClick={() => navigate('/home')} $isBonus={celebrar}>
          VOLTAR PARA A HOME
        </BackButton>
      </ContentWrapper>
    </SuccessContainer>
  );
};

export default Success;
