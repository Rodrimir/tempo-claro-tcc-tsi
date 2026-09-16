import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from 'styled-components/native';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { useI18n } from '../../contexts/LanguageContext';
import { useSfx } from '../../contexts/SoundContext';
import { resendVerificationCode } from '../../services/api';
import {
  Container,
  BackButton,
  Title,
  Subtitle,
  Card,
  FormGroup,
  Label,
  CodeInput,
  ErrorText,
  PrimaryButton,
  PrimaryButtonText,
  ResendRow,
  ResendLink,
  ResendText,
} from './styles';

const COOLDOWN_INICIAL = 30;

const VerifyEmail = () => {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { confirmarEmail } = useAuth();
  const { addToast } = useToast();
  const { t } = useI18n();
  const { tocar } = useSfx();
  const { email } = useLocalSearchParams();

  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [cooldown, setCooldown] = useState(COOLDOWN_INICIAL);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((v) => v - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const confirmar = async () => {
    if (codigo.length !== 6) {
      setErro(t('validacao.preenchaTudo'));
      return;
    }
    setOcupado(true);
    setErro('');
    try {
      await confirmarEmail(email, codigo);
      router.replace('/home');
    } catch (err) {
      tocar('erro');
      setErro(err.response?.data?.message || t('verificarEmail.erroPadrao'));
      setOcupado(false);
    }
  };

  const reenviar = async () => {
    setReenviando(true);
    try {
      await resendVerificationCode({ email });
      addToast(t('verificarEmail.codigoReenviado'), 'success');
      setCooldown(COOLDOWN_INICIAL);
    } catch (err) {
      addToast(err.response?.data?.message || t('verificarEmail.erroPadrao'), 'error');
    } finally {
      setReenviando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -100}
    >
      <Container $insetTop={insets.top}>
        <BackButton
          style={{ top: insets.top + 16 }}
          onPress={() => {
            tocar('voltar');
            // replace('/login'), não back(): tanto o cadastro quanto o login de
            // conta não verificada chegam aqui por router.replace, que troca a
            // rota em vez de empilhar. Sem histórico, back() não tem destino e
            // a navegação falha — voltar para o login é o destino real.
            router.replace('/login');
          }}
          accessibilityLabel={t('comum.voltar')}
        >
          <Feather name="arrow-left" size={26} color={theme.textPrimary} />
        </BackButton>

        <Title>{t('verificarEmail.titulo')}</Title>
        <Subtitle>{t('verificarEmail.subtitulo', { email })}</Subtitle>

        <Card>
          <FormGroup>
            <Label>{t('verificarEmail.rotuloCodigo')}</Label>
            <CodeInput
              placeholder="000000"
              value={codigo}
              onChangeText={(v) => {
                setCodigo(v.replace(/[^0-9]/g, '').slice(0, 6));
                setErro('');
              }}
            />
            {erro ? <ErrorText>{erro}</ErrorText> : null}
          </FormGroup>

          <PrimaryButton
            onPress={() => {
              tocar('continuar');
              confirmar();
            }}
            disabled={ocupado}
            $disabled={ocupado}
          >
            {ocupado ? <ActivityIndicator color="white" size="small" /> : null}
            <PrimaryButtonText $disabled={ocupado}>
              {ocupado ? t('verificarEmail.confirmando') : t('verificarEmail.botaoConfirmar')}
            </PrimaryButtonText>
          </PrimaryButton>

          <ResendRow>
            <ResendLink
              onPress={() => {
                tocar('tap');
                reenviar();
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
        </Card>
      </Container>
    </KeyboardAvoidingView>
  );
};

export default VerifyEmail;
