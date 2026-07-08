# Tempo Claro — Backend (API Spring Boot)

API REST do **Tempo Claro**, aplicativo de construção de hábitos fundamentado em
*Hábitos Atômicos* (TCC — CSTSI/IFSul, 2026, Rodrigo Miranda da Silva).

Esta API é a **única dona da inteligência** da aplicação: toda validação de negócio,
economia (saldo, ofensiva, nível, escudos) e derivação de estados acontece aqui. O
PostgreSQL é **persistência pura** (fatos, estado operacional e configuração), sem views,
triggers, functions ou qualquer lógica de negócio.

- **Stack:** Spring Boot · JdbcTemplate (sem ORM/JPA) · PostgreSQL 13+ (pgcrypto) · JWT (HS256, 24h)
- **Cliente:** Flutter (fora deste repositório)
- **Spec funcional:** [documentation/Tempo_Claro_Especificacao_Funcional.md](documentation/Tempo_Claro_Especificacao_Funcional.md) · esquema em [documentation/tempo_claro_schema.sql](documentation/tempo_claro_schema.sql)
- **Convenções de código:** [documentation/documentacao.md](documentation/documentacao.md)

---

## 1. Arquitetura e princípios

### Divisão de responsabilidades (RNF10/RNF11)
- **PostgreSQL:** armazena fatos imutáveis (`historico_execucoes`, `transacoes_moedas`),
  estado operacional (`sessoes_execucao`) e configuração (`usuarios`, `habitos`). Garante
  apenas FK, UNIQUE e CHECK. Nenhum valor agregado (saldo, ofensiva, nível) é cacheado.
- **API Spring Boot:** valida regras antes de gravar, calcula a economia sob demanda via
  queries no ledger/tabelas de fato e devolve resultados agregados ao Flutter.

### Camadas
`controller (1)` → `service (2)` → `repository (3)`. Toda resposta de erro passa pelo
[GlobalExceptionHandler](src/main/java/com/rodrigo/backend/exception/GlobalExceptionHandler.java),
que nunca vaza stack trace.

### Convenções
- **`@audit`:** cada classe/método relevante abre com `// @audit-ok [Fluxo(N…) — descrição]`,
  onde `N` = camada (1/2/3) e o sufixo = artefato (`M` model, `REQ`/`RES` DTOs). Detalhes
  internos usam `// @audit-info`.
- **Imports:** ordenados do mais curto ao mais longo (caracteres da linha inteira), sem
  linhas em branco nem agrupamento; empate por ordem alfabética.
- **Exceções de negócio:** `RecursoNaoEncontradoException` → 404, `RegraNegocioException` → 422,
  `IllegalArgumentException` → 401 (login). Demais `RuntimeException` → 400.

---

## 2. Como rodar

### Pré-requisitos
- JDK 21+, PostgreSQL 13+ (extensão `pgcrypto`).
- Banco padrão local: `jdbc:postgresql://localhost:5432/tempoclaroapp` (user/pass `sci`/`sci`),
  configurável em [application-local.properties](src/main/resources/application-local.properties).

### Banco de dados
O perfil local usa **`spring.sql.init.mode=never`** — o schema e os seeds **não** rodam
automaticamente no boot; são aplicados manualmente:

```bash
# 1) cria as 14 tabelas (idempotente — CREATE TABLE IF NOT EXISTS)
psql -h localhost -U sci -d tempoclaroapp -f src/main/resources/schema.sql

# 2) popula categorias, avatares e biblioteca de textos (idempotente)
psql -h localhost -U sci -d tempoclaroapp -f src/main/resources/data.sql
```

> Alternativa: trocar `spring.sql.init.mode` para `always` faz o Spring rodar
> `schema.sql` + `data.sql` a cada boot (ambos são idempotentes).

### Executar
```bash
./gradlew bootRun        # sobe a API (porta local 8090 — ver nota abaixo)
./gradlew compileJava    # apenas compila
./gradlew test           # testes (ver §10 — ainda não há testes)
```

> ⚠️ **Porta:** a IDE de desenvolvimento ocupa **8080, 8081 e 8082**, então o perfil local usa
> **`server.port=8090`** (em `application-local.properties`). Em produção o padrão é 8080.

---



---

## 4. Modelo de dados (14 tabelas)

| Tabela | Papel |
|--------|-------|
| `usuarios` | conta, auth e preferências (fuso, idioma) |
| `categorias_habito` | moldes fixos AGUA/ESTUDO/EXERCICIO |
| `habitos` | definição, metas e progressão manual |
| `sub_atividades` | partes da meta diária com janela de horário |
| `habito_dias_semana` | frequência semanal (0–6) |
| `perfil_onboarding` | questionário "Medir Dificuldade" (F16 — sem Java ainda) |
| `avatares_catalogo` | assets de avatar por nível e expressão |
| `biblioteca_textos` | frases por molde/idioma (+ genérico) |
| `historico_execucoes` | fato imutável de cada execução (idempotência por `execution_token`) |
| `registros_diarios` | fechamento do dia (base da ofensiva) |
| `transacoes_moedas` | ledger da economia (créditos/débitos) |
| `sessoes_execucao` | sessão ativa/pausada do timer (F09) |
| `sub_atividade_status` | estado de cada parte no dia (regra 3.8) |
| `notificacoes` | lembretes push (F14 — sem Java ainda) |

---

## 5. Dados populados (`data.sql`)

| Catálogo | Conteúdo |
|----------|----------|
| `categorias_habito` | 3 moldes: Água (ml), Estudo (segundos), Exercício (segundos) |
| `avatares_catalogo` | por molde: níveis 0/10/20/30 × 6 expressões (NORMAL, PREOCUPADO, DESESPERADO, CONCLUIDO, SUCESSO, FALHA) → 72 assets. URL padrão `/assets/avatares/{molde}/{estado}_{nivel}.png` |
| `biblioteca_textos` | 1 conjunto por molde (pt-BR) + 1 genérico (`categoria_id` NULL) com priming, sucesso padrão/extra e aviso de urgência |

Para ofensivas acima de 30 dias, basta estender a tupla de níveis no `data.sql`. Idioma
en-US ainda não populado (ver §9).

---

## 6. Referência da API

Todas as rotas (exceto `/api/auth/**`) exigem `Authorization: Bearer <jwt>`.

### Autenticação
| Método | Rota | Corpo | Resposta |
|--------|------|-------|----------|
| POST | `/api/auth/register` | `{ nome, email, password }` | `{ token, user }` |
| POST | `/api/auth/login` | `{ email, password }` | `{ token, user }` · 401 se inválido |

### Perfil
| Método | Rota | Corpo | Resposta |
|--------|------|-------|----------|
| PUT | `/api/profile` | `{ nome?, fuso_horario?, senha_atual?, nova_senha? }` | 200 |

### Hábitos
| Método | Rota | Corpo / Notas | Resposta |
|--------|------|---------------|----------|
| GET | `/api/dashboard` | hábitos ativos do usuário | `[HabitoResponseDTO]` |
| POST | `/api/habits` | `HabitoRequestDTO` (valida molde + limite de 2) | 201 `HabitoResponseDTO` · 422 |
| PUT | `/api/habits/{id}` | `HabitoRequestDTO` (substitui sub-atividades/dias se enviados) | `{ success: true }` |
| DELETE | `/api/habits/{id}` | soft-delete (arquiva) | `{ success: true }` |
| GET | `/api/habits/{id}/priming` | — | `{ texto }` |
| POST | `/api/habits/{id}/executions` | `ExecutionRequestDTO` | `ExecutionResponseDTO` |
| POST | `/api/habits/{id}/shield` | compra escudo (−1500) | `{ saldo, escudos }` · 422 se saldo<1500 |

**`HabitoRequestDTO`** → `titulo`, `categoria_codigo` (AGUA/ESTUDO/EXERCICIO), `meta_base`,
`tipo_medida` (TEMPO/QUANTIDADE), `gatilho_ancora?`, `horario_agendado?`, `meta_maxima?`,
`dias_para_aumento?`, `incremento_meta?`, `sub_atividades?[]`, `dias_semana?[]`.

**`HabitoResponseDTO`** → dados do hábito + categoria + sub-atividades + dias, e os campos
calculados: `saldo`, `escudosDisponiveis`, `ofensiva`, `nivel`, `avatarUrl`.

**`ExecutionRequestDTO`** → `execution_token` (UUID, idempotência), `tipo`
(`COMPLETE_PADRAO`|`COMPLETE_EXTRA`|`FAIL_TIMEOUT`|`FAIL_BLOQUEIO`), `valor_realizado`,
`sub_atividade_id?`. *O servidor recalcula o tipo de sucesso — o cliente não decide a recompensa (RNF08).*

**`ExecutionResponseDTO`** → `moedas_ganhas`, `moedas_totais`, `dias_seguidos`, `novo_nivel`,
`escudos_disponiveis`, `texto_feedback`.

### Sessões / Timer (F09)
| Método | Rota | Corpo / Notas | Resposta |
|--------|------|---------------|----------|
| POST | `/api/habits/{habitoId}/sessions` | `{ sub_atividade_id? }` · servidor define `expira_em = início + 1h` | 201 `SessaoResponseDTO` |
| PATCH | `.../sessions/{sessaoId}/pause` | `{ valor_parcial }` | 200 |
| PATCH | `.../sessions/{sessaoId}/resume` | retoma; se expirou → `FAIL_TIMEOUT` e estado `TIMEOUT` | 200 |
| GET | `.../sessions/active` | sessão viva do hábito | 200 `SessaoResponseDTO` · 404 |

### Estatísticas (F11)
| Método | Rota | Resposta |
|--------|------|----------|
| GET | `/api/stats/weekly` | `[StatsWeeklyResponseDTO]` — 7 dias por hábito (status/total/meta) + recorde |

---

## 7. Regras de negócio no código

| Regra | Implementação |
|-------|---------------|
| 3.1 Moldes fixos | `HabitoService.criarHabito` valida `categoria_codigo` no catálogo |
| 3.2 Limite de 2 ativos | `HabitoService.criarHabito` conta hábitos ativos antes do INSERT |
| 3.3 Janela diária no fuso | `LocalDate.now(ZoneId.of(usuario.fusoHorario))` em todo cálculo de dia |
| 3.4 Meta total = Σ partes | `sub_atividades.alvo_parcial` somadas |
| 3.5 Streak pelo total | `OfensivaCalculator.calcular` varre `registros_diarios` |
| 3.6 Progressão manual | `GamificacaoService.calcularMetaDoDia` |
| 3.7 Pausa/timeout 1h | `SessaoExecucaoService` + `fecharSessaoAtiva` |
| 3.8 Crédito por sub-atividade | `GamificacaoService.calcularRecompensaSubAtividade` |

### Economia e gamificação
- **Recompensa:** 100 (`CREDITO_META`) / 150 se ≥120% (`CREDITO_BONUS`); por parte →
  `CREDITO_SUBATIVIDADE` **proporcional** ao `alvo_parcial`.
- **Saldo** = `SUM(valor)` no ledger. **Escudos** = `COUNT(DEBITO_ESCUDO) − COUNT(FAIL_BLOQUEIO)`.
- **Ofensiva** ([OfensivaCalculator](src/main/java/com/rodrigo/backend/service/OfensivaCalculator.java)):
  conta dias `CONCLUIDO` consecutivos; **dia protegido por escudo mantém** a corrente;
  o **dia corrente em andamento não quebra** a sequência (apuração só na virada — 3.3/3.5).
- **Nível** = `(ofensiva / 10) * 10`; avatar = maior `streak_minimo ≤ ofensiva`.
- **Antifraude (RNF08):** todo cálculo no servidor; `execution_token` UNIQUE garante idempotência.

## 10. Testando a API no Postman

A forma mais rápida de exercitar a API é importar uma coleção do Postman e deixar o **token
JWT ser injetado automaticamente** após o login — evitando colar o `Bearer` em cada requisição.

### 10.1 Importar a coleção
1. **Postman → Import** (`Ctrl+O`) e selecione o arquivo `*.postman_collection.json`
   (sugestão: salve a coleção exportada em `backend/documentation/`, ex.:
   `Tempo_Claro.postman_collection.json`).
2. Se usar um *Environment* separado, importe também o `*.postman_environment.json`.

### 10.2 Variáveis (Environment ou Collection)
Crie um Environment "Tempo Claro — Local":

| Variável | Valor inicial |
|----------|---------------|
| `base_url` | `http://localhost:8090` (porta local; produção usa `8080` — ver §2) |
| `token` | *(vazio — preenchido automaticamente pelo login)* |

Todas as requisições usam a URL no formato `{{base_url}}/api/...`.

### 10.3 Injeção automática do JWT
1. Na requisição **`POST {{base_url}}/api/auth/login`** (corpo `{ "email": "...", "password": "..." }`),
   adicione na aba **Scripts → Post-response** (versões antigas: "Tests"):
   ```js
   pm.environment.set("token", pm.response.json().token);
   ```
   Faça o mesmo em **`/api/auth/register`** (a resposta também devolve `{ token, user }`).
2. No nível da **coleção** → aba **Authorization** → tipo **Bearer Token** → valor `{{token}}`.
3. Deixe cada rota protegida com **Authorization = Inherit auth from parent**. Assim, toda
   chamada (exceto `/api/auth/**`) envia `Authorization: Bearer {{token}}` sem intervenção manual.

### 10.4 Ordem sugerida de execução
1. `POST /api/auth/register` **ou** `POST /api/auth/login` → grava `{{token}}`.
2. `GET /api/dashboard` → confirma a autenticação (deve retornar `200`).
3. `POST /api/habits` → cria um hábito (guarde o `id` retornado).
4. `GET /api/habits/{id}/priming` → texto motivacional.
5. `POST /api/habits/{id}/sessions` → inicia o timer (F09).
6. `POST /api/habits/{id}/executions` → registra execução (envie um `execution_token` UUID novo a cada chamada — idempotência RNF09).
7. `POST /api/habits/{id}/shield` → compra escudo (precisa de saldo ≥ 1500).
8. `GET /api/stats/weekly` → estatísticas dos últimos 7 dias.

> Rotas completas, corpos e respostas estão na **§6 (Referência da API)**. A validação do token
> a cada requisição segue o fluxo **Verificação de Token** (`FLUXO 3` do README na raiz do repo).

---

*Backend do Projeto de Graduação Tempo Claro. As regras refletem a especificação funcional
definitiva e o esquema `tempo_claro_schema.sql`.*
