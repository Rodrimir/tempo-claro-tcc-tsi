// @audit-ok [E3.4 — cores "everyday" (successColor/warningColor/dangerColor)
// escurecidas no tema claro: as originais (Tailwind 500) falhavam 4,5:1 de
// contraste contra branco/quase-branco em usos reais já existentes (texto do
// botão Sair, subtítulo do card urgente, badge urgente). No tema escuro elas
// ficam como estavam — já passam contra o fundo escuro, que é o papel delas
// lá (ícone/texto sobre bg-surface escuro).
//
// primaryStrong/successStrong/warningStrong/dangerStrong/bonusStrong são
// tokens novos: preenchimento sólido com texto BRANCO por cima (botões,
// telas de sucesso/falha, badges). Esse papel puxa pra um valor mais escuro
// do que o token "everyday" — no tema escuro isso conflita direto com o
// papel de ícone/texto (que quer ficar claro pra ler sobre fundo escuro), daí
// os dois conjuntos serem tokens separados em vez de reaproveitar um só.
//
// dangerLight é o fundo do card "urgente" do Home: era um hex fixo
// (#fef2f2) sem equivalente no tema escuro — nesse caso o texto quase-branco
// do tema escuro ficava quase invisível sobre ele.
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
  dangerColor: '#b91c1c',
  dangerLight: '#fef2f2',
  primaryStrong: '#4f46e5',
  successStrong: '#047857',
  warningStrong: '#b45309',
  dangerStrong: '#b91c1c',
  bonusStrong: '#0369a1',
  borderColor: '#e2e8f0',
  radiusMd: '12px',
  radiusFull: '9999px',
};
export const darkTheme = {
  isDark: true,
  primaryColor: '#818cf8',
  // @audit-ok [E3.4 — era #312e81: o texto do subtítulo não-urgente
  // (primaryColor sobre primaryLight) dava só 3,83:1 nesse tom. Mais escuro
  // aqui não afeta o textPrimary quase-branco que também usa esse fundo
  // (continua folgado, 15+:1).]
  primaryLight: '#1e1b4b',
  bgPrimary: '#020617',
  bgSurface: '#0f172a',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  successColor: '#34d399',
  warningColor: '#fbbf24',
  dangerColor: '#f87171',
  dangerLight: '#2d1416',
  primaryStrong: '#4338ca',
  successStrong: '#065f46',
  warningStrong: '#92400e',
  dangerStrong: '#991b1b',
  bonusStrong: '#075985',
  borderColor: '#1e293b',
  radiusMd: '12px',
  radiusFull: '9999px',
};
