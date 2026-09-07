# Tempo Claro — Plano de Migração para Expo (Android nativo)

**Origem:** `README.md` (especificação técnica do estado atual) · `PLANO_EXECUCAO.md` (interrompido em E4.4.1)
**Repositório:** `Rodrimir/tempo-claro-tcc-tsi` · branch nova `feat/expo-native`
**Stack de destino:** Expo SDK 57 + React Native 0.86 + expo-router + styled-components/native · backend **inalterado** (Java + Spring Boot + JWT · PostgreSQL/Neon)

---

## O que este plano é e o que não é

**É:** o roteiro para reconstruir a camada de apresentação em React Native, entregando um APK cujo comportamento é **indistinguível do WebView atual**, tela por tela, fluxo por fluxo.

**Não é:** oportunidade de corrigir bug, fechar funcionalidade incompleta ou mudar regra de negócio. Se a Stats hoje mostra gráfico vazio porque `GET /stats/weekly` devolve `[]`, o app Expo também mostra gráfico vazio. Se `updateHabit()` existe em `api.js` e nenhuma tela chama, continua assim. **Paridade inclui os defeitos.** Corrigir vem depois, com o `PLANO_EXECUCAO.md` retomado — e aí as correções valem para uma base só.

**O backend não é tocado em nenhuma tarefa deste documento.** A API é REST pura, agnóstica de cliente, autenticada por `Bearer`. O mesmo `application-prod.properties`, o mesmo JWT, o mesmo contrato `snake_case`. Se alguma tarefa aqui pedir mudança em `backend/`, ela está errada.

### Convenções (herdadas do `PLANO_EXECUCAO.md`)

| Item       | Padrão                                                                                              |
| ---------- | --------------------------------------------------------------------------------------------------- |
| Branch     | `Expo-migration` — uma branch só, do início ao fim                                                  |
| Commit     | `feat(M3.2): porta a tela Home com carrossel em FlatList`                                           |
| Diretório  | O app novo nasce em `mobile/`, na raiz. **`frontend/` não é apagado nem editado** (ver M0.1)        |
| Instalação | **Sempre `npx expo install <pacote>`**, nunca `npm install` direto — quem resolve versão é o SDK 57 |
| Nunca      | Mexer em `backend/`, mudar regra de negócio, "melhorar" comportamento durante a portagem            |

Nunca deixe comentários no código.

Nunca mexa em nada alem do frontend.

### Esforço

`XS` até 30 min · `S` até 2 h · `M` meio dia · `L` 1–2 dias · `XL` mais que isso

**Total estimado: 45 a 60 h.** Com defesa em 24/11 e entrega final em 18/12, cabe — desde que a migração termine até o fim de outubro e sobre novembro para o texto.

---

## Dependências — o que entra, o que sai, o que fica

Base: o `package.json` do `pdm_aulas` (SDK 57). Abaixo, o que muda e por quê.

### Aproveitado da sua lista

| Pacote                                              | Papel no Tempo Claro                                                            |
| --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `expo` · `expo-constants` · `expo-system-ui`        | Base do SDK                                                                     |
| `expo-router`                                       | Substitui `react-router-dom` — rotas por arquivo, espelhando as 11 rotas atuais |
| `expo-secure-store`                                 | Guarda o JWT no Keystore do Android — **aposenta o `crypto-js`**                |
| `expo-font`                                         | Carrega a Lexend (hoje via `@import` no `GlobalStyles`)                         |
| `expo-image`                                        | Substitui `<img>` dos avatares e do sol/lua — tem cache e suporta `.webp`       |
| `expo-splash-screen` · `expo-status-bar`            | Splash e barra de status nativas                                                |
| `expo-linking`                                      | Dependência do router                                                           |
| `@expo/vector-icons`                                | Substitui `lucide-react` e `react-icons` (usa Feather/MaterialCommunity)        |
| `react-native-reanimated` + `react-native-worklets` | Partículas da Success, sol girando da LoadingScreen, entrada dos toasts         |
| `react-native-gesture-handler`                      | Dependência do router/screens; o carrossel da Home                              |
| `react-native-safe-area-context`                    | Notch e barra de gestos — não existia problema no WebView, existe agora         |
| `react-native-screens`                              | Dependência do router                                                           |
| `react-hook-form` + `@hookform/resolvers` + `yup`   | Substitui `services/authService.js` e a validação manual do CreateHabit         |

### Cortado da sua lista

| Pacote                                            | Por que sai                                                                                                         |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `react-native-paper`                              | Impõe Material Design 3. O app tem identidade própria (12 chaves de tema, Lexend, `#4f46e5`) — Paper mudaria a cara |
| `firebase`                                        | Seu backend é Spring Boot com JWT próprio. Não há o que integrar                                                    |
| `@expo/ui` · `expo-glass-effect` · `expo-symbols` | Componentes iOS-first. O alvo é APK Android                                                                         |
| `expo-device` · `expo-web-browser`                | Nenhum fluxo do app lê modelo de aparelho ou abre navegador externo                                                 |
| `react-native-web` · `react-dom`                  | O `frontend/` web continua existindo e servindo esse papel. Rodar RN na web aqui só duplica superfície de teste     |
| `typescript` · `@types/react`                     | O projeto é JS. Migrar tipagem junto com plataforma é duas migrações — faça depois da banca, se quiser              |

### Adicionado (não estava na sua lista, mas o projeto precisa)

| Pacote                                      | Por quê                                                                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `axios`                                     | Já é o cliente HTTP do projeto. Funciona igual em RN — o `services/api.js` porta quase intacto                |
| `styled-components`                         | Mesma lib da versão web, importada de `styled-components/native`. Preserva o padrão `index.jsx` + `styles.js` |
| `@react-native-async-storage/async-storage` | Estado do cronômetro e perfil do usuário — dado não sensível, não precisa de Keystore                         |
| `react-native-svg`                          | O `CircularProgress` é um anel SVG. Também resolve o gráfico da Stats sem trazer lib de chart                 |
| `expo-crypto`                               | `crypto.randomUUID()` não existe em RN — é ele que gera o `execution_token`                                   |
| `expo-haptics`                              | Substitui `navigator.vibrate()` do fim do cronômetro                                                          |

> **Sobre versões:** o único pin que interessa é o SDK. Instale tudo com `npx expo install` e deixe o resolver do Expo escolher. `axios` fica na faixa `^1.x` (mesma major do `frontend/`) e `styled-components` na `^6.x` — assim `api.js` e os `styles.js` portam sem mudança de API.

> **`recharts` não tem equivalente e não vai ser substituído.** A Stats renderiza barras a partir de uma lista que hoje chega vazia. Um punhado de `<Rect>` do `react-native-svg` entrega o mesmo resultado visual sem arrastar Skia ou `gifted-charts` para o bundle.

---

## Matriz de substituição — a tabela que resolve 80% das dúvidas

Cole isto no `CLAUDE.md` do app novo. Toda vez que uma tarefa esbarrar em "e isso aqui vira o quê?", a resposta provavelmente está aqui.

| Hoje (`frontend/`)                              | No Expo (`mobile/`)                                             |
| ----------------------------------------------- | --------------------------------------------------------------- |
| `react-router-dom` v7 · `<BrowserRouter>`       | `expo-router` — rotas por arquivo em `app/`                     |
| `navigate('/home')`                             | `router.replace('/home')` / `router.push(...)`                  |
| `location.state`                                | `ExecutionResultContext` (ver M1.6) — **não** params de URL     |
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

---

## Mapa das etapas

| Etapa  | Nome                                 | Tarefas | Esforço | Depende de |
| ------ | ------------------------------------ | ------- | ------- | ---------- |
| **M0** | Preparação e congelamento            | 4       | S       | —          |
| **M1** | Fundação (nada visível ainda)        | 6       | L       | M0         |
| **M2** | Componentes comuns e de layout       | 7       | L       | M1         |
| **M3** | As dez telas                         | 10      | XL      | M2         |
| **M4** | Cronômetro e comportamento Android   | 3       | M       | M3         |
| **M5** | Build, APK e verificação de paridade | 4       | M       | M4         |
| **M6** | Documentação e TCC                   | 3       | M       | M5         |

**Ordem obrigatória.** Diferente do `PLANO_EXECUCAO.md`, aqui não há caminho alternativo: M1 é pré-requisito duro de tudo, e M3 só começa quando M2 fechar, senão cada tela reinventa um componente comum.

---

# ETAPA M0 — Preparação e congelamento

### ☐ M0.1 — Branch e esqueleto do app `XS`

**Por quê:** `frontend/` continua sendo o app que existe hoje, funciona e está documentado no README. Ele não some enquanto o Expo não tiver paridade comprovada. Se a migração travar em novembro, você ainda tem um APK para defender.

**▶ Prompt**

```
1. Crie e faça checkout da branch feat/expo-native
2. Na raiz do repositório (ao lado de backend/ e frontend/), rode:
     npx create-expo-app@latest mobile --template blank
   Aceite o SDK estável mais recente que o comando trouxer.
   Se vier em TypeScript, converta os arquivos gerados para .jsx —
   este projeto é JavaScript e não muda de linguagem nesta migração.
3. NÃO apague, mova ou edite nada dentro de frontend/. Nem um arquivo.
4. Confirme que `npx expo start` sobe e o app abre no Expo Go
5. Commit: chore(M0.1): esqueleto do app Expo em mobile/
```

**Aceite:** `mobile/` roda no Expo Go com a tela padrão; `git status` mostra zero arquivos modificados em `frontend/` e `backend/`.

---

Concluído

### ☐ M0.2 — Fixar as dependências `S`

**▶ Prompt**

```
Instale, sempre com `npx expo install` (nunca npm install direto):

expo-router expo-constants expo-linking expo-status-bar expo-system-ui
expo-font expo-image expo-secure-store expo-splash-screen expo-crypto
expo-haptics @expo/vector-icons
react-native-reanimated react-native-worklets react-native-gesture-handler
react-native-safe-area-context react-native-screens react-native-svg
@react-native-async-storage/async-storage
axios styled-components react-hook-form @hookform/resolvers yup

NÃO instale: react-native-paper, firebase, @expo/ui, expo-glass-effect,
expo-symbols, expo-device, expo-web-browser, react-native-web, react-dom,
typescript, crypto-js, recharts, lucide-react, react-icons, react-router-dom.

Depois:
1. package.json: "main": "expo-router/entry"
2. babel.config.js: preset babel-preset-expo + plugin do reanimated
   (siga a doc da versão instalada — a ordem do plugin importa)
3. Rode `npx expo-doctor` e resolva o que ele apontar
```

**Aceite:** `npx expo-doctor` sem erro; `npx expo start --clear` sobe limpo.

---

Concluído

### ☐ M0.3 — Checklist de paridade `S` ⭐

**Por quê:** "funciona igual ao de hoje" precisa virar lista verificável, senão a validação final vira opinião. Esta é a régua que a M5.4 vai usar.

**▶ Prompt**

```
Leia o README.md da raiz, seções 7 e 8, e crie mobile/PARIDADE.md com
três tabelas de checkbox:

A) 14 fluxos ponta a ponta (§8.3), uma linha cada, com a coluna
   "comportamento esperado" copiada do README
B) 10 telas (§7.2), com: chamadas de API, contexts consumidos e destinos
   de navegação
C) Limitações que DEVEM ser preservadas (§11.1): stats vazia, "Medir
   Dificuldade" só emite toast, dias da semana descartados no envio,
   seletor de idioma decorativo, sem tela de editar/arquivar, PwaPauseModal
   inalcançável (este pode simplesmente não ser portado — anote a decisão)

Não implemente nada. Só o documento.
```

**Aceite:** `PARIDADE.md` com 14 + 10 + 7 linhas, todas desmarcadas.

---

Concluído

### ☐ M0.4 — `CLAUDE.md` do app novo `XS`

**▶ Prompt**

```
Crie mobile/CLAUDE.md contendo:
- Objetivo: paridade com frontend/, não melhoria
- A matriz de substituição (copie do PLANO_MIGRACAO_EXPO.md)
- Regra: consultar frontend/src/<arquivo equivalente> antes de escrever
  qualquer tela — o original é a especificação
- Regra: backend/ é intocável nesta branch
- Contrato snake_case da API (README §8.2)
```

**Aceite:** arquivo criado; uma sessão nova do Claude Code em `mobile/` já sabe o que não pode fazer.

---

Concluído

# ETAPA M1 — Fundação

> Nada aqui produz tela visível. É a camada que todas as dez telas vão consumir. Pular ou apressar esta etapa custa retrabalho em M3.

### ☐ M1.1 — Tema e styled-components/native `S` ⭐

**Por quê:** este é o ponto onde a migração de estilo se decide. Em RN não existe CSS custom property — o `--primary-color` que hoje todo `styles.js` usa some. O tema passa a chegar por `props.theme`.

**▶ Prompt**

```
1. Copie frontend/src/styles/theme.js para mobile/src/styles/theme.js
   SEM ALTERAR VALOR NENHUM — as 12 chaves de lightTheme e darkTheme
   permanecem idênticas
2. radiusMd e radiusFull viram números (12 e 9999), não strings com "px"
3. Crie mobile/src/styles/fonts.js exportando os nomes das famílias
   Lexend carregadas (ver M1.2)
4. NÃO crie GlobalStyles — não existe equivalente em RN. Reset, box-sizing
   e max-width do #root não têm razão de ser aqui
5. Documente em mobile/CLAUDE.md a regra de ouro do estilo:
     ERRADO:  color: var(--text-primary);
     CERTO:   color: ${props => props.theme.textPrimary};
```

**Aceite:** `theme.js` com as mesmas 12 chaves e os mesmos hex do web; um componente de teste com `styled.View` recebe cor do `ThemeProvider`.

---

Concluído

### ☐ M1.2 — Fonte Lexend e splash `S`

**▶ Prompt**

```
1. npx expo install @expo-google-fonts/lexend
2. No layout raiz, carregue os pesos que o frontend/ usa de fato
   (varra os styles.js atrás de font-weight antes de escolher)
3. Segure a splash com expo-splash-screen até as fontes resolverem —
   sem isso a primeira renderização pisca na fonte de sistema
4. app.json: nome "Tempo Claro", cor de fundo da splash = bgPrimary do
   tema claro (#f8fafc), ícone adaptativo a partir do ícone atual do
   frontend/android/
```

**Aceite:** abrir o app não mostra flash de fonte trocando; a splash cobre o carregamento.

---

Concluído

### ☐ M1.3 — Camada de armazenamento `S` ⭐

**Por quê:** `utils/storage.js` cifra tudo com AES do `crypto-js` no `localStorage`. Em Android nativo isso é redundante e pior: o SecureStore usa o Keystore do sistema. O `crypto-js` sai do projeto.

**▶ Prompt**

```
Crie mobile/src/utils/storage.js com a MESMA superfície pública do arquivo
em frontend/src/utils/storage.js (mesmos nomes de função, mesmas chaves),
mas assíncrona:

  expo-secure-store  → tempoClaro_token          (JWT)
  AsyncStorage       → tempoClaro_user           ({ name, email })
  AsyncStorage       → tempoClaro_exec_{habitId} (estado do cronômetro)

1. Toda função vira async e retorna Promise — anote isso, é o que obriga
   AuthContext e o interceptor do axios a mudarem de forma
2. Não use crypto-js. O SecureStore já é cifrado pelo Keystore; o resto
   não é sensível
3. Mantenha isWithinTolerance com a MESMA janela de 1 hora
4. Nomes de chave idênticos aos do web — não "aproveite para padronizar"
```

**Aceite:** gravar, ler e limpar as três chaves funciona; nenhum import de `crypto-js` no projeto.

---

Concluído

### ☐ M1.4 — `services/api.js` `S` ⭐

**Por quê:** o arquivo porta quase intacto — axios é o mesmo. Duas coisas mudam: o interceptor de requisição vira `async` (M1.3) e `window.location.href` não existe.

**▶ Prompt**

```
Copie frontend/src/services/api.js para mobile/src/services/api.js e ajuste:

1. baseURL: mantenha a mesma URL do Render. Mova para
   EXPO_PUBLIC_API_URL com fallback para o literal atual — assim o
   comportamento padrão não muda, mas dá para apontar para localhost
2. Interceptor de requisição: async, await getAuthToken()
3. Interceptor de resposta (401): NÃO chame router aqui. Exponha
     export function setUnauthorizedHandler(fn)
   e dispare fn() no 401. Quem registra é o AuthContext (M1.6)
4. As 11 funções de endpoint ficam IDÊNTICAS — mesmos nomes, mesmas
   assinaturas, mesmos paths. Inclusive updateHabit e archiveHabit, que
   nenhuma tela chama (README §11.1). Paridade inclui código morto
```

**Aceite:** `login()` contra a API do Render devolve `{ token, user }` e o token aparece no SecureStore.

---

Concluído

### ☐ M1.5 — Navegação com expo-router `M` ⭐

**Por quê:** as quatro telas do fluxo de execução ficam fora do `MainLayout` de propósito — sem barra de navegação, ninguém abandona uma sessão cronometrada por acidente (README §7.1). Essa intenção precisa sobreviver à migração.

**▶ Prompt**

```
Estruture app/ assim:

  app/_layout.jsx          Stack raiz + providers + guarda de autenticação
  app/login.jsx            única rota pública
  app/(tabs)/_layout.jsx   Tabs com tabBar CUSTOMIZADA (o BottomNav, M2.6)
  app/(tabs)/home.jsx
  app/(tabs)/stats.jsx     rota /stats/:period? vira /stats — o parâmetro
                           nunca foi lido pelo código (README §7.1)
  app/(tabs)/store.jsx
  app/(tabs)/profile.jsx
  app/(tabs)/create.jsx
  app/pretask.jsx          ┐
  app/execute.jsx          │ fora do grupo (tabs) — SEM barra inferior
  app/success.jsx          │
  app/fail.jsx             ┘
  app/+not-found.jsx       redireciona para /home

1. Guarda de autenticação no _layout raiz: enquanto AuthContext.loading,
   renderize LoadingScreen; se não autenticado, redirect para /login.
   Mesmo comportamento do ProtectedRoute atual
2. Índice: / redireciona para /home
3. Animação de transição padrão do native-stack. Não invente transição
```

**Aceite:** navegar entre as 5 abas mantém a barra; entrar em `/execute` faz a barra sumir; deslogar leva para `/login` sem tela quebrada.

---

Concluído

### ☐ M1.6 — Os contexts `M`

**▶ Prompt**

```
Porte os quatro contexts de frontend/src/contexts/, preservando exatamente
o que cada um guarda e expõe (README §7.3):

- AuthContext: mesma lógica de verifyAuth() no mount (se há token, chama
  getDashboard() para validar). Agora com await do storage. Registra o
  setUnauthorizedHandler da M1.4 apontando para router.replace('/login')
- CurrentHabitContext: idêntico. CONTINUA sem persistir — PreTask e
  Execution seguem checando se está nulo e voltando para a Home
- ThemeToggleContext: prefers-color-scheme vira useColorScheme()
- ToastContext: mesma fila, mesma API addToast(message, type, duration).
  A renderização usa o componente da M2.3

E crie um QUINTO, que não existe no web:

- ExecutionResultContext: guarda { type, bonus, feedback } entre Execution
  e Success/Fail. Substitui o location.state do react-router. NÃO passe
  isso por params de rota — o objeto de feedback não é serializável de
  forma limpa e vira string na URL

Ordem de aninhamento no _layout raiz, igual ao main.jsx atual:
  Auth > CurrentHabit > ExecutionResult > ThemeToggle > Toast
```

**Aceite:** sessão salva sobrevive a fechar e reabrir o app; token inválido cai no login; tema alterna claro/escuro.

---

Concluído

# ETAPA M2 — Componentes comuns e de layout

> Sete componentes. Cada um é consumido por várias telas — por isso vêm antes delas.

### ☐ M2.1 — `CircularProgress` `S`

**▶ Prompt**

```
Porte frontend/src/components/common/CircularProgress usando react-native-svg.
O anel usa Circle com strokeDasharray/strokeDashoffset — mesma técnica do web.
Mesmas cores (props.theme), mesmo diâmetro, mesma espessura.
Usado nos hábitos do tipo QUANTIDADE.
```

**Aceite:** com valor 0, 50 e 100 o anel fica visualmente igual ao do app web lado a lado.

---

Concluído

### ☐ M2.2 — `MonospaceTimer` `S`

**▶ Prompt**

```
Display MM:SS + badge de bônus. Em RN não há font-family monospace garantida:
use fontVariant: ['tabular-nums'] na Lexend, ou carregue um peso monospace.
O requisito real é o dígito não "pular" de largura a cada segundo — teste
com 11:11 e 00:00.
```

**Aceite:** o texto não treme durante a contagem regressiva.

---

Concluído

### ☐ M2.3 — `Toast` `S`

**▶ Prompt**

```
Hoje o componente vive dentro do ToastContext e só o styles.js está separado.
Porte mantendo essa organização. A animação de entrada/saída usa
react-native-reanimated. Renderize a pilha em cima de tudo — no _layout raiz,
não dentro das telas.
```

**Aceite:** três toasts em sequência empilham e somem na mesma ordem e duração do web.

---

Concluído

### ☐ M2.4 — `LoadingScreen` `S`

**▶ Prompt**

```
Tela de carregamento com o sol girando. A rotação vem de reanimated
(withRepeat + withTiming), não de @keyframes. Imagem via expo-image,
a partir de assets/sol_flutuando.webp copiado do frontend/.
```

**Aceite:** o sol gira em loop contínuo, sem travar na primeira volta.

---

Concluído

### ☐ M2.5 — `GiveUpModal` `S`

**▶ Prompt**

```
Porte o modal de desistência. Regras que NÃO podem mudar (README §8.3, fluxo 7):
- "Usar Escudo" só aparece se bloqueios_acumulados > 0
- as duas opções emitem FAIL_BLOQUEIO ou FAIL_TIMEOUT
Use o Modal do react-native. Fechar pelo botão físico "voltar" do Android
deve equivaler a cancelar, não a desistir.
```

**Aceite:** com 0 escudos, só aparece a opção de assumir a falha.

---

Concluído

### ☐ M2.6 — `BottomNav` como tabBar customizada `M` ⭐

**Por quê:** a barra tem 4 abas **mais** um botão Play central que não é aba — ele dispara o fluxo de execução. Isso não sai da tabBar padrão.

**▶ Prompt**

```
Implemente tabBar={props => <BottomNav {...props} />} no app/(tabs)/_layout.jsx.

O botão Play central:
- lê currentHabit do CurrentHabitContext
- se nulo, comporta-se como hoje (confira o frontend/ antes de decidir)
- se presente, router.push('/pretask')
- NÃO é uma Screen do Tabs — é um Pressable desenhado por cima

Respeite a safe area inferior (gestos do Android) com useSafeAreaInsets.
Ícones: @expo/vector-icons, escolhendo os equivalentes mais próximos dos
lucide-react usados hoje.
```

**Aceite:** 4 abas navegam e marcam estado ativo; o Play leva ao PreTask do hábito em foco.

---

Concluído

### ☐ M2.7 — `LocalHeader` `S`

**▶ Prompt**

```
Cabeçalho com moedas, ofensiva e escudos do hábito em foco. Lê
CurrentHabitContext. Respeite a safe area superior (notch) — no WebView
isso nunca foi problema, agora é.
```

**Aceite:** trocar de hábito no carrossel atualiza os três números no cabeçalho.

---

Concluído

# ETAPA M3 — As dez telas

> Ordem pensada para destravar teste real o quanto antes: Login libera a API, Home libera o `currentHabit`, e o resto segue o fluxo do usuário. **Consulte `frontend/src/pages/<Tela>/` antes de escrever cada uma.** O original é a especificação, não a memória.

### ☐ M3.1 — `Login` `M`

**▶ Prompt**

```
Porte Login (abas Entrar/Criar Conta + modal de configurações).

1. Substitua services/authService.js por react-hook-form + yup:
   - login:    email válido + senha não vazia
   - cadastro: nome, email, senha não vazios + senha === confirmarSenha
   As MENSAGENS DE ERRO devem ser as mesmas do authService.js atual
2. KeyboardAvoidingView — problema novo, não existia no navegador
3. Mantenha o chip "🇧🇷 PT" como está: decorativo, sem ação
   (README §11.1 — paridade inclui o que não funciona)
4. Ao autenticar, router.replace('/home')
```

**Aceite:** login e cadastro contra o Render funcionam; erros de validação aparecem com o mesmo texto do web.

---

Concluído

### ☐ M3.2 — `Home` `L` ⭐

**Por quê:** é a única tela que **escreve** no `CurrentHabitContext`, e o carrossel horizontal é a peça mais distante do equivalente web.

**▶ Prompt**

```
Porte a Home:

1. Carrossel: FlatList horizontal com pagingEnabled (ou snapToInterval).
   onViewableItemsChanged publica o hábito central em setCurrentHabit —
   é assim que BottomNav, LocalHeader, PreTask, Execution e Stats
   descobrem o hábito em foco
2. Slide vazio no fim → router.push('/create'), como hoje
3. Avatar reativo: a expressão vem de proximo_vencimento. Esse campo chega
   sempre nulo da API (README §11.2), então na prática todos ficam em
   "normal". PORTE O COMPORTAMENTO ASSIM MESMO — não conserte aqui
4. Imagens com expo-image
5. Pull-to-refresh: só se o frontend/ tiver. Se não tem, não invente
```

**Aceite:** deslizar troca o hábito e o cabeçalho acompanha; abrir `/stats` depois mostra o hábito certo.

---

Concluído

### ☐ M3.3 — `PreTask` `S`

**▶ Prompt**

```
GET /habits/{id}/priming, exibe o texto, botões seguir/voltar.
Se currentHabit for nulo, router.replace('/home') — mesma proteção de hoje.
```

**Aceite:** com o context vazio, a tela não renderiza e volta para a Home.

---

Concluído

### ☐ M3.4 — `useTimer` nativo `M` ⭐

**Por quê:** o hook web compensa tempo em segundo plano por `visibilitychange`. Em RN o equivalente é `AppState` — e o modelo pode ficar mais robusto sem mudar nada do que o usuário vê.

**▶ Prompt**

```
Reescreva useTimer(initialSeconds, habitId, executionToken, isTimer)
preservando as 11 propriedades retornadas (README §7.4):
timeLeft, overachieveTime, isOverachieving, elapsed, isRunning, isPaused,
start, pause, resume, stop, clearTimerState.

1. Guarde um DEADLINE ABSOLUTO (Date.now() + segundos) e derive timeLeft
   dele a cada tick. Assim o cronômetro não perde tempo se o intervalo
   atrasar — comportamento visível idêntico, base mais confiável
2. AppState no lugar de visibilitychange:
     background → pause(), grava estado + Date.now() no AsyncStorage
     active     → resume(), desconta o tempo real decorrido
3. Tolerância de 1 hora preservada: sessão parada há mais tempo é
   DESCARTADA, não restaurada
4. Ao chegar a zero: isOverachieving = true e Haptics no lugar de
   navigator.vibrate
5. Storage agora é async — trate a corrida entre montar a tela e
   restaurar o estado
```

**Aceite:** iniciar 60s, mandar o app para segundo plano por 20s, voltar → restam ~40s. Ficar 2h fora → o estado é descartado.

---

Concluído

### ☐ M3.5 — `Execution` `L` ⭐

**▶ Prompt**

```
Porte a tela de execução — cronômetro OU contador, conforme o tipo do hábito.
Confira o fluxo 6 e o fluxo 7 do README §8.3 linha a linha:

1. execution_token = Crypto.randomUUID() do expo-crypto, gerado uma vez
   no mount. É ele que garante a idempotência no backend
2. Botão CONCLUIR só aparece quando isOverachieving
3. isExtra = overachieveTime >= meta_base * 0.2 — MESMA fórmula, mesmo
   lugar (no cliente). Não mova para o servidor: isso é a tarefa E1.6 do
   PLANO_EXECUCAO.md, e não é escopo desta migração
4. Desistir → GiveUpModal → payload com valor_realizado = meta_base - timeLeft
5. Sucesso: clearExecutionState, grava no ExecutionResultContext,
   router.replace('/success')
6. Falha: idem, router.replace('/fail')
7. NÃO porte o PwaPauseModal — é código inalcançável (README §11.1).
   Registre a decisão no PARIDADE.md
8. Use replace, não push: o usuário não pode "voltar" para um cronômetro
   já encerrado
```

**Aceite:** execução completa credita moedas e vai para Success; desistir com escudo preserva `dias_seguidos`; enviar o mesmo token duas vezes não credita duas vezes.

---

Concluído

### ☐ M3.6 — `Success` `M`

**▶ Prompt**

```
Lê o ExecutionResultContext (era location.state).
As 50 partículas animadas: reanimated, geradas com useMemo como hoje.
Se 50 partículas derrubarem o FPS no aparelho real, reduza o número —
mas só depois de medir, e anote a mudança no PARIDADE.md.
Botão VOLTAR → router.replace('/home').
```

**Aceite:** a tela mostra moedas ganhas, ofensiva e o texto de feedback vindos da API.

---

Concluído

### ☐ M3.7 — `Fail` `M`

**▶ Prompt**

```
Única tela em SCSS no frontend/ — converta para styled-components/native
como todas as outras.

Três apresentações, por tipo (README fluxo 9):
  FAIL_BLOQUEIO → "Protegido!"       fundo âmbar,    ícone de escudo
  FAIL_TIMEOUT  → "Tempo Esgotado"   fundo vermelho, ícone de relógio
  BLOCK_ACTIVE  → confira o frontend/ antes de portar

Ícones do @expo/vector-icons, equivalentes aos lucide atuais.
```

**Aceite:** os três tipos renderizam com as cores e títulos corretos.

---

Concluído

### ☐ M3.8 — `Stats` `M`

**▶ Prompt**

```
GET /stats/weekly. Hoje o backend devolve [] e o gráfico fica vazio
(README §11.1) — PRESERVE ISSO. Não implemente o endpoint, não invente
dado de exemplo.

Substitua o recharts por barras desenhadas com react-native-svg:
Rect por dia da semana, altura proporcional. Poucas dezenas de linhas.

Mantenha o estado vazio de quando currentHabit é nulo ("volte à tela
inicial") — é comportamento existente, não bug.
```

**Aceite:** a tela abre sem erro e mostra o mesmo vazio do app web.

---

Concluído

### ☐ M3.9 — `Store` `M`

**▶ Prompt**

```
getDashboard() + buyShield(id). Compra por 1500 moedas, inventário de
escudos, toasts de sucesso e erro.

O texto da loja promete consumo automático do escudo, que ainda não existe
(tarefa E4.3 do PLANO_EXECUCAO.md, não executada). Copie o texto COMO ESTÁ.
Corrigir é escopo de outra branch.
```

**Aceite:** comprar com saldo suficiente incrementa o inventário; sem saldo, o mesmo erro do web.

---

Concluído

### ☐ M3.10 — `Profile` `M`

**▶ Prompt**

```
PUT /profile: nome, fuso horário, troca de senha. Formulário com
react-hook-form + yup, mesmas regras do web.
Alternância de tema, chip de idioma decorativo, botão de logout.
Logout limpa storage e cai em /login pela guarda do _layout.
```

**Aceite:** trocar o nome persiste e reaparece após reabrir o app.

---

Concluído

### ☐ M3.11 — `CreateHabit` `L`

**▶ Prompt**

```
Assistente de 3 passos. react-hook-form com validação por passo (yup),
sem avançar com passo inválido.

PRESERVE as limitações (README §11.1):
- passo 2, "Medir Dificuldade": só emite o toast "Em breve!"
- botões de dias da semana: existem na interface e a seleção é
  DESCARTADA no envio — não há coluna no banco nem campo no DTO
- POST /habits envia os mesmos 9 campos do HabitoRequestDTO atual,
  inclusive o campo `modalidade`

Ao criar, router.replace('/home').
```

**Aceite:** criar hábito pelos 3 passos faz ele aparecer no carrossel da Home.

---

Concluído

# ETAPA M4 — Comportamento Android

> Coisas que o WebView resolvia sozinho (ou escondia) e agora são responsabilidade do app.

### ☐ M4.1 — Botão físico de voltar `S` ⭐

**Por quê:** no Capacitor, o "voltar" do Android era o histórico do navegador. Em RN é o stack — e sem tratamento, dá para sair de uma sessão cronometrada com um toque, quebrando a intenção de projeto que motivou tirar as telas de execução do `MainLayout`.

**▶ Prompt**

```
1. /execute: o botão voltar do Android NÃO sai da tela. Abre o
   GiveUpModal, mesmo caminho do botão "Desistir"
2. /success e /fail: voltar equivale a "VOLTAR/CONTINUAR" → /home
3. /home: voltar na raiz das abas fecha o app (padrão Android). Não
   sobrescreva
4. /login: voltar não retorna para telas autenticadas
```

**Aceite:** com cronômetro rodando, o botão voltar abre o modal de desistência e não navega.

---

Concluído

### ☐ M4.2 — Safe area e barra de status `S`

**▶ Prompt**

```
1. SafeAreaProvider no _layout raiz
2. Todas as telas respeitam inset superior (notch) e inferior (gestos)
3. expo-status-bar segue o tema: conteúdo escuro no tema claro e vice-versa
4. app.json: orientação travada em portrait — o layout foi desenhado para
   480px de largura e nunca precisou de paisagem
```

**Aceite:** em aparelho com notch, nenhum texto fica sob a câmera; a barra inferior não fica sob a barra de gestos.

---

Concluído

### ☐ M4.3 — Rede e erros `S`

**▶ Prompt**

```
1. Confirme que o app usa HTTPS (Render). Nada de cleartext no manifesto
2. Timeout do axios: mesmo valor do frontend/. Se lá não há timeout
   explícito, defina 15s aqui — sem rede, o WebView mostrava erro do
   navegador; o app nativo apenas congelaria
3. Falha de rede reaproveita o ToastContext com a mesma mensagem do web
```

**Aceite:** em modo avião, tentar login mostra toast de erro em vez de travar.

---

Concluído

# ETAPA M5 — Build, APK e paridade

### ☐ M5.1 — Identidade do app `S`

**▶ Prompt**

```
app.json:
  name          "Tempo Claro"
  slug          tempo-claro
  android.package  com.rodrigo.tempoclaro   (o MESMO do Capacitor)
  versionCode   2                            (o Capacitor usou 1)
  orientation   portrait
  icon / adaptiveIcon: reaproveite os assets de frontend/android/

Nota: mesmo package = o APK Expo SUBSTITUI o do Capacitor ao instalar.
Se quiser os dois lado a lado no aparelho para comparar telas, use
com.rodrigo.tempoclaro.expo — e lembre de reverter antes do APK final.
```

**Aceite:** `npx expo prebuild --platform android` gera o projeto nativo sem erro.

---

Concluído

### ☐ M5.2 — Build do APK `S`

**▶ Prompt**

```
Opção principal — EAS:
1. npx eas-cli@latest build:configure
2. eas.json, perfil "preview": android.buildType = "apk"
   (o padrão é AAB, que não instala direto no aparelho)
3. eas build -p android --profile preview

Alternativa local, se preferir não depender da nuvem:
   npx expo prebuild -p android
   cd android && ./gradlew assembleRelease

Documente o caminho escolhido em mobile/README.md — a banca pode perguntar
como o APK foi gerado.
```

**Aceite:** um `.apk` instala em aparelho físico e abre na tela de login.

---

Concluído

### ☐ M5.3 — Teste dos 14 fluxos `M` ⭐

**▶ Prompt**

```
Com o APK no aparelho físico, execute os 14 fluxos do PARIDADE.md contra
a API de produção. Para cada um: marque OK ou anote a divergência com
tela, passo e o que era esperado.

Cuidados que só aparecem no aparelho:
- fluxo 6: mandar para segundo plano no meio do cronômetro
- fluxo 6: bloquear a tela e voltar
- fluxo 7: desistir com e sem escudo
- fluxo 14: virada do dia (o job roda de hora em hora no backend)
- reabrir o app depois de dias — sessão e ofensiva
```

**Aceite:** `PARIDADE.md` com as 14 linhas resolvidas; divergências abertas listadas com responsável.

---

### ☐ M5.4 — Comparação lado a lado `S`

**▶ Prompt**

```
Instale o APK do Capacitor num aparelho (ou abra a versão Vercel no
navegador do celular) e o APK Expo em outro. Percorra as 10 telas com a
MESMA conta e capture as duas versões de cada uma.

Salve em mobile/docs/paridade/{tela}-web.png e {tela}-expo.png.

Esse par de imagens é material direto para a monografia: é a evidência
de que a migração preservou o produto.
```

**Aceite:** 20 capturas; diferenças visuais listadas e classificadas em "aceitável" ou "corrigir".

---

# ETAPA M6 — Documentação e TCC

### ☐ M6.1 — README do app `M`

**▶ Prompt**

```
Crie mobile/README.md no padrão do README.md da raiz:
- Mapa de diretórios de mobile/
- Matriz de substituição (o que virou o quê)
- Como rodar em desenvolvimento e como gerar o APK
- Limitações preservadas de propósito (aponte para PARIDADE.md tabela C)

E ATUALIZE o README.md da raiz:
- §2: registre as DUAS camadas de apresentação (web em frontend/,
  Android nativo em mobile/) com o status de cada
- §11.5 "Sobre a arquitetura mobile": hoje esse texto diz que migrar para
  React Native resolveria o timer em segundo plano e as notificações, ao
  custo de reescrever a apresentação. Reescreva contando que a migração
  foi feita, o que de fato melhorou e o que continua pendente
```

**Aceite:** um leitor que não acompanhou entende, pelo README, por que existem duas pastas de frontend.

---

### ☐ M6.2 — Ajuste na monografia `M` ⭐

**Por quê:** o texto descreve Vite, Capacitor e WebView. Isso deixa de ser verdade — e §11.5 já era um argumento pronto a favor da mudança.

**▶ Prompt (para uma sessão de escrita, não para o Claude Code)**

```
Capítulos a revisar:
1. Tecnologias: React Native + Expo no lugar de Vite + Capacitor.
   ATENÇÃO: o texto atual diz TailwindCSS e o código sempre usou
   styled-components — essa contradição já estava lá (item da Seção 3 do
   CLAUDE.md) e é hora de resolver, não de propagar
2. Arquitetura: o diagrama de camadas ganha o app nativo; o backend NÃO
   muda em nada, e isso é um argumento a favor da escolha de REST puro —
   trocamos o cliente inteiro sem tocar no servidor
3. Distribuição: EAS Build no lugar de npx cap sync + Gradle
4. Justificativa da migração: use o próprio §11.5 do README. O WebView
   sem plugins não sustenta cronômetro em segundo plano nem notificação
   local, num app cuja tese é cumprimento de hábito no prazo. É uma
   limitação identificada, documentada e então corrigida — isso é uma
   narrativa boa de defesa, não uma troca de última hora
5. Trabalhos futuros: notificações locais (expo-notifications) agora são
   viáveis, e a barreira técnica que as impedia deixou de existir
```

**Aceite:** nenhuma menção a Capacitor ou PWA sobrando como se fosse o estado atual do sistema.

---

### ☐ M6.3 — Destino do `frontend/` `S`

**▶ Prompt (decisão sua, não do Claude Code)**

```
Depois do merge, o frontend/ web tem três destinos possíveis:

a) MANTER e continuar publicando na Vercel — o TCC entrega web + Android.
   Custo: toda correção futura vira dois trabalhos
b) CONGELAR: mantém no repositório com aviso no README de que a versão
   de referência é mobile/. Zero custo de manutenção
c) REMOVER na branch, preservado pelo histórico do git

Recomendação: (b). O código continua disponível para consulta da banca,
as capturas da M5.4 continuam fazendo sentido, e você não assume
manutenção dupla no mês da defesa.
```

**Aceite:** decisão registrada no README da raiz.

---

## O que não fica idêntico — e por quê

Paridade de comportamento não é paridade de implementação. Estas sete diferenças são inevitáveis; todas devem estar anotadas no `PARIDADE.md` para você não ser pego de surpresa na banca.

| Diferença                        | Por quê                                                                                                                       |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Não há mais "atualizar a página" | Refresh do navegador zerava o `CurrentHabitContext`. No app nativo isso só acontece ao fechar de vez                          |
| Cifra do token                   | AES do `crypto-js` (chave versionada no bundle) → Keystore do Android. **Melhoria de segurança sem pedir permissão**          |
| Fonte do cronômetro              | O `monospace` do WebView era a do sistema. Em RN, `tabular-nums` na Lexend — o dígito pode ter desenho ligeiramente diferente |
| Rolagem                          | A física de scroll do Android nativo não é a do Chrome                                                                        |
| Animações                        | Reanimated roda na UI thread. Tende a ficar **mais fluido** que o CSS no WebView, não igual                                   |
| Safe area                        | O WebView desenhava sob o notch. Agora há inset — o layout ganha alguns pixels de margem                                      |
| `PwaPauseModal`                  | Código inalcançável no web (§11.1). Não é portado                                                                             |

---

## Efeito no `PLANO_EXECUCAO.md`

Você parou em **E4.4.1** (regra de nível e variação, backend). Como fica o resto:

| Tarefas                                              | Situação depois da migração                                                                                                                                                                                                                      |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **E0.5.x, E1.x, E2.x backend, E7.x, E9.x**           | **Válidas sem alteração.** São backend, banco e documentação — a migração não as toca                                                                                                                                                            |
| **E4.4.1** (já feita)                                | Continua valendo. `nivel_avatar` chega no DTO igual                                                                                                                                                                                              |
| **E4.4.2** (resolvedor de arte)                      | **Precisa ser reescrita.** O prompt manda usar `import.meta.glob`, que é do Vite. Em RN o manifesto vira um mapa estático de `require()` — a cadeia de fallback e a assinatura `resolverAvatar(categoria, nivel, expressao)` continuam idênticas |
| **E4.4.3** (ligar às telas)                          | Válida, aplicada às telas do `mobile/`                                                                                                                                                                                                           |
| **E4.4.4** (produção da arte)                        | Intocada — é trabalho seu, de imagem, independente de plataforma                                                                                                                                                                                 |
| **E3.x** (estados vazios, tema escuro, código morto) | Refaça no `mobile/`. Boa notícia: M3 já porta os estados vazios existentes, e o tema escuro nasce ligado ao `useColorScheme`                                                                                                                     |
| **E6.1** (acessibilidade, RNF17)                     | **Melhora de escopo.** As props de acessibilidade do RN são mais diretas que ARIA, e o TalkBack testa melhor que leitor de tela em WebView                                                                                                       |
| **E6.2** (remover promessas não cumpridas)           | Aplicar no `mobile/` depois da paridade — durante a migração, as promessas são copiadas de propósito                                                                                                                                             |
| **E8.2 e E8.4** (roteiro no APK, APK assinado)       | Substituídas por M5.2 e M5.3                                                                                                                                                                                                                     |

**Ordem sugerida:** termine a migração inteira (M0→M6) **antes** de retomar qualquer tarefa de frontend do plano antigo. Corrigir nas duas bases ao mesmo tempo é o jeito mais rápido de dessincronizar de novo — exatamente o problema que o `CLAUDE.md` foi escrito para resolver.

---

## Painel de acompanhamento

| Etapa | Tarefas | ☐ Feitas | Esforço | Marco                                   |
| ----- | ------- | -------- | ------- | --------------------------------------- |
| M0    | 4       |          | S       | App Expo sobe no Expo Go                |
| M1    | 6       |          | L       | Login funciona contra o Render          |
| M2    | 7       |          | L       | Navegação com barra inferior de verdade |
| M3    | 11      |          | XL      | As dez telas navegáveis                 |
| M4    | 3       |          | M       | Comporta-se como app Android            |
| M5    | 4       |          | M       | APK instalado e 14 fluxos verificados   |
| M6    | 3       |          | M       | Documentação e monografia alinhadas     |

**Ponto de não-retorno: fim de M3.** Até ali, abandonar a migração custa o trabalho já feito e nada mais — o `frontend/` continua intacto na `main`. Depois de M5, voltar atrás significa jogar fora a validação de paridade.

**Marco de decisão sugerido: 15 de outubro.** Se M3 não tiver fechado até lá, defenda com o APK do Capacitor e apresente a migração como trabalho em andamento no capítulo de trabalhos futuros. Isso é uma saída honesta e documentada, não um fracasso.
