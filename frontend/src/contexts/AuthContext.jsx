import { createContext, useContext, useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useRouter } from 'expo-router';
import {
  login as apiLogin,
  register as apiRegister,
  verifyEmail as apiVerifyEmail,
  resetPassword as apiResetPassword,
  getMe,
  setUnauthorizedHandler,
} from '@/services/api';
import { cancelarTodas } from '@/services/notificacoes';
import { definirFusoDoUsuario } from '@/utils/fuso';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { traduzir, IDIOMA_PADRAO } from '@/i18n';
import {
  setAuthToken,
  clearAuthToken,
  getAuthToken,
  setUserProfile,
  getUserProfile,
  clearUserProfile,
} from '@/utils/storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Atualizado durante a renderização, e não num efeito, para que as telas filhas já leiam o fuso
  // novo na mesma passada em que recebem o usuário.
  definirFusoDoUsuario(user?.fuso_horario);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        const salvo = await getUserProfile();
        try {
          const { data: perfil } = await getMe();
          const atualizado = {
            ...(salvo || {}),
            name: perfil.nome ?? salvo?.name,
            email: perfil.email ?? salvo?.email,
            fuso_horario: perfil.fuso_horario ?? salvo?.fuso_horario,
            tema: perfil.tema ?? salvo?.tema,
            preferencia_idioma: perfil.preferencia_idioma ?? salvo?.preferencia_idioma,
          };
          await setUserProfile(atualizado);
          setUser(atualizado);
        } catch (erro) {
          const status = erro?.response?.status;
          if (status === 401 || status === 403) throw erro;
          // Sem resposta, tempo esgotado ou erro do servidor: a API pode estar acordando no
          // Render. A sessão salva continua valendo; um token vencido aparece na próxima chamada.
          setUser(salvo);
        }
        setIsAuthenticated(true);
      } catch (_error) {
        setIsAuthenticated(false);
        await clearAuthToken();
        await clearUserProfile();
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(async () => {
      const idioma = (await AsyncStorage.getItem('idioma')) || IDIOMA_PADRAO;
      DeviceEventEmitter.emit('tempoClaro:toast', {
        message: traduzir(idioma, 'comum.sessaoExpirada'),
        type: 'error',
        duration: 2000,
      });
      setTimeout(async () => {
        await clearAuthToken();
        await clearUserProfile();
        setIsAuthenticated(false);
        setUser(null);
        router.replace('/login');
      }, 2000);
    });
  }, [router]);

  const persistSession = async (response) => {
    const token = response.data?.token;
    const profile = response.data?.user || null;
    if (token) {
      await setAuthToken(token);
      if (profile) {
        await setUserProfile(profile);
        setUser(profile);
      }
      setIsAuthenticated(true);
    }
  };

  const login = async (data) => {
    const payload = {
      email: data.email,
      password: data.senha,
    };
    const response = await apiLogin(payload);
    await persistSession(response);
  };

  // @note - 3.1 (Cadastro) register: traduz os campos do formulário (nome, email, senha, idioma)
  // para o payload que a API espera (password, preferencia_idioma) e delega a chamada HTTP (ver
  // README §8 > Cadastro > item 4). Diferente de login, confirmarEmail e redefinirSenha, não
  // chama persistSession: o cadastro isolado nunca grava token nem autentica o usuário.
  const register = async (data) => {
    const payload = {
      nome: data.nome,
      email: data.email,
      password: data.senha,
      preferencia_idioma: data.idioma,
    };
    await apiRegister(payload);
  };

  const confirmarEmail = async (email, codigo) => {
    const response = await apiVerifyEmail({ email, codigo });
    await persistSession(response);
  };

  const redefinirSenha = async (email, codigo, novaSenha) => {
    const response = await apiResetPassword({ email, codigo, nova_senha: novaSenha });
    await persistSession(response);
  };

  const logout = async () => {
    setIsAuthenticated(false);
    setUser(null);
    await clearAuthToken();
    await clearUserProfile();
    await cancelarTodas().catch(() => {});
  };

  const updateLocalUser = async (patch) => {
    const next = { ...(user || {}), ...patch };
    await setUserProfile(next);
    setUser(next);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        loading,
        user,
        login,
        register,
        confirmarEmail,
        redefinirSenha,
        logout,
        updateLocalUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
