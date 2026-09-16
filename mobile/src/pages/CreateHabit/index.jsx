import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { avatarDe } from '../../assets/avatares';
import TimePickerField from '../../components/common/TimePickerField';
import { createHabit, updateHabit } from '../../services/api';
import { useCurrentHabit } from '../../contexts/CurrentHabitContext';
import { useToast } from '../../contexts/ToastContext';
import { useI18n } from '../../contexts/LanguageContext';
import { useSfx } from '../../contexts/SoundContext';
import {
  Container,
  Header,
  BackButton,
  HeaderText,
  Title,
  Subtitle,
  StepContainer,
  StepTitle,
  MoldeGrid,
  MoldeCard,
  MoldeEmoji,
  MoldeAvatar,
  MoldeTitle,
  MoldeDesc,
  NextButton,
  NextButtonText,
  OptionsContainer,
  OptionCard,
  OptionIconWrapper,
  OptionText,
  OptionTitle,
  OptionSubtitle,
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
  OcorrenciaAviso,
  ReviewCard,
  ReviewText,
  ReviewStrong,
  SubmitButton,
  SubmitButtonText,
} from './styles';

// RF02 fixa três moldes. O quarto card existe para a grade fechar em 2x2 e para
// deixar visível que o conjunto pode crescer — não é selecionável.
// RF02 fixa três moldes. O quarto card existe para a grade fechar em 2x2 e para
// deixar visível que o conjunto pode crescer — não é selecionável.
// Título e descrição vêm do dicionário (criar.moldes.*), não daqui.
const MOLDES = [
  { id: 'AGUA', emoji: '💧', chave: 'AGUA' },
  { id: 'ESTUDO', emoji: '📚', chave: 'ESTUDO' },
  { id: 'EXERCICIO', emoji: '🏋️', chave: 'EXERCICIO' },
  { id: null, emoji: '🔒', chave: 'RESERVADO' },
];

const TOTAL_STEPS = 4;
const NOME_MAX_LENGTH = 60;

function horaCurta(valor) {
  return valor ? String(valor).slice(0, 5) : '';
}

const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;


function umaHoraDepois(horario) {
  if (!RE_HORA.test(horario)) return '';
  const [h, m] = horario.split(':').map(Number);
  const total = (h * 60 + m + 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function diasDaMascara(mascara) {
  if (!mascara) return [1, 2, 3, 4, 5];
  return [...mascara].reduce((acc, c, i) => (c === '1' ? [...acc, i] : acc), []);
}

function formDataDaSugestao(sugestao, tituloPadrao) {
  const vezes = sugestao.meta_frequencia_diaria || 1;
  return {
    titulo: tituloPadrao,
    meta_base: String(sugestao.meta_base),
    incremento: String(sugestao.incremento ?? 0),
    dias_incremento: String(sugestao.dias_incremento ?? 10),
    meta_maxima: sugestao.meta_maxima != null ? String(sugestao.meta_maxima) : '',
    frequencia_semanal: diasDaMascara(sugestao.frequencia_semanal),
    vezes_dia: String(vezes),
    horario: vezes <= 1 ? horaCurta(sugestao.ocorrencias?.[0]?.horario_inicio) : '',
    ocorrencias:
      vezes > 1
        ? sugestao.ocorrencias.map((o) => ({ horario_inicio: horaCurta(o.horario_inicio), horario_fim: '' }))
        : [{ horario_inicio: '', horario_fim: '' }],
  };
}

function formDataInicial(editHabit, tituloPadrao) {
  if (!editHabit) {
    return {
      titulo: tituloPadrao,
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
    titulo: editHabit.titulo || tituloPadrao,
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
  const insets = useSafeAreaInsets();
  const { modo, categoria: categoriaParam, sugestao: sugestaoParam } = useLocalSearchParams();

  // A calibração devolve a sugestão por parâmetro de rota. Ela pré-preenche o
  // formulário do passo 3, que continua inteiramente editável — aceitar a sugestão
  // não é um caminho separado, é o mesmo formulário já respondido.
  const sugestao = useMemo(() => {
    if (!sugestaoParam) return null;
    try {
      return JSON.parse(sugestaoParam);
    } catch {
      return null;
    }
  }, [sugestaoParam]);
  const { currentHabit } = useCurrentHabit();
  const { addToast } = useToast();
  const { t } = useI18n();
  const { tocar } = useSfx();

  const currentHabitRef = useRef(currentHabit);
  useEffect(() => {
    currentHabitRef.current = currentHabit;
  }, [currentHabit]);

  const alvoInicial = modo === 'editar' ? currentHabit : null;
  const moldeDe = (alvo) => (alvo ? MOLDES.find((m) => m.id === alvo.categoria) || MOLDES[0] : MOLDES[0]);

  // Molde pode vir da calibração ou da volta dela ("prefiro preencher na mão").
  const moldeDeParam = categoriaParam ? MOLDES.find((m) => m.id === categoriaParam) : null;
  const moldeDePartida = moldeDeParam || moldeDe(alvoInicial);

  const [editHabit, setEditHabit] = useState(alvoInicial);
  // Com sugestão ou vindo da calibração, o molde já está escolhido: pula direto
  // para o formulário, sem repetir passos que a pessoa acabou de responder.
  const [step, setStep] = useState(alvoInicial || sugestao ? 3 : moldeDeParam ? 3 : 1);
  const [molde, setMolde] = useState(moldeDePartida);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const tituloPadraoDoMolde = t(`criar.moldes.${moldeDePartida.chave}.titulo`);
  const [formData, setFormData] = useState(() =>
    sugestao
      ? formDataDaSugestao(sugestao, tituloPadraoDoMolde)
      : formDataInicial(alvoInicial, tituloPadraoDoMolde)
  );

  const isEditMode = Boolean(editHabit);

  // Este efeito existe para zerar o formulário quando a pessoa volta para a aba
  // "Criar" depois de já ter mexido nela — sem isso, o rascunho antigo
  // reapareceria.
  //
  // Mas ele NÃO pode rodar quando a tela foi aberta pela calibração: o estado
  // inicial já nasce no passo 3 com a sugestão preenchida, e resetar aqui
  // jogava a pessoa de volta ao passo 1 com o formulário vazio — era por isso
  // que "Usar esta sugestão" não criava hábito nenhum: a sugestão era
  // descartada no mesmo instante em que a tela ganhava foco.
  useFocusEffect(
    useCallback(() => {
      if (sugestaoParam || categoriaParam) return;
      const alvo = modo === 'editar' ? currentHabitRef.current : null;
      const moldeAlvo = moldeDe(alvo);
      setEditHabit(alvo);
      setMolde(moldeAlvo);
      setStep(alvo ? 3 : 1);
      setFormData(formDataInicial(alvo, moldeAlvo));
      setErrors({});
      setIsSubmitting(false);
    }, [modo, sugestaoParam, categoriaParam])
  );

  const handleNext = () => {
    tocar('continuar');
    setStep((prev) => prev + 1);
  };
  const handleBack = () => {
    tocar('voltar');
    setStep((prev) => prev - 1);
  };

  // Cada molde tem o seu próprio timbre, escolhido pelo tema: vidro para água,
  // corda dedilhada para estudo, mecânico para exercício. O molde reservado
  // (ainda bloqueado) responde com o som de recusa, para o toque não parecer
  // que funcionou.
  const SOM_DO_MOLDE = {
    AGUA: 'moldeAgua',
    ESTUDO: 'moldeEstudo',
    EXERCICIO: 'moldeExercicio',
  };

  const handleSelecionarMolde = (m) => {
    tocar(SOM_DO_MOLDE[m.id] || 'tap');
    setMolde(m);
    setFormData((prev) => ({ ...prev, titulo: t(`criar.moldes.${m.chave}.titulo`) }));
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
      erros.titulo = t('criar.erroNome');
    } else if (formData.titulo.length > NOME_MAX_LENGTH) {
      erros.titulo = t('criar.erroNomeMaximo', { max: NOME_MAX_LENGTH });
    }

    const metaBaseNum = formData.meta_base === '' ? NaN : Number(formData.meta_base);
    if (formData.meta_base === '' || !Number.isFinite(metaBaseNum) || metaBaseNum < 1) {
      erros.meta_base = t('criar.erroMeta');
    }

    const vezesDiaNum = formData.vezes_dia === '' ? NaN : Number(formData.vezes_dia);
    if (formData.vezes_dia === '' || !Number.isFinite(vezesDiaNum) || vezesDiaNum < 1 || vezesDiaNum > 12) {
      erros.vezes_dia = t('criar.erroVezes');
    }

    if (formData.frequencia_semanal.length === 0) {
      erros.frequencia_semanal = t('criar.erroDia');
    }

    if (vezesDiaNum <= 1 && formData.horario && !RE_HORA.test(formData.horario)) {
      erros.horario = t('criar.erroHora');
    }

    if (vezesDiaNum > 1) {
      formData.ocorrencias.forEach((ocorrencia, i) => {
        if (!ocorrencia.horario_inicio) {
          erros[`ocorrencia_${i}`] = t('criar.erroInicioOcorrencia', { n: i + 1 });
        } else if (!RE_HORA.test(ocorrencia.horario_inicio)) {
          erros[`ocorrencia_${i}`] = t('criar.erroHora');
        } else if (ocorrencia.horario_fim && !RE_HORA.test(ocorrencia.horario_fim)) {
          erros[`ocorrencia_${i}`] = t('criar.erroHora');
        }
      });
    }

    if (formData.meta_maxima !== '') {
      const metaMaximaNum = Number(formData.meta_maxima);
      if (Number.isFinite(metaBaseNum) && metaMaximaNum < metaBaseNum) {
        erros.meta_maxima = t('criar.erroTeto');
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
      tocar('erro');
      addToast(t('criar.corrijaCampos'), 'error');
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
        gatilho_ancora: null,
        tipo_medida: molde.id === 'AGUA' ? 'QUANTIDADE' : 'TEMPO',
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
              horario_fim: molde.id === 'AGUA' ? umaHoraDepois(o.horario_inicio) || null : o.horario_fim || null,
            }))
          : null,
        // Presente só quando o hábito nasceu de uma sugestão aceita: marca a
        // calibração como aceita e a vincula ao hábito (RF20).
        calibracao_id: sugestao?.calibracao_id ?? null,
      };
      if (isEditMode) {
        await updateHabit(editHabit.id, payload);
        addToast(t('criar.atualizadoOk'), 'success');
      } else {
        await createHabit(payload);
        addToast(t('criar.criadoOk'), 'success');
      }
      tocar('success');
      router.replace('/home');
    } catch (err) {
      const mensagem = err.response?.data?.message || t('criar.erroSalvar');
      tocar('erro');
      addToast(mensagem, 'error');
      setIsSubmitting(false);
    }
  };

  const nomesDiasSemana = t('diasSemanaMedio');
  const diasSelecionadosTexto =
    formData.frequencia_semanal.length === 7
      ? t('criar.todosOsDias')
      : formData.frequencia_semanal.map((i) => nomesDiasSemana[i]).join(', ');

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100}
    >
    <Container $insetTop={insets.top}>
      <Header>
        {step > (isEditMode ? 3 : 1) ? (
          <BackButton onPress={handleBack} accessibilityLabel={t('comum.voltar')}>
            <Feather name="arrow-left" size={28} color={theme.textPrimary} />
          </BackButton>
        ) : (
          <BackButton
            onPress={() => {
              tocar('voltar');
              router.replace('/home');
            }}
            accessibilityLabel={t('criar.voltarParaHome')}
          >
            <Feather name="arrow-left" size={28} color={theme.textPrimary} />
          </BackButton>
        )}
        <HeaderText>
          <Title>{isEditMode ? t('criar.editarHabito') : t('criar.novoHabito')}</Title>
          <Subtitle>
            {t('criar.passoDe', { atual: isEditMode ? step - 2 : step, total: isEditMode ? TOTAL_STEPS - 2 : TOTAL_STEPS })}
          </Subtitle>
        </HeaderText>
      </Header>

      {step === 1 && (
        <StepContainer>
          <StepTitle>{t('criar.escolhaMolde')}</StepTitle>
          <MoldeGrid>
            {MOLDES.map((m) => (
              <MoldeCard
                key={m.id ?? 'reservado'}
                onPress={() => (m.id ? handleSelecionarMolde(m) : tocar('moldeBloqueado'))}
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
          <NextButton onPress={handleNext}>
            <NextButtonText>{t('criar.continuarCom', { molde: t(`criar.moldes.${molde.chave}.titulo`) })}</NextButtonText>
            <Feather name="chevron-right" size={20} color="white" />
          </NextButton>
        </StepContainer>
      )}

      {step === 2 && (
        <StepContainer>
          <OptionsContainer>
            <StepTitle>{t('criar.comoConfigurar')}</StepTitle>
            <OptionCard
              onPress={() => {
                tocar('continuar');
                router.push({ pathname: '/calibration', params: { categoria: molde.id } });
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
            <OptionCard onPress={handleNext}>
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
      )}

      {step === 3 && (
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
                  placeholder={t("criar.nomeHabito")}
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
                  placeholder={molde.id === 'AGUA' ? t('criar.exMl') : t('criar.exMin')}
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
                  placeholder={t("criar.semLimite")}
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
                        {molde.id !== 'AGUA' && (
                          <GridCell>
                            <Label>{t('criar.fimOpcional')}</Label>
                            <TimePickerField
                              value={ocorrencia.horario_fim}
                              onChange={(v) => atualizarOcorrencia(i, 'horario_fim', v)}
                              limpavel
                              accessibilityLabel={t('criar.fimOpcional')}
                            />
                          </GridCell>
                        )}
                      </GridRow>
                      {molde.id === 'AGUA' && <OcorrenciaAviso>{t('criar.aguaPrazoAutomatico')}</OcorrenciaAviso>}
                      {errors[`ocorrencia_${i}`] && <ErrorText>{errors[`ocorrencia_${i}`]}</ErrorText>}
                    </OcorrenciaRow>
                  ))}
                </FormGroup>
              )}
            </FormCard>

            <SubmitButton onPress={handleRevisar}>
              <SubmitButtonText>{t('criar.revisarHabito')}</SubmitButtonText>
              <Feather name="chevron-right" size={20} color="white" />
            </SubmitButton>
          </FormSection>
        </StepContainer>
      )}

      {step === 4 && (
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

            <SubmitButton onPress={handleSave} disabled={isSubmitting}>
              <SubmitButtonText disabled={isSubmitting}>
                {isSubmitting ? (isEditMode ? t('criar.salvando') : t('criar.criando')) : isEditMode ? t('criar.confirmarAlteracoes') : t('criar.confirmarCriar')}
              </SubmitButtonText>
            </SubmitButton>
          </FormSection>
        </StepContainer>
      )}
    </Container>
    </KeyboardAvoidingView>
  );
};

export default CreateHabit;
