import axios from 'axios';
import { getAuthToken } from '../utils/storage';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'https://tempo-claro-tcc-tsi.onrender.com/api',
  timeout: 15000,
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

// 401 e 403 derrubam a sessão. A API segue a convenção da §5.1 da monografia, que
// separa "credenciais inválidas" (401, só no login) de "token ausente ou expirado"
// (403). Antes daqui só olhar o 401, um token expirado devolvia 403 e o app ficava
// preso numa tela vazia em vez de mandar o usuário para o login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
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

export const register = async (data) => api.post('/auth/register', data);

export const getDashboard = async () => api.get('/dashboard');

export const submitExecution = async (id, payload) => api.post(`/habits/${id}/executions`, payload);

export const buyShield = async (id) => api.post(`/habits/${id}/shield`);

export const updateProfile = async (data) => api.put('/profile', data);

export const getMe = async () => api.get('/me');

export const createHabit = async (data) => api.post('/habits', data);

export const updateHabit = async (id, data) => api.put(`/habits/${id}`, data);

export const archiveHabit = async (id) => api.delete(`/habits/${id}`);

// A janela virou mensal (30 dias). /stats/weekly continua existindo como alias no
// backend, mas o nome canônico é este.
export const getMonthlyStats = async (habitoId) => api.get('/stats/monthly', { params: { habitoId } });

export const getPreTaskPriming = async (id) => api.get(`/habits/${id}/priming`);

// Calibração assistida de metas (RF20/RNF04).
//
// O questionário inteiro vem do servidor: perguntas, rótulos, opções e pesos moram
// em resources/calibracao/catalogo-v1.json, não aqui. O app só sabe desenhar os cinco
// TIPOS de resposta — trocar as perguntas não exige publicar versão nova do app.
export const getCalibrationQuestions = async (categoria) =>
  api.get('/calibration/questions', { params: { categoria } });

export const submitCalibration = async (categoria, respostas) =>
  api.post('/calibration', { categoria, respostas });

export default api;
