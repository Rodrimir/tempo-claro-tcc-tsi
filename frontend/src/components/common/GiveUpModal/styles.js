// @audit-ok: FRONTEND-styles.js-01
import styled from 'styled-components';

export const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const ModalCard = styled.div`
  background: var(--bg-surface);
  width: 100%;
  border-radius: 24px;
  padding: 24px;
  text-align: center;
`;

export const Title = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-primary);
`;

export const Subtitle = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
`;

export const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const PrimaryButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background: var(--success-color);
  color: white;
  font-weight: 700;
  font-size: 18px;
  border: none;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
`;

export const ShieldButton = styled.button`
  padding: 16px;
  border-radius: 12px;
  background: var(--warning-color);
  color: white;
  font-weight: 700;
  font-size: 16px;
  border: none;
  cursor: pointer;
  margin-top: 8px;
`;

export const DangerButton = styled.button`
  padding: 16px;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: var(--danger-color);
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  margin-top: 8px;
`;
