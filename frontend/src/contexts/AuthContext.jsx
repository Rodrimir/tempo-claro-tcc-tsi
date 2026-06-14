// @audit-ok: FRONTEND-AuthContext.jsx-01
import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin, register as apiRegister, getDashboard } from '../services/api';
import { setAuthToken, clearAuthToken, getAuthToken } from '../utils/storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = getAuthToken();
      if (!token) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }
      
      try {
        await getDashboard();
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
        clearAuthToken();
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, []);

  const login = async (data) => {
    const payload = {
      email: data.email,
      password: data.senha
    };
    const response = await apiLogin(payload);
    const token = response.data.token;
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }
  };

  const register = async (data) => {
    const payload = {
      nome: data.nome,
      email: data.email,
      password: data.senha
    };
    const response = await apiRegister(payload);
    const token = response.data.token;
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    clearAuthToken();
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
