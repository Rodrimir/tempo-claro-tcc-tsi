// @audit-ok: FRONTEND-styles.js-01
import styled, { keyframes } from 'styled-components';

export const popIn = keyframes`
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

export const ExecutionContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: var(--bg-surface);
  padding: 24px;
`;

export const HeaderWrapper = styled.div`
  text-align: center;
  margin-bottom: 40px;
  margin-top: 20px;
`;

export const HeaderLabel = styled.h2`
  font-size: 20px;
  font-weight: 600;
  color: var(--text-secondary);
`;

export const HeaderTitle = styled.h1`
  font-size: 32px;
  font-weight: 800;
  color: var(--text-primary);
`;

export const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

export const ControlsWrapper = styled.div`
  display: flex;
  gap: 24px;
  margin-top: 40px;
`;

export const SubButton = styled.button`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  background: var(--bg-primary);
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  cursor: pointer;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

export const AddButton = styled.button`
  width: 64px;
  height: 64px;
  border-radius: 50%;
  border: none;
  background: var(--primary-color);
  font-size: 24px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
`;

export const ActionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 24px;
`;

export const CompleteButtonWrapper = styled.div`
  opacity: ${(props) => props.$visible ? 1 : 0};
  pointer-events: ${(props) => props.$visible ? 'auto' : 'none'};
  transition: opacity 0.5s ease;
  width: 100%;
`;

export const CompleteButton = styled.button`
  width: 100%;
  padding: 20px;
  border-radius: 9999px;
  background: var(--success-color);
  color: white;
  font-weight: 700;
  font-size: 18px;
  border: none;
  box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);
  cursor: pointer;
`;

export const GiveUpButton = styled.button`
  width: 100%;
  padding: 20px;
  border-radius: 9999px;
  background: var(--bg-surface);
  border: 2px solid var(--border-color);
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
`;
