// @audit-ok: FRONTEND-styles.js-01
import styled, { keyframes } from 'styled-components';

export const popIn = keyframes`
  0% { transform: scale(0.8); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

export const TimerContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

export const TimeDisplay = styled.div`
  font-family: monospace;
  font-size: 80px;
  font-weight: 800;
  color: ${(props) => props.$isOverachieving ? 'var(--success-color)' : 'var(--primary-color)'};
  transition: color 0.5s ease;
`;

export const BonusWrapper = styled.div`
  height: 40px;
  margin-top: 16px;
`;

export const BonusBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--success-color);
  font-weight: 700;
  animation: ${popIn} 0.5s ease-out forwards;
`;
