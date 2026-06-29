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
[GlobalExceptionHandler](src/main/java/com/rodrigo/backend2java/exception/GlobalExceptionHandler.java),
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

## 3. Estrutura do projeto

```
src/main/java/com/rodrigo/backend2java/
├── config/        JwtService, JwtFilter, SecurityConfig, LoggingFilter
├── controller/    Auth, Profile, Habito, Sessao, Stats  (camada 1)
├── service/       Auth, Usuario, Habito, Gamificacao, Sessao, Stats,
│                  OfensivaCalculator (regra única de streak)  (camada 2)
├── repository/    JdbcTemplate puro, uma classe por tabela  (camada 3)
├── model/         entidades + dto/{request,response}
└── exception/     GlobalExceptionHandler + exceções tipadas
src/main/resources/
├── schema.sql     DDL das 14 tabelas + seed de categorias
└── data.sql       seed de categorias, avatares e biblioteca de textos
```

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

## 7. Regras de negócio → onde estão no código

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
- **Ofensiva** ([OfensivaCalculator](src/main/java/com/rodrigo/backend2java/service/OfensivaCalculator.java)):
  conta dias `CONCLUIDO` consecutivos; **dia protegido por escudo mantém** a corrente;
  o **dia corrente em andamento não quebra** a sequência (apuração só na virada — 3.3/3.5).
- **Nível** = `(ofensiva / 10) * 10`; avatar = maior `streak_minimo ≤ ofensiva`.
- **Antifraude (RNF08):** todo cálculo no servidor; `execution_token` UNIQUE garante idempotência.

---

## 8. Conformidade com a especificação (F01–F16)

| F | Funcionalidade | Spec | Backend |
|---|----------------|------|---------|
| F01 | Cadastro/Login (JWT) | IMPLEMENTADO | ✅ |
| F02 | Criar hábito (wizard) | IMPLEMENTADO | ✅ (falta `GET /categories` p/ o wizard) |
| F03 | Gatilho/âncora | PROPOSTO | ✅ campos prontos; falta frontend |
| F04 | Dashboard/carrossel | IMPLEMENTADO | ✅ |
| F05 | Avatar evolutivo | parcial | ⚠️ API retorna só estado `NORMAL` (ver §9) |
| F06 | Priming pré-tarefa | IMPLEMENTADO | ✅ (com seeds agora reais) |
| F07/F08 | Execução tempo/quantidade | IMPLEMENTADO | ✅ |
| F09 | Pausa/timeout de sessão | parcial → | ✅ completo (timeout server-side) |
| F10 | Desistência + escudo | IMPLEMENTADO | ✅ |
| F11 | Stats semanal | backend a completar → | ✅ completo |
| F12 | Loja de escudos | IMPLEMENTADO | ✅ |
| F13 | Telas sucesso/falha | IMPLEMENTADO | ✅ (com seeds reais) |
| F14 | Notificações push | PROPOSTO | ⬜ tabela pronta, sem Java |
| F15 | Widget | PROPOSTO | ⬜ consome `/dashboard` |
| F16 | Onboarding "Medir Dificuldade" | PROPOSTO | ⬜ tabela pronta, sem Java |

**Máquina de estados (§7 da spec):** os 8 estados são derivados (nunca colunas).
Sessão (`EM_EXECUCAO`/`PAUSADO`/`FINALIZADA`/`TIMEOUT`) e dia (`CONCLUIDO`/`PARCIAL`/`FALHA`)
são lidos das tabelas de fato; estados de urgência (NORMAL/PREOCUPADO/DESESPERADO) são
derivados no cliente pelo horário, conforme a spec.

**RNF atendidos:** RNF06 (sessão persistida), RNF07 (hash+JWT), RNF08 (cálculo no servidor),
RNF09 (idempotência), RNF10/RNF11 (separação de camadas, sem lógica no banco).

---

## 9. Lacunas conhecidas (divergências da spec)

1. **F05 multi-estado:** o dashboard consulta avatar só com `estado_expressao='NORMAL'`. O
   catálogo já está populado com as 6 expressões; falta a API expor o conjunto de assets do
   nível atual (ou aceitar o estado) para o cliente trocar a expressão por horário.
2. **Localização parcial (RNF13):** `obterPriming` e `obterTextoFeedback` fixam `"pt-BR"` em
   vez de `usuario.preferencia_idioma`. Seeds en-US ainda não criados.
3. **`GET /api/categories` ausente:** o wizard (F02) não tem como listar os 3 moldes com
   nome/cor/unidade. `CategoriaHabitoRepository` precisa de um `findAll` + controller.
4. **Validação de molde:** `tipo_medida` não é checado contra a categoria (AGUA→QUANTIDADE,
   ESTUDO/EXERCICIO→TEMPO).
5. **Sem testes:** `src/test` vazio (a metodologia da spec cita testes de software).

---

## 10. Roadmap (PROPOSTO — fora do TCC imediato)

- **F16 Onboarding:** `PerfilOnboarding` + `POST /api/onboarding` com a lógica de sugestão.
- **F14 Notificações:** Spring Scheduler lendo horários → grava `notificacoes` e envia push.
- **F15 Widget** e **F03 Gatilho:** frontend Flutter (backend pronto/N/A).
- Itens da Seção D do schema (GPS, Pomodoro, micro-hábitos, troféus): colunas/tabelas comentadas.

---

*Backend do Projeto de Graduação Tempo Claro. As regras refletem a especificação funcional
definitiva e o esquema `tempo_claro_schema.sql`.*
