import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNav from '../../components/layout/BottomNav';
import { LayoutWrapper, MainContent } from './styles';
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
