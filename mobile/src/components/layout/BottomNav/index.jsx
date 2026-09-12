import { useRouter } from 'expo-router';
import { useTheme } from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCurrentHabit } from '../../../contexts/CurrentHabitContext';
import { useToast } from '../../../contexts/ToastContext';
import { NavContainer, PlayButtonWrapper, PlayButton, NavItemContainer, NavLabel } from './styles';
import { useI18n } from '../../../contexts/LanguageContext';
import { ocorrenciaAtiva, horaCurta, minutosAteInicio, MINUTOS_ANTECEDENCIA_LIBERACAO } from '../../../utils/ocorrencias';

const BottomNav = ({ state, navigation }) => {
  const { t } = useI18n();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentHabit: activeHabit } = useCurrentHabit();
  const { addToast } = useToast();

  const isCompleted = activeHabit && activeHabit.status === 'COMPLETED';
  const nomeRotaAtiva = state.routes[state.index].name;

  const handlePlay = () => {
    if (!activeHabit) {
      addToast(t('nav2.semHabito'), 'error');
      return;
    }
    if (isCompleted) {
      addToast(t('nav2.jaConcluida'), 'success');
      return;
    }
    // A tarefa só libera 15 minutos antes do horário programado (ver
    // utils/ocorrencias.js) — antes disso o Play nem abre o Pré-Tarefa.
    const ativa = ocorrenciaAtiva(activeHabit);
    if (ativa && minutosAteInicio(ativa) > MINUTOS_ANTECEDENCIA_LIBERACAO) {
      addToast(t('home.programadaPara', { hora: horaCurta(ativa.horario_inicio) }), 'error');
      return;
    }
    router.push('/pretask');
  };

  const NavItem = ({ to, icon, label }) => {
    const isActive = nomeRotaAtiva === to;
    return (
      <NavItemContainer onPress={() => navigation.navigate(to)}>
        {icon(isActive ? theme.primaryColor : theme.textSecondary)}
        <NavLabel $active={isActive}>{label}</NavLabel>
      </NavItemContainer>
    );
  };

  return (
    <NavContainer style={{ paddingBottom: insets.bottom + 12 }}>
      <NavItem to="home" icon={(cor) => <Feather name="target" size={24} color={cor} />} label={t('nav.inicio')} />
      <NavItem to="stats" icon={(cor) => <Feather name="bar-chart-2" size={24} color={cor} />} label={t('nav.stats')} />

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
        to="store"
        icon={(cor) => <MaterialCommunityIcons name="store" size={24} color={cor} />}
        label={t('nav.loja')}
      />
      <NavItem to="profile" icon={(cor) => <Feather name="user" size={24} color={cor} />} label={t('nav.perfil')} />
    </NavContainer>
  );
};

export default BottomNav;
