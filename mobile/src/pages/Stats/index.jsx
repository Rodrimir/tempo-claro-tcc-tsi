import { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { Svg, Rect } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
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
  CardHeaderText,
  CardValue,
  CardSubtext,
  ChartCard,
  ChartTitle,
  ChartWrapper,
  BarLabel,
  EmptyStateContainer,
  EmptyIconWrapper,
  EmptyTitle,
  EmptyText,
  RetryButton,
  RetryButtonText,
} from './styles';

const ALTURA_GRAFICO = 160;

function GraficoBarras({ dias, theme }) {
  const [largura, setLargura] = useState(0);
  const maxValor = Math.max(1, ...dias.map((d) => d.valor_realizado));
  const barWidth = largura > 0 ? largura / dias.length : 0;
  const gap = 8;

  return (
    <View>
      <ChartWrapper onLayout={(e) => setLargura(e.nativeEvent.layout.width)} style={{ height: ALTURA_GRAFICO }}>
        {largura > 0 && (
          <Svg width={largura} height={ALTURA_GRAFICO}>
            {dias.map((dia, i) => {
              const h = Math.max(4, (dia.valor_realizado / maxValor) * (ALTURA_GRAFICO - 8));
              return (
                <Rect
                  key={dia.data}
                  x={i * barWidth + gap / 2}
                  y={ALTURA_GRAFICO - h}
                  width={Math.max(0, barWidth - gap)}
                  height={h}
                  rx={6}
                  fill={dia.parcial ? theme.warningColor : theme.primaryColor}
                />
              );
            })}
          </Svg>
        )}
      </ChartWrapper>
      <View style={{ flexDirection: 'row' }}>
        {dias.map((dia) => (
          <View key={dia.data} style={{ flex: 1, alignItems: 'center' }}>
            <BarLabel>{dia.nome}</BarLabel>
          </View>
        ))}
      </View>
    </View>
  );
}

const Stats = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentHabit: habit } = useCurrentHabit();
  const { addToast } = useToast();
  const [dias, setDias] = useState([]);
  const [recorde, setRecorde] = useState(0);
  const [constanciaPercentual, setConstanciaPercentual] = useState(0);
  const [diasComMetaCumprida, setDiasComMetaCumprida] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const loadStats = useCallback(async () => {
    if (!habit) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(false);
    try {
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
      addToast('Não foi possível carregar as estatísticas.', 'error');
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [habit, addToast]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (!habit) {
    return (
      <EmptyStateContainer>
        <EmptyIconWrapper>
          <Feather name="search" size={32} color={theme.textSecondary} />
        </EmptyIconWrapper>
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

  if (loadError) {
    return (
      <EmptyStateContainer>
        <EmptyIconWrapper>
          <Feather name="alert-triangle" size={32} color={theme.textSecondary} />
        </EmptyIconWrapper>
        <EmptyTitle>Não foi possível carregar</EmptyTitle>
        <EmptyText>Verifique sua conexão e tente novamente.</EmptyText>
        <RetryButton onPress={loadStats}>
          <RetryButtonText>Tentar novamente</RetryButtonText>
        </RetryButton>
      </EmptyStateContainer>
    );
  }

  const semExecucoes = dias.every((dia) => dia.execucoes === 0 && !dia.parcial);
  if (semExecucoes) {
    return (
      <StatsContainer style={{ paddingTop: insets.top + 24 }}>
        <Title>Dados do Hábito</Title>
        <HabitTitle>{habit.titulo}</HabitTitle>
        <EmptyStateContainer>
          <EmptyIconWrapper>
            <Feather name="bar-chart-2" size={32} color={theme.textSecondary} />
          </EmptyIconWrapper>
          <EmptyTitle>Nada por aqui ainda</EmptyTitle>
          <EmptyText>Ainda não há execuções registradas. Complete uma tarefa para ver seu desempenho aqui.</EmptyText>
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
          <StatCard>
            <CardHeader>
              <MaterialCommunityIcons name="fire" size={16} color={theme.warningColor} />
              <CardHeaderText>Dias Seguidos</CardHeaderText>
            </CardHeader>
            <CardValue $large>{habit.dias_seguidos || 0}</CardValue>
          </StatCard>
          <StatCard>
            <CardHeader>
              <Feather name="target" size={16} color={theme.primaryColor} />
              <CardHeaderText>Recorde da Semana</CardHeaderText>
            </CardHeader>
            <CardValue>{formatMedida(recorde)}</CardValue>
          </StatCard>
        </GridRow>

        <StatCard>
          <CardHeader>
            <Feather name="percent" size={16} color={theme.successColor} />
            <CardHeaderText>Constância Semanal</CardHeaderText>
          </CardHeader>
          <CardValue $large>{constanciaPercentual}%</CardValue>
          <CardSubtext>{diasComMetaCumprida} de 7 dias com a meta cumprida</CardSubtext>
        </StatCard>

        <ChartCard>
          <ChartTitle>Desempenho (Últimos 7 dias)</ChartTitle>
          {dias.some((dia) => dia.parcial) && (
            <CardSubtext style={{ marginTop: -16, marginBottom: 16 }}>
              Barras em laranja são tentativas parciais (desistência)
            </CardSubtext>
          )}
          <GraficoBarras dias={dias} theme={theme} />
        </ChartCard>
      </ContentWrapper>
    </StatsContainer>
  );
};

export default Stats;
