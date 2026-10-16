import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { isDiaDaSemanaProgramado, MINUTOS_ANTECEDENCIA_LIBERACAO } from '@/utils/ocorrencias';
import { partesNoFuso, somarDias, instanteNoFuso } from '@/utils/fuso';
import { traduzir, IDIOMA_PADRAO } from '@/i18n';
import { STATUS_OCORRENCIA } from '@/model/Status';

const DIAS_JANELA = 2;

const CANAL_LEMBRETES = 'lembretes';

const COR_AVISO = '#F59E0B';
const COR_URGENTE = '#EF4444';
const COR_DO_APP = '#4F46E5';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// No Android 8 ou superior todo aviso pertence a um canal, e no Android 13 ou superior o pedido de
// permissão só aparece depois que algum canal existe. Recriar o canal é inofensivo.
async function configurarCanal(idioma) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CANAL_LEMBRETES, {
    name: traduzir(idioma || IDIOMA_PADRAO, 'notificacao.canal'),
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: COR_DO_APP,
  });
}

export async function solicitarPermissao(idioma) {
  await configurarCanal(idioma);
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return true;
  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.granted;
}

export async function cancelarTodas() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export function habitoDaNotificacao(resposta) {
  return resposta?.notification?.request?.content?.data?.habitoId || null;
}

function lerHorario(horarioHHmm) {
  if (!horarioHHmm) return null;
  const [h, m] = String(horarioHHmm).slice(0, 5).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { h, m };
}

async function agendarSeNoFuturo(data, conteudo) {
  if (!data || data.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    content: conteudo,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: data,
      channelId: CANAL_LEMBRETES,
    },
  });
}

function conteudoAntes(idioma, habito) {
  return {
    title: `😟 ${habito.titulo}`,
    body: traduzir(idioma, 'notificacao.faltam15'),
    color: COR_AVISO,
    data: { habitoId: habito.id },
  };
}

function conteudoNaHora(idioma, habito) {
  return {
    title: `😱 ${habito.titulo}`,
    body: traduzir(idioma, 'notificacao.naHora', { atividade: habito.titulo }),
    color: COR_URGENTE,
    data: { habitoId: habito.id },
  };
}

export async function reagendarTodas(habitos, idioma) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const permissao = await Notifications.getPermissionsAsync();
  if (!permissao.granted) return;

  await configurarCanal(idioma);

  const hoje = partesNoFuso(new Date());

  for (const habito of habitos || []) {
    if (!habito.ativo || !Array.isArray(habito.ocorrencias)) continue;

    for (let offset = 0; offset < DIAS_JANELA; offset += 1) {
      const dia = somarDias(hoje, offset);
      if (!isDiaDaSemanaProgramado(habito.frequencia_semanal, dia.diaDaSemana)) continue;

      for (const ocorrencia of habito.ocorrencias) {
        const jaResolvidaHoje = offset === 0
          && (ocorrencia.status === STATUS_OCORRENCIA.FEITO || ocorrencia.status === STATUS_OCORRENCIA.FALHOU);
        if (jaResolvidaHoje) continue;

        const horario = lerHorario(ocorrencia.horario_inicio);
        if (!horario) continue;

        const inicio = instanteNoFuso(dia, horario.h, horario.m);
        const antes = new Date(inicio.getTime() - MINUTOS_ANTECEDENCIA_LIBERACAO * 60000);
        await agendarSeNoFuturo(antes, conteudoAntes(idioma, habito));
        await agendarSeNoFuturo(inicio, conteudoNaHora(idioma, habito));
      }
    }
  }
}
