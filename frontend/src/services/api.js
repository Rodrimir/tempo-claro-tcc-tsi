// @audit-ok: FRONTEND-api.js-01
import axios from 'axios';
import { getAuthToken, clearAuthToken } from '../utils/storage';

const api = axios.create({
  // @audit-ok: FRONT-API-01 - URL base de produção no Render
  baseURL: 'https://tempo-claro-tcc-tsi.onrender.com/api/v1', 
});

// @audit-ok: FRONT-API-02 - Interceptor para injeção automática de Bearer Token JWT
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthUrl = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthUrl) {
        clearAuthToken();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// @audit-ok: FRONT-API-REQ-01 - Endpoint de Login
export const login = async (data) => api.post('/auth/login', data);

// @audit-ok: FRONT-API-REQ-02 - Endpoint de Cadastro
export const register = async (data) => api.post('/auth/register', data);

// @audit-ok: FRONT-API-REQ-03 - Carregamento do Dashboard de Hábitos
export const getDashboard = async () => api.get('/dashboard');

// @audit-ok: FRONT-API-REQ-04 - Confirmação de Execução de Hábito
export const submitExecution = async (id, payload) => api.post(`/habits/${id}/executions`, payload);

// @audit-ok: FRONT-API-REQ-05 - Compra de Escudo Protetor (Gamificação)
export const buyShield = async (id) => api.post(`/habits/${id}/shield`);

// @audit-ok: FRONT-API-REQ-06 - Atualização de Dados do Perfil
export const updateProfile = async (data) => api.put('/profile', data);

// @audit-ok: FRONT-API-REQ-07 - Criação de Novo Hábito
export const createHabit = async (data) => api.post('/habits', data);

// @audit-ok: FRONT-API-REQ-08 - Edição de Hábito Existente
export const updateHabit = async (id, data) => api.put(`/habits/${id}`, data);

// @audit-ok: FRONT-API-REQ-09 - Deleção/Arquivamento de Hábito
export const archiveHabit = async (id) => api.delete(`/habits/${id}`);

// @audit-ok: FRONT-API-REQ-10 - Resgate de Estatísticas Semanais
export const getWeeklyStats = async () => api.get('/stats/weekly');

// @audit-ok: FRONT-API-REQ-11 - Gatilho de Priming Cognitivo pré-tarefa
export const getPreTaskPriming = async (id) => api.get(`/habits/${id}/priming`);

export default api;
