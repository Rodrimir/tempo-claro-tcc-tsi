// Confere a tradução do app (npm run i18n:check):
// 1. pt e en têm as mesmas chaves, os mesmos marcadores {x} e listas do mesmo tamanho;
// 2. toda chave usada como t('...') no código existe nos dois idiomas;
// 3. nenhum texto visível fica fixo no JSX, fora do i18n.
// Sai com código 1 se achar algum problema.
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');

function carregar(arquivo) {
  const fonte = fs.readFileSync(path.join(RAIZ, 'src/i18n', arquivo), 'utf8');
  const modulo = { exports: {} };
  new Function('module', 'exports', fonte.replace(/export default/, 'module.exports ='))(modulo, modulo.exports);
  return modulo.exports;
}

function folhas(objeto, prefixo = '') {
  return Object.entries(objeto).flatMap(([chave, valor]) =>
    valor && typeof valor === 'object' && !Array.isArray(valor)
      ? folhas(valor, `${prefixo}${chave}.`)
      : [[`${prefixo}${chave}`, valor]]
  );
}

const marcadores = (texto) => (typeof texto === 'string' ? [...texto.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort() : []);

const problemas = [];
const pt = new Map(folhas(carregar('pt.js')));
const en = new Map(folhas(carregar('en.js')));

for (const [chave, valor] of pt) {
  if (!en.has(chave)) {
    problemas.push(`só em pt: ${chave}`);
    continue;
  }
  const outro = en.get(chave);
  if (Array.isArray(valor) !== Array.isArray(outro) || (Array.isArray(valor) && valor.length !== outro.length)) {
    problemas.push(`lista diferente entre pt e en: ${chave}`);
  }
  if (marcadores(valor).join() !== marcadores(outro).join()) {
    problemas.push(`marcadores diferentes em ${chave}: pt {${marcadores(valor)}} en {${marcadores(outro)}}`);
  }
}
for (const chave of en.keys()) if (!pt.has(chave)) problemas.push(`só em en: ${chave}`);

function arquivos(pasta) {
  return fs.readdirSync(pasta, { withFileTypes: true }).flatMap((item) => {
    const caminho = path.join(pasta, item.name);
    if (item.isDirectory()) return item.name === 'i18n' ? [] : arquivos(caminho);
    return /\.(js|jsx)$/.test(item.name) ? [caminho] : [];
  });
}

const NOMES_PROPRIOS = new Set(['Tempo Claro']);

const existe = (chave) => pt.has(chave) || [...pt.keys()].some((k) => k.startsWith(`${chave}.`));

for (const arquivo of [...arquivos(path.join(RAIZ, 'src')), ...arquivos(path.join(RAIZ, 'app'))]) {
  const relativo = path.relative(RAIZ, arquivo);
  const fonte = fs.readFileSync(arquivo, 'utf8');
  const semComentarios = fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  for (const m of semComentarios.matchAll(/\bt\(\s*['"]([\w.]+)['"]/g)) {
    if (!existe(m[1])) problemas.push(`${relativo}: chave inexistente t('${m[1]}')`);
  }

  if (!arquivo.endsWith('.jsx')) continue;
  // Texto entre tags que não seja expressão, número ou símbolo solto.
  // O ">" de uma arrow function (=>) não abre texto. O nome do app não se traduz.
  for (const m of semComentarios.matchAll(/(?<![=])>\s*([^<>{}\n]*[A-Za-zÀ-ÿ]{2,}[^<>{}\n]*)\s*</g)) {
    const texto = m[1].trim();
    if (texto && !NOMES_PROPRIOS.has(texto) && !/[()?=]/.test(texto)) {
      problemas.push(`${relativo}: texto fixo no JSX "${texto}"`);
    }
  }
  for (const m of semComentarios.matchAll(/\b(title|placeholder|accessibilityLabel|accessibilityHint|label|text)="([^"]*[A-Za-zÀ-ÿ]{2,}[^"]*)"/g)) {
    problemas.push(`${relativo}: texto fixo em ${m[1]}="${m[2]}"`);
  }
}

if (problemas.length) {
  console.error(`i18n: ${problemas.length} problema(s)`);
  problemas.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}
console.log(`i18n ok: ${pt.size} chaves em pt e en, nenhum texto fixo encontrado.`);
