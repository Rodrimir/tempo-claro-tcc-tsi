import { Feather } from '@expo/vector-icons';
import TimePickerField from '@/components/common/TimePickerField';
import { calcularAlvos } from '@/pages/CreateHabit/formModel';
import { NOME_MAX_LENGTH } from '@/model/Habito';
import { Categoria } from '@/model/Categoria';
import {
  StepContainer,
  StepTitle,
  FormSection,
  FormCard,
  FormGroup,
  Label,
  FieldHint,
  Input,
  ErrorText,
  GridRow,
  GridCell,
  WeekDaysContainer,
  DayButton,
  DayButtonText,
  OcorrenciaRow,
  OcorrenciaAlvo,
  SubmitButton,
  SubmitButtonText,
} from '@/pages/CreateHabit/styles';

export function StepFormulario({
  t,
  isEditMode,
  molde,
  formData,
  errors,
  nomesDiasSemana,
  unidadeMeta,
  atualizarCampo,
  atualizarVezesDia,
  atualizarOcorrencia,
  toggleDia,
  onRevisar,
}) {
  return (
    <StepContainer>
      <FormSection>
        <StepTitle>
          {isEditMode ? t('comum.editar') : t('criar.configManual')} ({t(`criar.moldes.${molde.chave}.titulo`)})
        </StepTitle>

        <FormCard>
          <FormGroup>
            <Label>{t('criar.nomeHabito')}</Label>
            <Input
              maxLength={NOME_MAX_LENGTH}
              placeholder={t('criar.nomeHabito')}
              value={formData.titulo}
              $error={Boolean(errors.titulo)}
              onChangeText={(v) => atualizarCampo('titulo', v)}
            />
            {errors.titulo && <ErrorText>{errors.titulo}</ErrorText>}
          </FormGroup>
        </FormCard>

        <FormCard>
          <FormGroup>
            <Label>{t('criar.metaMinima')}</Label>
            <Input
              keyboardType="numeric"
              placeholder={molde.id === Categoria.AGUA ? t('criar.exMl') : t('criar.exMin')}
              value={formData.meta_base}
              $error={Boolean(errors.meta_base)}
              onChangeText={(v) => atualizarCampo('meta_base', v)}
            />
            {errors.meta_base && <ErrorText>{errors.meta_base}</ErrorText>}
          </FormGroup>

          <FormGroup>
            <Label>{t('criar.aCadaQuantosDias')}</Label>
            <Input
              keyboardType="numeric"
              placeholder="10"
              value={formData.dias_incremento}
              onChangeText={(v) => atualizarCampo('dias_incremento', v)}
            />
            <FieldHint>{t('criar.aCadaQuantosDiasAjuda')}</FieldHint>
          </FormGroup>

          <FormGroup>
            <Label>{t('criar.aumentoACada', { dias: formData.dias_incremento || 10 })}</Label>
            <Input
              keyboardType="numeric"
              placeholder="+10"
              value={formData.incremento}
              onChangeText={(v) => atualizarCampo('incremento', v)}
            />
            <FieldHint>{t('criar.aumentoACadaAjuda', { unidade: unidadeMeta })}</FieldHint>
          </FormGroup>

          <FormGroup>
            <Label>{t('criar.metaMaximaTeto')}</Label>
            <Input
              keyboardType="numeric"
              placeholder={t('criar.semLimite')}
              value={formData.meta_maxima}
              $error={Boolean(errors.meta_maxima)}
              onChangeText={(v) => atualizarCampo('meta_maxima', v)}
            />
            {errors.meta_maxima && <ErrorText>{errors.meta_maxima}</ErrorText>}
            <FieldHint>{t('criar.metaMaximaAjuda')}</FieldHint>
          </FormGroup>
        </FormCard>

        <FormCard>
          <FormGroup>
            <Label>{t('criar.frequenciaSemanal')}</Label>
            <WeekDaysContainer>
              {nomesDiasSemana.map((dia, index) => (
                <DayButton key={dia} onPress={() => toggleDia(index)} $active={formData.frequencia_semanal.includes(index)}>
                  <DayButtonText $active={formData.frequencia_semanal.includes(index)}>{dia}</DayButtonText>
                </DayButton>
              ))}
            </WeekDaysContainer>
            {errors.frequencia_semanal && <ErrorText>{errors.frequencia_semanal}</ErrorText>}
          </FormGroup>

          <GridRow>
            <GridCell>
              <Label>{t('criar.vezesAoDia')}</Label>
              <Input
                keyboardType="numeric"
                value={formData.vezes_dia}
                $error={Boolean(errors.vezes_dia)}
                onChangeText={atualizarVezesDia}
              />
              {errors.vezes_dia && <ErrorText>{errors.vezes_dia}</ErrorText>}
            </GridCell>
            {Number(formData.vezes_dia) <= 1 && (
              <GridCell>
                <Label>{t('criar.horaExecucao')}</Label>
                <TimePickerField
                  value={formData.horario}
                  onChange={(v) => atualizarCampo('horario', v)}
                  error={Boolean(errors.horario)}
                  limpavel
                  accessibilityLabel={t('criar.horaExecucao')}
                />
                {errors.horario && <ErrorText>{errors.horario}</ErrorText>}
              </GridCell>
            )}
          </GridRow>

          {Number(formData.vezes_dia) > 1 && (
            <FormGroup>
              <Label>{t('criar.horariosOcorrencia')}</Label>
              {formData.ocorrencias.map((ocorrencia, i) => (
                <OcorrenciaRow key={i} $primeira={i === 0}>
                  <OcorrenciaAlvo>
                    {t('criar.ocorrenciaAlvo', {
                      n: i + 1,
                      alvo: calcularAlvos(formData.meta_base, formData.vezes_dia)[i],
                      unidade: unidadeMeta,
                    })}
                  </OcorrenciaAlvo>
                  <GridRow>
                    <GridCell>
                      <Label>{t('criar.inicio')}</Label>
                      <TimePickerField
                        value={ocorrencia.horario_inicio}
                        onChange={(v) => atualizarOcorrencia(i, 'horario_inicio', v)}
                        error={Boolean(errors[`ocorrencia_${i}`])}
                        accessibilityLabel={t('criar.inicio')}
                      />
                    </GridCell>
                    <GridCell>
                      <Label>{t('criar.fimOpcional')}</Label>
                      <TimePickerField
                        value={ocorrencia.horario_fim}
                        onChange={(v) => atualizarOcorrencia(i, 'horario_fim', v)}
                        limpavel
                        accessibilityLabel={t('criar.fimOpcional')}
                      />
                    </GridCell>
                  </GridRow>
                  {errors[`ocorrencia_${i}`] && <ErrorText>{errors[`ocorrencia_${i}`]}</ErrorText>}
                </OcorrenciaRow>
              ))}
            </FormGroup>
          )}
        </FormCard>

        <SubmitButton onPress={onRevisar}>
          <SubmitButtonText>{t('criar.revisarHabito')}</SubmitButtonText>
          <Feather name="chevron-right" size={20} color="white" />
        </SubmitButton>
      </FormSection>
    </StepContainer>
  );
}
