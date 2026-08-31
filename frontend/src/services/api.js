import axios from 'axios';
import { getAuthToken, clearAuthToken } from '../utils/storage';

// @audit-ok [Instância Axios — URL base de produção + interceptores de autenticação]

// @audit-ok [import.meta.env.DEV é do próprio Vite: true só quando rodando via
// `npm run dev`/`vite`, sempre false no output de `vite build` (o que vai pro
// Render/APK) — troca automática por ambiente, sem editar isto à mão antes de
// um teste local e sem risco de esquecer revertido antes de um deploy.]
const api = axios.create({
  baseURL: import.meta.env.DEV ? 'http://localhost:8080/api' : 'https://tempo-claro-tcc-tsi.onrender.com/api',
});

// @audit-ok [Interceptor de Requisição (6) — injeta Bearer token em todas as chamadas autenticadas]
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// @audit-ok [E1.8 (item 2) — este módulo não é um componente React, então não
// pode chamar useToast(). Dispara um evento em window; ToastProvider escuta e
// mostra o toast de verdade. Ver contexts/ToastContext.jsx.]
const avisarSessaoExpirada = (message) => {
  window.dispatchEvent(new CustomEvent('tempoClaro:toast', { detail: { message, type: 'error', duration: 2000 } }));
};

// @audit-ok [Interceptor de Resposta (13) — captura 401 e redireciona para login]
// @audit-ok [E1.8 (item 2) — antes limpava a sessão e recarregava o login sem
// nenhuma palavra: o usuário só via a tela de login reaparecer do nada, sem
// saber se foi expulso ou se algo quebrou. Agora avisa e espera 2s antes.]
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthUrl = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthUrl) {
        avisarSessaoExpirada('Sua sessão expirou. Entre novamente.');
        await new Promise(resolve => setTimeout(resolve, 2000));
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

// @audit-ok [E1.5 (item 1) — GET /me, fonte de verdade do perfil (inclui
// fuso_horario), consultada pela tela de Perfil ao montar]
export const getMe = async () => api.get('/me');

// @audit-ok [Criar Hábito (12) — POST /habits]
export const createHabit = async (data) => api.post('/habits', data);

// @audit-ok [Atualizar Hábito — PUT /habits/{id}]
export const updateHabit = async (id, data) => api.put(`/habits/${id}`, data);

// @audit-ok [Arquivar Hábito — DELETE /habits/{id}]
export const archiveHabit = async (id) => api.delete(`/habits/${id}`);

// @audit-ok [E2.2 (item 5) — GET /stats/weekly agora exige habitoId; antes o
// endpoint não recebia hábito nenhum (nem podia, era um stub)]
export const getWeeklyStats = async (habitoId) => api.get('/stats/weekly', { params: { habitoId } });

// @audit-ok [Pré-Tarefa Priming (8) — GET /habits/{id}/priming]
export const getPreTaskPriming = async (id) => api.get(`/habits/${id}/priming`);

export default api;
