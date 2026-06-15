import axios from 'axios';
import { getAuthToken, clearAuthToken } from '../services/storage';

// @audit-ok @URL do Render@
const api = axios.create({
  baseURL: 'https://tempo-claro-tcc-tsi.onrender.com/api/v1',
});

// @audit-ok @injeção DE Bearer Token JWT@
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

// @audit-ok Endpoint de Login
export const login = async (data) => api.post('/auth/login', data);

// @audit-ok Endpoint de Cadastro
export const register = async (data) => api.post('/auth/register', data);

// @audit-ok Carregamento do Dashboard de Hábitos
export const getDashboard = async () => api.get('/dashboard');

// @audit-ok Confirmação de Execução de Hábito
export const submitExecution = async (id, payload) => api.post(`/habits/${id}/executions`, payload);

// @audit-ok Compra de Escudo Protetor (Gamificação)
export const buyShield = async (id) => api.post(`/habits/${id}/shield`);

// @audit-ok Atualização de Dados do Perfil
export const updateProfile = async (data) => api.put('/profile', data);

// @audit-ok Criação de Novo Hábito
export const createHabit = async (data) => api.post('/habits', data);

// @audit-ok Edição de Hábito Existente
export const updateHabit = async (id, data) => api.put(`/habits/${id}`, data);

// @audit-ok Deleção/Arquivamento de Hábito
export const archiveHabit = async (id) => api.delete(`/habits/${id}`);

// @audit-ok Resgate de Estatísticas Semanais
export const getWeeklyStats = async () => api.get('/stats/weekly');

// @audit-ok Gatilho de pré-tarefa
export const getPreTaskPriming = async (id) => api.get(`/habits/${id}/priming`);

export default api;
