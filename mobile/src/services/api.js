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

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthUrl = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
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

export const getWeeklyStats = async (habitoId) => api.get('/stats/weekly', { params: { habitoId } });

export const getPreTaskPriming = async (id) => api.get(`/habits/${id}/priming`);

export default api;
