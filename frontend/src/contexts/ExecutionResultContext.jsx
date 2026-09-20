import { createContext, useContext, useState } from 'react';

const ExecutionResultContext = createContext();

export const ExecutionResultProvider = ({ children }) => {
  const [executionResult, setExecutionResult] = useState(null);
  return (
    <ExecutionResultContext.Provider value={{ executionResult, setExecutionResult }}>
      {children}
    </ExecutionResultContext.Provider>
  );
};

export const useExecutionResult = () => useContext(ExecutionResultContext);
