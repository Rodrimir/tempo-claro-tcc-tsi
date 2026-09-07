# Tempo Claro — App Expo (`mobile/`)

## Objetivo

Reconstruir a camada de apresentação de `frontend/` (Vite + React + Capacitor) em Expo +
React Native, entregando um APK **indistinguível do WebView atual**, tela por tela, fluxo por
fluxo. Isto é uma portagem, não uma reforma.

**Paridade inclui os defeitos.** Se uma tela do `frontend/` tem um estado vazio, um botão
decorativo ou uma regra incompleta, a tela em `mobile/` tem exatamente o mesmo estado vazio, o
mesmo botão decorativo, a mesma regra incompleta. Corrigir isso é trabalho de outra branch, com o
`PLANO_EXECUCAO.md` retomado depois que a migração terminar. As limitações que precisam ser
preservadas de propósito estão listadas em `mobile/PARIDADE.md`, tabela C — inclusive uma nota lá
sobre três suposições do plano de migração que já estavam desatualizadas quando esta tarefa foi
lida (dias da semana, editar/arquivar hábito e `GET /stats/weekly` deixaram de ser limitação).

## Regras

- **Consulte `frontend/src/<arquivo equivalente>` antes de escrever qualquer tela.** O código do
  `frontend/` é a especificação — não a memória do que ele faz, não este documento.
- **`backend/` é intocável nesta branch.** A API é REST pura, agnóstica de cliente, autenticada
  por `Bearer`. Nenhuma tarefa de migração deveria pedir mudança em `backend/`; se pedir, ela está
  errada.
- **Nunca deixe comentários no código.** Nem os que já existiam no arquivo original do
  `frontend/`, se a tela que os continha for reescrita aqui.
- Instale pacotes sempre com `npx expo install <pacote>`, nunca `npm install` direto.

## Matriz de substituição

Toda vez que uma tarefa esbarrar em "e isso aqui vira o quê?", a resposta provavelmente está aqui.

| Hoje (`frontend/`)                              | No Expo (`mobile/`)                                             |
| ------------------------------------------------ | ----------------------------------------------------------------- |
| `react-router-dom` v7 · `<BrowserRouter>`       | `expo-router` — rotas por arquivo em `app/`                     |
| `navigate('/home')`                             | `router.replace('/home')` / `router.push(...)`                  |
| `location.state`                                | `ExecutionResultContext` — **não** params de URL                |
| `<div>` · `<p>`/`<span>` · `<button>` · `<img>` | `<View>` · `<Text>` · `<Pressable>` · `<Image>` (expo-image)    |
| `styled.div` (web)                              | `styled.View` (`styled-components/native`)                      |
| CSS custom properties (`--primary-color`)       | `props => props.theme.primaryColor` — **não existe var em RN**  |
| `GlobalStyles.js` (reset + `@import` da fonte)  | `expo-font` + `ThemeProvider` no `_layout.jsx` raiz             |
| SCSS da tela Fail                               | `styled-components/native`, como todas as outras                |
| `@keyframes` / `transition`                     | `react-native-reanimated`                                       |
| SVG inline (`CircularProgress`)                 | `react-native-svg`                                              |
| `localStorage` + AES do `crypto-js`             | `expo-secure-store` (token) + `AsyncStorage` (timer, perfil)    |
| `crypto.randomUUID()`                           | `Crypto.randomUUID()` do `expo-crypto`                          |
| `navigator.vibrate(...)`                        | `Haptics.notificationAsync(...)`                                |
| `document.visibilitychange`                     | `AppState` do `react-native`                                    |
| `window.matchMedia('prefers-color-scheme')`     | `useColorScheme()` do `react-native`                            |
| `window.location.href = '/login'` (401)         | Callback registrado pelo `AuthContext` → `router.replace`       |
| `lucide-react` · `react-icons`                  | `@expo/vector-icons`                                            |
| `recharts`                                      | `react-native-svg` desenhando as barras à mão                   |
| `#root { max-width: 480px }`                    | Não se aplica — a tela **é** o celular. `SafeAreaView` no lugar |
| `index.html` · `vite.config.js`                 | `app.json` · `app/_layout.jsx` · `metro.config.js` (padrão)     |
| Capacitor + `npx cap sync` + Gradle             | `eas build -p android --profile preview`                        |

## Regra de ouro do estilo

Em React Native não existe CSS custom property. O tema chega por `props.theme`, nunca por
`var(--...)`:

```
ERRADO:  color: var(--text-primary);
CERTO:   color: ${props => props.theme.textPrimary};
```

`mobile/src/styles/theme.js` tem as mesmas 19 chaves de `frontend/src/styles/theme.js`, com os
mesmos valores hex — exceto `radiusMd` e `radiusFull`, que em `mobile/` são números (`12` e
`9999`), não strings com `"px"`. Não existe `GlobalStyles` em `mobile/`: reset, box-sizing e o
`max-width` do `#root` não têm equivalente em React Native.

## Armazenamento: `sessionStorage` não existe em RN

`frontend/src/utils/storage.js` tem 3 funções a mais do que a tarefa que criou o equivalente em
`mobile/` citava: `saveExecutingHabitId` / `loadExecutingHabitId` / `clearExecutingHabitId`
(adicionadas na E1.2, depois de o plano de migração ter sido escrito). No web elas usam
`sessionStorage` — guardam qual hábito está em execução para a tela `/execute` se recuperar de um
F5 sem perder o hábito nem o tempo decorrido, e somem sozinhas ao fechar a aba.

React Native não tem equivalente de `sessionStorage` (não existe "aba"). `mobile/src/utils/
storage.js` usa `AsyncStorage` para essa chave também — funcionalmente cobre o caso análogo (app
morto pelo sistema e reaberto), mas com uma diferença real: no web o dado some ao fechar a aba, em
`mobile/` ele sobrevive até `clearExecutingHabitId` ser chamado explicitamente. Ao portar M3.4/M3.5,
não deixe de chamar `clearExecutingHabitId` nos mesmos pontos onde o web chama (junto com
`clearExecutionState`, na conclusão ou desistência) — sem isso, um hábito já encerrado poderia ser
"recuperado" numa sessão futura.

## 401 na API: quem faz o quê

`frontend/src/services/api.js` reage a 401 fazendo tudo inline no interceptor: dispara um toast de
sessão expirada (via `window.dispatchEvent`, que não existe em RN), espera 2s, limpa o token e
redireciona (`window.location.href`). `mobile/src/services/api.js` só expõe
`setUnauthorizedHandler(fn)` e chama `fn()` no 401 — a sequência toast → espera de 2s →
`clearAuthToken` → `router.replace('/login')` inteira é responsabilidade de quem registra o
handler (`AuthContext`). Como a ordem de aninhamento dos providers é Auth > CurrentHabit >
ExecutionResult > ThemeToggle > Toast, `AuthContext` fica FORA de `ToastProvider` e não pode
chamar `useToast()` — por isso o toast sai por `DeviceEventEmitter.emit('tempoClaro:toast', ...)`,
o mesmo canal que `ToastContext` escuta com `DeviceEventEmitter.addListener` — equivalente direto
do par `window.dispatchEvent`/`window.addEventListener` do web (inclusive a string do evento e o
formato `{ message, type, duration }` são os mesmos). Não simplifique para um redirect direto sem
toast nem espera — isso mudaria o comportamento visível.

## Pendências que a M1.5 deixou para a M2

`BottomNav` (M2.6) é de uma etapa posterior a M1. Um atalho temporário ainda precisa ser
substituído quando a peça real existir:

- **Barra de abas:** `app/(tabs)/_layout.jsx` usa o `tabBar` padrão do `Tabs` do expo-router.
  **A M2.6 substitui por `tabBar={props => <BottomNav {...props} />}`**, que também é quem
  desenha o botão Play central (não é uma `Tabs.Screen`).

## `ThemeProvider` fica no `_layout.jsx` raiz

A matriz de substituição já dizia isso (`GlobalStyles.js` → `expo-font` + `ThemeProvider` no
`_layout.jsx` raiz), mas nenhuma tarefa de M1 tinha essa linha explícita no prompt — só ficou
resolvido na M2.4, quando a `LoadingScreen` (o primeiro componente realmente montado dentro da
árvore do `_layout.jsx`, não só compilado num harness solto) expôs a falta. `app/_layout.jsx` tem
um componente `ThemedApp` entre o `ThemeToggleProvider` e o `ToastProvider` que lê `isDark` e
escolhe `lightTheme`/`darkTheme` (`src/styles/theme.js`) para o `ThemeProvider` do
`styled-components/native`. Qualquer tela ou componente com `props.theme` só funciona dentro dessa
árvore — o pequeno `View` de fallback enquanto as fontes carregam (antes de qualquer provider
montar) usa `lightTheme.bgPrimary` direto, sem `ThemeProvider`, porque não há como saber o tema do
usuário antes do `AuthProvider`/`ThemeToggleProvider` sequer montarem.

O `Toast` visual (M2.3) já está resolvido: `ToastContext.jsx` renderiza o cartão de verdade
(fundo por tipo — `dangerStrong`/`successStrong`/`bgSurface` — e o prefixo literal `"V "`/`"X "`
que o web usa no lugar de ícone), com `SlideInRight`/`FadeOut` do react-native-reanimated como
`entering`/`exiting` do `Animated.View`. Isso trocou a mecânica de saída: o web marca `saindo:
true` e só remove do array 300ms depois (pra dar tempo da classe `.fading` rodar); em RN a
remoção do array é imediata e é o `exiting` do reanimated que segura a view na tela durante a
animação de saída — duplicar os dois mecanismos somaria 600ms de saída em vez de 300ms.

## `ThemeToggleContext`: sem leitura síncrona em RN

No web, `tema` é lido de forma síncrona do `localStorage` no primeiro render (evita o flash: a cor
certa já sai no primeiro frame). `AsyncStorage` não tem equivalente síncrono — `mobile/` inicia
sempre com `tema = 'sistema'` e só troca para o valor persistido (se houver `'claro'`/`'escuro'`
explícito) depois que a leitura assíncrona resolve, um frame ou dois depois do primeiro render.
Diferença real e aceitável, não um bug a esconder.

## Contrato de nomes da API: `snake_case`

Os DTOs de resposta do backend declaram os campos em `snake_case`, não `camelCase`:

```
HabitoResponseDTO {
  id, tipo_medida, meta_base, meta_frequencia_diaria, ...
}
```

Isso é deliberado do lado do backend: o Jackson serializa pelo nome do campo, então o JSON chega
ao cliente já no formato esperado, sem `@JsonProperty` nem conversão. **A correspondência entre os
dois lados não é verificada por nenhum compilador.** Ao consumir ou montar um payload em
`mobile/`, use exatamente os nomes em `snake_case` do DTO — um campo com nome levemente diferente
(`fusoHorario` em vez de `fuso_horario`, por exemplo) não dá erro: o Jackson ignora o campo
desconhecido, o endpoint responde `200 OK`, e a alteração simplesmente não acontece.
