import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Ruler, Edit3 } from 'lucide-react';
import { createHabit, updateHabit } from '../../services/api';
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
  MoldeScrollContainer,
  MoldeCard,
  MoldeEmoji,
  MoldeTitle,
  MoldeDesc,
  NextButton,
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
  WeekDaysContainer,
  DayButton,
  OcorrenciaRow,
  OcorrenciaAlvo,
  ReviewCard,
  ReviewText,
  SubmitButton
} from './styles';

// @audit-ok [Criar Hábito (1) — wizard de 4 etapas para criação de hábito:
// avatar > calibração (estática) > formulário > revisão.
// E2.6: eram 3 etapas; ganhou a etapa de revisão (item 5).]

// @audit-ok [E2.9 (item 4) — achado crítico da varredura de contrato: 'ESTUDAR'
// nunca bateu com o CHECK do banco (ck_hab_categoria só aceita 'AGUA',
// 'ESTUDO', 'EXERCICIO' — ver schema.sql). Criar um hábito "Livrinho" sempre
// falhava com violação de restrição. Ver docs/CONTRATO_API.md.]
const MOLDES = [
  { id: 'AGUA', emoji: '💧', titulo: 'Gotinha', desc: 'Mantenha-se hidratado e evolua sua gotinha.' },
  { id: 'ESTUDO', emoji: '📚', titulo: 'Livrinho', desc: 'Foco total nos estudos para evoluir seu livro.' },
  { id: 'EXERCICIO', emoji: '🏋️', titulo: 'Homenzinho', desc: 'Construa disciplina física e evolua seu avatar.' }
];

// @audit-ok [E2.4 (item 4) — rótulos de 1 letra (D S T Q Q S S) repetiam
// "Q" e "S" três vezes cada; ambíguo demais pra selecionar dias. Índice
// 0=domingo confirmado no item 1 (mesma convenção do backend/ProximoVencimentoService).]
const DIAS_SEMANA = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

const TOTAL_STEPS = 4;
const NOME_MAX_LENGTH = 60;

// @audit-ok [E4.2 (item 2) — "HH:mm:ss" (formato que LocalTime vira em JSON)
// -> "HH:mm" (formato que <input type="time"> aceita).]
function horaCurta(valor) {
  return valor ? String(valor).slice(0, 5) : '';
}

// @audit-ok [E4.2 (item 2) — máscara de 7 dígitos ("0101000") de volta pros
// índices selecionados (0=Dom), o formato que o formulário usa internamente.
// Inverso exato da conversão em handleSave.]
function diasDaMascara(mascara) {
  if (!mascara) return [1, 2, 3, 4, 5];
  return [...mascara].reduce((acc, c, i) => (c === '1' ? [...acc, i] : acc), []);
}

// @audit-ok [E4.2 (item 2) — estado inicial do formulário: em branco pra
// criar, ou pré-preenchido a partir do hábito passado por
// navigate('/create', {state:{editHabit}}) (mesmo padrão de location.state já
// usado em Success/Fail) pra editar. ocorrencias vem de HabitoResponseDTO —
// campo novo desta tarefa, sem ele um hábito de mais de 1x/dia teria que
// redigitar cada horário do zero ao editar.]
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
      ocorrencias: [{ horario_inicio: '', horario_fim: '' }]
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
    ocorrencias: vezesDia > 1 && editHabit.ocorrencias?.length
      ? editHabit.ocorrencias.map(o => ({
          horario_inicio: horaCurta(o.horario_inicio),
          horario_fim: horaCurta(o.horario_fim)
        }))
      : Array.from({ length: Math.max(1, vezesDia) }, () => ({ horario_inicio: '', horario_fim: '' }))
  };
}

const CreateHabit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  // @audit-ok [E4.2 (item 2) — presença de editHabit é o que decide o modo
  // inteiro da tela: se veio de Home > "Editar" (ver Home/index.jsx), pula
  // direto pro Passo 3 já preenchido; sem ele, é a criação normal do zero.]
  const editHabit = location.state?.editHabit || null;
  const isEditMode = Boolean(editHabit);
  const moldeInicial = isEditMode
    ? (MOLDES.find(m => m.id === editHabit.categoria) || MOLDES[0])
    : MOLDES[0];

  const [step, setStep] = useState(isEditMode ? 3 : 1);
  const [molde, setMolde] = useState(moldeInicial);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // @audit-ok [E2.6 (item 3/4) — mensagens de erro por campo, populadas só no
  // momento de tentar avançar/enviar (não a cada tecla). Chave = mesmo nome
  // usado em formData.]
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState(() => formDataInicial(editHabit, moldeInicial));

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  // @audit-ok [E2.6 (item 2) — troca de molde ressincroniza o nome sugerido]
  const handleSelecionarMolde = (m) => {
    setMolde(m);
    setFormData(prev => ({ ...prev, titulo: m.titulo }));
  };

  // @audit-ok [E2.6 (item 3) — atualiza o campo e limpa o erro dele, se
  // houver. Evita que uma mensagem de erro antiga fique visível depois que o
  // usuário já começou a corrigir aquele campo específico.]
  const atualizarCampo = (campo, valor) => {
    setFormData(prev => ({ ...prev, [campo]: valor }));
    setErrors(prev => {
      if (!prev[campo]) return prev;
      const { [campo]: _removido, ...resto } = prev;
      return resto;
    });
  };

  // @audit-ok [E2.8 (item 1) — "Vezes ao Dia" passa a redimensionar o array de
  // ocorrências: aumentar preserva os horários já digitados nas ocorrências
  // existentes e só acrescenta linhas vazias no fim; diminuir corta do fim
  // pra dentro, sem embaralhar as que sobraram.]
  const atualizarVezesDia = (valor) => {
    const n = Math.max(1, Math.min(12, Number(valor) || 1));
    setFormData(prev => {
      const ocorrenciasAtuais = prev.ocorrencias || [];
      const novasOcorrencias = Array.from({ length: n }, (_, i) =>
        ocorrenciasAtuais[i] || { horario_inicio: '', horario_fim: '' }
      );
      return { ...prev, vezes_dia: valor, ocorrencias: novasOcorrencias };
    });
    setErrors(prev => {
      const resto = {};
      for (const [chave, msg] of Object.entries(prev)) {
        if (chave !== 'vezes_dia' && !chave.startsWith('ocorrencia_')) resto[chave] = msg;
      }
      return resto;
    });
  };

  const atualizarOcorrencia = (indice, campo, valor) => {
    setFormData(prev => {
      const novasOcorrencias = [...prev.ocorrencias];
      novasOcorrencias[indice] = { ...novasOcorrencias[indice], [campo]: valor };
      return { ...prev, ocorrencias: novasOcorrencias };
    });
    const chaveErro = `ocorrencia_${indice}`;
    setErrors(prev => {
      if (!prev[chaveErro]) return prev;
      const { [chaveErro]: _removido, ...resto } = prev;
      return resto;
    });
  };

  // @audit-ok [E2.8 (item 2) — mesma conta de HabitoService.gerarSubAtividades
  // (repartir igualmente, resto na última), replicada aqui só pra dar feedback
  // imediato no formulário. Recalculada a cada render — tanto faz mudar a meta
  // quanto vezes ao dia, o preview sempre reflete os dois.]
  const calcularAlvos = (metaBase, vezes) => {
    const meta = Number(metaBase) || 0;
    const n = Math.max(1, Number(vezes) || 1);
    const base = Math.floor(meta / n);
    const resto = meta % n;
    return Array.from({ length: n }, (_, i) => base + (i === n - 1 ? resto : 0));
  };

  const toggleDia = (index) => {
    setFormData(prev => {
      const freq = prev.frequencia_semanal.includes(index)
        ? prev.frequencia_semanal.filter(d => d !== index)
        : [...prev.frequencia_semanal, index].sort();
      return { ...prev, frequencia_semanal: freq };
    });
    setErrors(prev => {
      if (!prev.frequencia_semanal) return prev;
      const { frequencia_semanal: _removido, ...resto } = prev;
      return resto;
    });
  };

  const unidadeMeta = molde.id === 'AGUA' ? 'ml' : 'min';

  // @audit-ok [E2.6 (item 3/4) — validação campo a campo, roda ANTES de
  // avançar pra revisão (handleRevisar), nunca depois de já ter chamado a
  // API. Substitui a conversão silenciosa de campo vazio em 1 (item 4): um
  // campo inválido bloqueia o avanço e aponta o problema nele mesmo.]
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
      // @audit-ok [E2.4 (item 4) — mesma regra de então, só que agora como
      // erro no campo em vez de toast: o schema já rejeita "0000000" via
      // ck_hab_freq, mas o usuário precisa ver isso no formulário, não como
      // falha genérica de rede.]
      erros.frequencia_semanal = 'Selecione ao menos um dia da semana.';
    }

    // @audit-ok [Item 3 (E2.6) / E2.8 (item 1) — com 1x/dia, um único horário
    // (opcional; o servidor tem um default sensato, 23:59). Com mais de 1x/dia,
    // cada ocorrência tem seu PRÓPRIO campo agora (ver a seção "Horários por
    // Ocorrência" no render) — validado uma a uma, não mais um campo só.]
    if (vezesDiaNum > 1) {
      formData.ocorrencias.forEach((ocorrencia, i) => {
        if (!ocorrencia.horario_inicio) {
          erros[`ocorrencia_${i}`] = `Informe o horário de início da ocorrência ${i + 1}.`;
        }
      });
    }

    if (formData.meta_maxima !== '') {
      const metaMaximaNum = Number(formData.meta_maxima);
      // @audit-ok [Item 3 — mesma mensagem do ck_hab_teto traduzida em
      // GlobalExceptionHandler (E2.3), replicada aqui de propósito.]
      if (Number.isFinite(metaBaseNum) && metaMaximaNum < metaBaseNum) {
        erros.meta_maxima = 'A meta máxima não pode ser menor que a meta base.';
      }
    }

    return erros;
  };

  // @audit-ok [E2.6 (item 5) — botão do Passo 3 não envia mais direto: só
  // valida e, se tudo estiver certo, avança pro resumo de revisão (Passo 4).
  // A chamada de verdade à API fica em handleSave, disparada só a partir da
  // revisão.]
  const handleRevisar = () => {
    const erros = validarFormulario();
    setErrors(erros);
    if (Object.keys(erros).length === 0) {
      handleNext();
    } else {
      addToast('Corrija os campos destacados antes de continuar.', 'error');
    }
  };

  // @audit-ok [Criar Hábito (9) — coleta dados do formulário e envia para a API]
  const handleSave = async () => {
    // @audit-ok [Criar Hábito (10) — desabilita botão para evitar duplo envio]
    setIsSubmitting(true);
    try {
      // @audit-ok [E2.4 (item 4) — converte os índices selecionados (0=Dom) na
      // máscara de 7 dígitos que HabitoRequestDTO.frequencia_semanal espera.]
      const mascaraFrequencia = Array.from({ length: 7 }, (_, i) =>
        formData.frequencia_semanal.includes(i) ? '1' : '0'
      ).join('');
      // @audit-ok [E2.8 (item 1) — com mais de 1x/dia, manda "ocorrencias" (um
      // horário por sub_atividade) em vez do único "horario_agendado". Os dois
      // nunca são enviados juntos: o backend só usa ocorrencias quando o
      // tamanho bate exatamente com meta_frequencia_diaria (ver
      // HabitoService.gerarSubAtividades).]
      const usaOcorrenciasIndividuais = Number(formData.vezes_dia) > 1;
      // @audit-ok [Criar Hábito (11) — monta payload completo com todos os
      // campos do formulário. E2.6 (item 4): meta_base e meta_frequencia_diaria
      // não têm mais fallback "|| 1" — validarFormulario já garantiu que os
      // dois são números válidos antes de chegar aqui, então um fallback
      // silencioso só esconderia um bug se algum dia deixasse de garantir isso.]
      const payload = {
        categoria: molde.id,
        titulo: formData.titulo.trim(),
        // @audit-ok [E2.9 (item 4) — vazio vira null, não uma string vazia: o
        // banco trata os dois de formas diferentes (string vazia É um valor;
        // null é "não preenchido"), e "" não tem por que ser gravado.]
        gatilho_ancora: formData.gatilho_ancora.trim() || null,
        tipo_medida: molde.id === 'AGUA' ? 'QUANTIDADE' : 'TEMPO',
        modalidade: 'DIARIA',
        meta_base: parseInt(formData.meta_base, 10),
        // @audit-ok [E2.3 (item 3) — incremento=0 é "progressão desligada" (RF
        // e schema concordam nisso), então o fallback || 0 está certo aqui.
        // meta_maxima é diferente: null é "sem teto", e ck_hab_teto do banco
        // exige meta_maxima >= meta_base quando não for nulo — mandar 0 no
        // lugar de vazio violaria essa checagem toda vez que o campo ficasse
        // em branco.]
        incremento: parseInt(formData.incremento, 10) || 0,
        dias_incremento: parseInt(formData.dias_incremento, 10) || 10,
        meta_maxima: formData.meta_maxima !== '' ? parseInt(formData.meta_maxima, 10) : null,
        frequencia_semanal: mascaraFrequencia,
        meta_frequencia_diaria: parseInt(formData.vezes_dia, 10),
        horario_agendado: usaOcorrenciasIndividuais ? null : formData.horario,
        ocorrencias: usaOcorrenciasIndividuais
          ? formData.ocorrencias.map(o => ({
              horario_inicio: o.horario_inicio || null,
              horario_fim: o.horario_fim || null
            }))
          : null
      };
      // @audit-ok [E4.2 (item 2) — PUT /habits/{id} no modo de edição, POST
      // /habits na criação normal. Mesmo payload nos dois casos: atualizarHabito
      // no backend trata PUT como "substitua pelo que veio", igual criarHabito.]
      if (isEditMode) {
        await updateHabit(editHabit.id, payload);
        addToast('Hábito atualizado com sucesso!', 'success');
      } else {
        // @audit-ok [Criar Hábito (12) — envia POST /habits]
        await createHabit(payload);
        // @audit-ok [Criar Hábito (21) — notifica sucesso]
        addToast('Hábito criado com sucesso!', 'success');
      }
      navigate('/home');
    } catch (err) {
      // @audit-ok [E1.3 — usa a mensagem real do backend (RuntimeException vira
      // 400 com o limite de verdade embutido, ver GlobalExceptionHandler), em
      // vez de um literal fixo aqui. E2.6 (item 6): essa mensagem agora também
      // pode vir de um @Valid (título > 60 caracteres, vezes ao dia fora de
      // 1-12 etc.), não só de RuntimeException — o backend passou a devolver
      // texto legível nos dois casos.]
      const mensagem = err.response?.data?.message || 'Erro ao salvar hábito. Tente novamente.';
      addToast(mensagem, 'error');
      setIsSubmitting(false);
    }
  };

  const diasSelecionadosTexto = formData.frequencia_semanal.length === 7
    ? 'todos os dias'
    : formData.frequencia_semanal.map(i => DIAS_SEMANA[i]).join(', ');

  return (
    <Container>
      <Header>
        {/* @audit-ok [E4.2 (item 2) — no modo de edição o Passo 3 é o
            primeiro que existe (1/2 não fazem sentido pra editar um hábito
            já criado); "voltar" a partir dele sai direto pra Home, não
            decrementa pro Passo 2 (a tela de calibração estática).] */}
        {step > (isEditMode ? 3 : 1) ? (
          <BackButton onClick={handleBack} aria-label="Voltar">
            <ArrowLeft size={28} />
          </BackButton>
        ) : (
          <BackButton onClick={() => navigate('/home')} aria-label="Voltar para Home">
            <ArrowLeft size={28} />
          </BackButton>
        )}
        <HeaderText>
          <Title>{isEditMode ? 'Editar Hábito' : 'Novo Hábito'}</Title>
          {/* @audit-ok [E4.2 (item 2) — numeração exibida é local ao que o
              usuário de fato vê no modo de edição (Passo 1/2 de 2, não
              "Passo 3 de 4" — os passos 1/2 do assistente normal nunca
              aparecem aqui). O "step" interno continua 3/4 sem mudança,
              só a exibição é recalculada.] */}
          <Subtitle>
            Passo {isEditMode ? step - 2 : step} de {isEditMode ? TOTAL_STEPS - 2 : TOTAL_STEPS}
          </Subtitle>
        </HeaderText>
      </Header>

      {/* @audit-ok [Criar Hábito (2) — Etapa 1: seleção do avatar/categoria do hábito] */}
      {step === 1 && (
        <StepContainer>
          <StepTitle>Escolha o Avatar do Hábito</StepTitle>
          <MoldeScrollContainer>
            {/* @audit-ok [E3.5 — MoldeCard agora é <button>: Enter/Espaço já
                funcionam nativamente. onFocus centraliza o card no scroll ao
                ganhar foco — sem isso, dar Tab podia levar o foco a um card
                fora da área visível (o carrossel não acompanha o foco sozinho).] */}
            {MOLDES.map(m => (
              <MoldeCard
                key={m.id}
                type="button"
                onClick={() => handleSelecionarMolde(m)}
                onFocus={e => e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })}
                $active={molde.id === m.id}
                aria-pressed={molde.id === m.id}
              >
                <MoldeEmoji>{m.emoji}</MoldeEmoji>
                <MoldeTitle>{m.titulo}</MoldeTitle>
                <MoldeDesc>{m.desc}</MoldeDesc>
              </MoldeCard>
            ))}
          </MoldeScrollContainer>
          {/* @audit-ok [Criar Hábito (3) — avança para etapa 2 com o molde selecionado] */}
          <NextButton onClick={handleNext}>
            Continuar com {molde.titulo} <ChevronRight size={20} />
          </NextButton>
        </StepContainer>
      )}

      {/* @audit-ok [E2.6 (item 1) — Etapa 2 deixou de ser uma escolha entre
          "Medir Dificuldade" (decorativa) e "Preencher Manualmente". Com o
          questionário fora do MVP (decisão D4), não existe mais bifurcação:
          só um card estático (não clicável) mantendo o conceito visível, e um
          único caminho ativo adiante.] */}
      {step === 2 && (
        <StepContainer>
          <OptionsContainer>
            <StepTitle>Como vamos configurar a meta?</StepTitle>
            <StaticOptionCard aria-disabled="true">
              <OptionIconWrapper><Ruler size={24} /></OptionIconWrapper>
              <OptionText>
                <OptionTitle>Calibração Automática</OptionTitle>
                <OptionSubtitle>Em breve</OptionSubtitle>
              </OptionText>
            </StaticOptionCard>
            <OptionCard onClick={handleNext} $primary>
              <OptionIconWrapper><Edit3 size={24} /></OptionIconWrapper>
              <OptionText>
                <OptionTitle>Preencher Manualmente</OptionTitle>
                <OptionSubtitle>Defina suas próprias regras</OptionSubtitle>
              </OptionText>
            </OptionCard>
          </OptionsContainer>
        </StepContainer>
      )}

      {/* @audit-ok [Criar Hábito (7) — Etapa 3: formulário com todos os
          parâmetros do hábito. E2.6: ganhou o campo Nome e passou a validar
          campo a campo antes de avançar, em vez de enviar direto.] */}
      {step === 3 && (
        <StepContainer>
          <FormSection>
            <StepTitle>{isEditMode ? 'Editar' : 'Configuração Manual'} ({molde.titulo})</StepTitle>

            <FormCard>
              {/* @audit-ok [E2.6 (item 2) — nome próprio do hábito, editável,
                  até 60 caracteres (mesmo limite de hab_titulo VARCHAR(60)).] */}
              <FormGroup>
                <Label htmlFor="nome-habito">Nome do hábito</Label>
                <Input
                  id="nome-habito"
                  type="text"
                  maxLength={NOME_MAX_LENGTH}
                  placeholder="Nome do hábito"
                  value={formData.titulo}
                  $error={Boolean(errors.titulo)}
                  onChange={e => atualizarCampo('titulo', e.target.value)}
                />
                {errors.titulo && <ErrorText>{errors.titulo}</ErrorText>}
              </FormGroup>

              {/* @audit-ok [E2.9 (item 4) — gatilho_ancora já era gravado pelo
                  backend desde sempre (hab_gatilho_ancora); só faltava este
                  campo pra alguém preencher. Opcional de propósito — nenhum
                  hábito antigo tem isso preenchido.] */}
              <FormGroup>
                <Label htmlFor="gatilho-ancora">Gatilho (opcional)</Label>
                <Input
                  id="gatilho-ancora"
                  type="text"
                  maxLength={120}
                  placeholder="Depois do café da manhã"
                  value={formData.gatilho_ancora}
                  onChange={e => atualizarCampo('gatilho_ancora', e.target.value)}
                />
              </FormGroup>
            </FormCard>

            <FormCard>
              <FormGroup>
                <Label htmlFor="meta-base">Meta Mínima Base (Próx. 10 dias)</Label>
                <Input
                  id="meta-base"
                  type="number"
                  placeholder={molde.id === 'AGUA' ? 'Ex: 250 (ml)' : 'Ex: 25 (min)'}
                  value={formData.meta_base}
                  $error={Boolean(errors.meta_base)}
                  onChange={e => atualizarCampo('meta_base', e.target.value)}
                />
                {errors.meta_base && <ErrorText>{errors.meta_base}</ErrorText>}
              </FormGroup>

              <GridRow>
                {/* @audit-ok [E2.3 (item 3) — rótulo deixa de fixar "10" e passa a
                    refletir o valor de fato configurado em dias_incremento.] */}
                <FormGroup>
                  <Label htmlFor="aumento">Aumento a cada {formData.dias_incremento || 10} dias</Label>
                  <Input
                    id="aumento"
                    type="number"
                    placeholder="+10"
                    value={formData.incremento}
                    onChange={e => atualizarCampo('incremento', e.target.value)}
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="meta-maxima">Meta Máxima (Teto)</Label>
                  <Input
                    id="meta-maxima"
                    type="number"
                    placeholder="Sem limite"
                    value={formData.meta_maxima}
                    $error={Boolean(errors.meta_maxima)}
                    onChange={e => atualizarCampo('meta_maxima', e.target.value)}
                  />
                  {errors.meta_maxima && <ErrorText>{errors.meta_maxima}</ErrorText>}
                </FormGroup>
              </GridRow>

              {/* @audit-ok [E2.3 (item 3) — campo novo: antes o "10" do rótulo
                  acima era fixo no texto, sem nenhum jeito de mudar quantos dias
                  a progressão esperava entre um aumento e outro.] */}
              <FormGroup>
                <Label htmlFor="dias-incremento">A cada quantos dias de ofensiva</Label>
                <Input
                  id="dias-incremento"
                  type="number"
                  min="1"
                  placeholder="10"
                  value={formData.dias_incremento}
                  onChange={e => atualizarCampo('dias_incremento', e.target.value)}
                />
              </FormGroup>
            </FormCard>

            <FormCard>
              <FormGroup>
                <Label>Frequência Semanal</Label>
                {/* @audit-ok [Criar Hábito (8) — dias da semana selecionáveis; 0=Dom a 6=Sáb] */}
                <WeekDaysContainer>
                  {DIAS_SEMANA.map((dia, index) => (
                    <DayButton
                      key={dia}
                      onClick={() => toggleDia(index)}
                      $active={formData.frequencia_semanal.includes(index)}
                      aria-label={`Alternar dia ${dia}`}
                    >
                      {dia}
                    </DayButton>
                  ))}
                </WeekDaysContainer>
                {errors.frequencia_semanal && <ErrorText>{errors.frequencia_semanal}</ErrorText>}
              </FormGroup>

              <GridRow>
                <FormGroup>
                  <Label htmlFor="vezes-dia">Vezes ao Dia</Label>
                  <Input
                    id="vezes-dia"
                    type="number"
                    min="1"
                    max="12"
                    value={formData.vezes_dia}
                    $error={Boolean(errors.vezes_dia)}
                    onChange={e => atualizarVezesDia(e.target.value)}
                  />
                  {errors.vezes_dia && <ErrorText>{errors.vezes_dia}</ErrorText>}
                </FormGroup>
                {/* @audit-ok [E2.8 (item 1) — com 1x/dia continua sendo um único
                    campo de horário, igual sempre foi. Com mais de 1x/dia, este
                    campo some daqui e vira a lista "Horários por Ocorrência"
                    logo abaixo — nunca os dois ao mesmo tempo.] */}
                {Number(formData.vezes_dia) <= 1 && (
                  <FormGroup>
                    <Label htmlFor="hora-execucao">Hora de Execução</Label>
                    <Input
                      id="hora-execucao"
                      type="time"
                      value={formData.horario}
                      $error={Boolean(errors.horario)}
                      onChange={e => atualizarCampo('horario', e.target.value)}
                    />
                    {errors.horario && <ErrorText>{errors.horario}</ErrorText>}
                  </FormGroup>
                )}
              </GridRow>

              {/* @audit-ok [E2.8 (item 1/2) — um horário de início (e,
                  opcionalmente, fim) por ocorrência, com o alvo calculado ao
                  vivo (item 2) logo acima de cada par de campos.] */}
              {Number(formData.vezes_dia) > 1 && (
                <FormGroup>
                  <Label>Horários por Ocorrência</Label>
                  {formData.ocorrencias.map((ocorrencia, i) => (
                    <OcorrenciaRow key={i}>
                      <OcorrenciaAlvo>
                        Ocorrência {i + 1} — alvo: {calcularAlvos(formData.meta_base, formData.vezes_dia)[i]} {unidadeMeta}
                      </OcorrenciaAlvo>
                      <GridRow>
                        <FormGroup>
                          <Label htmlFor={`ocorrencia-inicio-${i}`}>Início</Label>
                          <Input
                            id={`ocorrencia-inicio-${i}`}
                            type="time"
                            value={ocorrencia.horario_inicio}
                            $error={Boolean(errors[`ocorrencia_${i}`])}
                            onChange={e => atualizarOcorrencia(i, 'horario_inicio', e.target.value)}
                          />
                        </FormGroup>
                        <FormGroup>
                          <Label htmlFor={`ocorrencia-fim-${i}`}>Fim (opcional)</Label>
                          <Input
                            id={`ocorrencia-fim-${i}`}
                            type="time"
                            value={ocorrencia.horario_fim}
                            onChange={e => atualizarOcorrencia(i, 'horario_fim', e.target.value)}
                          />
                        </FormGroup>
                      </GridRow>
                      {errors[`ocorrencia_${i}`] && <ErrorText>{errors[`ocorrencia_${i}`]}</ErrorText>}
                    </OcorrenciaRow>
                  ))}
                </FormGroup>
              )}
            </FormCard>

            {/* @audit-ok [E2.6 (item 5) — não envia mais direto: valida e, se
                estiver tudo certo, avança pro resumo de revisão.] */}
            <SubmitButton onClick={handleRevisar}>
              Revisar Hábito <ChevronRight size={20} />
            </SubmitButton>
          </FormSection>
        </StepContainer>
      )}

      {/* @audit-ok [E2.6 (item 5) — Etapa 4: resumo de revisão. Único ponto de
          checagem antes de gravar no banco, já que não há questionário
          automático (D4) pra cumprir esse papel.] */}
      {step === 4 && (
        <StepContainer>
          <FormSection>
            <StepTitle>Revise antes de {isEditMode ? 'salvar' : 'criar'}</StepTitle>
            <ReviewCard>
              <ReviewText>
                Você vai {isEditMode ? 'atualizar' : 'criar'} <strong>{formData.titulo}</strong> com meta de{' '}
                <strong>{formData.meta_base} {unidadeMeta}</strong>, nos dias{' '}
                <strong>{diasSelecionadosTexto}</strong>, executando{' '}
                <strong>{formData.vezes_dia}</strong> {Number(formData.vezes_dia) > 1 ? 'vezes' : 'vez'} ao dia.
              </ReviewText>
            </ReviewCard>

            <SubmitButton onClick={handleSave} disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting
                ? (isEditMode ? 'Salvando...' : 'Criando...')
                : (isEditMode ? 'Confirmar Alterações' : 'Confirmar e Criar Hábito')}
            </SubmitButton>
          </FormSection>
        </StepContainer>
      )}
    </Container>
  );
};

export default CreateHabit;
