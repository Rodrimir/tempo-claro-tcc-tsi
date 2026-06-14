import axios from 'axios';
import { getAuthToken, clearAuthToken } from '../utils/storage';

const api = axios.create({
  // audit-ok: FRONT-API-01 - URL base de produção no Render
  baseURL: 'https://tempo-claro-tcc-tsi.onrender.com/api/v1', 
});

// audit-ok: FRONT-API-02 - Interceptor para injeção automática de Bearer Token JWT
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

export const login = async (data) => api.post('/auth/login', data);
export const register = async (data) => api.post('/auth/register', data);
export const getDashboard = async () => api.get('/dashboard');
export const submitExecution = async (id, payload) => api.post(`/habits/${id}/executions`, payload);
export const buyShield = async (id) => api.post(`/habits/${id}/shield`);
export const updateProfile = async (data) => api.put('/profile', data);
export const createHabit = async (data) => api.post('/habits', data);
export const updateHabit = async (id, data) => api.put(`/habits/${id}`, data);
export const archiveHabit = async (id) => api.delete(`/habits/${id}`);
export const getWeeklyStats = async () => api.get('/stats/weekly');
export const getPreTaskPriming = async (id) => api.get(`/habits/${id}/priming`);

export default api;
