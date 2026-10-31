// O dia do hábito vira no fuso gravado no perfil, que é o que o servidor usa na apuração, e não no
// relógio do aparelho. Estas funções leem data e hora "de parede" nesse fuso via Intl, como o
// tema dinâmico já fazia em ThemeToggleContext.

export const FUSO_PADRAO = 'America/Sao_Paulo';

let fusoAtual = FUSO_PADRAO;

export function definirFusoDoUsuario(fuso) {
  fusoAtual = fuso || FUSO_PADRAO;
}

export function fusoDoUsuario() {
  return fusoAtual;
}

const formatadores = new Map();

function formatadorPara(fuso) {
  if (!formatadores.has(fuso)) {
    formatadores.set(
      fuso,
      new Intl.DateTimeFormat('en-US', {
        timeZone: fuso,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      })
    );
  }
  return formatadores.get(fuso);
}

function lerPartes(formatador, data) {
  if (typeof formatador.formatToParts === 'function') {
    const valores = {};
    for (const parte of formatador.formatToParts(data)) valores[parte.type] = parte.value;
    return valores;
  }
  // Sem formatToParts, o formato en-US é "MM/DD/AAAA, HH:MM:SS".
  const [mes, dia, ano, hora, minuto, segundo] = formatador.format(data).match(/\d+/g);
  return { month: mes, day: dia, year: ano, hour: hora, minute: minuto, second: segundo };
}

export function partesNoFuso(data = new Date(), fuso = fusoAtual) {
  let valores;
  try {
    valores = lerPartes(formatadorPara(fuso), data);
  } catch {
    valores = lerPartes(formatadorPara(FUSO_PADRAO), data);
  }
  const ano = Number(valores.year);
  const mes = Number(valores.month);
  const dia = Number(valores.day);
  return {
    ano,
    mes,
    dia,
    hora: Number(valores.hour) % 24,
    minuto: Number(valores.minute),
    segundo: Number(valores.second),
    diaDaSemana: new Date(Date.UTC(ano, mes - 1, dia)).getUTCDay(),
  };
}

export function somarDias({ ano, mes, dia }, quantidade) {
  const data = new Date(Date.UTC(ano, mes - 1, dia + quantidade));
  return {
    ano: data.getUTCFullYear(),
    mes: data.getUTCMonth() + 1,
    dia: data.getUTCDate(),
    diaDaSemana: data.getUTCDay(),
  };
}

// Instante absoluto em que o relógio do fuso marca a data e a hora pedidas. Duas correções bastam
// mesmo perto de troca de horário de verão.
export function instanteNoFuso({ ano, mes, dia }, hora, minuto, fuso = fusoAtual) {
  const desejado = Date.UTC(ano, mes - 1, dia, hora, minuto);
  let palpite = desejado;
  for (let i = 0; i < 2; i += 1) {
    const p = partesNoFuso(new Date(palpite), fuso);
    const lido = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto);
    palpite -= lido - desejado;
  }
  return new Date(palpite);
}
