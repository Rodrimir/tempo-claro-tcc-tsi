// A exclusão de conta só habilita com a palavra exata do idioma ("excluir!" ou "delete!"). O
// espaço que o teclado põe no fim não conta.
export function confirmacaoDeExclusaoValida(digitado, palavra) {
  return typeof digitado === 'string' && Boolean(palavra) && digitado.trim() === palavra;
}
