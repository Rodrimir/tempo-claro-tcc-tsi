import { StepContainer, FormSection, StepTitle, ReviewCard, ReviewText, ReviewStrong, SubmitButton, SubmitButtonText } from '@/pages/CreateHabit/styles';

export function StepRevisao({ t, isEditMode, formData, unidadeMeta, diasSelecionadosTexto, isSubmitting, onSave }) {
  return (
    <StepContainer>
      <FormSection>
        <StepTitle>{isEditMode ? t('criar.revisarTituloEditar') : t('criar.revisarTituloCriar')}</StepTitle>
        <ReviewCard>
          <ReviewText>
            {isEditMode ? t('criar.revisarVaiAtualizar') : t('criar.revisarVaiCriar')}{' '}
            <ReviewStrong>{formData.titulo}</ReviewStrong> {t('criar.revisarComMetaDe')}{' '}
            <ReviewStrong>
              {formData.meta_base} {unidadeMeta}
            </ReviewStrong>
            , {t('criar.revisarNosDias', { dias: diasSelecionadosTexto })}, {t('criar.revisarExecutando')}{' '}
            <ReviewStrong>{formData.vezes_dia}</ReviewStrong>{' '}
            {Number(formData.vezes_dia) > 1 ? t('criar.revisarVezesAoDia') : t('criar.revisarVezAoDia')}
          </ReviewText>
        </ReviewCard>

        <SubmitButton onPress={onSave} disabled={isSubmitting}>
          <SubmitButtonText disabled={isSubmitting}>
            {isSubmitting ? (isEditMode ? t('criar.salvando') : t('criar.criando')) : isEditMode ? t('criar.confirmarAlteracoes') : t('criar.confirmarCriar')}
          </SubmitButtonText>
        </SubmitButton>
      </FormSection>
    </StepContainer>
  );
}
