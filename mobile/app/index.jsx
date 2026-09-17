import { Redirect } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

// Sem checar a sessão aqui, a Home montava mesmo deslogado e disparava um
// /dashboard condenado antes de o AuthGuard redirecionar — era um "não foi
// possível carregar seus hábitos" que aparecia na abertura do app sem que
// nenhuma tela de hábito tivesse sido aberta de fato.
export default function Index() {
  const { isAuthenticated } = useAuth();
  return <Redirect href={isAuthenticated ? '/home' : '/login'} />;
}
