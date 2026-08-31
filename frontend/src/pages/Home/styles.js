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
  background: ${(props) => props.$completed ? props.theme.successStrong : (props.$urgent ? props.theme.dangerLight : props.theme.primaryLight)};
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

// @audit-ok [E4.1 (item 3) — "Torne-o Evidente" (Clear): abaixo do título,
// só quando o hábito tem gatilho_ancora preenchido (opcional — a maioria dos
// hábitos criados antes desta tarefa não tem nada aqui).]
export const GatilhoText = styled.p`
  font-size: 13px;
  font-style: italic;
  margin-top: 4px;
  color: ${(props) => props.$completed ? 'rgba(255,255,255,0.85)' : props.theme.textSecondary};
`;

// @audit-ok [E2.8 (item 3) — "X de Y hoje", só aparece pra hábito de mais de
// 1x/dia (ver Home/index.jsx) — pra 1x/dia é redundante com o rótulo
// Concluído/Sua Tarefa que já existe.]
export const ProgressoOcorrenciasText = styled.p`
  font-size: 13px;
  font-weight: 600;
  margin-top: 4px;
  /* @audit-ok [E3.4 — era 0.85: com successStrong como fundo (mais escuro,
     ver theme.js) a opacidade original ficava em 4,43:1, abaixo do mínimo.
     0.95 sobe pra 5,10:1+ nos dois temas.] */
  color: ${(props) => props.$completed ? 'rgba(255,255,255,0.95)' : props.theme.textSecondary};
`;
// @audit-ok [E3.4 — dangerColor virou dangerStrong: dangerColor continua
// pastel no tema escuro (papel de ícone/texto sobre fundo escuro); o badge
// aqui é fundo sólido com texto branco por cima, papel que só dangerStrong
// cobre nos dois temas.]
export const UrgentBadge = styled.div`
  background: ${(props) => props.theme.dangerStrong};
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
    border-top: 6px solid ${(props) => props.theme.dangerStrong};
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
  background: ${(props) => props.theme.primaryStrong};
  color: white;
  cursor: pointer;
`;

// @audit-ok [E1.8 (item 1/3) — estado de ERRO, distinto do vazio-de-verdade
// (que continua sendo o carrossel só com o slide "+", sem entrar aqui). Antes
// uma falha de rede caía direto no mesmo carrossel vazio, indistinguível de
// "você não tem hábito nenhum".]
export const ErrorStateContainer = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  align-items: center;
  text-align: center;
`;
export const ErrorIconWrapper = styled.div`
  background: ${(props) => props.theme.bgSurface};
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: ${(props) => props.theme.dangerColor};
`;

// @audit-ok [E3.1 (item 1) — mesma forma de ErrorStateContainer, mas pra
// mensagem de boas-vindas (0 hábitos de verdade), distinta do slide "Começar
// um novo hábito?" que aparece pra quem já tem 1 hábito e pode criar o 2º.]
export const WelcomeStateContainer = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  align-items: center;
  text-align: center;
`;

export const WelcomeIconWrapper = styled.div`
  background: ${(props) => props.theme.bgSurface};
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: ${(props) => props.theme.primaryColor};
`;
export const RetryButton = styled.button`
  margin-top: 20px;
  padding: 16px 32px;
  font-weight: 700;
  border-radius: 100px;
  box-shadow: 0 10px 20px rgba(79,70,229,0.3);
  border: none;
  background: ${(props) => props.theme.primaryStrong};
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

// @audit-ok [E4.2 (item 1) — RF23: cartão do carrossel ganha um botão "⋮"
// (canto superior direito, HabitCard já é position:relative) abrindo
// Editar/Arquivar. $completed usa branco pra combinar com o texto do cartão
// concluído (successStrong de fundo); fora disso segue textSecondary.]
export const MenuButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: ${(props) => props.$completed ? 'rgba(255,255,255,0.85)' : props.theme.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &:hover {
    background: rgba(0,0,0,0.06);
  }
  &:focus-visible {
    outline: 2px solid ${(props) => props.theme.primaryColor};
    outline-offset: 2px;
  }
`;

// @audit-ok [E4.2 (item 1) — clique fora fecha o menu: overlay transparente
// full-screen atrás do menu, mesmo truque que SettingsModalOverlay (Login)
// já usa pro modal de configurações, só sem escurecer a tela (isto é um menu
// pequeno, não um modal).]
export const ContextMenuOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 90;
`;

export const ContextMenu = styled.div`
  position: absolute;
  top: 46px;
  right: 12px;
  z-index: 91;
  background: ${(props) => props.theme.bgSurface};
  border: 1px solid ${(props) => props.theme.borderColor};
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0,0,0,0.15);
  min-width: 160px;
  padding: 6px;
  text-align: left;
`;

export const ContextMenuItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: ${(props) => props.$danger ? props.theme.dangerColor : props.theme.textPrimary};
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${(props) => props.theme.bgPrimary};
  }
  &:focus-visible {
    outline: 2px solid ${(props) => props.theme.primaryColor};
    outline-offset: -2px;
  }
`;

// @audit-ok [E4.2 (item 3) — confirmação de arquivar, mesmo padrão visual
// de SettingsModalOverlay/SettingsModalContent (Login).]
export const ArchiveModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(8px);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

export const ArchiveModalContent = styled.div`
  width: 100%;
  max-width: 400px;
  background: ${(props) => props.theme.bgSurface};
  border-radius: 20px;
  padding: 24px;
  text-align: left;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
`;

export const ArchiveModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
`;

export const ArchiveModalText = styled.p`
  font-size: 14px;
  color: ${(props) => props.theme.textSecondary};
  line-height: 1.5;
  margin-bottom: 24px;
`;

export const ArchiveModalActions = styled.div`
  display: flex;
  gap: 12px;
`;

export const ArchiveCancelButton = styled.button`
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  background: ${(props) => props.theme.bgPrimary};
  border: 1px solid ${(props) => props.theme.borderColor};
  color: ${(props) => props.theme.textPrimary};
  font-weight: 700;
  cursor: pointer;
`;

// @audit-ok [E4.2 (item 3) — primaryStrong, não dangerStrong: arquivar é
// reversível e preserva histórico (soft delete), diferente de um "excluir"
// permanente — o vermelho de alarme ficaria enganoso aqui.]
export const ArchiveConfirmButton = styled.button`
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  background: ${(props) => props.theme.primaryStrong};
  border: none;
  color: white;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
