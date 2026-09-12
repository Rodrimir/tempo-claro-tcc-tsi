# Tempo Claro

> Rastreador de hábitos gamificado — Trabalho de Conclusão de Curso
> Tecnologia em Sistemas para Internet · IFSul Campus Pelotas · 2026/1

**Apesar do nome, este não é um aplicativo de meteorologia.** "Tempo Claro" é uma metáfora: o
usuário cultiva hábitos diários e, ao mantê-los, "abre o tempo" da própria rotina. O sistema
permite manter até 5 hábitos ativos, executar cada um com cronômetro ou contador, ganhar moedas
por execução e construir uma ofensiva (sequência de dias consecutivos). Moedas compram escudos,
que protegem a ofensiva em um dia de falha.


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
| **Backend** | Java 17 + **Spring Boot 4.1.0** + Maven + Docker | Render | `https://tempo-claro-tcc-tsi.onrender.com/api` |
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

**Persistência por JPA/Hibernate, no estilo do projeto de referência da disciplina
(`tds_app_exemplo`).** O backend nasceu em `JdbcTemplate` puro (SQL em constante `String` +
`RowMapper` manual) e foi migrado para Spring Data JPA em setembro de 2026
em setembro de 2026. Hoje: 8 entidades anotadas (`@Entity`) e 8 repositórios como interface `JpaRepository` —
zero `RowMapper`, zero SQL em constante. Onde o Spring Data não consegue derivar a consulta pelo
nome do método, o SQL nativo fica **direto na anotação do método** (`@Query(nativeQuery = true)`),
nunca numa variável — é o mesmo padrão que o `ProdutoRepository` do projeto de referência usa.

**`ddl-auto=validate`, não `update`.** Esta é a decisão mais importante da migração, e é a única
divergência deliberada do projeto de referência (que usa `update`). O `schema.sql` continua sendo
a fonte da verdade do banco (`spring.sql.init.mode=always`, ver abaixo); o Hibernate só **confere**
se as entidades batem com as tabelas reais e recusa subir se divergirem. A razão é que o banco
tem coisa que o Hibernate não sabe gerar sozinho: os `CHECK` de negócio, as migrações idempotentes, e
5 índices (um deles parcial). Com `update` os dois — o script e o Hibernate — brigariam pela mesma
estrutura a cada boot. Bônus: erro de mapeamento vira **erro de inicialização**, não bug silencioso
em produção — foi assim que a migração pegou, por exemplo, que `hab_frequencia_semanal` é `CHAR(7)`
no Postgres e não `VARCHAR` (a entidade correspondente usa `@JdbcTypeCode(SqlTypes.CHAR)` por causa
disso).

**Associações `@ManyToOne` sempre `LAZY`, mesmo o projeto de referência usando `EAGER`.** É a
divergência que evita piorar o N+1 que já existia (ver §11.4). Nenhum service navega essas
associações — elas existem só para o modelo ficar no formato esperado pelo JPA; toda a lógica
continua lendo por `UUID`, como sempre foi.

**Schema aplicado no boot, sem ferramenta de migração.** Não há Flyway nem Liquibase. A propriedade
`spring.sql.init.mode=always` faz o Spring executar `schema.sql` a **cada inicialização** — inclusive
o seed de `biblioteca_textos`, que mora na Seção 11 do próprio `schema.sql` (não existe mais um
`data.sql` separado). Isso só é seguro porque todo o DDL usa `CREATE TABLE IF NOT EXISTS` e o seed
usa `ON CONFLICT DO NOTHING` — ou seja, a execução é idempotente.

**Autenticação stateless por JWT, emitido e validado pelo OAuth2 Resource Server nativo do Spring
Security.** Não há sessão no servidor (`SessionCreationPolicy.STATELESS`). Cada requisição
autenticada carrega um token `Bearer` HS512 cujo *subject* é o e-mail do usuário — o formato do
token não mudou com a migração, só quem o gera (`TokenService`/`JwtEncoder`) e quem o valida
(`JwtDecoder` + `CustomJwtAuthenticationConverter`, que busca o `Usuario` no banco e monta a
autenticação). Como a API é REST pura e agnóstica de cliente, o mesmo backend serve o navegador e
o APK Android sem nenhuma diferença.

**Mobile por WebView.** O Capacitor empacota o build do Vite dentro de um `WebView` numa
`BridgeActivity` do Android. Não é um aplicativo nativo: a interface é HTML renderizada. O
`capacitor.plugins.json` está vazio (`[]`), então nenhum recurso nativo é utilizado — a única
permissão declarada no manifesto é `INTERNET`.

---

## 3. Mapa de Diretórios

```
tempo-claro-tcc-tsi/
├── README.md                        Este documento — especificação técnica completa
├── docs/
│   ├── TempoClaro_Monografia.txt    A especificação final: em qualquer divergência, ela decide
│   ├── ATUALIZACOES_MONOGRAFIA.md   O que precisa ser corrigido na monografia, e por quê
│   └── schema-consolidado.sql       Retrato do banco, sem as migrações — para consulta e para a Figura 9
├── .gitignore                       Artefatos de build, node_modules e arquivos .env
├── .vscode/settings.json            Configura a extensão Inline Bookmarks (exibe os @audit-ok)
├── backend/                         API REST em Spring Boot
├── frontend/                        Aplicação React + wrapper Android (Capacitor)
├── mobile/                          Aplicativo React Native + Expo
├── PLANO_MIGRACAO_EXPO.md           Plano da migração do WebView para o app nativo
└── PLANO_CORRECOES_EXPO.md          Correções pendentes do app nativo
```

> **A monografia é a fonte da verdade do produto.** Este README descreve o sistema como ele está
> implementado; quando os dois discordam, quem decide é a monografia. As divergências encontradas na
> última auditoria — e o que cada uma exige do texto dela — estão em
> [`docs/ATUALIZACOES_MONOGRAFIA.md`](docs/ATUALIZACOES_MONOGRAFIA.md).

### 3.1. `backend/`

#### Infraestrutura e build

| Arquivo | O que configura |
|---|---|
| `pom.xml` | Spring Boot **4.1.0**, Java **17**, `groupId` `com.rodrigo`, `artifactId` `tempo-claro`. Dependências: `spring-boot-starter-webmvc`, `-validation`, `-data-jpa`, `-security`, `-security-oauth2-resource-server`, `spring-boot-restclient`, `springdoc-openapi-starter-webmvc-ui`, Lombok, driver PostgreSQL. Sem `spring-boot-starter-data-rest` de propósito — expõe endpoint automático a partir de repository, o que violaria o contrato da API. |
| `mvnw` · `mvnw.cmd` · `.mvn/wrapper/` | Maven Wrapper 3.3, resolve `apache-maven-3.9.16` sozinho — não precisa de Maven instalado na máquina. |
| `Dockerfile` | Build multi-stage: compila em `maven:3.9-amazoncorretto-17` com `mvn package -DskipTests` e executa em `amazoncorretto:17-alpine`. `-DskipTests` continua necessário porque os testes de integração abrem conexão real com Postgres, indisponível no estágio de build isolado. Define `SPRING_PROFILES_ACTIVE=prod` e expõe a porta 8080. |
| `compose.yaml` | Três serviços: `db` (postgres:16-alpine, porta **5433**→5432, healthcheck `pg_isready`, monta `db-init/` para criar `backend_db_teste`), `app` (build local, porta **8082**, perfil `docker`) e `pgadmin` (porta **8093**). |
| `.run/*.run.xml` | Duas run configurations do IntelliJ versionadas — ver Opção C, abaixo. |

#### Código-fonte — `src/main/java/com/rodrigo/backend2java/`

Organizado **por feature** (um pacote por domínio, entidade + DTOs + repository + service +
controller juntos), no formato do projeto de referência da disciplina — não mais por camada
técnica.

```
├── BackEndIiApplication.java        Classe main. @SpringBootApplication + @EnableScheduling
│                                    (é o @EnableScheduling que liga o FechamentoDiarioJob)
│
├── autenticacao/
│   ├── AuthController.java          POST /api/auth/login · POST /api/auth/register
│   ├── AuthService.java             autenticar (via AuthenticationManager) · cadastrar
│   ├── AutenticacaoService.java     implements UserDetailsService — usado pelo AuthenticationManager
│   ├── AutenticacaoRepository.java  Repository<Usuario,UUID> puro, só findByEmail
│   ├── LoginRequestDTO.java · RegisterRequestDTO.java · AuthResponseDTO.java
│
├── usuario/
│   ├── Usuario.java                 @Entity (tabela usuarios), implements UserDetails
│   ├── UsuarioRepository.java       JpaRepository — findByEmail/existsByEmail derivados;
│   │                                atualizarPerfil é @Query nativa (carimba usu_atualizado_em)
│   ├── UsuarioService.java · ProfileController.java · ProfileUpdateDTO.java · UsuarioResponseDTO.java
│
├── habito/
│   ├── Habito.java                  @Entity (tabela habitos)
│   ├── AcessoHabitoService.java     confere se o hábito é do usuário do token (RF22/RNF08)
│   ├── SubAtividade.java            @Entity (tabela sub_atividades)
│   ├── HabitoRepository.java · SubAtividadeRepository.java
│   ├── HabitoService.java · HabitoController.java · FechamentoDiarioJob.java
│   ├── ProximoVencimentoService.java
│   ├── HabitoRequestDTO.java · HabitoResponseDTO.java · DashboardResponseDTO.java
│
├── execucao/
│   ├── StatusHabito.java            @Entity (tabela status_habitos, PK = FK de habitos)
│   ├── HistoricoExecucao.java       @Entity (tabela historico_execucoes)
│   ├── StatusHabitoRepository.java  resetarDiario é @Query nativa — idempotência (ver §11.4)
│   ├── HistoricoExecucaoRepository.java  as 2 agregações de 7 dias são @Query nativa + interface projection
│   ├── GamificacaoService.java · ExecutionRequestDTO.java · ExecutionResponseDTO.java · PrimingResponseDTO.java
│
├── stats/
│   └── StatsController.java · StatsService.java · StatsResponseDTO.java · DiaStatsDTO.java
│
├── biblioteca/  · calibracao/  · push/
│   └── Entidades/repositórios sem uso em regra de negócio (ver §4 e o cabeçalho do schema.sql)
│
└── infra/
    ├── doc/SpringDocConfiguration.java     Swagger — bearerAuth + Info, sem @Operation em endpoint
    │                                       nenhum (introspecção automática, como o projeto de referência)
    ├── security/SecurityConfig.java        OAuth2 Resource Server, CORS liberado, CSRF off, STATELESS
    ├── jwt/{JwtConfig,TokenService,CustomJwtAuthenticationConverter}.java
    │                                       JwtEncoder/JwtDecoder nativos do Spring Security. HS512
    ├── exception/{GlobalExceptionHandler,MessageResponseDTO}.java
    ├── log/RequestLoggingFilter.java       Imprime no console cada requisição (ver §11 — Segurança)
    └── util/ZonaUsuario.java
```

#### Recursos — `src/main/resources/`

| Arquivo | Conteúdo |
|---|---|
| `schema.sql` | DDL das 8 tabelas (`CREATE TABLE IF NOT EXISTS`) + as migrações idempotentes (Seção 9) + o seed de `biblioteca_textos` (Seção 11, `ON CONFLICT DO NOTHING`) — não existe mais `data.sql` separado, nem view. Executado a cada boot; é a fonte da verdade que o `ddl-auto=validate` confere. |
| `application.properties` | Perfil padrão (execução local direta): Postgres em `localhost:5433`, porta 8082, `spring.jpa.hibernate.ddl-auto=validate`. |
| `application-docker.properties` | Perfil `docker`: Postgres em `db:5432` (rede do compose), porta 8082. |
| `application-prod.properties` | Perfil `prod`: Postgres da Neon com `sslmode=require`, porta `${PORT:8080}`. |
| `Postman/Tempo Claro.json` | Coleção Postman com 9 pastas cobrindo todos os endpoints (ver §10). |

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

PostgreSQL 16, oito tabelas com prefixo por tabela (`usu_`, `hab_`, `sub_`, `sta_`, `his_`,
`bib_`, `cab_`, `cal_`, `dis_`). O schema é aplicado por
[`backend/src/main/resources/schema.sql`](backend/src/main/resources/schema.sql) a cada
inicialização.

Esse arquivo é **incremental**: além do DDL, carrega a Seção 9 de migrações idempotentes, que leva
um banco de uma versão anterior até a atual. É o que o servidor precisa, e é ruído para quem só
quer ler a estrutura. Para isso existe
[`docs/schema-consolidado.sql`](docs/schema-consolidado.sql) — o mesmo banco **sem** as migrações,
que é o retrato a usar na documentação e no modelo de dados da monografia. Não é uma segunda cópia
mantida à mão: a equivalência entre os dois é verificada aplicando cada um num banco vazio e
comparando os `pg_dump` (o comando está no cabeçalho do arquivo).

> **O schema é a fonte da verdade, e esta seção não a duplica.** Uma versão anterior deste
> documento descrevia coluna por coluna, e envelheceu: descrevia cinco tabelas sem prefixo que já
> não existiam. Havia ainda duas outras cópias do arquivo (em `docs/` e na raiz), que também já
> tinham divergido entre si — as duas foram removidas. Aqui ficam só o modelo e as decisões; os
> tipos, defaults e `CHECK` estão comentados no próprio `schema.sql`.

### 4.0. Visão geral do modelo

```
        usuarios ─────────────┬─────────────────┐
           │ 1                │ 1               │ 1
           │ N                │ N               │ N
        habitos            calibracoes     dispositivos_push
           │ 1                │ 1
           ├── 1 status_habitos   (PK = hab_id)
           ├── N sub_atividades   (as ocorrências do dia)
           ├── N historico_execucoes
           └── N calibracao_respostas (via calibracoes)

        biblioteca_textos — tabela de consulta, sem FK (categoria + idioma)
```

- **`usuarios` 1:N `habitos`** — no máximo **2 hábitos ativos** por usuário (RF03), regra aplicada
  em `HabitoService.LIMITE_HABITOS_ATIVOS`, não no banco.
- **`habitos` 1:1 `status_habitos`** — a chave primária de `status_habitos` **é** `sta_habito_id`.
  A linha nasce junto com o hábito, na mesma transação. É onde vive a economia isolada: moedas,
  escudos, ofensiva, nível do avatar e os contadores do dia.
- **`habitos` 1:N `sub_atividades`** — uma linha por ocorrência diária. **A contagem dessas linhas
  É a frequência diária do hábito** — não existe coluna duplicando esse número, e a soma dos
  `sub_alvo` sempre fecha com `hab_meta_base`.
- **`habitos` 1:N `historico_execucoes`** — registro append-only de cada execução, com
  `his_execution_token UNIQUE` (idempotência, RF21/RNF09) e `his_sub_atividade_id` apontando para a
  ocorrência que foi coberta (base do rateio de moedas, RF12).
- **`calibracoes`** pertence ao **usuário**, não ao hábito: o questionário (RF20) acontece antes de
  o hábito existir. `cab_habito_id` só é preenchido se a sugestão virar hábito.
- **`biblioteca_textos`** é consultada pelo par (`categoria`, `idioma`) e é a única sem FK.

Todos os relacionamentos usam `ON DELETE CASCADE`, exceto `his_sub_atividade_id`, que é
`ON DELETE SET NULL` — reconfigurar um hábito apaga e recria as ocorrências, e o histórico precisa
sobreviver a isso.

### 4.1. Decisões do modelo

**O banco não tem view, trigger nem função.** A §4.5 da monografia é explícita: o banco guarda
fatos, estado e integridade; toda regra vive na camada de serviço. A versão anterior tinha uma view
`vw_habito_hoje` que derivava o status do dia e a frequência diária — as duas derivações voltaram
para `HabitoService.montar`. O `DROP VIEW` está na seção de migrações do `schema.sql`.

**Migrações idempotentes em vez de ferramenta de migração.** Não há Flyway nem Liquibase:
`spring.sql.init.mode=always` roda o `schema.sql` a cada boot, e todo comando é idempotente
(`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`, `ON CONFLICT DO NOTHING`). Como
`CREATE TABLE IF NOT EXISTS` **não altera** tabela existente, a Seção 9 do script concentra os
`ALTER`/`DROP` que levam um banco antigo ao formato atual. É por isso que `ddl-auto=validate`
funciona: o Hibernate só confere se as entidades batem com as tabelas reais e recusa subir se não.

**Fuso horário.** Todo instante é `TIMESTAMPTZ` e trafega em UTC. As duas exceções são `DATE` e
representam a data **local do dono**: `his_data_local` (gravada com `ZonaUsuario.resolver`, nunca
com o relógio da JVM — que é UTC no Render) e `sta_ultimo_reset` (o último dia já apurado pelo
fechamento). Nunca compare essas colunas com `CURRENT_DATE` do servidor.

### 4.2. As regras de gamificação, em um lugar só

Durante o dia, a execução **acumula e não credita**:

| Evento (`tipo`) | Efeito |
|---|---|
| ausente / em branco / `COMPLETE_*` | `sta_valor_acumulado_hoje += valor`, `sta_execucoes_hoje += 1`, grava `his_sub_atividade_id` |
| `FAIL_BLOQUEIO` | consome 1 escudo e marca `sta_bloqueio_usado_hoje` — o dia fica protegido |
| `FAIL_TIMEOUT` | registra o parcial no histórico (RF10); não acumula realizado |
| Compra de escudo | `-1500` moedas, `+1` em `sta_bloqueios_acumulados` |

No fechamento do dia (`FechamentoService`, disparado pelo job da virada):

```
percentualDia = sta_valor_acumulado_hoje / hab_meta_base
pote          = percentualDia >= 1.20 ? 150 : 100
cota_i        = pote / N                      (N = nº de ocorrências)
credito_i     = cota_i * min(1, realizado_i / sub_alvo_i)
moedas        = round(Σ credito_i)
```

| Situação do dia | Moedas | Ofensiva |
|---|---|---|
| Meta batida em todas as ocorrências | **100** | `+1` |
| Meta batida com ≥120% do total | **150** | `+1` |
| Meta batida pulando 1 de 3 ocorrências | **67** | `+1` (RF12) |
| 60% da meta | **60** | zerada |
| Abaixo da meta, com escudo disponível | proporcional | preservada, escudo consumido |
| Dia fora de `hab_frequencia_semanal` | 0 | intocada — não era dia de fazer |

`sta_nivel_avatar = min(5, 1 + dias_seguidos / 10)` — RF14: a cada dez dias consecutivos.


---

## 5. Execução Local

### Pré-requisitos

| Ferramenta | Versão | Necessária para |
|---|---|---|
| **JDK** | 17 | Compilar o backend (o `pom.xml` fixa `<java.version>17</java.version>`) |
| **Node.js** | 20+ | Rodar o frontend |
| **Docker** + Docker Compose | recente | Subir o PostgreSQL — e, se preferir, o backend inteiro |
| **Android Studio** | opcional | Gerar o APK |

> **O backend precisa de um PostgreSQL.** Versões anteriores deste projeto usavam H2 em memória.
> **Isso não vale mais**: sem um Postgres acessível, a aplicação não sobe (nem o `H2` continua na
> classpath). A forma mais simples de obter um é o `compose.yaml`. O Maven Wrapper (`mvnw`) resolve
> o Maven sozinho — não é preciso instalá-lo.

### Opção A — Banco no Docker, backend na IDE

Melhor para desenvolver, porque permite *hot reload* e depuração.

```bash
cd backend
docker compose up -d db      # sobe só o Postgres, na porta 5433
./mvnw spring-boot:run       # backend em http://localhost:8082
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

### Opção C — IntelliJ IDEA

```bash
cd backend
docker compose up -d db      # sobe só o Postgres, na porta 5433
```

No IntelliJ: **File → Open** apontando para `backend/pom.xml` (não para a pasta `backend/`) — o
IDE reconhece o projeto Maven e baixa as dependências sozinho.

**Antes de rodar**, ligue **Settings → Build, Execution, Deployment → Compiler → Annotation
Processors → Enable annotation processing.** Sem isso o Lombok não gera nenhum getter/setter, e o
projeto aparece cheio de erro vermelho que não existe de verdade.

Duas configurações de run já vêm versionadas em `backend/.run/`:

| Run configuration | Perfil | Uso |
|---|---|---|
| `TempoClaro` | nenhum (`application.properties`) | Postgres em `localhost:5433` — Opção A |
| `TempoClaro-docker` | `docker` | Postgres em `db:5432` — só funciona se o backend também estiver na rede do Compose |

Na prática, use sempre `TempoClaro` com o Postgres subido pela Opção A acima.

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
| `GET` | `/stats/monthly?habitoId={uuid}` | Bearer | — | `StatsResponseDTO` | `StatsService.obterEstatisticas` (alias: `/stats/weekly`) |
| `GET` | `/calibration/questions?categoria={cat}` | Bearer | — | `QuestionarioResponseDTO` | `CalibracaoService.obterQuestionario` |
| `POST` | `/calibration` | Bearer | `CalibracaoRequestDTO` | `CalibracaoResponseDTO` | `CalibracaoService.calibrar` |

### Autenticação das requisições

Toda rota exceto `/api/auth/**` exige o cabeçalho:

```
Authorization: Bearer <token>
```

O token é um JWT **HS512** (não HS256 — checado no header do token real) cujo *subject* é o
e-mail do usuário, com validade de 24 horas. Emitido e validado pelo OAuth2 Resource Server nativo
do Spring Security (`JwtEncoder`/`JwtDecoder`) desde a migração para JPA — o formato do token não
mudou, só quem o gera e valida.

Requisição sem o cabeçalho, com token inválido ou com token expirado recebe **401** com o header
`WWW-Authenticate`. Antes da migração (versão em `JdbcTemplate`) esses três casos devolviam
**403**, porque a cadeia de segurança não registrava um `AuthenticationEntryPoint` — e como os
interceptores do `frontend/` e do `mobile/` só tratam 401, um token expirado não deslogava
ninguém, só travava a tela. Isso foi corrigido, não é regressão.

### Códigos de erro

A §5.1 da monografia define a convenção: **400** validação, **401** credenciais inválidas, **403**
token ausente ou expirado, **404** não encontrado, **422** violação de regra de negócio. O
`GlobalExceptionHandler` a implementa com três exceções de domínio, sempre respondendo
`{"success": false, "message": "..."}`:

| Exceção | HTTP | Quando ocorre |
|---|---|---|
| `ValidacaoException` | **400** | Entrada malformada que a Bean Validation não pega sozinha: fuso inexistente, tema fora da lista, `tipo` de execução desconhecido, horário ausente numa ocorrência |
| `MethodArgumentNotValidException` | **400** | Falha de validação Jakarta (`@NotBlank`, `@Min`…), com as mensagens reais de cada campo |
| `DataIntegrityViolationException` | **400** | Violação de `CHECK` do banco (`ck_hab_teto`, `ck_hab_freq`…), traduzida para mensagem legível |
| `HttpMessageNotReadableException` | **400** | Corpo malformado ou campo desconhecido no JSON (`FAIL_ON_UNKNOWN_PROPERTIES` está ligado) |
| `BadCredentialsException` | **401** | Credenciais inválidas no login — e-mail inexistente e senha errada devolvem a mesma mensagem, para não revelar se o e-mail existe |
| Sem token / token expirado | **403** | `AuthenticationEntryPoint` do `SecurityConfig`, antes do `GlobalExceptionHandler` |
| `RecursoNaoEncontradoException` | **404** | Hábito ou usuário inexistente — **e também hábito de outro dono**: 404 em vez de 403 não confirma a existência do UUID para quem está sondando |
| `RegraDeNegocioException` | **422** | "Limite de 2 hábitos ativos atingido" (RF03), "Saldo insuficiente" (RF15), "Execução duplicada" (RF21), "Nenhum escudo disponível…", "E-mail já está em uso", "Senha atual incorreta" |
| `Exception` | **500** | Qualquer erro não previsto, com mensagem genérica |

> **Por que "senha atual incorreta" é 422 e não 401.** A sessão continua válida — o
> que falhou foi a regra "só troca a senha quem souber a atual". Como o aplicativo
> trata 401 e 403 como token expirado, devolver 401 aqui derrubaria a sessão inteira
> por causa de um erro de digitação.

> **Propriedade do recurso.** Todo endpoint por `{id}` resolve o hábito por `AcessoHabitoService`,
> que confere o dono contra o e-mail do token. Antes disso, `PUT`/`DELETE /habits/{id}`,
> `/priming`, `/executions` e `/shield` recebiam o UUID cru pelo path sem olhar o
> `SecurityContext` — qualquer usuário autenticado que conhecesse o UUID de um hábito alheio podia
> executá-lo, comprar escudo, editá-lo ou arquivá-lo, contra RF22 e RNF08.


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

O cliente **não decide** se a conclusão é padrão ou extra — isso violaria RF22/RNF08 (cálculo
exclusivo do servidor). O servidor compara `valor_realizado` com o alvo da ocorrência sendo
concluída: `>= alvo * 1.2` marca `bonus`. Um `tipo: "COMPLETE_EXTRA"` enviado pelo cliente é
ignorado.

**Nenhuma moeda é creditada aqui.** RF11 credita "pela meta cumprida", que é um evento do **dia**;
a execução só acumula o realizado. Quem credita é o fechamento (Fluxo 14). A resposta devolve uma
**previsão** — quanto o dia renderá se fechar como está agora — para a tela de sucesso mostrar um
número sem reproduzir a fórmula no cliente.

**Request (desistência com escudo):**
```json
{ "execution_token": "...", "tipo": "FAIL_BLOQUEIO", "valor_realizado": 720 }
```

**Request (desistência assumida):**
```json
{ "execution_token": "...", "tipo": "FAIL_TIMEOUT", "valor_realizado": 0 }
```

**Valores aceitos em `tipo`:**

| Valor | Efeito | `his_tipo_sucesso` |
|---|---|---|
| ausente / em branco | acumula o realizado e avança a ocorrência do dia | `COMPLETE_PADRAO` ou `COMPLETE_EXTRA` |
| `FAIL_BLOQUEIO` | consome 1 escudo e marca o dia como protegido | `PROTEGIDO_ESCUDO` |
| `FAIL_TIMEOUT` | registra o parcial sem acumular realizado (RF10) | `DESISTENCIA` |

`FAIL_BLOQUEIO` exige `sta_bloqueios_acumulados > 0` e `sta_bloqueio_usado_hoje = false`; senão
**422**. Token repetido devolve **422** (RF21). `tipo` desconhecido devolve **400**.

**Response 200 OK:**
```json
{
  "moedas_previstas_hoje": 100,
  "moedas_totais": 1300,
  "valor_acumulado_hoje": 1500,
  "meta_base": 1500,
  "dias_seguidos": 8,
  "novo_nivel": 1,
  "texto_feedback": "Hidratação em dia. Seu corpo sente a diferença.",
  "bonus": false
}
```

`moedas_totais` é o saldo **confirmado** (só muda no fechamento e na compra de escudo);
`moedas_previstas_hoje` é o que ainda está por vir. `novo_nivel` é o nível do avatar (RF14: sobe a
cada dez dias), não a ofensiva crua. `texto_feedback` vem de `biblioteca_textos`, no idioma do
usuário (RNF13).

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

### 6.4. Calibração assistida (RF20 / RNF04)

O "Medir Dificuldade" do Passo 2 do assistente. Duas rotas: uma devolve o questionário, a outra
recebe as respostas e devolve a sugestão. Nenhuma cria hábito — quem cria é `POST /habits`,
levando o `calibracao_id` junto.

#### GET /calibration/questions?categoria=EXERCICIO — O questionário da categoria

```json
{
  "categoria": "EXERCICIO",
  "tipo_medida": "TEMPO",
  "unidade": "min",
  "versao_catalogo": 1,
  "perguntas": [
    {
      "codigo": "TEMPO_DISPONIVEL",
      "tipo": "ESCOLHA_UNICA",
      "enunciado": "Quanto tempo dá pra reservar, de verdade?",
      "maximo": null,
      "opcoes": [
        { "valor": "ATE_5", "rotulo": "Até 5 minutos", "detalhe": null },
        { "valor": "ATE_10", "rotulo": "Uns 10 minutos", "detalhe": null }
      ]
    },
    { "codigo": "DIAS_SEMANA", "tipo": "DIAS_SEMANA", "enunciado": "Em quais dias você pode?", "opcoes": [] }
  ]
}
```

**O app não conhece nenhuma pergunta por nome** — só sabe desenhar cinco `tipo`s:
`ESCOLHA_UNICA` (botões empilhados), `DIAS_SEMANA` (7 botões → máscara), `VEZES_AO_DIA` (chips),
`HORARIOS` (um seletor de hora por ocorrência) e `RITMO` (3 cartões com `detalhe` explicando o
efeito). É isso que permite trocar perguntas, rótulos, pesos e faixas de meta editando só
[`backend/src/main/resources/calibracao/catalogo-v1.json`](backend/src/main/resources/calibracao/catalogo-v1.json),
sem publicar versão nova do aplicativo.

#### POST /calibration — Calcular a sugestão

**Request:**
```json
{
  "categoria": "EXERCICIO",
  "respostas": [
    { "pergunta_codigo": "EXPERIENCIA_PREVIA", "valor": "PAREI" },
    { "pergunta_codigo": "DESEJO", "valor": "GOSTO" },
    { "pergunta_codigo": "TEMPO_DISPONIVEL", "valor": "ATE_10" },
    { "pergunta_codigo": "DIAS_SEMANA", "valor": "0111110" },
    { "pergunta_codigo": "VEZES_AO_DIA", "valor": "2" },
    { "pergunta_codigo": "HORARIOS", "valor": "07:00,19:00" },
    { "pergunta_codigo": "RITMO", "valor": "EQUILIBRADO" }
  ]
}
```

O formato de `valor` depende do tipo: o `valor` da opção em `ESCOLHA_UNICA`/`RITMO`, a máscara de
7 posições (domingo a sábado) em `DIAS_SEMANA`, o número em `VEZES_AO_DIA`, e os horários separados
por vírgula em `HORARIOS`.

**Response 200 OK:**
```json
{
  "calibracao_id": "9c1e...",
  "pontuacao": 7,
  "sugestao": {
    "categoria": "EXERCICIO", "tipo_medida": "TEMPO", "unidade": "min",
    "meta_base": 10, "meta_maxima": 40,
    "incremento": 2, "dias_incremento": 10,
    "meta_frequencia_diaria": 2, "frequencia_semanal": "0111110",
    "ocorrencias": [
      { "horario_inicio": "07:00", "alvo": 5 },
      { "horario_inicio": "19:00", "alvo": 5 }
    ]
  },
  "explicacao": "Vamos começar com 10 min por dia, divididos em 2 momentos, 5 dias por semana, subindo 2 min a cada 10 dias. Você pode ajustar tudo isso no próximo passo."
}
```

`sugestao` traz exatamente os campos que o Passo 3 preencheria à mão — aceitar é só pré-preencher
aquele formulário, que continua editável.

**Como a meta é calculada:**

```
pontuacao   = Σ pesos das respostas          (DIAS_SEMANA pesa nº de dias ÷ 2)
meta        = faixa(pontuacao) da categoria
meta        = min(meta, teto declarado na resposta)   ← a trava que importa
meta        = max(meta, vezes_ao_dia)                 ← precisa ser repartível
meta_maxima = meta * teto_multiplicador
```

**A trava do teto vale mais que a pontuação.** Uma resposta pode declarar um `teto_resposta`: quem
disse que só tem 10 minutos por dia não recebe sugestão de 30, por mais pontos que tenha somado nas
outras perguntas. É a 3ª lei de Clear — tornar fácil — virando regra de cálculo, e é o que evita
que a calibração vire mais uma fonte de meta inatingível para quem já tem dificuldade de começar.

`POST /habits` aceita um `calibracao_id` opcional: quando presente, marca `cab_aceita = true` e
liga a calibração ao hábito que nasceu dela.

---

### 6.5. Perfil e Estatísticas


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

#### GET /stats/monthly — Estatísticas do mês

`habitoId` é obrigatório. `GET /stats/weekly` continua atendendo como alias da mesma resposta, para
o app publicado não quebrar de um lado só — a janela passou de 7 para **30 dias**.

**Request:**
```http
GET /api/stats/monthly?habitoId=3fa85f64-5717-4562-b3fc-2c963f66afa6
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Response 200 OK:**
```json
{
  "dias": [
    { "data": "2026-05-18", "nome": "Seg", "valor_realizado": 0, "execucoes": 0, "meta_cumprida": false, "parcial": false },
    { "data": "2026-05-19", "nome": "Ter", "valor_realizado": 2500, "execucoes": 2, "meta_cumprida": true, "parcial": false },
    { "data": "2026-05-20", "nome": "Qua", "valor_realizado": 120, "execucoes": 0, "meta_cumprida": false, "parcial": true }
  ],
  "recordes": [
    { "data": "2026-05-19", "valor": 2500 },
    { "data": "2026-06-02", "valor": 2300 },
    { "data": "2026-05-27", "valor": 1800 }
  ],
  "dias_com_meta_cumprida": 12,
  "constancia_percentual": 57,
  "dias_periodo": 30,
  "dias_cobrados": 21
}
```

Os 30 dias vêm sempre presentes, do mais antigo ao mais recente — dia sem execução chega com
`valor_realizado: 0`, sem buraco no array. A janela é calculada no **fuso do usuário** (RNF13).

`meta_cumprida` compara o **total do dia** com `hab_meta_base` (RF07/RF13) — bater a meta somando
duas ocorrências conta, o que não acontecia quando a regra era contagem de execuções.

`parcial: true` marca um dia cujo valor veio de desistência, escudo manual ou escudo automático,
não de conclusão; nunca coexiste com `meta_cumprida: true`, e o app usa isso para colorir a barra
de forma diferente.

`recordes` traz os **três maiores dias do período, com data** (F18), sem exigir meta cumprida: um
dia a 90% da meta é um recorde legítimo se for o maior do mês. Dias parciais ficam de fora.

`constancia_percentual` divide por **`dias_cobrados`**, não pelos 30 dias da janela. Um hábito de
segunda a sexta só é cobrado em cerca de 21 dos 30 — contar os fins de semana no denominador o
travaria em ~71% mesmo sem uma falha sequer, e a tela contradiria a ofensiva, que o fechamento não
interrompe nos dias de folga. Cada dia carrega `dia_programado` para o gráfico distinguir folga de
falha.

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
│  OAuth2 Resource Server      valida assinatura/expiração do JWT        │
│      │                       (JwtDecoder) e converte em Authentication │
│      │                       (CustomJwtAuthenticationConverter, que    │
│      │                       busca o Usuario pelo e-mail do subject)   │
│      ▼                                                                 │
│  SecurityConfig              /api/auth/**, Swagger são públicos;       │
│      │                       o resto exige autenticação                │
│      ▼                                                                 │
│  Controller                  lê o e-mail do SecurityContextHolder      │
│      ▼                       (nunca do corpo da requisição)            │
│  Service                     regra de negócio                          │
│      ▼                                                                 │
│  Repository                  Spring Data JPA — método derivado ou      │
│      ▼                       @Query nativa na anotação                 │
│  PostgreSQL                                                            │
│      │                                                                 │
│      ▼  Hibernate monta a @Entity                                      │
│  Service                     converte entidade → DTO de response       │
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
`SecurityContextHolder.getContext().getAuthentication().getName()` — como `Usuario implements
UserDetails`, isso resolve para `usuario.getUsername()` (o e-mail), preenchido pelo
`CustomJwtAuthenticationConverter` a partir do *subject* do token assinado. Um cliente não
consegue se passar por outro usuário alterando o JSON.

**O `CustomJwtAuthenticationConverter` consulta o banco a cada requisição.** Depois que o
`JwtDecoder` valida a assinatura e a expiração, o converter busca o `Usuario` pelo e-mail
(`AutenticacaoRepository.findByEmail`) para montar a `Authentication`. Isso garante que um token
de uma conta removida pare de funcionar imediatamente — ao custo de uma consulta extra por
requisição (a mesma que já existia antes da migração, só que hoje feita por Spring Data em vez de
`JdbcTemplate`).

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
          → [Backend] SecurityConfig — /api/auth/login é público, passa direto (8)
          → [Backend] AuthController.login() (9)
          → [Backend] AuthService.autenticar() (10)
            → AuthenticationManager.authenticate() → AutenticacaoService.loadUserByUsername()
              + BCrypt.matches(password, senhaHash), via DaoAuthenticationProvider (11-12)
            → TokenService.geraToken(usuario) (13)
          → Response: { token, user: { name, email, fuso_horario, tema } } (14)
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
          → [Backend] SecurityConfig — /api/auth/register é público, passa direto (8)
          → [Backend] AuthController.register() (9)
          → [Backend] AuthService.cadastrar() (10)
            → UsuarioRepository.existsByEmail() — verifica duplicidade (11)
            → BCrypt.encode(password) — hash da senha (12)
            → UsuarioRepository.save(novoUsuario) (13)
            → TokenService.geraToken(novoUsuario) (14)
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
      → [Backend] OAuth2 Resource Server (7)
        → extrai o JWT do header Authorization
        → JwtDecoder valida assinatura e expiração (8)
        → CustomJwtAuthenticationConverter: AutenticacaoRepository.findByEmail() (9)
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
        → [Backend] OAuth2 Resource Server valida o token (6)
        → [Backend] HabitoController.getDashboard() → email do SecurityContext (7)
        → [Backend] HabitoService.listarDashboard(email) (8)
          → HabitoRepository.findAllByUsuarioIdAndAtivoTrue() (9)
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
        → Response: { moedas_previstas_hoje, moedas_totais, valor_acumulado_hoje, meta_base, dias_seguidos, novo_nivel, texto_feedback, bonus } (26)
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

#### FLUXO 10 — Estatísticas (`GET /stats/monthly`)

```
Stats monta (1)
  → currentHabit do CurrentHabitContext (2)
  → se !currentHabit: renderiza EmptyState (3)
  → setLoading(true) → api.getWeeklyStats(currentHabit.id) (4)
    → GET /api/stats/weekly?habitoId={id} com Bearer token (5)
      → [Backend] StatsController.getStats() (6)
      → [Backend] StatsService.obterEstatisticas() (6a)
        → HistoricoExecucaoRepository — agrega por dia, últimos 30 dias,
          na janela calculada no fuso do usuário (6b)
        → completa os 30 dias mesmo sem execução (valor 0) (6c)
  → Response: StatsResponseDTO { dias (30), recordes[3], dias_com_meta_cumprida, constancia_percentual, dias_periodo } (7)
  → todo dia sem execução E sem desistência (30 dias inteiros): estado vazio
    dedicado ("Ainda não há execuções registradas...") (7a)
  → recharts BarChart renderiza uma barra por dia; dia com `parcial: true`
    (desistência/escudo) usa cor diferente das barras de conclusão (8)
  → StatCards: os três recordes do mês (com data) e o percentual de constância (RF17) (9)
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
#### FLUXO 14 — Fechamento do dia (sem origem no frontend)

O único fluxo que **não parte de uma ação do usuário** — e onde toda a gamificação acontece.

```
FechamentoDiarioJob.apurarDiasFechados — @Scheduled(fixedRate = 1h, initialDelay = 60s) (1)
  → HabitoRepository.findAllByAtivoTrue()  — hábitos ativos de todos os usuários (2)
  → para cada hábito:
      → resolve o fuso do dono (ZonaUsuario.resolver), com cache por usuário (3)
      → hoje = LocalDate.now(fusoDoDono)
      → se sta_ultimo_reset é null: grava hoje e segue (primeiro contato, nada a apurar) (4)
      → para cada dia de sta_ultimo_reset + 1 até ONTEM:                                  (5)
          FechamentoService.fecharDia(habito, status, dia):
            → dia fora de hab_frequencia_semanal? limpa contadores e sai — não era dia (5a)
            → total = SUM(his_valor_realizado) das conclusões daquele dia               (5b)
            → pote = total/meta >= 1.20 ? 150 : 100
            → moedas = Σ (pote/N) * min(1, realizado_da_ocorrência / sub_alvo)           (5c)
            → meta cumprida?  dias_seguidos += 1
              senão, escudo disponível?  consome, preserva, grava PROTEGIDO_AUTOMATICO
              senão                      dias_seguidos = 0                               (5d)
            → sta_nivel_avatar = min(5, 1 + dias_seguidos / 10)                          (5e)
            → zera execucoes_hoje, valor_acumulado_hoje, bloqueio_usado_hoje
              e grava sta_ultimo_reset = dia                                             (5f)
      → recalcula proximo_vencimento e aplica a progressão de meta                        (6)
  → registra no log quantos dias foram apurados                                           (7)
```

**Por que roda de hora em hora, e não uma vez à meia-noite.** Cada usuário tem seu próprio
`usu_fuso_horario`: a meia-noite acontece em instantes diferentes para cada um, então não existe um
horário único correto. Uma passada por hora cobre todos os fusos com, no máximo, uma hora de
atraso.

**Por que apura vários dias de uma vez.** A instância do Render suspende por inatividade e o job
simplesmente não roda enquanto ela dorme — e o usuário também pode passar três dias sem abrir o
app. Fechar só "ontem" deixaria os dias do meio sem veredito, e RF13 manda zerar a ofensiva quando
a meta não é atingida. O laço vai de `sta_ultimo_reset + 1` até ontem, inclusive; o dia corrente
ainda está em andamento e não se fecha. Um teto de 60 dias por passada evita que um hábito parado
há meses vire milhares de iterações numa execução só.

**Por que é seguro rodar repetidamente.** `sta_ultimo_reset` é a guarda de idempotência: uma vez
apurado, o dia sai do intervalo pendente e não é creditado de novo. `FechamentoDiarioIntegracaoTest`
cobre exatamente isso.

**Por que o total vem do histórico e não de `sta_valor_acumulado_hoje`.** O contador de "hoje" é
um só; se o job ficar horas sem rodar, ele já misturou mais de um dia. `his_data_local` não mistura.
O contador serve ao anel de progresso da tela, não à apuração.

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

O projeto inclui uma coleção Postman que cobre todos os endpoints, com scripts que guardam o token,
o `habitoId` e o `calibracaoId` automaticamente entre as requisições — não é preciso copiar nada à
mão.

**Arquivo:** [backend/src/main/resources/Postman/Tempo Claro.json](backend/src/main/resources/Postman/Tempo%20Claro.json)

### 10.1. Importar e configurar

1. No Postman, **Import** → arraste o arquivo `Tempo Claro.json`.
2. A coleção **"Tempo Claro — API"** aparece na barra lateral, com sete pastas.
3. Ajuste a variável `baseUrl` se a sua porta local for diferente (padrão: `http://localhost:8084/api`;
   para o backend publicado, `https://tempo-claro-tcc-tsi.onrender.com/api`).

As demais variáveis (`token`, `habitoId`, `calibracaoId`) são preenchidas pelos testes de cada
requisição. A autenticação está configurada **no nível da coleção** (Bearer `{{token}}`), então toda
requisição já sai autenticada, exceto as que declaram `noauth` de propósito.

### 10.2. Fluxo sugerido

Rode as pastas em ordem — cada uma prepara a seguinte:

| Pasta | O que faz |
|---|---|
| **01 - Autenticação** | `Register` cria a conta e guarda o token; `Login` renova; `Me` confere o perfil |
| **02 - Calibração** | Busca o questionário de uma categoria e calcula a sugestão, guardando `calibracaoId` |
| **03 - Hábitos** | Cria o hábito aceitando a sugestão, lista o dashboard, edita, arquiva, e prova o limite de 2 (422) |
| **04 - Execução** | Priming, conclusão, superação, as duas formas de desistência, idempotência e compra de escudo |
| **05 - Estatísticas** | Janela mensal e a rota antiga `/weekly` como alias |
| **06 - Perfil** | Nome, fuso, tema e troca de senha |
| **07 - Segurança** | 403 sem token, 401 com senha errada, 404 em hábito alheio |

### 10.3. O que observar na execução

A coleção existe também para deixar visível o comportamento que mais mudou:

- **A execução não credita moedas.** A resposta traz `moedas_previstas_hoje` (previsão do que o dia
  renderá) e `moedas_totais` (saldo já confirmado). O saldo só muda no fechamento do dia e na compra
  de escudo — ver Fluxo 14.
- **A ofensiva não se move na execução.** `dias_seguidos` só avança ou zera quando o dia é apurado.
- **Erros seguem a convenção da §5.1**: 400 validação, 401 credenciais, 403 token ausente, 404 não
  encontrado, 422 regra de negócio. Repare que "terceiro hábito ativo" e "token repetido" devolvem
  **422**, não 400.
- **Hábito alheio devolve 404**, não 403 — não confirmar a existência do UUID é deliberado.

---

## 11. Limitações Conhecidas

Esta seção registra, de forma deliberada, o que **não** está implementado ou está implementado
parcialmente. O objetivo é que a documentação descreva o sistema como ele é, e não como se
pretendia que fosse.

### 11.1. Funcionalidades incompletas

| Item | Situação |
|---|---|
| **Notificações push (RF18)** | Não implementado. A tabela `dispositivos_push` segue reservada no schema, mas não há endpoint de registro de token nem agendador — a própria §8.1 da monografia declara push e widget como trabalho futuro. As classes Java órfãs foram removidas. |
| **Widget na tela inicial (RF19)** | Não implementado, mesmo motivo. |
| **Seletor de idioma** | **Implementado (RNF13).** Português e inglês, com a escolha salva em `usu_preferencia_idioma`. O idioma atravessa as três camadas: a interface traduz por dicionário local, `biblioteca_textos` tem seed nas duas línguas (priming e textos de sucesso), e o catálogo de calibração é bilíngue com o servidor resolvendo o texto antes de responder. Um idioma sem conteúdo é recusado com 400 — aceitar seria prometer tradução que o servidor não tem. |
| **Variação visual do avatar** | `sta_nivel_avatar` é calculado corretamente (RF14: a cada dez dias, teto de 5) e exposto no DTO, mas nenhuma tela desenha as variações v1–v5 ainda. |
| **Excluir conta** | Não implementado em nenhuma camada. |
| **Recuperação de senha por e-mail** | Não implementado em nenhuma camada, e sem RF na monografia. Exigiria uma tabela de códigos temporários, dois endpoints (solicitar e validar) e um provedor de envio (SMTP) com credenciais fora do repositório. A troca de senha **com a senha atual em mãos** funciona, em `PUT /profile`. |

### 11.2. Compromissos assumidos

| Item | Descrição |
|---|---|
| **Meta atual aplicada a todo o período** | Nem `hab_meta_base` nem `sub_atividades` têm histórico próprio. Um mês em que a progressão automática subiu a meta é lido nas estatísticas com a meta de hoje, o que pode marcar como "não cumprido" um dia que, à época, cumpriu a meta menor. |
| **`his_sub_atividade_id` pode ficar nulo** | A FK é `ON DELETE SET NULL`: reconfigurar um hábito apaga e recria as ocorrências, desvinculando as execuções já registradas. O fechamento trata esse caso caindo na proporção do dia inteiro, em vez de perder o crédito. |
| **Nível defasado dentro do dia** | `sta_nivel_avatar` é recalculado no fechamento. Entre uma virada e outra ele não muda, o que é coerente: a ofensiva também só se move ali. |
| **`modalidade` aceito e ignorado** | A coluna `hab_modalidade` saiu do schema (não tinha origem em nenhum RF/F/UC), mas o componente segue no `HabitoRequestDTO` porque `fail-on-unknown-properties` está ligado — removê-lo faria o app publicado receber 400 ao criar hábito. Sai quando os clientes pararem de enviá-lo. |
| **`GET /stats/weekly`** | Mantido como alias de `/stats/monthly` pelo mesmo motivo: o app publicado ainda chama a rota antiga. |

### 11.3. Segurança

| Item | Situação |
|---|---|
| **IDOR** | **Corrigido.** Todos os endpoints por `{id}` passam por `AcessoHabitoService`, que confere o dono contra o e-mail do token e responde 404 para hábito alheio. |
| **`jwt.secret`** | **Corrigido.** Não há mais default embutido no código. O perfil default traz uma chave declaradamente de desenvolvimento; o perfil `prod` exige `JWT_SECRET` do ambiente e recusa subir sem ela (com validação de 64 bytes para HS512). |
| **Credenciais do banco** | **Corrigido no arquivo**: `application-prod.properties` usa `${DB_URL}`, `${DB_USERNAME}` e `${DB_PASSWORD}`. ⚠ **A senha anterior continua no histórico do Git — ela precisa ser rotacionada no painel da Neon.** Removê-la do arquivo não a torna secreta. |
| **Senhas no log** | **Corrigido.** `RequestLoggingFilter` passou a `matchIfMissing = false` e está explicitamente desligado em `prod`. Continua ligado no perfil de desenvolvimento, onde imprimir o corpo é o objetivo. |
| **CORS** | **Corrigido.** `app.cors.allowed-origins` com lista explícita, em vez de `"*"`. |

### 11.4. Qualidade e infraestrutura

| Item | Descrição |
|---|---|
| **Cobertura de teste** | 54 testes JUnit: integração ponta a ponta contra Postgres real (auth, hábitos, execuções, fechamento, stats, calibração, perfil), mais os unitários de geração de sub-atividades e a trava de contagem de queries do dashboard. O `Dockerfile` ainda compila com `-DskipTests` — os testes de integração abrem conexão real com Postgres, indisponível no estágio de build isolado. No frontend não há framework de teste. A coleção de baselines JSON em `src/test/resources/baseline/` foi removida: congelava o contrato de antes da migração para JPA e passou a contradizer quase toda resposta da API. |
| **Zero CI** | Não há `.github/workflows`. Os deploys em Render e Vercel são disparados manualmente pelos painéis. |
| **N+1 no dashboard** | **Resolvido.** São 5 consultas fixas, independentemente do número de hábitos: checagem do token, usuário, hábitos, status de todos e ocorrências de todas. `HabitoDashboardQueryCountTest` falha se o custo voltar a crescer com o número de hábitos. |
| **PWA nominal** | O `index.html` tem "PWA" no título, mas não referencia `manifest.webmanifest` nem registra service worker. |


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
