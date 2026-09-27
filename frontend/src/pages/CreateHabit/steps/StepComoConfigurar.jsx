import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { StepContainer, OptionsContainer, StepTitle, OptionCard, OptionIconWrapper, OptionText, OptionTitle, OptionSubtitle } from '@/pages/CreateHabit/styles';

export function StepComoConfigurar({ theme, t, tocar, onCalibrar, onNext }) {
  return (
    <StepContainer>
      <OptionsContainer>
        <StepTitle>{t('criar.comoConfigurar')}</StepTitle>
        <OptionCard
          onPress={() => {
            tocar('continuar');
            onCalibrar();
          }}
          $primary
        >
          <OptionIconWrapper>
            <MaterialCommunityIcons name="ruler" size={24} color={theme.primaryColor} />
          </OptionIconWrapper>
          <OptionText>
            <OptionTitle>{t('criar.calibrar')}</OptionTitle>
            <OptionSubtitle>{t('criar.calibrarSub')}</OptionSubtitle>
          </OptionText>
        </OptionCard>
        <OptionCard onPress={onNext}>
          <OptionIconWrapper>
            <Feather name="edit-3" size={24} color={theme.primaryColor} />
          </OptionIconWrapper>
          <OptionText>
            <OptionTitle>{t('criar.manual')}</OptionTitle>
            <OptionSubtitle>{t('criar.manualSub')}</OptionSubtitle>
          </OptionText>
        </OptionCard>
      </OptionsContainer>
    </StepContainer>
  );
}
