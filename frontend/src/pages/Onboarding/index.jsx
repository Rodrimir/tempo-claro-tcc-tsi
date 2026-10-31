import { useEffect, useState } from 'react';
import { BackHandler, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from 'styled-components/native';
import { useAuth, perfilDoServidor } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { useOnboarding } from '@/onboarding/OnboardingContext';
import { definirPreferenciasIniciais } from '@/services/api';
import { FUSOS, fusoDoAparelho, fusoSuportado, rotuloDoFuso } from '@/model/Fusos';
import { avatarDe } from '@/assets/avatares';
import { getApiErrorMessage } from '@/utils/erros';
import {
  Container,
  Conteudo,
  Cabecalho,
  AvatarCaixa,
  Balao,
  BalaoTexto,
  Pontos,
  Ponto,
  CartaoIdioma,
  Bandeira,
  NomeIdioma,
  Lista,
  GrupoTitulo,
  OpcaoFuso,
  OpcaoFusoTexto,
  Sugerido,
  Rodape,
  BotaoPrincipal,
  BotaoPrincipalTexto,
  BotaoVoltar,
} from './styles';

const PASSO_IDIOMA = 0;
const PASSO_FUSO = 1;

// Passos 1 e 2 do guia de primeiro acesso: idioma e fuso, obrigatórios antes do resto do app. O
// tour pela tela inicial vem logo depois (SpotlightOverlay).
const Onboarding = () => {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, updateLocalUser } = useAuth();
  const { idioma, setIdioma, idiomas, t } = useI18n();
  const { addToast } = useToast();
  const { comecarTour } = useOnboarding();
  const [passo, setPasso] = useState(PASSO_IDIOMA);
  const sugerido = fusoDoAparelho();
  const [fuso, setFuso] = useState(() =>
    sugerido || (fusoSuportado(user?.fuso_horario) ? user.fuso_horario : 'America/Sao_Paulo')
  );
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const assinatura = BackHandler.addEventListener('hardwareBackPress', () => {
      if (passo === PASSO_FUSO) setPasso(PASSO_IDIOMA);
      return true;
    });
    return () => assinatura.remove();
  }, [passo]);

  const escolherIdioma = (codigo) => {
    setIdioma(codigo);
    setPasso(PASSO_FUSO);
  };

  const confirmar = async () => {
    if (enviando) return;
    setEnviando(true);
    try {
      const { data } = await definirPreferenciasIniciais(idioma, fuso);
      const perfil = perfilDoServidor(data, user);
      await updateLocalUser(perfil);
      comecarTour();
      router.replace('/home');
    } catch (err) {
      addToast(getApiErrorMessage(err, t('guia.erroPreferencias')), 'error');
      setEnviando(false);
    }
  };

  const ordemDosFusos = sugerido ? [sugerido, ...FUSOS.map((f) => f.value).filter((v) => v !== sugerido)] : null;

  return (
    <Container style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}>
      <Cabecalho>
        {passo === PASSO_FUSO ? (
          <BotaoVoltar accessibilityRole="button" accessibilityLabel={t('comum.voltar')} onPress={() => setPasso(PASSO_IDIOMA)}>
            <Feather name="arrow-left" size={24} color={theme.textPrimary} />
          </BotaoVoltar>
        ) : (
          <View style={{ width: 44 }} />
        )}
        <Pontos accessibilityLabel={t('guia.passoDe', { atual: passo + 1, total: 2 })}>
          <Ponto $ativo={passo === PASSO_IDIOMA} />
          <Ponto $ativo={passo === PASSO_FUSO} />
        </Pontos>
        <View style={{ width: 44 }} />
      </Cabecalho>

      <Animated.View key={passo} entering={FadeIn.duration(220)} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <AvatarCaixa>
          <Image source={avatarDe('AGUA', 'feliz', 1)} contentFit="contain" style={{ width: '100%', height: '100%' }} />
        </AvatarCaixa>
        <Balao>
          <BalaoTexto accessibilityRole="header">
            {passo === PASSO_IDIOMA ? t('guia.perguntaIdioma') : t('guia.perguntaFuso')}
          </BalaoTexto>
        </Balao>
      </Animated.View>

      {passo === PASSO_IDIOMA ? (
        <Conteudo>
          {Object.entries(idiomas).map(([codigo, info]) => (
            <CartaoIdioma
              key={codigo}
              accessibilityRole="radio"
              accessibilityState={{ selected: idioma === codigo }}
              accessibilityLabel={info.nome}
              $ativo={idioma === codigo}
              onPress={() => escolherIdioma(codigo)}
            >
              <Bandeira>{info.bandeira}</Bandeira>
              <NomeIdioma $ativo={idioma === codigo}>{info.nome}</NomeIdioma>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </CartaoIdioma>
          ))}
        </Conteudo>
      ) : (
        <>
          <Lista contentContainerStyle={{ paddingBottom: 12 }}>
            {(ordemDosFusos ? [{ grupo: 'sugerido', itens: [sugerido] }] : []).concat(
              ['brasil', 'americaDoNorte'].map((grupo) => ({
                grupo,
                itens: FUSOS.filter((f) => f.grupo === grupo && f.value !== sugerido).map((f) => f.value),
              }))
            ).map(({ grupo, itens }) => (
              <View key={grupo}>
                <GrupoTitulo>{grupo === 'sugerido' ? t('guia.fusoSugerido') : t(`perfil.grupoFuso.${grupo}`)}</GrupoTitulo>
                {itens.map((valor) => (
                  <OpcaoFuso
                    key={valor}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: fuso === valor }}
                    $ativo={fuso === valor}
                    onPress={() => setFuso(valor)}
                  >
                    <OpcaoFusoTexto $ativo={fuso === valor}>{rotuloDoFuso(valor, idioma)}</OpcaoFusoTexto>
                    {grupo === 'sugerido' ? <Sugerido>{t('guia.doAparelho')}</Sugerido> : null}
                    {fuso === valor ? <Feather name="check" size={18} color={theme.primaryColor} /> : null}
                  </OpcaoFuso>
                ))}
              </View>
            ))}
          </Lista>
          <Rodape>
            <BotaoPrincipal
              accessibilityRole="button"
              accessibilityState={{ disabled: enviando, busy: enviando }}
              disabled={enviando}
              onPress={confirmar}
            >
              <BotaoPrincipalTexto>{enviando ? t('guia.salvando') : t('guia.confirmarFuso')}</BotaoPrincipalTexto>
            </BotaoPrincipal>
          </Rodape>
        </>
      )}
    </Container>
  );
};

export default Onboarding;
