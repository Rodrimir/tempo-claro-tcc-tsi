import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getDashboard } from '../services/api';
import {
  setAuthToken,
  clearAuthToken,
  getAuthToken,
  setUserProfile,
  getUserProfile,
  clearUserProfile
} from '../utils/storage';

// @audit-ok [AuthContext — estado global de autenticação compartilhado por toda a aplicação]

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  // @audit-ok [Perfil (19) — usuário autenticado disponível globalmente]
  const [user, setUser] = useState(null);

  // @audit-ok [Verificação de Token (2) — executa ao montar o provider para checar sessão existente]
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        // @audit-ok [Verificação de Token (3) — lê JWT encriptado do localStorage]
        const token = getAuthToken();
        if (!token) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        // @audit-ok [Verificação de Token (5) — valida token chamando o dashboard]
        await getDashboard();
        // @audit-ok [Verificação de Token (12) — token válido: marca como autenticado]
        setUser(getUserProfile());
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        clearAuthToken();
        clearUserProfile();
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  // @audit-ok [Login (5) — recebe dados do formulário e chama a API de autenticação]
  const login = async (data) => {
    // @audit-ok [Login (6) — monta payload com email e password para o backend]
    const payload = {
      email: data.email,
      password: data.senha
    };
    const response = await apiLogin(payload);
    persistSession(response);
  };

  // @audit-ok [Login (15) / Cadastro (17) — guarda token e usuário da resposta]
  const persistSession = (response) => {
    const token = response.data?.token;
    const profile = response.data?.user || null;
    if (token) {
      // @audit-ok [Login (15) — armazena JWT encriptado no localStorage]
      setAuthToken(token);
      if (profile) {
        setUserProfile(profile);
        setUser(profile);
      }
      // @audit-ok [Login (16) — atualiza estado global de autenticação]
      setIsAuthenticated(true);
    }
  };

  // @audit-ok [Cadastro (5) — recebe dados do formulário e chama a API de cadastro]
  const register = async (data) => {
    // @audit-ok [Cadastro (6) — monta payload com nome, email e password]
    const payload = {
      nome: data.nome,
      email: data.email,
      password: data.senha
    };
    const response = await apiRegister(payload);
    persistSession(response);
  };

  // @audit-ok [Logout — limpa token e desmarca autenticação]
  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    clearAuthToken();
    clearUserProfile();
  };

  // @audit-ok [Perfil (20) — reflete localmente o nome novo após PUT /profile]
  const updateLocalUser = (patch) => {
    setUser(prev => {
      const next = { ...(prev || {}), ...patch };
      setUserProfile(next);
      return next;
    });
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
