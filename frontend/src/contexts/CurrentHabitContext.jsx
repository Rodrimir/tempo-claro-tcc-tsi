import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

const CurrentHabitContext = createContext();

export const CurrentHabitProvider = ({ children }) => {
  const [currentHabit, setCurrentHabit] = useState(null);
  const { isAuthenticated } = useAuth() || {};

  // Ao sair da conta o hábito em foco some junto, para não aparecer no cabeçalho da próxima conta.
  const [autenticadoAntes, setAutenticadoAntes] = useState(isAuthenticated);
  if (isAuthenticated !== autenticadoAntes) {
    setAutenticadoAntes(isAuthenticated);
    if (!isAuthenticated) setCurrentHabit(null);
  }

  return (
    <CurrentHabitContext.Provider value={{ currentHabit, setCurrentHabit }}>
      {children}
    </CurrentHabitContext.Provider>
  );
};

export const useCurrentHabit = () => useContext(CurrentHabitContext);
