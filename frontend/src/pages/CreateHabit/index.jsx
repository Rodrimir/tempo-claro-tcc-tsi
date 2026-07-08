import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Ruler, Edit3 } from 'lucide-react';
import { createHabit, getApiErrorMessage } from '../../services/api';
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
  OptionIconWrapper,
  OptionText,
  OptionTitle,
  OptionSubtitle,
  FormSection,
  FormCard,
  FormGroup,
  Label,
  Input,
  GridRow,
  WeekDaysContainer,
  DayButton,
  SubmitButton
} from './styles';

// @audit-ok [Criar Hábito (1) — wizard de 3 etapas para criação de hábito: avatar > modo > formulário]

const MOLDES = [
  { id: 'AGUA', emoji: '💧', titulo: 'Gotinha', desc: 'Mantenha-se hidratado e evolua sua gotinha.' },
  { id: 'ESTUDO', emoji: '📚', titulo: 'Livrinho', desc: 'Foco total nos estudos para evoluir seu livro.' },
  { id: 'EXERCICIO', emoji: '🏋️', titulo: 'Homenzinho', desc: 'Construa disciplina física e evolua seu avatar.' }
];

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const CreateHabit = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [step, setStep] = useState(1);
  const [molde, setMolde] = useState(MOLDES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    meta_base: '',
    incremento_meta: '',
    dias_para_aumento: '',
    meta_maxima: '',
    frequencia_semanal: [1, 2, 3, 4, 5],
    vezes_dia: 1,
    horario: ''
  });

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const toggleDia = (index) => {
    setFormData(prev => {
      const freq = prev.frequencia_semanal.includes(index)
        ? prev.frequencia_semanal.filter(d => d !== index)
        : [...prev.frequencia_semanal, index].sort();
      return { ...prev, frequencia_semanal: freq };
    });
  };

  const handleMedirDificuldade = () => {
    addToast('Medir Dificuldade: Em breve! Por favor, preencha manualmente por enquanto.', 'default');
  };

  // @audit-ok [Criar Hábito (9) — coleta dados do formulário e envia para a API]
  const handleSave = async () => {
    // @audit-ok [Criar Hábito (10) — desabilita botão para evitar duplo envio]
    setIsSubmitting(true);
    try {
      // @audit-ok [Criar Hábito (11) — monta payload completo com todos os campos do formulário]
      // @audit-info [Criar Hábito (11) — Água é medida em ml (sem conversão); Estudo/Exercício em segundos, mas a UI coleta minutos]
      const isTempo = molde.id !== 'AGUA';
      const fator = isTempo ? 60 : 1;

      const base = (parseInt(formData.meta_base, 10) || 1) * fator;
      const vezes = Math.min(Math.max(1, parseInt(formData.vezes_dia, 10) || 1), base);
      const incrementoMeta = (parseInt(formData.incremento_meta, 10) || 0) * fator;
      const diasParaAumento = parseInt(formData.dias_para_aumento, 10) || 0;
      const metaMaximaInput = parseInt(formData.meta_maxima, 10) || 0;
      const metaMaxima = metaMaximaInput > 0 ? metaMaximaInput * fator : null;

      const horarioValido = formData.horario ? formData.horario : "08:00";
      const [horasStr, minutosStr] = horarioValido.split(':');
      let horaAtual = parseInt(horasStr, 10);
      const minutoAtual = parseInt(minutosStr, 10);

      const espacamentoHoras = Math.max(1, Math.floor(16 / vezes));
      const alvoBase = Math.max(1, Math.floor(base / vezes));
      const sub_atividades = [];

      for(let i=0; i<vezes; i++) {
        const hIn = String(horaAtual).padStart(2, '0');
        const mIn = String(minutoAtual).padStart(2, '0');

        const proxHora = Math.min(23, horaAtual + espacamentoHoras);
        const hFim = String(proxHora).padStart(2, '0');

        // @audit-info [Criar Hábito (11) — a soma dos alvo_parcial deve fechar a meta_base: o resto vai na última parte]
        const alvoParcial = i === vezes - 1 ? base - alvoBase * (vezes - 1) : alvoBase;

        sub_atividades.push({
           ordem: i + 1,
           alvo_parcial: alvoParcial,
           horario_inicio: `${hIn}:${mIn}:00`,
           horario_fim: `${hFim}:${mIn}:00`
        });

        horaAtual = proxHora;
      }

      const payload = {
        categoria_codigo: molde.id,
        titulo: molde.titulo,
        tipo_medida: isTempo ? 'TEMPO' : 'QUANTIDADE',
        meta_base: base,
        meta_maxima: metaMaxima,
        dias_para_aumento: (incrementoMeta > 0 && diasParaAumento > 0) ? diasParaAumento : null,
        incremento_meta: (incrementoMeta > 0 && diasParaAumento > 0) ? incrementoMeta : null,
        dias_semana: formData.frequencia_semanal,
        sub_atividades: sub_atividades,
        horario_agendado: `${horasStr.padStart(2, '0')}:${minutosStr.padStart(2, '0')}:00`,
        gatilho_ancora: null
      };
      // @audit-ok [Criar Hábito (12) — envia POST /habits]
      await createHabit(payload);
      // @audit-ok [Criar Hábito (21) — notifica sucesso e redireciona para home]
      addToast('Hábito criado com sucesso!', 'success');
      navigate('/home');
    } catch (err) {
      addToast(getApiErrorMessage(err, 'Erro ao criar hábito. Limite de 2 hábitos ativos atingido?'), 'error');
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <Header>
        {step > 1 ? (
          <BackButton onClick={handleBack} aria-label="Voltar">
            <ArrowLeft size={28} />
          </BackButton>
        ) : (
          <BackButton onClick={() => navigate('/home')} aria-label="Voltar para Home">
            <ArrowLeft size={28} />
          </BackButton>
        )}
        <HeaderText>
          <Title>Novo Hábito</Title>
          <Subtitle>Passo {step} de 3</Subtitle>
        </HeaderText>
      </Header>

      {/* @audit-ok [Criar Hábito (2) — Etapa 1: seleção do avatar/categoria do hábito] */}
      {step === 1 && (
        <StepContainer>
          <StepTitle>Escolha o Avatar do Hábito</StepTitle>
          <MoldeScrollContainer>
            {MOLDES.map(m => (
              <MoldeCard key={m.id} onClick={() => setMolde(m)} $active={molde.id === m.id}>
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

      {/* @audit-ok [Criar Hábito (4) — Etapa 2: escolha entre configuração automática ou manual] */}
      {step === 2 && (
        <StepContainer>
          <OptionsContainer>
            <StepTitle>Como vamos configurar a meta?</StepTitle>
            {/* @audit-ok [Criar Hábito (5) — opção de questionário inteligente (em desenvolvimento)] */}
            <OptionCard onClick={handleMedirDificuldade}>
              <OptionIconWrapper><Ruler size={24} /></OptionIconWrapper>
              <OptionText>
                <OptionTitle>Medir Dificuldade</OptionTitle>
                <OptionSubtitle>Questionário inteligente</OptionSubtitle>
              </OptionText>
            </OptionCard>
            {/* @audit-ok [Criar Hábito (6) — avança para formulário manual na etapa 3] */}
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

      {/* @audit-ok [Criar Hábito (7) — Etapa 3: formulário com todos os parâmetros do hábito] */}
      {step === 3 && (
        <StepContainer>
          <FormSection>
            <StepTitle>Configuração Manual ({molde.titulo})</StepTitle>

            <FormCard>
              <FormGroup>
                <Label htmlFor="meta-base">Meta Mínima Base</Label>
                <Input
                  id="meta-base"
                  type="number"
                  placeholder={molde.id === 'AGUA' ? 'Ex: 250 (ml)' : 'Ex: 25 (min)'}
                  value={formData.meta_base}
                  onChange={e => setFormData({ ...formData, meta_base: e.target.value })}
                />
              </FormGroup>

              <GridRow>
                <FormGroup>
                  <Label htmlFor="incremento">Aumento na Meta</Label>
                  <Input
                    id="incremento"
                    type="number"
                    placeholder="+10"
                    value={formData.incremento_meta}
                    onChange={e => setFormData({ ...formData, incremento_meta: e.target.value })}
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="dias-aumento">A cada quantos dias?</Label>
                  <Input
                    id="dias-aumento"
                    type="number"
                    placeholder="Ex: 10"
                    value={formData.dias_para_aumento}
                    onChange={e => setFormData({ ...formData, dias_para_aumento: e.target.value })}
                  />
                </FormGroup>
              </GridRow>

              <FormGroup style={{ marginTop: '16px' }}>
                <Label htmlFor="meta-maxima">Meta Máxima (Teto)</Label>
                <Input
                  id="meta-maxima"
                  type="number"
                  placeholder="Limite (opcional)"
                  value={formData.meta_maxima}
                  onChange={e => setFormData({ ...formData, meta_maxima: e.target.value })}
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
                      {dia[0]}
                    </DayButton>
                  ))}
                </WeekDaysContainer>
              </FormGroup>

              <GridRow>
                <FormGroup>
                  <Label htmlFor="vezes-dia">Vezes ao Dia</Label>
                  <Input
                    id="vezes-dia"
                    type="number"
                    value={formData.vezes_dia}
                    onChange={e => setFormData({ ...formData, vezes_dia: e.target.value })}
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="hora-execucao">Hora de Execução</Label>
                  <Input
                    id="hora-execucao"
                    type="time"
                    value={formData.horario}
                    onChange={e => setFormData({ ...formData, horario: e.target.value })}
                  />
                </FormGroup>
              </GridRow>
            </FormCard>

            <SubmitButton onClick={handleSave} disabled={isSubmitting} aria-busy={isSubmitting}>
              {isSubmitting ? 'Criando...' : 'Criar Hábito'}
            </SubmitButton>
          </FormSection>
        </StepContainer>
      )}
    </Container>
  );
};

export default CreateHabit;
