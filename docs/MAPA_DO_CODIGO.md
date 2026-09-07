# Mapa do Código — Tempo Claro

Inventário do repositório levantado por leitura direta dos arquivos. **Nenhum arquivo de código foi alterado.**

Data do levantamento: 2026-08-31 · Branch: `etapa-1-correcoes-criticas` · HEAD: `c785e95e`

> **Nota sobre a base:** o HEAD do git (`c785e95e`, "Corrigir o falso sucesso na troca de senha e Devolver o fuso horário ao cliente") corresponde ao fim da E1.5. Tudo de E1.6 em diante (até a E4.2, ponto atual) existe como alteração **não commitada** na árvore de trabalho — este mapa documenta a árvore de trabalho como ela está agora, não o HEAD. Nada foi commitado desde a E1.5 porque commit/push só acontece quando pedido explicitamente.

Resumo: **10 telas**, **12 endpoints** (+ 1 job agendado), **9 tabelas + 1 view**, **14 arquivos de DTO** (17 contando os 3 records aninhados).

> **Este documento substitui a versão de 2026-08-27** (levantada antes da migração para o schema v2.1 e antes de praticamente todo o trabalho de execução do plano — Etapas 0.5 a 4.2). Essa versão descrevia 5 tabelas sem prefixo, 11 endpoints, `sub_atividades` como tabela inexistente, `GET /api/stats/weekly` como stub, e ainda listava `PwaPauseModal` como componente ativo (removido na E3.3). Nenhum dado dessa versão antiga foi reaproveitado sem reconferência.

---

## 1. Árvore de pastas (2 níveis)

### Frontend (`frontend/`)

```
frontend/
├── android/                      projeto Android gerado pelo Capacitor
│   ├── app/
│   ├── capacitor-cordova-android-plugins/
│   ├── gradle/
│   └── build.gradle, settings.gradle, variables.gradle, gradlew
├── assets/                       icon.png (fonte para @capacitor/assets)
├── icons/                        icon-48/72/96/128/192/256/512.webp (PWA)
├── public/                       favicon.png, favicon.svg, icons.svg,
│                                 manifest.webmanifest, vite.svg
├── src/
│   ├── assets/                   gotinha/ (mascote), sol_flutuando, lua_flutuando
│   ├── components/               common/ (5 componentes) e layout/ (2 componentes)
│   ├── contexts/                 Auth, CurrentHabit, ThemeToggle, Toast
│   ├── hooks/                    useTimer.js
│   ├── layouts/                  MainLayout/
│   ├── pages/                    10 telas (uma pasta por tela)
│   ├── routes/                   index.jsx (definição das rotas)
│   ├── services/                 api.js, authService.js
│   ├── styles/                   GlobalStyles.js, theme.js
│   ├── utils/                    storage.js
│   ├── App.jsx
│   └── main.jsx
├── capacitor.config.json
├── eslint.config.js
├── index.html
├── jsconfig.json
├── package.json
└── vite.config.js
```

Stack confirmada em `frontend/package.json`: React 19.2.4, Vite 8.0.1, `react-router-dom` 7.13.1,
**styled-components 6.4.2** (não TailwindCSS — divergência já registrada, ver CLAUDE.md), `axios` 1.17.0,
`recharts` 3.8.1, `lucide-react`, `react-icons`, `crypto-js`, `sass-embedded`,
`@capacitor/core` + `@capacitor/android` 8.4.0.

`capacitor.config.json`: `appId` = `com.rodrigo.tempoclaro`, `appName` = `Tempo Claro`, `webDir` = `dist`.

`pages/Login/` tem um terceiro arquivo além de `index.jsx`/`styles.js`: `useLogin.js` (hook local da tela,
não em `hooks/` — só `useTimer.js` está lá).

### Backend (`backend/`)

```
backend/
├── src/main/
│   ├── java/com/rodrigo/backend2java/
│   │   ├── config/               JwtFilter, JwtService, RequestLoggingFilter, SecurityConfig
│   │   ├── controller/           AuthController, HabitoController,
│   │   │                         ProfileController, StatsController
│   │   ├── exception/            GlobalExceptionHandler
│   │   ├── model/                Habito, HistoricoExecucao, StatusHabito, Usuario,
│   │   │                         BibliotecaTexto, Calibracao, CalibracaoResposta,
│   │   │                         DispositivoPush, SubAtividade, dto/{request,response}
│   │   ├── repository/           BibliotecaTexto, Calibracao, CalibracaoResposta,
│   │   │                         DispositivoPush, Habito, HabitoHoje, HistoricoExecucao,
│   │   │                         StatusHabito, SubAtividade, Usuario  (todos JdbcTemplate puro)
│   │   ├── service/              AuthService, FechamentoDiarioJob, GamificacaoService,
│   │   │                         HabitoService, ProximoVencimentoService, StatsService,
│   │   │                         UsuarioService
│   │   ├── util/                 ZonaUsuario
│   │   └── BackEndIiApplication.java
│   └── resources/                application.properties, application-docker.properties,
│                                 application-prod.properties, schema.sql, data.sql,
│                                 Postman/Tempo Claro.json
├── bin/                          saída de build do Eclipse/VSCode (main/, test/)
├── src/test/                     1 classe: HabitoServiceSubAtividadeTest (7 testes JUnit)
├── gradle/wrapper/
├── build.gradle, settings.gradle, gradlew, gradlew.bat
├── compose.yaml
└── Dockerfile
```

Observações estruturais (mudanças em relação ao levantamento de 27/08):

- **`backend/src/test/` agora existe** — 1 classe (`HabitoServiceSubAtividadeTest`, 7 testes),
  criada na E2.6. Segue sem Jest/Vitest no `frontend/package.json` — zero teste automatizado no frontend.
- **5 repositories novos** desde 27/08: `SubAtividadeRepository`, `HabitoHojeRepository`
  (lê `vw_habito_hoje` e monta `HabitoResponseDTO` direto, sem model intermediário — desvio deliberado
  do padrão "repository devolve model" do resto do projeto), `CalibracaoRepository`,
  `CalibracaoRespostaRepository`, `DispositivoPushRepository`. Os dois últimos existem mas não têm
  nenhum service que os use ainda — tabelas reservadas para trabalho futuro (D3/D4).
- **2 services novos**: `ProximoVencimentoService` (calcula `sta_proximo_vencimento`, E2.1/E2.4/E2.8),
  `StatsService` (E2.2).
- **1 pacote novo**: `util/` com `ZonaUsuario` (resolução de fuso horário — único ponto autorizado
  a chamar `ZoneId.of`, E0.5.4).
- A persistência continua **JdbcTemplate + SQL escrito à mão**, não JPA/Hibernate. Cada
  repository declara as queries como constantes `String` e um `RowMapper` manual.

---

## 2. Telas → componente → rota

Fonte: [routes/index.jsx](frontend/src/routes/index.jsx)

| # | Tela | Arquivo do componente | Rota | Proteção / layout |
|---|------|----------------------|------|-------------------|
| 1 | Login / Cadastro | [pages/Login/index.jsx](frontend/src/pages/Login/index.jsx) | `/login` | Pública |
| 2 | Home (dashboard) | [pages/Home/index.jsx](frontend/src/pages/Home/index.jsx) | `/home` | Protegida · MainLayout |
| 3 | Perfil | [pages/Profile/index.jsx](frontend/src/pages/Profile/index.jsx) | `/profile` | Protegida · MainLayout |
| 4 | Criar/Editar Hábito | [pages/CreateHabit/index.jsx](frontend/src/pages/CreateHabit/index.jsx) | `/create` | Protegida · MainLayout |
| 5 | Estatísticas | [pages/Stats/index.jsx](frontend/src/pages/Stats/index.jsx) | `/stats` | Protegida · MainLayout |
| 6 | Loja | [pages/Store/index.jsx](frontend/src/pages/Store/index.jsx) | `/store` | Protegida · MainLayout |
| 7 | Pré-Tarefa (priming) | [pages/PreTask/index.jsx](frontend/src/pages/PreTask/index.jsx) | `/pretask` | Protegida · fullscreen |
| 8 | Execução (timer) | [pages/Execution/index.jsx](frontend/src/pages/Execution/index.jsx) | `/execute` | Protegida · fullscreen |
| 9 | Sucesso | [pages/Success/index.jsx](frontend/src/pages/Success/index.jsx) | `/success` | Protegida · fullscreen |
| 10 | Falha | [pages/Fail/index.jsx](frontend/src/pages/Fail/index.jsx) | `/fail` | Protegida · fullscreen |

Redirecionamentos: `/` → `/home`; `*` (qualquer rota desconhecida) → `/`.
`ProtectedRoute` mostra `LoadingScreen` enquanto `loading` for verdadeiro e redireciona
para `/login` se `isAuthenticated` for falso.

As rotas 2–6 renderizam dentro de `MainLayout` (com `BottomNav`); as rotas 7–10 são
fullscreen, sem barra de navegação.

**Mudanças desde 27/08:**
- Tela 4 passou a ter dois modos: criar (do zero) e editar (pré-preenchida via
  `location.state.editHabit`, pulando direto para o Passo 3 do assistente — E4.2/RF23).
  Mesma rota `/create` para os dois modos, sem rota nova.
- Tela 5 perdeu o parâmetro `:period?` da rota (`/stats/:period?` → `/stats`, E3.3):
  `Stats.jsx` nunca lia esse parâmetro, e nenhuma navegação no app o preenchia.

### Qual tela chama qual função de `services/api.js`

| Tela | Chamadas |
|------|----------|
| Login | `login()` / `register()` via `AuthContext` + `useLogin.js` (valida com `authService.js` antes) |
| Home | `getDashboard()`, `archiveHabit(id)` (menu "Arquivar", E4.2) |
| CreateHabit | `createHabit()` (modo criar) ou `updateHabit(id, data)` (modo editar, E4.2) |
| PreTask | `getPreTaskPriming(id)` |
| Execution | `submitExecution(id, payload)` (2 pontos de chamada: sucesso e desistência) |
| Profile | `getMe()` (carrega ao montar) + `updateProfile()` (salvar) |
| Stats | `getWeeklyStats(habitoId)` |
| Store | `getDashboard()` + `buyShield(id)` |
| Success / Fail | nenhuma (telas de resultado, consomem estado de navegação) |

**Correção em relação a 27/08:** o levantamento antigo listava `updateHabit`/`archiveHabit`
como funções exportadas em `api.js` sem nenhum chamador no frontend. Isso não é mais verdade —
a E4.2 (RF23) ligou as duas ao menu de contexto do cartão da Home e à tela de edição.

### Componentes de apoio

| Componente | Arquivo |
|-----------|---------|
| CircularProgress | [components/common/CircularProgress/index.jsx](frontend/src/components/common/CircularProgress/index.jsx) |
| GiveUpModal | [components/common/GiveUpModal/index.jsx](frontend/src/components/common/GiveUpModal/index.jsx) |
| LoadingScreen | [components/common/LoadingScreen/index.jsx](frontend/src/components/common/LoadingScreen/index.jsx) |
| MonospaceTimer | [components/common/MonospaceTimer/index.jsx](frontend/src/components/common/MonospaceTimer/index.jsx) |
| Toast | **só `styles.js`** — não há `index.jsx`; o `ToastContext` importa `ToastContainer` e `ToastMessage` direto de `components/common/Toast/styles` |
| BottomNav | [components/layout/BottomNav/index.jsx](frontend/src/components/layout/BottomNav/index.jsx) |
| LocalHeader | [components/layout/LocalHeader/index.jsx](frontend/src/components/layout/LocalHeader/index.jsx) |
| MainLayout | [layouts/MainLayout/index.jsx](frontend/src/layouts/MainLayout/index.jsx) |

**`PwaPauseModal` não existe mais** (removido por inteiro na E3.3 — `useTimer.js` já pausava/retomava
sozinho ao perder/ganhar foco, o modal nunca era de fato acionado).

Contextos: `AuthContext`, `CurrentHabitContext`, `ThemeToggleContext`, `ToastContext`.
`ThemeToggleContext` mudou de interface desde 27/08: era `{isDark, toggleTheme}` (binário), agora é
`{isDark, tema, setTema}` — 3 estados (`claro`/`escuro`/`sistema`), persistidos em `localStorage` e em
`usu_tema` (E3.4).

Hook: `useTimer.js`. Utilitário: `utils/storage.js` (token de autenticação).

---

## 3. Endpoints → controller → service → repository

`baseURL` do cliente: `https://tempo-claro-tcc-tsi.onrender.com/api` ([services/api.js](frontend/src/services/api.js)).
Todos os controllers vivem sob o prefixo `/api`.

Segurança ([SecurityConfig.java](backend/src/main/java/com/rodrigo/backend2java/config/SecurityConfig.java)):
`/api/auth/**` e `/h2-console/**` são `permitAll`; **todo o resto exige autenticação**.
Sessão `STATELESS`, CSRF desabilitado, CORS configurado por bean.

| # | Método | Rota | Controller | Service | Repository |
|---|--------|------|-----------|---------|-----------|
| 1 | POST | `/api/auth/login` | `AuthController.login` | `AuthService.autenticar` | `UsuarioRepository.findByEmail` |
| 2 | POST | `/api/auth/register` | `AuthController.register` | `AuthService.cadastrar` | `UsuarioRepository.existsByEmail` + `.save` |
| 3 | GET | `/api/dashboard` | `HabitoController.getDashboard` | `HabitoService.listarDashboard` → `buscarDetalhadoPorId` | `HabitoRepository.findAllByUsuarioId`, `HabitoHojeRepository.findByHabitoId`, `SubAtividadeRepository.findAllByHabitoId`, `UsuarioRepository` |
| 4 | POST | `/api/habits` | `HabitoController.createHabit` | `HabitoService.criarHabito` | `UsuarioRepository`, `HabitoRepository.save`, `SubAtividadeRepository.save`, `StatusHabitoRepository.save` |
| 5 | PUT | `/api/habits/{id}` | `HabitoController.updateHabit` | `HabitoService.atualizarHabito` | `HabitoRepository.findById` + `.update`, `SubAtividadeRepository` (apaga e recria) |
| 6 | DELETE | `/api/habits/{id}` | `HabitoController.deleteHabit` | `HabitoService.deletarHabito` | `HabitoRepository.archive` (soft delete: `UPDATE hab_ativo = false`, nunca `DELETE`) |
| 7 | GET | `/api/habits/{id}/priming` | `HabitoController.getPriming` | `GamificacaoService.obterPriming` | `HabitoRepository.findById`, `BibliotecaTextoRepository.findByCategoriaAndIdioma` |
| 8 | POST | `/api/habits/{id}/executions` | `HabitoController.executeHabit` | `GamificacaoService.processarExecucao` | `HabitoRepository`, `StatusHabitoRepository`, `HistoricoExecucaoRepository`, `SubAtividadeRepository` |
| 9 | POST | `/api/habits/{id}/shield` | `HabitoController.buyShield` | `GamificacaoService.comprarEscudo` | `StatusHabitoRepository` |
| 10 | GET | `/api/me` | `ProfileController.getMe` | `UsuarioService.buscarPerfil` | `UsuarioRepository.findByEmail` |
| 11 | PUT | `/api/profile` | `ProfileController.updateProfile` | `UsuarioService.atualizarPerfil` | `UsuarioRepository.findByEmail` + `.update` |
| 12 | GET | `/api/stats/weekly` | `StatsController.getWeeklyStats` | `StatsService.obterEstatisticasSemanais` | `HabitoRepository`, `UsuarioRepository`, `SubAtividadeRepository`, `HistoricoExecucaoRepository` |

**Mudanças desde 27/08:** endpoint 10 (`GET /api/me`) é novo (E1.5 — antes o Perfil só tinha o que
vinha em cache do login). Endpoint 12 deixou de ser stub (E2.2): antes `StatsController` retornava
`new ArrayList<>()` direto, sem service nem repository.

Notas:

- Os endpoints 3, 4, 8, 9, 11 extraem o e-mail/hábito do `SecurityContextHolder` ou do `@PathVariable`,
  nunca de um campo solto no corpo.
- Retornos ad-hoc: 5, 6 e 11 retornam `Map.of("success", true)`; 9 retorna um `Map<String, Object>`
  próprio. `MessageResponseDTO` existe mas nenhum controller o usa diretamente (é usado por
  `GlobalExceptionHandler` nas respostas de erro).
- `HabitoService.buscarDetalhadoPorId` é público mas **não é exposto por nenhum endpoint** —
  usado internamente por `criarHabito`, `listarDashboard` e `atualizarHabito`.
- `HabitoService.gerarSubAtividades` é pacote-privado, reaproveitado por `FechamentoDiarioJob`
  (progressão de meta) sem duplicar a regra de repartição.

### Componente agendado (fora do fluxo HTTP)

| Componente | Gatilho | Repositories |
|-----------|---------|-------------|
| `FechamentoDiarioJob.resetarContadoresDiarios` | `@Scheduled(fixedRate = 3_600_000L, initialDelay = 60_000L)` — de hora em hora, 1 min após o boot | `HabitoRepository.findAllAtivos`, `UsuarioRepository`, `StatusHabitoRepository.resetarDiario`, `SubAtividadeRepository` (progressão de meta), `HabitoService` (reaproveita `gerarSubAtividades`) |

Zera `sta_execucoes_hoje` e `sta_bloqueio_usado_hoje` de cada hábito ativo respeitando o fuso do
usuário (`ZonaUsuario.resolver`), grava `sta_ultimo_reset` para tornar o reset idempotente, recalcula
`sta_proximo_vencimento` (E2.1) e aplica a progressão automática de meta quando `hab_dias_incremento`
dias de ofensiva se completam (E2.3). **Ainda não consome escudo automaticamente nem preserva
`sta_dias_seguidos` de um dia sem execução** — mecânica prevista na E4.3, não implementada até este
levantamento.

### Filtros e tratamento de erro

| Classe | Papel |
|--------|-------|
| `config/JwtFilter` | valida o Bearer token e popula o `SecurityContext` |
| `config/JwtService` | emite e valida o JWT |
| `config/RequestLoggingFilter` | log de requisições |
| `exception/GlobalExceptionHandler` | `@RestControllerAdvice` — traduz `RuntimeException`, `MethodArgumentNotValidException`, `DataIntegrityViolationException` (violação de CHECK do banco) e `HttpMessageNotReadableException` (campo desconhecido no JSON, Jackson com `FAIL_ON_UNKNOWN_PROPERTIES`, E2.9) em respostas 400/401/500 legíveis |

No cliente, `api.js` tem dois interceptores: um injeta `Authorization: Bearer <token>`
em toda requisição; o outro captura `401` e, se a URL não for de `/auth/login` ou
`/auth/register`, limpa o token e redireciona para `/login`.

---

## 4. DTOs e seus campos

Todos são `record` Java com `@Builder` (Lombok). Os nomes de campo usam `snake_case`,
espelhando o JSON trafegado.

### Request — `model/dto/request/` (5 arquivos, 1 record aninhado)

| DTO | Campo | Tipo | Validação |
|-----|-------|------|-----------|
| **LoginRequestDTO** | `email` | `String` | `@NotBlank`, `@Email` |
| | `password` | `String` | `@NotBlank` |
| **RegisterRequestDTO** | `nome` | `String` | `@NotBlank` |
| | `email` | `String` | `@NotBlank`, `@Email` |
| | `password` | `String` | `@NotBlank` |
| **HabitoRequestDTO** | `titulo` | `String` | `@NotBlank`, `@Size(max=60)` |
| | `categoria` | `String` | — (aceita qualquer string; o CHECK `ck_hab_categoria` do banco é quem restringe a AGUA/ESTUDO/EXERCICIO) |
| | `meta_base` | `Integer` | `@NotNull`, `@Min(1)` |
| | `tipo_medida` | `String` | `@NotBlank` |
| | `modalidade` | `String` | `@NotBlank` — **propósito ainda não confirmado** (E0.5.0 pendente, ver CLAUDE.md) |
| | `meta_frequencia_diaria` | `Integer` | `@Min(1)`, `@Max(12)` |
| | `gatilho_ancora` | `String` | `@Size(max=120)` |
| | `horario_agendado` | `LocalTime` | — |
| | `meta_maxima` | `Integer` | — (`null` = sem teto; `ck_hab_teto` do banco valida `>= meta_base` quando não nulo) |
| | `incremento` | `Integer` | `@Min(0)` |
| | `dias_incremento` | `Integer` | `@Min(1)` |
| | `frequencia_semanal` | `String` | `@Pattern(^[01]{7}$)` (não-todo-zero fica a cargo do CHECK do banco) |
| | `ocorrencias` | `List<OcorrenciaRequestDTO>` | usado quando `meta_frequencia_diaria > 1` |
| **HabitoRequestDTO.OcorrenciaRequestDTO** | `horario_inicio`, `horario_fim` | `LocalTime` | — |
| **ExecutionRequestDTO** | `execution_token` | `UUID` | `@NotNull` |
| | `tipo` | `String` | — (opcional: ausente/em branco = pedido de conclusão honesto; servidor ignora um `COMPLETE_EXTRA` forçado e recalcula sozinho — E1.6) |
| | `valor_realizado` | `Integer` | `@NotNull`, `@Min(0)` |
| **ProfileUpdateDTO** | `nome` | `String` | — |
| | `fuso_horario` | `String` | — (validado com `ZoneId.of()` no service, não aqui) |
| | `tema` | `String` | — (`'claro'/'escuro'/'sistema'`, validado no service) |
| | `senha_atual` | `String` | — |
| | `nova_senha` | `String` | — |

### Response — `model/dto/response/` (9 arquivos, 2 records aninhados)

| DTO | Campo | Tipo |
|-----|-------|------|
| **AuthResponseDTO** | `token` | `String` |
| | `user` | `AuthResponseDTO.UserDTO` |
| **AuthResponseDTO.UserDTO** | `name`, `email`, `fuso_horario`, `tema` | `String` |
| **UsuarioResponseDTO** | `id` | `UUID` |
| | `nome`, `email`, `fuso_horario`, `preferencia_idioma`, `tema` | `String` |
| **DashboardResponseDTO** | `habits` | `List<HabitoResponseDTO>` |
| | `limite_habitos_ativos` | `Integer` |
| **HabitoResponseDTO** | `id` | `UUID` |
| | `titulo`, `categoria`, `tipo_medida`, `modalidade`, `frequencia_semanal`, `gatilho_ancora`, `status` | `String` |
| | `horario_agendado`, `horario_ocorrencia_atual` | `LocalTime` |
| | `meta_base`, `meta_frequencia_diaria`, `moedas_locais`, `bloqueios_acumulados`, `dias_seguidos`, `execucoes_hoje`, `meta_maxima`, `incremento`, `dias_incremento`, `alvo_ocorrencia_atual` | `Integer` |
| | `ativo`, `bloqueio_usado_hoje` | `Boolean` |
| | `proximo_vencimento` | `OffsetDateTime` |
| | `ocorrencias` | `List<HabitoResponseDTO.OcorrenciaResponseDTO>` |
| **HabitoResponseDTO.OcorrenciaResponseDTO** | `horario_inicio`, `horario_fim` | `LocalTime` |
| | `alvo` | `Integer` |
| **ExecutionResponseDTO** | `moedas_ganhas`, `moedas_totais`, `dias_seguidos`, `novo_nivel` | `Integer` |
| | `texto_feedback` | `String` |
| | `bonus` | `Boolean` |
| **StatsResponseDTO** | `dias` | `List<DiaStatsDTO>` |
| | `recorde`, `dias_com_meta_cumprida`, `constancia_semanal_percentual` | `Integer` |
| **DiaStatsDTO** | `data` | `LocalDate` |
| | `nome` | `String` |
| | `valor_realizado`, `execucoes` | `Integer` |
| | `meta_cumprida`, `parcial` | `Boolean` |
| **PrimingResponseDTO** | `texto` | `String` |
| **MessageResponseDTO** | `success` | `boolean` |
| | `message` | `String` |

Notas (mudanças desde 27/08):

- `HabitoRequestDTO`/`HabitoResponseDTO` ganharam, ao todo, 9 campos novos desde o levantamento
  antigo: `meta_maxima`/`incremento`/`dias_incremento` (E2.3), `frequencia_semanal` (E2.4),
  `ocorrencias`/`alvo_ocorrencia_atual`/`horario_ocorrencia_atual` (E2.8), `gatilho_ancora`
  na resposta (E4.1 — já existia no request), `status` (E1.1).
- `intervalo_minutos` **foi removido** dos dois DTOs na E2.9 — nunca teve coluna correspondente em
  nenhuma tabela do schema v2.1, e nada no frontend o lia.
- `ProfileUpdateDTO`/`UsuarioResponseDTO`/`AuthResponseDTO.UserDTO` ganharam `tema` (E3.4).
- `UsuarioResponseDTO` e `DashboardResponseDTO` são DTOs novos desde 27/08 (E1.5 e E1.3).
- `PUT /api/habits/{id}` hoje persiste **todos** os campos do request, não só título/meta_base/ativo
  como no levantamento antigo — fechado na E2.9. `docs/CONTRATO_API.md` tem o detalhamento completo
  campo a campo, tela a tela.
- `MessageResponseDTO` segue sem uso direto por nenhum controller (usado só por
  `GlobalExceptionHandler`).

---

## 5. `schema.sql` — tabelas, colunas e tipos

Arquivo: [backend/src/main/resources/schema.sql](backend/src/main/resources/schema.sql), versão 2.1.
Executado a cada boot (`spring.sql.init.mode=always`). Todas as tabelas usam
`CREATE TABLE IF NOT EXISTS` e convenção de prefixo por tabela (`usu_`, `hab_`, `sub_`, `sta_`,
`his_`, `bib_`, `cab_`/`cal_`, `dis_`). **Não há Flyway nem Liquibase.**

São **9 tabelas + 1 view**, quase o dobro do levantamento de 27/08 (5 tabelas, nenhuma view).

### 5.1 `usuarios`

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `usu_id` | `UUID` | PK, `gen_random_uuid()` |
| `usu_nome` | `VARCHAR(150)` | NOT NULL |
| `usu_email` | `VARCHAR(255)` | UNIQUE, NOT NULL, CHECK `LIKE '%@%'` |
| `usu_senha_hash` | `VARCHAR(255)` | NOT NULL |
| `usu_fuso_horario` | `VARCHAR(64)` | NOT NULL, DEFAULT `'America/Sao_Paulo'` — identificador IANA, nunca sigla |
| `usu_preferencia_idioma` | `VARCHAR(10)` | NOT NULL, DEFAULT `'pt-BR'` |
| `usu_tema` | `VARCHAR(10)` | NOT NULL, DEFAULT `'sistema'`, CHECK `IN ('claro','escuro','sistema')` |
| `usu_criado_em` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` |
| `usu_atualizado_em` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` |

### 5.2 `habitos`

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `hab_id` | `UUID` | PK |
| `hab_usuario_id` | `UUID` | NOT NULL, FK → `usuarios` ON DELETE CASCADE |
| `hab_titulo` | `VARCHAR(60)` | NOT NULL |
| `hab_categoria` | `VARCHAR(50)` | NOT NULL, CHECK `IN ('AGUA','ESTUDO','EXERCICIO')` |
| `hab_tipo_medida` | `VARCHAR(20)` | NOT NULL, CHECK `IN ('TEMPO','QUANTIDADE')` |
| `hab_gatilho_ancora` | `VARCHAR(120)` | nullable |
| `hab_modalidade` | `VARCHAR(50)` | nullable — **pendente de esclarecimento** (E0.5.0), não usada em regra de negócio |
| `hab_meta_base` | `INT` | NOT NULL, DEFAULT 1, CHECK `>= 1` |
| `hab_meta_maxima` | `INT` | nullable, CHECK `IS NULL OR >= hab_meta_base` |
| `hab_incremento` | `INT` | NOT NULL, DEFAULT 0, CHECK `>= 0` (0 = progressão desligada) |
| `hab_dias_incremento` | `INT` | NOT NULL, DEFAULT 10, CHECK `>= 1` |
| `hab_frequencia_semanal` | `CHAR(7)` | NOT NULL, DEFAULT `'1111111'`, CHECK `^[01]{7}$` e `<> '0000000'` |
| `hab_ativo` | `BOOLEAN` | NOT NULL, DEFAULT TRUE |
| `hab_criado_em` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` |
| `hab_arquivado_em` | `TIMESTAMPTZ` | nullable — carimbado por `HabitoRepository.archive` (soft delete) |

**Não há limite de hábitos ativos no schema** — `HabitoService.LIMITE_HABITOS_ATIVOS = 2` é
constante única em código (RF03), sem número mágico duplicado.

### 5.3 `sub_atividades`

Cada ocorrência diária do hábito. A **contagem de linhas** é a meta de frequência diária —
não existe coluna `meta_frequencia_diaria` em `habitos`.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `sub_id` | `UUID` | PK |
| `sub_habito_id` | `UUID` | NOT NULL, FK → `habitos` ON DELETE CASCADE |
| `sub_ordem` | `SMALLINT` | NOT NULL, CHECK `BETWEEN 1 AND 12`, UNIQUE com `sub_habito_id` |
| `sub_horario_inicio` | `TIME` | NOT NULL |
| `sub_horario_fim` | `TIME` | nullable, CHECK `IS NULL OR > sub_horario_inicio` |
| `sub_alvo` | `INT` | NOT NULL, CHECK `>= 1` — soma dos `sub_alvo` do hábito deve igualar `hab_meta_base` |

### 5.4 `status_habitos`

A economia isolada por hábito vive aqui — cada hábito tem seu próprio saldo, não a conta do usuário.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `sta_habito_id` | `UUID` | PK, FK → `habitos` ON DELETE CASCADE |
| `sta_moedas_locais` | `INT` | NOT NULL, DEFAULT 0, CHECK `>= 0` |
| `sta_bloqueios_acumulados` | `INT` | NOT NULL, DEFAULT 0, CHECK `>= 0` — escudos comprados |
| `sta_dias_seguidos` | `INT` | NOT NULL, DEFAULT 0, CHECK `>= 0` — ofensiva |
| `sta_recorde_dias` | `INT` | NOT NULL, DEFAULT 0 — reservada, sem campo Java ainda |
| `sta_execucoes_hoje` | `INT` | NOT NULL, DEFAULT 0 — zerada pelo `FechamentoDiarioJob` |
| `sta_valor_acumulado_hoje` | `INT` | NOT NULL, DEFAULT 0 — reservada (RF07, janela 00:00-23:59), sem campo Java ainda |
| `sta_nivel_avatar` | `INT` | NOT NULL, DEFAULT 1, CHECK `>= 1` — reservada (E4.4, não implementada) |
| `sta_proximo_vencimento` | `TIMESTAMPTZ` | nullable |
| `sta_bloqueio_usado_hoje` | `BOOLEAN` | NOT NULL, DEFAULT FALSE — zerada pelo `FechamentoDiarioJob` |
| `sta_ultimo_reset` | `DATE` | nullable — data LOCAL (fuso do dono) já apurada; torna o job idempotente |

### 5.5 `historico_execucoes`

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `his_id` | `UUID` | PK |
| `his_habito_id` | `UUID` | NOT NULL, FK → `habitos` ON DELETE CASCADE |
| `his_sub_atividade_id` | `UUID` | nullable, FK → `sub_atividades` ON DELETE SET NULL |
| `his_execution_token` | `UUID` | UNIQUE, NOT NULL — chave de idempotência |
| `his_valor_realizado` | `INT` | NOT NULL, DEFAULT 0, CHECK `>= 0` |
| `his_tipo_sucesso` | `VARCHAR(30)` | NOT NULL, CHECK `IN ('COMPLETE_PADRAO','COMPLETE_EXTRA','DESISTENCIA','PROTEGIDO_ESCUDO','PROTEGIDO_AUTOMATICO')` |
| `his_moedas_ganhas` | `INT` | NOT NULL, DEFAULT 0, CHECK `>= 0` |
| `his_data_hora` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` |
| `his_data_local` | `DATE` | NOT NULL — data no fuso do usuário, gravada pelo backend p/ agregação de 7 dias |

`'PROTEGIDO_AUTOMATICO'` já está no CHECK desde a v2.0 do schema, reservado para o escudo automático
da E4.3 — nenhum código grava esse valor ainda neste levantamento.

### 5.6 `calibracoes`

Reservada para D4 (questionário "Medir Dificuldade", trabalho futuro — Etapa 5 não executada).
Pertence ao HÁBITO e guardaria o resultado calculado.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `cab_id` | `UUID` | PK |
| `cab_habito_id` | `UUID` | NOT NULL, FK → `habitos` ON DELETE CASCADE |
| `cab_meta_sugerida` | `INT` | NOT NULL, CHECK `>= 1` |
| `cab_incremento_sugerido` | `INT` | NOT NULL, DEFAULT 0 |
| `cab_aceita` | `BOOLEAN` | NOT NULL, DEFAULT FALSE |
| `cab_criado_em` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` |

### 5.7 `calibracao_respostas`

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `cal_id` | `UUID` | PK |
| `cal_calibracao_id` | `UUID` | NOT NULL, FK → `calibracoes` ON DELETE CASCADE |
| `cal_pergunta_codigo` | `VARCHAR(40)` | NOT NULL — código estável (`DIAS_DISPONIVEIS` etc.), nunca o enunciado |
| `cal_resposta` | `VARCHAR(120)` | NOT NULL |

UNIQUE `(cal_calibracao_id, cal_pergunta_codigo)`.

### 5.8 `dispositivos_push`

Reservada para D3 (push notifications, RF18 — trabalho futuro). Nenhum service a usa.

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `dis_id` | `UUID` | PK |
| `dis_usuario_id` | `UUID` | NOT NULL, FK → `usuarios` ON DELETE CASCADE |
| `dis_token_dispositivo` | `VARCHAR(255)` | UNIQUE, NOT NULL |
| `dis_plataforma` | `VARCHAR(20)` | NOT NULL, DEFAULT `'ANDROID'`, CHECK `IN ('ANDROID','WEB')` |
| `dis_ativo` | `BOOLEAN` | NOT NULL, DEFAULT TRUE |
| `dis_criado_em` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `CURRENT_TIMESTAMP` |
| `dis_ultimo_uso` | `TIMESTAMPTZ` | nullable |

### 5.9 `biblioteca_textos`

| Coluna | Tipo | Restrições |
|--------|------|-----------|
| `bib_id` | `UUID` | PK |
| `bib_categoria` | `VARCHAR(50)` | NOT NULL, CHECK `IN ('AGUA','ESTUDO','EXERCICIO')` |
| `bib_idioma` | `VARCHAR(10)` | NOT NULL, DEFAULT `'pt-BR'` |
| `bib_texto_pre_tarefa` | `TEXT` | NOT NULL |
| `bib_texto_sucesso_padrao` | `TEXT` | NOT NULL |
| `bib_texto_sucesso_extra` | `TEXT` | NOT NULL |
| `bib_texto_aviso_urgencia` | `TEXT` | nullable |

UNIQUE `(bib_categoria, bib_idioma)`. Seed de 3 linhas (AGUA/ESTUDO/EXERCICIO, pt-BR) no próprio
`schema.sql`, com `ON CONFLICT DO NOTHING` — idempotente, sem depender de `data.sql` para isso.

### 5.10 `vw_habito_hoje` (view, não tabela)

Fonte única de `HabitoResponseDTO` inteiro (não só do campo `status`) — `HabitoHojeRepository` lê
direto daqui. `JOIN habitos + status_habitos`, `LEFT JOIN` numa subquery que conta `sub_atividades`
por hábito (`total_ocorrencias`, vira `meta_frequencia_diaria`), `WHERE hab_ativo`.
`status_hoje` = `'COMPLETED'` quando `sta_execucoes_hoje >= total_ocorrencias`, senão `'PENDING'`.

Colunas acrescentadas ao SELECT, sempre no fim da lista (regra do `CREATE OR REPLACE VIEW`, que não
permite remover/reordenar): `hab_tipo_medida`/`hab_modalidade`/`sta_bloqueio_usado_hoje` (E1.1),
`hab_meta_maxima`/`hab_incremento`/`hab_dias_incremento` (E2.3), `hab_frequencia_semanal` (E2.4),
`hab_gatilho_ancora` (E4.1).

### Tabelas que ainda não existem no schema

Do Quadro 6 da monografia (ver CLAUDE.md, Seção D1): `sessoes_execucao`, `sub_atividade_status`,
`transacoes_moedas`, `perfil_onboarding`, `categorias_habito`, `habito_dias_semana`,
`avatares_catalogo`, `registros_diarios`, `notificacoes`. Do PNG de modelagem:
`status_habitos` (existe, só que sem esse nome de tabela separado — é a própria `status_habitos`
atual), `micro_habitos`, `trofeus`. Nenhuma dessas foi criada — o schema real (D1) substitui o
ER conceitual, não o contrário.

### Índices

`ix_hab_usuario_ativo` (`habitos`), `ix_sub_habito` (`sub_atividades`), `ix_his_habito_data`
(`historico_execucoes`, sustenta a agregação de 7 dias), `ix_sta_reset` (`status_habitos`, sustenta
a varredura horária do `FechamentoDiarioJob`), `ix_dis_usuario` (`dispositivos_push`, parcial —
só `WHERE dis_ativo`).

---

## 6. Configuração de ambiente

| Arquivo | Banco | Porta |
|---------|-------|-------|
| `application.properties` | PostgreSQL local via Docker Compose (`localhost:5433/backend_db`) | `8082` |
| `application-prod.properties` | **PostgreSQL no Neon** (`...sa-east-1.aws.neon.tech/neondb`, `sslmode=require`) | `${PORT:8080}` |
| `application-docker.properties` | perfil Docker | — |

O `baseURL` do frontend aponta para `https://tempo-claro-tcc-tsi.onrender.com/api`,
o que confirma **API hospedada no Render**. Existem `Dockerfile` e `compose.yaml` no backend.

Não foi encontrado nenhum diretório `.github/workflows/` no repositório — não há CI/CD
declarado em arquivo versionado.

Há também uma coleção Postman versionada em `backend/src/main/resources/Postman/Tempo Claro.json`.

`docs/` (esta pasta) também contém: `BASELINE.md` (E0.2), `CONTRATO_API.md` (E2.9, detalhamento
campo a campo de cada formulário do frontend contra o DTO e a coluna do banco), `schema.sql`
(cópia do schema v2.1 usada na E0.5.2) e `PLANO_EXECUCAO_ANTIGO.md` (versão anterior do plano de
execução, mantida para referência histórica — `PLANO_EXECUCAO.md`, na raiz do repositório, é o
documento vigente).
