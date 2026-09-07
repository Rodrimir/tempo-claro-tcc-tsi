import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Modal, ActivityIndicator } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Feather } from '@expo/vector-icons';
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
import { loginSchema, registerSchema } from './validation';

import luaFlutuando from '../../../assets/lua_flutuando.png';
import solFlutuando from '../../../assets/sol_flutuando.webp';

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
  const { isDark, tema, setTema } = useThemeToggle();
  const { login, register: registerConta } = useAuth();
  const { addToast } = useToast();
  const router = useRouter();
  const theme = useTheme();

  const [isLoginTab, setIsLoginTab] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(isLoginTab ? loginSchema : registerSchema),
    defaultValues: { nome: '', email: '', senha: '', confirmarSenha: '' },
  });

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

  const onSubmit = async (data) => {
    try {
      if (isLoginTab) {
        await login(data);
      } else {
        await registerConta(data);
      }
      router.replace('/home');
    } catch (err) {
      addToast(err.response?.data?.message || err.message || 'Erro ao autenticar. Tente novamente.', 'error');
    }
  };

  return (
    <LoginContainer>
      <MenuBtn onPress={() => setShowSettings(true)} accessibilityLabel="Abrir configurações">
        <Feather name="menu" size={28} color={theme.textPrimary} />
      </MenuBtn>

      <HeaderWrapper>
        <LogoWrapper style={estiloFlutuar}>
          <LogoImage source={isDark ? luaFlutuando : solFlutuando} contentFit="contain" />
        </LogoWrapper>
        <Title>Tempo Claro</Title>
        <Subtitle>Foco que flui como a natureza.</Subtitle>
      </HeaderWrapper>

      <TabContainer>
        <TabButton $active={isLoginTab} onPress={() => setIsLoginTab(true)}>
          <TabButtonText $active={isLoginTab}>Entrar</TabButtonText>
        </TabButton>
        <TabButton $active={!isLoginTab} onPress={() => setIsLoginTab(false)}>
          <TabButtonText $active={!isLoginTab}>Criar Conta</TabButtonText>
        </TabButton>
      </TabContainer>

      <FormContainer>
        {!isLoginTab && (
          <FormGroup>
            <Label>Seu Nome</Label>
            <Controller
              control={control}
              name="nome"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input placeholder="Como quer ser chamado?" value={value} onChangeText={onChange} onBlur={onBlur} />
              )}
            />
            {errors.nome && <ErrorText>{errors.nome.message}</ErrorText>}
          </FormGroup>
        )}

        <FormGroup>
          <Label>E-mail</Label>
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
          <Label>Senha</Label>
          <Controller
            control={control}
            name="senha"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input placeholder="••••••••" secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} />
            )}
          />
          {errors.senha && <ErrorText>{errors.senha.message}</ErrorText>}
        </FormGroup>

        {!isLoginTab && (
          <FormGroup>
            <Label>Confirme a Senha</Label>
            <Controller
              control={control}
              name="confirmarSenha"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input placeholder="••••••••" secureTextEntry value={value} onChangeText={onChange} onBlur={onBlur} />
              )}
            />
            {errors.confirmarSenha && <ErrorText>{errors.confirmarSenha.message}</ErrorText>}
          </FormGroup>
        )}

        <SubmitButton disabled={isSubmitting} onPress={handleSubmit(onSubmit)}>
          {isSubmitting ? (
            <>
              <ActivityIndicator color="white" size="small" />
              <SubmitButtonText disabled={isSubmitting}>Processando...</SubmitButtonText>
            </>
          ) : (
            <SubmitButtonText disabled={isSubmitting}>{isLoginTab ? 'Entrar' : 'Criar Conta'}</SubmitButtonText>
          )}
        </SubmitButton>
      </FormContainer>

      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <SettingsModalOverlay>
          <SettingsModalContent>
            <ModalTitle>Configurações</ModalTitle>
            <SettingsRow>
              <SettingsRowLabel>
                <Feather name="globe" size={20} color={theme.textPrimary} />
                <SettingsRowLabelText>Idioma</SettingsRowLabelText>
              </SettingsRowLabel>
              <LanguageChip>
                <LanguageChipText>🇧🇷 PT</LanguageChipText>
              </LanguageChip>
            </SettingsRow>
            <SettingsRow $last>
              <SettingsRowLabel>
                <Feather name={isDark ? 'moon' : 'sun'} size={20} color={theme.textPrimary} />
                <SettingsRowLabelText>Tema</SettingsRowLabelText>
              </SettingsRowLabel>
              <ThemeSegmentedControl>
                <ThemeOptionButton
                  $active={tema === 'claro'}
                  accessibilityLabel="Tema claro"
                  onPress={() => setTema('claro')}
                >
                  <Feather name="sun" size={16} color={tema === 'claro' ? theme.primaryColor : theme.textSecondary} />
                </ThemeOptionButton>
                <ThemeOptionButton
                  $active={tema === 'escuro'}
                  accessibilityLabel="Tema escuro"
                  onPress={() => setTema('escuro')}
                >
                  <Feather name="moon" size={16} color={tema === 'escuro' ? theme.primaryColor : theme.textSecondary} />
                </ThemeOptionButton>
                <ThemeOptionButton
                  $active={tema === 'sistema'}
                  accessibilityLabel="Tema do sistema"
                  onPress={() => setTema('sistema')}
                >
                  <Feather name="monitor" size={16} color={tema === 'sistema' ? theme.primaryColor : theme.textSecondary} />
                </ThemeOptionButton>
              </ThemeSegmentedControl>
            </SettingsRow>
            <SettingsCloseButton onPress={() => setShowSettings(false)}>
              <SettingsCloseButtonText>Fechar</SettingsCloseButtonText>
            </SettingsCloseButton>
          </SettingsModalContent>
        </SettingsModalOverlay>
      </Modal>
    </LoginContainer>
  );
};

export default Login;
