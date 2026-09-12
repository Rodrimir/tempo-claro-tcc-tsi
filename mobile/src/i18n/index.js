import pt from './pt';
import en from './en';

export const IDIOMAS = {
  'pt-BR': { nome: 'Português', bandeira: '🇧🇷', curto: 'PT', dicionario: pt },
  'en-US': { nome: 'English', bandeira: '🇺🇸', curto: 'EN', dicionario: en },
};

export const IDIOMA_PADRAO = 'pt-BR';

/**
 * Busca uma chave com caminho por ponto ("home.faltam") e interpola os valores
 * entre chaves ("Faltam {tempo}").
 *
 * Chave inexistente devolve a própria chave em vez de string vazia: numa tela em
 * desenvolvimento é melhor ver "stats.recordes" e saber o que falta traduzir do
 * que um espaço em branco silencioso.
 */
export function traduzir(idioma, chave, valores) {
  const dicionario = (IDIOMAS[idioma] || IDIOMAS[IDIOMA_PADRAO]).dicionario;
  const bruto = chave.split('.').reduce((obj, parte) => (obj == null ? undefined : obj[parte]), dicionario);

  if (bruto == null) return chave;
  if (typeof bruto !== 'string') return bruto;
  if (!valores) return bruto;

  return Object.entries(valores).reduce(
    (texto, [nome, valor]) => texto.replaceAll(`{${nome}}`, String(valor)),
    bruto
  );
}
