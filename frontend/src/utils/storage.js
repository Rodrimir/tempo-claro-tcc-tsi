import CryptoJS from 'crypto-js';

const SECRET_KEY = import.meta.env.VITE_CRYPTO_SECRET || '20211PL.TSI0023';

// @audit-ok @CryptoJS@ Funções para encriptar e decriptar dados no local storage

const encryptData = (data) => {
  if (data === null || data === undefined) return null;
  const stringified = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(stringified, SECRET_KEY).toString();
};

const decryptData = (ciphertext) => {
  if (!ciphertext) return null;
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedString) return null;

    try {
      return JSON.parse(decryptedString);
    } catch (e) {
      return decryptedString;
    }
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    return null;
  }
};

// @audit-ok getAuthToken e setAuthToken pelo o localStorage

// @audit-ok Atividade 7

export const saveExecutionState = (habitId, token, elapsed, startedAt) => {
  const payload = { token, elapsed, startedAt };
  const encrypted = encryptData(payload);
  localStorage.setItem(`tempoClaro_exec_${habitId}`, encrypted);
};

export const loadExecutionState = (habitId) => {
  const encrypted = localStorage.getItem(`tempoClaro_exec_${habitId}`);
  return decryptData(encrypted);
};

export const clearExecutionState = (habitId) => {
  localStorage.removeItem(`tempoClaro_exec_${habitId}`);
};

export const isWithinTolerance = (lastTimestamp) => {
  if (!lastTimestamp) return true;
  const diff = Date.now() - parseInt(lastTimestamp, 10);
  return diff < 3600000;
};

export const getAuthToken = () => {
  const encrypted = localStorage.getItem('tempoClaro_token');
  return decryptData(encrypted);
};

export const setAuthToken = (token) => {
  const encrypted = encryptData(token);
  localStorage.setItem('tempoClaro_token', encrypted);
};

export const clearAuthToken = () => {
  localStorage.removeItem('tempoClaro_token');
};
