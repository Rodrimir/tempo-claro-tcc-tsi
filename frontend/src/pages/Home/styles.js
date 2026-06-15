import styled, { keyframes, css } from 'styled-components';
const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;
const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
`;
export const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-bottom: 80px;
`;
export const CarouselWrapper = styled.div`
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  flex: 1;
  scrollbar-width: none;
  ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;
export const HabitSlide = styled.div`
  scroll-snap-align: center;
  min-width: 100%;
  display: flex;
  flex-direction: column;
  padding: 24px;
`;
export const SlideInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
`;
export const HabitCard = styled.div`
  background: ${(props) => props.$completed ? props.theme.successColor : (props.$urgent ? '#fef2f2' : props.theme.primaryLight)};
  color: ${(props) => props.$completed ? 'white' : props.theme.textPrimary};
  padding: 16px 24px;
  border-radius: 24px 24px 24px 4px;
  margin-bottom: 32px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  position: relative;
  max-width: 280px;
  text-align: center;
  border: ${(props) => props.$completed ? `none` : (props.$urgent ? `2px solid ${props.theme.dangerColor}` : 'none')};
  animation: ${(props) => props.$urgent ? css`${pulse} 2s infinite` : 'none'};
`;

export const CardSubtitle = styled.p`
  font-size: 12px;
  font-weight: 800;
  color: ${(props) => props.$completed ? 'white' : (props.$urgent ? props.theme.dangerColor : props.theme.primaryColor)};
  text-transform: uppercase;
  margin-bottom: 4px;
  letter-spacing: 1px;
`;
export const CardTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
  margin: 0;
  text-decoration: none;
`;
export const UrgentBadge = styled.div`
  background: ${(props) => props.theme.dangerColor};
  color: white;
  padding: 8px 16px;
  border-radius: 16px;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 16px;
  position: relative;
  animation: ${float} 3s ease-in-out infinite;
  &::after {
    content: '';
    position: absolute;
    bottom: -6px;
    left: 50%;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-top: 6px solid ${(props) => props.theme.dangerColor};
  }
`;
export const AvatarWrapper = styled.div`
  font-size: 160px;
  filter: drop-shadow(0 15px 25px rgba(0,0,0,0.15));
  margin-bottom: 20px;
  animation: ${float} 3s ease-in-out infinite;
`;
export const ShadowBlur = styled.div`
  background: rgba(0,0,0,0.05);
  width: 100px;
  height: 12px;
  border-radius: 50%;
  filter: blur(4px);
  margin-bottom: 40px;
`;
export const SunWrapper = styled.div`
  width: 160px;
  height: 160px;
  overflow: hidden;
  border-radius: 50%;
  margin-bottom: 32px;
  animation: ${float} 4s ease-in-out infinite;
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;
export const EmptyTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 8px;
`;
export const EmptySubtitle = styled.p`
  font-size: 14px;
  color: ${(props) => props.theme.textSecondary};
`;
export const CreateHabitButton = styled.button`
  padding: 16px 32px;
  font-weight: 700;
  border-radius: 100px;
  box-shadow: 0 10px 20px rgba(79,70,229,0.3);
  border: none;
  background: ${(props) => props.theme.primaryColor};
  color: white;
  cursor: pointer;
`;
export const DotsWrapper = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-bottom: 16px;
`;
export const Dot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(props) => props.$active ? props.theme.primaryColor : props.theme.borderColor};
  transition: background 0.3s;
`;
export const ActionWrapper = styled.div`
  padding: 0 24px 24px 24px;
`;
export const StartButton = styled.button`
  font-size: 20px;
  font-weight: 700;
  padding: 20px;
  border-radius: 9999px;
  width: 100%;
  box-shadow: 0 10px 25px rgba(79, 70, 229, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: none;
  background: ${(props) => props.theme.primaryColor};
  color: white;
  cursor: pointer;
`;
export const DoneButton = styled.button`
  font-size: 20px;
  font-weight: 700;
  padding: 20px;
  border-radius: 9999px;
  width: 100%;
  background: ${(props) => props.theme.bgSurface};
  border: 2px solid ${(props) => props.theme.borderColor};
  color: ${(props) => props.theme.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0.5;
  pointer-events: none;
`;
