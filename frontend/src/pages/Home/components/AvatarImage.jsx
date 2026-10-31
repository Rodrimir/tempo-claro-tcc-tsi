import { Image } from 'expo-image';
import { useFloat } from '@/hooks/useFloat';
import { avatarDe } from '@/assets/avatares';
import { AvatarWrapper } from '@/pages/Home/styles';

export function AvatarImage({ habit, expression }) {
  const flutuando = useFloat(3000, 8);

  return (
    <AvatarWrapper style={flutuando}>
      <Image
        source={avatarDe(habit.categoria, expression, habit.nivel_avatar)}
        contentFit="contain"
        style={{ width: '100%', height: '100%' }}
        transition={200}
      />
    </AvatarWrapper>
  );
}
