import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useI18n } from '@/contexts/LanguageContext';
import { Wrapper, StyledInput, ToggleButton } from './styles';

export function PasswordInput({ value, onChangeText, onBlur, placeholder, ...resto }) {
  const theme = useTheme();
  const { t } = useI18n();
  const [visivel, setVisivel] = useState(false);

  return (
    <Wrapper>
      <StyledInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        secureTextEntry={!visivel}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
        importantForAutofill="no"
        textContentType="oneTimeCode"
        {...resto}
      />
      <ToggleButton
        onPress={() => setVisivel((atual) => !atual)}
        accessibilityRole="button"
        accessibilityLabel={visivel ? t('comum.ocultarSenha') : t('comum.mostrarSenha')}
        hitSlop={8}
      >
        <Feather name={visivel ? 'eye-off' : 'eye'} size={20} color={theme.textSecondary} />
      </ToggleButton>
    </Wrapper>
  );
}

