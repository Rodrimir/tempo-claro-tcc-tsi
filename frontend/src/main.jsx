import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CurrentHabitProvider } from './contexts/CurrentHabitContext';
import { ThemeToggleProvider } from './contexts/ThemeToggleContext';
import { ToastProvider } from './contexts/ToastContext';
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  document.body.classList.add('dark-mode');
}
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <CurrentHabitProvider>
        <ThemeToggleProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </ThemeToggleProvider>
      </CurrentHabitProvider>
    </AuthProvider>
  </React.StrictMode>
);
