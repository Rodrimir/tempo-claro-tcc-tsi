import styled, { keyframes } from 'styled-components';

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100%;
  background-color: ${(props) => props.theme.bgPrimary};
  color: ${(props) => props.theme.textPrimary};
`;

export const LoadingText = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 30px;
  min-width: 150px;
  text-align: center;
`;

export const SunImage = styled.img`
  width: 120px;
  height: 120px;
  animation: ${spin} 4s linear infinite;
  object-fit: contain;
`;
