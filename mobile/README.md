# Tempo Claro — App Expo (`mobile/`)

Camada de apresentação em React Native + Expo, migrada de `frontend/` (Vite + React + Capacitor).
Backend inalterado — mesma API REST em `backend/`, mesmo contrato `snake_case`, mesmo JWT.

## Mapa de diretórios

```
mobile/
├── app/                          Rotas (expo-router — um arquivo = uma rota)
│   ├── _layout.jsx                Stack raiz: providers, guarda de autenticação, splash/fontes
│   ├── index.jsx                  Redireciona para /home
│   ├── login.jsx                  Única rota pública
│   ├── (tabs)/                    Grupo com barra inferior
│   │   ├── _layout.jsx             Tabs com tabBar customizada (BottomNav)
│   │   ├── home.jsx · stats.jsx · store.jsx · profile.jsx · create.jsx
│   ├── pretask.jsx · execute.jsx · success.jsx · fail.jsx
│   │                               Fora do grupo (tabs) — sem barra inferior, de propósito
│   └── +not-found.jsx             Redireciona para /home
│
├── src/
│   ├── pages/                     Uma pasta por tela: index.jsx + styles.js (+ validation.js
│   │                               onde há react-hook-form/yup, timezones.js no Profile)
│   ├── components/common/         CircularProgress, MonospaceTimer, Toast, LoadingScreen,
│   │                               GiveUpModal — usados por várias telas
│   ├── components/layout/         BottomNav (tabBar customizada), LocalHeader
│   ├── contexts/                  Auth, CurrentHabit, ExecutionResult (novo, substitui
│   │                               location.state), ThemeToggle, Toast
│   ├── hooks/                     useTimer (deadline absoluto + AppState), useFloat/usePulse
│   │                               (animações reanimated reaproveitadas em várias telas)
│   ├── services/api.js            Instância axios — mesmas 12 funções do frontend/
│   ├── utils/storage.js           SecureStore (token) + AsyncStorage (perfil, timer) — tudo
│   │                               assíncrono, ao contrário do localStorage síncrono do web
│   └── styles/                    theme.js (as mesmas 19 chaves do frontend/, radius em número)
│                                   e fonts.js (os 4 pesos de Lexend usados de fato)
│
├── assets/                        Ícone, splash, gotinha/sol/lua — copiados de frontend/
├── app.json                       Identidade do app, plugins, ícone adaptativo
├── CLAUDE.md                      Regras, matriz de substituição, achados de migração
└── PARIDADE.md                    Checklist de paridade — 14 fluxos + 10 telas + 7 limitações
```

## Matriz de substituição

O que virou o quê, saindo do `frontend/`:

| Hoje (`frontend/`) | No Expo (`mobile/`) |
|---|---|
| `react-router-dom` · `<BrowserRouter>` | `expo-router` — rotas por arquivo em `app/` |
| `navigate('/home')` | `router.replace('/home')` / `router.push(...)` |
| `location.state` | `ExecutionResultContext` — não params de rota |
| `<div>` · `<button>` · `<img>` | `<View>` · `<Pressable>` · `<Image>` (expo-image) |
| `styled.div` (web) | `styled.View` (`styled-components/native`) |
| CSS custom properties (`--primary-color`) | `props => props.theme.primaryColor` |
| `@keyframes` / `transition` | `react-native-reanimated` |
| SVG inline (`CircularProgress`, gráfico da Stats) | `react-native-svg` |
| `localStorage` + AES do `crypto-js` | `expo-secure-store` (token) + `AsyncStorage` (resto) |
| `crypto.randomUUID()` | `Crypto.randomUUID()` do `expo-crypto` |
| `navigator.vibrate(...)` | `Haptics.notificationAsync(...)` |
| `document.visibilitychange` | `AppState` do `react-native` |
| `window.matchMedia('prefers-color-scheme')` | `useColorScheme()` do `react-native` |
| `lucide-react` | `@expo/vector-icons` (Feather/MaterialCommunityIcons/FontAwesome5) |
| `recharts` | `react-native-svg` desenhando as barras à mão |
| `<select>` / `<input type="time">` | `Pressable` + `Modal` (sem lib de picker na lista de dependências) |
| Capacitor + `npx cap sync` + Gradle | `expo prebuild` + `./gradlew assembleRelease` (ou EAS) |

Matriz completa, com o raciocínio de cada linha, em `CLAUDE.md`.

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

## Limitações preservadas de propósito

A migração é paridade, não reforma — o app `mobile/` reproduz de propósito tudo que o `frontend/`
ainda não faz. A lista completa, com o texto exato de cada uma, está em `PARIDADE.md`, tabela C:
"Medir Dificuldade" decorativo, seletor de idioma decorativo, exclusão de conta não implementada,
`PwaPauseModal` não portado (código inalcançável mesmo no web), consumo automático de escudo não
implementado, questionário de calibração não implementado — e uma nota registrando que três
suposições do plano de migração original (dias da semana, editar/arquivar hábito e `GET /stats/
weekly`) já tinham deixado de ser limitação antes de esta tela ser portada.
