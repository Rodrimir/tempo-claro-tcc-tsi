# Tempo Claro — Guia de Integração do Frontend

Documento único de referência para o cliente (Flutter) consumir a API do backend após a
migração para o esquema definitivo. Descreve **todos os endpoints existentes**, o que cada um
**espera receber**, o que **devolve**, os códigos de status e as mudanças em relação à versão
anterior da API.

> Gerado a partir do código-fonte real e validado por smoke test de ponta a ponta
> (registrar → criar hábito → priming → executar → dashboard → stats).

---

## 1. Informações gerais

| Item | Valor |
|------|-------|
| Base URL | `http://<host>:<porta>` — porta configurada: **8080** |
| Formato | JSON (`Content-Type: application/json`), UTF-8 |
| Autenticação | JWT Bearer — header `Authorization: Bearer <token>` |
| Sessão | Stateless (sem cookies); o token vale 24h |
| CORS | Liberado para qualquer origem (GET, POST, PUT, DELETE, OPTIONS) |

> ⚠️ **Porta local:** no ambiente de desenvolvimento atual a porta **8080 pode estar ocupada
> pela IDE**. Se o backend não subir (`Port 8080 was already in use`), rode com outra porta
> (`--server.port=8090`) e aponte o `baseUrl` do app para ela. Em produção será 8080.

### Rotas públicas vs protegidas
- **Públicas (sem token):** `POST /api/auth/register`, `POST /api/auth/login`.
- **Todas as demais exigem** `Authorization: Bearer <token>`. Sem token válido → **401**.

### ⚠️ Convenção de nomes de campos (importante!)
Os DTOs **misturam `snake_case` e `camelCase`** — use **exatamente** os nomes desta doc, não
deduza. Ex.: no mesmo objeto de hábito convivem `meta_base` (snake) e `avatarUrl` (camel).

---

## 2. Formato de erro e status codes

Erros de negócio retornam sempre:
```json
{ "success": false, "message": "Texto explicativo do erro" }
```

| Status | Quando |
|--------|--------|
| `200 OK` | sucesso (GET/PUT/POST de execução, login) |
| `201 Created` | criação (register, criar hábito, iniciar sessão) |
| `400 Bad Request` | corpo inválido (`@Valid` falhou) ou erro genérico |
| `401 Unauthorized` | sem token / token inválido **ou** credenciais de login incorretas |
| `404 Not Found` | recurso inexistente (hábito, usuário, sessão, sub-atividade) |
| `422 Unprocessable Content` | regra de negócio violada (limite de 2 hábitos, saldo insuficiente, sem escudo, e-mail em uso, sessão duplicada, tipo inválido) |

---

## 3. Autenticação

### POST `/api/auth/register` — pública
**Request**
```json
{ "nome": "Maria", "email": "maria@exemplo.com", "password": "senha12345" }
```
**Response `201`**
```json
{
  "token": "eyJhbGciOiJI...",
  "user": { "name": "Maria", "email": "maria@exemplo.com",
            "fusoHorario": "America/Sao_Paulo", "preferenciaIdioma": "pt-BR" }
}
```
Erros: `422` e-mail já em uso · `400` validação (nome/email/senha em branco, e-mail inválido).
Defaults no cadastro: `fusoHorario='America/Sao_Paulo'`, `preferenciaIdioma='pt-BR'`.

### POST `/api/auth/login` — pública
**Request** `{ "email": "maria@exemplo.com", "password": "senha12345" }`
**Response `200`** — igual ao register (`token` + `user`). Credenciais inválidas → **401**.

### Guardar o token
Use o `token` em todas as chamadas seguintes via `Authorization: Bearer <token>`.

---

## 4. Perfil

### PUT `/api/profile` — protegida
Todos os campos são **opcionais**; envie só o que muda. Para trocar a senha, envie
`senha_atual` **e** `nova_senha`.
```json
{ "nome": "Maria S.", "fuso_horario": "America/Bahia",
  "senha_atual": "senha12345", "nova_senha": "novaSenha456" }
```
**Response `200`** (sem corpo relevante). Erros: `422` senha atual ausente/incorreta · `404` usuário.

### DELETE `/api/profile` — protegida
Exclui **permanentemente** a conta do usuário autenticado. Exige a senha no corpo para confirmar
(ação destrutiva e irreversível). A remoção é em **cascata** (`ON DELETE CASCADE`): apaga os
hábitos, sub-atividades, execuções, transações, sessões e registros do usuário.
```json
{ "password": "senha12345" }
```
**Response `200`** `{ "success": true }`. Erros: `422` senha ausente/incorreta · `404` usuário.
Após o sucesso, o app deve descartar o token e voltar à tela de login.

---

## 5. Hábitos

### GET `/api/dashboard` — protegida
Lista os hábitos **ativos** do usuário, cada um já com os dados de gamificação calculados.
**Response `200`** — array de **`HabitoResponse`** (ver schema abaixo).

### POST `/api/habits` — protegida
Cria um hábito (wizard F02). Valida o molde e o limite de **2 hábitos ativos**.
**Request — `HabitoRequest`:**

| Campo | Tipo | Obrig. | Notas |
|-------|------|:---:|-------|
| `titulo` | string | ✅ | |
| `categoria_codigo` | string | ✅ | `AGUA` \| `ESTUDO` \| `EXERCICIO` |
| `meta_base` | int | ✅ | > 0 (ml para Água; segundos para Estudo/Exercício) |
| `tipo_medida` | string | ✅ | `QUANTIDADE` (Água) \| `TEMPO` (Estudo/Exercício) |
| `gatilho_ancora` | string | — | intenção de implementação (F03) |
| `horario_agendado` | string `HH:mm:ss` | — | horário-alvo do dia |
| `meta_maxima` | int | — | teto da progressão (≥ `meta_base`) |
| `dias_para_aumento` | int | — | progressão: a cada N dias… |
| `incremento_meta` | int | — | …soma esse valor à meta |
| `sub_atividades` | array | — | partes da meta (ver abaixo) |
| `dias_semana` | int[] | — | `0`=domingo … `6`=sábado |

`sub_atividades[]` (cada item): `{ "ordem": 1, "alvo_parcial": 1000, "horario_inicio": "08:00:00", "horario_fim": "12:00:00" }`
(`horario_inicio`/`horario_fim` opcionais; a soma dos `alvo_parcial` deve formar a meta total).

**Exemplo (Água, 2000 ml em 2 partes, todos os dias):**
```json
{
  "titulo": "Beber água", "categoria_codigo": "AGUA", "tipo_medida": "QUANTIDADE",
  "meta_base": 2000, "dias_semana": [0,1,2,3,4,5,6],
  "sub_atividades": [ {"ordem":1,"alvo_parcial":1000}, {"ordem":2,"alvo_parcial":1000} ]
}
```
**Response `201`** — `HabitoResponse`. Erros: `422` categoria inválida ou limite de 2 atingido.

### PUT `/api/habits/{id}` — protegida
Atualiza campos editáveis. Se `sub_atividades` ou `dias_semana` forem enviados, **substituem**
os existentes (delete + re-insert). Mesmo corpo do create (campos não enviados não mudam).
**Response `200`** `{ "success": true }`.

### DELETE `/api/habits/{id}` — protegida
Soft-delete: arquiva o hábito (preserva histórico). **Response `200`** `{ "success": true }`.

### Schema `HabitoResponse`
```json
{
  "id": "uuid",
  "categoriaId": "uuid",
  "categoriaCodigo": "AGUA",
  "categoriaNome": "Água",
  "titulo": "Beber água",
  "gatilhoAncora": null,
  "tipo_medida": "QUANTIDADE",
  "horario_agendado": null,
  "meta_base": 2000,
  "meta_maxima": null,
  "dias_para_aumento": null,
  "incremento_meta": null,
  "ativo": true,
  "arquivadoEm": null,
  "sub_atividades": [ { "id":"uuid", "ordem":1, "alvo_parcial":1000, "horario_inicio":null, "horario_fim":null } ],
  "dias_semana": [0,1,2,3,4,5,6],

  "saldo": 100,
  "escudosDisponiveis": 0,
  "ofensiva": 1,
  "nivel": 0,
  "avatarUrl": "/assets/avatares/agua/normal_00.png"
}
```
**Campos de gamificação (calculados pelo backend, não editáveis):**
- `saldo` — moedas do hábito (`SUM` do ledger).
- `escudosDisponiveis` — escudos comprados menos usados.
- `ofensiva` — streak atual (dias consecutivos cumpridos).
- `nivel` — `(ofensiva / 10) * 10` (0, 10, 20, …).
- `avatarUrl` — asset do avatar para a ofensiva atual (ver §9).

---

## 6. Execução, priming e loja

### GET `/api/habits/{id}/priming` — protegida
Texto motivacional pré-tarefa (F06). **Response `200`** `{ "texto": "Hora de se hidratar..." }`.

### POST `/api/habits/{id}/executions` — protegida
Registra a conclusão **ou** falha de uma execução (F07/F08/F10). **Idempotente** por
`execution_token` (gere um UUID novo por execução; reenvio do mesmo token → `422` "Execução duplicada").

**Request — `ExecutionRequest`:**
| Campo | Tipo | Obrig. | Notas |
|-------|------|:---:|-------|
| `execution_token` | uuid | ✅ | idempotência — **um novo por execução** |
| `tipo` | string | ✅ | `COMPLETE_PADRAO` \| `COMPLETE_EXTRA` \| `FAIL_TIMEOUT` \| `FAIL_BLOQUEIO` |
| `valor_realizado` | int | ✅ | quanto foi feito (ml ou segundos) |
| `sub_atividade_id` | uuid | — | se a execução é de uma parte específica (regra 3.8) |

> 🔒 **Antifraude (RNF08):** para conclusões, o **servidor recalcula** se é padrão (100) ou
> extra (150) comparando `valor_realizado` com a meta — o cliente **não decide** a recompensa.
> Envie `COMPLETE_PADRAO` para concluir; o backend promove a `COMPLETE_EXTRA` se `≥120%`.
> Para desistência use `FAIL_BLOQUEIO` (consome 1 escudo, protege a ofensiva) ou
> `FAIL_TIMEOUT`. `FAIL_BLOQUEIO` sem escudo disponível → `422`.

**Response `200` — `ExecutionResponse`:**
```json
{
  "moedas_ganhas": 0,
  "moedas_totais": 100,
  "dias_seguidos": 1,
  "novo_nivel": 0,
  "escudos_disponiveis": 0,
  "valor_total_dia": 1000,
  "meta_do_dia": 2000,
  "meta_concluida_hoje": false,
  "texto_feedback": "Excelente trabalho! Continue assim."
}
```
> ⚠️ **Economia diferida:** a execução **não credita moedas** (`moedas_ganhas` sempre `0`); ela só
> registra o progresso. Use `valor_total_dia`/`meta_do_dia` para a barra de progresso do dia e
> `meta_concluida_hoje` para habilitar o **"Concluir Hoje"**. A recompensa real (100/150 − porções
> ausentes) é creditada no fechamento do dia ou no `POST /habits/{id}/conclude-day` (ver §6.1).
> Use `texto_feedback` na tela de Sucesso/Falha (F13).

### POST `/api/habits/{id}/conclude-day` — protegida
Encerra o dia corrente e **apura/credita** a recompensa (F04 "Concluir Hoje"). Idempotente: não
credita o mesmo dia duas vezes. **Response `200`** — `ExecutionResponse` (com `moedas_ganhas` = a
recompensa final apurada e `meta_concluida_hoje`).

### 6.1 Economia de fim de dia e "Concluir Hoje" (regra definitiva)

A recompensa **não é fechada por execução**. Cada sub-atividade executada credita apenas a sua
**porção** (a recompensa total dividida pelas partes do dia). O **valor total** (100 ou 150) só é
**apurado e creditado**:

- **ao fim do dia** (apuração automática na virada), **ou**
- quando o usuário toca **"Concluir Hoje"** — as duas ações fazem a mesma coisa.

**Regra de apuração (calculada no backend):**
- Meta diária atingida **e todas as sub-atividades feitas** (nenhuma perdida) → **100**.
- Meta diária **superada em ≥ 20%** (≥120% do alvo) → **150** (extra).
- Meta atingida (normal **ou** extra) **mas faltou uma ou mais sub-atividades** → desconta-se
  **proporcionalmente**: `recompensa_final = (150 ou 100) − porções das sub-atividades não feitas`.

**"Concluir Hoje" (F04/F13):**
- Fica disponível **assim que a meta diária é atingida**, mesmo com sub-atividades pendentes.
- Ao concluir: o avatar vai para o estado **alegre** com mensagem do tipo *"Parabéns, você atingiu
  sua meta hoje"*, o dia é **encerrado** e o usuário **não executa mais** as tarefas restantes
  daquele dia (perdendo as porções correspondentes, conforme a regra acima).
- Enquanto **não** concluir, o usuário **pode continuar** fazendo as sub-atividades para perseguir
  o bônus extra (150).

> ✅ **Implementação (backend):**
> 1. `POST /api/habits/{id}/conclude-day` apura e credita a recompensa do dia (idempotente).
> 2. Um **job de fechamento** (`@Scheduled`, de hora em hora) encerra automaticamente os dias já
>    passados no fuso de cada usuário: credita a recompensa se a meta foi atingida, ou consome um
>    escudo (se houver) preservando a ofensiva quando a meta falhou.
> 3. `POST /api/habits/{id}/executions` agora **só registra progresso** (não credita); a resposta traz
>    `valor_total_dia`, `meta_do_dia` e `meta_concluida_hoje`.
>
> 🔶 **Ponto em aberto:** o `GET /api/dashboard` ainda **não** expõe o progresso do dia, então o front
> infere "meta atingida hoje" pelo **último dia** de `GET /api/stats/weekly`
> (`valorTotalDia >= metaDoDia` ou `status === 'CONCLUIDO'`). O ideal seria o dashboard devolver
> `valorTotalDiaHoje`/`metaDoDia`/`metaConcluidaHoje` por hábito.

### POST `/api/habits/{id}/shield` — protegida
Compra 1 escudo por **1500 moedas** (F12). **Response `200`** `{ "saldo": 0, "escudos": 1 }`.
Saldo insuficiente → `422`.

> **Quando o escudo é consumido (importante):** o escudo protege a **meta diária**, não uma
> tarefa/pré-tarefa individual. Ele é gasto **automaticamente na apuração do fim do dia**
> quando o hábito tem um escudo disponível **e a meta diária do dia não foi atingida**,
> preservando a ofensiva. Desistir/falhar uma única pré-tarefa **não** consome escudo.

---

## 7. Sessão / Timer (F09)

Persistem o estado do cronômetro para retomar após minimizar o app. Rotas sob
`/api/habits/{habitoId}/sessions`.

### POST `/api/habits/{habitoId}/sessions`
Inicia o timer. O servidor define `expira_em = início + 1h` (campo `expira_em` no request é
ignorado). Já existe sessão viva → `422`.
**Request** `{ "sub_atividade_id": "uuid-ou-null" }`
**Response `201` — `SessaoResponse`:**
```json
{ "id":"uuid", "habitoId":"uuid", "subAtividadeId":null,
  "iniciadaEm":"2026-06-25T09:00:00-03:00", "pausadaEm":null,
  "valorParcial":0, "estado":"EM_EXECUCAO", "expiraEm":"2026-06-25T10:00:00-03:00" }
```

### PATCH `/api/habits/{habitoId}/sessions/{sessaoId}/pause`
Pausa e salva o progresso parcial. **Request** `{ "valor_parcial": 600 }` → **`200`** `SessaoResponse` (`estado:"PAUSADO"`).

### PATCH `/api/habits/{habitoId}/sessions/{sessaoId}/resume`
Retoma. **Se já passou de 1h**, o backend registra automaticamente um `FAIL_TIMEOUT` e a
sessão volta com `estado:"TIMEOUT"` (trate como falha por tempo). Caso contrário, `estado:"EM_EXECUCAO"`.

### GET `/api/habits/{habitoId}/sessions/active`
Sessão viva do hábito para restaurar o timer. **`200`** `SessaoResponse` ou **`404`** se não houver.

`estado` ∈ `EM_EXECUCAO` · `PAUSADO` · `FINALIZADA` · `TIMEOUT`.

---

## 8. Estatísticas (F11)

### GET `/api/stats/weekly` — protegida
Constância dos últimos 7 dias por hábito. **Response `200`** — array de `StatsWeeklyResponse`:
```json
[
  {
    "habitoId": "uuid",
    "titulo": "Beber água",
    "dias": [
      { "data":"2026-06-19", "status":null,        "valorTotalDia":0,    "metaDoDia":2000 },
      { "data":"2026-06-25", "status":"CONCLUIDO", "valorTotalDia":2000, "metaDoDia":2000 }
    ],
    "recordValor": 2000
  }
]
```
`dias` traz sempre 7 itens (mais antigo → hoje); `status` ∈ `CONCLUIDO` · `PARCIAL` · `FALHA` · `null`
(dia sem registro). `recordValor` = maior `valor_realizado` já alcançado no hábito.

---

## 9. Avatar e estados (F05) — como o front deve exibir

- **Nível/evolução (backend):** `avatarUrl` no `HabitoResponse` já vem resolvido para a
  ofensiva atual (ex.: `/assets/avatares/agua/normal_00.png`). Sobe de tier a cada 10 dias
  (`normal_00`, `normal_10`, `normal_20`, `normal_30`).
- **Expressão de urgência (frontend):** a expressão (NORMAL / PREOCUPADO / DESESPERADO /
  CONCLUIDO) é derivada **no cliente** comparando `horario_agendado` + fuso com o relógio:
  - `> 2h` para o horário → NORMAL
  - `< 2h` → PREOCUPADO
  - da hora marcada **em diante** (inclusive após 1h de atraso) → DESESPERADO, e **permanece
    DESESPERADO até a virada do dia** enquanto a meta diária não for atingida
  - meta **diária** cumprida → CONCLUIDO (avatar alegre)
  - **FALHA não é uma expressão de meio-dia.** Ela só acontece na **apuração do fim do dia**
    (ou no timeout de sessão > 1h). Quando o horário de uma sub-atividade passa sem execução,
    aquela **parte** é contabilizada como falha (perde a porção de moedas dela — ver §6.1),
    **mas o usuário ainda pode atingir a meta diária** com as demais partes/excedente.
- **Convenção de asset:** `/assets/avatares/{molde}/{estado}_{nivel}.png`, com
  `molde` ∈ `agua|estudo|exercicio`, `estado` ∈ `normal|preocupado|desesperado|concluido|sucesso|falha`,
  `nivel` ∈ `00|10|20|30`. Os assets estão **catalogados no banco** (tabela `avatares_catalogo`),
  então o front pode montar a URL localmente trocando só o `estado`.

> ⚠️ Limitação atual: o `avatarUrl` do dashboard retorna sempre o estado **NORMAL**. Para as
> demais expressões, o front monta a URL trocando o segmento `{estado}` pela convenção acima.

---

## 10. Domínios (enums)

| Campo | Valores |
|-------|---------|
| `categoria_codigo` | `AGUA` · `ESTUDO` · `EXERCICIO` |
| `tipo_medida` | `QUANTIDADE` · `TEMPO` |
| execução `tipo` | `COMPLETE_PADRAO` · `COMPLETE_EXTRA` · `FAIL_TIMEOUT` · `FAIL_BLOQUEIO` |
| dia `status` | `CONCLUIDO` · `PARCIAL` · `FALHA` |
| sessão `estado` | `EM_EXECUCAO` · `PAUSADO` · `FINALIZADA` · `TIMEOUT` |
| `dias_semana` | inteiros `0`(dom) … `6`(sáb) |

---

## 11. Mudanças vs. versão anterior (o que o front precisa adaptar)

| Área | Antes | Agora |
|------|-------|-------|
| Criar hábito | `categoria` (texto livre) | `categoria_codigo` (`AGUA`/`ESTUDO`/`EXERCICIO`) |
| Criar hábito | `modalidade`, `meta_frequencia_diaria`, `intervalo_minutos` | **removidos**; agora `meta_maxima`, `dias_para_aumento`, `incremento_meta`, `sub_atividades[]`, `dias_semana[]` |
| Hábito (resposta) | `moedas_locais`, `bloqueios_acumulados`, `execucoes_hoje`, `proximo_vencimento` | **removidos**; agora `saldo`, `escudosDisponiveis`, `ofensiva`, `nivel`, `avatarUrl` |
| Execução | cliente definia o sucesso | **servidor** decide padrão/extra; novo campo opcional `sub_atividade_id` |
| Execução (resposta) | `novo_nivel` | mantém `novo_nivel` + novos `escudos_disponiveis` |
| Loja | retorno simples | retorna `{ saldo, escudos }` |
| **Novo** | — | sessões (`/sessions/...`) e estatísticas (`/stats/weekly`) |

---

## 12. Ainda NÃO disponível no backend (planejar no front)

- **`GET /api/categories`** — **não existe ainda**. Para o wizard, hoje o front precisa ter os
  3 moldes fixos (códigos/nome/cor/unidade) hardcoded ou aguardar o endpoint:
  `AGUA` (Água, ml, `#2EC4F1`) · `ESTUDO` (Estudo, segundos, `#7C5CFC`) · `EXERCICIO` (Exercício, segundos, `#FF8A3D`).
- **Localização:** priming e feedback retornam só **pt-BR** (o backend ainda não usa o idioma do usuário).
- **Progresso do dia no dashboard**: o `GET /api/dashboard` ainda **não** devolve `valorTotalDiaHoje`,
  `metaDoDia` nem `metaConcluidaHoje` por hábito. Sem isso, o front detecta "meta atingida hoje" via
  `GET /api/stats/weekly` (último dia). Ver §6.1. *(melhoria desejável)*
- **F14 Notificações push**, **F16 Onboarding "Medir Dificuldade"**: sem endpoints ainda.
- **F15 Widget**: consome `GET /api/dashboard` (mesmos dados); cache local é responsabilidade do app.
- **GET de hábito individual** não existe; use `GET /api/dashboard` (lista) e filtre por `id`.

---

*Referência viva — atualizar conforme o backend evoluir. Base: especificação funcional
definitiva + código-fonte da API.*
