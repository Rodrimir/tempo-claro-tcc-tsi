// @audit-ok: FRONTEND-storage.js-01
export const saveExecutionState = (habitId, token, elapsed, startedAt) => {
  localStorage.setItem(`tempoClaro_exec_${habitId}`, JSON.stringify({ token, elapsed, startedAt }));
};
export const loadExecutionState = (habitId) => {
  const data = localStorage.getItem(`tempoClaro_exec_${habitId}`);
  return data ? JSON.parse(data) : null;
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
  return localStorage.getItem('tempoClaro_token');
};
export const setAuthToken = (token) => {
  localStorage.setItem('tempoClaro_token', token);
};
export const clearAuthToken = () => {
  localStorage.removeItem('tempoClaro_token');
};
