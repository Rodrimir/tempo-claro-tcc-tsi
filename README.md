# Tempo Claro

> Rastreador de hábitos gamificado — Trabalho de Conclusão de Curso
> Tecnologia em Sistemas para Internet · IFSul Campus Pelotas · 2026/1

**Apesar do nome, este não é um aplicativo de meteorologia.** "Tempo Claro" é uma metáfora: o
usuário cultiva hábitos diários e, ao mantê-los, "abre o tempo" da própria rotina. O sistema
permite manter até 5 hábitos ativos, executar cada um com cronômetro ou contador, ganhar moedas
por execução e construir uma ofensiva (sequência de dias consecutivos). Moedas compram escudos,
que protegem a ofensiva em um dia de falha.

Para uma visão geral rápida, veja **[READMEENXUTO.MD](READMEENXUTO.MD)**.

---

## Índice

| § | Seção | Conteúdo |
|---|---|---|
| [1](#1-informações-acadêmicas) | Informações Acadêmicas | Autoria, curso, instituição |
| [2](#2-arquitetura-e-infraestrutura) | Arquitetura e Infraestrutura | Camadas, stack e hospedagem |
| [3](#3-mapa-de-diretórios) | Mapa de Diretórios | Cada pasta e cada arquivo do repositório |
| [4](#4-banco-de-dados) | Banco de Dados | Cada tabela, cada campo e por onde passa no código |
| [5](#5-execução-local) | Execução Local | Pré-requisitos e comandos para subir o projeto |
| [6](#6-api--contratos-completos) | API — Contratos | Requisição e resposta de cada endpoint |
| [7](#7-frontend--estrutura-e-componentes) | Frontend | Páginas, contexts, hooks e utilitários |
| [8](#8-fluxos-ponta-a-ponta) | Fluxos Ponta a Ponta | Como front e back se conectam, passo a passo |
| [9](#9-padrão-de-rastreabilidade--audit-ok) | Rastreabilidade | A convenção `@audit-ok` |
| [10](#10-testando-a-api-com-o-postman) | Postman | Guia da coleção de testes manuais |
| [11](#11-limitações-conhecidas) | Limitações Conhecidas | O que ainda não está implementado |

---

## 1. Informações Acadêmicas

| Campo | Valor |
|---|---|
| **Instituição** | Instituto Federal Sul-rio-grandense (IFSul) — Campus Pelotas |
| **Curso** | Tecnologia em Sistemas para Internet (TSI) |
| **Semestre** | 2026/1 |
| **Autor** | Rodrigo Miranda da Silva |
| **GitHub** | [`Rodrimir`](https://github.com/Rodrimir) |
| **Repositório** | `tempo-claro-tcc-tsi` |

Projeto individual: todo o código de backend, frontend e infraestrutura foi escrito por um único
desenvolvedor.

---

## 2. Arquitetura e Infraestrutura

O sistema tem duas camadas de apresentação e duas de infraestrutura compartilhada, cada uma
hospedada separadamente:

| Camada | Stack | Hospedagem | URL |
|---|---|---|---|
| **Frontend web** | React 19 + Vite 8 + styled-components 6 + Capacitor 8 (Android) | Vercel | — |
| **App Android nativo** (`mobile/`) | React Native 0.86 + Expo SDK 57 + expo-router + styled-components/native | Local (build gerado, ainda não distribuído) | — |
| **Backend** | Java 17 + **Spring Boot 4.0.3** + Gradle 9.3.1 + Docker | Render | `https://tempo-claro-tcc-tsi.onrender.com/api` |
| **Banco** | PostgreSQL 16 | Neon (AWS `sa-east-1`) | — |

**Por que existem duas pastas de frontend.** `frontend/` é o app web original (React + Vite),
empacotado em Android via Capacitor — um WebView, não um app nativo (ver §11.5). `mobile/` é a
mesma camada de apresentação **reescrita do zero em React Native + Expo**, consumindo a mesma API
REST sem nenhuma alteração no backend. A migração (`PLANO_MIGRACAO_EXPO.md`) portou as dez telas,
os componentes comuns e o cronômetro com paridade de comportamento — código completo (M0 a M5.2),
mas o teste em aparelho físico e a comparação lado a lado com o app web (M5.3/M5.4) ainda estão
pendentes, então `mobile/` não substituiu `frontend/` como versão de referência. Detalhes de
diretórios, matriz de substituição e limitações preservadas de propósito em `mobile/README.md`.

### Decisões de arquitetura

**Persistência sem JPA.** Todo o acesso a dados usa `JdbcTemplate` puro, com SQL escrito à mão em
constantes `String` dentro de cada repositório e `RowMapper` manual. Não há Hibernate, não há
entidades anotadas, não há lazy loading. A vantagem é que **cada consulta executada é visível no
código-fonte**; a desvantagem é a ausência de checagem em tempo de compilação entre o SQL e o
modelo Java.

**Schema aplicado no boot, sem ferramenta de migração.** Não há Flyway nem Liquibase. A propriedade
`spring.sql.init.mode=always` faz o Spring executar `schema.sql` e depois `data.sql` a **cada
inicialização**. Isso só é seguro porque todo o DDL usa `CREATE TABLE IF NOT EXISTS` /
`ADD COLUMN IF NOT EXISTS` e o seed usa `ON CONFLICT DO NOTHING` — ou seja, as duas execuções são
idempotentes.

**Autenticação stateless por JWT.** Não há sessão no servidor
(`SessionCreationPolicy.STATELESS`). Cada requisição autenticada carrega um token `Bearer` cujo
*subject* é o e-mail do usuário. Como a API é REST pura e agnóstica de cliente, o mesmo backend
serve o navegador e o APK Android sem nenhuma diferença.

**Mobile por WebView.** O Capacitor empacota o build do Vite dentro de um `WebView` numa
`BridgeActivity` do Android. Não é um aplicativo nativo: a interface é HTML renderizada. O
`capacitor.plugins.json` está vazio (`[]`), então nenhum recurso nativo é utilizado — a única
permissão declarada no manifesto é `INTERNET`.

---

## 3. Mapa de Diretórios

```
tempo-claro-tcc-tsi/
├── README.md                        Este documento — especificação técnica completa
├── READMEENXUTO.MD                  Visão geral resumida
├── CLAUDE.md                        Contexto do projeto para assistentes de IA
├── .gitignore                       Ignora apenas backend/bin (ver nota ao final da seção)
├── .vscode/settings.json            Configura a extensão Inline Bookmarks (exibe os @audit-ok)
├── backend/                         API REST em Spring Boot
└── frontend/                        Aplicação React + wrapper Android
```

### 3.1. `backend/`

#### Infraestrutura e build

| Arquivo | O que configura |
|---|---|
| `build.gradle` | Spring Boot **4.0.3**, toolchain Java **17**, grupo `com.rodrigo`. Dependências: `starter-web`, `starter-jdbc`, `starter-security`, `starter-validation`, `jjwt 0.12.5` (api/impl/jackson), Lombok, driver PostgreSQL. |
| `settings.gradle` | Uma linha: `rootProject.name = 'TempoClaro'`. |
| `Dockerfile` | Build multi-stage: compila em `eclipse-temurin:17-jdk-alpine` com `./gradlew build -x test` e executa em `17-jre-alpine`. Define `SPRING_PROFILES_ACTIVE=prod` e expõe a porta 8080. |
| `compose.yaml` | Três serviços: `db` (postgres:16-alpine, porta **5433**→5432, healthcheck `pg_isready`), `app` (build local, porta **8082**, perfil `docker`) e `pgadmin` (porta **8093**). |
| `gradlew` · `gradlew.bat` · `gradle/wrapper/` | Wrapper do Gradle, fixado na distribuição `gradle-9.3.1-bin.zip`. |

#### Código-fonte — `src/main/java/com/rodrigo/backend2java/`

```
├── BackEndIiApplication.java        Classe main. @SpringBootApplication + @EnableScheduling
│                                    (é o @EnableScheduling que liga o FechamentoDiarioJob)
│
├── config/
│   ├── SecurityConfig.java          Cadeia de filtros: CORS liberado, CSRF off, sessão STATELESS,
│   │                                /api/auth/** público, resto autenticado. Bean BCryptPasswordEncoder
│   ├── JwtService.java              Gera e valida JWT HS256. Subject = e-mail. Expiração 24h
│   ├── JwtFilter.java               Lê o header Authorization, valida o token, confirma que o usuário
│   │                                existe no banco e popula o SecurityContextHolder
│   └── RequestLoggingFilter.java    Imprime no console método, path, headers e corpo de cada
│                                    requisição. Ligado por padrão (ver §11 — Segurança)
│
├── controller/
│   ├── AuthController.java          POST /api/auth/login · POST /api/auth/register
│   ├── HabitoController.java        GET /api/dashboard · CRUD /api/habits · priming · executions · shield
│   ├── ProfileController.java       PUT /api/profile
│   └── StatsController.java         GET /api/stats/weekly — janela de 7 dias, delega a StatsService
│
├── exception/
│   └── GlobalExceptionHandler.java  @RestControllerAdvice: mapeia exceções para códigos HTTP
│
├── model/                           POJOs Lombok (@Data @Builder). NÃO são entidades JPA
│   ├── Usuario.java                 Tabela usuarios
│   ├── Habito.java                  Tabela habitos
│   ├── StatusHabito.java            Tabela status_habitos (gamificação, 1:1 com habitos)
│   ├── HistoricoExecucao.java       Tabela historico_execucoes
│   ├── BibliotecaTexto.java         Tabela biblioteca_textos
│   │
│   ├── dto/request/                 Records Java com validação Jakarta
│   │   ├── LoginRequestDTO.java     email (@Email) + password
│   │   ├── RegisterRequestDTO.java  nome + email + password
│   │   ├── HabitoRequestDTO.java    Criação de hábito — 9 campos
│   │   ├── ExecutionRequestDTO.java execution_token + tipo + valor_realizado
│   │   └── ProfileUpdateDTO.java    nome + fuso_horario + senha_atual + nova_senha
│   │
│   └── dto/response/                Records Java. Componentes em snake_case (ver §8.2)
│       ├── AuthResponseDTO.java     { token, user: { name, email } }
│       ├── HabitoResponseDTO.java   16 campos — hábito + status agregados. Payload do dashboard
│       ├── ExecutionResponseDTO.java { moedas_ganhas, moedas_totais, dias_seguidos, novo_nivel, texto_feedback }
│       ├── PrimingResponseDTO.java  { texto }
│       └── MessageResponseDTO.java  { success, message } — usado nas respostas de erro
│
├── repository/                      JdbcTemplate puro. SQL em constantes String + RowMapper manual
│   ├── UsuarioRepository.java       findById · findByEmail · existsByEmail · save · update
│   ├── HabitoRepository.java        findAllByUsuarioId · findAllAtivos · findById · save · update · archive
│   ├── StatusHabitoRepository.java  findById · save · update · resetarDiario
│   ├── HistoricoExecucaoRepository.java  existsByExecutionToken · save — sem RowMapper (ver §4.4)
│   └── BibliotecaTextoRepository.java    findByCategoriaAndIdioma
│
└── service/                         Regras de negócio
    ├── AuthService.java             autenticar (BCrypt + emite JWT) · cadastrar
    ├── HabitoService.java           criarHabito (limite de 5) · listarDashboard · atualizarHabito · deletarHabito
    ├── GamificacaoService.java      obterPriming · processarExecucao (moedas/ofensiva/escudo) · comprarEscudo
    ├── UsuarioService.java          atualizarPerfil (nome, fuso e troca de senha)
    └── FechamentoDiarioJob.java     @Scheduled de hora em hora — zera contadores na virada de dia
```

#### Recursos — `src/main/resources/`

| Arquivo | Conteúdo |
|---|---|
| `schema.sql` | DDL das 9 tabelas + `vw_habito_hoje` (`CREATE TABLE IF NOT EXISTS`). Executado a cada boot. |
| `data.sql` | Insere os 3 registros de `biblioteca_textos` (AGUA, ESTUDO, EXERCICIO) com `ON CONFLICT DO NOTHING`. |
| `application.properties` | Perfil padrão (execução local direta): Postgres em `localhost:5433`, porta 8082. |
| `application-docker.properties` | Perfil `docker`: Postgres em `db:5432` (rede do compose), porta 8082. |
| `application-prod.properties` | Perfil `prod`: Postgres da Neon com `sslmode=require`, porta `${PORT:8080}`. |
| `Postman/Tempo Claro.json` | Coleção Postman com 9 pastas cobrindo todos os endpoints (ver §10). |

> **Nota sobre `backend/bin/`.** Essa pasta contém artefatos `.class` gerados pelo compilador do
> Eclipse/VS Code que foram versionados por engano. Está **desatualizada** em relação a `src/` e
> guarda um `application.properties` da época em que o projeto usava H2 em memória. É por isso que
> o `SecurityConfig` ainda libera `/h2-console` — resquício daquela configuração. A pasta pode ser
> removida sem qualquer impacto.

### 3.2. `frontend/`

#### Configuração e build

| Arquivo | O que configura |
|---|---|
| `package.json` | Scripts `dev`, `build`, `lint`, `preview`. Sem script de teste. |
| `vite.config.js` | Mínimo: apenas o plugin React. Sem aliases e sem proxy. |
| `eslint.config.js` | Flat config do ESLint 9. Ignora `dist`, `android` e `.idea`. |
| `jsconfig.json` | Alias `src/*` **apenas para o editor** — não é replicado no Vite, por isso todos os imports do código são relativos. |
| `index.html` | Template do Vite. Título "Tempo Claro (React PWA)", `<div id="root">`. |
| `capacitor.config.json` | `appId: com.rodrigo.tempoclaro`, `appName: Tempo Claro`, `webDir: dist`. |
| `.gitignore` | `node_modules`, `dist`, e os diretórios de build do Android. |

#### Código-fonte — `src/`

```
├── main.jsx                         Ponto de entrada. Detecta prefers-color-scheme e monta a árvore
│                                    de providers: Auth > CurrentHabit > ThemeToggle > Toast > App
├── App.jsx                          Injeta o tema no ThemeProvider e renderiza GlobalStyle + AppRoutes
│
├── routes/index.jsx                 BrowserRouter com todas as rotas. Define o ProtectedRoute
├── layouts/MainLayout/              Casca das rotas com barra inferior: <Outlet/> + <BottomNav/>
│
├── components/common/
│   ├── CircularProgress/            Anel SVG de progresso — hábitos do tipo QUANTIDADE
│   ├── GiveUpModal/                 Modal de desistência. Envia FAIL_BLOQUEIO ou FAIL_TIMEOUT
│   ├── LoadingScreen/               Tela de carregamento com o sol girando
│   ├── MonospaceTimer/              Display MM:SS do cronômetro + badge de bônus
│   └── Toast/styles.js              Só estilos; o componente vive dentro do ToastContext
│
├── components/layout/
│   ├── BottomNav/                   Barra inferior: 4 abas + botão Play central que inicia a execução
│   └── LocalHeader/                 Cabeçalho com moedas, ofensiva e escudos do hábito em foco
│
├── contexts/
│   ├── AuthContext.jsx              Autenticação, dados do usuário, login/register/logout
│   ├── CurrentHabitContext.jsx      Hábito selecionado no carrossel — compartilhado entre telas
│   ├── ThemeToggleContext.jsx       Alternância claro/escuro
│   └── ToastContext.jsx             Notificações temporárias + renderização dos toasts
│
├── hooks/useTimer.js                Cronômetro regressivo com persistência e compensação de background
│
├── pages/                           Uma pasta por tela, no padrão index.jsx + styles.js
│   ├── Login/                       Abas Entrar/Criar Conta + modal de configurações
│   ├── Home/                        Carrossel horizontal de hábitos com avatar reativo
│   ├── PreTask/                     Texto motivacional antes da execução
│   ├── Execution/                   Cronômetro ou contador ativo
│   ├── Success/                     Recompensa, com 50 partículas animadas
│   ├── Fail/                        Falha ou proteção por escudo (única tela em SCSS)
│   ├── Stats/                       Métricas do hábito em foco (gráfico Recharts)
│   ├── Store/                       Compra de escudos e inventário
│   ├── Profile/                     Dados do usuário, preferências e logout
│   └── CreateHabit/                 Assistente de criação em 3 passos
│
├── services/
│   ├── api.js                       Instância axios + interceptores + as 11 funções de endpoint
│   └── authService.js               Validação local dos formulários de login e cadastro
│
├── styles/
│   ├── theme.js                     lightTheme e darkTheme — 12 chaves cada
│   └── GlobalStyles.js              Reset, fonte Lexend e as 10 CSS custom properties
│
├── utils/storage.js                 Persistência criptografada (AES) no localStorage
│
└── assets/                          sol_flutuando.webp · lua_flutuando.png · gotinha/
```

#### `frontend/android/` — o wrapper Capacitor

Projeto Gradle Android gerado por `npx cap add android`. Os arquivos que importam:

| Arquivo | Conteúdo |
|---|---|
| `app/src/main/AndroidManifest.xml` | Uma única `MainActivity` com `launchMode="singleTask"`. **Única permissão: `INTERNET`.** |
| `app/src/main/java/com/rodrigo/tempoclaro/MainActivity.java` | Cinco linhas: `extends BridgeActivity` com corpo vazio. Nenhum código nativo. |
| `app/src/main/assets/capacitor.plugins.json` | `[]` — **nenhum plugin nativo registrado**. |
| `variables.gradle` | `minSdk 24`, `compileSdk`/`targetSdk 36`. |
| `app/build.gradle` | `applicationId com.rodrigo.tempoclaro`, `versionCode 1`, `versionName "1.0"`. |

O restante da pasta são recursos gerados automaticamente (ícones e splash em todas as densidades)
e diretórios de build ignorados pelo Git.

---

## 4. Banco de Dados

PostgreSQL 16, cinco tabelas. O schema é aplicado por `schema.sql` a cada inicialização.

### 4.0. Visão geral do modelo

```
        usuarios
           │ 1
           │
           │ N          ON DELETE CASCADE
        habitos ──────────────┬──────────────────┐
           │ 1                │ 1                │
           │                  │                  │
           │ 1                │ N                │
    status_habitos    historico_execucoes        │
    (PK = habito_id)  (execution_token UNIQUE)   │
                                                 │
        biblioteca_textos ───────────────────────┘
        (sem FK — consultada por categoria + idioma)
```

- **`usuarios` 1:N `habitos`** — cada usuário tem no máximo 5 hábitos ativos (regra aplicada em
  `HabitoService.criarHabito`, não no banco).
- **`habitos` 1:1 `status_habitos`** — a chave primária de `status_habitos` **é** `habito_id`.
  A linha de status é criada junto com o hábito, na mesma transação.
- **`habitos` 1:N `historico_execucoes`** — cada execução registrada gera uma linha.
- **`biblioteca_textos`** é uma tabela de consulta, sem relacionamento. É buscada pelo par
  (`categoria`, `idioma`).

Os três relacionamentos usam `ON DELETE CASCADE`: apagar um usuário remove seus hábitos, que por
sua vez removem status e histórico.

### Como ler as tabelas desta seção

Cada campo é descrito em cinco dimensões:

| Coluna da tabela | Significado |
|---|---|
| **Campo Java** | O atributo correspondente no POJO de `model/` |
| **Escrito por** | O método que grava o valor, e a constante SQL usada |
| **Lido por** | O método que consome o valor em alguma regra de negócio |
| **Vai ao front como** | A chave JSON no DTO de resposta, ou `—` se não sai da API |

Quando um campo é gravado mas nunca consumido, isso está marcado explicitamente — são casos
catalogados na [§11.2](#112-campos-sem-uso-em-código).

---

### 4.1. `usuarios`

Contas de acesso. É a raiz de todo o modelo: o *subject* do JWT é o `email` desta tabela.

```sql
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    fuso_horario VARCHAR(50),
    preferencia_idioma VARCHAR(50),
    criado_em TIMESTAMP WITH TIME ZONE
);
```

| Campo | Tipo | Campo Java | Escrito por | Lido por | Vai ao front como |
|---|---|---|---|---|---|
| `id` | `UUID PK` | `Usuario.id` | `AuthService.cadastrar` — `UUID.randomUUID()` (`INSERT_USUARIO`) | `HabitoService.criarHabito` (vira `habitos.usuario_id`), `listarDashboard`, `FechamentoDiarioJob` | — |
| `nome` | `VARCHAR(150) NOT NULL` | `Usuario.nome` | `AuthService.cadastrar`; `UsuarioService.atualizarPerfil` (`UPDATE_USUARIO`, só se não-vazio) | `AuthService` ao montar a resposta de login | **`user.name`** |
| `email` | `VARCHAR(255) UNIQUE NOT NULL` | `Usuario.email` | `AuthService.cadastrar` | Chave de tudo: `FIND_BY_EMAIL` e `COUNT_BY_EMAIL`; `JwtFilter` valida a existência a cada requisição; `JwtService` usa como *subject* | **`user.email`** |
| `senha_hash` | `VARCHAR(255) NOT NULL` | `Usuario.senhaHash` | `AuthService.cadastrar` e `UsuarioService.atualizarPerfil` — sempre via `passwordEncoder.encode()` | `AuthService.autenticar` e `UsuarioService.atualizarPerfil`, via `passwordEncoder.matches()` | **nunca** (proposital) |
| `fuso_horario` | `VARCHAR(50)` | `Usuario.fusoHorario` (default `America/Sao_Paulo`) | `AuthService.cadastrar` (literal); `UsuarioService.atualizarPerfil` | **`FechamentoDiarioJob.resolverFuso`** — determina quando é "meia-noite" para este usuário | — |
| `preferencia_idioma` | `VARCHAR(50)` | `Usuario.preferenciaIdioma` (default `pt-BR`) | `AuthService.cadastrar` (literal `"pt-BR"`) | **nunca** — o priming usa o literal `"pt-BR"` em vez desta coluna | — |
| `criado_em` | `TIMESTAMPTZ` | `Usuario.criadoEm` | `AuthService.cadastrar` | **nunca** — mapeado pelo RowMapper, mas nenhum service usa | — |

> **Sobre a troca de e-mail.** A constante `UPDATE_USUARIO` inclui `email = ?`, mas o
> `ProfileUpdateDTO` não tem campo de e-mail. Na prática o `UPDATE` sempre regrava o mesmo valor
> lido do banco — **não existe caminho no código para alterar o e-mail de uma conta**.

---

### 4.2. `habitos`

A definição de cada hábito: o que é, como se mede e com que frequência. Os campos aqui são
majoritariamente **imutáveis após a criação** — `UPDATE_HABITO` cobre apenas `titulo`, `meta_base`
e `ativo`.

```sql
CREATE TABLE IF NOT EXISTS habitos (
    id UUID PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    categoria VARCHAR(100),
    gatilho_ancora VARCHAR(255),
    tipo_medida VARCHAR(50),
    modalidade VARCHAR(50),
    horario_agendado TIME,
    meta_base INT,
    meta_frequencia_diaria INT,
    intervalo_minutos INT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE
);
```

| Campo | Tipo | Campo Java | Escrito por | Lido por | Vai ao front como |
|---|---|---|---|---|---|
| `id` | `UUID PK` | `Habito.id` | `HabitoService.criarHabito` — `UUID.randomUUID()` | Chave de `status_habitos` e `historico_execucoes`; usado por todo o `GamificacaoService` | **`id`** |
| `usuario_id` | `UUID FK → usuarios` | `Habito.usuarioId` | `HabitoService.criarHabito` | Filtro de `FIND_ALL_BY_USUARIO_ID`; `FechamentoDiarioJob` usa para achar o fuso do dono | — |
| `titulo` | `VARCHAR(255) NOT NULL` | `Habito.titulo` | `criarHabito`; `atualizarHabito` | Exibição | **`titulo`** |
| `categoria` | `VARCHAR(100)` | `Habito.categoria` | `criarHabito` (imutável) | **`GamificacaoService.obterPriming`** — é a chave de busca em `biblioteca_textos`. Valores: `AGUA`, `ESTUDO`, `EXERCICIO` | **`categoria`** |
| `gatilho_ancora` | `VARCHAR(255)` | `Habito.gatilhoAncora` | `criarHabito` | **nunca** — nenhum service o lê | — (ausente do DTO) |
| `tipo_medida` | `VARCHAR(50)` | `Habito.tipoMedida` | `criarHabito` (imutável) | Nenhuma regra no backend ramifica sobre ele; **o frontend usa** para escolher entre cronômetro e contador. Valores: `TEMPO`, `QUANTIDADE` | **`tipo_medida`** |
| `modalidade` | `VARCHAR(50)` | `Habito.modalidade` | `criarHabito` (imutável) | Apenas repassado ao DTO. Valor único hoje: `DIARIA` | **`modalidade`** |
| `horario_agendado` | `TIME` | `Habito.horarioAgendado` | `criarHabito` (imutável) | Apenas repassado. **Nenhum agendador o consulta** | **`horario_agendado`** |
| `meta_base` | `INT` | `Habito.metaBase` | `criarHabito`; `atualizarHabito` | O **frontend** calcula o bônus a partir dele (20% acima da meta) | **`meta_base`** |
| `meta_frequencia_diaria` | `INT` | `Habito.metaFrequenciaDiaria` (default 1) | `criarHabito` (imutável) | **`GamificacaoService.processarExecucao`** — a ofensiva só incrementa quando `execucoesAntes + 1 == metaFrequenciaDiaria` (igualdade exata) | **`meta_frequencia_diaria`** |
| `intervalo_minutos` | `INT` | `Habito.intervaloMinutos` | `criarHabito` (imutável) | Apenas repassado ao DTO | **`intervalo_minutos`** |
| `ativo` | `BOOLEAN DEFAULT TRUE` | `Habito.ativo` | `criarHabito` (`true`); `deletarHabito` → `ARCHIVE_HABITO` (`false`) | Filtro `WHERE ativo = true` em `FIND_ALL_BY_USUARIO_ID` e `FIND_ALL_ATIVOS` | **`ativo`** |
| `criado_em` | `TIMESTAMPTZ` | `Habito.criadoEm` | `criarHabito` | **nunca** | — |

> **Exclusão é lógica, não física.** `DELETE /api/habits/{id}` executa `ARCHIVE_HABITO`
> (`SET ativo = false`). A linha permanece no banco, preservando o histórico de execuções
> associado. Nenhum `DELETE` real é emitido pela aplicação.

---

### 4.3. `status_habitos`

O estado de gamificação de cada hábito. Relação **1:1 com `habitos`** — a chave primária é o
próprio `habito_id`. Toda a mecânica de moedas, ofensiva e escudos vive aqui.

```sql
CREATE TABLE IF NOT EXISTS status_habitos (
    habito_id UUID PRIMARY KEY REFERENCES habitos(id) ON DELETE CASCADE,
    moedas_locais INT,
    bloqueios_acumulados INT,
    dias_seguidos INT,
    execucoes_hoje INT,
    proximo_vencimento TIMESTAMP WITH TIME ZONE,
    bloqueio_usado_hoje BOOLEAN,
    ultimo_reset DATE
);
```

| Campo | Tipo | Campo Java | Escrito por | Lido por | Vai ao front como |
|---|---|---|---|---|---|
| `habito_id` | `UUID PK/FK` | `StatusHabito.habitoId` | `HabitoService.criarHabito` (`INSERT_STATUS`) | Chave de `FIND_BY_HABITO_ID`, `UPDATE_STATUS` e `RESET_DIARIO` | — (mesmo valor de `id`) |
| `moedas_locais` | `INT` | `StatusHabito.moedasLocais` | Inicia em 0. `processarExecucao` soma as moedas ganhas; `comprarEscudo` debita 1500 | `comprarEscudo` valida saldo `< 1500` antes de debitar | **`moedas_locais`** e **`moedas_totais`** |
| `bloqueios_acumulados` | `INT` | `StatusHabito.bloqueiosAcumulados` | Inicia em 0. `comprarEscudo` incrementa; ramo `FAIL_BLOQUEIO` decrementa | `processarExecucao` rejeita `FAIL_BLOQUEIO` se `<= 0` | **`bloqueios_acumulados`** |
| `dias_seguidos` | `INT` | `StatusHabito.diasSeguidos` | Inicia em 0. `+1` ao atingir a meta diária; **zerado por `FAIL_TIMEOUT`**; **preservado por `FAIL_BLOQUEIO`** | Exibição da ofensiva | **`dias_seguidos`** e **`novo_nivel`** |
| `execucoes_hoje` | `INT` | `StatusHabito.execucoesHoje` | Incrementado a cada conclusão; **zerado pelo `FechamentoDiarioJob`** | Comparado com `meta_frequencia_diaria` para decidir se a ofensiva avança | **`execucoes_hoje`** |
| `proximo_vencimento` | `TIMESTAMPTZ` | `StatusHabito.proximoVencimento` | **só recebe `null`** — nenhum código atribui valor real | O frontend *tenta* usar para calcular a expressão do avatar, mas recebe sempre `null` | **`proximo_vencimento`** (sempre `null`) |
| `bloqueio_usado_hoje` | `BOOLEAN` | `StatusHabito.bloqueioUsadoHoje` | `false` na criação; `true` ao usar escudo; **zerado pelo job** | `processarExecucao` rejeita um segundo escudo no mesmo dia | **`bloqueio_usado_hoje`** |
| `ultimo_reset` | `DATE` | `StatusHabito.ultimoReset` | `FechamentoDiarioJob` grava a data local do usuário | **Guarda de idempotência**: `RESET_DIARIO` só age `WHERE ultimo_reset IS NULL OR ultimo_reset < ?` | — |

**As regras de gamificação, em um lugar só:**

| Evento (`tipo`) | Moedas | Efeito na ofensiva | Pré-condição |
|---|---|---|---|
| `COMPLETE_PADRAO` | **+100** | `+1` se `execucoes_hoje` atingir `meta_frequencia_diaria` | — |
| `COMPLETE_EXTRA` | **+150** | idem | Frontend detecta 20% acima da meta |
| `FAIL_BLOQUEIO` | 0 | **preservada** | Exige `bloqueios_acumulados > 0` e `bloqueio_usado_hoje = false`. Consome 1 escudo |
| `FAIL_TIMEOUT` | 0 | **zerada** | — |
| Compra de escudo | **−1500** | — | Exige saldo ≥ 1500 |

Qualquer outro valor de `tipo` lança exceção — são exatamente esses quatro.

> **A coluna `ultimo_reset` é o que torna o reset diário confiável.** Sem ela, não haveria como
> distinguir "este dia já foi apurado" de "ainda não". Com ela, o job pode rodar de hora em hora
> sem risco: a cláusula `ultimo_reset < hoje` garante que rodar duas vezes no mesmo dia não zere
> execuções já registradas depois da virada.

---

### 4.4. `historico_execucoes`

O registro append-only de cada execução — concluída ou falhada. É a tabela que dá lastro à
auditoria do sistema e a garantia de idempotência.

```sql
CREATE TABLE IF NOT EXISTS historico_execucoes (
    id UUID PRIMARY KEY,
    habito_id UUID NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    execution_token UUID UNIQUE,
    data_hora_execucao TIMESTAMP WITH TIME ZONE,
    valor_realizado INT,
    moedas_ganhas INT,
    tipo_sucesso VARCHAR(100)
);
```

| Campo | Tipo | Campo Java | Escrito por | Lido por | Vai ao front como |
|---|---|---|---|---|---|
| `id` | `UUID PK` | `HistoricoExecucao.id` | `processarExecucao` — `UUID.randomUUID()` (`INSERT_HISTORICO`) | nunca | — |
| `habito_id` | `UUID FK → habitos` | `HistoricoExecucao.habitoId` | `processarExecucao` (vem do path da URL) | nunca | — |
| `execution_token` | `UUID UNIQUE` | `HistoricoExecucao.executionToken` | `processarExecucao` | **`existsByExecutionToken`** (`COUNT_BY_EXECUTION_TOKEN`) — a única leitura da tabela | — (recebido no request) |
| `data_hora_execucao` | `TIMESTAMPTZ` | `HistoricoExecucao.dataHoraExecucao` | `processarExecucao` — `OffsetDateTime.now()` | nunca | — |
| `valor_realizado` | `INT` | `HistoricoExecucao.valorRealizado` | `processarExecucao` (do request) | nunca | — |
| `moedas_ganhas` | `INT` | `HistoricoExecucao.moedasGanhas` | `processarExecucao` | nunca — o valor devolvido ao front vem da variável local, não desta coluna | — |
| `tipo_sucesso` | `VARCHAR(100)` | `HistoricoExecucao.tipoSucesso` | `processarExecucao` (do request) | nunca | — |

#### Idempotência via `execution_token`

O frontend gera um UUID no início de cada sessão de execução e o envia junto com o resultado. Antes
de processar, `GamificacaoService.processarExecucao` consulta:

```sql
SELECT COUNT(1) FROM historico_execucoes WHERE execution_token = ?
```

Se já existir, lança `"Execução duplicada"` e nada é gravado. Isso protege contra o cenário real de
um duplo toque no botão ou de um *retry* de rede: **o usuário não ganha 200 moedas por uma
execução só**. A constraint `UNIQUE` na coluna é a rede de segurança no nível do banco, caso duas
requisições cheguem simultaneamente.

> Além de `COUNT_BY_EXECUTION_TOKEN` e `INSERT_HISTORICO`, o `HistoricoExecucaoRepository` expõe
> `agregarPorDia` e `agregarDesistenciasPorDia` — duas consultas de agregação por dia (`GROUP BY
> his_data_local`) que sustentam `GET /api/stats/weekly` (§6.4, `StatsService`). Não há `RowMapper`
> de linha individual porque nenhuma tela precisa da execução crua, só do agregado diário.

---

### 4.5. `biblioteca_textos`

Catálogo de textos motivacionais por categoria e idioma. É a única tabela **sem chave estrangeira**
e a única cujo conteúdo vem de um seed, não da aplicação.

```sql
CREATE TABLE IF NOT EXISTS biblioteca_textos (
    id UUID PRIMARY KEY,
    categoria VARCHAR(100),
    idioma VARCHAR(50),
    texto_pre_tarefa TEXT,
    texto_sucesso_padrao TEXT,
    texto_sucesso_extra TEXT,
    texto_aviso_urgencia TEXT
);
```

Constraint adicional, declarada em **`data.sql`** (não em `schema.sql`):

```sql
CREATE UNIQUE INDEX IF NOT EXISTS ux_biblioteca_categoria_idioma
    ON biblioteca_textos (categoria, idioma);
```

| Campo | Tipo | Campo Java | Escrito por | Lido por | Vai ao front como |
|---|---|---|---|---|---|
| `id` | `UUID PK` | `BibliotecaTexto.id` | apenas o seed de `data.sql` | nunca | — |
| `categoria` | `VARCHAR(100)` | `BibliotecaTexto.categoria` | seed | `FIND_BY_CATEGORIA_AND_IDIOMA` — casada com `habitos.categoria` | — |
| `idioma` | `VARCHAR(50)` | `BibliotecaTexto.idioma` | seed | `FIND_BY_CATEGORIA_AND_IDIOMA` — recebe o literal `"pt-BR"` | — |
| `texto_pre_tarefa` | `TEXT` | `BibliotecaTexto.textoPreTarefa` | seed | **`GamificacaoService.obterPriming`** — o único texto realmente consumido | **`texto`** |
| `texto_sucesso_padrao` | `TEXT` | `BibliotecaTexto.textoSucessoPadrao` | seed | **nunca** — o feedback é a string fixa `"Execução registrada!"` | — |
| `texto_sucesso_extra` | `TEXT` | `BibliotecaTexto.textoSucessoExtra` | seed | **nunca** — o feedback é a string fixa `"Desempenho excelente!"` | — |
| `texto_aviso_urgencia` | `TEXT` | `BibliotecaTexto.textoAvisoUrgencia` | seed | **nunca** — não há funcionalidade de aviso de urgência no backend | — |

O seed popula três linhas, todas em `pt-BR`:

| `categoria` | `texto_pre_tarefa` |
|---|---|
| `AGUA` | "Seu corpo é 70% água. Este copo é o intervalo entre o cansaço e a clareza." |
| `ESTUDO` | "Não precisa entender tudo hoje. Precisa apenas começar e não parar antes do fim." |
| `EXERCICIO` | "O corpo reclama nos primeiros cinco minutos. Depois disso, ele coopera." |

O `ON CONFLICT (categoria, idioma) DO NOTHING` — apoiado no índice único acima — é o que permite
que `data.sql` rode a cada boot sem duplicar registros. Se a busca não encontrar linha (categoria
desconhecida ou banco sem seed), `obterPriming` devolve o texto fixo
`"Concentre-se e respire fundo. Você consegue!"`.

---

## 5. Execução Local

### Pré-requisitos

| Ferramenta | Versão | Necessária para |
|---|---|---|
| **JDK** | 17 | Compilar o backend (o `build.gradle` fixa a toolchain em 17) |
| **Node.js** | 20+ | Rodar o frontend |
| **Docker** + Docker Compose | recente | Subir o PostgreSQL — e, se preferir, o backend inteiro |
| **Android Studio** | opcional | Gerar o APK |

> **O backend precisa de um PostgreSQL.** Versões anteriores deste projeto usavam H2 em memória, e
> parte da documentação antiga ainda mencionava `/h2-console`. **Isso não vale mais**: sem um
> Postgres acessível, a aplicação não sobe. A forma mais simples de obter um é o `compose.yaml`.

### Opção A — Banco no Docker, backend na IDE

Melhor para desenvolver, porque permite *hot reload* e depuração.

```bash
cd backend
docker compose up -d db      # sobe só o Postgres, na porta 5433
./gradlew bootRun            # backend em http://localhost:8082
```

Usa o perfil padrão (`application.properties`), que aponta para `localhost:5433`.

### Opção B — Stack completa no Docker

```bash
cd backend
docker compose up            # Postgres + backend + pgAdmin
```

| Serviço | Endereço | Credenciais |
|---|---|---|
| API | `http://localhost:8082/api` | — |
| PostgreSQL | `localhost:5433` | `postgres` / `123`, base `backend_db` |
| pgAdmin | `http://localhost:8093` | `admin@admin.com` / `admin` |

O serviço `app` usa o perfil `docker`, que aponta para `db:5432` (nome do serviço na rede interna
do Compose). O `depends_on` com `condition: service_healthy` garante que o backend só inicia depois
que o `pg_isready` do Postgres responder.

### Frontend

```bash
cd frontend
npm install
npm run dev                  # http://localhost:5173
```

> **Atenção:** a `baseURL` do axios está fixa na API de **produção** (Render). Rodar `npm run dev`
> não aponta automaticamente para o backend local — é preciso editar
> `frontend/src/services/api.js`. Ver [§11.4](#114-qualidade-e-infraestrutura).

### Gerar o APK

```bash
cd frontend
npm run build                # gera dist/
npx cap sync android         # copia dist/ para o projeto Android
npx cap open android         # abre no Android Studio para gerar o APK
```

---

## 6. API — Contratos Completos

Todos os endpoints ficam sob o prefixo **`/api`**.

| Verbo | Caminho | Auth | Request | Resposta | Service |
|---|---|---|---|---|---|
| `POST` | `/auth/register` | pública | `RegisterRequestDTO` | `AuthResponseDTO` — **201** | `AuthService.cadastrar` |
| `POST` | `/auth/login` | pública | `LoginRequestDTO` | `AuthResponseDTO` — 200 | `AuthService.autenticar` |
| `GET` | `/dashboard` | Bearer | — | `DashboardResponseDTO` (`habits` + `limite_habitos_ativos`) | `HabitoService.listarDashboard` |
| `POST` | `/habits` | Bearer | `HabitoRequestDTO` | `HabitoResponseDTO` — **201** | `HabitoService.criarHabito` |
| `PUT` | `/habits/{id}` | Bearer | `HabitoRequestDTO` | `{"success": true}` | `HabitoService.atualizarHabito` |
| `DELETE` | `/habits/{id}` | Bearer | — | `{"success": true}` (soft delete: `hab_ativo = false`) | `HabitoService.deletarHabito` |
| `GET` | `/habits/{id}/priming` | Bearer | — | `PrimingResponseDTO` | `GamificacaoService.obterPriming` |
| `POST` | `/habits/{id}/executions` | Bearer | `ExecutionRequestDTO` | `ExecutionResponseDTO` | `GamificacaoService.processarExecucao` |
| `POST` | `/habits/{id}/shield` | Bearer | — | `{"success": true, "message": "..."}` | `GamificacaoService.comprarEscudo` |
| `GET` | `/me` | Bearer | — | `UsuarioResponseDTO` | `UsuarioService.buscarPerfil` |
| `PUT` | `/profile` | Bearer | `ProfileUpdateDTO` | `{"success": true}` | `UsuarioService.atualizarPerfil` |
| `GET` | `/stats/weekly?habitoId={uuid}` | Bearer | — | `StatsResponseDTO` | `StatsService.obterEstatisticasSemanais` |

### Autenticação das requisições

Toda rota exceto `/api/auth/**` exige o cabeçalho:

```
Authorization: Bearer <token>
```

O token é um JWT HS256 cujo *subject* é o e-mail do usuário, com validade de 24 horas.

### Códigos de erro

O `GlobalExceptionHandler` traduz exceções para HTTP, sempre no formato
`{"success": false, "message": "..."}`:

| Exceção | HTTP | Quando ocorre |
|---|---|---|
| `MethodArgumentNotValidException` | **400** | Falha de validação Jakarta (`@NotBlank`, `@Min`…) |
| `RuntimeException` | **400** | Regra de negócio: "Limite de 2 hábitos ativos atingido", "Saldo insuficiente", "Execução duplicada", "Nenhum escudo disponível…", "E-mail já está em uso" |
| `DataIntegrityViolationException` | **400** | Violação de `CHECK` do banco (ex.: `ck_hab_teto`, `ck_hab_freq`), traduzida para mensagem legível |
| `HttpMessageNotReadableException` | **400** | Corpo malformado ou campo desconhecido no JSON (Jackson com `FAIL_ON_UNKNOWN_PROPERTIES`) |
| `IllegalArgumentException` | **401** | Credenciais inválidas — **e também `tipo` de execução inválido** (ver §11.4) |
| `Exception` | **500** | Qualquer erro não previsto, com mensagem genérica |

### 6.1. Autenticação

#### POST /auth/register — Cadastro de novo usuário

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "nome": "Rodrigo Miranda",
  "email": "rodrigo@ifsul.edu.br",
  "password": "SenhaSegura123!"
}
```

**Response 201 Created:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJyb2RyaWdvQGlmc3VsLmVkdS5iciIsImlhdCI6...",
  "user": {
    "name": "Rodrigo Miranda",
    "email": "rodrigo@ifsul.edu.br"
  }
}
```

**Response 401 Unauthorized (e-mail já cadastrado):**
```json
{ "success": false, "message": "E-mail já está em uso" }
```

---

#### POST /auth/login — Login

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "rodrigo@ifsul.edu.br",
  "password": "SenhaSegura123!"
}
```

**Response 200 OK:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "name": "Rodrigo Miranda",
    "email": "rodrigo@ifsul.edu.br"
  }
}
```

**Response 401 Unauthorized (credenciais inválidas):**
```json
{ "success": false, "message": "Erro credenciais invalidas!" }
```

---

### 6.2. Hábitos

#### GET /dashboard — Lista todos os hábitos ativos do usuário

**Request:**
```http
GET /api/dashboard
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Response 200 OK:**
```json
{
  "habits": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "titulo": "Beber Água",
      "categoria": "AGUA",
      "tipo_medida": "QUANTIDADE",
      "modalidade": "DIARIA",
      "horario_agendado": null,
      "meta_base": 250,
      "meta_frequencia_diaria": 1,
      "ativo": true,
      "moedas_locais": 1200,
      "bloqueios_acumulados": 1,
      "dias_seguidos": 7,
      "execucoes_hoje": 0,
      "proximo_vencimento": "2026-06-22T23:59:00Z",
      "bloqueio_usado_hoje": false,
      "status": "PENDING",
      "meta_maxima": 500,
      "incremento": 50,
      "dias_incremento": 10,
      "frequencia_semanal": "1111100",
      "alvo_ocorrencia_atual": 250,
      "horario_ocorrencia_atual": "08:00:00",
      "gatilho_ancora": "Depois do café da manhã",
      "ocorrencias": [
        { "horario_inicio": "08:00:00", "horario_fim": null, "alvo": 250 }
      ],
      "nivel_avatar": 8
    }
  ],
  "limite_habitos_ativos": 2
}
```

`horario_agendado` chega sempre `null` — foi substituído por `horario_ocorrencia_atual`
(ver §8.3, Fluxo 4). `meta_maxima`/`incremento`/`dias_incremento`/`ocorrencias` refletem a
progressão automática de meta e as sub-atividades por ocorrência do dia.

**Campos do status que determinam o comportamento no frontend:**

| Campo | Tipo | Uso no frontend |
|---|---|---|
| `status` | string | "COMPLETED" quando `execucoes_hoje >= meta_frequencia_diaria` |
| `proximo_vencimento` | OffsetDateTime | Calcula `diffMin` para expressão do avatar (real desde a virada do dia) |
| `dias_seguidos` | int | Exibido na tela Stats |
| `nivel_avatar` | int | `1 + dias_seguidos`, com teto de serviço em 50 (recalculado no fechamento diário) |
| `moedas_locais` | int | Exibido na Loja |
| `bloqueios_acumulados` | int | Exibido no GiveUpModal e na Loja |
| `gatilho_ancora` | string \| null | Exibido no cartão da Home e na pré-tarefa, quando preenchido |

---

#### POST /habits — Criar novo hábito

**Request:**
```http
POST /api/habits
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "titulo": "Gotinha",
  "categoria": "AGUA",
  "tipo_medida": "QUANTIDADE",
  "modalidade": "DIARIA",
  "meta_base": 250,
  "incremento": 50,
  "dias_incremento": 10,
  "meta_maxima": 500,
  "frequencia_semanal": "1111100",
  "meta_frequencia_diaria": 1,
  "gatilho_ancora": "Depois do café da manhã",
  "horario_agendado": "08:00:00",
  "ocorrencias": null
}
```

`frequencia_semanal` é uma máscara de 7 dígitos `0`/`1` (posição 1 = domingo), não um array de
índices. Quando `meta_frequencia_diaria > 1`, `ocorrencias` recebe um array de
`{ horario_inicio, horario_fim }` (um por ocorrência) e `horario_agendado` vai `null` — os dois
nunca são enviados juntos.

**Response 201 Created:** objeto `HabitoResponseDTO` completo (mesmo formato do dashboard).

**Response 400 Bad Request (limite atingido):**
```json
{ "success": false, "message": "Limite de 2 hábitos ativos atingido" }
```

---

#### PUT /habits/{id} — Atualizar hábito

Aceita o **mesmo `HabitoRequestDTO`** de `POST /habits` e substitui todos os campos editáveis —
não é um PATCH parcial. As sub-atividades são apagadas e recriadas a partir da meta e frequência
enviadas.

**Request:**
```http
PUT /api/habits/3fa85f64-5717-4562-b3fc-2c963f66afa6
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "titulo": "Gotinha Atualizada",
  "categoria": "AGUA",
  "tipo_medida": "QUANTIDADE",
  "modalidade": "DIARIA",
  "meta_base": 300,
  "meta_frequencia_diaria": 1,
  "frequencia_semanal": "1111111",
  "horario_agendado": "08:00:00"
}
```

**Response 200 OK:**
```json
{ "success": true }
```

---

#### DELETE /habits/{id} — Arquivar hábito (soft delete)

**Request:**
```http
DELETE /api/habits/3fa85f64-5717-4562-b3fc-2c963f66afa6
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Response 200 OK:**
```json
{ "success": true }
```

---

### 6.3. Gamificação

#### GET /habits/{id}/priming — Texto motivacional pré-tarefa

**Request:**
```http
GET /api/habits/3fa85f64-5717-4562-b3fc-2c963f66afa6/priming
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Response 200 OK:**
```json
{
  "texto": "Seu corpo é 70% água. Este copo é o intervalo entre o cansaço e a clareza."
}
```

---

#### POST /habits/{id}/executions — Registrar execução de hábito

**Request (conclusão — `tipo` ausente ou em branco):**
```http
POST /api/habits/3fa85f64-5717-4562-b3fc-2c963f66afa6/executions
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "execution_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "valor_realizado": 1500
}
```

O cliente **não decide mais** se a conclusão é padrão ou extra — isso violaria RF22/RNF08
(cálculo exclusivo do servidor). O servidor recalcula sozinho a partir de `valor_realizado` contra
o alvo da ocorrência sendo concluída: `>= alvo * 1.2` credita o bônus, senão credita o padrão.
Um `tipo: "COMPLETE_EXTRA"` enviado pelo cliente é ignorado.

**Request (desistência voluntária):**
```json
{
  "execution_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tipo": "FAIL_BLOQUEIO",
  "valor_realizado": 720
}
```

**Request (timeout por abandono):**
```json
{
  "execution_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tipo": "FAIL_TIMEOUT",
  "valor_realizado": 0
}
```

**Valores aceitos em `tipo`:**

| Valor | Moedas | Efeito em `dias_seguidos` | `historico_execucoes.tipo_sucesso` |
|---|---|---|---|
| ausente / em branco | +100 (ou +150 se `valor_realizado >= alvo * 1.2`) | +1 quando a última ocorrência do dia é concluída | `COMPLETE_PADRAO` ou `COMPLETE_EXTRA` |
| `FAIL_BLOQUEIO` | 0 | **preservado** — consome 1 escudo | `PROTEGIDO_ESCUDO` |
| `FAIL_TIMEOUT` | 0 | reset para 0 | `DESISTENCIA` |

`FAIL_BLOQUEIO` exige `bloqueios_acumulados > 0` e `bloqueio_usado_hoje = false`; senão retorna 400.
Todo valor de `tipo` fora dessa lista lança exceção no service. `valor_realizado` (mesmo parcial)
é sempre gravado em `historico_execucoes` — inclusive numa desistência.

**Response 200 OK:**
```json
{
  "moedas_ganhas": 100,
  "moedas_totais": 1300,
  "dias_seguidos": 8,
  "novo_nivel": 8,
  "texto_feedback": "Execução registrada!",
  "bonus": false
}
```

---

#### POST /habits/{id}/shield — Comprar escudo protetor

**Request:**
```http
POST /api/habits/3fa85f64-5717-4562-b3fc-2c963f66afa6/shield
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Response 200 OK:**
```json
{ "success": true, "message": "Escudo comprado!" }
```

**Response 400 Bad Request (saldo insuficiente):**
```json
{ "success": false, "message": "Saldo insuficiente" }
```

---

### 6.4. Perfil e Estatísticas

#### PUT /profile — Atualizar dados do perfil

**Request (apenas nome e fuso):**
```http
PUT /api/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "nome": "Rodrigo Atualizado",
  "fuso_horario": "America/Sao_Paulo"
}
```

**Request (incluindo troca de senha):**
```json
{
  "nome": "Rodrigo",
  "fuso_horario": "America/Sao_Paulo",
  "senha_atual": "SenhaAntiga123!",
  "nova_senha": "SenhaNova456!"
}
```

**Response 200 OK:**
```json
{ "success": true }
```

> **As chaves são `snake_case`, e isso importa.** O `ProfileUpdateDTO` declara os componentes como
> `fuso_horario`, `senha_atual` e `nova_senha`. Enviar `fusoHorario`/`senhaAtual`/`novaSenha` faz o
> Jackson simplesmente **ignorar** os campos: a requisição retorna `200 OK`, mas nada é alterado.
> Ver a explicação do contrato de nomes em [§8.2](#82-o-contrato-de-nomes-snake_case).

---

#### GET /stats/weekly — Estatísticas semanais

`habitoId` é obrigatório — o endpoint não recebia hábito nenhum na versão anterior.

**Request:**
```http
GET /api/stats/weekly?habitoId=3fa85f64-5717-4562-b3fc-2c963f66afa6
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Response 200 OK:**
```json
{
  "dias": [
    { "data": "2026-06-16", "nome": "SEG", "valor_realizado": 0, "execucoes": 0, "meta_cumprida": false, "parcial": false },
    { "data": "2026-06-17", "nome": "TER", "valor_realizado": 250, "execucoes": 1, "meta_cumprida": true, "parcial": false },
    { "data": "2026-06-18", "nome": "QUA", "valor_realizado": 120, "execucoes": 1, "meta_cumprida": false, "parcial": true }
  ],
  "recorde": 250,
  "dias_com_meta_cumprida": 1,
  "constancia_semanal_percentual": 14
}
```

Os 7 dias vêm sempre presentes (dia sem execução chega com `valor_realizado: 0`, sem "buraco" no
array). `parcial: true` marca um dia cujo valor veio de uma desistência ou proteção de escudo, não
de uma conclusão — nunca coexiste com `meta_cumprida: true`, e o frontend usa isso para colorir a
barra do gráfico de forma diferente. `recorde` só considera dias com `meta_cumprida: true`.

---


---

## 7. Frontend — Estrutura e Componentes

React 19 com Vite 8. Todo o estilo é feito com **styled-components**; o padrão de cada componente
é uma pasta contendo `index.jsx` (comportamento) e `styles.js` (aparência).

### 7.1. Rotas

Definidas em `src/routes/index.jsx`. O componente `ProtectedRoute` exibe `LoadingScreen` enquanto
`AuthContext.loading` for `true` e redireciona para `/login` se o usuário não estiver autenticado.

| Rota | Tela | Barra inferior | Observação |
|---|---|---|---|
| `/login` | `Login` | não | **Única rota pública** |
| `/` | — | — | Redireciona para `/home` |
| `/home` | `Home` | sim | Dashboard com o carrossel |
| `/stats` | `Stats` | sim | — |
| `/store` | `Store` | sim | Loja de escudos |
| `/profile` | `Profile` | sim | Perfil e preferências |
| `/create` | `CreateHabit` | sim | Assistente de criação |
| `/pretask` | `PreTask` | **não** | Início do fluxo de execução |
| `/execute` | `Execution` | **não** | Cronômetro ativo |
| `/success` | `Success` | **não** | Resultado positivo |
| `/fail` | `Fail` | **não** | Resultado negativo |
| `*` | — | — | Redireciona para `/` |

As quatro telas do fluxo de execução ficam **fora** do `MainLayout` de propósito: sem barra de
navegação, o usuário não abandona uma sessão cronometrada por acidente.

### 7.2. As dez páginas

| Página | Chama da API | Contexts que consome | Navega para |
|---|---|---|---|
| **Login** | `login()`, `register()` (via `AuthContext`) | `useAuth`, `useThemeToggle`, `useToast` | `/home` ao autenticar |
| **Home** | `getDashboard()`, `archiveHabit(id)` (menu do cartão) | `useCurrentHabit` (**escreve**), `useThemeToggle` | `/create` pelo slide vazio ou pelo menu "Editar" |
| **PreTask** | `getPreTaskPriming(id)` | `useCurrentHabit` | `/execute` ou `/home` |
| **Execution** | `submitExecution(id, payload)` | `useCurrentHabit`, `useToast` | `/success` ou `/fail` |
| **Success** | — (lê `location.state`) | — | `/home` |
| **Fail** | — (lê `location.state`) | — | `/home` |
| **Stats** | `getWeeklyStats()` | `useCurrentHabit` | não navega |
| **Store** | `getDashboard()`, `buyShield(id)` | `useToast` | não navega |
| **Profile** | `updateProfile(data)` | `useAuth`, `useThemeToggle`, `useToast` | não navega — o `logout()` faz o `ProtectedRoute` redirecionar |
| **CreateHabit** | `createHabit(data)` ou `updateHabit(id, data)` no modo de edição | `useToast` | `/home` após criar/salvar |

**Home** é a única página que *escreve* em `CurrentHabitContext`: conforme o usuário desliza o
carrossel, ela publica o hábito central. Todas as outras telas apenas leem esse valor — inclusive
`BottomNav`, `LocalHeader`, `PreTask`, `Execution` e `Stats`. Uma consequência prática: **se o
usuário abrir `/stats` sem passar pela Home, o context está vazio** e a tela mostra um estado
vazio pedindo para voltar à tela inicial.

### 7.3. Contexts (estado global)

| Context | Guarda | Expõe |
|---|---|---|
| `AuthContext` | `isAuthenticated`, `loading`, `user` | `login`, `register`, `logout`, `updateLocalUser` |
| `CurrentHabitContext` | `currentHabit` | `setCurrentHabit` |
| `ThemeToggleContext` | `isDark`, `tema` (`'claro'`\|`'escuro'`\|`'sistema'`) | `setTema(novoTema)` |
| `ToastContext` | fila de `toasts` | `addToast(message, type, duration)` |

Ao montar, o `AuthProvider` executa `verifyAuth()`: se existe token salvo, chama `getDashboard()`
para confirmar que ainda é válido. Se a chamada falhar, limpa token e perfil. É isso que faz uma
sessão expirada cair no login em vez de mostrar uma tela quebrada.

**`CurrentHabitContext` não persiste.** Um *refresh* do navegador zera o hábito selecionado — por
isso `PreTask` e `Execution` verificam `currentHabit` e voltam para a Home se estiver nulo.

**`ThemeToggleContext` persiste em dois lugares.** `tema` é lido de forma síncrona do
`localStorage` no primeiro render (sem flash) e sincronizado com `usuarios.usu_tema` no login e em
`GET /me`. Com `tema === 'sistema'` (padrão), um listener de `prefers-color-scheme` mantém `isDark`
em dia enquanto o app está aberto; com `'claro'`/`'escuro'` explícitos, a escolha do usuário vence
o sistema operacional.

### 7.4. `hooks/useTimer.js`

Assinatura: `useTimer(initialSeconds, habitId, executionToken, isTimer)`. Retorna 11 propriedades:

| Propriedade | Descrição |
|---|---|
| `timeLeft` | Segundos restantes |
| `overachieveTime` | Segundos acumulados **além** da meta |
| `isOverachieving` | `true` depois que `timeLeft` chega a zero |
| `elapsed` | `(initialSeconds - timeLeft) + overachieveTime` |
| `isRunning` / `isPaused` | Estado do cronômetro |
| `start` / `pause` / `resume` / `stop` | Controles |
| `clearTimerState` | Apaga o estado salvo no `localStorage` |

**Compensação de tempo em segundo plano.** O hook registra um listener de `visibilitychange`.
Quando a aba é ocultada, `pause()` grava no `localStorage` o estado atual e o instante
(`Date.now()`). Ao voltar, `resume()` calcula quantos segundos se passaram no relógio real e
desconta — sem isso, minimizar o app "congelaria" o cronômetro e o usuário ganharia tempo de graça.

Há uma **tolerância de 1 hora** (`isWithinTolerance`): retomar uma sessão abandonada há mais tempo
que isso descarta o estado em vez de restaurá-lo.

### 7.5. `utils/storage.js` — persistência criptografada

Tudo é cifrado com AES (CryptoJS) antes de ir para o `localStorage`.

| Chave | Conteúdo | Funções |
|---|---|---|
| `tempoClaro_token` | O JWT | `setAuthToken` · `getAuthToken` · `clearAuthToken` |
| `tempoClaro_user` | `{ name, email }` do login | `setUserProfile` · `getUserProfile` · `clearUserProfile` |
| `tempoClaro_exec_{habitId}` | Estado do cronômetro em pausa | `saveExecutionState` · `loadExecutionState` · `clearExecutionState` |

`tempoClaro_user` existe porque **não há endpoint `GET /profile`**. O nome do usuário chega uma
única vez, dentro do `AuthResponseDTO` no login, e precisa ser guardado para a tela de Perfil
poder exibi-lo.

### 7.6. `services/api.js`

Instância axios com dois interceptores:

- **Requisição** — injeta `Authorization: Bearer <token>` lendo do storage.
- **Resposta** — ao receber **401** em qualquer rota que não seja de autenticação, limpa o token e
  força `window.location.href = '/login'`.

`baseURL` é `import.meta.env.DEV ? 'http://localhost:8080/api' : '<URL do Render>'` — em
`npm run dev` o app fala com o backend local automaticamente; o bundle de produção mantém a URL do
Render embutida.

As 12 funções exportadas mapeiam um endpoint cada:

| Função | Endpoint | Usada em |
|---|---|---|
| `login(data)` | `POST /auth/login` | `AuthContext` |
| `register(data)` | `POST /auth/register` | `AuthContext` |
| `getDashboard()` | `GET /dashboard` | `Home`, `Store`, `AuthContext` |
| `createHabit(data)` | `POST /habits` | `CreateHabit` |
| `updateHabit(id, data)` | `PUT /habits/{id}` | `CreateHabit` (modo de edição) |
| `archiveHabit(id)` | `DELETE /habits/{id}` | `Home` (menu do cartão) |
| `getPreTaskPriming(id)` | `GET /habits/{id}/priming` | `PreTask` |
| `submitExecution(id, payload)` | `POST /habits/{id}/executions` | `Execution` |
| `buyShield(id)` | `POST /habits/{id}/shield` | `Store` |
| `getMe()` | `GET /me` | `Profile` |
| `updateProfile(data)` | `PUT /profile` | `Profile` |
| `getWeeklyStats(habitoId)` | `GET /stats/weekly?habitoId={uuid}` | `Stats` |

### 7.7. Tema e estilos

`styles/theme.js` exporta `lightTheme` e `darkTheme`, com as mesmas 19 chaves:

| Chave | Claro | Escuro |
|---|---|---|
| `isDark` | `false` | `true` |
| `primaryColor` | `#4f46e5` | `#818cf8` |
| `primaryLight` | `#e0e7ff` | `#1e1b4b` |
| `primaryStrong` | `#4f46e5` | `#4338ca` |
| `bgPrimary` | `#f8fafc` | `#020617` |
| `bgSurface` | `#ffffff` | `#0f172a` |
| `textPrimary` | `#0f172a` | `#f8fafc` |
| `textSecondary` | `#64748b` | `#94a3b8` |
| `successColor` | `#047857` | `#34d399` |
| `successStrong` | `#047857` | `#065f46` |
| `warningColor` | `#b45309` | `#fbbf24` |
| `warningStrong` | `#b45309` | `#92400e` |
| `dangerColor` | `#b91c1c` | `#f87171` |
| `dangerStrong` | `#b91c1c` | `#991b1b` |
| `dangerLight` | `#fef2f2` | `#2d1416` |
| `bonusStrong` | `#0369a1` | `#075985` |
| `borderColor` | `#e2e8f0` | `#1e293b` |
| `radiusMd` | `12px` | `12px` |
| `radiusFull` | `9999px` | `9999px` |

Os tokens `*Strong` existem para preenchimento sólido com texto branco por cima (botões, telas de
sucesso/falha, badges) — as cores "do dia a dia" (`successColor` etc.) ficam pastel de propósito no
tema escuro, pensadas para texto/ícone sobre fundo escuro, e falhariam o contraste mínimo de 4,5:1
nesse outro papel. `isDark` substitui uma comparação de string frágil que existia antes
(`theme.bgPrimary === '#0f172a'`, que nunca era verdadeira).

`styles/GlobalStyles.js` aplica o reset, importa a fonte **Lexend** e reexporta essas chaves (exceto
`radiusMd`/`radiusFull` e o booleano `isDark`) como CSS custom properties (`--primary-color`,
`--primary-strong`, `--danger-light` etc.) — é assim que os `styles.js` acessam o tema sem receber
`props`.

O `#root` é limitado a `max-width: 480px`, o que dá ao aplicativo o formato de tela de celular
mesmo quando aberto no navegador desktop.

---

## 8. Fluxos Ponta a Ponta

### 8.1. A cadeia que toda requisição percorre

Antes dos fluxos específicos, vale entender o caminho comum. **Toda** chamada autenticada do
frontend atravessa exatamente estas camadas:

```
┌─ FRONTEND ────────────────────────────────────────────────────────────┐
│                                                                        │
│  Página (ex.: Home)                                                    │
│      │  chama getDashboard()                                           │
│      ▼                                                                 │
│  services/api.js                                                       │
│      │  interceptor de REQUISIÇÃO:                                     │
│      │  lê tempoClaro_token do localStorage (descriptografa AES)       │
│      │  e injeta  Authorization: Bearer <jwt>                          │
└──────┼─────────────────────────────────────────────────────────────────┘
       │  HTTPS
┌──────▼─ BACKEND ───────────────────────────────────────────────────────┐
│                                                                        │
│  RequestLoggingFilter        registra a requisição no console          │
│      ▼                                                                 │
│  JwtFilter                   extrai o e-mail do token, confirma que o  │
│      │                       usuário existe e popula o                 │
│      │                       SecurityContextHolder                     │
│      ▼                                                                 │
│  SecurityConfig              /api/auth/** é público; o resto exige      │
│      │                       autenticação                              │
│      ▼                                                                 │
│  Controller                  lê o e-mail do SecurityContextHolder      │
│      ▼                       (nunca do corpo da requisição)            │
│  Service                     regra de negócio                          │
│      ▼                                                                 │
│  Repository                  SQL inline + JdbcTemplate                 │
│      ▼                                                                 │
│  PostgreSQL                                                            │
│      │                                                                 │
│      ▼  RowMapper monta o POJO de model/                               │
│  Service                     converte POJO → DTO de response           │
└──────┼─────────────────────────────────────────────────────────────────┘
       │  JSON (chaves em snake_case)
┌──────▼─ FRONTEND ──────────────────────────────────────────────────────┐
│  services/api.js             interceptor de RESPOSTA:                  │
│      │                       se 401 → limpa token e vai para /login    │
│      ▼                                                                 │
│  Página                      atualiza o estado React → re-render       │
└────────────────────────────────────────────────────────────────────────┘
```

Dois pontos que merecem destaque:

**A identidade nunca vem do corpo da requisição.** Nenhum endpoint aceita `usuario_id` como
parâmetro. O controller obtém o e-mail de
`SecurityContextHolder.getContext().getAuthentication().getName()`, que foi preenchido pelo
`JwtFilter` a partir do token assinado. Um cliente não consegue se passar por outro usuário
alterando o JSON.

**O `JwtFilter` consulta o banco a cada requisição.** Além de validar a assinatura do token, ele
chama `usuarioRepository.existsByEmail()`. Isso garante que um token de uma conta removida pare de
funcionar imediatamente — ao custo de uma consulta extra por requisição.

### 8.2. O contrato de nomes: `snake_case`

Os *records* de DTO de resposta declaram os componentes em `snake_case` — algo incomum em Java,
onde a convenção é `camelCase`:

```java
public record HabitoResponseDTO(
        UUID id,
        String tipo_medida,          // e não tipoMedida
        Integer meta_base,           // e não metaBase
        Integer meta_frequencia_diaria,
        ...
```

Isso é deliberado: como o Jackson serializa usando o nome do componente, os campos chegam ao
JavaScript já no formato que o frontend espera, sem precisar de `@JsonProperty` em cada campo nem
de conversão no cliente. O mesmo vale para os DTOs de **requisição**.

**O preço dessa escolha** é que a correspondência entre os dois lados passa a ser uma convenção
verbal, não verificada por nenhum compilador. Foi exatamente aí que o `PUT /profile` falhou: a tela
de Perfil enviava `fusoHorario`, `senhaAtual` e `novaSenha`, enquanto o `ProfileUpdateDTO` declara
`fuso_horario`, `senha_atual` e `nova_senha`. O Jackson ignorou os campos desconhecidos, o endpoint
respondeu `200 OK`, e **a alteração silenciosamente não acontecia**. Ao criar um endpoint novo,
confira as duas pontas.

### 8.3. Os quatorze fluxos

Cada passo numerado abaixo corresponde a um marcador `// @audit-ok [Nome (N)]` no código-fonte —
ver [§9](#9-padrão-de-rastreabilidade--audit-ok).

#### FLUXO 1 — Login (`POST /auth/login`)

```
Login.jsx (1)
  → handleSubmit (2)
    → useLogin.executeAuth(isLoginTab=true, formData) (3)
      → authService.validateLogin(data) — valida email e senha não vazios (4)
      → AuthContext.login(data) (5)
        → monta payload: { email, password: data.senha } (6)
        → api.js: POST /auth/login (7)
          → [Backend] JwtFilter — endpoint /auth/** é público, passa direto (8)
          → [Backend] AuthController.login() (9)
          → [Backend] AuthService.autenticar() (10)
            → UsuarioRepository.findByEmail() (11)
            → BCrypt.matches(password, senhaHash) (12)
            → JwtService.generateToken(email) (13)
          → Response: { token, user: { name, email } } (14)
        → storage.setAuthToken(token) — AES encrypt → localStorage (15)
        → setIsAuthenticated(true) (16)
  → navigate('/home') (17)
```

**Payload enviado para a API:**
```json
{ "email": "rodrigo@ifsul.edu.br", "password": "SenhaSegura123!" }
```

**Resposta recebida:**
```json
{ "token": "eyJhbGci...", "user": { "name": "Rodrigo Miranda", "email": "rodrigo@ifsul.edu.br" } }
```

**localStorage após login:**
```
tempoClaro_token → "U2FsdGVkX1+abc123..." (AES ciphertext do JWT)
```

---

#### FLUXO 2 — Cadastro (`POST /auth/register`)

```
Login.jsx — aba "Criar Conta" (1)
  → handleSubmit (2)
    → useLogin.executeAuth(isLoginTab=false, formData) (3)
      → authService.validateRegister(data) (4)
        → valida nome, email, senha não vazios
        → valida senha === confirmarSenha
      → AuthContext.register(data) (5)
        → monta payload: { nome, email, password: data.senha } (6)
        → api.js: POST /auth/register (7)
          → [Backend] JwtFilter — público, passa direto (8)
          → [Backend] AuthController.register() (9)
          → [Backend] AuthService.cadastrar() (10)
            → UsuarioRepository.existsByEmail() — verifica duplicidade (11)
            → BCrypt.encode(password) — hash da senha (12)
            → UsuarioRepository.save(novoUsuario) (13)
            → JwtService.generateToken(email) (14)
          → Response: { token, user } (15)
        → storage.setAuthToken(token) (16)
        → setIsAuthenticated(true) (17)
  → navigate('/home') (18)
```

---

#### FLUXO 3 — Verificação de Token na Inicialização

```
main.jsx — monta AuthProvider (1)
  → AuthContext.useEffect() → verifyAuth() (2)
    → storage.getAuthToken() — AES decrypt do localStorage (3)
    → Se sem token: setIsAuthenticated(false) → setLoading(false) (4)
    → Se com token: api.getDashboard() para validar (5)
      → api.js — interceptor adiciona Authorization: Bearer token (6)
      → [Backend] JwtFilter.doFilterInternal() (7)
        → extrai JWT do header Authorization
        → JwtService.extractEmail(jwt) (8)
        → UsuarioRepository.existsByEmail() + JwtService.isTokenValid() (9)
        → SecurityContextHolder.setAuthentication() (10)
      → [Backend] HabitoController.getDashboard() — retorna 200 (11)
    → setIsAuthenticated(true) (12)
    → Se 401: interceptor de response → clearAuthToken() → redirect /login (13)
```

---

#### FLUXO 4 — Home / Dashboard (`GET /dashboard`)

```
HomeScreen monta (1)
  → useEffect → loadData() (2)
    → api.getDashboard() (3)
      → interceptor adiciona Bearer token (4)
      → GET /api/dashboard (5)
        → [Backend] JwtFilter valida token (6)
        → [Backend] HabitoController.getDashboard() → email do SecurityContext (7)
        → [Backend] HabitoService.listarDashboard(email) (8)
          → HabitoRepository.findAllByUsuarioId() — WHERE ativo = true (9)
          → para cada hábito: StatusHabitoRepository.findById() (10)
          → mapeia para HabitoResponseDTO[] (11)
        → Response: DashboardResponseDTO { habits, limite_habitos_ativos } (12)
    → sort: COMPLETED vai para o final, ordena por proximo_vencimento (13)
    → setLocalHabits(data) (14)
  → 0 hábitos: tela de boas-vindas dedicada, distinta do slide de criação (14a)
  → carrossel renderiza HabitSlide por hábito, com o gatilho abaixo do título quando preenchido (15)
  → getAvatarExpression(habit) — calcula diffMin para expressão do avatar (16)
  → handleScroll → setActiveIndex → setCurrentHabit(localHabits[i]) (17)
  → menu "⋮" no cartão: Editar (leva a /create com o hábito no location.state) ou
    Arquivar (DELETE /habits/{id}, com confirmação explicando que o histórico é
    preservado e a vaga é liberada) (18)
```

**Expressões do avatar por `diffMin`:**

| Condição | Expressão | Avatar |
|---|---|---|
| `status === 'COMPLETED'` | feliz | imagem gotinha feliz / emoji ✨ |
| `diffMin > 120` | normal | imagem gotinha normal / emoji 🌱 |
| `0 < diffMin <= 120` | preocupado | emoji 😰 |
| `-60 <= diffMin <= 0` | desesperado | emoji 😱 |
| `diffMin < -60` | falha | emoji ☠️ |

---

#### FLUXO 5 — Pré-Tarefa / Priming (`GET /habits/{id}/priming`)

```
BottomNav — botão Play pressionado (1)
  → handlePlay() (2)
    → se !activeHabit: addToast('Nenhum hábito selecionado', 'error') (3)
    → se isCompleted: addToast('Tarefa já concluída!', 'success') (4)
    → senão: navigate('/pretask') (5)
PreTask monta (6)
  → useEffect — se !currentHabit: navigate('/home') (7)
  → exibe o NOME do hábito em destaque e, se preenchido, o gatilho (com âncora ⚓)
    acima da frase motivacional (7a)
  → api.getPreTaskPriming(currentHabit.id) (8)
    → GET /api/habits/{id}/priming com Bearer token (9)
      → [Backend] HabitoController.getPriming(id) (10)
      → [Backend] GamificacaoService.obterPriming(id) (11)
        → HabitoRepository.findById() (12)
        → BibliotecaTextoRepository.findByCategoriaAndIdioma(categoria, "pt-BR") (13)
        → texto vem do seed de data.sql; o fallback fixo só é usado se a
          categoria não existir na biblioteca (14)
      → Response: { texto: "..." } (15)
  → setText(`"${res.data.texto}"`) (16)
  → botão ESTOU PRONTO → navigate('/execute') (17)
```

---

#### FLUXO 6 — Execução com Timer (`POST /habits/{id}/executions`)

```
ExecutionScreen monta (1)
  → useEffect: executionToken = crypto.randomUUID() (2)
  → metaOcorrenciaAtual = habit.alvo_ocorrencia_atual ?? habit.meta_base (2a)
  → hábito TEMPO: useTimer(metaOcorrenciaAtual, habitId, executionToken, isTimer=true) (3)
    → setInterval 1s → decrementa timeLeft (4)
    → document.visibilitychange oculto: pause() (5)
      → clearInterval (6)
      → storage.saveExecutionState(habitId, token, {timeLeft, isOverachieving, overachieveTime}, Date.now()) (7)
    → document.visibilitychange visível: resume() (8)
      → storage.loadExecutionState(habitId) (9)
      → isWithinTolerance(startedAt) — máx 1 hora de pausa (10)
      → compensa timeDiff, ajusta timeLeft (11)
  → hábito QUANTIDADE: contador com passo max(1, round(metaOcorrenciaAtual / 10));
    toque no número central abre entrada manual (3b)
  → timeLeft === 0 (ou quantidade >= meta): setIsOverachieving(true) + vibrate (12)
  → botão CONCLUIR visível quando isOverachieving (13)
  → handleComplete() (14)
    → pause() — salva estado final (15)
    → NÃO decide mais padrão/extra no cliente — envia só execution_token e
      valor_realizado; o servidor recalcula sozinho contra o alvo da
      ocorrência (RF22/RNF08) (16)
    → api.submitExecution(id, payload) (17)
      → POST /api/habits/{id}/executions com Bearer token (18)
        → [Backend] HabitoController.executeHabit() (19)
        → [Backend] GamificacaoService.processarExecucao() (20)
          → HistoricoExecucaoRepository.existsByExecutionToken() — idempotência (21)
          → recalcula bônus: valor_realizado >= alvo_da_ocorrência * 1.2 (22)
          → atualiza execucoesHoje; diasSeguidos só sobe quando a ÚLTIMA
            ocorrência do dia é concluída (23)
          → proximo_vencimento passa a apontar para a próxima ocorrência
            pendente do dia, não para o fim do dia (23a)
          → StatusHabitoRepository.update(status) (24)
          → HistoricoExecucaoRepository.save(historico) (25)
        → Response: { moedas_ganhas, moedas_totais, dias_seguidos, novo_nivel, texto_feedback, bonus } (26)
    → storage.clearExecutionState(habitId) (27)
    → navigate('/success', { state: { bonus: res.data.bonus, feedback: res.data } }) (28)
```

---

#### FLUXO 7 — Desistência (`POST /habits/{id}/executions` tipo FAIL)

Este é o único fluxo com **dois desfechos distintos**, decididos pelo `tipo` enviado.

```
ExecutionScreen — botão "Desistir" (1)
  → pause() → showGiveUpModal = true (2)
  → GiveUpModal renderiza as opções (3)
      "Usar Escudo" só aparece se bloqueios_acumulados > 0
  → usuário escolhe (4)
      FAIL_BLOQUEIO  (usar escudo)   ou   FAIL_TIMEOUT (assumir a falha)
  → handleGiveUp(type) (5)
    → pause() (6)
    → payload: { execution_token, tipo, valor_realizado: <parcial já feito> } (7)
    → api.submitExecution(id, payload) (8)
      → POST /api/habits/{id}/executions (9)
        → [Backend] GamificacaoService.processarExecucao() (10)
          │
          ├── tipo = FAIL_BLOQUEIO (11a)
          │     → se bloqueios_acumulados <= 0 → erro 400 "Nenhum escudo disponível" 
          │     → se bloqueio_usado_hoje       → erro 400 "Escudo já utilizado hoje"
          │     → bloqueios_acumulados -= 1
          │     → bloqueio_usado_hoje = true
          │     → dias_seguidos PRESERVADO
          │     → feedback: "Ofensiva protegida pelo escudo!"
          │
          └── tipo = FAIL_TIMEOUT (11b)
                → dias_seguidos = 0
                → feedback: "Ofensiva zerada. Recomece amanhã!"
          
          → StatusHabitoRepository.update(status) (12)
          → HistoricoExecucaoRepository.save(historico) (13)
        → Response: { moedas_ganhas: 0, dias_seguidos, texto_feedback } (14)
    → storage.clearExecutionState(habitId) (15)
    → navigate('/fail', { state: { type, feedback: res.data } }) (16)
Fail lê state.type e escolhe a apresentação (17)
    FAIL_BLOQUEIO → "Protegido!"      fundo âmbar,  ícone ShieldAlert
    FAIL_TIMEOUT  → "Tempo Esgotado"  fundo vermelho, ícone Clock
```

> **O escudo é a única mecânica que protege a ofensiva.** `FAIL_BLOQUEIO` consome um escudo
> (comprado por 1500 moedas) e mantém `dias_seguidos` intacto; `FAIL_TIMEOUT` zera. A flag
> `bloqueio_usado_hoje` impede gastar mais de um escudo por dia no mesmo hábito, e é reposta pelo
> [Fluxo 14](#fluxo-14--fechamento-diário-sem-origem-no-frontend) na virada do dia.
>
> **Os quatro valores de `tipo` são fechados.** `COMPLETE_PADRAO`, `COMPLETE_EXTRA`,
> `FAIL_BLOQUEIO` e `FAIL_TIMEOUT`. Qualquer outro valor lança exceção no service.

---

#### FLUXO 8 — Tela de Sucesso (sem chamada à API)

```
Success monta (1)
  → location.state.bonus → booleano de bônus (2)
  → location.state.feedback → { moedas_ganhas, dias_seguidos, texto_feedback } (3)
  → renderiza partículas com useMemo (50 partículas geradas) (4)
  → exibe: emoji, título, subtítulo, card de recompensas (5)
  → botão VOLTAR → navigate('/home') (6)
```

---

#### FLUXO 9 — Tela de Falha (sem chamada à API)

```
Fail monta (1)
  → location.state.type → 'FAIL_TIMEOUT' | 'FAIL_BLOQUEIO' | 'BLOCK_ACTIVE' (2)
  → location.state.feedback → { texto_feedback, moedas_ganhas } (3)
  → seleciona ícone, título, subtítulo e cor de fundo por tipo (4)
  → botão CONTINUAR → navigate('/home') (5)
```

---

#### FLUXO 10 — Estatísticas (`GET /stats/weekly`)

```
Stats monta (1)
  → currentHabit do CurrentHabitContext (2)
  → se !currentHabit: renderiza EmptyState (3)
  → setLoading(true) → api.getWeeklyStats(currentHabit.id) (4)
    → GET /api/stats/weekly?habitoId={id} com Bearer token (5)
      → [Backend] StatsController.getWeeklyStats() (6)
      → [Backend] StatsService.obterEstatisticasSemanais() (6a)
        → HistoricoExecucaoRepository — agrega por dia, últimos 7 dias (6b)
        → completa os 7 dias mesmo sem execução (valor 0) (6c)
  → Response: StatsResponseDTO { dias, recorde, dias_com_meta_cumprida, constancia_semanal_percentual } (7)
  → todo dia sem execução E sem desistência (7 dias inteiros): estado vazio
    dedicado ("Ainda não há execuções registradas...") (7a)
  → recharts BarChart renderiza uma barra por dia; dia com `parcial: true`
    (desistência/escudo) usa cor diferente das barras de conclusão (8)
  → StatCards: recorde e percentual de constância semanal (RF17) (9)
```

---

#### FLUXO 11 — Loja / Compra de Escudo (`POST /habits/{id}/shield`)

```
Store monta (1)
  → loadHabits() → api.getDashboard() (2)
    → GET /dashboard — mesmo fluxo do dashboard (3)
  → activeHabits = habits.filter(h => h.status !== 'ARCHIVED' && !== 'COMPLETED') (4)
  → Select renderiza hábitos com moedas_locais (5)
  → usuário seleciona hábito → setSelectedHabitId(id) (6)
  → botão Comprar → handleBuyShield() (7)
    → valida selectedHabitId (8)
    → api.buyShield(selectedHabitId) (9)
      → POST /api/habits/{id}/shield com Bearer token (10)
        → [Backend] HabitoController.buyShield(id) (11)
        → [Backend] GamificacaoService.comprarEscudo(id) (12)
          → StatusHabitoRepository.findById() (13)
          → valida moedas_locais >= 1500 (14)
          → moedas_locais -= 1500 (15)
          → bloqueios_acumulados += 1 (16)
          → StatusHabitoRepository.update(status) (17)
        → Response: { success: true, message: "Escudo comprado!" } (18)
    → addToast('Escudo comprado!', 'success') (19)
    → setSelectedHabitId('') → loadHabits() (20)
```

---

#### FLUXO 12 — Perfil / Atualização (`PUT /profile`)

```
Profile monta (1)
  → formData inicial: nome vem de AuthContext.user.name (persistido no login) (2)
  → handleUpdate(e) chamado no submit (3)
    → monta payload em snake_case: { nome, fuso_horario,
      ...(senha_atual + nova_senha) se novaSenha preenchida } (4)
    → api.updateProfile(payload) (5)
      → PUT /api/profile com Bearer token (6)
        → [Backend] ProfileController.updateProfile() → email do SecurityContext (7)
        → [Backend] UsuarioService.atualizarPerfil() (8)
          → UsuarioRepository.findByEmail() (9)
          → atualiza nome e fusoHorario se fornecidos (10)
          → se novaSenha: valida senha_atual com BCrypt.matches() (11)
          → BCrypt.encode(novaSenha) → setSenhaHash() (12)
          → UsuarioRepository.update(usuario) (13)
        → Response: { success: true } (14)
    → updateLocalUser({ name }) — reflete o nome novo no AuthContext (15)
    → addToast('Perfil atualizado!', 'success') (16)
    → limpa campos de senha (17)
```

---

#### FLUXO 13 — Criar Hábito (`POST /habits`)

```
CreateHabit monta — step = 1 (modo criar) ou step = 3 pré-preenchido (modo editar,
  ativado por location.state.editHabit vindo do menu "Editar" da Home) (1)
  → Etapa 1: usuário toca num molde — AGUA / ESTUDO / EXERCICIO (carrossel com
    scroll-snap, cartão ativo centralizado, navegável por teclado) (2)
    → setMolde(m) → NextButton → setStep(2) (3)
  → Etapa 2: card estático "Calibração Automática — Em breve" (não clicável) ao
    lado de "Preencher Manualmente" — único caminho ativo (4)
    → setStep(3) (5)
  → Etapa 3: formulário — nome do hábito (até 60 caracteres, pré-preenchido com
    o nome do molde), gatilho (opcional, até 120), meta_base, incremento,
    dias_incremento, meta_maxima, frequencia_semanal (máscara de 7 dígitos,
    bloqueia envio com 0 dias), vezes_dia (1-12) e, quando > 1, um horário por
    ocorrência com o alvo calculado em tempo real (6)
    → validação campo a campo ANTES de avançar — campo vazio bloqueia o envio
      com erro no próprio campo, nunca vira 1 silenciosamente (7)
    → handleRevisar() → Etapa 4: resumo de revisão ("Você vai criar/atualizar
      [nome] com meta de [X], nos dias [Y], executando [Z] vez(es) ao dia") (8)
    → handleSave() (9)
      → setIsSubmitting(true) (10)
      → monta payload completo (11)
      → modo criar: api.createHabit(payload) → POST /api/habits (12)
      → modo editar: api.updateHabit(id, payload) → PUT /api/habits/{id} (12a)
        → [Backend] HabitoController.createHabit()/updateHabit() → email do
          SecurityContext (14)
          → [Backend] HabitoService.criarHabito()/atualizarHabito() (15)
            → UsuarioRepository.findByEmail() (16)
            → HabitoRepository.findAllByUsuarioId() — valida limite de 2 (só
              na criação) (17)
            → gera/recria as sub_atividades (uma por ocorrência) (18)
            → HabitoRepository.save()/update() (18a)
            → StatusHabitoRepository.save(status inicial) — só na criação (19)
          → Response: HabitoResponseDTO completo, ou { success: true } na
            edição (20)
      → addToast('Hábito criado/atualizado com sucesso!', 'success') (21)
      → navigate('/home') (22)
```

**Arquivar** (menu "⋮" do cartão da Home, fora deste fluxo): `DELETE /habits/{id}` faz
`HabitoRepository.archive` — `UPDATE hab_ativo = false`, nunca `DELETE`. O histórico de
execuções é preservado e a vaga entre os hábitos ativos é liberada, com confirmação explicando
os dois pontos antes de executar.

---
#### FLUXO 14 — Fechamento Diário (sem origem no frontend)

O único fluxo que **não parte de uma ação do usuário**. Um job agendado no backend faz a virada
de dia, e é o que fecha o ciclo da mecânica de hábitos diários.

```
FechamentoDiarioJob — @Scheduled(fixedRate = 1h, initialDelay = 60s) (1)
  → HabitoRepository.findAllAtivos()  — todos os hábitos ativos, de todos os usuários (2)
  → para cada hábito:
      → resolve o fuso do dono (3)
          UsuarioRepository.findById(habito.usuario_id) → usuarios.fuso_horario
          cache por usuário — vários hábitos costumam ter o mesmo dono
          fallback "America/Sao_Paulo" se nulo, vazio ou inválido
      → hoje = LocalDate.now(fusoDoUsuario) (4)
      → StatusHabitoRepository.resetarDiario(habitoId, hoje) (5)
          UPDATE status_habitos
             SET execucoes_hoje = 0, bloqueio_usado_hoje = false, ultimo_reset = ?
           WHERE habito_id = ?
             AND (ultimo_reset IS NULL OR ultimo_reset < ?)
      → só quando o dia realmente virou PARA ESTE hábito nesta passada: (5a)
          → recalcula proximo_vencimento para a próxima ocorrência (5b)
          → nivel_avatar = min(50, 1 + dias_seguidos) (5c)
          → a cada hab_dias_incremento dias seguidos de ofensiva,
            hab_meta_base += hab_incremento (respeitando hab_meta_maxima) e
            as sub_atividades são recalculadas preservando os horários (5d)
  → registra no log quantos hábitos foram efetivamente zerados (6)
```

**Ainda não implementado neste job:** consumo automático de escudo quando a meta do dia anterior
não foi cumprida (ver §11.1) — `dias_seguidos` só zera hoje pela desistência explícita
(`FAIL_TIMEOUT`, Fluxo 7), nunca por inatividade silenciosa.

**Por que roda de hora em hora, e não uma vez à meia-noite.** Cada usuário tem seu próprio
`fuso_horario`. A meia-noite acontece em instantes diferentes para cada um, então não existe um
único horário correto para disparar a apuração. Uma passada por hora cobre todos os fusos com, no
máximo, uma hora de atraso.

**Por que é seguro rodar repetidamente.** A cláusula `ultimo_reset IS NULL OR ultimo_reset < ?` é
uma guarda de idempotência: uma vez que o dia de hoje foi apurado, execuções seguintes do job não
afetam mais aquela linha. Sem isso, o job zeraria a cada hora as execuções que o usuário acabou de
registrar.

**O que acontece se o job não existir.** Foi o estado anterior do projeto: `execucoes_hoje` só
crescia e `bloqueio_usado_hoje` nunca voltava a `false`. Na prática, depois de atingir a
`meta_frequencia_diaria` uma única vez, a ofensiva parava de avançar e o escudo nunca podia ser
reutilizado — a mecânica diária não fechava o ciclo.

Um `try/catch` por hábito garante que uma linha problemática (por exemplo, com fuso inválido) não
interrompa a apuração das demais.

---
## 9. Padrão de Rastreabilidade — `@audit-ok`

Cada funcionalidade possui marcações `// @audit-ok` no código-fonte nas posições exatas onde cada etapa dos fluxos acima é implementada. O formato segue:

- `// @audit-ok [FUNCIONALIDADE]` — marca a função/método que implementa a funcionalidade
- `// @audit-ok [FUNCIONALIDADE (N)]` — marca o passo N dentro do fluxo de dados daquela funcionalidade

**Exemplo de rastreio:** O passo 17 do Fluxo 6 (Execução) — envio do POST — está marcado como `// @audit-ok [Execução Timer (17)]` em `Execution/index.jsx` e como `// @audit-ok [Execução Timer (19)]` em `HabitoController.java`, ligando diretamente o front ao back.

---

## 10. Testando a API com o Postman

O projeto inclui uma coleção Postman pronta que cobre **todos os endpoints** do backend, com scripts que salvam o token e o `habit_id` automaticamente entre as requisições.

**Arquivo:** [backend/src/main/resources/Postman/Tempo Claro.json](backend/src/main/resources/Postman/Tempo%20Claro.json)

### 10.1. Importar a coleção no Postman

1. Abra o **Postman** (desktop ou web).
2. Clique em **Import** (canto superior esquerdo).
3. Arraste o arquivo `Tempo Claro.json` para a janela **ou** clique em **files** e selecione:
   `backend/src/main/resources/Postman/Tempo Claro.json`
4. Confirme em **Import**. A coleção **"Tempo Claro — API Completa"** aparecerá na barra lateral.

### 10.2. Configurar o ambiente (variáveis)

A coleção usa variáveis (`{{base_url}}`, `{{token}}`, `{{habit_id}}`, `{{execution_token}}`). O `base_url` já vem com um valor padrão na coleção, mas o recomendado é criar um **Environment**:

1. No menu lateral, vá em **Environments** → **+** (novo ambiente).
2. Nomeie como `Local` e adicione:

   | Variável | Valor inicial |
   |---|---|
   | `base_url` | `http://localhost:8082` |
   | `token` | *(deixe vazio — preenchido automaticamente)* |

3. Selecione o ambiente **Local** no seletor do canto superior direito.

> **Porta local:** o backend sobe em `http://localhost:8082` (`server.port=8082`).
> **Produção:** troque `base_url` por `https://tempo-claro-tcc-tsi.onrender.com`.
> O caminho base da API é `/api` (a coleção **não** usa `/v1`).

### 10.3. Fluxo de teste sugerido

O token JWT é salvo automaticamente em `{{token}}` pelos scripts de **Register** e **Login**, e todas as demais requisições já enviam `Authorization: Bearer {{token}}`. Rode nesta ordem:

1. **01 - Auth** → `Register (Cadastro)` — cria a conta e salva o token. *(Retorna 201.)*
2. **01 - Auth** → `Login` — se já tiver conta, salva o token.
3. **03 - Hábitos (CRUD)** → `Create Habit` — cria um hábito e salva o `{{habit_id}}`. *(Retorna 201.)*
4. **02 - Dashboard** → `Get Dashboard` — lista os hábitos (também repõe o `{{habit_id}}`).
5. **05 - Priming** → `Get Priming Text` — texto motivacional do hábito.
6. **04 - Execuções** → `Execute Habit — Sucesso / Extra / Falha` — o `execution_token` (UUID) é gerado automaticamente a cada envio.
7. **07 - Perfil** → `Update Profile` — atualiza nome, fuso ou senha.
8. **08 - Estatísticas** → `Get Weekly Stats` — retorna `[]` (stub).
9. **06 - Escudo** → `Buy Shield` — exige **1500 moedas** no hábito (em conta nova retorna `400 Saldo insuficiente`, o que é esperado).
10. **03 - Hábitos (CRUD)** → `Delete Habit` — desativa o hábito (rode **por último**).
11. **09 - Cenários de Erro** — testes negativos (token ausente/inválido, senha errada, e-mail duplicado, ID inexistente).

### 10.4. Cobertura da coleção

| Pasta | Método | Endpoint |
|---|---|---|
| 01 - Auth | POST | `/api/auth/register` · `/api/auth/login` |
| 02 - Dashboard | GET | `/api/dashboard` |
| 03 - Hábitos | POST / PUT / DELETE | `/api/habits` · `/api/habits/{id}` |
| 04 - Execuções | POST | `/api/habits/{id}/executions` |
| 05 - Priming | GET | `/api/habits/{id}/priming` |
| 06 - Escudo | POST | `/api/habits/{id}/shield` |
| 07 - Perfil | PUT | `/api/profile` |
| 08 - Estatísticas | GET | `/api/stats/weekly` |
| 09 - Cenários de Erro | vários | respostas 4xx esperadas |

> **Valores aceitos em `tipo`** (execução): `COMPLETE_PADRAO` (+100 moedas), `COMPLETE_EXTRA` (+150 moedas), `FAIL_TIMEOUT` e `FAIL_BLOQUEIO` (zeram a ofensiva). Qualquer outro valor retorna `400`.
>
> **Dica:** use **Run collection** (botão ▶ na coleção) para executar toda a suíte de uma vez e ver os testes passando na aba *Test Results*.


---

## 11. Limitações Conhecidas

Esta seção registra, de forma deliberada, o que **não** está implementado ou está implementado
parcialmente. O objetivo é que a documentação descreva o sistema como ele é, e não como se
pretendia que fosse.

### 11.1. Funcionalidades incompletas

| Item | Situação |
|---|---|
| **"Medir Dificuldade"** | Segundo passo do assistente em `CreateHabit`. Decisão D4: trabalho futuro. Hoje é um card estático "Calibração Automática — Em breve", não clicável — o preenchimento manual é o único caminho ativo. |
| **Dias da semana** | Agora tem coluna (`hab_frequencia_semanal`) e campo no DTO, e o formulário envia a máscara de verdade — **não é mais uma limitação**. |
| **Seletor de idioma** | Botão fixo "🇧🇷 PT" no `Login` e no `Profile`. Não há i18n; `usuarios.preferencia_idioma` é gravada mas nunca lida. |
| **Editar e arquivar hábito** | Implementado — menu "⋮" no cartão da Home leva à edição (reaproveitando o Passo 3 do assistente, pré-preenchido) ou ao arquivamento (soft delete, com confirmação). |
| **Excluir conta** | Não implementado em nenhuma camada. |
| **`PwaPauseModal`** | Removido do código — `useTimer` já pausa/retoma sozinho via `visibilitychange`, sem prompt ao usuário. |
| **Consumo automático de escudo** | Decisão D2: implementar. A coluna/CHECK já existem (`his_tipo_sucesso IN (..., 'PROTEGIDO_AUTOMATICO')`) e a Loja já não promete mais o comportamento (texto corrigido), mas o `FechamentoDiarioJob` ainda não consome escudo nem preserva `dias_seguidos` quando a meta do dia anterior não foi cumprida — ver Fluxo 14. |
| **Questionário de calibração** | Tabelas `calibracoes`/`calibracao_respostas` reservadas no schema, sem nenhum código que as use — trabalho futuro (D4), mesmo item de "Medir Dificuldade" acima. |

### 11.2. Campos que passaram a ter uso

Estes campos apareciam aqui como "gravados mas nunca lidos" numa versão anterior deste documento.
Hoje têm regra de negócio real:

| Coluna | Situação atual |
|---|---|
| `habitos.gatilho_ancora` | Exibida no cartão da Home (abaixo do título) e na Pré-Tarefa (acima da frase motivacional), quando preenchida. Consta do `HabitoResponseDTO`. |
| `status_habitos.proximo_vencimento` | Calculado na criação, após cada execução e na virada do dia — aponta para a próxima ocorrência pendente, não para o fim do dia. As quatro expressões do avatar e os balões de urgência dependem dele e funcionam. |
| `status_habitos.nivel_avatar` | Recalculado no fechamento diário (`1 + dias_seguidos`, teto de serviço em 50) e exposto no DTO. A variação visual (v1-v5) ainda é trabalho futuro — nenhuma tela a usa hoje. |

Ainda sem uso em código, sem mudança desde a versão anterior:

| Coluna | Situação |
|---|---|
| `usuarios.preferencia_idioma` | Gravada com o literal `"pt-BR"` no cadastro. `obterPriming` passa o literal `"pt-BR"` em vez de consultar esta coluna. |
| `usuarios.criado_em` · `habitos.criado_em` | Gravadas e mapeadas pelos `RowMapper`, nunca consumidas nem expostas. |
| `biblioteca_textos.texto_sucesso_padrao` · `texto_sucesso_extra` · `texto_aviso_urgencia` | Populadas pelo seed e mapeadas pelo `RowMapper`, mas **nunca consumidas**: os textos equivalentes estão fixos no `GamificacaoService` (`"Execução registrada!"`, `"Desempenho excelente!"`). Ligar essas colunas ao código é uma melhoria de baixo custo. |
| `status_habitos.sta_recorde_dias` · `sta_valor_acumulado_hoje` | Colunas do schema sem campo Java correspondente ainda. |

### 11.3. Segurança

| Item | Descrição |
|---|---|
| **IDOR** | Os endpoints `PUT`/`DELETE /habits/{id}`, `/executions`, `/shield` e `/priming` **não verificam se o hábito pertence ao usuário do token**. Qualquer usuário autenticado que conheça o UUID de um hábito alheio pode alterá-lo, executá-lo ou arquivá-lo. A correção é comparar `habito.usuario_id` com o usuário do `SecurityContextHolder` — o padrão já usado em `criarHabito` e `listarDashboard`. |
| **`jwt.secret` no valor padrão** | `JwtService` declara um default embutido no código, e **nenhum dos três `.properties` define a chave**. Em produção, portanto, os tokens são assinados com uma chave que está versionada no repositório. |
| **Credenciais em texto plano** | `application-prod.properties` contém usuário e senha do banco da Neon versionados. |
| **Senhas no log** | `RequestLoggingFilter` imprime o corpo completo das requisições e está **ligado por padrão** (`matchIfMissing = true`), inclusive em produção. Isso inclui as senhas em claro de `/auth/login`, `/auth/register` e `/profile`. Os cabeçalhos sensíveis são mascarados, mas o corpo não. |
| **CORS irrestrito** | `allowedOrigins("*")` no `SecurityConfig`. |
| **`/h2-console` liberado** | `permitAll` remanescente da época do H2. O console não está habilitado hoje, mas a regra continua na cadeia de segurança. |

### 11.4. Qualidade e infraestrutura

| Item | Descrição |
|---|---|
| **Cobertura de teste mínima** | `backend/src/test/` existe (1 classe, 7 testes JUnit, cobrindo geração de sub-atividades). O `Dockerfile` ainda compila com `-x test` — os testes não rodam no build de produção. No frontend não há framework de teste nem script; a validação é manual. |
| **Zero CI** | Não há `.github/workflows`. Os deploys em Render e Vercel são disparados manualmente pelos painéis. |
| **`baseURL` do frontend** | `import.meta.env.DEV` escolhe entre `localhost:8080` (em `npm run dev`) e a URL do Render (no bundle de produção) — ver §7.6. Resolvido para desenvolvimento local; o bundle publicado continua com a URL do Render embutida, sem variável de ambiente própria. |
| **Chave AES versionada** | `utils/storage.js` usa `VITE_CRYPTO_SECRET` com fallback para um literal no código. Como não há `.env`, o literal é sempre o usado. Vale notar que uma chave embutida no bundle JavaScript não é secreta de qualquer forma — a criptografia aqui dificulta a leitura casual do `localStorage`, não protege contra um atacante. |
| **N+1 no dashboard** | `HabitoService.listarDashboard` faz uma consulta para listar os hábitos e depois duas por hábito (`habitos` + `status_habitos`). Um `JOIN` resolveria em uma consulta. |
| **`IllegalArgumentException` → 401** | O `GlobalExceptionHandler` mapeia essa exceção para 401 por causa do fluxo de login. Como `GamificacaoService` usa a mesma exceção para `tipo` inválido, **enviar um tipo desconhecido retorna 401 em vez de 400**. |
| **`backend/bin/` versionado** | Artefatos `.class` do Eclipse commitados por engano, com um `application.properties` obsoleto da era H2. |
| **PWA nominal** | O `index.html` tem "PWA" no título, mas não referencia `manifest.webmanifest`, não registra service worker, e o manifesto órfão aponta para ícones fora de `public/`. |

### 11.5. Sobre a arquitetura mobile

O `frontend/` empacotado pelo Capacitor é um **WebView**, não um aplicativo nativo — e essa
limitação motivou a migração para `mobile/` (React Native + Expo, `PLANO_MIGRACAO_EXPO.md`). Esta
seção descrevia, numa versão anterior, os dois problemas que essa arquitetura WebView carregava.
Com a migração feita (código completo, teste físico ainda pendente — ver §2), o retrato muda para
cada um dos dois pontos:

- **Cronômetro em segundo plano — resolvido no app nativo.** O `frontend/` (WebView) compensa o
  tempo decorrido escutando `visibilitychange`, o que só funciona enquanto o sistema mantém o
  WebView vivo. O `mobile/` reescreveu `useTimer` sobre um **deadline absoluto** (`Date.now() +
  segundos`, não mais um decremento por tick) com `AppState` do React Native no lugar de
  `visibilitychange`: `pause`/`resume` só persistem e releem esse instante fixo, sem aritmética de
  "quanto tempo passou". Cobre inclusive o caso que o WebView não tinha como tratar — o processo
  sendo **morto** pelo sistema em segundo plano, não só pausado: ao reabrir, o hook confere o
  estado salvo antes de reativar o cronômetro, dentro da mesma tolerância de 1 hora que já existia.
- **Notificações locais — ainda não implementadas, mas agora possíveis.** A migração **remove a
  barreira técnica** (o `capacitor.plugins.json` vazio do WebView não dava acesso a nenhum recurso
  nativo; o Expo tem `expo-notifications` disponível) — mas nenhuma tarefa da migração implementou
  notificações de fato. O app `mobile/` continua sem avisar o usuário sobre um prazo com o app
  fechado, exatamente como o `frontend/`. É trabalho futuro genuíno, não mais bloqueado por
  arquitetura.

O backend não precisou de nenhuma alteração para viabilizar isso — é REST puro e agnóstico de
cliente, e a migração inteira trocou só a camada de apresentação.

---

## Licença e uso

Trabalho acadêmico desenvolvido para avaliação no curso de Tecnologia em Sistemas para Internet do
IFSul — Campus Pelotas. O código está disponível para consulta e fins educacionais.
