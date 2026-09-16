import { createContext, useContext, useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useRouter } from 'expo-router';
import {
  login as apiLogin,
  register as apiRegister,
  verifyEmail as apiVerifyEmail,
  resetPassword as apiResetPassword,
  getDashboard,
  setUnauthorizedHandler,
} from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { traduzir, IDIOMA_PADRAO } from '../i18n';
import {
  setAuthToken,
  clearAuthToken,
  getAuthToken,
  setUserProfile,
  getUserProfile,
  clearUserProfile,
} from '../utils/storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        await getDashboard();
        setUser(await getUserProfile());
        setIsAuthenticated(true);
      } catch (error) {
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
      // Este contexto fica FORA do LanguageProvider (é ele que alimenta o idioma
      // do usuário), então traduz com a função pura. O idioma é lido do disco no
      // momento do disparo, e não guardado numa variável: o handler é registrado
      // uma vez só, e qualquer cópia em memória ficaria defasada se a pessoa
      // trocasse de idioma no meio da sessão.
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
