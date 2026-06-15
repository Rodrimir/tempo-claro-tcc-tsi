import styled from 'styled-components';

export const HeaderContainer = styled.header`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  padding: 16px 24px;
  background: var(--bg-surface);
  border-bottom: 1px solid var(--border-color);
`;

export const CoinsWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--warning-light);
  padding: 8px 16px;
  border-radius: 9999px;
  color: var(--warning-color);
  font-weight: 700;
  justify-self: start;
`;

export const FlameWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--danger-color);
  font-weight: 800;
  font-size: 18px;
  justify-self: center;
`;

export const ShieldButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--primary-light);
  padding: 8px 8px 8px 16px;
  border-radius: 9999px;
  color: var(--primary-color);
  font-weight: 700;
  cursor: pointer;
  border: 1px solid var(--primary-color);
  justify-self: end;
`;

export const PlusIconWrapper = styled.div`
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`;
