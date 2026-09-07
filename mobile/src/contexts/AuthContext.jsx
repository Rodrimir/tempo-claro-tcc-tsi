import { createContext, useContext, useState, useEffect } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { useRouter } from 'expo-router';
import { login as apiLogin, register as apiRegister, getDashboard, setUnauthorizedHandler } from '../services/api';
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
    setUnauthorizedHandler(() => {
      DeviceEventEmitter.emit('tempoClaro:toast', {
        message: 'Sua sessão expirou. Entre novamente.',
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
    };
    const response = await apiRegister(payload);
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
      value={{ isAuthenticated, loading, user, login, register, logout, updateLocalUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
