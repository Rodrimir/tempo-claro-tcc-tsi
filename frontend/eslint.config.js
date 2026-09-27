const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'android/*', '.expo/*'],
  },
  {
    settings: {
      'import/ignore': ['node_modules'],
    },
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // Desligada porque o resolver do plugin import nao le os aliases "@/" do
      // jsconfig.json, entao acusaria todos os imports internos como quebrados.
      // Quem valida esses caminhos de verdade e o Metro, no bundle.
      'import/no-unresolved': 'off',
    },
  },
]);
