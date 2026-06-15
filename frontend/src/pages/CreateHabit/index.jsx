import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Ruler, Edit3 } from 'lucide-react';
import { createHabit } from '../../services/api';
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

const MOLDES = [
  { id: 'AGUA', emoji: '💧', titulo: 'Gotinha', desc: 'Mantenha-se hidratado e evolua sua gotinha.' },
  { id: 'ESTUDAR', emoji: '📚', titulo: 'Livrinho', desc: 'Foco total nos estudos para evoluir seu livro.' },
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
    aumento_dezena: '',
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

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        categoria: molde.id,
        titulo: molde.titulo,
        tipo_medida: molde.id === 'AGUA' ? 'QUANTIDADE' : 'TEMPO',
        modalidade: 'DIARIA',
        meta_base: parseInt(formData.meta_base, 10) || 1,
        meta_frequencia_diaria: parseInt(formData.vezes_dia, 10) || 1,
        horario_agendado: formData.horario
      };

      await new Promise(r => setTimeout(r, 600));
      await createHabit(payload);
      addToast('Hábito criado com sucesso!', 'success');
      navigate('/home');
    } catch (err) {
      addToast('Erro ao criar hábito. Limite de 5 atingido?', 'error');
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

      {step === 1 && (
        <StepContainer>
          <StepTitle>Escolha o Avatar do Hábito</StepTitle>

          <MoldeScrollContainer>
            {MOLDES.map(m => (
              <MoldeCard
                key={m.id}
                onClick={() => setMolde(m)}
                $active={molde.id === m.id}
              >
                <MoldeEmoji>{m.emoji}</MoldeEmoji>
                <MoldeTitle>{m.titulo}</MoldeTitle>
                <MoldeDesc>{m.desc}</MoldeDesc>
              </MoldeCard>
            ))}
          </MoldeScrollContainer>

          <NextButton onClick={handleNext}>
            Continuar com {molde.titulo} <ChevronRight size={20} />
          </NextButton>
        </StepContainer>
      )}

      {step === 2 && (
        <StepContainer>
          <OptionsContainer>
            <StepTitle>Como vamos configurar a meta?</StepTitle>

            <OptionCard onClick={handleMedirDificuldade}>
              <OptionIconWrapper>
                <Ruler size={24} />
              </OptionIconWrapper>
              <OptionText>
                <OptionTitle>Medir Dificuldade</OptionTitle>
                <OptionSubtitle>Questionário inteligente</OptionSubtitle>
              </OptionText>
            </OptionCard>

            <OptionCard onClick={handleNext} $primary>
              <OptionIconWrapper>
                <Edit3 size={24} />
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
            <StepTitle>Configuração Manual ({molde.titulo})</StepTitle>

            <FormCard>
              <FormGroup>
                <Label htmlFor="meta-base">Meta Mínima Base (Próx. 10 dias)</Label>
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
                  <Label htmlFor="aumento">Aumento a cada 10 dias</Label>
                  <Input
                    id="aumento"
                    type="number"
                    placeholder="+10"
                    value={formData.aumento_dezena}
                    onChange={e => setFormData({ ...formData, aumento_dezena: e.target.value })}
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="meta-maxima">Meta Máxima (Teto)</Label>
                  <Input
                    id="meta-maxima"
                    type="number"
                    placeholder="Limite"
                    value={formData.meta_maxima}
                    onChange={e => setFormData({ ...formData, meta_maxima: e.target.value })}
                  />
                </FormGroup>
              </GridRow>
            </FormCard>

            <FormCard>
              <FormGroup>
                <Label>Frequência Semanal</Label>
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

            <SubmitButton
              onClick={handleSave}
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? 'Criando...' : 'Criar Hábito'}
            </SubmitButton>
          </FormSection>
        </StepContainer>
      )}
    </Container>
  );
};

export default CreateHabit;
