import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useI18n } from '@/contexts/LanguageContext';
import { Wrapper, StyledInput, ToggleButton } from './styles';

// @note - 1.1 (Cadastro) PasswordInput: compartilhado entre o campo "senha" do login, o "senha" do
// cadastro e o "confirmarSenha" do cadastro (Login/index.jsx). textContentType/autoComplete têm
// default de campo de senha existente ("password"); os call sites do cadastro sobrescrevem para
// "newPassword"/"new-password" via props (o spread de {...resto} é o último, então sempre vence).
// @audit-issue - 1.1 (Cadastro) [outcome: fixed] o default antigo usava
// textContentType="oneTimeCode" (o content type de código de SMS/OTP do iOS, não de senha) e
// autoComplete="off" + importantForAutofill="no", desligando de propósito o gerenciador de senhas
// nativo. No cadastro isso impedia o iOS/Android de sugerir "Senha Forte" ao criar a conta e de
// salvar a credencial no fim do fluxo. Corrigido para os valores corretos de campo de senha.
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
        autoComplete="password"
        importantForAutofill="yes"
        textContentType="password"
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

