import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Check, AlertTriangle, Target, MoreVertical, Edit3, Archive } from 'lucide-react';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
import { useThemeToggle } from '../../contexts/ThemeToggleContext';
import { useToast } from '../../contexts/ToastContext';
import { getDashboard, archiveHabit } from '../../services/api';
import solFlutuando from '../../assets/sol_flutuando.webp';
import luaFlutuando from '../../assets/lua_flutuando.png';
import gotinhaNormal from '../../assets/gotinha/normal.png';
import gotinhaFeliz from '../../assets/gotinha/feliz.png';
import LoadingScreen from '../../components/common/LoadingScreen';
import LocalHeader from '../../components/layout/LocalHeader';
import {
  HomeContainer,
  CarouselWrapper,
  HabitSlide,
  SlideInner,
  HabitCard,
  CardSubtitle,
  CardTitle,
  GatilhoText,
  ProgressoOcorrenciasText,
  UrgentBadge,
  AvatarWrapper,
  ShadowBlur,
  SunWrapper,
  EmptyTitle,
  EmptySubtitle,
  CreateHabitButton,
  DotsWrapper,
  Dot,
  ActionWrapper,
  DoneButton,
  ErrorStateContainer,
  ErrorIconWrapper,
  WelcomeStateContainer,
  WelcomeIconWrapper,
  RetryButton,
  MenuButton,
  ContextMenuOverlay,
  ContextMenu,
  ContextMenuItem,
  ArchiveModalOverlay,
  ArchiveModalContent,
  ArchiveModalTitle,
  ArchiveModalText,
  ArchiveModalActions,
  ArchiveCancelButton,
  ArchiveConfirmButton
} from './styles';

// @audit-ok [Dashboard (1) — tela principal com carrossel de hábitos e controle de avatar]

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  // @audit-ok [E1.8 (item 1/3) — terceiro estado, distinto de loading e de
  // "0 hábitos de verdade". Antes uma falha de rede deixava localHabits=[] e
  // a tela renderizava exatamente o carrossel vazio de quem nunca criou nada.]
  const [loadError, setLoadError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef(null);
  const navigate = useNavigate();
  const { setCurrentHabit } = useCurrentHabit();
  const { isDark } = useThemeToggle();
  const { addToast } = useToast();
  const [localHabits, setLocalHabits] = useState([]);
  // @audit-ok [E1.3 — limite de hábitos ativos (RF03), lido de
  // limite_habitos_ativos no envelope de GET /dashboard. O "2" aqui é só o
  // fallback de exibição antes da 1ª resposta chegar, nunca a fonte da regra.]
  const [limiteHabitos, setLimiteHabitos] = useState(2);
  // @audit-ok [E4.2 (item 1) — id do hábito com o menu "⋮" aberto, ou null.
  // Só um por vez: abrir outro fecha o anterior automaticamente (é o mesmo
  // state controlando os dois).]
  const [menuAbertoId, setMenuAbertoId] = useState(null);
  // @audit-ok [E4.2 (item 3) — hábito com o modal de confirmação de
  // arquivamento aberto, ou null. Separado de menuAbertoId de propósito: o
  // menu já fecha antes do modal abrir (ver handleAbrirArquivar).]
  const [habitoParaArquivar, setHabitoParaArquivar] = useState(null);
  const [arquivando, setArquivando] = useState(false);

  // @audit-ok [Dashboard (2) — busca lista de hábitos ao montar a tela.
  // E1.8: extraído do useEffect para o botão "Tentar novamente" poder chamar
  // de novo sem duplicar a lógica.]
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      // @audit-ok [Dashboard (3) — chama GET /dashboard]
      const response = await getDashboard();
      let data = response.data.habits || response.data || [];
      // @audit-ok [E1.3 — guarda o limite vindo do servidor, se presente]
      if (typeof response.data.limite_habitos_ativos === 'number') {
        setLimiteHabitos(response.data.limite_habitos_ativos);
      }
      if (Array.isArray(data)) {
        // @audit-ok [Dashboard (13) — ordena: COMPLETED vai ao final, depois por proximo_vencimento]
        data.sort((a, b) => {
          if (a.status === 'COMPLETED' && b.status !== 'COMPLETED') return 1;
          if (b.status === 'COMPLETED' && a.status !== 'COMPLETED') return -1;
          if (!a.proximo_vencimento || !b.proximo_vencimento) return 0;
          return new Date(a.proximo_vencimento) - new Date(b.proximo_vencimento);
        });
        // @audit-ok [Dashboard (14) — armazena hábitos no estado local]
        setLocalHabits(data);
      }
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
      // @audit-ok [E1.8 (item 1) — antes só logava no console e seguia como se
      // nada tivesse acontecido]
      addToast('Não foi possível carregar seus hábitos.', 'error');
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // @audit-ok [Dashboard (17) — sincroniza o hábito central do carrossel com o CurrentHabitContext]
  useEffect(() => {
    if (localHabits.length > 0 && localHabits[activeIndex]) {
      setCurrentHabit(localHabits[activeIndex]);
    } else {
      setCurrentHabit(null);
    }
  }, [activeIndex, localHabits, setCurrentHabit]);

  // @audit-ok [Dashboard (17) — calcula o índice ativo ao rolar o carrossel]
  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const width = carouselRef.current.clientWidth;
      setActiveIndex(Math.round(scrollLeft / width));
    }
  };

  // @audit-ok [E4.2 (item 2) — RF23: navega pro assistente em modo de edição,
  // passando o hábito completo por location.state (mesmo padrão já usado em
  // Success/Fail) — CreateHabit lê editHabit e pula direto pro Passo 3.]
  const handleEditar = (habit) => {
    setMenuAbertoId(null);
    navigate('/create', { state: { editHabit: habit } });
  };

  const handleAbrirArquivar = (habit) => {
    setMenuAbertoId(null);
    setHabitoParaArquivar(habit);
  };

  // @audit-ok [E4.2 (item 3/4) — chama DELETE /habits/{id}, que no backend é
  // soft delete (UPDATE ativo=false, ver HabitoRepository.archive) — não
  // apaga histórico. Recarrega a lista e zera o carrossel de volta pro
  // início: o índice ativo anterior pode não existir mais depois de um
  // hábito sumir da lista.]
  const handleConfirmarArquivar = async () => {
    if (!habitoParaArquivar) return;
    setArquivando(true);
    try {
      await archiveHabit(habitoParaArquivar.id);
      addToast('Hábito arquivado.', 'success');
      setHabitoParaArquivar(null);
      setActiveIndex(0);
      if (carouselRef.current) carouselRef.current.scrollTo({ left: 0 });
      await loadData();
    } catch (err) {
      const mensagem = err.response?.data?.message || 'Erro ao arquivar hábito. Tente novamente.';
      addToast(mensagem, 'error');
    } finally {
      setArquivando(false);
    }
  };

  // @audit-ok [E2.4 (item 1/5) — confirma se hoje é dia programado pra este
  // hábito. frequencia_semanal[0]=domingo, mesma convenção do backend
  // (ProximoVencimentoService) e de Date.getDay() (0=Dom nativo do JS, sem
  // conversão nenhuma necessária aqui). Campo ausente/malformado (hábito
  // criado antes da E2.4, por exemplo) vira "todo dia programado" — não
  // trava ninguém que já existia.]
  const isDiaProgramado = (habit) => {
    if (!habit.frequencia_semanal || habit.frequencia_semanal.length !== 7) return true;
    return habit.frequencia_semanal[new Date().getDay()] === '1';
  };

  // @audit-ok [Dashboard (16) — determina a expressão do avatar baseado no tempo restante até o vencimento]
  const getAvatarExpression = (habit) => {
    if (habit.status === 'COMPLETED') return 'feliz';
    // @audit-ok [E2.4 (item 3/5) — dia de folga nunca mostra urgência/falha.
    // proximo_vencimento já vem correto do backend (pula pro próximo dia
    // programado), mas esta é a segunda camada: garante que a UI nunca
    // trata um dia sem tarefa como atrasado, mesmo em alguma borda de fuso.]
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

  // @audit-ok [Dashboard (15) — retorna o componente visual do avatar (imagem ou emoji)]
  const getAvatarImage = (habit) => {
    const expression = getAvatarExpression(habit);
    const emojis = {
      'normal': '🌱',
      'preocupado': '😰',
      'desesperado': '😱',
      'feliz': '✨',
      'falha': '☠️'
    };
    const avatarStyle = { position: 'relative', width: '160px', height: '160px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' };
    const imgStyle = { width: '100%', height: '100%', objectFit: 'contain' };

    if (habit.categoria === 'AGUA') {
      if (expression === 'normal') return <div style={avatarStyle}><img src={gotinhaNormal} alt="Gotinha" style={imgStyle} /></div>;
      if (expression === 'feliz') return <div style={avatarStyle}><img src={gotinhaFeliz} alt="Gotinha Feliz" style={imgStyle} /></div>;
    }

    return (
      <div style={avatarStyle}>
        <span style={{ fontSize: '100px', display: 'block' }}>{emojis[expression] || '🌱'}</span>
      </div>
    );
  };

  if (loading) return <LoadingScreen message="Carregando Hábitos" />;

  // @audit-ok [E1.8 (item 1/3) — estado de ERRO: nunca cai no carrossel vazio
  // (que seria enganoso — pareceria "0 hábitos criados"). Só o botão abaixo
  // tenta de novo; não há navegação nem estado parcial nesta tela.]
  if (loadError) {
    return (
      <HomeContainer>
        <LocalHeader />
        <ErrorStateContainer>
          <ErrorIconWrapper><AlertTriangle size={32} /></ErrorIconWrapper>
          <EmptyTitle>Não foi possível carregar</EmptyTitle>
          <EmptySubtitle>Verifique sua conexão e tente novamente.</EmptySubtitle>
          <RetryButton onClick={loadData}>Tentar novamente</RetryButton>
        </ErrorStateContainer>
      </HomeContainer>
    );
  }

  // @audit-ok [E3.1 (item 1) — 0 hábitos de verdade vira tela cheia dedicada,
  // explicando o conceito de foco único (RNF02) — distinta do slide "Começar
  // um novo hábito?" que continua aparecendo dentro do carrossel pra quem já
  // tem 1 hábito e ainda não bateu o limite.]
  if (localHabits.length === 0) {
    return (
      <HomeContainer>
        <LocalHeader />
        <WelcomeStateContainer>
          <WelcomeIconWrapper><Target size={32} /></WelcomeIconWrapper>
          <EmptyTitle>Bem-vindo ao Tempo Claro</EmptyTitle>
          <EmptySubtitle>
            Diferente de uma lista de tarefas cheia, aqui você foca em no máximo{' '}
            {limiteHabitos} hábito{limiteHabitos === 1 ? '' : 's'} por vez — sem
            dispersão, sem sobrecarga. Crie o primeiro pra começar.
          </EmptySubtitle>
          <CreateHabitButton
            className="btn btn-primary"
            onClick={() => navigate('/create')}
            style={{ width: '64px', height: '64px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '24px auto 0' }}
          >
            <Play size={32} style={{ transform: 'rotate(90deg)' }} />
          </CreateHabitButton>
        </WelcomeStateContainer>
      </HomeContainer>
    );
  }

  return (
    <HomeContainer>
      <LocalHeader />
      <CarouselWrapper ref={carouselRef} onScroll={handleScroll}>
        {localHabits.map((habit) => {
          const expression = getAvatarExpression(habit);
          const completed = habit.status === 'COMPLETED';
          // @audit-ok [E2.4 (item 5) — folga só se importa quando ainda não foi
          // feito hoje; quem já executou num dia de folga (voluntário) continua
          // vendo "Concluído Hoje" normalmente, não "Folga Programada".]
          const folga = !completed && !isDiaProgramado(habit);
          return (
            <HabitSlide key={habit.id}>
              <SlideInner>
                <HabitCard $completed={completed} $urgent={expression === 'preocupado' || expression === 'desesperado'}>
                  {/* @audit-ok [E4.2 (item 1) — RF23: menu de contexto do
                      cartão. stopPropagation em tudo aqui dentro pra não
                      disparar nenhum onClick do carrossel por trás.] */}
                  <MenuButton
                    type="button"
                    $completed={completed}
                    onClick={(e) => { e.stopPropagation(); setMenuAbertoId(menuAbertoId === habit.id ? null : habit.id); }}
                    aria-label={`Mais opções para ${habit.titulo}`}
                    aria-haspopup="true"
                    aria-expanded={menuAbertoId === habit.id}
                  >
                    <MoreVertical size={18} />
                  </MenuButton>
                  {menuAbertoId === habit.id && (
                    <>
                      <ContextMenuOverlay onClick={() => setMenuAbertoId(null)} />
                      <ContextMenu role="menu">
                        <ContextMenuItem role="menuitem" type="button" onClick={() => handleEditar(habit)}>
                          <Edit3 size={16} /> Editar
                        </ContextMenuItem>
                        <ContextMenuItem role="menuitem" type="button" $danger onClick={() => handleAbrirArquivar(habit)}>
                          <Archive size={16} /> Arquivar
                        </ContextMenuItem>
                      </ContextMenu>
                    </>
                  )}
                  <CardSubtitle $completed={completed} $urgent={expression === 'preocupado' || expression === 'desesperado'}>
                    {completed ? 'Concluído Hoje' : folga ? 'Folga Programada' : ((expression === 'preocupado' || expression === 'desesperado') ? 'Atenção!' : 'Sua Tarefa')}
                  </CardSubtitle>
                  <CardTitle $completed={completed}>{habit.titulo}</CardTitle>
                  {/* @audit-ok [E4.1 (item 3) — gatilho_ancora é opcional;
                      hábitos sem ele (a maioria, criados antes desta tarefa)
                      simplesmente não mostram esta linha.] */}
                  {habit.gatilho_ancora && (
                    <GatilhoText $completed={completed}>⚓ {habit.gatilho_ancora}</GatilhoText>
                  )}
                  {/* @audit-ok [E2.8 (item 3) — "2 de 3 hoje": só faz sentido
                      mostrar pra hábito de mais de 1x/dia; pra 1x/dia o rótulo
                      acima (Concluído/Sua Tarefa) já diz tudo que "1 de 1" diria.] */}
                  {habit.meta_frequencia_diaria > 1 && (
                    <ProgressoOcorrenciasText $completed={completed}>
                      {habit.execucoes_hoje || 0} de {habit.meta_frequencia_diaria} hoje
                    </ProgressoOcorrenciasText>
                  )}
                </HabitCard>
                {expression === 'preocupado' && <UrgentBadge>A hora está chegando!</UrgentBadge>}
                {expression === 'desesperado' && <UrgentBadge style={{ background: 'var(--danger-strong)' }}>Faça agora ou perca a ofensiva!</UrgentBadge>}
                {expression === 'falha' && <UrgentBadge style={{ background: 'var(--danger-strong)' }}>Tempo esgotado. Falha!</UrgentBadge>}
                <AvatarWrapper>{getAvatarImage(habit)}</AvatarWrapper>
                <ShadowBlur />
              </SlideInner>
            </HabitSlide>
          );
        })}
        {/* @audit-ok [E1.3 — RF03: só oferece criar hábito novo abaixo do limite] */}
        {localHabits.length < limiteHabitos && (
          <HabitSlide>
            <SlideInner>
              <SunWrapper>
                <img src={isDark ? luaFlutuando : solFlutuando} alt={isDark ? "Lua" : "Sol"} />
              </SunWrapper>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <EmptyTitle>Começar um novo hábito?</EmptyTitle>
                <EmptySubtitle>Configure um novo ecossistema.</EmptySubtitle>
              </div>
              <CreateHabitButton
                className="btn btn-primary"
                onClick={() => navigate('/create')}
                style={{ width: '64px', height: '64px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}
              >
                <Play size={32} style={{ transform: 'rotate(90deg)' }} />
              </CreateHabitButton>
            </SlideInner>
          </HabitSlide>
        )}
      </CarouselWrapper>
      <DotsWrapper>
        {localHabits.map((_, i) => <Dot key={i} $active={i === activeIndex} />)}
        {localHabits.length < limiteHabitos && <Dot $active={activeIndex === localHabits.length} />}
      </DotsWrapper>
      <ActionWrapper>
        {activeIndex < localHabits.length && localHabits[activeIndex]?.status !== 'COMPLETED' ? (
          <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>
            {/* @audit-ok [E2.4 (item 5) — dia de folga: botão de execução
                continua funcionando (quem quiser praticar por conta própria
                pode), só a mensagem deixa de soar obrigatória.] */}
            {isDiaProgramado(localHabits[activeIndex])
              ? 'Use o botão Play na barra inferior'
              : 'Hoje é opcional — toque em Play se quiser praticar'}
          </div>
        ) : activeIndex < localHabits.length ? (
          <DoneButton className="btn"><Check size={24} /> TAREFA FEITA</DoneButton>
        ) : (
          <div style={{ height: '64px' }}></div>
        )}
      </ActionWrapper>

      {/* @audit-ok [E4.2 (item 3) — confirmação explica exatamente as duas
          coisas que o item pede: histórico preservado, vaga liberada.] */}
      {habitoParaArquivar && (
        <ArchiveModalOverlay onClick={() => !arquivando && setHabitoParaArquivar(null)}>
          <ArchiveModalContent onClick={e => e.stopPropagation()}>
            <ArchiveModalTitle>Arquivar "{habitoParaArquivar.titulo}"?</ArchiveModalTitle>
            <ArchiveModalText>
              O histórico de execuções e moedas fica preservado — nada é apagado.
              Isso libera uma vaga entre os {limiteHabitos} hábitos ativos para
              você criar outro.
            </ArchiveModalText>
            <ArchiveModalActions>
              <ArchiveCancelButton type="button" onClick={() => setHabitoParaArquivar(null)} disabled={arquivando}>
                Cancelar
              </ArchiveCancelButton>
              <ArchiveConfirmButton type="button" onClick={handleConfirmarArquivar} disabled={arquivando} aria-busy={arquivando}>
                {arquivando ? 'Arquivando...' : 'Arquivar'}
              </ArchiveConfirmButton>
            </ArchiveModalActions>
          </ArchiveModalContent>
        </ArchiveModalOverlay>
      )}
    </HomeContainer>
  );
};

export default HomeScreen;
