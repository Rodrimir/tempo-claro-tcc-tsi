import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ScrollView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { createHabit, updateHabit } from '../../services/api';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
import { useToast } from '../../contexts/ToastContext';
import {
  Container,
  Header,
  BackButton,
  HeaderText,
  Title,
  Subtitle,
  StepContainer,
  StepTitle,
  MoldeScrollContentContainer,
  MoldeCard,
  MoldeEmoji,
  MoldeTitle,
  MoldeDesc,
  NextButton,
  NextButtonText,
  OptionsContainer,
  OptionCard,
  StaticOptionCard,
  OptionIconWrapper,
  OptionText,
  OptionTitle,
  OptionSubtitle,
  FormSection,
  FormCard,
  FormGroup,
  Label,
  Input,
  ErrorText,
  GridRow,
  GridCell,
  WeekDaysContainer,
  DayButton,
  DayButtonText,
  OcorrenciaRow,
  OcorrenciaAlvo,
  ReviewCard,
  ReviewText,
  ReviewStrong,
  SubmitButton,
  SubmitButtonText,
} from './styles';

const MOLDES = [
  { id: 'AGUA', emoji: '💧', titulo: 'Gotinha', desc: 'Mantenha-se hidratado e evolua sua gotinha.' },
  { id: 'ESTUDO', emoji: '📚', titulo: 'Livrinho', desc: 'Foco total nos estudos para evoluir seu livro.' },
  { id: 'EXERCICIO', emoji: '🏋️', titulo: 'Homenzinho', desc: 'Construa disciplina física e evolua seu avatar.' },
];

const DIAS_SEMANA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

const TOTAL_STEPS = 4;
const NOME_MAX_LENGTH = 60;

function horaCurta(valor) {
  return valor ? String(valor).slice(0, 5) : '';
}

function diasDaMascara(mascara) {
  if (!mascara) return [1, 2, 3, 4, 5];
  return [...mascara].reduce((acc, c, i) => (c === '1' ? [...acc, i] : acc), []);
}

function formDataInicial(editHabit, moldeInicial) {
  if (!editHabit) {
    return {
      titulo: moldeInicial.titulo,
      gatilho_ancora: '',
      meta_base: '',
      incremento: '',
      dias_incremento: '10',
      meta_maxima: '',
      frequencia_semanal: [1, 2, 3, 4, 5],
      vezes_dia: '1',
      horario: '',
      ocorrencias: [{ horario_inicio: '', horario_fim: '' }],
    };
  }
  const vezesDia = editHabit.meta_frequencia_diaria || 1;
  return {
    titulo: editHabit.titulo || moldeInicial.titulo,
    gatilho_ancora: editHabit.gatilho_ancora || '',
    meta_base: editHabit.meta_base != null ? String(editHabit.meta_base) : '',
    incremento: editHabit.incremento != null ? String(editHabit.incremento) : '',
    dias_incremento: editHabit.dias_incremento != null ? String(editHabit.dias_incremento) : '10',
    meta_maxima: editHabit.meta_maxima != null ? String(editHabit.meta_maxima) : '',
    frequencia_semanal: diasDaMascara(editHabit.frequencia_semanal),
    vezes_dia: String(vezesDia),
    horario: vezesDia <= 1 ? horaCurta(editHabit.horario_ocorrencia_atual) : '',
    ocorrencias:
      vezesDia > 1 && editHabit.ocorrencias?.length
        ? editHabit.ocorrencias.map((o) => ({
            horario_inicio: horaCurta(o.horario_inicio),
            horario_fim: horaCurta(o.horario_fim),
          }))
        : Array.from({ length: Math.max(1, vezesDia) }, () => ({ horario_inicio: '', horario_fim: '' })),
  };
}

const CreateHabit = () => {
  const router = useRouter();
  const theme = useTheme();
  const { modo } = useLocalSearchParams();
  const { currentHabit } = useCurrentHabit();
  const { addToast } = useToast();

  const [editHabit] = useState(() => (modo === 'editar' ? currentHabit : null));
  const isEditMode = Boolean(editHabit);
  const moldeInicial = isEditMode ? MOLDES.find((m) => m.id === editHabit.categoria) || MOLDES[0] : MOLDES[0];

  const [step, setStep] = useState(isEditMode ? 3 : 1);
  const [molde, setMolde] = useState(moldeInicial);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState(() => formDataInicial(editHabit, moldeInicial));

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleSelecionarMolde = (m) => {
    setMolde(m);
    setFormData((prev) => ({ ...prev, titulo: m.titulo }));
  };

  const atualizarCampo = (campo, valor) => {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
    setErrors((prev) => {
      if (!prev[campo]) return prev;
      const { [campo]: _removido, ...resto } = prev;
      return resto;
    });
  };

  const atualizarVezesDia = (valor) => {
    const n = Math.max(1, Math.min(12, Number(valor) || 1));
    setFormData((prev) => {
      const ocorrenciasAtuais = prev.ocorrencias || [];
      const novasOcorrencias = Array.from({ length: n }, (_, i) => ocorrenciasAtuais[i] || { horario_inicio: '', horario_fim: '' });
      return { ...prev, vezes_dia: valor, ocorrencias: novasOcorrencias };
    });
    setErrors((prev) => {
      const resto = {};
      for (const [chave, msg] of Object.entries(prev)) {
        if (chave !== 'vezes_dia' && !chave.startsWith('ocorrencia_')) resto[chave] = msg;
      }
      return resto;
    });
  };

  const atualizarOcorrencia = (indice, campo, valor) => {
    setFormData((prev) => {
      const novasOcorrencias = [...prev.ocorrencias];
      novasOcorrencias[indice] = { ...novasOcorrencias[indice], [campo]: valor };
      return { ...prev, ocorrencias: novasOcorrencias };
    });
    const chaveErro = `ocorrencia_${indice}`;
    setErrors((prev) => {
      if (!prev[chaveErro]) return prev;
      const { [chaveErro]: _removido, ...resto } = prev;
      return resto;
    });
  };

  const calcularAlvos = (metaBase, vezes) => {
    const meta = Number(metaBase) || 0;
    const n = Math.max(1, Number(vezes) || 1);
    const base = Math.floor(meta / n);
    const resto = meta % n;
    return Array.from({ length: n }, (_, i) => base + (i === n - 1 ? resto : 0));
  };

  const toggleDia = (index) => {
    setFormData((prev) => {
      const freq = prev.frequencia_semanal.includes(index)
        ? prev.frequencia_semanal.filter((d) => d !== index)
        : [...prev.frequencia_semanal, index].sort();
      return { ...prev, frequencia_semanal: freq };
    });
    setErrors((prev) => {
      if (!prev.frequencia_semanal) return prev;
      const { frequencia_semanal: _removido, ...resto } = prev;
      return resto;
    });
  };

  const unidadeMeta = molde.id === 'AGUA' ? 'ml' : 'min';

  const validarFormulario = () => {
    const erros = {};

    if (!formData.titulo.trim()) {
      erros.titulo = 'Dê um nome para o hábito.';
    } else if (formData.titulo.length > NOME_MAX_LENGTH) {
      erros.titulo = `O nome pode ter no máximo ${NOME_MAX_LENGTH} caracteres.`;
    }

    const metaBaseNum = formData.meta_base === '' ? NaN : Number(formData.meta_base);
    if (formData.meta_base === '' || !Number.isFinite(metaBaseNum) || metaBaseNum < 1) {
      erros.meta_base = 'Informe uma meta válida (número maior ou igual a 1).';
    }

    const vezesDiaNum = formData.vezes_dia === '' ? NaN : Number(formData.vezes_dia);
    if (formData.vezes_dia === '' || !Number.isFinite(vezesDiaNum) || vezesDiaNum < 1 || vezesDiaNum > 12) {
      erros.vezes_dia = 'Informe quantas vezes ao dia (entre 1 e 12).';
    }

    if (formData.frequencia_semanal.length === 0) {
      erros.frequencia_semanal = 'Selecione ao menos um dia da semana.';
    }

    if (vezesDiaNum > 1) {
      formData.ocorrencias.forEach((ocorrencia, i) => {
        if (!ocorrencia.horario_inicio) {
          erros[`ocorrencia_${i}`] = `Informe o horário de início da ocorrência ${i + 1}.`;
        }
      });
    }

    if (formData.meta_maxima !== '') {
      const metaMaximaNum = Number(formData.meta_maxima);
      if (Number.isFinite(metaBaseNum) && metaMaximaNum < metaBaseNum) {
        erros.meta_maxima = 'A meta máxima não pode ser menor que a meta base.';
      }
    }

    return erros;
  };

  const handleRevisar = () => {
    const erros = validarFormulario();
    setErrors(erros);
    if (Object.keys(erros).length === 0) {
      handleNext();
    } else {
      addToast('Corrija os campos destacados antes de continuar.', 'error');
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const mascaraFrequencia = Array.from({ length: 7 }, (_, i) => (formData.frequencia_semanal.includes(i) ? '1' : '0')).join('');
      const usaOcorrenciasIndividuais = Number(formData.vezes_dia) > 1;
      const payload = {
        categoria: molde.id,
        titulo: formData.titulo.trim(),
        gatilho_ancora: formData.gatilho_ancora.trim() || null,
        tipo_medida: molde.id === 'AGUA' ? 'QUANTIDADE' : 'TEMPO',
        modalidade: 'DIARIA',
        meta_base: parseInt(formData.meta_base, 10),
        incremento: parseInt(formData.incremento, 10) || 0,
        dias_incremento: parseInt(formData.dias_incremento, 10) || 10,
        meta_maxima: formData.meta_maxima !== '' ? parseInt(formData.meta_maxima, 10) : null,
        frequencia_semanal: mascaraFrequencia,
        meta_frequencia_diaria: parseInt(formData.vezes_dia, 10),
        horario_agendado: usaOcorrenciasIndividuais ? null : formData.horario,
        ocorrencias: usaOcorrenciasIndividuais
          ? formData.ocorrencias.map((o) => ({
              horario_inicio: o.horario_inicio || null,
              horario_fim: o.horario_fim || null,
            }))
          : null,
      };
      if (isEditMode) {
        await updateHabit(editHabit.id, payload);
        addToast('Hábito atualizado com sucesso!', 'success');
      } else {
        await createHabit(payload);
        addToast('Hábito criado com sucesso!', 'success');
      }
      router.replace('/home');
    } catch (err) {
      const mensagem = err.response?.data?.message || 'Erro ao salvar hábito. Tente novamente.';
      addToast(mensagem, 'error');
      setIsSubmitting(false);
    }
  };

  const diasSelecionadosTexto =
    formData.frequencia_semanal.length === 7 ? 'todos os dias' : formData.frequencia_semanal.map((i) => DIAS_SEMANA[i]).join(', ');

  return (
    <Container>
      <Header>
        {step > (isEditMode ? 3 : 1) ? (
          <BackButton onPress={handleBack} accessibilityLabel="Voltar">
            <Feather name="arrow-left" size={28} color={theme.textPrimary} />
          </BackButton>
        ) : (
          <BackButton onPress={() => router.replace('/home')} accessibilityLabel="Voltar para Home">
            <Feather name="arrow-left" size={28} color={theme.textPrimary} />
          </BackButton>
        )}
        <HeaderText>
          <Title>{isEditMode ? 'Editar Hábito' : 'Novo Hábito'}</Title>
          <Subtitle>
            Passo {isEditMode ? step - 2 : step} de {isEditMode ? TOTAL_STEPS - 2 : TOTAL_STEPS}
          </Subtitle>
        </HeaderText>
      </Header>

      {step === 1 && (
        <StepContainer>
          <StepTitle>Escolha o Avatar do Hábito</StepTitle>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={MoldeScrollContentContainer}>
            {MOLDES.map((m) => (
              <MoldeCard key={m.id} onPress={() => handleSelecionarMolde(m)} $active={molde.id === m.id}>
                <MoldeEmoji>{m.emoji}</MoldeEmoji>
                <MoldeTitle>{m.titulo}</MoldeTitle>
                <MoldeDesc>{m.desc}</MoldeDesc>
              </MoldeCard>
            ))}
          </ScrollView>
          <NextButton onPress={handleNext}>
            <NextButtonText>Continuar com {molde.titulo}</NextButtonText>
            <Feather name="chevron-right" size={20} color="white" />
          </NextButton>
        </StepContainer>
      )}

      {step === 2 && (
        <StepContainer>
          <OptionsContainer>
            <StepTitle>Como vamos configurar a meta?</StepTitle>
            <StaticOptionCard>
              <OptionIconWrapper>
                <MaterialCommunityIcons name="ruler" size={24} color={theme.primaryColor} />
              </OptionIconWrapper>
              <OptionText>
                <OptionTitle>Calibração Automática</OptionTitle>
                <OptionSubtitle>Em breve</OptionSubtitle>
              </OptionText>
            </StaticOptionCard>
            <OptionCard onPress={handleNext} $primary>
              <OptionIconWrapper>
                <Feather name="edit-3" size={24} color={theme.primaryColor} />
              </OptionIconWrapper>
              <OptionText>
                <OptionTitle>Preencher Manualmente</OptionTitle>
                <OptionSubtitle>Defina suas próprias regras</OptionSubtitle>
              </OptionText>
            </OptionCard>
          </OptionsContainer>
        </StepContainer>
      )}

      {step === 3 && (
        <StepContainer>
          <FormSection>
            <StepTitle>
              {isEditMode ? 'Editar' : 'Configuração Manual'} ({molde.titulo})
            </StepTitle>

            <FormCard>
              <FormGroup>
                <Label>Nome do hábito</Label>
                <Input
                  maxLength={NOME_MAX_LENGTH}
                  placeholder="Nome do hábito"
                  value={formData.titulo}
                  $error={Boolean(errors.titulo)}
                  onChangeText={(v) => atualizarCampo('titulo', v)}
                />
                {errors.titulo && <ErrorText>{errors.titulo}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>Gatilho (opcional)</Label>
                <Input
                  maxLength={120}
                  placeholder="Depois do café da manhã"
                  value={formData.gatilho_ancora}
                  onChangeText={(v) => atualizarCampo('gatilho_ancora', v)}
                />
              </FormGroup>
            </FormCard>

            <FormCard>
              <FormGroup>
                <Label>Meta Mínima Base (Próx. 10 dias)</Label>
                <Input
                  keyboardType="numeric"
                  placeholder={molde.id === 'AGUA' ? 'Ex: 250 (ml)' : 'Ex: 25 (min)'}
                  value={formData.meta_base}
                  $error={Boolean(errors.meta_base)}
                  onChangeText={(v) => atualizarCampo('meta_base', v)}
                />
                {errors.meta_base && <ErrorText>{errors.meta_base}</ErrorText>}
              </FormGroup>

              <GridRow>
                <GridCell>
                  <Label>Aumento a cada {formData.dias_incremento || 10} dias</Label>
                  <Input
                    keyboardType="numeric"
                    placeholder="+10"
                    value={formData.incremento}
                    onChangeText={(v) => atualizarCampo('incremento', v)}
                  />
                </GridCell>
                <GridCell>
                  <Label>Meta Máxima (Teto)</Label>
                  <Input
                    keyboardType="numeric"
                    placeholder="Sem limite"
                    value={formData.meta_maxima}
                    $error={Boolean(errors.meta_maxima)}
                    onChangeText={(v) => atualizarCampo('meta_maxima', v)}
                  />
                  {errors.meta_maxima && <ErrorText>{errors.meta_maxima}</ErrorText>}
                </GridCell>
              </GridRow>

              <FormGroup>
                <Label>A cada quantos dias de ofensiva</Label>
                <Input
                  keyboardType="numeric"
                  placeholder="10"
                  value={formData.dias_incremento}
                  onChangeText={(v) => atualizarCampo('dias_incremento', v)}
                />
              </FormGroup>
            </FormCard>

            <FormCard>
              <FormGroup>
                <Label>Frequência Semanal</Label>
                <WeekDaysContainer>
                  {DIAS_SEMANA.map((dia, index) => (
                    <DayButton key={dia} onPress={() => toggleDia(index)} $active={formData.frequencia_semanal.includes(index)}>
                      <DayButtonText $active={formData.frequencia_semanal.includes(index)}>{dia}</DayButtonText>
                    </DayButton>
                  ))}
                </WeekDaysContainer>
                {errors.frequencia_semanal && <ErrorText>{errors.frequencia_semanal}</ErrorText>}
              </FormGroup>

              <GridRow>
                <GridCell>
                  <Label>Vezes ao Dia</Label>
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
                    <Label>Hora de Execução</Label>
                    <Input
                      placeholder="23:59"
                      maxLength={5}
                      value={formData.horario}
                      $error={Boolean(errors.horario)}
                      onChangeText={(v) => atualizarCampo('horario', v)}
                    />
                    {errors.horario && <ErrorText>{errors.horario}</ErrorText>}
                  </GridCell>
                )}
              </GridRow>

              {Number(formData.vezes_dia) > 1 && (
                <FormGroup>
                  <Label>Horários por Ocorrência</Label>
                  {formData.ocorrencias.map((ocorrencia, i) => (
                    <OcorrenciaRow key={i} $primeira={i === 0}>
                      <OcorrenciaAlvo>
                        Ocorrência {i + 1} — alvo: {calcularAlvos(formData.meta_base, formData.vezes_dia)[i]} {unidadeMeta}
                      </OcorrenciaAlvo>
                      <GridRow>
                        <GridCell>
                          <Label>Início</Label>
                          <Input
                            placeholder="08:00"
                            maxLength={5}
                            value={ocorrencia.horario_inicio}
                            $error={Boolean(errors[`ocorrencia_${i}`])}
                            onChangeText={(v) => atualizarOcorrencia(i, 'horario_inicio', v)}
                          />
                        </GridCell>
                        <GridCell>
                          <Label>Fim (opcional)</Label>
                          <Input
                            placeholder="08:30"
                            maxLength={5}
                            value={ocorrencia.horario_fim}
                            onChangeText={(v) => atualizarOcorrencia(i, 'horario_fim', v)}
                          />
                        </GridCell>
                      </GridRow>
                      {errors[`ocorrencia_${i}`] && <ErrorText>{errors[`ocorrencia_${i}`]}</ErrorText>}
                    </OcorrenciaRow>
                  ))}
                </FormGroup>
              )}
            </FormCard>

            <SubmitButton onPress={handleRevisar}>
              <SubmitButtonText>Revisar Hábito</SubmitButtonText>
              <Feather name="chevron-right" size={20} color="white" />
            </SubmitButton>
          </FormSection>
        </StepContainer>
      )}

      {step === 4 && (
        <StepContainer>
          <FormSection>
            <StepTitle>Revise antes de {isEditMode ? 'salvar' : 'criar'}</StepTitle>
            <ReviewCard>
              <ReviewText>
                Você vai {isEditMode ? 'atualizar' : 'criar'} <ReviewStrong>{formData.titulo}</ReviewStrong> com meta de{' '}
                <ReviewStrong>
                  {formData.meta_base} {unidadeMeta}
                </ReviewStrong>
                , nos dias <ReviewStrong>{diasSelecionadosTexto}</ReviewStrong>, executando{' '}
                <ReviewStrong>{formData.vezes_dia}</ReviewStrong> {Number(formData.vezes_dia) > 1 ? 'vezes' : 'vez'} ao dia.
              </ReviewText>
            </ReviewCard>

            <SubmitButton onPress={handleSave} disabled={isSubmitting}>
              <SubmitButtonText disabled={isSubmitting}>
                {isSubmitting ? (isEditMode ? 'Salvando...' : 'Criando...') : isEditMode ? 'Confirmar Alterações' : 'Confirmar e Criar Hábito'}
              </SubmitButtonText>
            </SubmitButton>
          </FormSection>
        </StepContainer>
      )}
    </Container>
  );
};

export default CreateHabit;
