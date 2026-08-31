import styled, { keyframes } from 'styled-components';

export const slideIn = keyframes`
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
`;

export const fadeOut = keyframes`
  from { opacity: 1; }
  to { opacity: 0; }
`;

export const ToastContainer = styled.div`
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(calc(240px - 100% - 24px));
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;

  @media (max-width: 480px) {
    left: auto;
    right: 24px;
    transform: none;
  }
`;

// @audit-ok [E3.4 — era var(--danger-color)/var(--success-color): com o
// texto branco por cima, essa dupla caía tão baixo quanto 1,92:1 no tema
// escuro (successColor lá é pastel de propósito, pensado pra ser texto/ícone
// sobre fundo escuro, não fundo sólido com texto branco). Troca pros tokens
// *-strong, com margem confortável nos dois temas.]
export const ToastMessage = styled.div`
  background: ${(props) => props.$type === 'error' ? 'var(--danger-strong)' : (props.$type === 'success' ? 'var(--success-strong)' : 'var(--bg-surface)')};
  color: ${(props) => props.$type === 'default' ? 'var(--text-primary)' : 'white'};
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  font-weight: 600;
  font-size: 14px;
  min-width: 250px;
  display: flex;
  align-items: center;
  gap: 12px;
  pointer-events: auto;
  cursor: pointer;
  animation: ${slideIn} 0.3s ease-out forwards;

  &.fading {
    animation: ${fadeOut} 0.3s ease-out forwards;
  }
`;
