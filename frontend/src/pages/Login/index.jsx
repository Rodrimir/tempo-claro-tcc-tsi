import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { BackHandler, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Feather } from '@expo/vector-icons';
import { PasswordInput } from '@/components/common/PasswordInput';
import { useTheme } from 'styled-components/native';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useAuth } from '@/contexts/AuthContext';
import { useThemeToggle } from '@/contexts/ThemeToggleContext';
import { useToast } from '@/contexts/ToastContext';
import { useSfx } from '@/contexts/SoundContext';
import { getApiErrorMessage } from '@/utils/erros';
import { criarLoginSchema, criarRegisterSchema, TAMANHO_MINIMO_SENHA, RE_MAIUSCULA, RE_ESPECIAL } from './validation';

import luaFlutuando from '@/assets/lua_flutuando.png';
import solFlutuando from '@/assets/sol_flutuando.webp';
import { useI18n } from '@/contexts/LanguageContext';

import {
  LoginContainer,
  MenuBtn,
  HeaderWrapper,
  LogoWrapper,
  LogoImage,
  Title,
  Subtitle,
  TabContainer,
  TabButton,
  TabButtonText,
  FormContainer,
  FormGroup,
  Label,
  Input,
  ErrorText,
  Requisitos,
  RequisitoLinha,
  RequisitoTexto,
  SubmitButton,
  SubmitButtonText,
  SettingsModalOverlay,
  SettingsModalContent,
  ModalTitle,
  SettingsRow,
  SettingsRowLabel,
  SettingsRowLabelText,
  ThemeSegmentedControl,
  ThemeOptionButton,
  LanguageChip,
  LanguageChipText,
  SettingsCloseButton,
  SettingsCloseButtonText,
  ForgotPasswordLink,
  ForgotPasswordText,
} from './styles';

// @note - 1.1 (Cadastro) Componente Login: um único formulário react-hook-form atende as abas
// "Entrar" e "Criar Conta". A aba ativa (isLoginTab) decide o schema de validação (registerSchema
// quando é cadastro) e quais campos existem: nome e confirmarSenha só existem nesta aba. Ver
// README §8 > Cadastro > item 1.
const Login = () => {
  const { t, idioma, setIdioma, idiomas } = useI18n();

  const loginSchema = useMemo(() => criarLoginSchema(t), [t]);
  const registerSchema = useMemo(() => criarRegisterSchema(t), [t]);
  const { isDark, tema, setTema } = useThemeToggle();
  const { login, register: registerConta } = useAuth();
  const { addToast } = useToast();
  const { tocar } = useSfx();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(isLoginTab ? loginSchema : registerSchema),
    defaultValues: { nome: '', email: '', senha: '', confirmarSenha: '' },
  });

  const senhaDigitada = watch('senha');
  const confirmacaoDigitada = watch('confirmarSenha');
  const tamanhoOk = (senhaDigitada || '').length >= TAMANHO_MINIMO_SENHA;
  const maiusculaOk = RE_MAIUSCULA.test(senhaDigitada || '');
  const especialOk = RE_ESPECIAL.test(senhaDigitada || '');
  const confereOk = Boolean(senhaDigitada) && senhaDigitada === confirmacaoDigitada;

  const flutuar = useSharedValue(0);
  useEffect(() => {
    flutuar.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1
    );
  }, []);
  const estiloFlutuar = useAnimatedStyle(() => ({
    transform: [{ translateY: flutuar.value }],
  }));

  // @audit-info - 1.1 (Cadastro) o botão físico de voltar do Android é interceptado para toda a
  // tela (retorna true = evento consumido): não existe caminho para sair desta tela pelo botão de
  // voltar do aparelho, inclusive na aba de cadastro.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  const onSubmit = async (data) => {
    try {
      if (isLoginTab) {
        await login(data);
        router.replace('/home');
      } else {
        // @note - 1.2 (Cadastro) ramo cadastro (isLoginTab === false): chama registerConta (ver
        // README §8 > Cadastro > item 3), mostra toast de sucesso e navega para a verificação de
        // e-mail.
        await registerConta({ ...data, idioma });
        addToast(t('login.cadastroRecebido'), 'success');
        // @note - 15.1 (Cadastro) handoff: router.replace para /verify-email com o e-mail como
        // parâmetro. O cadastro termina aqui; a confirmação do código é outra funcionalidade.
        router.replace({ pathname: '/verify-email', params: { email: data.email } });
      }
    } catch (err) {
      // @note - 1.3 (Cadastro) ramo catch: qualquer falha do cadastro toca som de erro e mostra
      // toast com a mensagem traduzida (ver README §8 > Cadastro > item 14); a tela permanece na
      // aba de cadastro para nova tentativa, sem perder os valores já digitados. O ramo abaixo
      // (isLoginTab && status 403) é específico do login, não do cadastro.
      if (isLoginTab && err.response?.status === 403) {
        addToast(getApiErrorMessage(err, t('login.erroAutenticar')), 'error');
        router.replace({ pathname: '/verify-email', params: { email: data.email } });
        return;
      }
      tocar('erro');
      addToast(getApiErrorMessage(err, err.message || t('login.erroAutenticar')), 'error');
    }
  };

  return (
    <LoginContainer style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
      <MenuBtn
        style={{ top: insets.top + 24 }}
        onPress={() => {
          tocar('open');
          setShowSettings(true);
        }}
        accessibilityLabel={t('login.abrirConfiguracoes')}
      >
        <Feather name="menu" size={28} color={theme.textPrimary} />
      </MenuBtn>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <HeaderWrapper>
            <LogoWrapper style={estiloFlutuar}>
              <LogoImage source={isDark ? luaFlutuando : solFlutuando} contentFit="contain" />
            </LogoWrapper>
            <Title>Tempo Claro</Title>
            <Subtitle>{t('login.slogan')}</Subtitle>
          </HeaderWrapper>

          <TabContainer>
            <TabButton
              $active={isLoginTab}
              onPress={() => {
                tocar('alternar');
                setIsLoginTab(true);
              }}
            >
              <TabButtonText $active={isLoginTab}>{t('login.tabEntrar')}</TabButtonText>
            </TabButton>
            <TabButton
              $active={!isLoginTab}
              onPress={() => {
                tocar('alternar');
                setIsLoginTab(false);
              }}
            >
              <TabButtonText $active={!isLoginTab}>{t('login.criarConta')}</TabButtonText>
            </TabButton>
          </TabContainer>

          <FormContainer>
            {!isLoginTab && (
              <FormGroup>
                <Label>{t('login.seuNome')}</Label>
                <Controller
                  control={control}
                  name="nome"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input placeholder={t('login.comoQuerSerChamado')} value={value} onChangeText={onChange} onBlur={onBlur} />
                  )}
                />
                {errors.nome && <ErrorText>{errors.nome.message}</ErrorText>}
              </FormGroup>
            )}

            <FormGroup>
              <Label>{t('login.email')}</Label>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder={t('login.emailPlaceholder')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
              {errors.email && <ErrorText>{errors.email.message}</ErrorText>}
            </FormGroup>

            <FormGroup>
              <Label>{t('login.senha')}</Label>
              <Controller
                control={control}
                name="senha"
                render={({ field: { onChange, onBlur, value } }) => (
                  // @note - 1.1 (Cadastro) mesmo campo "senha" atende login e cadastro;
                  // textContentType/autoComplete mudam conforme a aba: "password" ao entrar
                  // (senha existente), "newPassword"/"new-password" ao criar conta (senha nova,
                  // habilita a sugestão de senha forte do sistema). Ver PasswordInput/index.jsx.
                  <PasswordInput
                    placeholder="••••••••"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    textContentType={isLoginTab ? 'password' : 'newPassword'}
                    autoComplete={isLoginTab ? 'password' : 'new-password'}
                  />
                )}
              />
              {errors.senha && <ErrorText>{errors.senha.message}</ErrorText>}
              {!isLoginTab && (
                <Requisitos>
                  <RequisitoLinha>
                    <Feather
                      name={tamanhoOk ? 'check-circle' : 'circle'}
                      size={14}
                      color={tamanhoOk ? theme.successColor : theme.textSecondary}
                    />
                    <RequisitoTexto $ok={tamanhoOk}>
                      {t('validacao.senhaCurta', { minimo: TAMANHO_MINIMO_SENHA })}
                    </RequisitoTexto>
                  </RequisitoLinha>
                  <RequisitoLinha>
                    <Feather
                      name={maiusculaOk ? 'check-circle' : 'circle'}
                      size={14}
                      color={maiusculaOk ? theme.successColor : theme.textSecondary}
                    />
                    <RequisitoTexto $ok={maiusculaOk}>{t('validacao.senhaSemMaiuscula')}</RequisitoTexto>
                  </RequisitoLinha>
                  <RequisitoLinha>
                    <Feather
                      name={especialOk ? 'check-circle' : 'circle'}
                      size={14}
                      color={especialOk ? theme.successColor : theme.textSecondary}
                    />
                    <RequisitoTexto $ok={especialOk}>{t('validacao.senhaSemEspecial')}</RequisitoTexto>
                  </RequisitoLinha>
                </Requisitos>
              )}
              {isLoginTab && (
                <ForgotPasswordLink
                  onPress={() => {
                    tocar('tap');
                    router.push('/forgot-password');
                  }}
                >
                  <ForgotPasswordText>{t('login.esqueciSenha')}</ForgotPasswordText>
                </ForgotPasswordLink>
              )}
            </FormGroup>

            {!isLoginTab && (
              <FormGroup>
                <Label>{t('login.confirmeSenha')}</Label>
                <Controller
                  control={control}
                  name="confirmarSenha"
                  render={({ field: { onChange, onBlur, value } }) => (
                    // @note - 1.1 (Cadastro) confirmarSenha só existe na aba de cadastro, então é
                    // sempre "senha nova" para o gerenciador de senhas nativo.
                    <PasswordInput
                      placeholder="••••••••"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      textContentType="newPassword"
                      autoComplete="new-password"
                    />
                  )}
                />
                {errors.confirmarSenha && <ErrorText>{errors.confirmarSenha.message}</ErrorText>}
                <Requisitos>
                  <RequisitoLinha>
                    <Feather
                      name={confereOk ? 'check-circle' : 'circle'}
                      size={14}
                      color={confereOk ? theme.successColor : theme.textSecondary}
                    />
                    <RequisitoTexto $ok={confereOk}>{t('perfil.requisitoConfere')}</RequisitoTexto>
                  </RequisitoLinha>
                </Requisitos>
              </FormGroup>
            )}

            <SubmitButton
              disabled={isSubmitting}
              onPress={() => {
                tocar('continuar');
                handleSubmit(onSubmit)();
              }}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator color="white" size="small" />
                  <SubmitButtonText disabled={isSubmitting}>{t('login.processando')}</SubmitButtonText>
                </>
              ) : (
                <SubmitButtonText disabled={isSubmitting}>{isLoginTab ? t('login.tabEntrar') : t('login.criarConta')}</SubmitButtonText>
              )}
            </SubmitButton>
          </FormContainer>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <SettingsModalOverlay>
          <SettingsModalContent>
            <ModalTitle>{t('login.configuracoes')}</ModalTitle>
            <SettingsRow>
              <SettingsRowLabel>
                <Feather name="globe" size={20} color={theme.textPrimary} />
                <SettingsRowLabelText>{t('perfil.idioma')}</SettingsRowLabelText>
              </SettingsRowLabel>
              <ThemeSegmentedControl>
                {Object.entries(idiomas).map(([codigo, info]) => (
                  <LanguageChip
                    key={codigo}
                    $active={idioma === codigo}
                    accessibilityLabel={info.nome}
                    onPress={() => {
                      tocar('alternar');
                      setIdioma(codigo);
                    }}
                  >
                    <LanguageChipText $active={idioma === codigo}>{info.bandeira}</LanguageChipText>
                    <LanguageChipText $active={idioma === codigo}>{info.curto}</LanguageChipText>
                  </LanguageChip>
                ))}
              </ThemeSegmentedControl>
            </SettingsRow>
            <SettingsRow $last>
              <SettingsRowLabel>
                <Feather name={isDark ? 'moon' : 'sun'} size={20} color={theme.textPrimary} />
                <SettingsRowLabelText>{t('perfil.tema')}</SettingsRowLabelText>
              </SettingsRowLabel>
              <ThemeSegmentedControl>
                <ThemeOptionButton
                  $active={tema === 'claro'}
                  accessibilityLabel={t('perfil.temaClaroLabel')}
                  onPress={() => {
                    tocar('alternar');
                    setTema('claro');
                  }}
                >
                  <Feather name="sun" size={16} color={tema === 'claro' ? theme.primaryColor : theme.textSecondary} />
                </ThemeOptionButton>
                <ThemeOptionButton
                  $active={tema === 'escuro'}
                  accessibilityLabel={t('perfil.temaEscuroLabel')}
                  onPress={() => {
                    tocar('alternar');
                    setTema('escuro');
                  }}
                >
                  <Feather name="moon" size={16} color={tema === 'escuro' ? theme.primaryColor : theme.textSecondary} />
                </ThemeOptionButton>
              </ThemeSegmentedControl>
            </SettingsRow>
            <SettingsCloseButton
              onPress={() => {
                tocar('close');
                setShowSettings(false);
              }}
            >
              <SettingsCloseButtonText>{t('login.fechar')}</SettingsCloseButtonText>
            </SettingsCloseButton>
          </SettingsModalContent>
        </SettingsModalOverlay>
      </Modal>
    </LoginContainer>
  );
};

export default Login;
