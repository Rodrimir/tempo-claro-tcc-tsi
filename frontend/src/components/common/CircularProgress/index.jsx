import React, { useState } from 'react';
import {
  ProgressContainer,
  SvgElement,
  BackgroundCircle,
  ProgressCircle,
  TextContainer,
  QuantityText,
  QuantityInput,
  MetaText
} from './styles';

// @audit-ok [E2.7 (item 3) — tocar no número central abre um campo numérico
// pra digitar o valor direto, em vez de só poder chegar lá via -N/+N.
// onQuantityChange é opcional: sem ele, o número continua só de leitura (mesmo
// comportamento de antes da E2.7), pro componente seguir reutilizável em
// qualquer outro lugar que só queira mostrar progresso.]
const CircularProgress = ({ quantity, meta_base, onQuantityChange }) => {
  const [editando, setEditando] = useState(false);
  const [valorDigitado, setValorDigitado] = useState('');

  const isQuantityDone = quantity >= meta_base;
  const progressPercent = Math.min((quantity / meta_base) * 100, 100);

  const iniciarEdicao = () => {
    if (!onQuantityChange) return;
    setValorDigitado(String(quantity));
    setEditando(true);
  };

  const confirmarEdicao = () => {
    // @audit-ok [Item 4 — mesma regra de sempre: nunca abaixo de zero, sem
    // teto superior (um valor digitado bem acima da meta é permitido, igual
    // já era permitido via -N/+N).]
    const numero = Math.max(0, parseInt(valorDigitado, 10) || 0);
    onQuantityChange(numero);
    setEditando(false);
  };

  const cancelarEdicao = () => setEditando(false);

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
        {editando ? (
          <QuantityInput
            type="number"
            min="0"
            autoFocus
            value={valorDigitado}
            onChange={e => setValorDigitado(e.target.value)}
            onBlur={confirmarEdicao}
            onKeyDown={e => {
              if (e.key === 'Enter') confirmarEdicao();
              if (e.key === 'Escape') cancelarEdicao();
            }}
          />
        ) : (
          <QuantityText
            onClick={iniciarEdicao}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); iniciarEdicao(); } }}
            role={onQuantityChange ? 'button' : undefined}
            tabIndex={onQuantityChange ? 0 : undefined}
            aria-label={onQuantityChange ? 'Editar quantidade manualmente' : undefined}
            $editavel={Boolean(onQuantityChange)}
          >
            {quantity}
          </QuantityText>
        )}
        <MetaText>/ {meta_base}</MetaText>
      </TextContainer>
    </ProgressContainer>
  );
};

export default CircularProgress;
