import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { avatarDe } from '@/assets/avatares';
import { MOLDES } from '@/pages/CreateHabit/formModel';
import { StepContainer, StepTitle, MoldeGrid, MoldeCard, MoldeEmoji, MoldeAvatar, MoldeTitle, MoldeDesc, NextButton, NextButtonText } from '@/pages/CreateHabit/styles';

export function StepMolde({ molde, onSelecionarMolde, onMoldeBloqueado, onNext, t }) {
  return (
    <StepContainer>
      <StepTitle>{t('criar.escolhaMolde')}</StepTitle>
      <MoldeGrid>
        {MOLDES.map((m) => (
          <MoldeCard
            key={m.id ?? 'reservado'}
            onPress={() => (m.id ? onSelecionarMolde(m) : onMoldeBloqueado())}
            disabled={!m.id}
            $disabled={!m.id}
            $active={Boolean(m.id) && molde.id === m.id}
            accessibilityLabel={m.id ? t(`criar.moldes.${m.chave}.titulo`) : t('criar.moldeReservado')}
          >
            {m.id ? (
              <MoldeAvatar>
                <Image
                  source={avatarDe(m.id, 'normal', 1)}
                  contentFit="contain"
                  style={{ width: '100%', height: '100%' }}
                />
              </MoldeAvatar>
            ) : (
              <MoldeEmoji>{m.emoji}</MoldeEmoji>
            )}
            <MoldeTitle>{t(`criar.moldes.${m.chave}.titulo`)}</MoldeTitle>
            <MoldeDesc>{t(`criar.moldes.${m.chave}.desc`)}</MoldeDesc>
          </MoldeCard>
        ))}
      </MoldeGrid>
      <NextButton onPress={onNext}>
        <NextButtonText>{t('criar.continuarCom', { molde: t(`criar.moldes.${molde.chave}.titulo`) })}</NextButtonText>
        <Feather name="chevron-right" size={20} color="white" />
      </NextButton>
    </StepContainer>
  );
}
