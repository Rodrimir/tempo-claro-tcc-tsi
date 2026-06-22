import React, { createContext, useContext, useState } from 'react';

// @audit-ok [CurrentHabitContext — compartilha o hábito ativo do carrossel entre Home, BottomNav, PreTask, Execution e Stats]

const CurrentHabitContext = createContext();

export const CurrentHabitProvider = ({ children }) => {
  const [currentHabit, setCurrentHabit] = useState(null);
  return (
    <CurrentHabitContext.Provider value={{ currentHabit, setCurrentHabit }}>
      {children}
    </CurrentHabitContext.Provider>
  );
};

export const useCurrentHabit = () => useContext(CurrentHabitContext);
