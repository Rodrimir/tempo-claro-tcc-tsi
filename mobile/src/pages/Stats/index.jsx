import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Modal } from 'react-native';
import { Svg, Rect } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import LoadingScreen from '../../components/common/LoadingScreen';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
import { useToast } from '../../contexts/ToastContext';
import { getMonthlyStats, getDashboard } from '../../services/api';
import { useI18n } from '../../contexts/LanguageContext';
import {
  StatsContainer,
  Title,
  HabitTitleButton,
  HabitTitle,
  PickerOverlay,
  PickerSheet,
  PickerTitulo,
  PickerOption,
  PickerOptionText,
  ContentWrapper,
  GridRow,
  StatCard,
  CardHeader,
  CardHeaderText,
  CardValue,
  CardSubtext,
  ChartCard,
  RecordeRow,
  RecordePosicao,
  RecordeData,
  RecordeValor,
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

/* Dia de folga não é dia de falha: fica mais apagado que um dia cobrado e vazio,
   para a leitura do gráfico não sugerir buraco onde não havia cobrança. */
function opacidadeDaBarra(dia) {
  if (dia.valor_realizado > 0) return 1;
  return dia.dia_programado === false ? 0.1 : 0.25;
}

function GraficoBarras({ dias, theme }) {
  const [largura, setLargura] = useState(0);
  const maxValor = Math.max(1, ...dias.map((d) => d.valor_realizado));
  const barWidth = largura > 0 ? largura / dias.length : 0;
  // Com 30 barras o respiro de 8px de antes come a barra inteira: vira traço.
  const gap = dias.length > 10 ? 2 : 8;

  // Um rótulo por barra em 30 dias vira borrão. Marca o primeiro dia e depois a
  // cada cinco, que é o suficiente para situar a leitura no tempo.
  const intervaloRotulo = dias.length > 10 ? 5 : 1;
  const rotulo = (dia, i) => {
    if (i % intervaloRotulo !== 0) return '';
    if (dias.length > 10) {
      const [, mes, d] = dia.data.split('-');
      return `${d}/${mes}`;
    }
    return dia.nome;
  };

  return (
    <View>
      <ChartWrapper onLayout={(e) => setLargura(e.nativeEvent.layout.width)} style={{ height: ALTURA_GRAFICO }}>
        {largura > 0 && (
          <Svg width={largura} height={ALTURA_GRAFICO}>
            {dias.map((dia, i) => {
              const h = Math.max(dia.valor_realizado > 0 ? 4 : 2, (dia.valor_realizado / maxValor) * (ALTURA_GRAFICO - 8));
              return (
                <Rect
                  key={dia.data}
                  x={i * barWidth + gap / 2}
                  y={ALTURA_GRAFICO - h}
                  width={Math.max(1, barWidth - gap)}
                  height={h}
                  rx={dias.length > 10 ? 2 : 6}
                  fill={dia.parcial ? theme.warningColor : theme.primaryColor}
                  opacity={opacidadeDaBarra(dia)}
                />
              );
            })}
          </Svg>
        )}
      </ChartWrapper>
      {/* Com 30 barras, uma célula flex por dia dá 1/30 da largura a cada rótulo e
          "18/06" sai espremido. Os rótulos são posicionados sobre a mesma régua das
          barras: cada um fica centrado na sua barra e pode transbordar sobre as
          vizinhas, que estão vazias. */}
      <View style={{ height: 16 }}>
        {largura > 0 &&
          dias.map((dia, i) => {
            const texto = rotulo(dia, i);
            if (!texto) return null;
            return (
              <BarLabel
                key={dia.data}
                numberOfLines={1}
                style={{
                  position: 'absolute',
                  left: i * barWidth + barWidth / 2 - 20,
                  width: 40,
                  textAlign: 'center',
                }}
              >
                {texto}
              </BarLabel>
            );
          })}
      </View>
    </View>
  );
}

const Stats = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentHabit: habit, setCurrentHabit } = useCurrentHabit();
  const { addToast } = useToast();
  const { t } = useI18n();
  const [dias, setDias] = useState([]);
  const [recordes, setRecordes] = useState([]);
  const [constanciaPercentual, setConstanciaPercentual] = useState(0);
  const [diasComMetaCumprida, setDiasComMetaCumprida] = useState(0);
  const [diasPeriodo, setDiasPeriodo] = useState(30);
  // Denominador da constância: só os dias que o hábito cobrava na janela.
  const [diasCobrados, setDiasCobrados] = useState(30);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [habitosDisponiveis, setHabitosDisponiveis] = useState([]);
  const [pickerAberto, setPickerAberto] = useState(false);

  const loadStats = useCallback(async (silencioso = false) => {
    if (!habit) {
      setLoading(false);
      return;
    }
    if (!silencioso) setLoading(true);
    setLoadError(false);
    try {
      const response = await getMonthlyStats(habit.id);
      const dadosDias = response.data?.dias;
      if (Array.isArray(dadosDias)) {
        setDias(dadosDias);
        // F18 virou uma lista: os três maiores dias do mês, cada um com sua data.
        setRecordes(Array.isArray(response.data.recordes) ? response.data.recordes : []);
        setConstanciaPercentual(response.data.constancia_percentual ?? 0);
        setDiasComMetaCumprida(response.data.dias_com_meta_cumprida ?? 0);
        setDiasPeriodo(response.data.dias_periodo ?? 30);
        setDiasCobrados(response.data.dias_cobrados ?? response.data.dias_periodo ?? 30);
      } else {
        setDias([]);
        setRecordes([]);
        setConstanciaPercentual(0);
        setDiasComMetaCumprida(0);
      }
    } catch (error) {
      addToast(t('stats.erro'), 'error');
      setLoadError(true);
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [habit, addToast]);

  const primeiraCarga = useRef(true);
  useFocusEffect(
    useCallback(() => {
      loadStats(!primeiraCarga.current);
      primeiraCarga.current = false;
    }, [loadStats])
  );

  // Escolher outro hábito no seletor não conta como "focar a tela de novo" pro
  // useFocusEffect acima — precisa do próprio gatilho, por id (não pelo objeto
  // inteiro, que troca de referência a cada refresh do dashboard em outra tela).
  useEffect(() => {
    if (!primeiraCarga.current) loadStats(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habit?.id]);

  useFocusEffect(
    useCallback(() => {
      getDashboard()
        .then((res) => {
          const lista = res.data.habits || res.data || [];
          setHabitosDisponiveis(lista.filter((h) => h.status !== 'ARCHIVED'));
        })
        .catch(() => {});
    }, [])
  );

  if (!habit) {
    return (
      <EmptyStateContainer>
        <EmptyIconWrapper>
          <Feather name="search" size={32} color={theme.textSecondary} />
        </EmptyIconWrapper>
        <EmptyTitle>{t('stats.semHabito')}</EmptyTitle>
        <EmptyText>{t('stats.semHabitoTexto')}</EmptyText>
      </EmptyStateContainer>
    );
  }

  const seletorModal = (
    <Modal visible={pickerAberto} transparent animationType="fade" onRequestClose={() => setPickerAberto(false)}>
      <PickerOverlay onPress={() => setPickerAberto(false)}>
        <PickerSheet onStartShouldSetResponder={() => true}>
          <PickerTitulo>{t('stats.trocarHabito')}</PickerTitulo>
          {habitosDisponiveis.map((h) => (
            <PickerOption
              key={h.id}
              onPress={() => {
                setCurrentHabit(h);
                setPickerAberto(false);
              }}
            >
              <PickerOptionText $active={h.id === habit.id}>{h.titulo}</PickerOptionText>
              {h.id === habit.id ? <Feather name="check" size={18} color={theme.primaryColor} /> : null}
            </PickerOption>
          ))}
        </PickerSheet>
      </PickerOverlay>
    </Modal>
  );

  const isTempo = habit.tipo_medida === 'TEMPO';

  const formatMedida = (valor) => {
    // meta_base e valor_realizado de hábito TEMPO já estão em minutos.
    if (isTempo) return `${Math.round(valor)} ${t('comum.min')}`;
    return `${Math.round(valor)} ${habit.categoria === 'AGUA' ? t('comum.ml') : t('comum.vezes')}`;
  };

  // A data chega como "2026-06-18" e é a data LOCAL do usuário, já resolvida pelo
  // servidor. Montar um Date a partir dela aplicaria o fuso do aparelho e poderia
  // deslocar um dia — por isso a formatação é feita sobre a string.
  const formatarData = (iso) => {
    const [, mes, dia] = iso.split('-');
    return `${dia}/${mes}`;
  };

  if (loading) return <LoadingScreen message={t('stats.carregando')} />;

  if (loadError) {
    return (
      <EmptyStateContainer>
        <EmptyIconWrapper>
          <Feather name="alert-triangle" size={32} color={theme.textSecondary} />
        </EmptyIconWrapper>
        <EmptyTitle>{t('stats.erroTitulo')}</EmptyTitle>
        <EmptyText>{t('stats.erroTexto')}</EmptyText>
        <RetryButton onPress={() => loadStats()}>
          <RetryButtonText>{t('comum.tentarNovamente')}</RetryButtonText>
        </RetryButton>
      </EmptyStateContainer>
    );
  }

  const semExecucoes = dias.every((dia) => dia.execucoes === 0 && !dia.parcial);
  if (semExecucoes) {
    return (
      <>
      <StatsContainer $insetTop={insets.top}>
        <Title>{t('stats.titulo')}</Title>
        <HabitTitleButton onPress={() => setPickerAberto(true)} accessibilityLabel={t('stats.trocarHabito')}>
        <HabitTitle>{habit.titulo}</HabitTitle>
        <Feather name='chevron-down' size={16} color={theme.primaryColor} />
      </HabitTitleButton>
        <EmptyStateContainer>
          <EmptyIconWrapper>
            <Feather name="bar-chart-2" size={32} color={theme.textSecondary} />
          </EmptyIconWrapper>
          <EmptyTitle>{t('stats.nadaAqui')}</EmptyTitle>
          <EmptyText>{t('stats.semExecucoesTexto')}</EmptyText>
        </EmptyStateContainer>
      </StatsContainer>
      {seletorModal}
      </>
    );
  }

  return (
    <>
    <StatsContainer $insetTop={insets.top}>
      <Title>{t('stats.titulo')}</Title>
      <HabitTitleButton onPress={() => setPickerAberto(true)} accessibilityLabel={t('stats.trocarHabito')}>
        <HabitTitle>{habit.titulo}</HabitTitle>
        <Feather name='chevron-down' size={16} color={theme.primaryColor} />
      </HabitTitleButton>

      <ContentWrapper>
        <GridRow>
          <StatCard>
            <CardHeader>
              <MaterialCommunityIcons name="fire" size={16} color={theme.warningColor} />
              <CardHeaderText>{t('stats.diasSeguidos')}</CardHeaderText>
            </CardHeader>
            <CardValue $large>{habit.dias_seguidos || 0}</CardValue>
          </StatCard>
          <StatCard>
            <CardHeader>
              <Feather name="target" size={16} color={theme.primaryColor} />
              <CardHeaderText>{t('stats.melhorDia')}</CardHeaderText>
            </CardHeader>
            <CardValue>{recordes.length > 0 ? formatMedida(recordes[0].valor) : formatMedida(0)}</CardValue>
            {recordes.length > 0 ? <CardSubtext>{formatarData(recordes[0].data)}</CardSubtext> : null}
          </StatCard>
        </GridRow>

        <StatCard>
          <CardHeader>
            <Feather name="percent" size={16} color={theme.successColor} />
            <CardHeaderText>{t('stats.constancia')}</CardHeaderText>
          </CardHeader>
          <CardValue $large>{constanciaPercentual}%</CardValue>
          <CardSubtext>{t('stats.constanciaSub', { feitos: diasComMetaCumprida, total: diasCobrados })}</CardSubtext>
        </StatCard>

        {recordes.length > 0 ? (
          <StatCard>
            <CardHeader>
              <MaterialCommunityIcons name="trophy-outline" size={16} color={theme.warningColor} />
              <CardHeaderText>{t('stats.recordes')}</CardHeaderText>
            </CardHeader>
            {recordes.map((rec, i) => (
              <RecordeRow key={rec.data} $first={i === 0}>
                <RecordePosicao $first={i === 0}>{i + 1}º</RecordePosicao>
                <RecordeData>{formatarData(rec.data)}</RecordeData>
                <RecordeValor $first={i === 0}>{formatMedida(rec.valor)}</RecordeValor>
              </RecordeRow>
            ))}
          </StatCard>
        ) : null}

        <ChartCard>
          <ChartTitle>{t('stats.desempenho', { dias: diasPeriodo })}</ChartTitle>
          {dias.some((dia) => dia.parcial) && (
            <CardSubtext style={{ marginTop: -16, marginBottom: 16 }}>
              {t('stats.legendaParcial')}
            </CardSubtext>
          )}
          <GraficoBarras dias={dias} theme={theme} />
        </ChartCard>
      </ContentWrapper>
    </StatsContainer>
    {seletorModal}
    </>
  );
};

export default Stats;
