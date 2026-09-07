import { useRouter } from 'expo-router';
import { useTheme } from 'styled-components/native';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCurrentHabit } from '../../../contexts/CurrentHabitContext';
import {
  HeaderContainer,
  HabitNameRow,
  IndicatorsRow,
  SideSlotStart,
  SideSlotEnd,
  IconRow,
  IndicatorValue,
  IconLabel,
  CoinsWrapper,
  FlameWrapper,
  ShieldButton,
  PlusIconWrapper,
} from './styles';

const LocalHeader = () => {
  const router = useRouter();
  const theme = useTheme();
  const { currentHabit: activeHabit } = useCurrentHabit();

  const moedas = activeHabit ? (activeHabit.moedas_locais ?? 0) : '—';
  const escudos = activeHabit ? (activeHabit.bloqueios_acumulados ?? 0) : '—';
  const diasSeguidos = activeHabit ? (activeHabit.dias_seguidos ?? 0) : '—';

  return (
    <HeaderContainer>
      <HabitNameRow>
        {activeHabit ? `Focando em ${activeHabit.titulo}` : 'Selecione um hábito'}
      </HabitNameRow>

      <IndicatorsRow>
        <SideSlotStart>
          <CoinsWrapper accessibilityLabel="Moedas Locais">
            <IconRow>
              <FontAwesome5 name="coins" size={18} color={theme.warningColor} />
              <IndicatorValue color={theme.warningColor}>{moedas}</IndicatorValue>
            </IconRow>
            <IconLabel color={theme.warningColor}>Moedas</IconLabel>
          </CoinsWrapper>
        </SideSlotStart>

        <FlameWrapper accessibilityLabel="Ofensiva (Dias Seguidos)">
          <IconRow>
            <MaterialCommunityIcons name="fire" size={24} color={theme.dangerColor} />
            <IndicatorValue $size={18} color={theme.dangerColor}>{diasSeguidos}</IndicatorValue>
          </IconRow>
          <IconLabel color={theme.dangerColor}>Ofensiva</IconLabel>
        </FlameWrapper>

        <SideSlotEnd>
          <ShieldButton onPress={() => router.push('/store')} accessibilityLabel="Bloqueios e Escudos">
            <IconRow>
              <Feather name="shield" size={20} color={theme.primaryColor} />
              <IndicatorValue color={theme.primaryColor}>{escudos}</IndicatorValue>
              <PlusIconWrapper>
                <Feather name="plus" size={16} color="white" />
              </PlusIconWrapper>
            </IconRow>
            <IconLabel color={theme.primaryColor}>Escudos</IconLabel>
          </ShieldButton>
        </SideSlotEnd>
      </IndicatorsRow>
    </HeaderContainer>
  );
};

export default LocalHeader;
