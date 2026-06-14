// @audit-ok: FRONTEND-index.jsx-01
import React from 'react';
import {
  ProgressContainer,
  SvgElement,
  BackgroundCircle,
  ProgressCircle,
  TextContainer,
  QuantityText,
  MetaText
} from './styles';

const CircularProgress = ({ quantity, meta_base }) => {
  const isQuantityDone = quantity >= meta_base;
  const progressPercent = Math.min((quantity / meta_base) * 100, 100);

  return (
    <ProgressContainer>
      <SvgElement>
        <BackgroundCircle cx="100" cy="100" r="90" />
        <ProgressCircle 
          cx="100" 
          cy="100" 
          r="90" 
          $isDone={isQuantityDone}
          $percent={progressPercent}
        />
      </SvgElement>
      <TextContainer>
        <QuantityText>{quantity}</QuantityText>
        <MetaText>/ {meta_base}</MetaText>
      </TextContainer>
    </ProgressContainer>
  );
};

export default CircularProgress;
