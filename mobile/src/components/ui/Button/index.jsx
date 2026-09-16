import { ActivityIndicator } from 'react-native';
import { useTheme } from 'styled-components/native';
import { StyledButton, ButtonText } from './styles';

/**
 * PLANO_REESTRUTURACAO.md, A.2 — substitui as 11 definições próprias de botão
 * primário que existiam espalhadas pelas telas (SubmitButton, RetryButton,
 * BuyButton, NextButton, ReadyButton, ConfirmButton...), todas com o mesmo
 * visual (fundo primaryStrong, texto branco, raio total) sob nomes diferentes.
 *
 * `variant`: primary (padrão) | danger | secondary | ghost.
 */
export function Button({ children, variant = 'primary', loading = false, disabled = false, compact = false, fullWidth = true, icon, onPress, accessibilityLabel, style }) {
  const theme = useTheme();
  const desabilitado = disabled || loading;

  const corIcone = variant === 'secondary' || variant === 'ghost' ? theme.textPrimary : 'white';
  const corSpinner = variant === 'secondary' || variant === 'ghost' ? theme.textSecondary : 'white';

  return (
    <StyledButton
      onPress={desabilitado ? undefined : onPress}
      disabled={desabilitado}
      $variant={variant}
      $compact={compact}
      $fullWidth={fullWidth}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: desabilitado, busy: loading }}
      style={style}
    >
      {loading ? <ActivityIndicator color={corSpinner} size="small" /> : icon ? icon(corIcone) : null}
      <ButtonText $variant={variant} $compact={compact}>
        {children}
      </ButtonText>
    </StyledButton>
  );
}

export default Button;
