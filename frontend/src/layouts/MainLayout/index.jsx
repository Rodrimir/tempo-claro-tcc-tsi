import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '../../components/layout/BottomNav';
import { LayoutWrapper, MainContent } from './styles';

// @audit-ok [MainLayout — layout das rotas autenticadas: renderiza a tela atual (Outlet) com a navegação inferior]

const MainLayout = () => {
  return (
    <LayoutWrapper>
      { }
      <MainContent>
        <Outlet />
      </MainContent>
      { }
      <BottomNav />
    </LayoutWrapper>
  );
};
export default MainLayout;
