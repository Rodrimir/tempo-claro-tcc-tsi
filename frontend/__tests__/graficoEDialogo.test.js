import { estadoDoDia, ESTADOS_DO_DIA, topoDoGrafico, dataCurta, mostrarRotulo, diaDaSemana } from '@/pages/Stats/grafico';
import { medidasDoDialogo } from '@/components/common/Dialogo/medidas';
import { confirmacaoDeExclusaoValida } from '@/utils/exclusao';
import { traduzir } from '@/i18n';

describe('gráfico de desempenho', () => {
  const dia = (extra) => ({ data: '2026-10-16', valor_realizado: 0, meta_cumprida: false, parcial: false, dia_programado: true, ...extra });

  test('estado de cada barra', () => {
    expect(estadoDoDia(dia({ antes_da_criacao: true, dia_programado: false }))).toBe(ESTADOS_DO_DIA.ANTES);
    expect(estadoDoDia(dia({ dispensado: true }))).toBe(ESTADOS_DO_DIA.DISPENSADO);
    expect(estadoDoDia(dia({ meta_cumprida: true, valor_realizado: 10 }))).toBe(ESTADOS_DO_DIA.CUMPRIDA);
    expect(estadoDoDia(dia({ parcial: true, valor_realizado: 3 }))).toBe(ESTADOS_DO_DIA.PARCIAL);
    expect(estadoDoDia(dia({ valor_realizado: 4 }))).toBe(ESTADOS_DO_DIA.PARCIAL);
    expect(estadoDoDia(dia({ dia_programado: false }))).toBe(ESTADOS_DO_DIA.FOLGA);
    expect(estadoDoDia(dia())).toBe(ESTADOS_DO_DIA.SEM_EXECUCAO);
  });

  test('todo estado tem texto nos dois idiomas', () => {
    Object.values(ESTADOS_DO_DIA).forEach((estado) => {
      expect(traduzir('pt-BR', `stats.estado.${estado}`)).not.toContain('stats.');
      expect(traduzir('en-US', `stats.estado.${estado}`)).not.toContain('stats.');
    });
  });

  test('a linha da meta sempre cabe no gráfico', () => {
    expect(topoDoGrafico([dia({ valor_realizado: 5 })], 10)).toBe(12);
    expect(topoDoGrafico([dia({ valor_realizado: 30 })], 10)).toBe(35);
    expect(topoDoGrafico([], 0)).toBe(1);
  });

  test('data curta no formato de cada idioma', () => {
    expect(dataCurta('2026-10-05', 'pt-BR')).toBe('05/10');
    expect(dataCurta('2026-10-05', 'en-US')).toBe('10/05');
    expect(diaDaSemana('2026-10-16')).toBe(5);
  });

  test('rótulos: todos em 7 dias, de 5 em 5 e hoje em 30', () => {
    expect([...Array(7).keys()].every((i) => mostrarRotulo(i, 7))).toBe(true);
    const em30 = [...Array(30).keys()].filter((i) => mostrarRotulo(i, 30));
    expect(em30).toEqual([4, 9, 14, 19, 24, 29]);
  });
});

describe('diálogos responsivos', () => {
  test('margem de 16 px, no máximo 420 px, e botões empilhados abaixo de 360 px', () => {
    expect(medidasDoDialogo(320, 568)).toEqual({ largura: 288, alturaMaxima: 482, empilharBotoes: true });
    expect(medidasDoDialogo(412, 915).largura).toBe(380);
    expect(medidasDoDialogo(412, 915).empilharBotoes).toBe(false);
    expect(medidasDoDialogo(800, 1280).largura).toBe(420);
    expect(medidasDoDialogo(360, 640, { top: 24, bottom: 48 }).alturaMaxima).toBe(482);
  });
});

describe('confirmação da exclusão de conta', () => {
  test('só a palavra exata do idioma habilita', () => {
    const pt = traduzir('pt-BR', 'perfil.palavraExcluir');
    const en = traduzir('en-US', 'perfil.palavraExcluir');
    expect(pt).toBe('excluir!');
    expect(en).toBe('delete!');
    expect(confirmacaoDeExclusaoValida('excluir!', pt)).toBe(true);
    expect(confirmacaoDeExclusaoValida('excluir! ', pt)).toBe(true);
    expect(confirmacaoDeExclusaoValida('excluir', pt)).toBe(false);
    expect(confirmacaoDeExclusaoValida('Excluir!', pt)).toBe(false);
    expect(confirmacaoDeExclusaoValida('delete!', pt)).toBe(false);
    expect(confirmacaoDeExclusaoValida('', pt)).toBe(false);
    expect(confirmacaoDeExclusaoValida(undefined, pt)).toBe(false);
  });
});
