import styled from 'styled-components';

export const ProgressContainer = styled.div`
  position: relative;
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const SvgElement = styled.svg`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
`;

export const BackgroundCircle = styled.circle`
  fill: none;
  stroke: ${(props) => props.theme.primaryLight};
  stroke-width: 12;
`;

export const ProgressCircle = styled.circle`
  fill: none;
  stroke: ${(props) => props.$isDone ? props.theme.successColor : props.theme.primaryColor};
  stroke-width: 12;
  stroke-dasharray: 565;
  stroke-dashoffset: ${(props) => 565 - (565 * props.$percent) / 100};
  transition: stroke-dashoffset 0.5s ease, stroke 0.5s ease;
`;

export const TextContainer = styled.div`
  z-index: 1;
  text-align: center;
`;

export const QuantityText = styled.div`
  font-size: 32px;
  font-weight: 800;
  color: ${(props) => props.theme.textPrimary};
`;

export const MetaText = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.textSecondary};
`;
