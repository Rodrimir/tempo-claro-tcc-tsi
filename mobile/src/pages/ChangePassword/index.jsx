import { useState } from 'react';
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
import { login as apiLogin, updateProfile } from '../../services/api';
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
  ErrorText,
  PrimaryButton,
  PrimaryButtonText,
  Requisitos,
  RequisitoLinha,
  RequisitoTexto,
} from './styles';

/**
 * Troca de senha em dois passos (RF: dados da conta).
 *
 * O passo 1 confere a senha atual ANTES de pedir a nova. Não existe endpoint só
 * para validar senha, então a conferência reusa POST /auth/login com o e-mail da
 * sessão: se as credenciais batem, a senha está certa. O token que volta é
 * descartado de propósito — quem chama é o `login` de services/api, não o do
 * AuthContext, justamente para não trocar a sessão em curso por uma nova.
 */
const ChangePassword = () => {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { addToast } = useToast();
  const { t } = useI18n();
  const { tocar } = useSfx();

  const [passo, setPasso] = useState(1);
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const tamanhoOk = novaSenha.length >= TAMANHO_MINIMO_SENHA;
  const maiusculaOk = RE_MAIUSCULA.test(novaSenha);
  const especialOk = RE_ESPECIAL.test(novaSenha);
  const confereOk = novaSenha.length > 0 && novaSenha === confirmacao;
  const diferenteOk = novaSenha.length > 0 && novaSenha !== senhaAtual;
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

  const conferirSenhaAtual = async () => {
    if (!senhaAtual) {
      setErro(t('validacao.informeSenhaAtual'));
      return;
    }
    setOcupado(true);
    setErro('');
    try {
      await apiLogin({ email: user?.email, password: senhaAtual });
      setPasso(2);
    } catch (err) {
      // 401 aqui só pode ser senha errada: o e-mail vem da sessão, não é digitado.
      if (err.response?.status === 401) {
        setErro(t('perfil.senhaAtualIncorreta'));
      } else {
        setErro(err.response?.data?.message || t('perfil.erroSalvar'));
      }
    } finally {
      setOcupado(false);
    }
  };

  const salvar = async () => {
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
      await updateProfile({ senha_atual: senhaAtual, nova_senha: novaSenha });
      addToast(t('perfil.senhaOk'), 'success');
      router.back();
    } catch (err) {
      setErro(err.response?.data?.message || t('perfil.erroSalvar'));
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
            <Title>{t('perfil.trocarSenha')}</Title>
            <Subtitle>{t('criar.passoDe', { atual: passo, total: 2 })}</Subtitle>
          </HeaderText>
        </Header>

        <StepDots>
          <Dot $active />
          <Dot $active={passo === 2} />
        </StepDots>

        {passo === 1 ? (
          <Card>
            <StepTitle>{t('perfil.confirmeQuemEVoce')}</StepTitle>
            <StepText>{t('perfil.confirmeQuemEVoceTexto')}</StepText>

            <FormGroup>
              <Label>{t('perfil.senhaAtual')}</Label>
              <PasswordInput
                value={senhaAtual}
                onChangeText={(v) => {
                  setSenhaAtual(v);
                  setErro('');
                }}
                placeholder="••••••••"
              />
              {erro ? <ErrorText>{erro}</ErrorText> : null}
            </FormGroup>

            <PrimaryButton
              onPress={() => {
                tocar('continuar');
                conferirSenhaAtual();
              }}
              disabled={ocupado}
              $disabled={ocupado}
            >
              {ocupado ? <ActivityIndicator color={theme.textSecondary} size="small" /> : null}
              <PrimaryButtonText $disabled={ocupado}>
                {ocupado ? t('perfil.conferindo') : t('comum.continuar')}
              </PrimaryButtonText>
            </PrimaryButton>
          </Card>
        ) : (
          <Card>
            <StepTitle>{t('perfil.escolhaNovaSenha')}</StepTitle>
            <StepText>{t('perfil.escolhaNovaSenhaTexto')}</StepText>

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
              {requisito(diferenteOk, t('perfil.requisitoDiferente'))}
            </Requisitos>

            {erro ? <ErrorText>{erro}</ErrorText> : null}

            <PrimaryButton
              onPress={() => {
                tocar('continuar');
                salvar();
              }}
              disabled={ocupado || !senhaValida || !confereOk || !diferenteOk}
              $disabled={ocupado || !senhaValida || !confereOk || !diferenteOk}
            >
              {ocupado ? <ActivityIndicator color={theme.textSecondary} size="small" /> : null}
              <PrimaryButtonText $disabled={ocupado || !senhaValida || !confereOk || !diferenteOk}>
                {ocupado ? t('perfil.salvando') : t('perfil.salvarNovaSenha')}
              </PrimaryButtonText>
            </PrimaryButton>
          </Card>
        )}
      </Container>
    </KeyboardAvoidingView>
  );
};

export default ChangePassword;
