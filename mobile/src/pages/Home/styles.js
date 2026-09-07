import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { fonts } from '../../styles/fonts';

export const HomeContainer = styled.View`
  flex: 1;
`;

export const HabitSlide = styled.View`
  width: ${(props) => props.$width}px;
  padding: 24px;
`;

export const SlideInner = styled.View`
  align-items: center;
  justify-content: center;
  flex: 1;
`;

export const HabitCard = styled(Animated.View)`
  background-color: ${(props) =>
    props.$completed
      ? props.theme.successStrong
      : props.$urgent
        ? props.theme.dangerLight
        : props.theme.primaryLight};
  padding: 16px 24px;
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  border-bottom-right-radius: 24px;
  border-bottom-left-radius: 4px;
  margin-bottom: 32px;
  elevation: 3;
  max-width: 280px;
  align-items: center;
  border-width: ${(props) => (props.$urgent && !props.$completed ? '2px' : '0px')};
  border-color: ${(props) => props.theme.dangerColor};
`;

export const CardSubtitle = styled.Text`
  font-family: ${fonts.extraBold};
  font-size: 12px;
  color: ${(props) => (props.$completed ? 'white' : props.$urgent ? props.theme.dangerColor : props.theme.primaryColor)};
  text-transform: uppercase;
  margin-bottom: 4px;
  letter-spacing: 1px;
`;

export const CardTitle = styled.Text`
  font-family: ${fonts.bold};
  font-size: 24px;
  text-align: center;
  color: ${(props) => (props.$completed ? 'white' : props.theme.textPrimary)};
`;

export const GatilhoText = styled.Text`
  font-size: 13px;
  font-style: italic;
  margin-top: 4px;
  color: ${(props) => (props.$completed ? 'rgba(255,255,255,0.85)' : props.theme.textSecondary)};
`;

export const ProgressoOcorrenciasText = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 13px;
  margin-top: 4px;
  color: ${(props) => (props.$completed ? 'rgba(255,255,255,0.95)' : props.theme.textSecondary)};
`;

export const UrgentBadge = styled(Animated.View)`
  background-color: ${(props) => props.theme.dangerStrong};
  padding: 8px 16px;
  border-radius: 16px;
  margin-bottom: 16px;
`;

export const UrgentBadgeText = styled.Text`
  font-family: ${fonts.semiBold};
  color: white;
  font-size: 14px;
`;

export const AvatarWrapper = styled(Animated.View)`
  width: 160px;
  height: 160px;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
`;

export const ShadowBlur = styled.View`
  background-color: rgba(0,0,0,0.08);
  width: 100px;
  height: 12px;
  border-radius: 6px;
  margin-bottom: 40px;
`;

export const SunWrapper = styled(Animated.View)`
  width: 160px;
  height: 160px;
  overflow: hidden;
  border-radius: 80px;
  margin-bottom: 32px;
`;

export const EmptyTitle = styled.Text`
  font-family: ${fonts.bold};
  font-size: 24px;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 8px;
  text-align: center;
`;

export const EmptySubtitle = styled.Text`
  font-size: 14px;
  color: ${(props) => props.theme.textSecondary};
  text-align: center;
`;

export const CreateHabitButton = styled(Pressable)`
  width: 64px;
  height: 64px;
  border-radius: 32px;
  align-items: center;
  justify-content: center;
  background-color: ${(props) => props.theme.primaryStrong};
  elevation: 6;
`;

export const ErrorStateContainer = styled.View`
  flex: 1;
  padding: 24px;
  justify-content: center;
  align-items: center;
`;

export const IconWrapper = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  width: 80px;
  height: 80px;
  border-radius: 40px;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
`;

export const RetryButton = styled(Pressable)`
  margin-top: 20px;
  padding: 16px 32px;
  border-radius: 100px;
  background-color: ${(props) => props.theme.primaryStrong};
`;

export const RetryButtonText = styled.Text`
  font-family: ${fonts.bold};
  color: white;
`;

export const DotsWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  gap: 8px;
  padding-bottom: 16px;
`;

export const Dot = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${(props) => (props.$active ? props.theme.primaryColor : props.theme.borderColor)};
`;

export const ActionWrapper = styled.View`
  padding: 0px 24px 24px;
`;

export const ActionHintText = styled.Text`
  height: 64px;
  text-align: center;
  text-align-vertical: center;
  color: ${(props) => props.theme.textSecondary};
  font-size: 14px;
  font-family: ${fonts.semiBold};
`;

export const DoneButton = styled.View`
  padding: 20px;
  border-radius: 9999px;
  width: 100%;
  background-color: ${(props) => props.theme.bgSurface};
  border-width: 2px;
  border-color: ${(props) => props.theme.borderColor};
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0.5;
`;

export const DoneButtonText = styled.Text`
  font-family: ${fonts.bold};
  font-size: 20px;
  color: ${(props) => props.theme.textSecondary};
`;

export const MenuButton = styled(Pressable)`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 16px;
  align-items: center;
  justify-content: center;
`;

export const ContextMenuOverlay = styled(Pressable)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

export const ContextMenu = styled.View`
  position: absolute;
  top: 46px;
  right: 12px;
  background-color: ${(props) => props.theme.bgSurface};
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  border-radius: 12px;
  elevation: 8;
  min-width: 160px;
  padding: 6px;
`;

export const ContextMenuItem = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
`;

export const ContextMenuItemText = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 14px;
  color: ${(props) => (props.$danger ? props.theme.dangerColor : props.theme.textPrimary)};
`;

export const ArchiveModalOverlay = styled.View`
  flex: 1;
  background-color: rgba(15, 23, 42, 0.85);
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const ArchiveModalContent = styled.View`
  width: 100%;
  max-width: 400px;
  background-color: ${(props) => props.theme.bgSurface};
  border-radius: 20px;
  padding: 24px;
  elevation: 8;
`;

export const ArchiveModalTitle = styled.Text`
  font-family: ${fonts.bold};
  font-size: 18px;
  margin-bottom: 12px;
  color: ${(props) => props.theme.textPrimary};
`;

export const ArchiveModalText = styled.Text`
  font-size: 14px;
  color: ${(props) => props.theme.textSecondary};
  line-height: 20px;
  margin-bottom: 24px;
`;

export const ArchiveModalActions = styled.View`
  flex-direction: row;
  gap: 12px;
`;

export const ArchiveCancelButton = styled(Pressable)`
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  background-color: ${(props) => props.theme.bgPrimary};
  border-width: 1px;
  border-color: ${(props) => props.theme.borderColor};
  align-items: center;
`;

export const ArchiveCancelButtonText = styled.Text`
  font-family: ${fonts.bold};
  color: ${(props) => props.theme.textPrimary};
`;

export const ArchiveConfirmButton = styled(Pressable)`
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  background-color: ${(props) => props.theme.primaryStrong};
  align-items: center;
  opacity: ${(props) => (props.disabled ? 0.6 : 1)};
`;

export const ArchiveConfirmButtonText = styled.Text`
  font-family: ${fonts.bold};
  color: white;
`;
