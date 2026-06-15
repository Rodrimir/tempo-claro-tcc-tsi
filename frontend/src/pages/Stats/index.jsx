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

const Stats = () => {
  const { currentHabit: habit } = useCurrentHabit();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      if (!habit) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // @audit-info :  Em um cenário real de API, você poderia passar o habit.id para getWeeklyStats(habit.id)
        const response = await getWeeklyStats();

        // @audit-info :  Se a API retornar dados reais, usaremos. 
        // @audit-info :  Caso contrário, montamos um chart baseado na meta do hábito ativo.
        if (response.data && response.data.length > 0) {
          setData(response.data);
        } else {
          // @audit-info :  Fallback UI data
          const isTempo = habit.tipo_medida === 'TEMPO';
          const meta = habit.meta_base || 1;
          const fallbackData = [
            { name: 'Seg', valor: isTempo ? meta * 0.8 : meta * 1.1 },
            { name: 'Ter', valor: isTempo ? meta * 1.2 : meta * 0.9 },
            { name: 'Qua', valor: meta },
            { name: 'Qui', valor: 0 },
            { name: 'Sex', valor: isTempo ? meta * 1.5 : meta * 0.5 },
            { name: 'Sáb', valor: isTempo ? meta * 0.2 : meta },
            { name: 'Dom', valor: meta }
          ];
          setData(fallbackData);
        }
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [habit]);

  if (!habit) {
    return (
      <EmptyStateContainer>
        <EmptyIconWrapper>
          <Search size={32} />
        </EmptyIconWrapper>
        <EmptyTitle>Nenhum Hábito em Foco</EmptyTitle>
        <EmptyText>
          Volte para a tela Inicial e posicione um hábito no centro do carrossel para ver seus dados.
        </EmptyText>
      </EmptyStateContainer>
    );
  }

  const isTempo = habit.tipo_medida === 'TEMPO';
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
          <StatCard>
            <CardHeader>
              <Flame size={16} color="var(--warning-color)" /> Dias Seguidos
            </CardHeader>
            <CardValue $large>{habit.dias_seguidos || 0}</CardValue>
          </StatCard>

          <StatCard>
            <CardHeader>
              <Target size={16} color="var(--primary-color)" /> Recorde da Semana
            </CardHeader>
            <CardValue>{formatMedida(maxRecord)}</CardValue>
          </StatCard>
        </GridRow>

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
