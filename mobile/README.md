# Tempo Claro — App Expo (`mobile/`)

Camada de apresentação em React Native + Expo, migrada de `frontend/` (Vite + React + Capacitor).
Backend inalterado — mesma API REST em `backend/`, mesmo contrato `snake_case`, mesmo JWT.

## Rodar em desenvolvimento

```bash
cd mobile
npm install
npx expo start
```

Abre no Expo Go (build gerenciado) ou num dev client, conforme o QR code/URL exibido pelo Metro.
Por padrão fala com a API de produção (Render); para apontar para um backend local, defina
`EXPO_PUBLIC_API_URL` (ver `src/services/api.js`).

## Gerar o APK

Caminho escolhido: **build local**, não EAS — evita depender de uma conta na nuvem para gerar um
APK de teste.

```bash
cd mobile
npx expo prebuild --platform android   # gera android/ (gitignored, regenerado sob demanda)
cd android
./gradlew assembleRelease
```

O APK sai em `android/app/build/outputs/apk/release/app-release.apk`. O `build.gradle` gerado pelo
`prebuild` não define uma configuração de assinatura própria — o `release` usa a mesma keystore de
debug do `debug` (padrão do Expo quando nenhuma assinatura de produção é configurada). Isso é
suficiente para sideload e teste em aparelho físico; não é a configuração para publicar na Play
Store, que exigiria uma keystore de upload própria.

Para instalar:

```bash
adb install android/app/build/outputs/apk/release/app-release.apk
```

`android.package` está em `com.rodrigo.tempoclaro.expo` (não `com.rodrigo.tempoclaro`) de
propósito — o mesmo `applicationId` do Capacitor faria o APK novo substituir o antigo ao instalar.
O sufixo `.expo` permite os dois lado a lado no aparelho durante a comparação de paridade
(`PARIDADE.md`). Reverta para `com.rodrigo.tempoclaro` em `app.json` antes de gerar o APK final
que vai para a banca.
