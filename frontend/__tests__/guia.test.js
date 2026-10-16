import { passosDoGuia, deveMostrarGuia, proximaEtapa, posicaoDoBalao, ALVOS } from '@/onboarding/passos';
import { traduzir } from '@/i18n';

describe('guia de primeiro acesso', () => {
  test('conta sem hábito termina criando o primeiro, com o botão tocável', () => {
    const passos = passosDoGuia({ temHabitos: false });
    const final = passos[passos.length - 1];
    expect(final).toMatchObject({ id: 'final', alvo: ALVOS.CRIAR, interativo: true });
    expect(passos.filter((p) => p.interativo)).toHaveLength(1);
  });

  test('conta com hábito termina com "Entendi"', () => {
    const passos = passosDoGuia({ temHabitos: true });
    expect(passos[passos.length - 1]).toMatchObject({ conclui: true });
  });

  test('a sequência apresenta as abas, depois ofensiva, moedas, escudos e gráfico', () => {
    const ids = passosDoGuia({ temHabitos: false }).map((p) => p.id);
    expect(ids).toEqual(['boasVindas', 'inicio', 'dados', 'central', 'loja', 'perfil', 'ofensiva', 'moedas', 'escudos', 'grafico', 'final']);
  });

  test('todo passo tem fala em pt e en', () => {
    for (const temHabitos of [true, false]) {
      passosDoGuia({ temHabitos }).forEach((p) => {
        expect(traduzir('pt-BR', `guia.passos.${p.id}`)).not.toBe(`guia.passos.${p.id}`);
        expect(traduzir('en-US', `guia.passos.${p.id}`)).not.toBe(`guia.passos.${p.id}`);
      });
    }
  });

  test('o guia só aparece quando o servidor diz que não foi concluído', () => {
    expect(deveMostrarGuia({ onboarding_concluido: false })).toBe(true);
    expect(deveMostrarGuia({ onboarding_concluido: true })).toBe(false);
    expect(deveMostrarGuia({})).toBe(false);
    expect(deveMostrarGuia(null)).toBe(false);
  });

  test('avançar não passa do último passo', () => {
    expect(proximaEtapa(9, 11)).toBe(10);
    expect(proximaEtapa(10, 11)).toBe(10);
  });

  test('o balão fica sempre dentro da tela', () => {
    const telas = [{ width: 320, height: 568 }, { width: 412, height: 915 }, { width: 800, height: 1280 }];
    const alvos = [null, { x: 0, y: 0, w: 60, h: 60 }, { x: 260, y: 500, w: 60, h: 60 }, { x: 150, y: 860, w: 60, h: 50 }];
    telas.forEach((tela) =>
      alvos.forEach((alvo) => {
        const p = posicaoDoBalao(alvo, tela, 170);
        expect(p.left).toBeGreaterThanOrEqual(16);
        expect(p.left + p.width).toBeLessThanOrEqual(tela.width - 16);
        expect(p.top).toBeGreaterThanOrEqual(16);
        expect(p.top + 170).toBeLessThanOrEqual(tela.height - 16 + 0.001);
      })
    );
  });
});
