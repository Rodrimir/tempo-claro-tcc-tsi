import { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import LoadingScreen from '@/components/common/LoadingScreen';
import { useCurrentHabit } from '@/contexts/CurrentHabitContext';
import { useToast } from '@/contexts/ToastContext';
import { getMonthlyStats, getWeeklyStats, getDashboard } from '@/services/api';
import Dialogo from '@/components/common/Dialogo';
import GraficoDesempenho from './GraficoDesempenho';
import { dataCurta } from './grafico';
import { useI18n } from '@/contexts/LanguageContext';
import { STATUS_HABITO } from '@/model/Status';
import { Categoria } from '@/model/Categoria';
import { TipoMedida } from '@/model/TipoMedida';
import { EmptyState } from '@/components/common/EmptyState';
import {
  StatsContainer,
  Title,
  HabitTitleButton,
  HabitTitle,
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
  RetryButton,
  RetryButtonText,
  SeletorPeriodo,
  OpcaoPeriodo,
  OpcaoPeriodoTexto,
} from './styles';

const Stats = () => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentHabit: habit, setCurrentHabit } = useCurrentHabit();
  const { addToast } = useToast();
  const { t, idioma } = useI18n();
  const [periodo, setPeriodo] = useState(30);
  const [dias, setDias] = useState([]);
  const [recordes, setRecordes] = useState([]);
  const [constanciaPercentual, setConstanciaPercentual] = useState(0);
  const [diasComMetaCumprida, setDiasComMetaCumprida] = useState(0);
  const [diasPeriodo, setDiasPeriodo] = useState(30);
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
      const response = periodo === 7 ? await getWeeklyStats(habit.id) : await getMonthlyStats(habit.id);
      const dadosDias = response.data?.dias;
      if (Array.isArray(dadosDias)) {
        setDias(dadosDias);
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
    } catch (_error) {
      addToast(t('stats.erro'), 'error');
      setLoadError(true);
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [habit, addToast, periodo, t]);

  const primeiraCarga = useRef(true);
  useFocusEffect(
    useCallback(() => {
      loadStats(!primeiraCarga.current);
      primeiraCarga.current = false;
    }, [loadStats])
  );

  useEffect(() => {
    if (!primeiraCarga.current) loadStats(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habit?.id]);

  useFocusEffect(
    useCallback(() => {
      getDashboard()
        .then((res) => {
          const lista = res.data.habits || res.data || [];
          setHabitosDisponiveis(lista.filter((h) => h.status !== STATUS_HABITO.EXCLUIDO));
        })
        .catch(() => {});
    }, [])
  );

  if (!habit) {
    return (
      <EmptyState
        icon={<Feather name="search" size={32} color={theme.textSecondary} />}
        title={t('stats.semHabito')}
        text={t('stats.semHabitoTexto')}
      />
    );
  }

  const seletorModal = (
    <Dialogo
      visible={pickerAberto}
      variante="folha"
      onClose={() => setPickerAberto(false)}
      titulo={t('stats.trocarHabito')}
      accessibilityLabel={t('comum.fechar')}
    >
      {habitosDisponiveis.map((h) => (
        <PickerOption
          accessibilityRole="radio"
          accessibilityState={{ selected: h.id === habit.id }}
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
    </Dialogo>
  );

  const seletorDePeriodo = (
    <SeletorPeriodo accessibilityRole="radiogroup">
      {[7, 30].map((n) => (
        <OpcaoPeriodo
          key={n}
          accessibilityRole="radio"
          accessibilityState={{ selected: periodo === n }}
          $ativo={periodo === n}
          onPress={() => setPeriodo(n)}
        >
          <OpcaoPeriodoTexto $ativo={periodo === n}>{t('stats.periodoDias', { n })}</OpcaoPeriodoTexto>
        </OpcaoPeriodo>
      ))}
    </SeletorPeriodo>
  );

  const isTempo = habit.tipo_medida === TipoMedida.TEMPO;

  const formatMedida = (valor) => {
    if (isTempo) return `${Math.round(valor)} ${t('comum.min')}`;
    return `${Math.round(valor)} ${habit.categoria === Categoria.AGUA ? t('comum.ml') : t('comum.vezes')}`;
  };

  const formatarData = (iso) => dataCurta(iso, idioma);

  if (loading) return <LoadingScreen message={t('stats.carregando')} />;

  if (loadError) {
    return (
      <EmptyState
        icon={<Feather name="alert-triangle" size={32} color={theme.textSecondary} />}
        title={t('stats.erroTitulo')}
        text={t('stats.erroTexto')}
      >
        <RetryButton accessibilityRole="button" onPress={() => loadStats()}>
          <RetryButtonText>{t('comum.tentarNovamente')}</RetryButtonText>
        </RetryButton>
      </EmptyState>
    );
  }

  const semExecucoes = dias.every((dia) => dia.execucoes === 0 && !dia.parcial);
  if (semExecucoes) {
    return (
      <>
      <StatsContainer $insetTop={insets.top}>
        <Title>{t('stats.titulo')}</Title>
        <HabitTitleButton accessibilityRole="button" onPress={() => setPickerAberto(true)} accessibilityLabel={t('stats.trocarHabito')}>
        <HabitTitle>{habit.titulo}</HabitTitle>
        <Feather name='chevron-down' size={16} color={theme.primaryColor} />
      </HabitTitleButton>
        {seletorDePeriodo}
        <EmptyState
          icon={<Feather name="bar-chart-2" size={32} color={theme.textSecondary} />}
          title={t('stats.nadaAqui')}
          text={t('stats.semExecucoesTexto')}
        />
      </StatsContainer>
      {seletorModal}
      </>
    );
  }

  return (
    <>
    <StatsContainer $insetTop={insets.top}>
      <Title>{t('stats.titulo')}</Title>
      <HabitTitleButton accessibilityRole="button" onPress={() => setPickerAberto(true)} accessibilityLabel={t('stats.trocarHabito')}>
        <HabitTitle>{habit.titulo}</HabitTitle>
        <Feather name='chevron-down' size={16} color={theme.primaryColor} />
      </HabitTitleButton>
      {seletorDePeriodo}

      <ContentWrapper>
        <GridRow>
          <StatCard>
            <CardHeader>
              <MaterialCommunityIcons name="fire" size={16} color={theme.warningColor} />
              <CardHeaderText>{t('stats.diasSeguidos')}</CardHeaderText>
            </CardHeader>
            <CardValue $large>{habit.dias_seguidos || 0}</CardValue>
            <CardSubtext>{t('stats.diasSeguidosSub')}</CardSubtext>
          </StatCard>
          <StatCard>
            <CardHeader>
              <Feather name="target" size={16} color={theme.primaryColor} />
              <CardHeaderText>{t('stats.melhorDia')}</CardHeaderText>
            </CardHeader>
            <CardValue>{recordes.length > 0 ? formatMedida(recordes[0].valor) : formatMedida(0)}</CardValue>
            <CardSubtext>
              {recordes.length > 0 ? t('stats.melhorDiaSub', { data: formatarData(recordes[0].data) }) : t('stats.melhorDiaVazio')}
            </CardSubtext>
          </StatCard>
        </GridRow>

        <StatCard>
          <CardHeader>
            <Feather name="percent" size={16} color={theme.successColor} />
            <CardHeaderText>{t('stats.constanciaPeriodo', { n: diasPeriodo })}</CardHeaderText>
          </CardHeader>
          <CardValue $large>{constanciaPercentual}%</CardValue>
          <CardSubtext>{t('stats.constanciaSub', { feitos: diasComMetaCumprida, total: diasCobrados })}</CardSubtext>
        </StatCard>

        {recordes.length > 0 ? (
          <StatCard>
            <CardHeader>
              <MaterialCommunityIcons name="trophy-outline" size={16} color={theme.warningColor} />
              <CardHeaderText>{t('stats.recordesPeriodo', { n: diasPeriodo })}</CardHeaderText>
            </CardHeader>
            {recordes.map((rec, i) => (
              <RecordeRow key={rec.data} $first={i === 0}>
                <RecordePosicao $first={i === 0}>{t(`stats.ordinal.${i + 1}`)}</RecordePosicao>
                <RecordeData>{formatarData(rec.data)}</RecordeData>
                <RecordeValor $first={i === 0}>{formatMedida(rec.valor)}</RecordeValor>
              </RecordeRow>
            ))}
          </StatCard>
        ) : null}

        <ChartCard>
          <ChartTitle style={{ marginBottom: 8 }}>{t('stats.desempenho', { dias: diasPeriodo })}</ChartTitle>
          <GraficoDesempenho
            key={`${habit.id}-${diasPeriodo}`}
            dias={dias}
            meta={habit.meta_base || 0}
            theme={theme}
            t={t}
            idioma={idioma}
            formatar={formatMedida}
          />
        </ChartCard>
      </ContentWrapper>
    </StatsContainer>
    {seletorModal}
    </>
  );
};

export default Stats;
