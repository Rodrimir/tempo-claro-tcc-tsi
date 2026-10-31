import fs from 'fs';
import path from 'path';
import { FUSOS, deslocamentoEmMinutos, textoDoDeslocamento, rotuloDoFuso, fusoSuportado } from '@/model/Fusos';

describe('model/Fusos', () => {
  test('a lista do app é a mesma do servidor (FusosSuportados.java)', () => {
    const java = fs.readFileSync(
      path.join(__dirname, '../../backend/src/main/java/com/rodrigo/backend2java/infra/util/FusosSuportados.java'),
      'utf8'
    );
    const doServidor = [...java.matchAll(/"((?:America|Pacific)\/[A-Za-z_]+)"/g)].map((m) => m[1]).sort();
    expect(FUSOS.map((f) => f.value).sort()).toEqual(doServidor);
  });

  test('todo fuso tem nome em pt e en', () => {
    FUSOS.forEach((f) => {
      expect(f.cidade['pt-BR']).toBeTruthy();
      expect(f.cidade['en-US']).toBeTruthy();
    });
  });

  test('deslocamento acompanha o horário de verão', () => {
    expect(deslocamentoEmMinutos('America/New_York', new Date('2026-07-01T12:00:00Z'))).toBe(-240);
    expect(deslocamentoEmMinutos('America/New_York', new Date('2026-12-01T12:00:00Z'))).toBe(-300);
    expect(deslocamentoEmMinutos('America/Sao_Paulo', new Date('2026-07-01T12:00:00Z'))).toBe(-180);
    expect(deslocamentoEmMinutos('America/St_Johns', new Date('2026-12-01T12:00:00Z'))).toBe(-210);
  });

  test('texto do deslocamento', () => {
    expect(textoDoDeslocamento(-180)).toBe('UTC−3');
    expect(textoDoDeslocamento(-210)).toBe('UTC−3:30');
    expect(textoDoDeslocamento(0)).toBe('UTC+0');
  });

  test('rótulo no idioma pedido', () => {
    const julho = new Date('2026-07-01T12:00:00Z');
    expect(rotuloDoFuso('America/New_York', 'pt-BR', julho)).toBe('Nova York (UTC−4)');
    expect(rotuloDoFuso('America/New_York', 'en-US', julho)).toBe('New York (UTC−4)');
  });

  test('fusos fora do Brasil e da América do Norte não são aceitos', () => {
    expect(fusoSuportado('Europe/London')).toBe(false);
    expect(fusoSuportado('America/Rio_Branco')).toBe(true);
  });
});
