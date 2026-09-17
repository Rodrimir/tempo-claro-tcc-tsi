import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { FlatList, Modal, ScrollView, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { Image } from 'expo-image';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
import { useI18n } from '../../contexts/LanguageContext';
import { useThemeToggle } from '../../contexts/ThemeToggleContext';
import { useToast } from '../../contexts/ToastContext';
import { getDashboard, archiveHabit } from '../../services/api';
import LoadingScreen from '../../components/common/LoadingScreen';
import LocalHeader from '../../components/layout/LocalHeader';
import { useFloat, usePulse } from '../../hooks/useFloat';
import { ocorrenciaAtiva, horaCurta, minutosAteInicio, MINUTOS_ANTECEDENCIA_LIBERACAO } from '../../utils/ocorrencias';

import solFlutuando from '../../../assets/sol_flutuando.webp';
import luaFlutuando from '../../../assets/lua_flutuando.png';
import cenarioDia from '../../../assets/cenario/dia.png';
import cenarioNoite from '../../../assets/cenario/noite.png';
import { avatarDe } from '../../assets/avatares';

import {
  HomeContainer,
  HomeVeu,
  HabitSlide,
  SlideInner,
  HabitCard,
  CardSubtitle,
  GatilhoText,
  TarefaBloco,
  TarefaLinha,
  TarefaColuna,
  TarefaLabel,
  TarefaDetalhe,
  TarefaResumoTexto,
  ExpandirButton,
  ExpandirTexto,
  BottomSheetOverlay,
  BottomSheet,
  BottomSheetTitulo,
  TarefaModalLinha,
  MenuOption,
  MenuOptionText,
  UrgentBadge,
  UrgentBadgeText,
  AvatarWrapper,
  ShadowBlur,
  ContadorWrapper,
  ContadorTexto,
  SunWrapper,
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
  MenuButton,
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

/* Máscara de 7 posições, domingo(0) a sábado(6) — mesma convenção do backend
   (FrequenciaSemanal.java) e do seletor de dias. Recebe o instante de referência
   para não ler o relógio por conta própria: na virada da meia-noite, a expressão
   do avatar e o contador precisam concordar sobre que dia é hoje. */
const isDiaProgramado = (habit, agora = new Date()) => {
  if (!habit.frequencia_semanal || habit.frequencia_semanal.length !== 7) return true;
  return habit.frequencia_semanal[agora.getDay()] === '1';
};

/* A unidade da meta, pra rotular cada linha da lista de tarefas. */
const unidadeDoHabito = (habit, t) => {
  if (habit.tipo_medida === 'TEMPO') return t('comum.min');
  return habit.categoria === 'AGUA' ? t('comum.ml') : t('comum.vezes');
};

/**
 * A expressão precisa concordar com o que o Play realmente permite — antes
 * disso "preocupado"/"desesperado" mentiam pressa numa tarefa que "programada
 * para HH:MM" dizia, no mesmo balão, ainda não ter liberado (proximo_vencimento
 * usava uma janela de 2h, bem mais larga que os 15 min de liberação real).
 * Alinhado a ocorrenciaAtiva + MINUTOS_ANTECEDENCIA_LIBERACAO: "preocupado" só
 * começa quando o Play já está prestes a liberar.
 */
const getAvatarExpression = (habit, agora = new Date()) => {
  if (habit.status === 'COMPLETED') return 'feliz';
  if (!isDiaProgramado(habit, agora)) return 'normal';

  const ativa = ocorrenciaAtiva(habit);
  if (!ativa) {
    const teveFalha = habit.ocorrencias?.some((o) => o.status === 'FALHOU');
    return teveFalha ? 'falha' : 'normal';
  }

  const faltam = minutosAteInicio(ativa, agora);
  if (faltam > MINUTOS_ANTECEDENCIA_LIBERACAO) return 'normal';
  if (faltam > 0) return 'preocupado';
  return 'desesperado';
};

/**
 * Conta quanto falta para a próxima ocorrência. Devolve null quando não há prazo
 * a mostrar — dia já cumprido, dia de folga, ou nenhuma ocorrência ativa hoje
 * (todas feitas ou falhas).
 *
 * Fora da janela de liberação (mais de 15 min antes do início), a mensagem é
 * "programada para HH:MM" — a tarefa ainda não abriu, não faz sentido contar
 * "faltam". Dentro da janela, passado vira "atrasado há X": some o prazo, mas o
 * que a pessoa precisa saber continua sendo o tamanho do atraso.
 */
function tempoRestante(habit, agora, t) {
  if (habit.status === 'COMPLETED' || !isDiaProgramado(habit, agora)) return null;

  const ativa = ocorrenciaAtiva(habit);
  if (!ativa) return null;

  const faltamParaLiberar = minutosAteInicio(ativa, agora);
  if (faltamParaLiberar > MINUTOS_ANTECEDENCIA_LIBERACAO) {
    return { texto: t('home.programadaPara', { hora: horaCurta(ativa.horario_inicio) }), atrasado: false, programada: true };
  }

  const minutos = faltamParaLiberar;
  const abs = Math.abs(minutos);
  const horas = Math.floor(abs / 60);
  const min = abs % 60;

  let quanto;
  if (abs < 1) quanto = t('home.menosDeUmMin');
  else if (horas === 0) quanto = `${min} ${t('comum.min')}`;
  else if (min === 0) quanto = `${horas}h`;
  else quanto = `${horas}h ${min}${t('comum.min')}`;

  return minutos >= 0
    ? { texto: t('home.faltam', { tempo: quanto }), atrasado: false }
    : { texto: t('home.atrasado', { tempo: quanto }), atrasado: true };
}

const ICONE_POR_STATUS = { FEITO: 'check-circle', FALHOU: 'x-circle' };

function corDaOcorrencia(status, completed, theme) {
  if (completed) return 'rgba(255,255,255,0.85)';
  if (status === 'FEITO') return theme.successColor;
  if (status === 'ATIVA') return theme.primaryColor;
  return theme.textSecondary;
}

/* Usado só dentro do popup "ver todas" — rótulo e detalhe empilhados, com
   respiro de sobra pra não precisar caber num balão pequeno. */
function TarefaLinhaDe({ ocorrencia, rotulo, theme, unidade }) {
  return (
    <TarefaModalLinha>
      <Feather
        name={ICONE_POR_STATUS[ocorrencia.status] || 'circle'}
        size={14}
        color={corDaOcorrencia(ocorrencia.status, false, theme)}
        style={{ marginTop: 2 }}
      />
      <TarefaColuna>
        {rotulo ? (
          <TarefaLabel $ativa={ocorrencia.status === 'ATIVA'} $falhou={ocorrencia.status === 'FALHOU'}>
            {rotulo}
          </TarefaLabel>
        ) : null}
        <TarefaDetalhe $falhou={ocorrencia.status === 'FALHOU'}>
          {horaCurta(ocorrencia.horario_inicio)} · {ocorrencia.alvo} {unidade}
        </TarefaDetalhe>
      </TarefaColuna>
    </TarefaModalLinha>
  );
}

/* Uma linha só — o que o balão da Home mostra por padrão, sempre do mesmo
   tamanho não importa quantas ocorrências o hábito tenha hoje. O detalhe de
   cada uma mora no popup "ver todas". */
function TarefaResumo({ ocorrencia, rotulo, completed, theme, unidade }) {
  return (
    <TarefaLinha>
      <Feather
        name={ICONE_POR_STATUS[ocorrencia.status] || 'circle'}
        size={14}
        color={corDaOcorrencia(ocorrencia.status, completed, theme)}
      />
      <TarefaResumoTexto $completed={completed}>
        {rotulo ? `${rotulo} · ` : ''}
        {horaCurta(ocorrencia.horario_inicio)} · {ocorrencia.alvo} {unidade}
      </TarefaResumoTexto>
    </TarefaLinha>
  );
}

function AvatarImage({ habit, expression }) {
  const flutuando = useFloat(3000, 8);

  // A arte sai toda do registro em src/assets/avatares.js — trocar as imagens é
  // mexer só lá. O nível (1 a 5) sobe a cada 10 dias de ofensiva (RF14).
  return (
    <AvatarWrapper style={flutuando}>
      <Image
        source={avatarDe(habit.categoria, expression, habit.nivel_avatar)}
        contentFit="contain"
        style={{ width: '100%', height: '100%' }}
        transition={200}
      />
    </AvatarWrapper>
  );
}

function CriarHabitoSlide({ width, isDark, onPress }) {
  const { t } = useI18n();
  const flutuando = useFloat(4000, 8);
  return (
    <HabitSlide $width={width}>
      <SlideInner>
        <SunWrapper style={flutuando}>
          <Image source={isDark ? luaFlutuando : solFlutuando} contentFit="contain" style={{ width: '100%', height: '100%' }} />
        </SunWrapper>
        <EmptyTextCard>
          <EmptyTitle>{t('home.novoHabitoTitulo')}</EmptyTitle>
          <EmptySubtitle>{t('home.novoHabitoSub')}</EmptySubtitle>
        </EmptyTextCard>
        <CreateHabitButton onPress={onPress} style={{ marginTop: 24 }}>
          <Feather name="play" size={32} color="white" style={{ transform: [{ rotate: '90deg' }] }} />
        </CreateHabitButton>
      </SlideInner>
    </HabitSlide>
  );
}

function HabitCardSlide({ habit, width, menuAberto, onAbrirMenu, onFecharMenu, onEditar, onArquivar }) {
  const theme = useTheme();
  const { t } = useI18n();

  // Um tick por minuto: é a menor granularidade que o contador exibe, então
  // atualizar mais que isso só gastaria bateria.
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const restante = tempoRestante(habit, agora, t);
  const expression = getAvatarExpression(habit, agora);
  const completed = habit.status === 'COMPLETED';
  const urgent = expression === 'preocupado' || expression === 'desesperado';
  const folga = !completed && !isDiaProgramado(habit, agora);
  const pulso = usePulse();
  const badgeFlutuando = useFloat(3000, 8);
  const [tarefasModalAberto, setTarefasModalAberto] = useState(false);
  const temMaisDeUma = (habit.ocorrencias?.length || 0) > 1;
  const ocorrenciaParaResumo = temMaisDeUma ? ocorrenciaAtiva(habit) : habit.ocorrencias?.[0];
  const unidade = unidadeDoHabito(habit, t);

  return (
    <HabitSlide $width={width}>
      <SlideInner>
        <HabitCard $completed={completed} $urgent={urgent} style={urgent && !completed ? pulso : undefined}>
          <MenuButton onPress={() => onAbrirMenu(habit.id)} accessibilityLabel={t('home.maisOpcoesPara', { titulo: habit.titulo })}>
            <Feather name="more-vertical" size={18} color={completed ? 'rgba(255,255,255,0.85)' : theme.textSecondary} />
          </MenuButton>
          <CardSubtitle $completed={completed} $urgent={urgent}>
            {completed
              ? t('home.concluidoHoje')
              : folga
                ? t('home.folgaProgramada')
                : urgent
                  ? t('home.atencao')
                  : t('home.suaTarefa')}
          </CardSubtitle>
          {habit.gatilho_ancora ? <GatilhoText $completed={completed}>⚓ {habit.gatilho_ancora}</GatilhoText> : null}
          {/* Sempre UMA linha, do mesmo tamanho, não importa quantas ocorrências
              o hábito tenha hoje — a lista das N ocorrências inteira estourava
              o balão em hábitos de 3x/dia. O detalhe completo (✓ feita, ✗
              falhou) mora no popup "ver todas". O dia se fecha pelo TOTAL
              realizado (RF07/RF13) — uma falha lá dentro não derruba a meta se
              o total do dia bateu por outro lado. */}
          {ocorrenciaParaResumo ? (
            <TarefaBloco>
              <TarefaResumo
                ocorrencia={ocorrenciaParaResumo}
                rotulo={temMaisDeUma ? t('home.proximaTarefa') : null}
                completed={completed}
                theme={theme}
                unidade={unidade}
              />
              {temMaisDeUma ? (
                <ExpandirButton onPress={() => setTarefasModalAberto(true)}>
                  <ExpandirTexto $completed={completed}>{t('home.verTodasTarefas')}</ExpandirTexto>
                  <Feather name="chevron-down" size={13} color={completed ? 'rgba(255,255,255,0.85)' : theme.primaryColor} />
                </ExpandirButton>
              ) : null}
            </TarefaBloco>
          ) : null}
        </HabitCard>
        {expression === 'preocupado' && (
          <UrgentBadge style={badgeFlutuando}>
            <UrgentBadgeText>{t('home.horaChegando')}</UrgentBadgeText>
          </UrgentBadge>
        )}
        {expression === 'desesperado' && (
          <UrgentBadge style={badgeFlutuando}>
            <UrgentBadgeText>{t('home.facaAgora')}</UrgentBadgeText>
          </UrgentBadge>
        )}
        <AvatarImage habit={habit} expression={expression} />
        {/* Quanto falta para a próxima ocorrência, logo abaixo do avatar: é a
            informação que decide "faço agora ou depois", e ficava só implícita
            na expressão do personagem. */}
        {restante ? (
          <ContadorWrapper>
            <Feather
              name={restante.atrasado ? 'alert-circle' : restante.programada ? 'calendar' : 'clock'}
              size={14}
              color={restante.atrasado ? theme.dangerColor : theme.textSecondary}
            />
            <ContadorTexto $atrasado={restante.atrasado}>{restante.texto}</ContadorTexto>
          </ContadorWrapper>
        ) : null}
        <ShadowBlur />
      </SlideInner>

      <Modal visible={tarefasModalAberto} transparent animationType="fade" onRequestClose={() => setTarefasModalAberto(false)}>
        <BottomSheetOverlay onPress={() => setTarefasModalAberto(false)}>
          <BottomSheet onStartShouldSetResponder={() => true}>
            <BottomSheetTitulo>{t('home.tarefasDoDia')}</BottomSheetTitulo>
            <ScrollView>
              {habit.ocorrencias?.map((ocorrencia, i) => (
                <TarefaLinhaDe
                  key={i}
                  ocorrencia={ocorrencia}
                  rotulo={t('home.tarefaN', { n: i + 1 })}
                  theme={theme}
                  unidade={unidade}
                />
              ))}
            </ScrollView>
          </BottomSheet>
        </BottomSheetOverlay>
      </Modal>

      <Modal visible={menuAberto} transparent animationType="fade" onRequestClose={onFecharMenu}>
        <BottomSheetOverlay onPress={onFecharMenu}>
          <BottomSheet onStartShouldSetResponder={() => true}>
            <BottomSheetTitulo numberOfLines={1}>{habit.titulo}</BottomSheetTitulo>
            <MenuOption
              onPress={() => {
                onFecharMenu();
                onEditar(habit);
              }}
            >
              <Feather name="edit-3" size={18} color={theme.textPrimary} />
              <MenuOptionText>{t('comum.editar')}</MenuOptionText>
            </MenuOption>
            <MenuOption
              onPress={() => {
                onFecharMenu();
                onArquivar(habit);
              }}
            >
              <Feather name="archive" size={18} color={theme.dangerColor} />
              <MenuOptionText $danger>{t('comum.arquivar')}</MenuOptionText>
            </MenuOption>
          </BottomSheet>
        </BottomSheetOverlay>
      </Modal>
    </HabitSlide>
  );
}

const HomeScreen = () => {
  const { t } = useI18n();
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

  // Trava de concorrencia: o useFocusEffect pode disparar duas vezes numa mesma
  // abertura (remontagem da Stack, volta de outra aba), e sem esta guarda cada
  // disparo virava uma requisicao e um toast de erro proprios — dai o mesmo
  // "nao foi possivel carregar seus habitos" aparecer repetido.
  const carregandoRef = useRef(false);

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
          if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
          if (b.status === 'COMPLETED' && a.status !== 'COMPLETED') return -1;
          if (!a.proximo_vencimento || !b.proximo_vencimento) return 0;
          return new Date(a.proximo_vencimento) - new Date(b.proximo_vencimento);
        });
        setLocalHabits(data);
      }
    } catch (error) {
      addToast(t('home.erroCarregarHabitos'), 'error');
      setLoadError(true);
    } finally {
      carregandoRef.current = false;
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
      addToast(t('home.arquivadoOk'), 'success');
      setHabitoParaArquivar(null);
      setActiveIndex(0);
      listRef.current?.scrollToOffset({ offset: 0 });
      await loadData();
    } catch (err) {
      const mensagem = err.response?.data?.message || t('home.erroArquivar');
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
