# Baseline de Build — Tempo Claro

Verificação de que o projeto sobe do zero, comando por comando. Nenhuma correção foi
aplicada — falhas foram apenas documentadas, conforme a tarefa **E0.2**.

Data: 2026-08-27 · Ambiente: Linux (CachyOS) · Java 17.0.20 (Temurin) · Node v24.19.0 · npm 11.17.0

---

## Resumo

| # | Comando | Resultado | Tempo |
|---|---------|-----------|-------|
| 1 | `./gradlew clean build -x test` (literal) | ❌ Falhou — não é o build em si, ver achado 0 | — |
| 1b | `sh gradlew clean build -x test` (contorno do achado 0) | ✅ Passou | 14 s |
| 2 | `./gradlew bootRun` (literal) | ❌ Falhou — mesmo achado 0 | — |
| 2b | `sh gradlew bootRun` (contorno do achado 0) | ⚠️ Gradle passou, app **falhou ao subir** | 3 s |
| 3 | `npm ci` | ✅ Passou (com avisos) | 9 s |
| 4 | `npm run build` | ✅ Passou (com aviso) | <1 s |
| 5 | `npm run dev` | ✅ Passou | pronto em 129 ms |
| 6 | `npx cap sync android` | ✅ Passou (com efeito colateral, ver achado 3) | ~1 s |

**Nenhum dos três builds pedidos passa literalmente como escrito no plano** — o comando
`./gradlew` falha antes de chegar a compilar qualquer coisa, por um problema de permissão
de arquivo, não de código. Contornando isso (achado 0), o **build compila e empacota sem
erro**; o que falha de fato é a **subida da aplicação** (`bootRun`), por falta de banco de
dados local — comportamento esperado neste ambiente, não um bug de código.

---

## Achado 0 — `gradlew` sem permissão de execução

```
$ ./gradlew clean build -x test
permissão negada: ./gradlew
```

`backend/gradlew` está versionado no git com o modo `100644` (sem bit de execução),
quando deveria ser `100755`:

```
$ git ls-files -s gradlew
100644 adff685a0348c64b2b64f0b302f1f82b28eeaaea 0	gradlew
```

Isso quebra `./gradlew` em **qualquer clone novo** no Linux/Mac (inclusive CI), e também
explica por que os dois comandos do Gradle pedidos na tarefa falham literalmente como
escritos. Não é uma falha de build — é um problema de metadado do repositório.

Para conseguir avaliar o build de fato, os itens 1b e 2b abaixo foram executados via
`sh gradlew ...` (interpretando o script diretamente, sem precisar do bit de execução).
Isso não altera nenhum arquivo do repositório.

**Correção sugerida (não aplicada agora, por estar fora do escopo "não corrigir" da
tarefa):** `git update-index --chmod=+x backend/gradlew` e commitar.

---

## 1. Backend — `sh gradlew clean build -x test`

**Resultado: ✅ BUILD SUCCESSFUL em 14 s.**

```
> Task :clean UP-TO-DATE
> Task :compileJava
> Task :processResources
> Task :classes
> Task :resolveMainClassName
> Task :bootJar
> Task :jar
> Task :assemble
> Task :check
> Task :build

BUILD SUCCESSFUL in 13s
6 actionable tasks: 5 executed, 1 up-to-date
```

**Warnings:** nenhum de compilação. Único aviso é informativo do Gradle, não do código:

```
Consider enabling configuration cache to speed up this build:
https://docs.gradle.org/9.3.1/userguide/configuration_cache_enabling.html
```

Gradle wrapper: 9.3.1 · Java do build: 17.0.20 (Eclipse Adoptium).

---

## 2. Backend — `sh gradlew bootRun`

**Resultado: ⚠️ A task Gradle conclui (`BUILD SUCCESSFUL in 2s`), mas o Spring Boot falha
ao subir o contexto da aplicação.**

Causa raiz: `application.properties` (perfil default, usado quando nenhum profile é
passado) aponta para `jdbc:postgresql://localhost:5433/backend_db` — o Postgres do
`compose.yaml` do projeto. Nenhum container desse projeto estava de pé neste ambiente:

```
$ docker ps
# (só containers de outras disciplinas — MariaDB e MongoDB; nenhum Postgres do Tempo Claro)
```

Stack trace completo (relevante):

```
2026-08-27T10:24:49.409-03:00 ERROR 96544 --- [restartedMain] t.s.DeferredServletContainerInitializers :
Error starting Tomcat context. Exception: org.springframework.beans.factory.UnsatisfiedDependencyException.
Message: Error creating bean with name 'jwtFilter' ...
  Unsatisfied dependency ... 'usuarioRepository' ...
  Unsatisfied dependency ... 'jdbcTemplate' ...
  Failed to initialize dependency 'dataSourceScriptDatabaseInitializer' ...
  Failed to execute database script

Caused by: org.springframework.jdbc.CannotGetJdbcConnectionException: Failed to obtain JDBC Connection
Caused by: org.postgresql.util.PSQLException: Connection to localhost:5433 refused.
  Check that the hostname and port are correct and that the postmaster is accepting TCP/IP connections.
Caused by: java.net.ConnectException: Conexão recusada
	at java.base/sun.nio.ch.NioSocketImpl.timedFinishConnect(NioSocketImpl.java:547)
	at org.postgresql.core.PGStream.createSocket(PGStream.java:261)
	at org.postgresql.core.v3.ConnectionFactoryImpl.tryConnect(ConnectionFactoryImpl.java:146)
	...
	at com.rodrigo.backend2java.BackEndIiApplication.main(BackEndIiApplication.java:11)

2026-08-27T10:24:49.441-03:00 ERROR 96544 --- [restartedMain] o.s.boot.SpringApplication : Application run failed
```

A cadeia de causa é: `JwtFilter` → `UsuarioRepository` → `JdbcTemplate` →
`dataSourceScriptDatabaseInitializer` (tenta rodar `schema.sql`/`data.sql` no boot,
`spring.sql.init.mode=always`) → conexão recusada em `localhost:5433`.

**Isto é esperado neste ambiente e não é um bug de código** — é a ausência do
`docker compose up` do `backend/compose.yaml` antes de rodar `bootRun`. Nenhuma tentativa
de subir o Postgres foi feita, por estar fora do escopo desta tarefa (só verificar/documentar).

Confirmado que nenhum processo ficou pendurado depois da falha (porta 8082 fechada,
nenhum PID de `bootRun` vivo — só os daemons padrão do Gradle).

---

## 3. Frontend — `npm ci`

**Resultado: ✅ Passou em 9 s.** `added 633 packages, and audited 634 packages`.

**Warnings:**

- **19 vulnerabilidades reportadas pelo `npm audit`: 1 low, 3 moderate, 14 high, 1 critical.**
  O comando não roda `npm audit` automaticamente — isso é o resumo que o próprio `npm ci`
  imprime. Nenhuma investigada em detalhe aqui (fora do escopo de "só documentar"); vale
  rodar `npm audit` numa tarefa dedicada.
- 7 pacotes transitivos deprecated (`git-semver-tags`, `git-raw-commits`, `q`,
  `prebuild-install`, `tar@6.2.1`, `uuid@7.0.3`, `glob@9.3.5`) — todos dependências
  indiretas, nenhum declarado direto no `package.json`.
- `npm warn allow-scripts`: 2 pacotes com install scripts ainda não aprovados por essa
  política do npm — `@parcel/watcher@2.5.6` e `sharp@0.32.6`. Não bloqueou a instalação.

`package-lock.json` não foi alterado pelo `npm ci` (comportamento esperado — o comando
falha em vez de reescrever o lockfile se ele estivesse inconsistente; aqui ficou intacto).

---

## 4. Frontend — `npm run build`

**Resultado: ✅ Passou.** `✓ built in 597ms` (Vite v8.0.16, rolldown).

```
dist/index.html                            0.47 kB │ gzip:   0.31 kB
dist/assets/normal-C8W89zez.png          146.91 kB
dist/assets/sol_flutuando-BHJkz7y_.webp  295.74 kB
dist/assets/lua_flutuando-Dv12kiZ3.png   699.30 kB
dist/assets/index-CFlGcB49.css             0.86 kB │ gzip:   0.43 kB
dist/assets/index-dL-1P4-x.js            780.29 kB │ gzip: 246.27 kB
```

**Warning:**

```
(!) Some chunks are larger than 500 kB after minification. Consider:
- Using dynamic import() to code-split the application
- Use build.rolldownOptions.output.codeSplitting to improve chunking
- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.
```

O bundle JS principal (`index-dL-1P4-x.js`) tem 780 kB antes de gzip (246 kB depois).
Não há `import()` dinâmico no projeto — todas as 10 telas entram no mesmo chunk.

---

## 5. Frontend — `npm run dev`

**Resultado: ✅ Passou.**

```
  VITE v8.0.16  ready in 129 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Sem warnings. Servidor confirmado respondendo na porta 5173, depois encerrado manualmente
(não foi deixado rodando).

---

## 6. Capacitor — `npx cap sync android`

**Resultado: ✅ Passou em ~1 s** (precisa do `dist/` gerado pelo item 4, já presente).

```
✔ Copying web assets from dist to android/app/src/main/assets/public in 5.37ms
✔ Creating capacitor.config.json in android/app/src/main/assets in 458.41μs
✔ copy android in 18.04ms
✔ Updating Android plugins in 1.31ms
✔ update android in 15.88ms
[info] Sync finished in 0.054s
```

Sem warnings. Não foi testado o build Gradle do projeto Android em si (`android/gradlew
assembleDebug`) — isso não estava no escopo do comando pedido, só o `cap sync`.

### Efeitos colaterais no working tree (não commitados)

O `cap sync` regenera arquivos gerados que **já estavam versionados no git**, e a
regeneração revelou duas divergências pré-existentes entre o que estava commitado e o
estado real do projeto fonte:

1. **`frontend/android/app/src/main/assets/capacitor.config.json` foi atualizado.**
   A versão commitada tinha `"appName": "TempoClaro"`; a fonte real
   (`frontend/capacitor.config.json`) diz `"appName": "Tempo Claro"` (com espaço). O sync
   corrigiu isso localmente — ou seja, **o app Android buildado a partir do commit atual
   levava o nome errado**, e só um `cap sync` recente teria pego isso.

2. **`frontend/android/capacitor-cordova-android-plugins/build/` (22 arquivos) foi
   removido.** Esse é o diretório de saída do Gradle para o subprojeto de plugins Cordova
   — artefatos de build (`.jar`, `.bin`, manifests mesclados), não código-fonte. Ele
   **estava commitado no git** apesar de `frontend/android/.gitignore:24` já ter a regra
   `build/`. Como a regra só vale para arquivos ainda não rastreados, os artefatos antigos
   ficaram presos no histórico até esta sincronização os regenerar do zero — sem os
   arquivos de build.

Nenhuma dessas mudanças foi commitada — ficaram como diffs no working tree
(`git status`), exatamente como qualquer execução normal de `cap sync android` produziria.
Não fiz `git add`/`git commit` de nada neste processo, e não revertive essas alterações
porque elas são o resultado direto e esperado do comando pedido pela tarefa, não uma
correção proativa minha. Se preferir descartá-las, `git checkout -- frontend/android/`
resolve; se preferir aceitá-las, seguem prontas para commit numa tarefa de limpeza dedicada.

---

## Achados que não são bugs de aplicação (registrar, não corrigir agora)

| # | Achado | Onde |
|---|--------|------|
| 0 | `gradlew` sem bit de execução no git (`100644`) | `backend/gradlew` |
| 1 | `bootRun` depende de Postgres local via Docker Compose não documentado como pré-requisito no `README.md` na hora de rodar `bootRun` isoladamente | `backend/compose.yaml`, `application.properties` |
| 2 | 19 vulnerabilidades npm (1 crítica) em dependências transitivas | `frontend/package-lock.json` |
| 3 | Bundle JS único de 780 kB, sem code-splitting | `frontend/vite.config.js` / rotas |
| 4 | `capacitor.config.json` gerado e commitado ficou desatualizado (`appName` divergente da fonte) | `frontend/android/app/src/main/assets/capacitor.config.json` |
| 5 | Artefatos de build do Gradle (`capacitor-cordova-android-plugins/build/`) estavam versionados no git, contra a própria regra do `.gitignore` | `frontend/android/capacitor-cordova-android-plugins/build/` |

Nenhum desses foi corrigido nesta tarefa, conforme instrução do plano.
