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

const BottomNav = () => {
  const navigate = useNavigate();
  const { currentHabit: activeHabit } = useCurrentHabit();
  const { addToast } = useToast();

  const isCompleted = activeHabit && activeHabit.status === 'COMPLETED';

  const handlePlay = () => {
    if (!activeHabit) {
      addToast('Nenhum hábito selecionado para focar.', 'error');
      return;
    }
    if (isCompleted) {
      addToast('Esta tarefa já foi concluída hoje! 🎉', 'success');
      return;
    }
    
    // O currentHabit já está setado, só precisamos navegar
    navigate('/pretask');
  };

  return (
    <NavContainer>
      <NavItem to="/home" icon={<Target size={24} />} label="Foco" />
      <NavItem to="/stats" icon={<BarChart2 size={24} />} label="Dados" />
      
      <PlayButtonWrapper>
        <PlayButton 
          $completed={isCompleted} 
          onClick={handlePlay} 
          aria-label={isCompleted ? "Tarefa Concluída" : "Começar Hábito Focado"}
        >
          {isCompleted ? (
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
