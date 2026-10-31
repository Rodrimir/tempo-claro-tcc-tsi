import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSegments } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import Svg, { Line, Rect } from 'react-native-svg';
import { useTheme } from 'styled-components/native';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/contexts/LanguageContext';
import { useToast } from '@/contexts/ToastContext';
import { avatarDe } from '@/assets/avatares';
import { getApiErrorMessage } from '@/utils/erros';
import { useOnboarding } from './OnboardingContext';
import { passosDoGuia, posicaoDoBalao } from './passos';
import {
  Balao,
  BalaoLinha,
  AvatarCaixa,
  BalaoTexto,
  BalaoRodape,
  BalaoContador,
  BalaoBotao,
  BalaoBotaoTexto,
  BalaoDica,
  LegendaLinha,
  LegendaItem,
  LegendaCor,
  LegendaTexto,
} from './styles';

const FOLGA = 6;
const ESCURO = 'rgba(2, 6, 23, 0.62)';

// Mini gráfico do passo que explica a tela de Dados: barras de exemplo e a linha da meta.
function GraficoDeExemplo({ theme, t }) {
  const barras = [0.6, 1, 0.3, 1.2, 0];
  return (
    <View>
      <Svg width="100%" height={64} viewBox="0 0 200 64">
        {barras.map((valor, i) => {
          const altura = Math.max(3, valor * 40);
          const cor = valor >= 1 ? theme.successColor : valor > 0 ? theme.warningColor : theme.borderColor;
          return <Rect key={i} x={10 + i * 38} y={60 - altura} width={26} height={altura} rx={5} fill={cor} />;
        })}
        <Line x1="0" y1="20" x2="200" y2="20" stroke={theme.textSecondary} strokeWidth="1.5" strokeDasharray="5 4" />
      </Svg>
      <LegendaLinha>
        <LegendaItem>
          <LegendaCor style={{ backgroundColor: theme.successColor }} />
          <LegendaTexto>{t('stats.legendaCumprida')}</LegendaTexto>
        </LegendaItem>
        <LegendaItem>
          <LegendaCor style={{ backgroundColor: theme.warningColor }} />
          <LegendaTexto>{t('stats.legendaParcialCurta')}</LegendaTexto>
        </LegendaItem>
        <LegendaItem>
          <LegendaCor style={{ backgroundColor: theme.textSecondary, height: 2 }} />
          <LegendaTexto>{t('stats.legendaMeta')}</LegendaTexto>
        </LegendaItem>
      </LegendaLinha>
    </View>
  );
}

// Spotlight do guia sobre a tela inicial: escurece tudo em volta do elemento do passo e mostra o
// avatar com o balão de fala. Só o passo final (criar o primeiro hábito) deixa tocar no alvo.
export default function SpotlightOverlay() {
  const { emTour, etapa, alvos, temHabitos, avancar } = useOnboarding();
  const { marcarOnboardingConcluido } = useAuth();
  const { t } = useI18n();
  const { addToast } = useToast();
  const theme = useTheme();
  const tela = useWindowDimensions();
  const segmentos = useSegments();
  const [alturaDoBalao, setAlturaDoBalao] = useState(170);
  const [concluindo, setConcluindo] = useState(false);

  const naHome = segmentos[0] === '(tabs)' && (segmentos[1] === 'home' || segmentos.length === 1);
  if (!emTour || !naHome) return null;

  const passos = passosDoGuia({ temHabitos });
  const passo = passos[Math.min(etapa, passos.length - 1)];
  const alvo = passo.alvo ? alvos[passo.alvo] : null;
  const buraco = alvo
    ? { x: alvo.x - FOLGA, y: alvo.y - FOLGA, w: alvo.w + FOLGA * 2, h: alvo.h + FOLGA * 2 }
    : null;
  const posicao = posicaoDoBalao(buraco, tela, alturaDoBalao);

  const concluir = async () => {
    setConcluindo(true);
    try {
      await marcarOnboardingConcluido();
    } catch (err) {
      addToast(getApiErrorMessage(err, t('guia.erroConcluir')), 'error');
      setConcluindo(false);
    }
  };

  const paineis = buraco
    ? [
        { left: 0, top: 0, width: tela.width, height: Math.max(0, buraco.y) },
        { left: 0, top: buraco.y + buraco.h, width: tela.width, height: Math.max(0, tela.height - buraco.y - buraco.h) },
        { left: 0, top: buraco.y, width: Math.max(0, buraco.x), height: buraco.h },
        { left: buraco.x + buraco.w, top: buraco.y, width: Math.max(0, tela.width - buraco.x - buraco.w), height: buraco.h },
      ]
    : [{ left: 0, top: 0, width: tela.width, height: tela.height }];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none" accessibilityViewIsModal>
      {paineis.map((painel, i) => (
        <View key={i} style={[styles.painel, painel]} />
      ))}
      {buraco ? (
        <View
          pointerEvents={passo.interativo ? 'none' : 'auto'}
          style={[
            styles.buraco,
            { left: buraco.x, top: buraco.y, width: buraco.w, height: buraco.h, borderColor: theme.primaryColor },
          ]}
        />
      ) : null}
      <Animated.View
        key={passo.id}
        entering={FadeIn.duration(220)}
        style={[styles.balao, { left: posicao.left, top: posicao.top, width: posicao.width }]}
        onLayout={(e) => setAlturaDoBalao(e.nativeEvent.layout.height)}
      >
        <Balao accessibilityLiveRegion="polite">
          <BalaoLinha>
            <AvatarCaixa>
              <Image source={avatarDe('AGUA', 'feliz', 1)} contentFit="contain" style={styles.avatar} />
            </AvatarCaixa>
            <BalaoTexto>{t(`guia.passos.${passo.id}`)}</BalaoTexto>
          </BalaoLinha>
          {passo.grafico ? <GraficoDeExemplo theme={theme} t={t} /> : null}
          <BalaoRodape>
            <BalaoContador>
              {etapa + 1}/{passos.length}
            </BalaoContador>
            {passo.interativo ? (
              <BalaoDica>{t('guia.toqueNoBotao')}</BalaoDica>
            ) : (
              <BalaoBotao
                accessibilityRole="button"
                disabled={concluindo}
                accessibilityState={{ disabled: concluindo, busy: concluindo }}
                onPress={() => (passo.conclui ? concluir() : avancar(passos.length))}
              >
                <BalaoBotaoTexto>{passo.conclui ? t('guia.entendi') : t('guia.proximo')}</BalaoBotaoTexto>
              </BalaoBotao>
            )}
          </BalaoRodape>
        </Balao>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  painel: { position: 'absolute', backgroundColor: ESCURO },
  buraco: { position: 'absolute', borderWidth: 2, borderRadius: 16 },
  balao: { position: 'absolute' },
  avatar: { width: '100%', height: '100%' },
});
