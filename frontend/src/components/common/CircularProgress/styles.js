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

// @audit-ok [E2.7 (item 3) — $editavel só existe pra dar a dica visual de
// "isto é clicável" quando onQuantityChange foi passado; sem callback, o
// número continua com a aparência de sempre (cursor padrão).]
export const QuantityText = styled.div`
  font-size: 32px;
  font-weight: 800;
  color: ${(props) => props.theme.textPrimary};
  cursor: ${(props) => props.$editavel ? 'pointer' : 'inherit'};
`;

// @audit-ok [E2.7 (item 3) — substitui QuantityText enquanto o usuário digita
// o valor manualmente.]
export const QuantityInput = styled.input`
  font-size: 32px;
  font-weight: 800;
  font-family: inherit;
  color: ${(props) => props.theme.textPrimary};
  background: transparent;
  border: none;
  border-bottom: 2px solid ${(props) => props.theme.primaryColor};
  text-align: center;
  width: 100px;
  outline: none;

  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

export const MetaText = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: ${(props) => props.theme.textSecondary};
`;
