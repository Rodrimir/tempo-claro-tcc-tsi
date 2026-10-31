import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated from 'react-native-reanimated';
import { useTheme } from 'styled-components/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCurrentHabit } from '@/contexts/CurrentHabitContext';
import { useToast } from '@/contexts/ToastContext';
import { useSfx } from '@/contexts/SoundContext';
import { useI18n } from '@/contexts/LanguageContext';
import { usePulse } from '@/hooks/useFloat';
import { useAlvoDoGuia, useOnboarding } from '@/onboarding/OnboardingContext';
import { ALVOS } from '@/onboarding/passos';
import { ESTADOS_DO_BOTAO, estadoDoBotaoCentral } from './estado';
import { NavContainer, PlayButtonWrapper, PlayButton, PlayLabel, NavItemContainer, NavLabel } from './styles';

const INTERVALO_RELOGIO_MS = 30000;

function NavItem({ isActive, icon, label, theme, onPress, alvo }) {
  const alvoDoGuia = useAlvoDoGuia(alvo);
  return (
    <View {...alvoDoGuia}>
      <NavItemContainer
        onPress={onPress}
        accessibilityRole="tab"
        accessibilityLabel={label}
        accessibilityState={{ selected: isActive }}
      >
        {icon(isActive ? theme.primaryColor : theme.textSecondary)}
        <NavLabel $active={isActive}>{label}</NavLabel>
      </NavItemContainer>
    </View>
  );
}

const ICONE = {
  [ESTADOS_DO_BOTAO.CRIAR]: 'plus',
  [ESTADOS_DO_BOTAO.COMECAR]: 'play',
  [ESTADOS_DO_BOTAO.AGUARDANDO]: 'clock',
  [ESTADOS_DO_BOTAO.FEITO]: 'check',
};

const BottomNav = ({ state, navigation }) => {
  const { t } = useI18n();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { currentHabit: activeHabit } = useCurrentHabit();
  const { addToast } = useToast();
  const { tocar } = useSfx();
  const { emTour } = useOnboarding();
  const pulso = usePulse();
  const alvoCentral = useAlvoDoGuia(ALVOS.CENTRAL);
  const [agora, setAgora] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), INTERVALO_RELOGIO_MS);
    return () => clearInterval(id);
  }, []);

  const estado = estadoDoBotaoCentral(activeHabit, agora);
  const nomeRotaAtiva = state.routes[state.index].name;
  const titulo = activeHabit?.titulo ?? '';

  const rotulo = {
    [ESTADOS_DO_BOTAO.CRIAR]: t('nav2.criar'),
    [ESTADOS_DO_BOTAO.COMECAR]: t('nav2.comecar'),
    [ESTADOS_DO_BOTAO.AGUARDANDO]: estado.hora,
    [ESTADOS_DO_BOTAO.FEITO]: t('nav2.feito'),
  }[estado.tipo];

  const descricao = {
    [ESTADOS_DO_BOTAO.CRIAR]: t('nav2.criarDescricao'),
    [ESTADOS_DO_BOTAO.COMECAR]: t('nav2.comecarDescricao', { titulo }),
    [ESTADOS_DO_BOTAO.AGUARDANDO]: t('nav2.aguardandoDescricao', { titulo, hora: estado.hora }),
    [ESTADOS_DO_BOTAO.FEITO]: t('nav2.feitoDescricao', { titulo }),
  }[estado.tipo];

  const corDoBotao = {
    [ESTADOS_DO_BOTAO.CRIAR]: theme.primaryStrong,
    [ESTADOS_DO_BOTAO.COMECAR]: theme.primaryStrong,
    [ESTADOS_DO_BOTAO.AGUARDANDO]: theme.textSecondary,
    [ESTADOS_DO_BOTAO.FEITO]: theme.successStrong,
  }[estado.tipo];

  const handlePlay = () => {
    tocar('tap');
    switch (estado.tipo) {
      case ESTADOS_DO_BOTAO.CRIAR:
        router.push({ pathname: '/create', params: { modo: 'criar' } });
        return;
      case ESTADOS_DO_BOTAO.FEITO:
        addToast(t('nav2.jaConcluida'), 'success');
        return;
      case ESTADOS_DO_BOTAO.AGUARDANDO:
        addToast(t('home.programadaPara', { hora: estado.hora }), 'default');
        return;
      default:
        router.push('/pretask');
    }
  };

  const irPara = (to) => {
    tocar('tap');
    navigation.navigate(to);
  };

  return (
    <NavContainer style={{ paddingBottom: insets.bottom + 12 }} accessibilityRole="tablist">
      <NavItem
        alvo={ALVOS.INICIO}
        isActive={nomeRotaAtiva === 'home'}
        onPress={() => irPara('home')}
        icon={(cor) => <Feather name="target" size={24} color={cor} />}
        label={t('nav.inicio')}
        theme={theme}
      />
      <NavItem
        alvo={ALVOS.DADOS}
        isActive={nomeRotaAtiva === 'stats'}
        onPress={() => irPara('stats')}
        icon={(cor) => <Feather name="bar-chart-2" size={24} color={cor} />}
        label={t('nav.stats')}
        theme={theme}
      />

      <PlayButtonWrapper {...alvoCentral}>
        <Animated.View style={estado.tipo === ESTADOS_DO_BOTAO.COMECAR && !emTour ? pulso : undefined}>
          <PlayButton
            accessibilityRole="button"
            accessibilityLabel={descricao}
            accessibilityState={{ disabled: estado.tipo === ESTADOS_DO_BOTAO.FEITO }}
            style={{ backgroundColor: corDoBotao }}
            onPress={handlePlay}
          >
            <Feather
              name={ICONE[estado.tipo]}
              size={estado.tipo === ESTADOS_DO_BOTAO.COMECAR ? 28 : 26}
              color="white"
              style={estado.tipo === ESTADOS_DO_BOTAO.COMECAR ? { marginLeft: 4 } : undefined}
            />
          </PlayButton>
        </Animated.View>
        <PlayLabel numberOfLines={1} style={{ color: corDoBotao }}>
          {rotulo}
        </PlayLabel>
      </PlayButtonWrapper>

      <NavItem
        alvo={ALVOS.LOJA}
        isActive={nomeRotaAtiva === 'store'}
        onPress={() => irPara('store')}
        icon={(cor) => <MaterialCommunityIcons name="store" size={24} color={cor} />}
        label={t('nav.loja')}
        theme={theme}
      />
      <NavItem
        alvo={ALVOS.PERFIL}
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
