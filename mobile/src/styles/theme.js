export const lightTheme = {
  isDark: false,
  primaryColor: '#4f46e5',
  primaryLight: '#e0e7ff',
  bgPrimary: '#f8fafc',
  bgSurface: '#ffffff',
  textPrimary: '#0f172a',
  textSecondary: '#64748b',
  successColor: '#047857',
  warningColor: '#b45309',
  warningLight: '#fef3c7',
  dangerColor: '#b91c1c',
  dangerLight: '#fef2f2',
  primaryStrong: '#4f46e5',
  successStrong: '#047857',
  warningStrong: '#b45309',
  dangerStrong: '#b91c1c',
  bonusStrong: '#0369a1',
  borderColor: '#e2e8f0',
  radiusMd: 12,
  radiusFull: 9999,
  // PLANO_REESTRUTURACAO.md, A.1 — mesma cor de overlay que 9 arquivos
  // escreviam à mão (rgba(15, 23, 42, 0.85)); scrimColor é o véu mais claro
  // usado atrás de gavetas (Perfil, Loja).
  overlayColor: 'rgba(15, 23, 42, 0.85)',
  scrimColor: 'rgba(15, 23, 42, 0.55)',
};

export const darkTheme = {
  isDark: true,
  primaryColor: '#818cf8',
  primaryLight: '#1e1b4b',
  bgPrimary: '#020617',
  bgSurface: '#0f172a',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  successColor: '#34d399',
  warningColor: '#fbbf24',
  warningLight: '#3f2d0b',
  dangerColor: '#f87171',
  dangerLight: '#2d1416',
  primaryStrong: '#4338ca',
  successStrong: '#065f46',
  warningStrong: '#92400e',
  dangerStrong: '#991b1b',
  bonusStrong: '#075985',
  borderColor: '#1e293b',
  radiusMd: 12,
  radiusFull: 9999,
  // Mesmo valor dos dois temas de propósito: é um véu que escurece o que está
  // atrás, não uma cor de superfície — não faz sentido "clarear" no escuro.
  overlayColor: 'rgba(15, 23, 42, 0.85)',
  scrimColor: 'rgba(15, 23, 42, 0.55)',
};
