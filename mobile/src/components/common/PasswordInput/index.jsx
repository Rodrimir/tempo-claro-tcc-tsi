import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useI18n } from '../../../contexts/LanguageContext';
import { Wrapper, StyledInput, ToggleButton } from './styles';

/**
 * Campo de senha com botão para revelar o texto digitado.
 *
 * Existe porque `secureTextEntry` sozinho não deixa a pessoa conferir o que
 * escreveu antes de enviar — no cadastro, isso é a diferença entre notar um erro
 * de digitação ali mesmo ou só descobrir depois, numa tentativa de login que falha
 * sem dizer por quê. O padrão do olho é o mesmo que a maioria dos apps usa, o que
 * poupa qualquer explicação na tela.
 *
 * O campo nasce sempre oculto (`visivel = false`): a pessoa opta por revelar, a
 * senha nunca aparece em texto claro sem uma ação explícita dela.
 */
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

export default PasswordInput;
