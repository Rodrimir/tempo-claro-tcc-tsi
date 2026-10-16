import { IDIOMAS, traduzir } from '@/i18n';
import { mudaSoAmanha, formDataInicial } from '@/pages/CreateHabit/formModel';

const folhas = (objeto, prefixo = '') =>
  Object.entries(objeto).flatMap(([k, v]) =>
    v && typeof v === 'object' && !Array.isArray(v) ? folhas(v, `${prefixo}${k}.`) : [[`${prefixo}${k}`, v]]
  );

describe('i18n', () => {
  const pt = new Map(folhas(IDIOMAS['pt-BR'].dicionario));
  const en = new Map(folhas(IDIOMAS['en-US'].dicionario));

  test('pt e en têm as mesmas chaves', () => {
    expect([...pt.keys()].sort()).toEqual([...en.keys()].sort());
  });

  test('os marcadores {x} batem entre os idiomas', () => {
    const marcadores = (s) => (typeof s === 'string' ? [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort() : []);
    for (const [chave, valor] of pt) expect([chave, marcadores(en.get(chave))]).toEqual([chave, marcadores(valor)]);
  });

  test('o texto de desistência não usa tom punitivo', () => {
    for (const idioma of ['pt-BR', 'en-US']) {
      const textos = ['temCerteza', 'afetaConsistencia', 'voltarContinuar', 'assumirFalha', 'usarEscudo'].map((k) =>
        traduzir(idioma, `desistir.${k}`, { n: 1 })
      );
      expect(textos.join(' ')).not.toMatch(/falha|loss|fail/i);
    }
  });
});

describe('edição adiada no formulário', () => {
  const habito = {
    titulo: 'Água',
    meta_base: 1000,
    meta_maxima: null,
    incremento: 0,
    dias_incremento: 10,
    frequencia_semanal: '1111111',
    meta_frequencia_diaria: 1,
    horario_ocorrencia_atual: '08:00:00',
    ocorrencias: [{ horario_inicio: '08:00:00', horario_fim: null, status: 'ATIVA' }],
  };
  const payload = {
    meta_base: 1000,
    meta_maxima: null,
    incremento: 0,
    dias_incremento: 10,
    frequencia_semanal: '1111111',
    meta_frequencia_diaria: 1,
    horario_agendado: '08:00',
    ocorrencias: null,
  };

  test('só título e gatilho: vale na hora', () => {
    expect(mudaSoAmanha(habito, payload)).toBe(false);
  });

  test('meta ou horário: vale amanhã', () => {
    expect(mudaSoAmanha(habito, { ...payload, meta_base: 1500 })).toBe(true);
    expect(mudaSoAmanha(habito, { ...payload, horario_agendado: '09:00' })).toBe(true);
  });

  test('o formulário de edição abre com a alteração pendente', () => {
    const form = formDataInicial(
      { ...habito, alteracao_pendente: { meta_base: 1500, meta_frequencia_diaria: 1, frequencia_semanal: '0111110', ocorrencias: [{ horario_inicio: '07:30:00', horario_fim: null }] } },
      'Água'
    );
    expect(form.meta_base).toBe('1500');
    expect(form.frequencia_semanal).toEqual([1, 2, 3, 4, 5]);
    expect(form.horario).toBe('07:30');
  });
});
