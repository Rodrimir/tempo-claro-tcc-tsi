import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { BackHandler, Modal, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Feather } from '@expo/vector-icons';
import { PasswordInput } from '../../components/common/PasswordInput';
import { useTheme } from 'styled-components/native';
import {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useAuth } from '../../contexts/AuthContext';
import { useThemeToggle } from '../../contexts/ThemeToggleContext';
import { useToast } from '../../contexts/ToastContext';
import { criarLoginSchema, criarRegisterSchema, TAMANHO_MINIMO_SENHA } from './validation';

import luaFlutuando from '../../../assets/lua_flutuando.png';
import solFlutuando from '../../../assets/sol_flutuando.webp';
import { useI18n } from '../../contexts/LanguageContext';

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
} from './styles';

const Login = () => {
  const { t, idioma, setIdioma, idiomas } = useI18n();

  // Reconstruídos quando o idioma muda: as mensagens de erro do yup são texto
  // fixo no momento da criação do schema, não no momento da validação.
  const loginSchema = useMemo(() => criarLoginSchema(t), [t]);
  const registerSchema = useMemo(() => criarRegisterSchema(t), [t]);
  const { isDark, tema, setTema } = useThemeToggle();
  const { login, register: registerConta } = useAuth();
  const { addToast } = useToast();
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

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, []);

  const onSubmit = async (data) => {
    try {
      if (isLoginTab) {
        await login(data);
      } else {
        await registerConta({ ...data, idioma });
      }
      router.replace('/home');
    } catch (err) {
      addToast(err.response?.data?.message || err.message || t('login.erroAutenticar'), 'error');
    }
  };

  return (
    <LoginContainer style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
      <MenuBtn
        style={{ top: insets.top + 24 }}
        onPress={() => setShowSettings(true)}
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
            <TabButton $active={isLoginTab} onPress={() => setIsLoginTab(true)}>
              <TabButtonText $active={isLoginTab}>{t('login.tabEntrar')}</TabButtonText>
            </TabButton>
            <TabButton $active={!isLoginTab} onPress={() => setIsLoginTab(false)}>
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
                    placeholder="seu@email.com"
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
                  <PasswordInput placeholder="••••••••" value={value} onChangeText={onChange} onBlur={onBlur} />
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
                </Requisitos>
              )}
            </FormGroup>

            {!isLoginTab && (
              <FormGroup>
                <Label>{t('login.confirmeSenha')}</Label>
                <Controller
                  control={control}
                  name="confirmarSenha"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <PasswordInput placeholder="••••••••" value={value} onChangeText={onChange} onBlur={onBlur} />
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

            <SubmitButton disabled={isSubmitting} onPress={handleSubmit(onSubmit)}>
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
                    onPress={() => setIdioma(codigo)}
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
                  onPress={() => setTema('claro')}
                >
                  <Feather name="sun" size={16} color={tema === 'claro' ? theme.primaryColor : theme.textSecondary} />
                </ThemeOptionButton>
                <ThemeOptionButton
                  $active={tema === 'escuro'}
                  accessibilityLabel={t('perfil.temaEscuroLabel')}
                  onPress={() => setTema('escuro')}
                >
                  <Feather name="moon" size={16} color={tema === 'escuro' ? theme.primaryColor : theme.textSecondary} />
                </ThemeOptionButton>
              </ThemeSegmentedControl>
            </SettingsRow>
            <SettingsCloseButton onPress={() => setShowSettings(false)}>
              <SettingsCloseButtonText>{t('login.fechar')}</SettingsCloseButtonText>
            </SettingsCloseButton>
          </SettingsModalContent>
        </SettingsModalOverlay>
      </Modal>
    </LoginContainer>
  );
};

export default Login;
