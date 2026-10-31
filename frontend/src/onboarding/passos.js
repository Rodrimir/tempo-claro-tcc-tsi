// Roteiro do guia de primeiro acesso. As falas ficam no i18n (guia.passos.<id>); aqui só a ordem,
// o elemento destacado de cada passo e o que encerra o guia.

export const ALVOS = {
  INICIO: 'nav.inicio',
  DADOS: 'nav.stats',
  CENTRAL: 'nav.central',
  LOJA: 'nav.loja',
  PERFIL: 'nav.perfil',
  OFENSIVA: 'header.ofensiva',
  MOEDAS: 'header.moedas',
  ESCUDOS: 'header.escudos',
  CRIAR: 'home.criar',
};

export const FASES = {
  PREFERENCIAS: 'preferencias',
  TOUR: 'tour',
};

// Quem ainda não tem hábito termina criando o primeiro: só o botão de criar fica tocável. Quem já
// tem (contas antigas, que também passam pelo guia uma vez) termina com "Entendi".
export function passosDoGuia({ temHabitos }) {
  return [
    { id: 'boasVindas', alvo: null },
    { id: 'inicio', alvo: ALVOS.INICIO },
    { id: 'dados', alvo: ALVOS.DADOS },
    { id: 'central', alvo: ALVOS.CENTRAL },
    { id: 'loja', alvo: ALVOS.LOJA },
    { id: 'perfil', alvo: ALVOS.PERFIL },
    { id: 'ofensiva', alvo: ALVOS.OFENSIVA },
    { id: 'moedas', alvo: ALVOS.MOEDAS },
    { id: 'escudos', alvo: ALVOS.ESCUDOS },
    { id: 'grafico', alvo: null, grafico: true },
    temHabitos
      ? { id: 'finalComHabitos', alvo: ALVOS.CENTRAL, conclui: true }
      : { id: 'final', alvo: ALVOS.CRIAR, interativo: true },
  ];
}

// O guia aparece para toda conta que ainda não o concluiu. Perfil salvo por uma versão antiga do
// app não tem o campo: nesse caso espera o /me responder, em vez de abrir o guia por engano.
export function deveMostrarGuia(user) {
  return Boolean(user) && user.onboarding_concluido === false;
}

export function proximaEtapa(etapa, total) {
  return Math.min(etapa + 1, Math.max(0, total - 1));
}

// Onde o balão fica: abaixo do alvo quando ele está na metade de cima da tela, acima quando está
// na de baixo, e no centro quando o passo não destaca nada. Sempre dentro da tela.
export function posicaoDoBalao(alvo, tela, alturaDoBalao, margem = 16) {
  const largura = Math.min(320, tela.width - margem * 2);
  if (!alvo) {
    return { left: (tela.width - largura) / 2, top: Math.max(margem, (tela.height - alturaDoBalao) / 2), width: largura };
  }
  const centro = alvo.x + alvo.w / 2;
  const left = Math.min(Math.max(margem, centro - largura / 2), tela.width - largura - margem);
  const abaixo = alvo.y + alvo.h / 2 < tela.height / 2;
  const desejado = abaixo ? alvo.y + alvo.h + 12 : alvo.y - alturaDoBalao - 12;
  const top = Math.min(Math.max(margem, desejado), Math.max(margem, tela.height - alturaDoBalao - margem));
  return { left, top, width: largura };
}
