import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CurrentHabitProvider } from './contexts/CurrentHabitContext';
import { ThemeToggleProvider } from './contexts/ThemeToggleContext';
import { ToastProvider } from './contexts/ToastContext';

// @audit-ok [main.jsx — ponto de entrada da aplicação; monta a árvore de providers]
// @audit-ok [E3.4 — removido o script que adicionava 'dark-mode' na classe do
// body antes do mount. Essa classe nunca teve nenhuma regra de CSS associada
// em nenhum lugar do projeto (styles/GlobalStyles.js sempre pintou a tela via
// ThemeProvider + variáveis CSS, não via classe no body) — era um mecanismo
// morto que também não considerava a escolha explícita do usuário, só a
// preferência do SO. ThemeToggleContext agora resolve isDark de forma
// síncrona no primeiro render (localStorage > preferência do SO), sem
// precisar de nada rodando antes do React montar.]
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
