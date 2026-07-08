import { ASSET_BASE_URL } from '../services/api';

// @audit-ok [Avatar F05 — deriva a expressão de urgência no cliente e monta a URL do asset]

// @audit-info [Avatar F05 — casa o final do caminho .../{estado}_{nivel}.{ext} (ex.: /agua/normal_00.png) para trocar só o segmento de expressão]
const ESTADO_REGEX = /\/(normal|preocupado|desesperado|concluido|sucesso|falha)(_\d{2}\.[a-z0-9]+)$/i;

// @audit-ok [Avatar F05 — expressão derivada de horario_agendado vs. relógio (spec §9)]
// @audit-info [Avatar F05 — usa o relógio local do dispositivo; assume o mesmo fuso do usuário]
export const deriveExpression = (habit) => {
  if (!habit) return 'normal';
  // @audit-info [Avatar F05 — meta diária atingida → expressão concluido (avatar feliz/dormindo)]
  if (habit.metaConcluidaHoje || habit.status === 'CONCLUIDO') return 'concluido';

  const horario = habit.horario_agendado;
  if (!horario) return 'normal';

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [h, m] = horario.split(':').map(Number);
  const targetMinutes = h * 60 + m;
  // @audit-info [Avatar F05 — diff em minutos até o horário-alvo; negativo significa atraso]
  const diff = targetMinutes - currentMinutes;

  // @audit-info [Avatar F05 — da hora marcada em diante permanece DESESPERADO até a virada do dia; <2h = PREOCUPADO; senão NORMAL]
  if (diff <= 0) return 'desesperado';
  if (diff <= 120) return 'preocupado';
  return 'normal';
};

// @audit-ok [Avatar F05 — troca o segmento {estado} na avatarUrl do backend e prefixa o host de assets]
export const buildAvatarUrl = (avatarUrl, expressao) => {
  if (!avatarUrl) return null;
  // @audit-info [Avatar F05 — o backend resolve {molde} e {nivel} (sempre estado NORMAL); o front só substitui o {estado}]
  const swapped = ESTADO_REGEX.test(avatarUrl)
    ? avatarUrl.replace(ESTADO_REGEX, `/${expressao}$2`)
    : avatarUrl;
  return swapped.startsWith('http') ? swapped : `${ASSET_BASE_URL}${swapped}`;
};
