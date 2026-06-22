import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Check } from 'lucide-react';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
import { useThemeToggle } from '../../contexts/ThemeToggleContext';
import { getDashboard } from '../../services/api';
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
        // @audit-ok [Dashboard (3) — chama GET /dashboard]
        const response = await getDashboard();
        let data = response.data.habits || response.data || [];
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
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

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

  // @audit-ok [Dashboard (16) — determina a expressão do avatar baseado no tempo restante até o vencimento]
  const getAvatarExpression = (habit) => {
    if (habit.status === 'COMPLETED') return 'feliz';
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

  return (
    <HomeContainer>
      <LocalHeader />
      <CarouselWrapper ref={carouselRef} onScroll={handleScroll}>
        {localHabits.map((habit) => {
          const expression = getAvatarExpression(habit);
          const completed = habit.status === 'COMPLETED';
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
                <AvatarWrapper>{getAvatarImage(habit)}</AvatarWrapper>
                <ShadowBlur />
              </SlideInner>
            </HabitSlide>
          );
        })}
        {localHabits.length < 5 && (
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
        {localHabits.length < 5 && <Dot $active={activeIndex === localHabits.length} />}
      </DotsWrapper>
      <ActionWrapper>
        {activeIndex < localHabits.length && localHabits[activeIndex]?.status !== 'COMPLETED' ? (
          <div style={{ height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 600 }}>
            Use o botão Play na barra inferior
          </div>
        ) : activeIndex < localHabits.length ? (
          <DoneButton className="btn"><Check size={24} /> TAREFA FEITA</DoneButton>
        ) : (
          <div style={{ height: '64px' }}></div>
        )}
      </ActionWrapper>
    </HomeContainer>
  );
};

export default HomeScreen;
