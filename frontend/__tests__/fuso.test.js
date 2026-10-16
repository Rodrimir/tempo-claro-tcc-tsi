import { partesNoFuso, instanteNoFuso, somarDias, definirFusoDoUsuario } from '@/utils/fuso';
import { isDiaDaSemanaProgramado, minutosAteInicio } from '@/utils/ocorrencias';

describe('utils/fuso', () => {
  afterEach(() => definirFusoDoUsuario(null));

  test('lê a data e a hora de parede no fuso pedido', () => {
    const instante = new Date('2026-10-16T02:30:00Z');
    expect(partesNoFuso(instante, 'America/Sao_Paulo')).toMatchObject({ ano: 2026, mes: 10, dia: 15, hora: 23, minuto: 30 });
    expect(partesNoFuso(instante, 'Pacific/Honolulu')).toMatchObject({ dia: 15, hora: 16 });
    expect(partesNoFuso(instante, 'America/Noronha')).toMatchObject({ dia: 16, hora: 0, minuto: 30 });
  });

  test('fuso inválido cai no padrão em vez de quebrar', () => {
    expect(() => partesNoFuso(new Date(), 'Lua/Base')).not.toThrow();
  });

  test('instanteNoFuso volta ao mesmo relógio de parede', () => {
    const dia = { ano: 2026, mes: 10, dia: 16 };
    for (const fuso of ['America/Sao_Paulo', 'America/New_York', 'America/St_Johns', 'Pacific/Honolulu']) {
      const instante = instanteNoFuso(dia, 7, 45, fuso);
      expect(partesNoFuso(instante, fuso)).toMatchObject({ dia: 16, hora: 7, minuto: 45 });
    }
  });

  test('instanteNoFuso no fim do horário de verão americano (01/11/2026)', () => {
    const instante = instanteNoFuso({ ano: 2026, mes: 11, dia: 1 }, 9, 0, 'America/New_York');
    expect(instante.toISOString()).toBe('2026-11-01T14:00:00.000Z');
  });

  test('somarDias atravessa mês e ano', () => {
    expect(somarDias({ ano: 2026, mes: 12, dia: 31 }, 1)).toMatchObject({ ano: 2027, mes: 1, dia: 1, diaDaSemana: 5 });
  });

  test('minutosAteInicio usa o fuso do perfil, não o do aparelho', () => {
    definirFusoDoUsuario('America/New_York');
    const agora = new Date('2026-10-16T11:00:00Z'); // 07:00 em Nova York
    expect(minutosAteInicio({ horario_inicio: '08:00:00' }, agora)).toBe(60);
  });

  test('máscara semanal: domingo é a posição 0', () => {
    expect(isDiaDaSemanaProgramado('1000000', 0)).toBe(true);
    expect(isDiaDaSemanaProgramado('1000000', 1)).toBe(false);
    expect(isDiaDaSemanaProgramado(null, 3)).toBe(true);
  });
});
