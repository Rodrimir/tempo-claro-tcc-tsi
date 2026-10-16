import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { FlatList, View, useWindowDimensions } from 'react-native';
import Dialogo, { BotaoDoDialogo, TextoDoBotao, TextoDoDialogo } from '@/components/common/Dialogo';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useCurrentHabit } from '@/contexts/CurrentHabitContext';
import { useI18n } from '@/contexts/LanguageContext';
import { useThemeToggle } from '@/contexts/ThemeToggleContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAlvoDoGuia, useOnboarding } from '@/onboarding/OnboardingContext';
import { ALVOS } from '@/onboarding/passos';
import { getDashboard, excluirHabito } from '@/services/api';
import { reagendarTodas, solicitarPermissao, cancelarTodas } from '@/services/notificacoes';
import LoadingScreen from '@/components/common/LoadingScreen';
import LocalHeader from '@/components/layout/LocalHeader';
import { isDiaProgramado } from '@/utils/ocorrencias';
import { STATUS_HABITO } from '@/model/Status';
import { getApiErrorMessage } from '@/utils/erros';
import { CriarHabitoSlide } from './components/CriarHabitoSlide';
import { HabitCardSlide } from './components/HabitCardSlide';

import cenarioDia from '@/assets/cenario/dia.png';
import cenarioNoite from '@/assets/cenario/noite.png';

import {
  HomeContainer,
  HomeVeu,
  EmptyTextCard,
  EmptyTitle,
  EmptySubtitle,
  CreateHabitButton,
  DotsWrapper,
  Dot,
  ActionWrapper,
  ActionHintText,
  DoneButton,
  DoneButtonText,
  ErrorStateContainer,
  IconWrapper,
  RetryButton,
  RetryButtonText,
} from './styles';

const CRIAR_SLIDE = { id: '__criar__' };
const CONFIG_VISIBILIDADE = { itemVisiblePercentThreshold: 50 };

const HomeScreen = () => {
  const { t, idioma } = useI18n();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);
  const router = useRouter();
  const { habitoId: habitoDaNotificacao } = useLocalSearchParams();
  const { setCurrentHabit } = useCurrentHabit();
  const { isDark } = useThemeToggle();
  const cenarioFonte = isDark ? cenarioNoite : cenarioDia;
  const { addToast } = useToast();
  const [localHabits, setLocalHabits] = useState([]);
  const [limiteHabitos, setLimiteHabitos] = useState(2);
  const [menuAbertoId, setMenuAbertoId] = useState(null);
  const [habitoParaExcluir, setHabitoParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const carregandoRef = useRef(false);
  const habitosRef = useRef([]);
  const { user } = useAuth();
  const lembretesAtivos = user?.notificacoes_ativas !== false;
  const lembretesRef = useRef(lembretesAtivos);
  const { ativo: guiaAtivo, emTour, setTemHabitos } = useOnboarding();
  const alvoCriar = useAlvoDoGuia(ALVOS.CRIAR);

  useEffect(() => {
    lembretesRef.current = lembretesAtivos;
  }, [lembretesAtivos]);

  // Lembretes só com a preferência ligada no Perfil; desligada, nada fica agendado.
  const agendarLembretes = useCallback((habitos) => {
    if (!lembretesRef.current) {
      cancelarTodas().catch(() => {});
      return;
    }
    reagendarTodas(habitos, idioma).catch(() => {});
  }, [idioma]);

  // O pedido de permissão pode terminar depois da primeira carga, que nesse caso não conseguiu
  // agendar nada; quando a permissão é concedida, os lembretes são agendados com os dados já lidos.
  // Durante o guia de primeiro acesso o pedido espera, para o diálogo do sistema não cobrir o tour.
  useEffect(() => {
    if (guiaAtivo || !lembretesAtivos) return;
    solicitarPermissao(idioma)
      .then((concedida) => {
        if (concedida && habitosRef.current.length > 0) agendarLembretes(habitosRef.current);
      })
      .catch(() => {});
    // Uma vez por montagem (e de novo quando o guia termina): repetir o pedido a cada troca de
    // idioma reabriria o diálogo do sistema.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guiaAtivo, lembretesAtivos]);

  const loadData = useCallback(async (silencioso = false) => {
    if (carregandoRef.current) return;
    carregandoRef.current = true;
    if (!silencioso) setLoading(true);
    setLoadError(false);
    try {
      const response = await getDashboard();
      let data = response.data.habits || response.data || [];
      if (typeof response.data.limite_habitos_ativos === 'number') {
        setLimiteHabitos(response.data.limite_habitos_ativos);
      }
      if (Array.isArray(data)) {
        data.sort((a, b) => {
          if (a.status === STATUS_HABITO.COMPLETED && b.status !== STATUS_HABITO.COMPLETED) return 1;
          if (b.status === STATUS_HABITO.COMPLETED && a.status !== STATUS_HABITO.COMPLETED) return -1;
          if (!a.proximo_vencimento || !b.proximo_vencimento) return 0;
          return new Date(a.proximo_vencimento) - new Date(b.proximo_vencimento);
        });
        setLocalHabits(data);
        habitosRef.current = data;
        setTemHabitos(data.length > 0);
        agendarLembretes(data);
      }
    } catch (_error) {
      addToast(t('home.erroCarregarHabitos'), 'error');
      setLoadError(true);
    } finally {
      carregandoRef.current = false;
      if (!silencioso) setLoading(false);
    }
  }, [addToast, agendarLembretes, setTemHabitos, t]);

  const primeiraCarga = useRef(true);
  useFocusEffect(
    useCallback(() => {
      loadData(!primeiraCarga.current);
      primeiraCarga.current = false;
    }, [loadData])
  );

  useEffect(() => {
    if (localHabits.length > 0 && localHabits[activeIndex] && localHabits[activeIndex].id !== CRIAR_SLIDE.id) {
      setCurrentHabit(localHabits[activeIndex]);
    } else {
      setCurrentHabit(null);
    }
  }, [activeIndex, localHabits, setCurrentHabit]);

  useEffect(() => {
    if (!habitoDaNotificacao || loading || localHabits.length === 0) return;
    const indice = localHabits.findIndex((h) => h.id === habitoDaNotificacao);
    router.setParams({ habitoId: undefined });
    if (indice < 0) return;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: indice * width, animated: false });
      setActiveIndex(indice);
    });
  }, [habitoDaNotificacao, loading, localHabits, width, router]);

  const podeCrearMais = localHabits.length < limiteHabitos;
  const dados = podeCrearMais ? [...localHabits, CRIAR_SLIDE] : localHabits;

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const abrirCriacao = () =>
    router.push({ pathname: '/create', params: { modo: 'criar', ...(emTour ? { guia: '1' } : {}) } });

  const handleEditar = (habit) => {
    setMenuAbertoId(null);
    setCurrentHabit(habit);
    router.push({ pathname: '/create', params: { modo: 'editar' } });
  };

  const handleAbrirExcluir = (habit) => {
    setMenuAbertoId(null);
    setHabitoParaExcluir(habit);
  };

  const handleConfirmarExcluir = async () => {
    if (!habitoParaExcluir) return;
    setExcluindo(true);
    try {
      await excluirHabito(habitoParaExcluir.id);
      addToast(t('home.excluidoOk'), 'success');
      setHabitoParaExcluir(null);
      setActiveIndex(0);
      listRef.current?.scrollToOffset({ offset: 0 });
      await loadData();
    } catch (err) {
      const mensagem = getApiErrorMessage(err, t('home.erroExcluir'));
      addToast(mensagem, 'error');
    } finally {
      setExcluindo(false);
    }
  };

  if (loading) return <LoadingScreen message={t('home.carregandoHabitos')} />;

  if (loadError) {
    return (
      <HomeContainer source={cenarioFonte}>
        <HomeVeu>
        <LocalHeader />
        <ErrorStateContainer>
          <IconWrapper>
            <Feather name="alert-triangle" size={32} color={theme.dangerColor} />
          </IconWrapper>
          <EmptyTextCard>
            <EmptyTitle>{t('stats.erroTitulo')}</EmptyTitle>
            <EmptySubtitle>{t('stats.erroTexto')}</EmptySubtitle>
          </EmptyTextCard>
          <RetryButton accessibilityRole="button" onPress={() => loadData()}>
            <RetryButtonText>{t('comum.tentarNovamente')}</RetryButtonText>
          </RetryButton>
        </ErrorStateContainer>
        </HomeVeu>
      </HomeContainer>
    );
  }

  if (localHabits.length === 0) {
    return (
      <HomeContainer source={cenarioFonte}>
        <HomeVeu>
        <LocalHeader />
        <ErrorStateContainer>
          <IconWrapper>
            <Feather name="target" size={32} color={theme.primaryColor} />
          </IconWrapper>
          <EmptyTextCard>
            <EmptyTitle>{t('home.boasVindasTitulo')}</EmptyTitle>
            <EmptySubtitle>
              {t('home.boasVindasTexto', { limite: limiteHabitos, plural: limiteHabitos === 1 ? '' : 's' })}
            </EmptySubtitle>
          </EmptyTextCard>
          <View {...alvoCriar} style={{ marginTop: 24 }}>
            <CreateHabitButton
              accessibilityRole="button"
              accessibilityLabel={t('home.novoHabitoTitulo')}
              onPress={abrirCriacao}
            >
              <Feather name="plus" size={32} color="white" />
            </CreateHabitButton>
          </View>
        </ErrorStateContainer>
        </HomeVeu>
      </HomeContainer>
    );
  }

  return (
    <HomeContainer source={cenarioFonte}>
      <HomeVeu>
      <LocalHeader />
      <FlatList
        ref={listRef}
        data={dados}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={CONFIG_VISIBILIDADE}
        style={{ flex: 1 }}
        renderItem={({ item }) =>
          item.id === CRIAR_SLIDE.id ? (
            <CriarHabitoSlide width={width} isDark={isDark} onPress={abrirCriacao} />
          ) : (
            <HabitCardSlide
              habit={item}
              width={width}
              menuAberto={menuAbertoId === item.id}
              onAbrirMenu={(id) => setMenuAbertoId(menuAbertoId === id ? null : id)}
              onFecharMenu={() => setMenuAbertoId(null)}
              onEditar={handleEditar}
              onExcluir={handleAbrirExcluir}
            />
          )
        }
      />
      <DotsWrapper>
        {localHabits.map((_, i) => (
          <Dot key={i} $active={i === activeIndex} />
        ))}
        {podeCrearMais && <Dot $active={activeIndex === localHabits.length} />}
      </DotsWrapper>
      <ActionWrapper>
        {activeIndex < localHabits.length && localHabits[activeIndex]?.status !== STATUS_HABITO.COMPLETED ? (
          <ActionHintText>
            {isDiaProgramado(localHabits[activeIndex].frequencia_semanal, new Date())
              ? t('home.dicaPlay')
              : t('home.dicaOpcional')}
          </ActionHintText>
        ) : activeIndex < localHabits.length ? (
          <DoneButton>
            <Feather name="check" size={24} color={theme.textSecondary} />
            <DoneButtonText>{t('home.tarefaFeita')}</DoneButtonText>
          </DoneButton>
        ) : null}
      </ActionWrapper>

      <Dialogo
        visible={!!habitoParaExcluir}
        onClose={excluindo ? undefined : () => setHabitoParaExcluir(null)}
        titulo={t('home.excluirPergunta', { titulo: habitoParaExcluir?.titulo ?? '' })}
        accessibilityLabel={t('comum.fechar')}
        acoes={
          <>
            <BotaoDoDialogo
              accessibilityRole="button"
              accessibilityState={{ disabled: excluindo }}
              onPress={() => setHabitoParaExcluir(null)}
              disabled={excluindo}
            >
              <TextoDoBotao>{t('comum.cancelar')}</TextoDoBotao>
            </BotaoDoDialogo>
            <BotaoDoDialogo
              $tipo="perigo"
              accessibilityRole="button"
              accessibilityState={{ disabled: excluindo, busy: excluindo }}
              onPress={handleConfirmarExcluir}
              disabled={excluindo}
            >
              <TextoDoBotao $tipo="perigo">{excluindo ? t('home.excluindo') : t('comum.excluir')}</TextoDoBotao>
            </BotaoDoDialogo>
          </>
        }
      >
        <TextoDoDialogo>{t('home.excluirDetalhe', { limite: limiteHabitos })}</TextoDoDialogo>
      </Dialogo>
      </HomeVeu>
    </HomeContainer>
  );
};

export default HomeScreen;
