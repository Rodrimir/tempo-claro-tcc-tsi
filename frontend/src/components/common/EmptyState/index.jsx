import { EmptyStateContainer, EmptyIconWrapper, EmptyTitle, EmptyText } from './styles';

export function EmptyState({ icon, title, text, variant = 'theme', children }) {
  return (
    <EmptyStateContainer $variant={variant}>
      <EmptyIconWrapper $variant={variant}>{icon}</EmptyIconWrapper>
      <EmptyTitle $variant={variant}>{title}</EmptyTitle>
      <EmptyText $variant={variant}>{text}</EmptyText>
      {children}
    </EmptyStateContainer>
  );
}
