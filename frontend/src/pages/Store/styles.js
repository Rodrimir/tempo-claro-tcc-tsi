import styled from 'styled-components';

export const StoreContainer = styled.div`
  padding: 24px;
  padding-bottom: 100px;
  min-height: 100vh;
  background: var(--bg-primary);
`;

export const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 8px;
`;

export const Subtitle = styled.p`
  color: var(--text-secondary);
  margin-bottom: 32px;
`;

export const BuyCard = styled.div`
  background: var(--bg-surface);
  border-radius: 24px;
  padding: 24px;
  border: 1px solid var(--border-color);
  text-align: center;
  margin-bottom: 24px;
`;

export const IconWrapper = styled.div`
  background: var(--primary-light);
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: var(--primary-color);
`;

export const CardTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
`;

export const CardText = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 24px;
`;

export const FormGroup = styled.div`
  text-align: left;
  margin-bottom: 24px;
`;

export const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 8px;
`;

export const Select = styled.select`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--border-color);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 16px;
  outline: none;
`;

export const BuyButton = styled.button`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  background: var(--primary-color);
  color: white;
  font-weight: 700;
  font-size: 18px;
  border: none;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
`;

export const InventorySection = styled.div`
  margin-top: 24px;
`;

export const InventoryTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;
`;

export const InventoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const InventoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-surface);
  border-radius: 12px;
  border: 1px solid var(--border-color);
`;

export const ItemInfo = styled.div``;

export const ItemTitle = styled.div`
  font-weight: 600;
`;

export const ItemSubtitle = styled.div`
  font-size: 12px;
  color: var(--text-secondary);
`;

export const ItemCount = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: var(--primary-color);
`;
