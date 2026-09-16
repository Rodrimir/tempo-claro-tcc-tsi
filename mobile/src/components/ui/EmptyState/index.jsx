import { Container, IconWrapper, Title, Text, ActionWrapper } from './styles';

/**
 * PLANO_REESTRUTURACAO.md, A.2 — substitui as 3 cópias de
 * EmptyStateContainer+EmptyIconWrapper+EmptyTitle+EmptyText (Stats, Store,
 * Home). `icon` recebe uma função (cor) => ReactNode, porque o ícone muda por
 * biblioteca (Feather vs MaterialCommunityIcons) tela a tela.
 */
export function EmptyState({ icon, iconColor, titulo, texto, children }) {
  return (
    <Container>
      {icon ? <IconWrapper>{icon(iconColor)}</IconWrapper> : null}
      <Title>{titulo}</Title>
      {texto ? <Text>{texto}</Text> : null}
      {children ? <ActionWrapper>{children}</ActionWrapper> : null}
    </Container>
  );
}

export default EmptyState;
