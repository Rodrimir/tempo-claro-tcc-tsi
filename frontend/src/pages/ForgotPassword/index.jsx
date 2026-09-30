import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { PasswordInput } from '../../components/common/PasswordInput';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useI18n } from '../../contexts/LanguageContext';
import { useSfx } from '../../contexts/SoundContext';
import { forgotPassword } from '../../services/api';
import { TAMANHO_MINIMO_SENHA, RE_MAIUSCULA, RE_ESPECIAL } from '../Login/validation';
import {
  Container,
  Header,
  BackButton,
  HeaderText,
  Title,
  Subtitle,
  StepDots,
  Dot,
  Card,
  StepTitle,
  StepText,
  FormGroup,
  Label,
  Input,
  CodeInput,
  ErrorText,
  PrimaryButton,
  PrimaryButtonText,
  Requisitos,
  RequisitoLinha,
  RequisitoTexto,
  ResendRow,
  ResendLink,
  ResendText,
} from './styles';

const COOLDOWN_INICIAL = 30;

const ForgotPassword = () => {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { redefinirSenha } = useAuth();
  const { addToast } = useToast();
  const { t } = useI18n();
  const { tocar } = useSfx();

  const [passo, setPasso] = useState(1);
  const [email, setEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((v) => v - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const tamanhoOk = novaSenha.length >= TAMANHO_MINIMO_SENHA;
  const maiusculaOk = RE_MAIUSCULA.test(novaSenha);
  const especialOk = RE_ESPECIAL.test(novaSenha);
  const confereOk = novaSenha.length > 0 && novaSenha === confirmacao;
  const senhaValida = tamanhoOk && maiusculaOk && especialOk;

  const voltar = () => {
    tocar('voltar');
    if (passo === 2) {
      setPasso(1);
      setErro('');
      return;
    }
    router.back();
  };

  const enviarCodigo = async () => {
    if (!email) {
      setErro(t('validacao.campoObrigatorio'));
      return;
    }
    setOcupado(true);
    setErro('');
    try {
      await forgotPassword({ email });
      setCooldown(COOLDOWN_INICIAL);
      setPasso(2);
    } catch (err) {
      setErro(err.response?.data?.message || t('recuperarSenha.erroPadrao'));
    } finally {
      setOcupado(false);
    }
  };

  const reenviarCodigo = async () => {
    setReenviando(true);
    try {
      await forgotPassword({ email });
      addToast(t('verificarEmail.codigoReenviado'), 'success');
      setCooldown(COOLDOWN_INICIAL);
    } catch (err) {
      addToast(err.response?.data?.message || t('recuperarSenha.erroPadrao'), 'error');
    } finally {
      setReenviando(false);
    }
  };

  const redefinir = async () => {
    if (codigo.length !== 6) {
      setErro(t('validacao.preenchaTudo'));
      return;
    }
    if (!tamanhoOk) {
      setErro(t('validacao.senhaCurta', { minimo: TAMANHO_MINIMO_SENHA }));
      return;
    }
    if (!maiusculaOk) {
      setErro(t('validacao.senhaSemMaiuscula'));
      return;
    }
    if (!especialOk) {
      setErro(t('validacao.senhaSemEspecial'));
      return;
    }
    if (!confereOk) {
      setErro(t('validacao.confirmacaoNaoBate'));
      return;
    }
    setOcupado(true);
    setErro('');
    try {
      await redefinirSenha(email, codigo, novaSenha);
      addToast(t('recuperarSenha.sucesso'), 'success');
      router.replace('/home');
    } catch (err) {
      setErro(err.response?.data?.message || t('recuperarSenha.erroPadrao'));
      setOcupado(false);
    }
  };

  const requisito = (ok, texto) => (
    <RequisitoLinha>
      <Feather
        name={ok ? 'check-circle' : 'circle'}
        size={15}
        color={ok ? theme.successColor : theme.textSecondary}
      />
      <RequisitoTexto $ok={ok}>{texto}</RequisitoTexto>
    </RequisitoLinha>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100}
    >
      <Container $insetTop={insets.top}>
        <Header>
          <BackButton onPress={voltar} accessibilityLabel={t('comum.voltar')}>
            <Feather name="arrow-left" size={26} color={theme.textPrimary} />
          </BackButton>
          <HeaderText>
            <Title>{t('recuperarSenha.titulo')}</Title>
            <Subtitle>{t('criar.passoDe', { atual: passo, total: 2 })}</Subtitle>
          </HeaderText>
        </Header>

        <StepDots>
          <Dot $active />
          <Dot $active={passo === 2} />
        </StepDots>

        {passo === 1 ? (
          <Card>
            <StepTitle>{t('recuperarSenha.tituloEmail')}</StepTitle>
            <StepText>{t('recuperarSenha.textoEmail')}</StepText>

            <FormGroup>
              <Label>{t('login.email')}</Label>
              <Input
                placeholder={t('login.emailPlaceholder')}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  setErro('');
                }}
              />
              {erro ? <ErrorText>{erro}</ErrorText> : null}
            </FormGroup>

            <PrimaryButton
              onPress={() => {
                tocar('continuar');
                enviarCodigo();
              }}
              disabled={ocupado}
              $disabled={ocupado}
            >
              {ocupado ? <ActivityIndicator color="white" size="small" /> : null}
              <PrimaryButtonText $disabled={ocupado}>
                {ocupado ? t('recuperarSenha.enviando') : t('recuperarSenha.botaoEnviarCodigo')}
              </PrimaryButtonText>
            </PrimaryButton>
          </Card>
        ) : (
          <Card>
            <StepTitle>{t('recuperarSenha.tituloRedefinir')}</StepTitle>
            <StepText>{t('recuperarSenha.textoRedefinir', { email })}</StepText>

            <FormGroup>
              <Label>{t('recuperarSenha.rotuloCodigo')}</Label>
              <CodeInput
                placeholder="000000"
                value={codigo}
                onChangeText={(v) => {
                  setCodigo(v.replace(/[^0-9]/g, '').slice(0, 6));
                  setErro('');
                }}
              />
            </FormGroup>

            <ResendRow>
              <ResendLink
                onPress={() => {
                  tocar('tap');
                  reenviarCodigo();
                }}
                disabled={cooldown > 0 || reenviando}
              >
                <ResendText $disabled={cooldown > 0 || reenviando}>
                  {cooldown > 0
                    ? t('verificarEmail.reenviarEm', { segundos: cooldown })
                    : t('verificarEmail.reenviar')}
                </ResendText>
              </ResendLink>
            </ResendRow>

            <FormGroup>
              <Label>{t('perfil.novaSenha')}</Label>
              <PasswordInput
                value={novaSenha}
                onChangeText={(v) => {
                  setNovaSenha(v);
                  setErro('');
                }}
                placeholder="••••••••"
              />
            </FormGroup>

            <FormGroup>
              <Label>{t('perfil.confirmarNovaSenha')}</Label>
              <PasswordInput
                value={confirmacao}
                onChangeText={(v) => {
                  setConfirmacao(v);
                  setErro('');
                }}
                placeholder="••••••••"
              />
            </FormGroup>

            <Requisitos>
              {requisito(tamanhoOk, t('validacao.senhaCurta', { minimo: TAMANHO_MINIMO_SENHA }))}
              {requisito(maiusculaOk, t('validacao.senhaSemMaiuscula'))}
              {requisito(especialOk, t('validacao.senhaSemEspecial'))}
              {requisito(confereOk, t('perfil.requisitoConfere'))}
            </Requisitos>

            {erro ? <ErrorText>{erro}</ErrorText> : null}

            <PrimaryButton
              onPress={() => {
                tocar('continuar');
                redefinir();
              }}
              disabled={ocupado || !senhaValida || !confereOk}
              $disabled={ocupado || !senhaValida || !confereOk}
            >
              {ocupado ? <ActivityIndicator color="white" size="small" /> : null}
              <PrimaryButtonText $disabled={ocupado || !senhaValida || !confereOk}>
                {ocupado ? t('recuperarSenha.redefinindo') : t('recuperarSenha.botaoRedefinir')}
              </PrimaryButtonText>
            </PrimaryButton>
          </Card>
        )}
      </Container>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;
