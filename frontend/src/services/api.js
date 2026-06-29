import axios from 'axios';
import { getAuthToken, clearAuthToken, clearUser } from '../utils/storage';

// @audit-ok [Instância Axios — URL base configurável + interceptores de autenticação]
// Default = backend local (application-local.properties: server.port=8080). Pode-se sobrescrever
// em dev com VITE_API_BASE_URL (ex.: http://localhost:8090/api). Produção: usar a URL do Render.
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

// @audit-ok [Avatar F05 — host base dos assets estáticos (avatares) servidos pelo backend fora de /api]
export const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const api = axios.create({
  baseURL: API_BASE_URL,
});

// @audit-ok [Interceptor de Requisição (6) — injeta Bearer token em todas as chamadas autenticadas]
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// @audit-ok [Interceptor de Resposta (13) — sessão inválida volta ao login.
// O backend retorna 403 (token ausente/inválido/expirado em rota protegida) e 401 (credenciais
// de login). Tratamos ambos: fora das rotas de auth, limpa a sessão e redireciona.]
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      const url = error.config?.url || '';
      const isAuthUrl = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isAuthUrl) {
        clearAuthToken();
        clearUser();
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

// @audit-ok [Excluir Conta — DELETE /profile; envia a senha de confirmação no corpo (ação destrutiva e irreversível)]
export const deleteAccount = async (password) => api.delete('/profile', { data: { password } });

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

// @audit-ok [Sessão F09 — GET sessão viva do hábito (200 SessaoResponse ou 404)]
export const getActiveSession = async (habitoId) => api.get(`/habits/${habitoId}/sessions/active`);

// @audit-ok [Sessão F09 — POST inicia o timer; servidor define expira_em = início + 1h]
export const startSession = async (habitoId, payload) => api.post(`/habits/${habitoId}/sessions`, payload);

// @audit-ok [Sessão F09 — PATCH pausa e salva o progresso parcial]
export const pauseSession = async (habitoId, sessaoId, payload) => api.patch(`/habits/${habitoId}/sessions/${sessaoId}/pause`, payload);

// @audit-ok [Sessão F09 — PATCH retoma; se passou de 1h volta com estado TIMEOUT]
export const resumeSession = async (habitoId, sessaoId) => api.patch(`/habits/${habitoId}/sessions/${sessaoId}/resume`);

// @audit-ok [Concluir Hoje (F04) — encerra o dia e apura/credita a recompensa; POST /habits/{id}/conclude-day]
export const concludeDay = async (habitoId) => api.post(`/habits/${habitoId}/conclude-day`);

// @audit-ok [Erros — extrai a mensagem padronizada do backend ({ success:false, message }) com fallback]
export const getApiErrorMessage = (err, fallback) => err?.response?.data?.message || fallback;

export default api;
