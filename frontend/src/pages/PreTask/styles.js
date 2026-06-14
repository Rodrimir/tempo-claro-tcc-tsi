// @audit-ok: FRONTEND-styles.js-01
import styled from 'styled-components';

export const PreTaskContainer = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100vh;
  justify-content: center;
  background: var(--primary-color);
  color: white;
`;

export const BackButtonWrapper = styled.div`
  position: absolute;
  top: 24px;
  left: 24px;
`;

export const BackButton = styled.button`
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 320px;
  margin: 0 auto;
`;

export const QuoteText = styled.h2`
  font-size: 24px;
  font-weight: 700;
  line-height: 1.4;
  margin-bottom: 16px;
`;

export const ActionWrapper = styled.div`
  padding-bottom: 24px;
  width: 100%;
`;

export const ReadyButton = styled.button`
  background: white;
  color: var(--primary-color);
  font-size: 18px;
  font-weight: 700;
  padding: 20px;
  width: 100%;
  border-radius: 9999px;
  border: none;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  cursor: pointer;
`;
