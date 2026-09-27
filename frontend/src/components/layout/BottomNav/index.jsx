import { useRouter } from 'expo-router';
import { useTheme } from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCurrentHabit } from '@/contexts/CurrentHabitContext';
import { useToast } from '@/contexts/ToastContext';
import { useSfx } from '@/contexts/SoundContext';
import { NavContainer, PlayButtonWrapper, PlayButton, NavItemContainer, NavLabel } from './styles';
import { useI18n } from '@/contexts/LanguageContext';
import { ocorrenciaAtiva, horaCurta, minutosAteInicio, MINUTOS_ANTECEDENCIA_LIBERACAO } from '@/utils/ocorrencias';
import { STATUS_HABITO } from '@/model/Status';

function NavItem({ isActive, icon, label, theme, onPress }) {
  return (
    <NavItemContainer onPress={onPress}>
      {icon(isActive ? theme.primaryColor : theme.textSecondary)}
      <NavLabel $active={isActive}>{label}</NavLabel>
    </NavItemContainer>
  );
}

const BottomNav = ({ state, navigation }) => {
  const { t } = useI18n();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentHabit: activeHabit } = useCurrentHabit();
  const { addToast } = useToast();
  const { tocar } = useSfx();

  const isCompleted = activeHabit && activeHabit.status === STATUS_HABITO.COMPLETED;
  const nomeRotaAtiva = state.routes[state.index].name;

  const handlePlay = () => {
    tocar('tap');
    if (!activeHabit) {
      addToast(t('nav2.semHabito'), 'error');
      return;
    }
    if (isCompleted) {
      addToast(t('nav2.jaConcluida'), 'success');
      return;
    }
    const ativa = ocorrenciaAtiva(activeHabit);
    if (ativa && minutosAteInicio(ativa) > MINUTOS_ANTECEDENCIA_LIBERACAO) {
      addToast(t('home.programadaPara', { hora: horaCurta(ativa.horario_inicio) }), 'error');
      return;
    }
    router.push('/pretask');
  };

  const irPara = (to) => {
    tocar('tap');
    navigation.navigate(to);
  };

  return (
    <NavContainer style={{ paddingBottom: insets.bottom + 12 }}>
      <NavItem
        isActive={nomeRotaAtiva === 'home'}
        onPress={() => irPara('home')}
        icon={(cor) => <Feather name="target" size={24} color={cor} />}
        label={t('nav.inicio')}
        theme={theme}
      />
      <NavItem
        isActive={nomeRotaAtiva === 'stats'}
        onPress={() => irPara('stats')}
        icon={(cor) => <Feather name="bar-chart-2" size={24} color={cor} />}
        label={t('nav.stats')}
        theme={theme}
      />

      <PlayButtonWrapper>
        <PlayButton
          $completed={isCompleted}
          onPress={handlePlay}
          accessibilityLabel={isCompleted ? t('nav2.tarefaConcluida') : t('nav2.comecarFocado')}
        >
          {isCompleted ? (
            <Feather name="check" size={32} color="white" />
          ) : (
            <Feather name="play" size={28} color="white" style={{ marginLeft: 4 }} />
          )}
        </PlayButton>
      </PlayButtonWrapper>

      <NavItem
        isActive={nomeRotaAtiva === 'store'}
        onPress={() => irPara('store')}
        icon={(cor) => <MaterialCommunityIcons name="store" size={24} color={cor} />}
        label={t('nav.loja')}
        theme={theme}
      />
      <NavItem
        isActive={nomeRotaAtiva === 'profile'}
        onPress={() => irPara('profile')}
        icon={(cor) => <Feather name="user" size={24} color={cor} />}
        label={t('nav.perfil')}
        theme={theme}
      />
    </NavContainer>
  );
};

export default BottomNav;
