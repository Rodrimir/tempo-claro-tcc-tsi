// Assina o APK de release com a chave própria do projeto, guardada fora do repositório.
// O caminho do keystore e as senhas vêm de propriedades do Gradle (em ~/.gradle/gradle.properties):
//   TEMPO_CLARO_KEYSTORE, TEMPO_CLARO_KEYSTORE_PASSWORD, TEMPO_CLARO_KEY_ALIAS, TEMPO_CLARO_KEY_PASSWORD
// Sem elas, o release continua assinado com a chave de debug, para que o build funcione em qualquer
// máquina. Como o android/ é gerado pelo prebuild, a configuração é reaplicada a cada geração.
const { withAppBuildGradle } = require('expo/config-plugins');

const MARCA = 'TEMPO_CLARO_KEYSTORE';

const CONFIG_RELEASE = `
        release {
            if (project.hasProperty('TEMPO_CLARO_KEYSTORE')) {
                storeFile file(TEMPO_CLARO_KEYSTORE)
                storePassword TEMPO_CLARO_KEYSTORE_PASSWORD
                keyAlias TEMPO_CLARO_KEY_ALIAS
                keyPassword TEMPO_CLARO_KEY_PASSWORD
            }
        }`;

function aplicarAssinatura(gradle) {
  if (gradle.includes(MARCA)) return gradle;

  const comConfig = gradle.replace(/(signingConfigs \{\n\s*debug \{[\s\S]*?\n\s{8}\})/, `$1${CONFIG_RELEASE}`);
  const comUso = comConfig.replace(
    /(release \{\n(?:\s*\/\/.*\n)*\s*)signingConfig signingConfigs\.debug/,
    "$1signingConfig project.hasProperty('TEMPO_CLARO_KEYSTORE') ? signingConfigs.release : signingConfigs.debug"
  );

  if (comConfig === gradle || comUso === comConfig) {
    throw new Error('withAssinaturaRelease: o modelo do app/build.gradle mudou; revise o plugin.');
  }
  return comUso;
}

module.exports = function withAssinaturaRelease(config) {
  return withAppBuildGradle(config, (modConfig) => {
    modConfig.modResults.contents = aplicarAssinatura(modConfig.modResults.contents);
    return modConfig;
  });
};

module.exports.aplicarAssinatura = aplicarAssinatura;
