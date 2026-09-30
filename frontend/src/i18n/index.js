import pt from './pt';
import en from './en';

export const IDIOMAS = {
  'pt-BR': { nome: 'Português', bandeira: '🇧🇷', curto: 'PT', dicionario: pt },
  'en-US': { nome: 'English', bandeira: '🇺🇸', curto: 'EN', dicionario: en },
};

export const IDIOMA_PADRAO = 'pt-BR';

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
