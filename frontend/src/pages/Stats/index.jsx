import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, Cell, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Flame, Target, AlertTriangle, Percent, BarChart2 } from 'lucide-react';
import LoadingScreen from '../../components/common/LoadingScreen';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
import { useToast } from '../../contexts/ToastContext';
import { getWeeklyStats } from '../../services/api';
import {
  StatsContainer,
  Title,
  HabitTitle,
  ContentWrapper,
  GridRow,
  StatCard,
  CardHeader,
  CardValue,
  CardSubtext,
  ChartCard,
  ChartTitle,
  ChartWrapper,
  EmptyStateContainer,
  EmptyIconWrapper,
  EmptyTitle,
  EmptyText,
  RetryButton
} from './styles';

// @audit-ok [Estatísticas (1) — tela de métricas do hábito selecionado no carrossel]

const Stats = () => {
  // @audit-ok [Estatísticas (2) — lê o hábito ativo do context compartilhado com o Home]
  const { currentHabit: habit } = useCurrentHabit();
  const { addToast } = useToast();
  const [dias, setDias] = useState([]);
  // @audit-ok [E2.2 — recorde e constância vêm prontos do servidor agora
  // (StatsResponseDTO), não mais calculados no cliente a partir do array de dias]
  const [recorde, setRecorde] = useState(0);
  const [constanciaPercentual, setConstanciaPercentual] = useState(0);
  const [diasComMetaCumprida, setDiasComMetaCumprida] = useState(0);
  const [loading, setLoading] = useState(true);
  // @audit-ok [E1.8 — distinto de "0 pontos no gráfico". O stub GET
  // /stats/weekly antigo sempre devolvia [], então sem este estado uma falha
  // de rede e "ainda não há dado nenhum" ficavam visualmente idênticos.]
  const [loadError, setLoadError] = useState(false);

  // @audit-ok [Estatísticas (4) — carrega dados semanais ao montar ou ao mudar o
  // hábito. E2.2 (item 5): envia habitoId (query param obrigatório agora) e
  // consome os três campos da resposta — gráfico, recorde e constância.]
  const loadStats = useCallback(async () => {
    // @audit-ok [Estatísticas (3) — retorna estado vazio se não há hábito selecionado]
    if (!habit) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(false);
    try {
      // @audit-ok [Estatísticas (5) — chama GET /stats/weekly?habitoId=...]
      const response = await getWeeklyStats(habit.id);
      const dadosDias = response.data?.dias;
      if (Array.isArray(dadosDias)) {
        setDias(dadosDias);
        setRecorde(response.data.recorde ?? 0);
        setConstanciaPercentual(response.data.constancia_semanal_percentual ?? 0);
        setDiasComMetaCumprida(response.data.dias_com_meta_cumprida ?? 0);
      } else {
        setDias([]);
        setRecorde(0);
        setConstanciaPercentual(0);
        setDiasComMetaCumprida(0);
      }
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
      // @audit-ok [E1.8 (item 1) — antes só logava no console e seguia como se
      // nada tivesse acontecido, mostrando o gráfico como se estivesse vazio]
      addToast('Não foi possível carregar as estatísticas.', 'error');
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [habit, addToast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // @audit-ok [Estatísticas (3) — exibe estado vazio quando não há hábito em foco no carrossel]
  if (!habit) {
    return (
      <EmptyStateContainer>
        <EmptyIconWrapper><Search size={32} /></EmptyIconWrapper>
        <EmptyTitle>Nenhum Hábito em Foco</EmptyTitle>
        <EmptyText>
          Volte para a tela Inicial e posicione um hábito no centro do carrossel para ver seus dados.
        </EmptyText>
      </EmptyStateContainer>
    );
  }

  const isTempo = habit.tipo_medida === 'TEMPO';

  const formatMedida = (valor) => {
    if (isTempo) return `${Math.round(valor / 60)} min`;
    return `${Math.round(valor)} ${habit.categoria === 'AGUA' ? 'ml' : 'vezes'}`;
  };

  if (loading) return <LoadingScreen message="Carregando Estatísticas" />;

  // @audit-ok [E1.8 — nunca cai no gráfico vazio quando a causa foi uma falha
  // na requisição, não a ausência real de dados]
  if (loadError) {
    return (
      <EmptyStateContainer>
        <EmptyIconWrapper><AlertTriangle size={32} /></EmptyIconWrapper>
        <EmptyTitle>Não foi possível carregar</EmptyTitle>
        <EmptyText>Verifique sua conexão e tente novamente.</EmptyText>
        <RetryButton onClick={loadStats}>Tentar novamente</RetryButton>
      </EmptyStateContainer>
    );
  }

  // @audit-ok [E3.1 (item 3) — antes desta tarefa, um hábito sem nenhuma
  // execução na janela de 7 dias caía direto no gráfico normal: os 7 dias
  // zero-fill (E2.2) renderizavam, mas o recharts não desenha <path> nenhum
  // pra barra de valor 0 (achado na E2.5) — o gráfico ficava literalmente em
  // branco, sem uma palavra de explicação. Aproximação deliberada: "sem dado
  // nos últimos 7 dias" vira "ainda não há execuções" — /stats/weekly só
  // enxerga essa janela, não tem como saber se existe uma execução mais
  // antiga fora dela; um hábito com histórico só fora da janela é
  // indistinguível de um nunca executado nesta tela mesmo.]
  const semExecucoes = dias.every(dia => dia.execucoes === 0 && !dia.parcial);
  if (semExecucoes) {
    return (
      <StatsContainer>
        <Title>Dados do Hábito</Title>
        <HabitTitle>{habit.titulo}</HabitTitle>
        <EmptyStateContainer>
          <EmptyIconWrapper><BarChart2 size={32} /></EmptyIconWrapper>
          <EmptyTitle>Nada por aqui ainda</EmptyTitle>
          <EmptyText>
            Ainda não há execuções registradas. Complete uma tarefa para ver seu desempenho aqui.
          </EmptyText>
        </EmptyStateContainer>
      </StatsContainer>
    );
  }

  return (
    <StatsContainer>
      <Title>Dados do Hábito</Title>
      <HabitTitle>{habit.titulo}</HabitTitle>

      <ContentWrapper>
        <GridRow>
          {/* @audit-ok [Estatísticas (10) — exibe dias_seguidos e recorde da semana vindos do hábito e dos dados] */}
          <StatCard>
            <CardHeader><Flame size={16} color="var(--warning-color)" /> Dias Seguidos</CardHeader>
            <CardValue $large>{habit.dias_seguidos || 0}</CardValue>
          </StatCard>
          <StatCard>
            <CardHeader><Target size={16} color="var(--primary-color)" /> Recorde da Semana</CardHeader>
            <CardValue>{formatMedida(recorde)}</CardValue>
          </StatCard>
        </GridRow>

        {/* @audit-ok [E2.2 (item 4/6) — RF17: constância semanal. Não existia
            nem no backend nem na interface antes desta tarefa.] */}
        <StatCard>
          <CardHeader><Percent size={16} color="var(--success-color)" /> Constância Semanal</CardHeader>
          <CardValue $large>{constanciaPercentual}%</CardValue>
          <CardSubtext>{diasComMetaCumprida} de 7 dias com a meta cumprida</CardSubtext>
        </StatCard>

        {/* @audit-ok [Estatísticas (9) — gráfico de barras com dados dos últimos 7 dias] */}
        <ChartCard>
          <ChartTitle>Desempenho (Últimos 7 dias)</ChartTitle>
          {/* @audit-ok [E2.5 (item 2) — RF10: legenda só aparece na semana que
              de fato tem alguma barra parcial, pra não virar ruído visual toda
              semana sem desistência nenhuma.] */}
          {dias.some(dia => dia.parcial) && (
            <CardSubtext style={{ marginTop: '-16px', marginBottom: '16px' }}>
              Barras em laranja são tentativas parciais (desistência)
            </CardSubtext>
          )}
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dias}>
                <XAxis dataKey="nome" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'var(--primary-light)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontWeight: 600 }}
                  // @audit-ok [E2.5 — props.payload é o DiaStatsDTO inteiro da
                  // barra; distingue o rótulo do tooltip sem duplicar a lista
                  // de dias em outro lugar.]
                  formatter={(value, name, props) => [formatMedida(value), props?.payload?.parcial ? 'Parcial (desistência)' : 'Realizado']}
                />
                {/* @audit-ok [E2.5 (item 2) — fill por <Cell>, não mais fixo no
                    <Bar>: cada barra vira laranja (parcial) ou roxa (concluída)
                    de acordo com o próprio dia, visualmente distintas.] */}
                <Bar dataKey="valor_realizado" radius={[6, 6, 0, 0]}>
                  {dias.map((dia) => (
                    <Cell key={dia.data} fill={dia.parcial ? 'var(--warning-color)' : 'var(--primary-color)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </ChartCard>
      </ContentWrapper>
    </StatsContainer>
  );
};

export default Stats;
