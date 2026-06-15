import styled from 'styled-components';

export const StatsContainer = styled.div`
  padding: 24px;
  padding-bottom: 100px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

export const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
`;

export const HabitTitle = styled.p`
  color: var(--primary-color);
  font-weight: 600;
  margin-bottom: 24px;
  font-size: 18px;
`;

export const ContentWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

export const GridRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

export const StatCard = styled.div`
  background: var(--bg-surface);
  padding: 16px;
  border-radius: 16px;
  border: 1px solid var(--border-color);
`;

export const CardHeader = styled.div`
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
`;

export const CardValue = styled.div`
  font-size: ${(props) => props.$large ? '24px' : '20px'};
  font-weight: 800;
`;

export const ChartCard = styled.div`
  background: var(--bg-surface);
  padding: 20px;
  border-radius: 24px;
  border: 1px solid var(--border-color);
`;

export const ChartTitle = styled.h3`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 24px;
`;

export const ChartWrapper = styled.div`
  height: 220px;
  width: 100%;
`;

export const EmptyStateContainer = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  align-items: center;
  text-align: center;
`;

export const EmptyIconWrapper = styled.div`
  background: var(--bg-surface);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: var(--text-secondary);
`;

export const EmptyTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 8px;
`;

export const EmptyText = styled.p`
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.5;
`;
