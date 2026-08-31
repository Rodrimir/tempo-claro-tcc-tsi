import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Shield, Plus, Flame } from 'lucide-react';
import { useCurrentHabit } from '../../../contexts/CurrentHabitContext';
import {
  HeaderContainer,
  HabitNameRow,
  IndicatorsRow,
  IconRow,
  IconLabel,
  CoinsWrapper,
  FlameWrapper,
  ShieldButton,
  PlusIconWrapper
} from './styles';

// @audit-ok [E3.2 — os 3 indicadores abaixo são do HÁBITO ATIVO no carrossel
// (CurrentHabitContext), não da conta — cada hábito tem seu próprio saldo de
// moedas/ofensiva/escudos (mesmo conceito já explicado em Store/index.jsx,
// E1.7). Este cabeçalho é o único lugar que mostra esses números, e até esta
// tarefa nada aqui dizia de quem eram.]
const LocalHeader = () => {
  const navigate = useNavigate();
  const { currentHabit: activeHabit } = useCurrentHabit();

  // @audit-ok [E3.2 (item 3) — "—" em vez de 0 quando não há hábito
  // selecionado (ex.: parado no slide de criação, ou entre duas páginas do
  // carrossel). 0 parecia "seu saldo zerou", que lia como bug; "—" deixa
  // claro que não é um valor real, é ausência de seleção.]
  const moedas = activeHabit ? (activeHabit.moedas_locais ?? 0) : '—';
  const escudos = activeHabit ? (activeHabit.bloqueios_acumulados ?? 0) : '—';
  const diasSeguidos = activeHabit ? (activeHabit.dias_seguidos ?? 0) : '—';

  return (
    <HeaderContainer>
      {/* @audit-ok [E3.2 (item 2) — nome do hábito ativo, pra deixar claro de
          quem são os números logo abaixo.] */}
      <HabitNameRow>
        {activeHabit ? `Focando em ${activeHabit.titulo}` : 'Selecione um hábito'}
      </HabitNameRow>

      <IndicatorsRow>
        {/* @audit-ok [E3.2 (item 1) — rótulo textual "Moedas" sob o ícone;
            antes só existia como aria-label, invisível pra quem enxerga.] */}
        <CoinsWrapper aria-label="Moedas Locais">
          <IconRow>
            <Coins size={20} />
            <span>{moedas}</span>
          </IconRow>
          <IconLabel>Moedas</IconLabel>
        </CoinsWrapper>

        <FlameWrapper aria-label="Ofensiva (Dias Seguidos)">
          <IconRow>
            <Flame size={24} fill="currentColor" />
            <span>{diasSeguidos}</span>
          </IconRow>
          <IconLabel>Ofensiva</IconLabel>
        </FlameWrapper>

        <ShieldButton
          onClick={() => navigate('/store')}
          aria-label="Bloqueios e Escudos"
        >
          <IconRow>
            <Shield size={20} />
            <span>{escudos}</span>
            <PlusIconWrapper>
              <Plus size={16} />
            </PlusIconWrapper>
          </IconRow>
          <IconLabel>Escudos</IconLabel>
        </ShieldButton>
      </IndicatorsRow>
    </HeaderContainer>
  );
};

export default LocalHeader;
