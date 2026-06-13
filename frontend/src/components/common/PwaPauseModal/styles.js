import styled from 'styled-components';

export const Overlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  z-index: 300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const ModalCard = styled.div`
  background: var(--bg-surface);
  width: 100%;
  border-radius: 24px;
  padding: 32px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
`;

export const Title = styled.h2`
  font-size: 24px;
  font-weight: 800;
  margin-bottom: 16px;
  color: var(--text-primary);
`;

export const Description = styled.p`
  font-size: 16px;
  color: var(--text-secondary);
  margin-bottom: 32px;
  line-height: 1.5;
`;

export const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const PrimaryButton = styled.button`
  width: 100%;
  padding: 20px;
  border-radius: 12px;
  background: var(--primary-color);
  color: white;
  font-weight: 700;
  font-size: 18px;
  border: none;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
`;

export const SecondaryButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background: transparent;
  border: 2px solid var(--border-color);
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
`;
