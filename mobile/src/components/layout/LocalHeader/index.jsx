import { useTheme } from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCurrentHabit } from '../../../contexts/CurrentHabitContext';
import { useI18n } from '../../../contexts/LanguageContext';
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
  ShieldWrapper,
} from './styles';

const LocalHeader = () => {
  const { t } = useI18n();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentHabit: activeHabit } = useCurrentHabit();

  const moedas = activeHabit ? (activeHabit.moedas_locais ?? 0) : '—';
  const escudos = activeHabit ? (activeHabit.bloqueios_acumulados ?? 0) : '—';
  const diasSeguidos = activeHabit ? (activeHabit.dias_seguidos ?? 0) : '—';

  return (
    <HeaderContainer style={{ paddingTop: insets.top + 12 }}>
      <HabitNameRow>
        {activeHabit ? t('comum.focandoEmHabito', { titulo: activeHabit.titulo }) : t('comum.selecioneHabito')}
      </HabitNameRow>

      <IndicatorsRow>
        <SideSlotStart>
          <CoinsWrapper accessibilityLabel={t('comum.moedasLocais')}>
            <IconRow>
              <FontAwesome5 name="coins" size={18} color={theme.warningColor} />
              <IndicatorValue color={theme.warningColor}>{moedas}</IndicatorValue>
            </IconRow>
            <IconLabel color={theme.warningColor}>{t('comum.moedas')}</IconLabel>
          </CoinsWrapper>
        </SideSlotStart>

        <FlameWrapper accessibilityLabel={t('comum.ofensivaDiasSeguidos')}>
          <IconRow>
            <MaterialCommunityIcons name="fire" size={24} color={theme.dangerColor} />
            <IndicatorValue $size={18} color={theme.dangerColor}>{diasSeguidos}</IndicatorValue>
          </IconRow>
          <IconLabel color={theme.dangerColor}>{t('comum.ofensiva')}</IconLabel>
        </FlameWrapper>

        {/* Só indicador: comprar escudo é exclusivamente pela aba Loja, então o
            "+" que existia aqui saiu para não sugerir uma compra pelo topo. */}
        <SideSlotEnd>
          <ShieldWrapper accessibilityLabel={t('comum.bloqueiosEscudos')}>
            <IconRow>
              <Feather name="shield" size={20} color={theme.primaryColor} />
              <IndicatorValue color={theme.primaryColor}>{escudos}</IndicatorValue>
            </IconRow>
            <IconLabel color={theme.primaryColor}>{t('comum.escudos')}</IconLabel>
          </ShieldWrapper>
        </SideSlotEnd>
      </IndicatorsRow>
    </HeaderContainer>
  );
};

export default LocalHeader;
