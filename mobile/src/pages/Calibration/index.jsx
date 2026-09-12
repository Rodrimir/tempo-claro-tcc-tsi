import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';
import { Feather } from '@expo/vector-icons';

import { getCalibrationQuestions, submitCalibration } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';
import LoadingScreen from '../../components/common/LoadingScreen';
import TimePickerField from '../../components/common/TimePickerField';
import { useI18n } from '../../contexts/LanguageContext';

import {
  Container,
  Content,
  TopBar,
  BackButton,
  ProgressTrack,
  ProgressFill,
  Pergunta,
  Ajuda,
  Opcao,
  OpcaoTexto,
  OpcaoDetalhe,
  DiasRow,
  DiaCirculo,
  DiaTexto,
  ChipsRow,
  Chip,
  ChipTexto,
  HorarioLinha,
  HorarioRotulo,
  HorarioCampo,
  PrimaryButton,
  PrimaryButtonText,
  SecondaryButton,
  SecondaryButtonText,
  SugestaoCard,
  SugestaoMeta,
  SugestaoMetaUnidade,
  SugestaoLinha,
  SugestaoRotulo,
  SugestaoValor,
  Explicacao,
} from './styles';


const RE_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Calibração assistida de metas (RF20/RNF04).
 *
 * Esta tela não conhece nenhuma pergunta por nome. O servidor devolve o catálogo
 * — enunciados, opções, rótulos e o TIPO de cada pergunta — e aqui só existe o
 * desenho dos cinco tipos possíveis. É o que permite trocar os moldes editando um
 * arquivo no backend, sem publicar versão nova do aplicativo.
 *
 * Uma pergunta por tela, por foco isolado (RNF02): em escolha única, tocar já
 * seleciona e avança, para não somar um segundo toque ("Continuar") a cada passo.
 */
const Calibration = () => {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { addToast } = useToast();
  const { t } = useI18n();
  const { categoria } = useLocalSearchParams();

  const [questionario, setQuestionario] = useState(null);
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [sugestao, setSugestao] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await getCalibrationQuestions(categoria);
        if (ativo) setQuestionario(data);
      } catch (err) {
        addToast(err.response?.data?.message || t('calibracao.erroCarregar'), 'error');
        router.back();
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, [categoria, addToast, router]);

  const perguntas = questionario?.perguntas ?? [];
  const pergunta = perguntas[indice];
  const total = perguntas.length;

  const responder = useCallback((codigo, valor) => {
    setRespostas((atual) => ({ ...atual, [codigo]: valor }));
  }, []);

  const avancar = useCallback(() => {
    setIndice((i) => Math.min(i + 1, total - 1));
  }, [total]);

  // O avanço automático da escolha única tem um respiro de 120ms para a seleção
  // ficar visível antes da troca. Se a tela sair nesse intervalo, o timer precisa
  // morrer junto — senão vira atualização de estado em componente desmontado.
  const timerAvanco = useRef(null);
  useEffect(() => () => clearTimeout(timerAvanco.current), []);

  const voltar = useCallback(() => {
    if (indice === 0) {
      router.back();
      return;
    }
    setIndice((i) => i - 1);
  }, [indice, router]);

  const enviar = useCallback(async () => {
    setEnviando(true);
    try {
      const lista = Object.entries(respostas).map(([pergunta_codigo, valor]) => ({ pergunta_codigo, valor }));
      const { data } = await submitCalibration(categoria, lista);
      setSugestao(data);
    } catch (err) {
      addToast(err.response?.data?.message || t('calibracao.erroCalcular'), 'error');
    } finally {
      setEnviando(false);
    }
  }, [categoria, respostas, addToast]);

  // Quantas ocorrências a pessoa escolheu — define quantos campos de horário a
  // pergunta de HORARIOS mostra.
  const vezesAoDia = Number(respostas.VEZES_AO_DIA || 1);

  const horarios = useMemo(() => {
    const bruto = respostas.HORARIOS ? String(respostas.HORARIOS).split(',') : [];
    return Array.from({ length: vezesAoDia }, (_, i) => bruto[i] || '');
  }, [respostas.HORARIOS, vezesAoDia]);

  const definirHorario = useCallback(
    (posicao, valor) => {
      const novos = [...horarios];
      novos[posicao] = valor;
      responder('HORARIOS', novos.join(','));
    },
    [horarios, responder]
  );

  const diasSelecionados = useMemo(() => {
    const mascara = respostas.DIAS_SEMANA || '';
    return Array.from({ length: 7 }, (_, i) => mascara[i] === '1');
  }, [respostas.DIAS_SEMANA]);

  const alternarDia = useCallback(
    (i) => {
      const atual = respostas.DIAS_SEMANA || '0000000';
      const novo = [...atual.padEnd(7, '0')];
      novo[i] = novo[i] === '1' ? '0' : '1';
      responder('DIAS_SEMANA', novo.join(''));
    },
    [respostas.DIAS_SEMANA, responder]
  );

  // Cada tipo tem sua própria condição de "já dá para seguir".
  const podeAvancar = useMemo(() => {
    if (!pergunta) return false;
    switch (pergunta.tipo) {
      case 'DIAS_SEMANA':
        return diasSelecionados.some(Boolean);
      case 'HORARIOS':
        return horarios.every((h) => RE_HORA.test(h));
      case 'VEZES_AO_DIA':
        return Boolean(respostas.VEZES_AO_DIA);
      default:
        return Boolean(respostas[pergunta.codigo]);
    }
  }, [pergunta, respostas, diasSelecionados, horarios]);

  if (carregando) return <LoadingScreen message={t('calibracao.preparando')} />;

  // ---------------------------------------------------------------- sugestão
  if (sugestao) {
    const s = sugestao.sugestao;
    const unidade = s.unidade === 'min' ? t('calibracao.unidadeMin') : t('calibracao.unidadeOutra', { unidade: s.unidade });
    const diasMarcados = [...s.frequencia_semanal].filter((c) => c === '1').length;

    return (
      <Container style={{ paddingTop: insets.top }}>
        {/* Sem esta volta, quem visse a sugestão e quisesse mudar uma resposta só
            teria a saída de descartar tudo e preencher na mão. Voltar preserva as
            respostas — o estado do questionário continua montado. */}
        <TopBar>
          <BackButton onPress={() => setSugestao(null)} accessibilityLabel={t('comum.voltar')}>
            <Feather name="chevron-left" size={26} color={theme.textPrimary} />
          </BackButton>
        </TopBar>
        <Content contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
          <Pergunta>{t('calibracao.suaSugestao')}</Pergunta>
          <Explicacao>{sugestao.explicacao}</Explicacao>

          <SugestaoCard>
            <SugestaoMeta>{s.meta_base}</SugestaoMeta>
            <SugestaoMetaUnidade>{unidade}</SugestaoMetaUnidade>

            <SugestaoLinha>
              <SugestaoRotulo>{t('calibracao.diasNaSemana')}</SugestaoRotulo>
              <SugestaoValor>
                {diasMarcados === 7 ? t('calibracao.todosOsDias') : t('calibracao.nDias', { n: diasMarcados })}
              </SugestaoValor>
            </SugestaoLinha>
            <SugestaoLinha>
              <SugestaoRotulo>{t('calibracao.momentosNoDia')}</SugestaoRotulo>
              <SugestaoValor>
                {s.meta_frequencia_diaria}
                {s.meta_frequencia_diaria > 1 ? ` ${t('calibracao.cadaOcorrencia', { alvo: Math.floor(s.meta_base / s.meta_frequencia_diaria), unidade: s.unidade })}` : ''}
              </SugestaoValor>
            </SugestaoLinha>
            <SugestaoLinha>
              <SugestaoRotulo>{t('calibracao.horarios')}</SugestaoRotulo>
              <SugestaoValor>{s.ocorrencias.map((o) => String(o.horario_inicio).slice(0, 5)).join(' · ')}</SugestaoValor>
            </SugestaoLinha>
            <SugestaoLinha>
              <SugestaoRotulo>{t('calibracao.ritmo')}</SugestaoRotulo>
              <SugestaoValor>
                {s.incremento > 0
                  ? t('calibracao.aumentoTexto', { incremento: s.incremento, unidade: s.unidade, dias: s.dias_incremento })
                  : t('calibracao.semAumento')}
              </SugestaoValor>
            </SugestaoLinha>
            {s.meta_maxima ? (
              <SugestaoLinha>
                <SugestaoRotulo>{t('calibracao.ateNoMaximo')}</SugestaoRotulo>
                <SugestaoValor>
                  {s.meta_maxima} {s.unidade}
                </SugestaoValor>
              </SugestaoLinha>
            ) : null}
          </SugestaoCard>

          <PrimaryButton
            onPress={() =>
              router.replace({
                pathname: '/create',
                params: { sugestao: JSON.stringify({ ...s, calibracao_id: sugestao.calibracao_id }) },
              })
            }
          >
            <PrimaryButtonText>{t('calibracao.usarSugestao')}</PrimaryButtonText>
          </PrimaryButton>
          <SecondaryButton onPress={() => router.replace({ pathname: '/create', params: { categoria } })}>
            <SecondaryButtonText>{t('calibracao.ajustarManual')}</SecondaryButtonText>
          </SecondaryButton>
        </Content>
      </Container>
    );
  }

  // -------------------------------------------------------------- perguntas
  const ehUltima = indice === total - 1;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100}
    >
    <Container style={{ paddingTop: insets.top }}>
      <TopBar>
        <BackButton onPress={voltar} accessibilityLabel={t("comum.voltar")}>
          <Feather name="chevron-left" size={26} color={theme.textPrimary} />
        </BackButton>
      </TopBar>
      <ProgressTrack>
        <ProgressFill $percent={total > 0 ? ((indice + 1) / total) * 100 : 0} />
      </ProgressTrack>

      <Content contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <Pergunta>{pergunta?.enunciado}</Pergunta>

        {pergunta?.tipo === 'ESCOLHA_UNICA' || pergunta?.tipo === 'RITMO' ? (
          <>
            {pergunta.tipo === 'RITMO' ? <Ajuda>{t('calibracao.ajudaRitmo')}</Ajuda> : null}
            {pergunta.opcoes.map((opcao) => (
              <Opcao
                key={opcao.valor}
                $active={respostas[pergunta.codigo] === opcao.valor}
                onPress={() => {
                  responder(pergunta.codigo, opcao.valor);
                  // Um toque resolve a pergunta: seleciona e segue.
                  if (!ehUltima) {
                    clearTimeout(timerAvanco.current);
                    timerAvanco.current = setTimeout(avancar, 120);
                  }
                }}
              >
                <OpcaoTexto>{opcao.rotulo}</OpcaoTexto>
                {opcao.detalhe ? <OpcaoDetalhe>{opcao.detalhe}</OpcaoDetalhe> : null}
              </Opcao>
            ))}
          </>
        ) : null}

        {pergunta?.tipo === 'DIAS_SEMANA' ? (
          <>
            <Ajuda>{t('calibracao.ajudaDias')}</Ajuda>
            <DiasRow>
              {t('diasSemanaCurto').map((letra, i) => (
                <DiaCirculo
                  key={i}
                  $active={diasSelecionados[i]}
                  onPress={() => alternarDia(i)}
                  accessibilityLabel={`${t("calibracao.diasNaSemana")} ${i + 1}`}
                >
                  <DiaTexto $active={diasSelecionados[i]}>{letra}</DiaTexto>
                </DiaCirculo>
              ))}
            </DiasRow>
          </>
        ) : null}

        {pergunta?.tipo === 'VEZES_AO_DIA' ? (
          <>
            <Ajuda>{t('calibracao.ajudaVezes')}</Ajuda>
            <ChipsRow>
              {Array.from({ length: pergunta.maximo || 4 }, (_, i) => i + 1).map((n) => (
                <Chip
                  key={n}
                  $active={Number(respostas.VEZES_AO_DIA) === n}
                  onPress={() => responder('VEZES_AO_DIA', String(n))}
                >
                  <ChipTexto $active={Number(respostas.VEZES_AO_DIA) === n}>{n}</ChipTexto>
                </Chip>
              ))}
            </ChipsRow>
          </>
        ) : null}

        {pergunta?.tipo === 'HORARIOS' ? (
          <>
            <Ajuda>{t('calibracao.ajudaHorarios')}</Ajuda>
            {horarios.map((valor, i) => (
              <HorarioLinha key={i}>
                <HorarioRotulo>{vezesAoDia > 1 ? t('calibracao.momentoN', { n: i + 1 }) : t('calibracao.horario')}</HorarioRotulo>
                <HorarioCampo>
                  <TimePickerField
                    value={valor}
                    onChange={(novo) => definirHorario(i, novo)}
                    accessibilityLabel={t('calibracao.horario')}
                  />
                </HorarioCampo>
              </HorarioLinha>
            ))}
          </>
        ) : null}

        {/* Escolha única resolve no toque; os outros tipos precisam de confirmação. */}
        {pergunta && pergunta.tipo !== 'ESCOLHA_UNICA' && pergunta.tipo !== 'RITMO' ? (
          <PrimaryButton $disabled={!podeAvancar} disabled={!podeAvancar} onPress={ehUltima ? enviar : avancar}>
            <PrimaryButtonText>{ehUltima ? t('calibracao.verSugestao') : t('comum.continuar')}</PrimaryButtonText>
          </PrimaryButton>
        ) : null}

        {/* Na última pergunta de escolha única, o toque só seleciona — o envio é aqui. */}
        {ehUltima && (pergunta?.tipo === 'ESCOLHA_UNICA' || pergunta?.tipo === 'RITMO') ? (
          <PrimaryButton $disabled={!podeAvancar || enviando} disabled={!podeAvancar || enviando} onPress={enviar}>
            {enviando ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <PrimaryButtonText>{t('calibracao.verSugestao')}</PrimaryButtonText>
            )}
          </PrimaryButton>
        ) : null}

        <SecondaryButton onPress={() => router.replace({ pathname: '/create', params: { categoria } })}>
          <SecondaryButtonText>{t('calibracao.preferirManual')}</SecondaryButtonText>
        </SecondaryButton>
      </Content>
    </Container>
    </KeyboardAvoidingView>
  );
};

export default Calibration;
