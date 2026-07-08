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

// @audit-ok [LocalHeader — cabeçalho do hábito focado: exibe moedas, ofensiva e escudos, com atalho para a Loja]

const LocalHeader = () => {
  const navigate = useNavigate();
  // @audit-ok [Dashboard (17) — lê os agregados do hábito ativo (saldo/escudos/ofensiva) do CurrentHabitContext]
  const { currentHabit: activeHabit } = useCurrentHabit();

  const moedas = activeHabit ? activeHabit.saldo || 0 : 0;
  const escudos = activeHabit ? activeHabit.escudosDisponiveis || 0 : 0;
  const diasSeguidos = activeHabit ? activeHabit.ofensiva || 0 : 0;

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
