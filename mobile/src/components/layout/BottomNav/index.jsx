import { useRouter } from 'expo-router';
import { useTheme } from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCurrentHabit } from '../../../contexts/CurrentHabitContext';
import { useToast } from '../../../contexts/ToastContext';
import { NavContainer, PlayButtonWrapper, PlayButton, NavItemContainer, NavLabel } from './styles';

const BottomNav = ({ state, navigation }) => {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentHabit: activeHabit } = useCurrentHabit();
  const { addToast } = useToast();

  const isCompleted = activeHabit && activeHabit.status === 'COMPLETED';
  const nomeRotaAtiva = state.routes[state.index].name;

  const handlePlay = () => {
    if (!activeHabit) {
      addToast('Nenhum hábito selecionado para focar.', 'error');
      return;
    }
    if (isCompleted) {
      addToast('Esta tarefa já foi concluída hoje! 🎉', 'success');
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
      <NavItem to="home" icon={(cor) => <Feather name="target" size={24} color={cor} />} label="Foco" />
      <NavItem to="stats" icon={(cor) => <Feather name="bar-chart-2" size={24} color={cor} />} label="Dados" />

      <PlayButtonWrapper>
        <PlayButton
          $completed={isCompleted}
          onPress={handlePlay}
          accessibilityLabel={isCompleted ? 'Tarefa Concluída' : 'Começar Hábito Focado'}
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
        label="Loja"
      />
      <NavItem to="profile" icon={(cor) => <Feather name="user" size={24} color={cor} />} label="Perfil" />
    </NavContainer>
  );
};

export default BottomNav;
