import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useFloat } from '@/hooks/useFloat';
import { useI18n } from '@/contexts/LanguageContext';
import solFlutuando from '@/assets/sol_flutuando.webp';
import luaFlutuando from '@/assets/lua_flutuando.png';
import { HabitSlide, SlideInner, SunWrapper, EmptyTextCard, EmptyTitle, EmptySubtitle, CreateHabitButton } from '@/pages/Home/styles';

export function CriarHabitoSlide({ width, isDark, onPress }) {
  const { t } = useI18n();
  const flutuando = useFloat(4000, 8);
  return (
    <HabitSlide $width={width}>
      <SlideInner>
        <SunWrapper style={flutuando}>
          <Image source={isDark ? luaFlutuando : solFlutuando} contentFit="contain" style={{ width: '100%', height: '100%' }} />
        </SunWrapper>
        <EmptyTextCard>
          <EmptyTitle>{t('home.novoHabitoTitulo')}</EmptyTitle>
          <EmptySubtitle>{t('home.novoHabitoSub')}</EmptySubtitle>
        </EmptyTextCard>
        <CreateHabitButton onPress={onPress} style={{ marginTop: 24 }}>
          <Feather name="play" size={32} color="white" style={{ transform: [{ rotate: '90deg' }] }} />
        </CreateHabitButton>
      </SlideInner>
    </HabitSlide>
  );
}
