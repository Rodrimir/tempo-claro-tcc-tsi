import styled from 'styled-components/native';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { fonts } from '../../styles/fonts';

/* O cenário (dia/noite, conforme o tema) é o fundo da tela inteira — a mesma
   ideia da Loja. O véu escurece só o suficiente pra texto e cartões continuarem
   legíveis por cima da ilustração. */
export const HomeContainer = styled.ImageBackground.attrs({
  resizeMode: 'cover',
})`
  flex: 1;
  background-color: ${(props) => props.theme.bgPrimary};
`;

export const HomeVeu = styled.View`
  flex: 1;
  background-color: ${(props) => (props.theme.isDark ? 'rgba(6, 12, 30, 0.55)' : 'rgba(255, 255, 255, 0.35)')};
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
  padding: 18px 26px;
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  border-bottom-right-radius: 28px;
  border-bottom-left-radius: 8px;
  margin-bottom: 32px;
  elevation: 3;
  width: 100%;
  max-width: 340px;
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
  margin-right: 28px;
  letter-spacing: 1px;
`;

export const GatilhoText = styled.Text`
  font-size: 13px;
  font-style: italic;
  margin-top: 4px;
  color: ${(props) => (props.$completed ? 'rgba(255,255,255,0.85)' : props.theme.textSecondary)};
`;

/* A lista de tarefas de hoje É o progresso — substitui título do hábito e a
   antiga linha "200/2000ml · 2/3 momentos" por um checklist concreto: uma
   linha por ocorrência, com horário, alvo e o que já aconteceu com ela. */
export const TarefaLinha = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: 8px;
`;

/* Rótulo ("Tarefa 2") e detalhe (horário · alvo) em linhas SEPARADAS, não um
   texto corrido — um único Text quebrando sozinho, com a largura estreita do
   balão, virava 3 linhas de um jeito imprevisível (o alvo cortava no meio). */
export const TarefaColuna = styled.View`
  flex: 1;
  padding-top: 1px;
`;

export const TarefaLabel = styled.Text`
  font-family: ${(props) => (props.$ativa ? fonts.bold : fonts.semiBold)};
  font-size: 13px;
  text-decoration-line: ${(props) => (props.$falhou ? 'line-through' : 'none')};
  color: ${(props) => (props.$completed ? 'white' : props.$falhou ? props.theme.textSecondary : props.theme.textPrimary)};
`;

export const TarefaDetalhe = styled.Text`
  font-family: ${fonts.regular};
  font-size: 12px;
  text-decoration-line: ${(props) => (props.$falhou ? 'line-through' : 'none')};
  color: ${(props) => (props.$completed ? 'rgba(255,255,255,0.85)' : props.theme.textSecondary)};
`;

/* Só a próxima tarefa por padrão — a lista das N ocorrências inteira estourava
   o balão pra hábitos de 3x/dia. O detalhe completo mora atrás do botão de
   expandir, não desaparece, só não fica sempre aberto. */
export const TarefaBloco = styled.View`
  align-self: stretch;
  margin-top: 4px;
  gap: 6px;
`;

export const ExpandirButton = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 2px;
  padding: 4px;
`;

export const ExpandirTexto = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 11px;
  color: ${(props) => (props.$completed ? 'rgba(255,255,255,0.85)' : props.theme.primaryColor)};
`;

/* Resumo compacto de UMA linha só — o que o balão mostra por padrão. A lista
   inteira das N ocorrências, com rótulo e detalhe empilhados, mora só no popup
   ("ver todas"), onde há espaço de sobra pra isso não estourar o balão. */
export const TarefaResumoTexto = styled.Text`
  flex: 1;
  font-family: ${fonts.semiBold};
  font-size: 13px;
  color: ${(props) => (props.$completed ? 'white' : props.theme.textPrimary)};
`;

/* Popup de tarefas do dia e popup de opções (editar/arquivar) — mesma folha
   deslizando de baixo, conteúdo diferente. */
export const BottomSheetOverlay = styled(Pressable)`
  flex: 1;
  background-color: rgba(15, 23, 42, 0.85);
  justify-content: flex-end;
`;

export const BottomSheet = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  border-top-left-radius: 24px;
  border-top-right-radius: 24px;
  padding: 20px;
  padding-bottom: 32px;
  max-height: 70%;
`;

export const BottomSheetTitulo = styled.Text`
  font-family: ${fonts.bold};
  font-size: 18px;
  color: ${(props) => props.theme.textPrimary};
  margin-bottom: 16px;
`;

export const TarefaModalLinha = styled.View`
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 0px;
  border-bottom-width: 1px;
  border-bottom-color: ${(props) => props.theme.borderColor};
`;

export const MenuOption = styled(Pressable)`
  flex-direction: row;
  align-items: center;
  gap: 12px;
  padding: 16px 4px;
`;

export const MenuOptionText = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 16px;
  color: ${(props) => (props.$danger ? props.theme.dangerColor : props.theme.textPrimary)};
`;

export const UrgentBadge = styled(Animated.View)`
  background-color: ${(props) => props.theme.dangerStrong};
  padding: 10px 20px;
  border-radius: 9999px;
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

/* Contador de tempo, logo abaixo do avatar. Discreto por padrão — é informação de
   apoio, não alarme — e só ganha a cor de perigo quando o prazo já passou. */
/* Fundo opaco (não só um texto solto): o cenário atrás varia demais de tom —
   céu claro, grama escura, noite — pra qualquer cor de texto funcionar direto
   em cima dele nos dois temas. Uma pílula com o bgSurface do tema garante
   contraste certo sempre, porque some com o próprio tema, não com a imagem. */
export const ContadorWrapper = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 6px;
  margin-top: -8px;
  margin-bottom: 12px;
  background-color: ${(props) => props.theme.bgSurface};
  padding: 8px 16px;
  border-radius: 9999px;
  elevation: 3;
`;

export const ContadorTexto = styled.Text`
  font-family: ${fonts.semiBold};
  font-size: 14px;
  color: ${(props) => (props.$atrasado ? props.theme.dangerColor : props.theme.textPrimary)};
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

/* Mesma ideia do ContadorWrapper: título e subtítulo do slide "criar hábito"
   também caem direto em cima do cenário, sem nenhum cartão atrás. */
export const EmptyTextCard = styled.View`
  background-color: ${(props) => props.theme.bgSurface};
  padding: 20px 24px;
  border-radius: 24px;
  elevation: 3;
  margin-bottom: 8px;
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

/* Contraste fixo (branco sempre, sombra sempre escura) em vez de cor de tema:
   os pontinhos ficam pequenos demais pra um cartão opaco atrás fazer sentido,
   então a borda escura é o que garante ver o ponto apagado tanto no céu claro
   quanto no céu estrelado. */
export const Dot = styled.View`
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background-color: ${(props) => (props.$active ? props.theme.primaryColor : 'white')};
  elevation: 2;
`;

export const ActionWrapper = styled.View`
  padding: 0px 24px 24px;
  align-items: center;
`;

export const ActionHintText = styled.Text`
  text-align: center;
  color: ${(props) => props.theme.textPrimary};
  font-size: 14px;
  font-family: ${fonts.semiBold};
  background-color: ${(props) => props.theme.bgSurface};
  padding: 12px 20px;
  border-radius: 9999px;
  overflow: hidden;
  elevation: 3;
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
