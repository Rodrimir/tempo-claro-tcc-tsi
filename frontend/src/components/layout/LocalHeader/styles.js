import styled from 'styled-components';

// @audit-ok [E3.2 — HeaderContainer vira coluna: uma linha pro nome do hábito
// (item 2) em cima da linha de indicadores que já existia (item 1/3).]
export const HeaderContainer = styled.header`
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 24px 16px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
`;

// @audit-ok [E3.2 (item 2) — deixa explícito de quem são os 3 números
// abaixo; "Selecione um hábito" quando não há nenhum focado (item 3).]
export const HabitNameRow = styled.div`
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
`;

export const IndicatorsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
`;

// @audit-ok [E3.2 (item 1) — ícone + número numa linha; o rótulo textual
// (Moedas/Ofensiva/Escudos) vai embaixo, fora desta linha.]
export const IconRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const IconLabel = styled.span`
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-top: 3px;
`;

export const CoinsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: var(--warning-light);
  padding: 6px 16px 8px;
  border-radius: 20px;
  color: var(--warning-color);
  font-weight: 700;
  justify-self: start;
`;

export const FlameWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--danger-color);
  font-weight: 800;
  font-size: 18px;
  justify-self: center;
`;

export const ShieldButton = styled.button`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: var(--primary-light);
  padding: 6px 8px 8px 16px;
  border-radius: 20px;
  color: var(--primary-color);
  font-weight: 700;
  cursor: pointer;
  border: 1px solid var(--primary-color);
  justify-self: end;
`;

// @audit-ok [E3.4 — primaryColor era pastel de propósito no tema escuro;
// com texto branco por cima (preenchimento sólido), precisa do primary-strong.]
export const PlusIconWrapper = styled.div`
  background: var(--primary-strong);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`;
