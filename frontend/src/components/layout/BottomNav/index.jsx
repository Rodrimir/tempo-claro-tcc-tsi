import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Target, Store, Play, User, BarChart2, Check } from 'lucide-react';
import { useCurrentHabit } from '../../../contexts/CurrentHabitContext';
import { useToast } from '../../../contexts/ToastContext';
import {
  NavContainer,
  PlayButtonWrapper,
  PlayButton,
  StyledNavLink,
  NavLabel
} from './styles';

// @audit-ok [BottomNav — barra de navegação inferior com botão Play que inicia o fluxo de execução]

const BottomNav = () => {
  const navigate = useNavigate();
  // @audit-ok [Dashboard (17) — lê o hábito ativo do CurrentHabitContext para controlar o estado do botão Play]
  const { currentHabit: activeHabit } = useCurrentHabit();
  const { addToast } = useToast();

  // @audit-ok [Concluir Hoje (F04) — meta diária atingida vira indicador ✓, mas NÃO bloqueia o Play]
  const isMetaDone = activeHabit && activeHabit.metaConcluidaHoje;

  // @audit-ok [Pré-Tarefa Priming (5) — botão Play navega para /pretask iniciando o fluxo de execução]
  const handlePlay = () => {
    if (!activeHabit) {
      addToast('Nenhum hábito selecionado para focar.', 'error');
      return;
    }
    // @audit-info [Pré-Tarefa Priming (5) — mesmo com a meta atingida, o usuário pode seguir para perseguir o bônus extra (até "Concluir Hoje")]
    navigate('/pretask');
  };

  return (
    <NavContainer>
      <NavItem to="/home" icon={<Target size={24} />} label="Foco" />
      <NavItem to="/stats" icon={<BarChart2 size={24} />} label="Dados" />

      {/* @audit-ok [Execução Timer (1) — botão central Play muda para Check quando hábito já foi concluído hoje] */}
      <PlayButtonWrapper>
        <PlayButton
          $completed={isMetaDone}
          onClick={handlePlay}
          aria-label={isMetaDone ? "Meta atingida — continuar para bônus" : "Começar Hábito Focado"}
        >
          {isMetaDone ? (
            <Check size={32} strokeWidth={3} />
          ) : (
            <Play size={28} fill="currentColor" style={{ marginLeft: '4px' }} />
          )}
        </PlayButton>
      </PlayButtonWrapper>

      <NavItem to="/store" icon={<Store size={24} />} label="Loja" />
      <NavItem to="/profile" icon={<User size={24} />} label="Perfil" />
    </NavContainer>
  );
};

const NavItem = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);

  return (
    <StyledNavLink to={to} $active={isActive}>
      {icon}
      <NavLabel>{label}</NavLabel>
    </StyledNavLink>
  );
};

export default BottomNav;
