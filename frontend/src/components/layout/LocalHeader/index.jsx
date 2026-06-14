// @audit-ok: FRONTEND-index.jsx-01
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Shield, Plus, Flame } from 'lucide-react';
import { useCurrentHabit } from '../../../contexts/CurrentHabitContext';
import {
  HeaderContainer,
  CoinsWrapper,
  FlameWrapper,
  ShieldButton,
  PlusIconWrapper
} from './styles';

const LocalHeader = () => {
  const navigate = useNavigate();
  const { currentHabit: activeHabit } = useCurrentHabit();
  
  const moedas = activeHabit ? activeHabit.moedas_locais || 0 : 0;
  const escudos = activeHabit ? activeHabit.bloqueios_acumulados || 0 : 0;
  const diasSeguidos = activeHabit ? activeHabit.dias_seguidos || 0 : 0;

  return (
    <HeaderContainer>
      <CoinsWrapper aria-label="Moedas Locais">
        <Coins size={20} />
        <span>{moedas}</span>
      </CoinsWrapper>

      <FlameWrapper aria-label="Ofensiva (Dias Seguidos)">
        <Flame size={24} fill="currentColor" />
        <span>{diasSeguidos}</span>
      </FlameWrapper>

      <ShieldButton 
        onClick={() => navigate('/store')}
        aria-label="Bloqueios e Escudos"
      >
        <Shield size={20} />
        <span>{escudos}</span>
        <PlusIconWrapper>
          <Plus size={16} />
        </PlusIconWrapper>
      </ShieldButton>
    </HeaderContainer>
  );
};

export default LocalHeader;
