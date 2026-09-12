/**
 * Registro central dos avatares.
 *
 * A arte real chegou em `assets/avatares/`, nomeada `{nivel}{expressao}{habito}.png`
 * — nível de 1 a 5 (sta_nivel_avatar, que sobe a cada 10 dias por RF14), expressão
 * e hábito por extenso. Metro exige `require()` com caminho literal (não aceita
 * string montada em runtime), então a tabela abaixo é a enumeração das 75
 * combinações — é o preço de não ter um bundler de assets dinâmico, não uma
 * escolha de design.
 *
 *   AGUA       -> gotinha
 *   ESTUDO     -> livrinho
 *   EXERCICIO  -> trino
 *
 *   normal       estado de repouso do dia
 *   feliz        meta do dia cumprida
 *   preocupado   o horário da ocorrência está chegando
 *   desesperado  o horário passou e a meta ainda não foi cumprida
 *   triste       o prazo estourou (estado interno chamado "falha" em Home.jsx)
 */
const ARTE = {
  gotinha: {
    1: {
      normal: require('../../assets/avatares/1normalgotinha.png'),
      feliz: require('../../assets/avatares/1felizgotinha.png'),
      preocupado: require('../../assets/avatares/1preocupadogotinha.png'),
      desesperado: require('../../assets/avatares/1desesperadogotinha.png'),
      triste: require('../../assets/avatares/1tristegotinha.png'),
    },
    2: {
      normal: require('../../assets/avatares/2normalgotinha.png'),
      feliz: require('../../assets/avatares/2felizgotinha.png'),
      preocupado: require('../../assets/avatares/2preocupadogotinha.png'),
      desesperado: require('../../assets/avatares/2desesperadogotinha.png'),
      triste: require('../../assets/avatares/2tristegotinha.png'),
    },
    3: {
      normal: require('../../assets/avatares/3normalgotinha.png'),
      feliz: require('../../assets/avatares/3felizgotinha.png'),
      preocupado: require('../../assets/avatares/3preocupadogotinha.png'),
      desesperado: require('../../assets/avatares/3desesperadogotinha.png'),
      triste: require('../../assets/avatares/3tristegotinha.png'),
    },
    4: {
      normal: require('../../assets/avatares/4normalgotinha.png'),
      feliz: require('../../assets/avatares/4felizgotinha.png'),
      preocupado: require('../../assets/avatares/4preocupadogotinha.png'),
      desesperado: require('../../assets/avatares/4desesperadogotinha.png'),
      triste: require('../../assets/avatares/4tristegotinha.png'),
    },
    5: {
      normal: require('../../assets/avatares/5normalgotinha.png'),
      feliz: require('../../assets/avatares/5felizgotinha.png'),
      preocupado: require('../../assets/avatares/5preocupadogotinha.png'),
      desesperado: require('../../assets/avatares/5desesperadogotinha.png'),
      triste: require('../../assets/avatares/5tristegotinha.png'),
    },
  },
  livrinho: {
    1: {
      normal: require('../../assets/avatares/1normallivrinho.png'),
      feliz: require('../../assets/avatares/1felizlivrinho.png'),
      preocupado: require('../../assets/avatares/1preocupadolivrinho.png'),
      desesperado: require('../../assets/avatares/1desesperadolivrinho.png'),
      triste: require('../../assets/avatares/1tristelivrinho.png'),
    },
    2: {
      normal: require('../../assets/avatares/2normallivrinho.png'),
      feliz: require('../../assets/avatares/2felizlivrinho.png'),
      preocupado: require('../../assets/avatares/2preocupadolivrinho.png'),
      desesperado: require('../../assets/avatares/2desesperadolivrinho.png'),
      triste: require('../../assets/avatares/2tristelivrinho.png'),
    },
    3: {
      normal: require('../../assets/avatares/3normallivrinho.png'),
      feliz: require('../../assets/avatares/3felizlivrinho.png'),
      preocupado: require('../../assets/avatares/3preocupadolivrinho.png'),
      desesperado: require('../../assets/avatares/3desesperadolivrinho.png'),
      triste: require('../../assets/avatares/3tristelivrinho.png'),
    },
    4: {
      normal: require('../../assets/avatares/4normallivrinho.png'),
      feliz: require('../../assets/avatares/4felizlivrinho.png'),
      preocupado: require('../../assets/avatares/4preocupadolivrinho.png'),
      desesperado: require('../../assets/avatares/4desesperadolivrinho.png'),
      triste: require('../../assets/avatares/4tristelivrinho.png'),
    },
    5: {
      normal: require('../../assets/avatares/5normallivrinho.png'),
      feliz: require('../../assets/avatares/5felizlivrinho.png'),
      preocupado: require('../../assets/avatares/5preocupadolivrinho.png'),
      desesperado: require('../../assets/avatares/5desesperadolivrinho.png'),
      triste: require('../../assets/avatares/5tristelivrinho.png'),
    },
  },
  trino: {
    1: {
      normal: require('../../assets/avatares/1normaltrino.png'),
      feliz: require('../../assets/avatares/1feliztrino.png'),
      preocupado: require('../../assets/avatares/1preocupadotrino.png'),
      desesperado: require('../../assets/avatares/1desesperadotrino.png'),
      triste: require('../../assets/avatares/1tristetrino.png'),
    },
    2: {
      normal: require('../../assets/avatares/2normaltrino.png'),
      feliz: require('../../assets/avatares/2feliztrino.png'),
      preocupado: require('../../assets/avatares/2preocupadotrino.png'),
      desesperado: require('../../assets/avatares/2desesperadotrino.png'),
      triste: require('../../assets/avatares/2tristetrino.png'),
    },
    3: {
      normal: require('../../assets/avatares/3normaltrino.png'),
      feliz: require('../../assets/avatares/3feliztrino.png'),
      preocupado: require('../../assets/avatares/3preocupadotrino.png'),
      desesperado: require('../../assets/avatares/3desesperadotrino.png'),
      triste: require('../../assets/avatares/3tristetrino.png'),
    },
    4: {
      normal: require('../../assets/avatares/4normaltrino.png'),
      feliz: require('../../assets/avatares/4feliztrino.png'),
      preocupado: require('../../assets/avatares/4preocupadotrino.png'),
      desesperado: require('../../assets/avatares/4desesperadotrino.png'),
      triste: require('../../assets/avatares/4tristetrino.png'),
    },
    5: {
      normal: require('../../assets/avatares/5normaltrino.png'),
      feliz: require('../../assets/avatares/5feliztrino.png'),
      preocupado: require('../../assets/avatares/5preocupadotrino.png'),
      desesperado: require('../../assets/avatares/5desesperadotrino.png'),
      triste: require('../../assets/avatares/5tristetrino.png'),
    },
  },
};

const HABITO_POR_CATEGORIA = { AGUA: 'gotinha', ESTUDO: 'livrinho', EXERCICIO: 'trino' };

// getAvatarExpression (Home/index.jsx) devolve 'falha' para o estado "prazo
// estourou" — nome que já era usado antes da arte chegar. O arquivo usa
// "triste" para o mesmo estado; a tradução fica só aqui, não espalhada pelas
// telas que chamam avatarDe.
const ARQUIVO_POR_EXPRESSAO = {
  normal: 'normal',
  feliz: 'feliz',
  preocupado: 'preocupado',
  desesperado: 'desesperado',
  falha: 'triste',
};

const NIVEL_MINIMO = 1;
const NIVEL_MAXIMO = 5;

export function avatarDe(categoria, expressao, nivel) {
  const habito = ARTE[HABITO_POR_CATEGORIA[categoria]] ? HABITO_POR_CATEGORIA[categoria] : 'gotinha';
  const nivelValido = Math.min(NIVEL_MAXIMO, Math.max(NIVEL_MINIMO, Number(nivel) || NIVEL_MINIMO));
  const arquivo = ARQUIVO_POR_EXPRESSAO[expressao] || 'normal';
  const porNivel = ARTE[habito][nivelValido];
  return porNivel[arquivo] || porNivel.normal;
}

export default ARTE;
