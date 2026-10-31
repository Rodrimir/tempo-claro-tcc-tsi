import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { ESTADOS_DO_DIA, dataCurta, diaDaSemana, estadoDoDia, mostrarRotulo, topoDoGrafico } from './grafico';
import {
  GraficoArea,
  LinhaDaMeta,
  RotuloDaMeta,
  RotuloEixo,
  BarraRotulo,
  Dica,
  DicaTitulo,
  DicaTexto,
  Legenda,
  LegendaItem,
  LegendaCor,
  LegendaTexto,
  ComoLer,
} from './styles';

const ALTURA = 160;

// Gráfico de desempenho pensado para ser lido de relance: uma barra por dia, colorida pelo que
// aconteceu, a linha tracejada da meta e uma legenda. Tocar numa barra mostra o dia por extenso.
export default function GraficoDesempenho({ dias, meta, theme, t, idioma, formatar }) {
  const [largura, setLargura] = useState(0);
  const [dataSelecionada, setDataSelecionada] = useState(null);
  const indiceSelecionado = dataSelecionada ? dias.findIndex((d) => d.data === dataSelecionada) : -1;
  const selecionado = indiceSelecionado >= 0 ? indiceSelecionado : dias.length - 1;
  const topo = topoDoGrafico(dias, meta);
  const larguraDaBarra = largura > 0 ? largura / dias.length : 0;
  const espaco = dias.length > 10 ? 2 : 8;
  const alturaDaMeta = Math.round((meta / topo) * ALTURA);
  const nomesDosDias = t('diasSemanaMedio');

  const corDe = {
    [ESTADOS_DO_DIA.CUMPRIDA]: theme.successColor,
    [ESTADOS_DO_DIA.PARCIAL]: theme.warningColor,
    [ESTADOS_DO_DIA.SEM_EXECUCAO]: theme.borderColor,
    [ESTADOS_DO_DIA.FOLGA]: theme.borderColor,
    [ESTADOS_DO_DIA.ANTES]: theme.borderColor,
    [ESTADOS_DO_DIA.DISPENSADO]: theme.primaryLight,
  };

  const descrever = (dia) => {
    const estado = estadoDoDia(dia);
    const quando = `${nomesDosDias[diaDaSemana(dia.data)]} ${dataCurta(dia.data, idioma)}`;
    const quanto =
      estado === ESTADOS_DO_DIA.ANTES || estado === ESTADOS_DO_DIA.FOLGA || estado === ESTADOS_DO_DIA.DISPENSADO
        ? null
        : t('stats.feitoDe', { feito: formatar(dia.valor_realizado || 0), meta: formatar(meta) });
    return { quando, quanto, estado: t(`stats.estado.${estado}`) };
  };

  const dia = dias[selecionado];
  const dica = dia ? descrever(dia) : null;

  return (
    <View>
      {dica ? (
        <Dica accessibilityLiveRegion="polite">
          <DicaTitulo>
            {selecionado === dias.length - 1 ? `${t('stats.hoje')} · ` : ''}
            {dica.quando}
          </DicaTitulo>
          <DicaTexto>{[dica.quanto, dica.estado].filter(Boolean).join(' · ')}</DicaTexto>
        </Dica>
      ) : null}

      <GraficoArea style={{ height: ALTURA }} onLayout={(e) => setLargura(e.nativeEvent.layout.width)}>
        {largura > 0 &&
          dias.map((d, i) => {
            const estado = estadoDoDia(d);
            const valor = d.valor_realizado || 0;
            const altura = valor > 0 ? Math.max(4, Math.round((valor / topo) * ALTURA)) : 3;
            const hoje = i === dias.length - 1;
            const ativo = i === selecionado;
            const textoDoDia = descrever(d);
            return (
              <Pressable
                key={d.data}
                accessibilityRole="button"
                accessibilityLabel={[textoDoDia.quando, textoDoDia.quanto, textoDoDia.estado].filter(Boolean).join(', ')}
                accessibilityState={{ selected: ativo }}
                onPress={() => setDataSelecionada(d.data)}
                style={{
                  position: 'absolute',
                  left: i * larguraDaBarra,
                  width: larguraDaBarra,
                  top: 0,
                  bottom: 0,
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                }}
              >
                <View
                  style={{
                    width: Math.max(2, larguraDaBarra - espaco),
                    height: altura,
                    borderRadius: dias.length > 10 ? 2 : 6,
                    backgroundColor: corDe[estado],
                    opacity: estado === ESTADOS_DO_DIA.ANTES ? 0.35 : 1,
                    borderWidth: ativo || hoje ? 2 : 0,
                    borderColor: ativo ? theme.textPrimary : theme.primaryColor,
                  }}
                />
              </Pressable>
            );
          })}
        {largura > 0 && meta > 0 ? (
          <LinhaDaMeta pointerEvents="none" style={{ bottom: alturaDaMeta }}>
            <Svg width={largura} height={2}>
              <Line x1="0" y1="1" x2={largura} y2="1" stroke={theme.textSecondary} strokeWidth="1.5" strokeDasharray="6 4" />
            </Svg>
            <RotuloDaMeta>{t('stats.metaLinha', { meta: formatar(meta) })}</RotuloDaMeta>
          </LinhaDaMeta>
        ) : null}
        <RotuloEixo pointerEvents="none">{formatar(topo)}</RotuloEixo>
      </GraficoArea>

      <View style={{ height: 18 }}>
        {largura > 0 &&
          dias.map((d, i) =>
            mostrarRotulo(i, dias.length) ? (
              <BarraRotulo
                key={d.data}
                numberOfLines={1}
                style={{ position: 'absolute', left: i * larguraDaBarra + larguraDaBarra / 2 - 22, width: 44 }}
              >
                {i === dias.length - 1
                  ? t('stats.hoje')
                  : dias.length > 10
                    ? dataCurta(d.data, idioma)
                    : nomesDosDias[diaDaSemana(d.data)]}
              </BarraRotulo>
            ) : null
          )}
      </View>

      <Legenda>
        {[
          [theme.successColor, t('stats.legendaCumprida')],
          [theme.warningColor, t('stats.legendaParcialCurta')],
          [theme.borderColor, t('stats.legendaSemExecucao')],
        ].map(([cor, texto]) => (
          <LegendaItem key={texto}>
            <LegendaCor style={{ backgroundColor: cor }} />
            <LegendaTexto>{texto}</LegendaTexto>
          </LegendaItem>
        ))}
        <LegendaItem>
          <LegendaCor style={{ backgroundColor: theme.textSecondary, height: 2 }} />
          <LegendaTexto>{t('stats.legendaMeta')}</LegendaTexto>
        </LegendaItem>
      </Legenda>
      <ComoLer>{t('stats.comoLer')}</ComoLer>
    </View>
  );
}
