import axios from 'axios';
import { DeviceEventEmitter } from 'react-native';
import { getAuthToken } from '@/utils/storage';
import { mensagemNoIdiomaAtual } from '@/utils/erros';

const URL_DA_API = process.env.EXPO_PUBLIC_API_URL || 'https://tempo-claro-tcc-tsi.onrender.com/api';

// No plano gratuito do Render a API dorme depois de um tempo parada e leva perto de um minuto para
// acordar. O limite de 90 s cobre esse primeiro acesso, e o aviso abaixo explica a demora.
const TEMPO_LIMITE_MS = 90000;
const AVISO_DE_DEMORA_MS = 6000;

const api = axios.create({
  baseURL: URL_DA_API,
  timeout: TEMPO_LIMITE_MS,
});

let requisicoesEmAndamento = 0;
let temporizadorDoAviso = null;
let avisoJaMostrado = false;

function comecarAcompanhamento() {
  requisicoesEmAndamento += 1;
  if (requisicoesEmAndamento === 1) {
    temporizadorDoAviso = setTimeout(() => {
      if (avisoJaMostrado) return;
      avisoJaMostrado = true;
      DeviceEventEmitter.emit('tempoClaro:toast', {
        message: mensagemNoIdiomaAtual('comum.servidorAcordando'),
        type: 'default',
        duration: 8000,
      });
    }, AVISO_DE_DEMORA_MS);
  }
}

function encerrarAcompanhamento(config) {
  if (!config?.acompanhada) return;
  config.acompanhada = false;
  requisicoesEmAndamento = Math.max(0, requisicoesEmAndamento - 1);
  if (requisicoesEmAndamento === 0) {
    clearTimeout(temporizadorDoAviso);
    temporizadorDoAviso = null;
    avisoJaMostrado = false;
  }
}

let acordando = null;

// Chamada fora do axios, sem token, só para tirar a API do sono enquanto a pessoa ainda está na
// tela de entrada. Usa a rota pública /health, que não toca no banco.
export function acordarServidor() {
  if (!acordando) {
    acordando = fetch(`${URL_DA_API.replace(/\/$/, '')}/health`).catch(() => null);
  }
  return acordando;
}

// O servidor responde no idioma do app: mensagens de erro e textos de sucesso vêm traduzidos.
let idiomaDasRequisicoes = 'pt-BR';

export function definirIdiomaDasRequisicoes(idioma) {
  idiomaDasRequisicoes = idioma || 'pt-BR';
}

api.interceptors.request.use(async (config) => {
  comecarAcompanhamento();
  config.acompanhada = true;
  config.headers['Accept-Language'] = idiomaDasRequisicoes;
  try {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (erro) {
    encerrarAcompanhamento(config);
    throw erro;
  }
  return config;
});

let unauthorizedHandler = null;
// Várias requisições podem voltar 403 juntas (painel e estatísticas, por exemplo); o aviso de
// sessão expirada e a saída para o login acontecem uma vez só.
let sessaoExpirando = false;

export function liberarAvisoDeSessao() {
  sessaoExpirando = false;
}

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

api.interceptors.response.use(
  (response) => {
    encerrarAcompanhamento(response.config);
    return response;
  },
  (error) => {
    encerrarAcompanhamento(error.config);
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      // @note - 4.2 (Cadastro) interceptor de resposta: em qualquer 401/403 de rotas que não
      // sejam /auth/login ou /auth/register, dispara o tratamento de sessão expirada. Como a
      // rota de cadastro é permitAll no backend (ver SecurityConfig.java, item 6.1), esse
      // interceptor nunca chega a agir sobre uma resposta de registro.
      const url = error.config?.url || '';
      const isAuthUrl = url.includes('/auth/login') || url.includes('/auth/register');
      if (!isAuthUrl && unauthorizedHandler && !sessaoExpirando) {
        sessaoExpirando = true;
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

export const excluirConta = async (confirmacao) => api.delete('/me', { data: { confirmacao } });

export const definirPreferenciasIniciais = async (preferencia_idioma, fuso_horario) =>
  api.post('/me/onboarding/preferencias', { preferencia_idioma, fuso_horario });

export const concluirOnboarding = async () => api.post('/me/onboarding/concluir');

export const createHabit = async (data) => api.post('/habits', data);

export const updateHabit = async (id, data) => api.put(`/habits/${id}`, data);

export const excluirHabito = async (id) => api.delete(`/habits/${id}`);

export const getMonthlyStats = async (habitoId) => api.get('/stats/monthly', { params: { habitoId } });

export const getWeeklyStats = async (habitoId) => api.get('/stats/weekly', { params: { habitoId } });

export const getPreTaskPriming = async (id) => api.get(`/habits/${id}/priming`);

export const getCalibrationQuestions = async (categoria) =>
  api.get('/calibration/questions', { params: { categoria } });

export const submitCalibration = async (categoria, respostas) =>
  api.post('/calibration', { categoria, respostas });
