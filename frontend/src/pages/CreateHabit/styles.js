import styled from 'styled-components';

export const Container = styled.div`
  padding: 24px;
  padding-bottom: 100px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100vh;
  background: var(--bg-primary);
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

export const BackButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-primary);
  cursor: pointer;
`;

export const HeaderText = styled.div``;

export const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
`;

export const Subtitle = styled.p`
  color: var(--text-secondary);
  font-size: 14px;
`;

export const StepContainer = styled.div`
  animation: slideInRight 0.3s ease-out;

  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
`;

export const StepTitle = styled.h2`
  font-size: 18px;
  margin-bottom: 16px;
`;

export const MoldeScrollContainer = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 16px;
  padding: 16px 24px;
  margin: 0 -24px;
  scroll-snap-type: x mandatory;
  &::-webkit-scrollbar {
    display: none;
  }
`;

export const MoldeCard = styled.div`
  min-width: 280px;
  background: ${(props) => props.$active ? 'var(--primary-light)' : 'var(--bg-surface)'};
  border: 2px solid ${(props) => props.$active ? 'var(--primary-color)' : 'transparent'};
  border-radius: 24px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  scroll-snap-align: center;
  transition: all 0.2s;
`;

export const MoldeEmoji = styled.span`
  font-size: 64px;
  margin-bottom: 16px;
`;

export const MoldeTitle = styled.h3`
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
`;

export const MoldeDesc = styled.p`
  font-size: 14px;
  color: var(--text-secondary);
`;

export const NextButton = styled.button`
  width: 100%;
  margin-top: 24px;
  padding: 20px;
  border-radius: 9999px;
  background: var(--primary-color);
  color: white;
  font-weight: 700;
  font-size: 18px;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
`;

export const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

export const OptionCard = styled.div`
  padding: 24px;
  background: var(--bg-surface);
  border-radius: 16px;
  border: 1px solid ${(props) => props.$primary ? 'transparent' : 'var(--border-color)'};
  border: ${(props) => props.$primary ? '2px solid var(--primary-color)' : '1px solid var(--border-color)'};
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
`;

export const OptionIconWrapper = styled.div`
  background: var(--primary-light);
  color: var(--primary-color);
  padding: 12px;
  border-radius: 50%;
`;

export const OptionText = styled.div``;

export const OptionTitle = styled.h3`
  font-size: 16px;
  font-weight: 700;
`;

export const OptionSubtitle = styled.p`
  font-size: 12px;
  color: var(--text-secondary);
`;

export const FormSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export const FormCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: var(--bg-surface);
  padding: 20px;
  border-radius: 16px;
`;

export const FormGroup = styled.div``;

export const Label = styled.label`
  display: block;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 8px;
`;

export const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  font-size: 16px;
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
`;

export const GridRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

export const WeekDaysContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: space-between;
`;

export const DayButton = styled.button`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: ${(props) => props.$active ? 'var(--primary-color)' : 'var(--bg-primary)'};
  color: ${(props) => props.$active ? 'white' : 'var(--text-secondary)'};
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
`;

export const SubmitButton = styled.button`
  width: 100%;
  padding: 20px;
  border-radius: 9999px;
  background: var(--primary-color);
  color: white;
  font-weight: 700;
  font-size: 18px;
  border: none;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);

  &:disabled {
    background: var(--primary-light);
    color: var(--primary-color);
    cursor: not-allowed;
    box-shadow: none;
  }
`;
