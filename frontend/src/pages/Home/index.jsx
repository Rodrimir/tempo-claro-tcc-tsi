import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Check } from 'lucide-react';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
import { useThemeToggle } from '../../contexts/ThemeToggleContext';
import { getDashboard, getWeeklyStats, concludeDay } from '../../services/api';
import solFlutuando from '../../assets/sol_flutuando.webp';
import luaFlutuando from '../../assets/lua_flutuando.png';
import LoadingScreen from '../../components/common/LoadingScreen';
import LocalHeader from '../../components/layout/LocalHeader';
import HabitAvatar from '../../components/common/HabitAvatar';
import { deriveExpression } from '../../utils/avatar';
import {
  HomeContainer,
  CarouselWrapper,
  HabitSlide,
  SlideInner,
  HabitCard,
  CardSubtitle,
  CardTitle,
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
  StartButton,
  DoneButton
} from './styles';

// @audit-ok [Dashboard (1) — tela principal com carrossel de hábitos e controle de avatar]

// @audit-ok [Dashboard (12) — helper: seleciona a sub-atividade pendente/mais próxima para ordenar o carrossel]
const getNextSubActivity = (habit) => {
  if (!habit.sub_atividades || habit.sub_atividades.length === 0) return null;
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  
  const sorted = [...habit.sub_atividades].sort((a, b) => {
    const timeA = a.horario_inicio || "23:59:59";
    const timeB = b.horario_inicio || "23:59:59";
    return timeA.localeCompare(timeB);
  });

  let next = sorted[sorted.length - 1]; // fallback para a última se todas passaram
  for (const sub of sorted) {
    if (!sub.horario_inicio) continue;
    const [h, m] = sub.horario_inicio.split(':').map(Number);
    const subMinutes = h * 60 + m;
    if (subMinutes >= currentMinutes - 60) {
       next = sub;
       break;
    }
  }
  return next;
};

const HomeScreen = () => {
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef(null);
  const navigate = useNavigate();
  const { setCurrentHabit } = useCurrentHabit();
  const { isDark } = useThemeToggle();
  const [localHabits, setLocalHabits] = useState([]);

  // @audit-ok [Dashboard (2) — busca lista de hábitos ao montar a tela]
  useEffect(() => {
    const loadData = async () => {
      try {
        // @audit-ok [Dashboard (3) — chama GET /dashboard + GET /stats/weekly em paralelo]
        const [dashRes, statsRes] = await Promise.all([
          getDashboard(),
          getWeeklyStats().catch(() => ({ data: [] }))
        ]);
        let data = dashRes.data.habits || dashRes.data || [];
        const stats = Array.isArray(statsRes.data) ? statsRes.data : [];
        if (Array.isArray(data)) {
          // @audit-ok [Concluir Hoje (F04) — injeta o progresso do dia (último dia do stats/weekly),
          // pois o /dashboard ainda não devolve valor acumulado × meta do dia]
          data = data.map(h => {
            const st = stats.find(s => s.habitoId === h.id);
            const hoje = st?.dias?.[st.dias.length - 1];
            const valorTotalDiaHoje = hoje?.valorTotalDia || 0;
            const metaDoDiaHoje = hoje?.metaDoDia || h.meta_base || 0;
            const metaConcluidaHoje = hoje
              ? (hoje.status === 'CONCLUIDO' || (metaDoDiaHoje > 0 && valorTotalDiaHoje >= metaDoDiaHoje))
              : false;
            return { ...h, valorTotalDiaHoje, metaDoDiaHoje, metaConcluidaHoje };
          });
          // @audit-ok [Dashboard (13) — ordena: meta concluída vai ao final, depois por sub_atividade mais próxima]
          data.sort((a, b) => {
            if (a.metaConcluidaHoje && !b.metaConcluidaHoje) return 1;
            if (b.metaConcluidaHoje && !a.metaConcluidaHoje) return -1;

            const subA = getNextSubActivity(a);
            const subB = getNextSubActivity(b);

            const timeA = subA && subA.horario_inicio ? subA.horario_inicio : '23:59:59';
            const timeB = subB && subB.horario_inicio ? subB.horario_inicio : '23:59:59';

            return timeA.localeCompare(timeB);
          });
          // @audit-ok [Dashboard (14) — armazena hábitos no estado local]
          setLocalHabits(data);
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // @audit-ok [Dashboard (17) — sincroniza o hábito central do carrossel com o CurrentHabitContext]
  useEffect(() => {
    if (localHabits.length > 0 && localHabits[activeIndex]) {
      // @audit-info [Dashboard (17) — injeta campos de gamificação com fallback 0 (nomes conforme HabitoResponse)]
      const habitData = localHabits[activeIndex];
      setCurrentHabit({
         ...habitData,
         saldo: habitData.saldo || 0,
         escudosDisponiveis: habitData.escudosDisponiveis || 0,
         ofensiva: habitData.ofensiva || 0,
         nivel: habitData.nivel || 0,
         metaDoDia: habitData.meta_base || 1
      });
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

  // @audit-ok [Concluir Hoje (F04) — encerra o dia (best-effort no backend) e vai para a tela de parabéns]
  const handleConcludeDay = async (habit) => {
    if (!habit) return;
    try {
      const res = await concludeDay(habit.id);
      navigate('/success', { state: { metaDiaria: true, feedback: res.data } });
    } catch {
      // @audit-info [Concluir Hoje (F04) — se o backend falhar, ainda mostra o feedback (recompensa apurada no fim do dia)]
      navigate('/success', { state: { metaDiaria: true } });
    }
  };

  if (loading) return <LoadingScreen message="Carregando Hábitos" />;

  return (
    <HomeContainer>
      <LocalHeader />
      <CarouselWrapper ref={carouselRef} onScroll={handleScroll}>
        {localHabits.map((habit) => {
          const expression = deriveExpression(habit);
          const completed = expression === 'concluido';
          return (
            <HabitSlide key={habit.id}>
              <SlideInner>
                <HabitCard $completed={completed} $urgent={expression === 'preocupado' || expression === 'desesperado'}>
                  <CardSubtitle $completed={completed} $urgent={expression === 'preocupado' || expression === 'desesperado'}>
                    {completed ? 'Concluído Hoje' : ((expression === 'preocupado' || expression === 'desesperado') ? 'Atenção!' : 'Sua Tarefa')}
                  </CardSubtitle>
                  <CardTitle $completed={completed}>{habit.titulo}</CardTitle>
                </HabitCard>
                {expression === 'preocupado' && <UrgentBadge>A hora está chegando!</UrgentBadge>}
                {expression === 'desesperado' && <UrgentBadge style={{ background: 'var(--danger-color)' }}>Faça agora ou perca a ofensiva!</UrgentBadge>}
                {expression === 'falha' && <UrgentBadge style={{ background: 'var(--danger-color)' }}>Tempo esgotado. Falha!</UrgentBadge>}
                <AvatarWrapper>
                  <HabitAvatar key={`${habit.id}-${expression}`} habit={habit} expression={expression} />
                </AvatarWrapper>
                <ShadowBlur />
              </SlideInner>
            </HabitSlide>
          );
        })}
        {localHabits.length < 2 && (
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
        {localHabits.length < 2 && <Dot $active={activeIndex === localHabits.length} />}
      </DotsWrapper>
      <ActionWrapper>
        {activeIndex < localHabits.length ? (
          localHabits[activeIndex]?.metaConcluidaHoje ? (
            <DoneButton className="btn" onClick={() => handleConcludeDay(localHabits[activeIndex])}>
              <Check size={24} /> CONCLUIR HOJE
            </DoneButton>
          ) : (
            <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>
              Use o botão Play na barra inferior
            </div>
          )
        ) : (
          <div style={{ height: '64px' }}></div>
        )}
      </ActionWrapper>
    </HomeContainer>
  );
};

export default HomeScreen;
