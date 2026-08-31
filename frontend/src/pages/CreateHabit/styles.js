import styled from 'styled-components';

export const Container = styled.div`
  padding: 24px;
  padding-bottom: 100px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100vh;
  background: var(--bg-primary);
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const BackButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
`;

export const HeaderText = styled.div``;

export const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
`;

export const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 14px;
`;

export const StepContainer = styled.div`
  animation: slideInRight 0.3s ease-out;

  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;

export const StepTitle = styled.h2`
  font-size: 18px;
  margin-bottom: 16px;
`;

// @audit-ok [E3.5 — padding lateral era fixo em 24px, cancelado pela margem
// negativa (-24px) usada pra sangrar o container até a borda da tela; sobrava
// pouco espaço real pra um card de 280px centralizar via scroll-snap-align:
// center (precisa de ~(largura da tela - largura do card)/2 de cada lado — em
// torno de 55-100px num viewport de 390-480px, não 24px). Card cortado na
// borda era esse déficit. calc(50% - 140px) = metade do container menos
// metade do card (280/2), deixando o card ativo perfeitamente centralizado
// com os vizinhos espiando pelas bordas; max(24px, ...) evita padding zerado
// num viewport hipotético menor que o próprio card.]
export const MoldeScrollContainer = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 16px;
  padding: 16px max(24px, calc(50% - 140px));
  margin: 0 -24px;
  scroll-snap-type: x mandatory;
  &::-webkit-scrollbar {
    display: none;
  }
`;

// @audit-ok [E3.5 — era styled.div com onClick só de mouse/toque, sem
// role/tabIndex/onKeyDown. Virou styled.button: foco e ativação por
// Enter/Espaço vêm de graça da semântica nativa, sem precisar simular.]
export const MoldeCard = styled.button`
  min-width: 280px;
  background: ${(props) => props.$active ? 'var(--primary-light)' : 'var(--bg-surface)'};
  border: 2px solid ${(props) => props.$active ? 'var(--primary-color)' : 'transparent'};
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  scroll-snap-align: center;
  transition: all 0.2s;
  font-family: inherit;
  appearance: none;

  &:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
`;

export const MoldeEmoji = styled.span`
  font-size: 64px;
  margin-bottom: 16px;
`;

export const MoldeTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
`;

export const MoldeDesc = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
`;

// @audit-ok [E3.4 — primaryColor era pastel de propósito no tema escuro;
// com texto branco por cima (preenchimento sólido), precisa do primary-strong.]
export const NextButton = styled.button`
  width: 100%;
  margin-top: 24px;
  padding: 20px;
  border-radius: 9999px;
  background: var(--primary-strong);
  color: white;
  font-weight: 700;
  font-size: 18px;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
`;

export const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const OptionCard = styled.div`
  padding: 24px;
  background: var(--bg-surface);
  border-radius: 16px;
  border: 1px solid ${(props) => props.$primary ? 'transparent' : 'var(--border-color)'};
  border: ${(props) => props.$primary ? '2px solid var(--primary-color)' : '1px solid var(--border-color)'};
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
`;

// @audit-ok [E2.6 (item 1) — variante não-clicável de OptionCard: borda
// tracejada e opacidade reduzida sinalizam "não é uma opção de verdade" à
// primeira vista, sem precisar de texto extra explicando.]
export const StaticOptionCard = styled.div`
  padding: 24px;
  background: var(--bg-surface);
  border-radius: 16px;
  border: 1px dashed var(--border-color);
  display: flex;
  align-items: center;
  gap: 16px;
  opacity: 0.6;
  cursor: default;
`;

export const OptionIconWrapper = styled.div`
  background: var(--primary-light);
  color: var(--primary-color);
  padding: 12px;
  border-radius: 50%;
`;

export const OptionText = styled.div``;

export const OptionTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
`;

export const OptionSubtitle = styled.p`
  font-size: 12px;
  color: var(--text-secondary);
`;

export const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const FormCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--bg-surface);
  padding: 20px;
  border-radius: 16px;
`;

export const FormGroup = styled.div``;

export const Label = styled.label`
  display: block;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
`;

// @audit-ok [E2.6 (item 3) — prop $error acrescenta a borda vermelha quando o
// campo tem uma mensagem pendente em errors[campo] (ver index.jsx).]
export const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid ${(props) => props.$error ? 'var(--danger-color)' : 'var(--border-color)'};
  border-radius: 12px;
  font-size: 16px;
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
`;

// @audit-ok [E2.6 (item 3) — mensagem de erro por campo, não mais um toast
// genérico de "falha de rede" pra problema de validação.]
export const ErrorText = styled.p`
  color: var(--danger-color);
  font-size: 12px;
  margin-top: 6px;
`;

export const GridRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

// @audit-ok [E2.8 (item 1) — um bloco por ocorrência quando "Vezes ao Dia" > 1;
// borda separa visualmente cada ocorrência dentro do mesmo FormCard.]
export const OcorrenciaRow = styled.div`
  padding: 12px 0;
  border-top: 1px solid var(--border-color);

  &:first-child {
    border-top: none;
    padding-top: 0;
  }
`;

// @audit-ok [E2.8 (item 2) — alvo calculado ao vivo, recalculado a cada
// mudança de meta ou de vezes ao dia (ver calcularAlvos em index.jsx).]
export const OcorrenciaAlvo = styled.p`
  font-weight: 700;
  font-size: 14px;
  color: var(--primary-color);
  margin-bottom: 8px;
`;

export const WeekDaysContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: space-between;
`;

// @audit-ok [E2.4 (item 4) — era um círculo de 36px pensado pra 1 letra
// (D S T Q Q S S, que repetia 3 letras e confundia). Com o rótulo virando
// 3 letras (DOM SEG TER...), deixou de ser círculo e ganhou padding
// horizontal em vez de largura fixa.]
export const DayButton = styled.button`
  min-width: 40px;
  height: 32px;
  padding: 0 4px;
  border-radius: 10px;
  border: none;
  background: ${(props) => props.$active ? 'var(--primary-strong)' : 'var(--bg-primary)'};
  color: ${(props) => props.$active ? 'white' : 'var(--text-secondary)'};
  font-weight: 600;
  font-size: 11px;
  letter-spacing: 0.02em;
  cursor: pointer;
`;

// @audit-ok [E2.6 (item 5) — Passo 4: card de revisão antes da confirmação
// final, único ponto de checagem já que o questionário automático (D4) não
// existe pra cumprir esse papel.]
export const ReviewCard = styled.div`
  background: var(--bg-surface);
  padding: 24px;
  border-radius: 16px;
  border: 1px solid var(--border-color);
`;

export const ReviewText = styled.p`
  font-size: 16px;
  line-height: 1.7;
  color: var(--text-primary);

  strong {
    color: var(--primary-color);
  }
`;

// @audit-ok [E3.4 — mesmo motivo do NextButton acima ("Confirmar e Criar
// Hábito", o botão final do assistente).]
export const SubmitButton = styled.button`
  width: 100%;
  padding: 20px;
  border-radius: 9999px;
  background: var(--primary-strong);
  color: white;
  font-weight: 700;
  font-size: 18px;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);

  &:disabled {
    background: var(--primary-light);
    color: var(--primary-color);
    cursor: not-allowed;
    box-shadow: none;
  }
`;
