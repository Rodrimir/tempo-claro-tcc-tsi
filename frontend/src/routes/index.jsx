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

// @audit-ok Componente que garante acesso às páginas restritas apenas para usuários autenticados (com token válido)
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div>Carregando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/create" element={<CreateHabit />} />
          <Route path="/stats/:period?" element={<Stats />} />
          <Route path="/store" element={<Store />} />
        </Route>
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
