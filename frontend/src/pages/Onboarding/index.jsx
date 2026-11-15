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
import { PAGINAS_DA_PROPOSTA, SEGUNDOS_PARA_SE_COMPROMETER } from '@/onboarding/passos';
import { definirPreferenciasIniciais } from '@/services/api';
import { FUSOS, fusoDoAparelho, fusoSuportado, rotuloDoFuso } from '@/model/Fusos';
import { avatarDe } from '@/assets/avatares';
import { getApiErrorMessage } from '@/utils/erros';
import { BotaoDeCompromisso } from './BotaoDeCompromisso';
import {
  Container,
  Conteudo,
  Cabecalho,
  LadoDoCabecalho,
  BotaoPular,
  PularTexto,
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
  CartaoTexto,
  Paragrafo,
  Destaque,
  Citacao,
  CitacaoTexto,
  Lei,
  LeiNumero,
  LeiNumeroTexto,
  LeiTexto,
  LeiNome,
  Rodape,
  BotaoPrincipal,
  BotaoPrincipalTexto,
  ConteudoDoBotao,
  BotaoSecundario,
  BotaoSecundarioTexto,
  BotaoVoltar,
} from './styles';

const PASSO_IDIOMA = 0;
const PASSO_FUSO = 1;
const PRIMEIRA_PAGINA = 2;
const TOTAL_DE_PASSOS = PRIMEIRA_PAGINA + PAGINAS_DA_PROPOSTA.length;

function BlocoDaProposta({ pagina, bloco, t }) {
  const chave = `guia.proposta.${pagina.id}.${bloco.chave}`;
  if (bloco.tipo === 'destaque') return <Destaque>{t(chave)}</Destaque>;
  if (bloco.tipo === 'citacao') {
    return (
      <Citacao>
        <CitacaoTexto>{t(chave)}</CitacaoTexto>
      </Citacao>
    );
  }
  if (bloco.tipo === 'lei') {
    return (
      <Lei>
        <LeiNumero>
          <LeiNumeroTexto>{bloco.numero}</LeiNumeroTexto>
        </LeiNumero>
        <LeiTexto>
          <LeiNome>{t(`${chave}.nome`)}</LeiNome> — {t(`${chave}.texto`)}
        </LeiTexto>
      </Lei>
    );
  }
  return <Paragrafo>{t(chave)}</Paragrafo>;
}

// Guia de primeiro acesso, primeira parte: idioma e fuso, obrigatórios antes do resto do app, e as
// quatro telas que contextualizam a proposta, cada uma aceita com "Continuar" e a última com o
// compromisso. As telas da proposta podem ser puladas. As preferências só vão ao servidor quando a
// pessoa sai das telas da proposta, para que voltar a uma tela anterior não salve duas vezes. O tour
// pela tela inicial vem logo depois (SpotlightOverlay).
//
// No modo "revisao", aberto pelo Perfil, a tela mostra só as quatro telas da proposta e volta ao
// Perfil no fim, sem salvar nada.
const Onboarding = ({ modo = 'guia' }) => {
  const revisao = modo === 'revisao';
  const primeiroPasso = revisao ? PRIMEIRA_PAGINA : PASSO_IDIOMA;
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user, updateLocalUser } = useAuth();
  const { idioma, setIdioma, idiomas, t } = useI18n();
  const { addToast } = useToast();
  const { comecarTour } = useOnboarding();
  const [passo, setPasso] = useState(primeiroPasso);
  const sugerido = fusoDoAparelho();
  const [fuso, setFuso] = useState(() =>
    sugerido || (fusoSuportado(user?.fuso_horario) ? user.fuso_horario : 'America/Sao_Paulo')
  );
  const [enviando, setEnviando] = useState(false);
  const pagina = passo >= PRIMEIRA_PAGINA ? PAGINAS_DA_PROPOSTA[passo - PRIMEIRA_PAGINA] : null;
  const totalDePontos = TOTAL_DE_PASSOS - primeiroPasso;
  const pontoAtual = passo - primeiroPasso;

  const sair = () => router.back();

  const voltar = () => {
    if (enviando) return;
    if (passo > primeiroPasso) setPasso(passo - 1);
    else if (revisao) sair();
  };

  useEffect(() => {
    const assinatura = BackHandler.addEventListener('hardwareBackPress', () => {
      voltar();
      return true;
    });
    return () => assinatura.remove();
  });

  const escolherIdioma = (codigo) => {
    setIdioma(codigo);
    setPasso(PASSO_FUSO);
  };

  const salvarPreferenciasEComecarTour = async () => {
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

  // Pular, "Agora não" e o compromisso levam ao mesmo lugar: o tour, ou de volta ao Perfil.
  const concluir = revisao ? sair : salvarPreferenciasEComecarTour;

  const ordemDosFusos = sugerido ? [sugerido, ...FUSOS.map((f) => f.value).filter((v) => v !== sugerido)] : null;

  return (
    <Container style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}>
      <Cabecalho>
        <LadoDoCabecalho>
          {passo > primeiroPasso || revisao ? (
            <BotaoVoltar accessibilityRole="button" accessibilityLabel={t('comum.voltar')} onPress={voltar}>
              <Feather name="arrow-left" size={24} color={theme.textPrimary} />
            </BotaoVoltar>
          ) : null}
        </LadoDoCabecalho>
        <Pontos accessibilityLabel={t('guia.passoDe', { atual: pontoAtual + 1, total: totalDePontos })}>
          {Array.from({ length: totalDePontos }, (_, i) => (
            <Ponto key={i} $ativo={pontoAtual === i} />
          ))}
        </Pontos>
        <LadoDoCabecalho $direita>
          {pagina ? (
            <BotaoPular accessibilityRole="button" disabled={enviando} onPress={concluir}>
              <PularTexto>{revisao ? t('comum.fechar') : t('guia.pular')}</PularTexto>
            </BotaoPular>
          ) : null}
        </LadoDoCabecalho>
      </Cabecalho>

      <Animated.View key={passo} entering={FadeIn.duration(220)} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
        <AvatarCaixa>
          <Image
            source={avatarDe(pagina ? pagina.avatar : 'AGUA', 'feliz', 1)}
            contentFit="contain"
            style={{ width: '100%', height: '100%' }}
          />
        </AvatarCaixa>
        <Balao>
          <BalaoTexto accessibilityRole="header">
            {pagina
              ? t(`guia.proposta.${pagina.id}.titulo`)
              : passo === PASSO_IDIOMA
                ? t('guia.perguntaIdioma')
                : t('guia.perguntaFuso')}
          </BalaoTexto>
        </Balao>
      </Animated.View>

      {pagina ? (
        <>
          <Lista contentContainerStyle={{ paddingBottom: 12 }}>
            <Animated.View key={pagina.id} entering={FadeIn.duration(220)}>
              <CartaoTexto>
                {pagina.blocos.map((bloco) => (
                  <BlocoDaProposta key={bloco.chave} pagina={pagina} bloco={bloco} t={t} />
                ))}
              </CartaoTexto>
            </Animated.View>
          </Lista>
          <Rodape>
            {pagina.compromisso ? (
              <>
                <BotaoDeCompromisso
                  rotulo={enviando ? t('guia.salvando') : t('guia.proposta.compromisso.comprometer')}
                  dica={t('guia.proposta.compromisso.segure', { segundos: SEGUNDOS_PARA_SE_COMPROMETER })}
                  dicaLeitor={t('guia.proposta.compromisso.segureLeitor')}
                  desabilitado={enviando}
                  onConfirmar={concluir}
                />
                <BotaoSecundario accessibilityRole="button" disabled={enviando} onPress={concluir}>
                  <BotaoSecundarioTexto>{t('guia.proposta.compromisso.agoraNao')}</BotaoSecundarioTexto>
                </BotaoSecundario>
              </>
            ) : (
              <BotaoPrincipal accessibilityRole="button" onPress={() => setPasso(passo + 1)}>
                <ConteudoDoBotao>
                  <BotaoPrincipalTexto>{t('guia.continuar')}</BotaoPrincipalTexto>
                  <Feather name="arrow-right" size={18} color="#ffffff" />
                </ConteudoDoBotao>
              </BotaoPrincipal>
            )}
          </Rodape>
        </>
      ) : passo === PASSO_IDIOMA ? (
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
            <BotaoPrincipal accessibilityRole="button" onPress={() => setPasso(PRIMEIRA_PAGINA)}>
              <BotaoPrincipalTexto>{t('guia.confirmarFuso')}</BotaoPrincipalTexto>
            </BotaoPrincipal>
          </Rodape>
        </>
      )}
    </Container>
  );
};

export default Onboarding;
