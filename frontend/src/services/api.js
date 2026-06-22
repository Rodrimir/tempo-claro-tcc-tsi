import axios from 'axios';
import { getAuthToken, clearAuthToken } from '../utils/storage';

// @audit-ok [Instância Axios — URL base de produção + interceptores de autenticação]

const api = axios.create({
  baseURL: 'https://tempo-claro-tcc-tsi.onrender.com/api/v1',
});

// @audit-ok [Interceptor de Requisição (6) — injeta Bearer token em todas as chamadas autenticadas]
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// @audit-ok [Interceptor de Resposta (13) — captura 401 e redireciona para login]
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

// @audit-ok [Login (7) — POST /auth/login]
export const login = async (data) => api.post('/auth/login', data);

// @audit-ok [Cadastro (7) — POST /auth/register]
export const register = async (data) => api.post('/auth/register', data);

// @audit-ok [Dashboard (5) — GET /dashboard]
export const getDashboard = async () => api.get('/dashboard');

// @audit-ok [Execução Timer (17) — POST /habits/{id}/executions]
export const submitExecution = async (id, payload) => api.post(`/habits/${id}/executions`, payload);

// @audit-ok [Compra de Escudo (9) — POST /habits/{id}/shield]
export const buyShield = async (id) => api.post(`/habits/${id}/shield`);

// @audit-ok [Perfil (5) — PUT /profile]
export const updateProfile = async (data) => api.put('/profile', data);

// @audit-ok [Criar Hábito (12) — POST /habits]
export const createHabit = async (data) => api.post('/habits', data);

// @audit-ok [Atualizar Hábito — PUT /habits/{id}]
export const updateHabit = async (id, data) => api.put(`/habits/${id}`, data);

// @audit-ok [Arquivar Hábito — DELETE /habits/{id}]
export const archiveHabit = async (id) => api.delete(`/habits/${id}`);

// @audit-ok [Estatísticas (5) — GET /stats/weekly]
export const getWeeklyStats = async () => api.get('/stats/weekly');

// @audit-ok [Pré-Tarefa Priming (8) — GET /habits/{id}/priming]
export const getPreTaskPriming = async (id) => api.get(`/habits/${id}/priming`);

export default api;
