import { useState } from 'react';
import {
  ProgressContainer,
  SvgElement,
  BackgroundCircle,
  ProgressCircle,
  TextContainer,
  QuantityText,
  QuantityInput,
  MetaText,
} from './styles';

const RAIO = 90;
const CIRCUNFERENCIA = 565;

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
    const numero = Math.max(0, parseInt(valorDigitado, 10) || 0);
    onQuantityChange(numero);
    setEditando(false);
  };

  return (
    <ProgressContainer>
      <SvgElement width={200} height={200} style={{ transform: [{ rotate: '-90deg' }] }}>
        <BackgroundCircle cx={100} cy={100} r={RAIO} fill="none" strokeWidth={12} />
        <ProgressCircle
          cx={100}
          cy={100}
          r={RAIO}
          fill="none"
          strokeWidth={12}
          strokeDasharray={CIRCUNFERENCIA}
          strokeDashoffset={CIRCUNFERENCIA - (CIRCUNFERENCIA * progressPercent) / 100}
          $isDone={isQuantityDone}
        />
      </SvgElement>
      <TextContainer>
        {editando ? (
          <QuantityInput
            keyboardType="numeric"
            autoFocus
            value={valorDigitado}
            onChangeText={setValorDigitado}
            onBlur={confirmarEdicao}
            onSubmitEditing={confirmarEdicao}
          />
        ) : (
          <QuantityText
            onPress={onQuantityChange ? iniciarEdicao : undefined}
            accessibilityRole={onQuantityChange ? 'button' : undefined}
            accessibilityLabel={onQuantityChange ? 'Editar quantidade manualmente' : undefined}
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
