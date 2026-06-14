// @audit-ok: FRONTEND-styles.js-01
import styled from 'styled-components';
import { NavLink } from 'react-router-dom';

export const NavContainer = styled.nav`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: var(--bg-surface);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-around;
  padding: 12px 0 24px 0;
  z-index: 50;
`;

export const PlayButtonWrapper = styled.div`
  transform: translateY(-16px);
`;

export const PlayButton = styled.button`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: ${(props) => props.$completed ? 'var(--success-color)' : 'var(--primary-color)'};
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 14px ${(props) => props.$completed ? 'rgba(16, 185, 129, 0.4)' : 'rgba(79, 70, 229, 0.4)'};
  border: none;
  cursor: pointer;
  transition: transform 0.2s, background-color 0.3s ease, box-shadow 0.3s ease;

  &:active {
    transform: scale(0.95);
  }
`;

export const StyledNavLink = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  color: ${(props) => props.$active ? 'var(--primary-color)' : 'var(--text-secondary)'};
  opacity: ${(props) => props.$active ? 1 : 0.7};
`;

export const NavLabel = styled.span`
  font-size: 12px;
  font-weight: 600;
`;
