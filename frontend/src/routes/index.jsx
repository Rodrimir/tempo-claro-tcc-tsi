import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../contexts/AuthContext';

import Login from '../pages/Login';
import Home from '../pages/Home';
import Profile from '../pages/Profile';
import CreateHabit from '../pages/CreateHabit';
import PreTask from '../pages/PreTask';
import Execution from '../pages/Execution';
import Success from '../pages/Success';
import Fail from '../pages/Fail';
import Stats from '../pages/Stats';
import Store from '../pages/Store';

import LoadingScreen from '../components/common/LoadingScreen';

// @audit-ok [Verificação de Token (1) — ProtectedRoute redireciona para /login se usuário não autenticado]
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// @audit-ok [AppRoutes — define todas as rotas da SPA; rotas protegidas exigem autenticação válida]
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* @audit-ok [Login (1) / Cadastro (1) — rota pública de autenticação] */}
        <Route path="/login" element={<Login />} />

        {/* @audit-ok [Dashboard (1) — rotas protegidas renderizadas dentro do MainLayout com BottomNav] */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create" element={<CreateHabit />} />
          <Route path="/stats/:period?" element={<Stats />} />
          <Route path="/store" element={<Store />} />
        </Route>

        {/* @audit-ok [Pré-Tarefa Priming (6) / Execução Timer (1) — rotas de fluxo fullscreen sem BottomNav] */}
        <Route path="/pretask" element={<ProtectedRoute><PreTask /></ProtectedRoute>} />
        <Route path="/execute" element={<ProtectedRoute><Execution /></ProtectedRoute>} />
        <Route path="/success" element={<ProtectedRoute><Success /></ProtectedRoute>} />
        <Route path="/fail" element={<ProtectedRoute><Fail /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
