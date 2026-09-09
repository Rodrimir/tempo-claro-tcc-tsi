import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { FlatList, Modal, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { Image } from 'expo-image';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
import { useThemeToggle } from '../../contexts/ThemeToggleContext';
import { useToast } from '../../contexts/ToastContext';
import { getDashboard, archiveHabit } from '../../services/api';
import LoadingScreen from '../../components/common/LoadingScreen';
import LocalHeader from '../../components/layout/LocalHeader';
import { useFloat, usePulse } from '../../hooks/useFloat';

import solFlutuando from '../../../assets/sol_flutuando.webp';
import luaFlutuando from '../../../assets/lua_flutuando.png';
import gotinhaNormal from '../../../assets/gotinha/normal.png';
import gotinhaFeliz from '../../../assets/gotinha/feliz.png';

import {
  HomeContainer,
  HabitSlide,
  SlideInner,
  HabitCard,
  CardSubtitle,
  CardTitle,
  GatilhoText,
  ProgressoOcorrenciasText,
  UrgentBadge,
  UrgentBadgeText,
  AvatarWrapper,
  ShadowBlur,
  SunWrapper,
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
  MenuButton,
  ContextMenuOverlay,
  ContextMenu,
  ContextMenuItem,
  ContextMenuItemText,
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

const isDiaProgramado = (habit) => {
  if (!habit.frequencia_semanal || habit.frequencia_semanal.length !== 7) return true;
  return habit.frequencia_semanal[new Date().getDay()] === '1';
};

const getAvatarExpression = (habit) => {
  if (habit.status === 'COMPLETED') return 'feliz';
  if (!isDiaProgramado(habit)) return 'normal';
  if (!habit.proximo_vencimento) return 'normal';
  const now = new Date();
  const due = new Date(habit.proximo_vencimento);
  const diffMin = (due - now) / 60000;
  if (diffMin < -60) return 'falha';
  if (diffMin <= 0 && diffMin >= -60) return 'desesperado';
  if (diffMin > 0 && diffMin <= 120) return 'preocupado';
  return 'normal';
};

const EMOJIS = { normal: '🌱', preocupado: '😰', desesperado: '😱', feliz: '✨', falha: '☠️' };

function AvatarImage({ habit }) {
  const flutuando = useFloat(3000, 8);
  const expression = getAvatarExpression(habit);

  if (habit.categoria === 'AGUA' && (expression === 'normal' || expression === 'feliz')) {
    return (
      <AvatarWrapper style={flutuando}>
        <Image
          source={expression === 'feliz' ? gotinhaFeliz : gotinhaNormal}
          contentFit="contain"
          style={{ width: '100%', height: '100%' }}
        />
      </AvatarWrapper>
    );
  }

  return (
    <AvatarWrapper style={flutuando}>
      <CardTitle style={{ fontSize: 100 }}>{EMOJIS[expression] || '🌱'}</CardTitle>
    </AvatarWrapper>
  );
}

function CriarHabitoSlide({ width, isDark, onPress }) {
  const flutuando = useFloat(4000, 8);
  return (
    <HabitSlide $width={width}>
      <SlideInner>
        <SunWrapper style={flutuando}>
          <Image source={isDark ? luaFlutuando : solFlutuando} contentFit="contain" style={{ width: '100%', height: '100%' }} />
        </SunWrapper>
        <EmptyTitle>Começar um novo hábito?</EmptyTitle>
        <EmptySubtitle>Configure um novo ecossistema.</EmptySubtitle>
        <CreateHabitButton onPress={onPress} style={{ marginTop: 24 }}>
          <Feather name="play" size={32} color="white" style={{ transform: [{ rotate: '90deg' }] }} />
        </CreateHabitButton>
      </SlideInner>
    </HabitSlide>
  );
}

function HabitCardSlide({ habit, width, menuAberto, onAbrirMenu, onFecharMenu, onEditar, onArquivar }) {
  const theme = useTheme();
  const expression = getAvatarExpression(habit);
  const completed = habit.status === 'COMPLETED';
  const urgent = expression === 'preocupado' || expression === 'desesperado';
  const folga = !completed && !isDiaProgramado(habit);
  const pulso = usePulse();
  const badgeFlutuando = useFloat(3000, 8);

  return (
    <HabitSlide $width={width}>
      <SlideInner>
        <HabitCard $completed={completed} $urgent={urgent} style={urgent && !completed ? pulso : undefined}>
          <MenuButton onPress={() => onAbrirMenu(habit.id)} accessibilityLabel={`Mais opções para ${habit.titulo}`}>
            <Feather name="more-vertical" size={18} color={completed ? 'rgba(255,255,255,0.85)' : theme.textSecondary} />
          </MenuButton>
          {menuAberto && (
            <>
              <ContextMenuOverlay onPress={onFecharMenu} />
              <ContextMenu>
                <ContextMenuItem onPress={() => onEditar(habit)}>
                  <Feather name="edit-3" size={16} color={theme.textPrimary} />
                  <ContextMenuItemText>Editar</ContextMenuItemText>
                </ContextMenuItem>
                <ContextMenuItem onPress={() => onArquivar(habit)}>
                  <Feather name="archive" size={16} color={theme.dangerColor} />
                  <ContextMenuItemText $danger>Arquivar</ContextMenuItemText>
                </ContextMenuItem>
              </ContextMenu>
            </>
          )}
          <CardSubtitle $completed={completed} $urgent={urgent}>
            {completed ? 'Concluído Hoje' : folga ? 'Folga Programada' : urgent ? 'Atenção!' : 'Sua Tarefa'}
          </CardSubtitle>
          <CardTitle $completed={completed}>{habit.titulo}</CardTitle>
          {habit.gatilho_ancora ? <GatilhoText $completed={completed}>⚓ {habit.gatilho_ancora}</GatilhoText> : null}
          {habit.meta_frequencia_diaria > 1 ? (
            <ProgressoOcorrenciasText $completed={completed}>
              {habit.execucoes_hoje || 0} de {habit.meta_frequencia_diaria} hoje
            </ProgressoOcorrenciasText>
          ) : null}
        </HabitCard>
        {expression === 'preocupado' && (
          <UrgentBadge style={badgeFlutuando}>
            <UrgentBadgeText>A hora está chegando!</UrgentBadgeText>
          </UrgentBadge>
        )}
        {expression === 'desesperado' && (
          <UrgentBadge style={badgeFlutuando}>
            <UrgentBadgeText>Faça agora ou perca a ofensiva!</UrgentBadgeText>
          </UrgentBadge>
        )}
        {expression === 'falha' && (
          <UrgentBadge style={badgeFlutuando}>
            <UrgentBadgeText>Tempo esgotado. Falha!</UrgentBadgeText>
          </UrgentBadge>
        )}
        <AvatarImage habit={habit} />
        <ShadowBlur />
      </SlideInner>
    </HabitSlide>
  );
}

const HomeScreen = () => {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);
  const router = useRouter();
  const { setCurrentHabit } = useCurrentHabit();
  const { isDark } = useThemeToggle();
  const { addToast } = useToast();
  const [localHabits, setLocalHabits] = useState([]);
  const [limiteHabitos, setLimiteHabitos] = useState(2);
  const [menuAbertoId, setMenuAbertoId] = useState(null);
  const [habitoParaArquivar, setHabitoParaArquivar] = useState(null);
  const [arquivando, setArquivando] = useState(false);

  const loadData = useCallback(async (silencioso = false) => {
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
          if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
          if (b.status === 'COMPLETED' && a.status !== 'COMPLETED') return -1;
          if (!a.proximo_vencimento || !b.proximo_vencimento) return 0;
          return new Date(a.proximo_vencimento) - new Date(b.proximo_vencimento);
        });
        setLocalHabits(data);
      }
    } catch (error) {
      addToast('Não foi possível carregar seus hábitos.', 'error');
      setLoadError(true);
    } finally {
      if (!silencioso) setLoading(false);
    }
  }, [addToast]);

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

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index ?? 0);
    }
  }).current;

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
      addToast('Hábito arquivado.', 'success');
      setHabitoParaArquivar(null);
      setActiveIndex(0);
      listRef.current?.scrollToOffset({ offset: 0 });
      await loadData();
    } catch (err) {
      const mensagem = err.response?.data?.message || 'Erro ao arquivar hábito. Tente novamente.';
      addToast(mensagem, 'error');
    } finally {
      setArquivando(false);
    }
  };

  if (loading) return <LoadingScreen message="Carregando Hábitos" />;

  if (loadError) {
    return (
      <HomeContainer>
        <LocalHeader />
        <ErrorStateContainer>
          <IconWrapper>
            <Feather name="alert-triangle" size={32} color="#b91c1c" />
          </IconWrapper>
          <EmptyTitle>Não foi possível carregar</EmptyTitle>
          <EmptySubtitle>Verifique sua conexão e tente novamente.</EmptySubtitle>
          <RetryButton onPress={() => loadData()}>
            <RetryButtonText>Tentar novamente</RetryButtonText>
          </RetryButton>
        </ErrorStateContainer>
      </HomeContainer>
    );
  }

  if (localHabits.length === 0) {
    return (
      <HomeContainer>
        <LocalHeader />
        <ErrorStateContainer>
          <IconWrapper>
            <Feather name="target" size={32} color="#4f46e5" />
          </IconWrapper>
          <EmptyTitle>Bem-vindo ao Tempo Claro</EmptyTitle>
          <EmptySubtitle>
            Diferente de uma lista de tarefas cheia, aqui você foca em no máximo {limiteHabitos} hábito
            {limiteHabitos === 1 ? '' : 's'} por vez — sem dispersão, sem sobrecarga. Crie o primeiro pra
            começar.
          </EmptySubtitle>
          <CreateHabitButton onPress={() => router.push({ pathname: '/create', params: { modo: 'criar' } })} style={{ marginTop: 24 }}>
            <Feather name="play" size={32} color="white" style={{ transform: [{ rotate: '90deg' }] }} />
          </CreateHabitButton>
        </ErrorStateContainer>
      </HomeContainer>
    );
  }

  return (
    <HomeContainer>
      <LocalHeader />
      <FlatList
        ref={listRef}
        data={dados}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
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
        {activeIndex < localHabits.length && localHabits[activeIndex]?.status !== 'COMPLETED' ? (
          <ActionHintText>
            {isDiaProgramado(localHabits[activeIndex])
              ? 'Use o botão Play na barra inferior'
              : 'Hoje é opcional — toque em Play se quiser praticar'}
          </ActionHintText>
        ) : activeIndex < localHabits.length ? (
          <DoneButton>
            <Feather name="check" size={24} color="#64748b" />
            <DoneButtonText>TAREFA FEITA</DoneButtonText>
          </DoneButton>
        ) : (
          <ActionHintText> </ActionHintText>
        )}
      </ActionWrapper>

      <Modal
        visible={!!habitoParaArquivar}
        transparent
        animationType="fade"
        onRequestClose={() => !arquivando && setHabitoParaArquivar(null)}
      >
        <ArchiveModalOverlay>
          <ArchiveModalContent>
            <ArchiveModalTitle>Arquivar "{habitoParaArquivar?.titulo}"?</ArchiveModalTitle>
            <ArchiveModalText>
              O histórico de execuções e moedas fica preservado — nada é apagado. Isso libera uma vaga entre
              os {limiteHabitos} hábitos ativos para você criar outro.
            </ArchiveModalText>
            <ArchiveModalActions>
              <ArchiveCancelButton onPress={() => setHabitoParaArquivar(null)} disabled={arquivando}>
                <ArchiveCancelButtonText>Cancelar</ArchiveCancelButtonText>
              </ArchiveCancelButton>
              <ArchiveConfirmButton onPress={handleConfirmarArquivar} disabled={arquivando}>
                <ArchiveConfirmButtonText>{arquivando ? 'Arquivando...' : 'Arquivar'}</ArchiveConfirmButtonText>
              </ArchiveConfirmButton>
            </ArchiveModalActions>
          </ArchiveModalContent>
        </ArchiveModalOverlay>
      </Modal>
    </HomeContainer>
  );
};

export default HomeScreen;
