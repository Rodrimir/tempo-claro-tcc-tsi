import styled, { keyframes } from 'styled-components';

export const floatUp = keyframes`
  0% { transform: translateY(0) scale(1); opacity: 0; }
  20% { opacity: 1; }
  100% { transform: translateY(-100vh) scale(0.5); opacity: 0; }
`;

export const popIn = keyframes`
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
`;

export const SuccessContainer = styled.div`
  position: relative;
  overflow: hidden;
  height: 100vh;
  background: ${(props) => props.$isBonus ? '#0ea5e9' : 'var(--success-color)'}; /* ajustado para diferenciar o bonus */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: white;
`;

export const ParticlesWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
`;

export const Particle = styled.div`
  position: absolute;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  bottom: -20px;
  animation-name: ${floatUp};
  animation-timing-function: linear;
  animation-iteration-count: infinite;
  
  width: ${(props) => props.$size}px;
  height: ${(props) => props.$size}px;
  left: ${(props) => props.$left}%;
  animation-duration: ${(props) => props.$duration}s;
  animation-delay: ${(props) => props.$delay}s;
`;

export const ContentWrapper = styled.div`
  z-index: 1;
  text-align: center;
  width: 100%;
  max-width: 320px;
`;

export const IconWrapper = styled.div`
  font-size: 80px;
  margin-bottom: 16px;
  animation: ${popIn} 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
`;

export const Title = styled.h1`
  font-size: 32px;
  font-weight: 800;
  margin-bottom: 8px;
`;

export const Subtitle = styled.p`
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 32px;
`;

export const RewardCard = styled.div`
  background: rgba(0, 0, 0, 0.1);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 40px;
`;

export const Row = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const Label = styled.span`
  font-weight: 600;
  font-size: 18px;
`;

export const Value = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: 800;
  font-size: 24px;
`;

export const Divider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
  margin: 8px 0;
`;

export const BackButton = styled.button`
  width: 100%;
  padding: 20px;
  border-radius: 9999px;
  background: white;
  color: ${(props) => props.$isBonus ? '#0ea5e9' : 'var(--success-color)'};
  font-weight: 800;
  font-size: 18px;
  border: none;
  cursor: pointer;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s, background 0.2s;

  &:hover {
    background: #f8f9fa;
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }
`;
