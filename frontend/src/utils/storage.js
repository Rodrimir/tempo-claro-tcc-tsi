import CryptoJS from 'crypto-js';

// @audit-ok [Armazenamento Encriptado — CryptoJS AES para todos os dados sensíveis no localStorage]

const SECRET_KEY = import.meta.env.VITE_CRYPTO_SECRET || '20211PL.TSI0023';

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
    return null;
  }
};

// @audit-ok [Execução Timer (7) — salva estado encriptado do timer no localStorage]
export const saveExecutionState = (habitId, token, elapsed, startedAt) => {
  const payload = { token, elapsed, startedAt };
  const encrypted = encryptData(payload);
  localStorage.setItem(`tempoClaro_exec_${habitId}`, encrypted);
};

// @audit-ok [Execução Timer (9) — lê e decripta estado do timer do localStorage]
export const loadExecutionState = (habitId) => {
  const encrypted = localStorage.getItem(`tempoClaro_exec_${habitId}`);
  return decryptData(encrypted);
};

// @audit-ok [Execução Timer (27) — remove estado do timer após conclusão]
export const clearExecutionState = (habitId) => {
  localStorage.removeItem(`tempoClaro_exec_${habitId}`);
};

// @audit-ok [Execução Timer (10) — valida se a pausa está dentro da tolerância de 1 hora]
export const isWithinTolerance = (lastTimestamp) => {
  if (!lastTimestamp) return true;
  const diff = Date.now() - parseInt(lastTimestamp, 10);
  return diff < 3600000;
};

// @audit-ok [Verificação de Token (3) — lê e decripta JWT do localStorage]
export const getAuthToken = () => {
  const encrypted = localStorage.getItem('tempoClaro_token');
  return decryptData(encrypted);
};

// @audit-ok [Login (15) — encripta e armazena JWT no localStorage]
export const setAuthToken = (token) => {
  const encrypted = encryptData(token);
  localStorage.setItem('tempoClaro_token', encrypted);
};

// @audit-ok [Verificação de Token (13) — remove JWT do localStorage no logout ou 401]
export const clearAuthToken = () => {
  localStorage.removeItem('tempoClaro_token');
};
