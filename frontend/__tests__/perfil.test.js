import { perfilDoServidor } from '@/contexts/AuthContext';
import { deveMostrarGuia } from '@/onboarding/passos';

jest.mock('expo-router', () => ({ useRouter: () => ({ replace: jest.fn() }) }));
jest.mock('expo-secure-store', () => ({}));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
jest.mock('@/services/notificacoes', () => ({ cancelarTodas: jest.fn() }));

describe('perfilDoServidor', () => {
  test('servidor que não conhece o guia não faz o app abri-lo', () => {
    const perfil = perfilDoServidor({ nome: 'Ana', email: 'ana@x.com' }, { onboarding_concluido: false });
    expect(perfil.onboarding_concluido).toBeUndefined();
    expect(deveMostrarGuia(perfil)).toBe(false);
  });

  test('servidor que manda o campo decide', () => {
    expect(deveMostrarGuia(perfilDoServidor({ onboarding_concluido: false }, null))).toBe(true);
    expect(deveMostrarGuia(perfilDoServidor({ onboarding_concluido: true }, null))).toBe(false);
  });

  test('nome vem de "nome" no /me e de "name" no login', () => {
    expect(perfilDoServidor({ nome: 'Ana' }, null).name).toBe('Ana');
    expect(perfilDoServidor({ name: 'Bia' }, null).name).toBe('Bia');
  });
});
