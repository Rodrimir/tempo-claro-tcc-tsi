import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Search, Flame, Target } from 'lucide-react';
import LoadingScreen from '../../components/common/LoadingScreen';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
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
  ChartCard,
  ChartTitle,
  ChartWrapper,
  EmptyStateContainer,
  EmptyIconWrapper,
  EmptyTitle,
  EmptyText
} from './styles';

// @audit-ok [Estatísticas (1) — tela de métricas do hábito selecionado no carrossel]

const Stats = () => {
  // @audit-ok [Estatísticas (2) — lê o hábito ativo do context compartilhado com o Home]
  const { currentHabit: habit } = useCurrentHabit();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // @audit-ok [Estatísticas (4) — carrega dados semanais ao montar ou ao mudar o hábito]
  useEffect(() => {
    const loadStats = async () => {
      // @audit-ok [Estatísticas (3) — retorna estado vazio se não há hábito selecionado]
      if (!habit) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // @audit-ok [Estatísticas (5) — chama GET /stats/weekly]
        const response = await getWeeklyStats();
        // @audit-ok [Estatísticas (7) — armazena dados reais ou array vazio (endpoint ainda não implementado)]
        if (response.data && response.data.length > 0) {
          setData(response.data);
        } else {
          setData([]);
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, [habit]);

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
  // @audit-ok [Estatísticas (8) — calcula recorde da semana a partir dos dados retornados]
  const maxRecord = data.length > 0 ? Math.max(...data.map(d => d.valor)) : 0;

  const formatMedida = (valor) => {
    if (isTempo) return `${Math.round(valor / 60)} min`;
    return `${Math.round(valor)} ${habit.categoria === 'AGUA' ? 'ml' : 'vezes'}`;
  };

  if (loading) return <LoadingScreen message="Carregando Estatísticas" />;

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
            <CardValue>{formatMedida(maxRecord)}</CardValue>
          </StatCard>
        </GridRow>

        {/* @audit-ok [Estatísticas (9) — gráfico de barras com dados dos últimos 7 dias] */}
        <ChartCard>
          <ChartTitle>Desempenho (Últimos 7 dias)</ChartTitle>
          <ChartWrapper>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" stroke="var(--text-secondary)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'var(--primary-light)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', fontWeight: 600 }}
                  formatter={(value) => [formatMedida(value), 'Realizado']}
                />
                <Bar dataKey="valor" fill="var(--primary-color)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </ChartCard>
      </ContentWrapper>
    </StatsContainer>
  );
};

export default Stats;
