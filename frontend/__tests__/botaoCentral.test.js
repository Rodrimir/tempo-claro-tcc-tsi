import { estadoDoBotaoCentral, ESTADOS_DO_BOTAO } from '@/components/layout/BottomNav/estado';
import { definirFusoDoUsuario } from '@/utils/fuso';

const habito = (extra) => ({ titulo: 'Água', status: 'PENDING', ocorrencias: [], ...extra });

describe('estadoDoBotaoCentral', () => {
  beforeEach(() => definirFusoDoUsuario('America/Sao_Paulo'));

  test('sem hábito em foco, o botão cria um hábito', () => {
    expect(estadoDoBotaoCentral(null).tipo).toBe(ESTADOS_DO_BOTAO.CRIAR);
  });

  test('hábito concluído mostra feito', () => {
    expect(estadoDoBotaoCentral(habito({ status: 'COMPLETED' })).tipo).toBe(ESTADOS_DO_BOTAO.FEITO);
  });

  test('antes de abrir mostra a hora; 15 min antes já começa', () => {
    const ocorrencias = [{ status: 'ATIVA', horario_inicio: '08:00:00' }];
    const seteDaManha = new Date('2026-10-16T10:00:00Z'); // 07:00 em São Paulo
    const seteEQuarentaECinco = new Date('2026-10-16T10:45:00Z');
    expect(estadoDoBotaoCentral(habito({ ocorrencias }), seteDaManha)).toEqual({ tipo: ESTADOS_DO_BOTAO.AGUARDANDO, hora: '08:00' });
    expect(estadoDoBotaoCentral(habito({ ocorrencias }), seteEQuarentaECinco).tipo).toBe(ESTADOS_DO_BOTAO.COMECAR);
  });

  test('sem ocorrência ativa, começa (execução extra)', () => {
    expect(estadoDoBotaoCentral(habito({ ocorrencias: [{ status: 'FEITO', horario_inicio: '08:00:00' }] })).tipo).toBe(
      ESTADOS_DO_BOTAO.COMECAR
    );
  });
});
