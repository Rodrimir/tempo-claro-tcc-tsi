import axios from 'axios';
import { getAuthToken } from '@/utils/storage';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://tempo-claro-tcc-tsi.onrender.com/api',
  timeout: 60000,
});

api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let unauthorizedHandler = null;

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      // @note - 4.2 (Cadastro) interceptor de resposta: em qualquer 401/403 de rotas que não
      // sejam /auth/login ou /auth/register, dispara o tratamento de sessão expirada. Como a
      // rota de cadastro é permitAll no backend (ver SecurityConfig.java, item 6.1), esse
      // interceptor nunca chega a agir sobre uma resposta de registro.
      const url = error.config?.url || '';
      const isAuthUrl = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isAuthUrl && unauthorizedHandler) {
        unauthorizedHandler();
      }
    }
    return Promise.reject(error);
  }
);

export const login = async (data) => api.post('/auth/login', data);

// @note - 4.1 (Cadastro) register: POST /auth/register com o payload montado em
// AuthContext.jsx (item 3.1). Ver README §8 > Cadastro > item 4.
export const register = async (data) => api.post('/auth/register', data);

export const verifyEmail = async (data) => api.post('/auth/verify-email', data);

export const resendVerificationCode = async (data) => api.post('/auth/resend-code', data);

export const forgotPassword = async (data) => api.post('/auth/forgot-password', data);

export const resetPassword = async (data) => api.post('/auth/reset-password', data);

export const getDashboard = async () => api.get('/dashboard');

export const submitExecution = async (id, payload) => api.post(`/habits/${id}/executions`, payload);

export const buyShield = async (id) => api.post(`/habits/${id}/shield`);

export const updateProfile = async (data) => api.put('/profile', data);

export const getMe = async () => api.get('/me');

export const createHabit = async (data) => api.post('/habits', data);

export const updateHabit = async (id, data) => api.put(`/habits/${id}`, data);

export const archiveHabit = async (id) => api.delete(`/habits/${id}`);

export const getMonthlyStats = async (habitoId) => api.get('/stats/monthly', { params: { habitoId } });

export const getPreTaskPriming = async (id) => api.get(`/habits/${id}/priming`);

export const getCalibrationQuestions = async (categoria) =>
  api.get('/calibration/questions', { params: { categoria } });

export const submitCalibration = async (categoria, respostas) =>
  api.post('/calibration', { categoria, respostas });
