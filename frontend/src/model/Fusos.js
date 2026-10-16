import { partesNoFuso } from '@/utils/fuso';

// Fusos aceitos pelo Perfil e pelo guia: Brasil e América do Norte. A mesma lista fica no servidor,
// em infra/util/FusosSuportados.java. O deslocamento UTC é calculado na hora, porque os fusos da
// América do Norte mudam com o horário de verão.
export const GRUPOS_DE_FUSO = { BRASIL: 'brasil', AMERICA_DO_NORTE: 'americaDoNorte' };

export const FUSOS = [
  { value: 'America/Noronha', grupo: 'brasil', cidade: { 'pt-BR': 'Fernando de Noronha', 'en-US': 'Fernando de Noronha' } },
  { value: 'America/Belem', grupo: 'brasil', cidade: { 'pt-BR': 'Belém', 'en-US': 'Belém' } },
  { value: 'America/Fortaleza', grupo: 'brasil', cidade: { 'pt-BR': 'Fortaleza', 'en-US': 'Fortaleza' } },
  { value: 'America/Recife', grupo: 'brasil', cidade: { 'pt-BR': 'Recife', 'en-US': 'Recife' } },
  { value: 'America/Araguaina', grupo: 'brasil', cidade: { 'pt-BR': 'Araguaína', 'en-US': 'Araguaína' } },
  { value: 'America/Maceio', grupo: 'brasil', cidade: { 'pt-BR': 'Maceió', 'en-US': 'Maceió' } },
  { value: 'America/Bahia', grupo: 'brasil', cidade: { 'pt-BR': 'Salvador', 'en-US': 'Salvador' } },
  { value: 'America/Sao_Paulo', grupo: 'brasil', cidade: { 'pt-BR': 'Brasília / São Paulo', 'en-US': 'Brasília / São Paulo' } },
  { value: 'America/Santarem', grupo: 'brasil', cidade: { 'pt-BR': 'Santarém', 'en-US': 'Santarém' } },
  { value: 'America/Campo_Grande', grupo: 'brasil', cidade: { 'pt-BR': 'Campo Grande', 'en-US': 'Campo Grande' } },
  { value: 'America/Cuiaba', grupo: 'brasil', cidade: { 'pt-BR': 'Cuiabá', 'en-US': 'Cuiabá' } },
  { value: 'America/Porto_Velho', grupo: 'brasil', cidade: { 'pt-BR': 'Porto Velho', 'en-US': 'Porto Velho' } },
  { value: 'America/Boa_Vista', grupo: 'brasil', cidade: { 'pt-BR': 'Boa Vista', 'en-US': 'Boa Vista' } },
  { value: 'America/Manaus', grupo: 'brasil', cidade: { 'pt-BR': 'Manaus', 'en-US': 'Manaus' } },
  { value: 'America/Eirunepe', grupo: 'brasil', cidade: { 'pt-BR': 'Eirunepé', 'en-US': 'Eirunepé' } },
  { value: 'America/Rio_Branco', grupo: 'brasil', cidade: { 'pt-BR': 'Rio Branco', 'en-US': 'Rio Branco' } },
  { value: 'America/St_Johns', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Terra Nova (St. John’s)', 'en-US': 'Newfoundland (St. John’s)' } },
  { value: 'America/Halifax', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Halifax', 'en-US': 'Halifax' } },
  { value: 'America/Toronto', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Toronto', 'en-US': 'Toronto' } },
  { value: 'America/New_York', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Nova York', 'en-US': 'New York' } },
  { value: 'America/Chicago', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Chicago', 'en-US': 'Chicago' } },
  { value: 'America/Winnipeg', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Winnipeg', 'en-US': 'Winnipeg' } },
  { value: 'America/Regina', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Regina', 'en-US': 'Regina' } },
  { value: 'America/Mexico_City', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Cidade do México', 'en-US': 'Mexico City' } },
  { value: 'America/Cancun', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Cancún', 'en-US': 'Cancún' } },
  { value: 'America/Denver', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Denver', 'en-US': 'Denver' } },
  { value: 'America/Edmonton', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Edmonton', 'en-US': 'Edmonton' } },
  { value: 'America/Phoenix', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Phoenix', 'en-US': 'Phoenix' } },
  { value: 'America/Los_Angeles', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Los Angeles', 'en-US': 'Los Angeles' } },
  { value: 'America/Vancouver', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Vancouver', 'en-US': 'Vancouver' } },
  { value: 'America/Tijuana', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Tijuana', 'en-US': 'Tijuana' } },
  { value: 'America/Anchorage', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Anchorage (Alasca)', 'en-US': 'Anchorage (Alaska)' } },
  { value: 'Pacific/Honolulu', grupo: 'americaDoNorte', cidade: { 'pt-BR': 'Honolulu (Havaí)', 'en-US': 'Honolulu (Hawaii)' } },
];

const SUPORTADOS = new Set(FUSOS.map((f) => f.value));

export function fusoSuportado(fuso) {
  return SUPORTADOS.has(fuso);
}

// Diferença entre o relógio do fuso e o UTC, em minutos, no instante dado.
export function deslocamentoEmMinutos(fuso, agora = new Date()) {
  const p = partesNoFuso(agora, fuso);
  const relogioDoFuso = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto);
  const utc = Date.UTC(
    agora.getUTCFullYear(),
    agora.getUTCMonth(),
    agora.getUTCDate(),
    agora.getUTCHours(),
    agora.getUTCMinutes()
  );
  return Math.round((relogioDoFuso - utc) / 60000);
}

export function textoDoDeslocamento(minutos) {
  const sinal = minutos < 0 ? '−' : '+';
  const absoluto = Math.abs(minutos);
  const horas = Math.floor(absoluto / 60);
  const resto = absoluto % 60;
  return `UTC${sinal}${horas}${resto ? `:${String(resto).padStart(2, '0')}` : ''}`;
}

export function rotuloDoFuso(fuso, idioma, agora = new Date()) {
  const item = FUSOS.find((f) => f.value === fuso);
  const cidade = item ? item.cidade[idioma] || item.cidade['pt-BR'] : fuso;
  return `${cidade} (${textoDoDeslocamento(deslocamentoEmMinutos(fuso, agora))})`;
}

// Fuso do aparelho, se for um dos aceitos; senão, null.
export function fusoDoAparelho() {
  try {
    const fuso = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return fusoSuportado(fuso) ? fuso : null;
  } catch {
    return null;
  }
}
