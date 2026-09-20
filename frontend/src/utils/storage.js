import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveExecutionState = async (habitId, token, elapsed, startedAt) => {
  const payload = { token, elapsed, startedAt };
  await AsyncStorage.setItem(`tempoClaro_exec_${habitId}`, JSON.stringify(payload));
};

export const loadExecutionState = async (habitId) => {
  const stored = await AsyncStorage.getItem(`tempoClaro_exec_${habitId}`);
  return stored ? JSON.parse(stored) : null;
};

export const clearExecutionState = async (habitId) => {
  await AsyncStorage.removeItem(`tempoClaro_exec_${habitId}`);
};

export const isWithinTolerance = async (lastTimestamp) => {
  if (!lastTimestamp) return true;
  const diff = Date.now() - parseInt(lastTimestamp, 10);
  return diff < 3600000;
};

export const saveExecutingHabitId = async (habitId) => {
  await AsyncStorage.setItem('tempoClaro_execucao_habito_id', JSON.stringify(habitId));
};

export const loadExecutingHabitId = async () => {
  const stored = await AsyncStorage.getItem('tempoClaro_execucao_habito_id');
  return stored ? JSON.parse(stored) : null;
};

export const clearExecutingHabitId = async () => {
  await AsyncStorage.removeItem('tempoClaro_execucao_habito_id');
};

export const getAuthToken = async () => {
  return SecureStore.getItemAsync('tempoClaro_token');
};

export const setAuthToken = async (token) => {
  await SecureStore.setItemAsync('tempoClaro_token', token);
};

export const clearAuthToken = async () => {
  await SecureStore.deleteItemAsync('tempoClaro_token');
};

export const setUserProfile = async (profile) => {
  await AsyncStorage.setItem('tempoClaro_user', JSON.stringify(profile));
};

export const getUserProfile = async () => {
  const stored = await AsyncStorage.getItem('tempoClaro_user');
  return stored ? JSON.parse(stored) : null;
};

export const clearUserProfile = async () => {
  await AsyncStorage.removeItem('tempoClaro_user');
};
