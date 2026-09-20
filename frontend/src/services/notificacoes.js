import * as Notifications from 'expo-notifications';
import { isDiaProgramado, MINUTOS_ANTECEDENCIA_LIBERACAO } from '../utils/ocorrencias';
import { traduzir } from '../i18n';

const DIAS_JANELA = 2;

const COR_AVISO = '#F59E0B';
const COR_URGENTE = '#EF4444';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function solicitarPermissao() {
  const atual = await Notifications.getPermissionsAsync();
  if (atual.granted) return true;
  const pedido = await Notifications.requestPermissionsAsync();
  return pedido.granted;
}

function horarioParaData(dia, horarioHHmm) {
  if (!horarioHHmm) return null;
  const [h, m] = String(horarioHHmm).slice(0, 5).split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  const data = new Date(dia);
  data.setHours(h, m, 0, 0);
  return data;
}

async function agendarSeNoFuturo(data, conteudo) {
  if (!data || data.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    content: conteudo,
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: data },
  });
}

function conteudoAntes(idioma, habito) {
  return {
    title: `😟 ${habito.titulo}`,
    body: traduzir(idioma, 'notificacao.faltam15'),
    color: COR_AVISO,
  };
}

function conteudoNaHora(idioma, habito) {
  return {
    title: `😱 ${habito.titulo}`,
    body: traduzir(idioma, 'notificacao.naHora', { atividade: habito.titulo }),
    color: COR_URGENTE,
  };
}

export async function reagendarTodas(habitos, idioma) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const permissao = await Notifications.getPermissionsAsync();
  if (!permissao.granted) return;

  const hoje = new Date();

  for (const habito of habitos || []) {
    if (!habito.ativo || !Array.isArray(habito.ocorrencias)) continue;

    for (let offset = 0; offset < DIAS_JANELA; offset += 1) {
      const dia = new Date(hoje);
      dia.setDate(dia.getDate() + offset);
      if (!isDiaProgramado(habito.frequencia_semanal, dia)) continue;

      for (const ocorrencia of habito.ocorrencias) {
        const jaResolvidaHoje = offset === 0 && (ocorrencia.status === 'FEITO' || ocorrencia.status === 'FALHOU');
        if (jaResolvidaHoje) continue;

        const inicio = horarioParaData(dia, ocorrencia.horario_inicio);
        if (!inicio) continue;

        const antes = new Date(inicio.getTime() - MINUTOS_ANTECEDENCIA_LIBERACAO * 60000);
        await agendarSeNoFuturo(antes, conteudoAntes(idioma, habito));
        await agendarSeNoFuturo(inicio, conteudoNaHora(idioma, habito));
      }
    }
  }
}
