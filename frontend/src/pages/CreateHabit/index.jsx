import { useState, useCallback, useMemo } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { createHabit, updateHabit } from '@/services/api';
import { useCurrentHabit } from '@/contexts/CurrentHabitContext';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/LanguageContext';
import { useSfx } from '@/contexts/SoundContext';
import { MOLDES, SOM_DO_MOLDE, TOTAL_STEPS, formDataDaSugestao, formDataInicial, moldeDe, mudaSoAmanha } from './formModel';
import { validarFormulario } from './validation';
import { Categoria } from '@/model/Categoria';
import { MAX_VEZES_AO_DIA } from '@/model/Habito';
import { TipoMedida } from '@/model/TipoMedida';
import { StepMolde } from './steps/StepMolde';
import { StepComoConfigurar } from './steps/StepComoConfigurar';
import { StepFormulario } from './steps/StepFormulario';
import { StepRevisao } from './steps/StepRevisao';
import { getApiErrorMessage } from '@/utils/erros';
import { Container, Header, BackButton, HeaderText, Title, Subtitle } from './styles';

const CreateHabit = () => {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { modo, categoria: categoriaParam, sugestao: sugestaoParam, guia } = useLocalSearchParams();
  const emGuia = guia === '1';

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
  const { marcarOnboardingConcluido } = useAuth();

  // A tela é empilhada a cada abertura, então o estado inicial basta para criar ou editar. A
  // calibração volta para esta mesma tela trocando os parâmetros (router.dismissTo), e o efeito
  // abaixo aplica a sugestão recebida.
  const alvoInicial = modo === 'editar' ? currentHabit : null;

  const moldeDeParam = categoriaParam ? MOLDES.find((m) => m.id === categoriaParam) : null;
  const moldeDePartida = moldeDeParam || moldeDe(alvoInicial);

  const [editHabit] = useState(alvoInicial);
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

  const [parametrosAplicados, setParametrosAplicados] = useState(`${categoriaParam}|${sugestaoParam}`);
  const chaveDosParametros = `${categoriaParam}|${sugestaoParam}`;
  if (chaveDosParametros !== parametrosAplicados) {
    setParametrosAplicados(chaveDosParametros);
    if (moldeDeParam) {
      setMolde(moldeDeParam);
      const titulo = t(`criar.moldes.${moldeDeParam.chave}.titulo`);
      setFormData(sugestao ? formDataDaSugestao(sugestao, titulo) : formDataInicial(null, titulo));
      setErrors({});
      setStep(3);
    }
  }

  const isEditMode = Boolean(editHabit);

  const sair = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }, [router]);

  const handleNext = () => {
    tocar('continuar');
    setStep((prev) => prev + 1);
  };
  const handleBack = () => {
    tocar('voltar');
    setStep((prev) => prev - 1);
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
    const n = Math.max(1, Math.min(MAX_VEZES_AO_DIA, Number(valor) || 1));
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

  const unidadeMeta = molde.id === Categoria.AGUA ? 'ml' : 'min';

  const handleRevisar = () => {
    const erros = validarFormulario(formData, t);
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
        gatilho_ancora: formData.gatilho_ancora?.trim() || null,
        tipo_medida: molde.id === Categoria.AGUA ? TipoMedida.QUANTIDADE : TipoMedida.TEMPO,
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
        calibracao_id: sugestao?.calibracao_id ?? null,
      };
      if (isEditMode) {
        await updateHabit(editHabit.id, payload);
        addToast(t(mudaSoAmanha(editHabit, payload) ? 'criar.atualizadoAmanha' : 'criar.atualizadoOk'), 'success');
      } else {
        await createHabit(payload);
        addToast(t('criar.criadoOk'), 'success');
        if (emGuia) await marcarOnboardingConcluido().catch(() => {});
      }
      tocar('success');
      router.dismissTo('/home');
    } catch (err) {
      const mensagem = getApiErrorMessage(err, t('criar.erroSalvar'));
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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Container $insetTop={insets.top}>
      <Header>
        {step > (isEditMode ? 3 : 1) ? (
          <BackButton accessibilityRole="button" onPress={handleBack} accessibilityLabel={t('comum.voltar')}>
            <Feather name="arrow-left" size={28} color={theme.textPrimary} />
          </BackButton>
        ) : (
          <BackButton
            accessibilityRole="button"
            onPress={() => {
              tocar('voltar');
              sair();
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
        <StepMolde
          molde={molde}
          onSelecionarMolde={handleSelecionarMolde}
          onMoldeBloqueado={() => tocar('moldeBloqueado')}
          onNext={handleNext}
          t={t}
        />
      )}

      {step === 2 && (
        <StepComoConfigurar
          theme={theme}
          t={t}
          tocar={tocar}
          onCalibrar={() =>
            router.push({ pathname: '/calibration', params: { categoria: molde.id, ...(emGuia ? { guia: '1' } : {}) } })
          }
          onNext={handleNext}
        />
      )}

      {step === 3 && (
        <StepFormulario
          t={t}
          isEditMode={isEditMode}
          molde={molde}
          formData={formData}
          errors={errors}
          nomesDiasSemana={nomesDiasSemana}
          unidadeMeta={unidadeMeta}
          atualizarCampo={atualizarCampo}
          atualizarVezesDia={atualizarVezesDia}
          atualizarOcorrencia={atualizarOcorrencia}
          toggleDia={toggleDia}
          onRevisar={handleRevisar}
        />
      )}

      {step === 4 && (
        <StepRevisao
          t={t}
          isEditMode={isEditMode}
          formData={formData}
          unidadeMeta={unidadeMeta}
          diasSelecionadosTexto={diasSelecionadosTexto}
          isSubmitting={isSubmitting}
          onSave={handleSave}
        />
      )}
    </Container>
    </KeyboardAvoidingView>
  );
};

export default CreateHabit;
