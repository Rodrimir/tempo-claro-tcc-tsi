import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CurrentHabitProvider } from './contexts/CurrentHabitContext';
import { ThemeToggleProvider } from './contexts/ThemeToggleContext';
import { ToastProvider } from './contexts/ToastContext';

// @audit-ok [main.jsx — ponto de entrada da aplicação; aplica tema escuro do sistema e monta a árvore de providers]
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.body.classList.add('dark-mode');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* @audit-ok [AuthProvider — estado global de autenticação e JWT encriptado no localStorage] */}
    <AuthProvider>
      {/* @audit-ok [CurrentHabitProvider — hábito ativo do carrossel compartilhado entre Home, BottomNav, PreTask, Execution e Stats] */}
      <CurrentHabitProvider>
        {/* @audit-ok [ThemeToggleProvider — controla alternância entre tema claro e escuro] */}
        <ThemeToggleProvider>
          {/* @audit-ok [ToastProvider — sistema de notificações toast acessível via useToast em qualquer componente] */}
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeToggleProvider>
      </CurrentHabitProvider>
    </AuthProvider>
  </React.StrictMode>
);
