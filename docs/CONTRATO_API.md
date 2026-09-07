# Contrato API — front ↔ back ↔ banco

> Gerado na tarefa E2.9 do `PLANO_EXECUCAO.md`. Cobre todo formulário do
> frontend que envia dados (POST/PUT), campo a campo, confrontado com o DTO de
> request correspondente e a coluna real no `schema.sql` (v2.1) que o recebe.
>
> **Como foi verificado:** leitura direta de cada tela, cada DTO e do
> `INSERT`/`UPDATE` de cada repository — não é uma inspeção de tipos estática,
> é o SQL que de fato roda. Onde havia dúvida, testado via curl contra o Neon.

## Legenda

- ✅ **ok** — campo enviado bate com o DTO e chega numa coluna real, ou é
  transiente de propósito (nunca deveria virar coluna).
- ✅ **ok (corrigido nesta tarefa)** — havia divergência; corrigida como parte
  do item 4 desta tarefa. Ver a nota abaixo da tabela correspondente.

Depois desta tarefa, **nenhuma linha ficou como "divergente"** — as únicas que
existiam foram corrigidas (não rebaixadas de nível nem escondidas).

---

## 1. Login — `Login/index.jsx` (aba "Entrar")

| campo enviado | campo no DTO (`LoginRequestDTO`) | coluna no banco | status |
|---|---|---|---|
| `email` | `email` | `usuarios.usu_email` | ✅ ok |
| `password` *(transformado de `senha` em `AuthContext.login`)* | `password` | `usuarios.usu_senha_hash` (via BCrypt, comparado — não gravado) | ✅ ok |

Nota: o formulário usa o nome `senha` internamente; `AuthContext.login` traduz
para `{email, password}` antes de chamar a API — é aí que o contrato de
verdade é decidido, e ele já bate exatamente com o DTO.

## 2. Cadastro — `Login/index.jsx` (aba "Criar Conta")

| campo enviado | campo no DTO (`RegisterRequestDTO`) | coluna no banco | status |
|---|---|---|---|
| `nome` | `nome` | `usuarios.usu_nome` | ✅ ok |
| `email` | `email` | `usuarios.usu_email` | ✅ ok |
| `password` *(de `senha`)* | `password` | `usuarios.usu_senha_hash` (via BCrypt) | ✅ ok |
| `confirmarSenha` | *(não existe no DTO)* | — | ✅ ok — nunca é enviado; só valida no cliente (`authService.validateRegister`) que as duas senhas batem. Não é campo de banco, não deveria ser enviado. |

`fuso_horario`/`preferencia_idioma` não são enviados no cadastro — `AuthService.cadastrar`
grava defaults (`America/Sao_Paulo`, `pt-BR`) direto no servidor. Não é uma
divergência: o formulário de cadastro nunca ofereceu esses campos.

## 3. Perfil — `Profile/index.jsx`

| campo enviado | campo no DTO (`ProfileUpdateDTO`) | coluna no banco | status |
|---|---|---|---|
| `nome` | `nome` | `usuarios.usu_nome` | ✅ ok |
| `fuso_horario` *(de `fusoHorario`)* | `fuso_horario` | `usuarios.usu_fuso_horario` | ✅ ok |
| `senha_atual` *(de `senhaAtual`, só se trocando senha)* | `senha_atual` | *(nenhuma — usado só pra comparar com o hash via BCrypt)* | ✅ ok — transiente de propósito |
| `nova_senha` *(de `novaSenha`)* | `nova_senha` | `usuarios.usu_senha_hash` (após BCrypt) | ✅ ok |
| `confirmarNovaSenha` | *(não existe no DTO)* | — | ✅ ok — mesma lógica do cadastro: só validação no cliente |

## 4. Criar Hábito — `CreateHabit/index.jsx` (Passo 3/4)

| campo enviado | campo no DTO (`HabitoRequestDTO`) | coluna no banco | status |
|---|---|---|---|
| `categoria` | `categoria` | `habitos.hab_categoria` (`CHECK IN ('AGUA','ESTUDO','EXERCICIO')`) | ⚠️→✅ **ok (corrigido nesta tarefa)** — ver nota 1 |
| `titulo` | `titulo` | `habitos.hab_titulo` | ✅ ok |
| `gatilho_ancora` | `gatilho_ancora` | `habitos.hab_gatilho_ancora` | ⚠️→✅ **ok (corrigido nesta tarefa)** — ver nota 2 |
| `tipo_medida` | `tipo_medida` | `habitos.hab_tipo_medida` (`CHECK IN ('TEMPO','QUANTIDADE')`) | ✅ ok |
| `modalidade` | `modalidade` | `habitos.hab_modalidade` | ✅ ok |
| `meta_base` | `meta_base` | `habitos.hab_meta_base` | ✅ ok |
| `incremento` | `incremento` | `habitos.hab_incremento` | ✅ ok |
| `dias_incremento` | `dias_incremento` | `habitos.hab_dias_incremento` | ✅ ok |
| `meta_maxima` | `meta_maxima` | `habitos.hab_meta_maxima` | ✅ ok |
| `frequencia_semanal` | `frequencia_semanal` | `habitos.hab_frequencia_semanal` | ✅ ok |
| `meta_frequencia_diaria` | `meta_frequencia_diaria` | *(não é coluna — é `COUNT(sub_atividades)`, ver `vw_habito_hoje`)* | ✅ ok — determina quantas linhas de `sub_atividades` são geradas |
| `horario_agendado` (só 1x/dia) | `horario_agendado` | `sub_atividades.sub_horario_inicio` (via `gerarSubAtividades`) | ✅ ok |
| `ocorrencias[].horario_inicio`/`horario_fim` (>1x/dia) | `ocorrencias[].horario_inicio`/`horario_fim` | `sub_atividades.sub_horario_inicio`/`sub_horario_fim` | ✅ ok |
| ~~`intervalo_minutos`~~ | ~~`intervalo_minutos`~~ | *(nenhuma tabela tem essa coluna)* | ⚠️→✅ **ok (corrigido nesta tarefa)** — ver nota 3 |

**Nota 1 (crítico):** `MOLDES` em `CreateHabit.jsx` usava `id: 'ESTUDAR'`, mas
`ck_hab_categoria` só aceita `'AGUA' | 'ESTUDO' | 'EXERCICIO'`. **Escolher o
molde "Livrinho" (estudo) sempre falhava ao criar o hábito** — violação de
CHECK. Corrigido: `'ESTUDAR'` → `'ESTUDO'`.

**Nota 2:** `gatilho_ancora` já era gravado corretamente pelo backend desde a
migração pro schema v2.1 (está no `INSERT_HABITO`) — só não existia campo no
formulário pra alguém preencher. Adicionado "Gatilho (opcional)" no Passo 3.

**Nota 3:** `intervalo_minutos` nunca teve coluna correspondente em nenhuma
tabela do schema v2.1 (nem `habitos`, nem `sub_atividades`) — diferente de
`horario_agendado`/`meta_frequencia_diaria`, que têm um substituto real em
`sub_atividades`. Não havia como "consertar" enviando o campo; a correção foi
**remover** `intervalo_minutos` de `Habito.java`, `HabitoRequestDTO` e
`HabitoResponseDTO` — o frontend nunca leu esse campo de nenhuma resposta
(confirmado por busca em todo `frontend/src`), então remover não quebra nada.

## 5. Execução — `Execution/index.jsx` (Concluir / Desistir)

| campo enviado | campo no DTO (`ExecutionRequestDTO`) | coluna no banco | status |
|---|---|---|---|
| `execution_token` | `execution_token` | `historico_execucoes.his_execution_token` (`UNIQUE`, chave de idempotência) | ✅ ok |
| `valor_realizado` | `valor_realizado` | `historico_execucoes.his_valor_realizado` | ✅ ok |
| `tipo` (só na desistência: `FAIL_BLOQUEIO`/`FAIL_TIMEOUT`) | `tipo` | *(não persistido literalmente — `GamificacaoService.mapearTipoSucesso` traduz pra `his_tipo_sucesso`)* | ✅ ok |

`moedas_ganhas`/`bonus`/`tipo_sucesso` nunca vêm do cliente (RF22/RNF08,
E1.6) — o servidor calcula os três sozinho. Não é campo enviado, é resposta.

## 6. Loja — `Store/index.jsx` (Comprar Escudo)

`POST /habits/{id}/shield` não tem corpo (`buyShield(id)` não manda `data`) —
`HabitoController.buyShield` nem declara `@RequestBody`. Nada a confrontar:
✅ ok.

---

## Endpoints existentes sem tela correspondente

`PUT /habits/{id}` (`updateHabit` em `api.js`) **não é chamado por nenhuma
tela hoje** — não gera linha na tabela acima porque não há "campo enviado"
de verdade. Mas o mesmo `HabitoRequestDTO` de 13 campos é aceito por esse
endpoint, e antes desta tarefa só 3 (`titulo`, `meta_base`, `ativo`) eram
persistidos — os outros 10 eram aceitos (passavam por validação) e
descartados em silêncio, com um comentário no código já rotulado
"E2.9 pendente" esperando por esta correção. **Corrigido**: `UPDATE_HABITO`
agora cobre os mesmos campos editáveis que a criação. Também recebeu `@Valid`
(não tinha, diferente de `createHabit`).

---

## Item 1 — Jackson `fail-on-unknown-properties`

`spring.jackson.deserialization.fail-on-unknown-properties=true` em
`application.properties` (afeta todo `@RequestBody` do projeto, não só
hábitos). Testado: um `POST /habits` com um campo extra inventado
(`"campo_fantasma": 1`) agora devolve `400` com
`"Campo desconhecido no corpo da requisição: campo_fantasma"`
(`GlobalExceptionHandler.handleMensagemNaoLegivel`), em vez de ser
silenciosamente ignorado.

Todo payload realmente enviado pelo frontend hoje (login, cadastro, perfil,
criar hábito com/sem ocorrências, execução) foi conferido campo a campo contra
o DTO correspondente **antes** de ligar esta trava — nenhum envia um campo que
o DTO não declare, então nenhum fluxo existente quebra com a mudança.
