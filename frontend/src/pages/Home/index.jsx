import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { FlatList, Modal, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useCurrentHabit } from '@/contexts/CurrentHabitContext';
import { useI18n } from '@/contexts/LanguageContext';
import { useThemeToggle } from '@/contexts/ThemeToggleContext';
import { useToast } from '@/contexts/ToastContext';
import { getDashboard, archiveHabit } from '@/services/api';
import { reagendarTodas, solicitarPermissao } from '@/services/notificacoes';
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
  ArchiveModalOverlay,
  ArchiveModalContent,
  ArchiveModalTitle,
  ArchiveModalText,
  ArchiveModalActions,
  ArchiveCancelButton,
  ArchiveCancelButtonText,
  ArchiveConfirmButton,
  ArchiveConfirmButtonText,
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
  const { setCurrentHabit } = useCurrentHabit();
  const { isDark } = useThemeToggle();
  const cenarioFonte = isDark ? cenarioNoite : cenarioDia;
  const { addToast } = useToast();
  const [localHabits, setLocalHabits] = useState([]);
  const [limiteHabitos, setLimiteHabitos] = useState(2);
  const [menuAbertoId, setMenuAbertoId] = useState(null);
  const [habitoParaArquivar, setHabitoParaArquivar] = useState(null);
  const [arquivando, setArquivando] = useState(false);

  const carregandoRef = useRef(false);

  useEffect(() => {
    solicitarPermissao();
  }, []);

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
        reagendarTodas(data, idioma).catch(() => {});
      }
    } catch (_error) {
      addToast(t('home.erroCarregarHabitos'), 'error');
      setLoadError(true);
    } finally {
      carregandoRef.current = false;
      if (!silencioso) setLoading(false);
    }
  }, [addToast, idioma]);

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

  const podeCrearMais = localHabits.length < limiteHabitos;
  const dados = podeCrearMais ? [...localHabits, CRIAR_SLIDE] : localHabits;

  const onViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }, []);

  const handleEditar = (habit) => {
    setMenuAbertoId(null);
    setCurrentHabit(habit);
    router.push({ pathname: '/create', params: { modo: 'editar' } });
  };

  const handleAbrirArquivar = (habit) => {
    setMenuAbertoId(null);
    setHabitoParaArquivar(habit);
  };

  const handleConfirmarArquivar = async () => {
    if (!habitoParaArquivar) return;
    setArquivando(true);
    try {
      await archiveHabit(habitoParaArquivar.id);
      addToast(t('home.arquivadoOk'), 'success');
      setHabitoParaArquivar(null);
      setActiveIndex(0);
      listRef.current?.scrollToOffset({ offset: 0 });
      await loadData();
    } catch (err) {
      const mensagem = getApiErrorMessage(err, t('home.erroArquivar'));
      addToast(mensagem, 'error');
    } finally {
      setArquivando(false);
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
          <RetryButton onPress={() => loadData()}>
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
          <CreateHabitButton onPress={() => router.push({ pathname: '/create', params: { modo: 'criar' } })} style={{ marginTop: 24 }}>
            <Feather name="play" size={32} color="white" style={{ transform: [{ rotate: '90deg' }] }} />
          </CreateHabitButton>
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
            <CriarHabitoSlide width={width} isDark={isDark} onPress={() => router.push({ pathname: '/create', params: { modo: 'criar' } })} />
          ) : (
            <HabitCardSlide
              habit={item}
              width={width}
              menuAberto={menuAbertoId === item.id}
              onAbrirMenu={(id) => setMenuAbertoId(menuAbertoId === id ? null : id)}
              onFecharMenu={() => setMenuAbertoId(null)}
              onEditar={handleEditar}
              onArquivar={handleAbrirArquivar}
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

      <Modal
        visible={!!habitoParaArquivar}
        transparent
        animationType="fade"
        onRequestClose={() => !arquivando && setHabitoParaArquivar(null)}
      >
        <ArchiveModalOverlay>
          <ArchiveModalContent>
            <ArchiveModalTitle>{t('home.arquivarPergunta', { titulo: habitoParaArquivar?.titulo ?? '' })}</ArchiveModalTitle>
            <ArchiveModalText>{t('home.arquivarDetalhe', { limite: limiteHabitos })}</ArchiveModalText>
            <ArchiveModalActions>
              <ArchiveCancelButton onPress={() => setHabitoParaArquivar(null)} disabled={arquivando}>
                <ArchiveCancelButtonText>{t('comum.cancelar')}</ArchiveCancelButtonText>
              </ArchiveCancelButton>
              <ArchiveConfirmButton onPress={handleConfirmarArquivar} disabled={arquivando}>
                <ArchiveConfirmButtonText>{arquivando ? t('home.arquivando') : t('comum.arquivar')}</ArchiveConfirmButtonText>
              </ArchiveConfirmButton>
            </ArchiveModalActions>
          </ArchiveModalContent>
        </ArchiveModalOverlay>
      </Modal>
      </HomeVeu>
    </HomeContainer>
  );
};

export default HomeScreen;
