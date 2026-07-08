# TEMPO CLARO
## Especificação Funcional Detalhada — Versão Definitiva

**Aplicativo de construção de hábitos fundamentado em *Hábitos Atômicos***

Aluno: **Rodrigo Miranda da Silva**
Orientadora: Marcia Zechlinski Gusmão · Colaborador: Yuri Sodré
CSTSI — Curso Superior de Tecnologia em Sistemas para Internet
Instituto Federal Sul-Rio-Grandense (IFSul) · Projeto de Graduação · 2026

> Este documento é a especificação funcional única e definitiva do Tempo Claro,
> alinhada ao esquema de banco de dados definido em `tempo_claro_schema.sql`.
> O banco é um repositório de persistência pura: armazena fatos e estado
> não-derivável, sem views, triggers ou functions. Toda validação de negócio,
> cálculo de gamificação (saldo, ofensiva, XP, nível, inventário) e derivação
> de estados é responsabilidade exclusiva da API Spring Boot.

---

## Sumário

1. Visão geral e fundamentação comportamental
2. As Quatro Leis aplicadas ao Tempo Claro
3. Arquitetura e modelo de dados
4. Regras de negócio transversais (3.1–3.8)
5. Funcionalidades detalhadas (F01–F16)
6. Economia, gamificação e progressão
7. Máquina de estados do hábito
8. Requisitos não funcionais
9. Funcionalidades propostas (roadmap)

---

## 1. Visão geral e fundamentação comportamental

O **Tempo Claro** é um aplicativo móvel multiplataforma cujo propósito é auxiliar o
usuário — com atenção especial a pessoas com **TDAH** — na construção, manutenção e
rastreamento de hábitos saudáveis. A premissa central, retirada de *Hábitos Atômicos*
(James Clear), é que **não nos elevamos ao nível das nossas metas, mas caímos ao nível
dos nossos sistemas**. Por isso o app não vende grandes objetivos: opera como uma
**prótese cognitiva** que reduz a paralisia de decisão, isola a tarefa do momento e
entrega recompensa imediata.

Todo hábito é tratado como um ciclo neurológico de quatro passos — **deixa, anseio,
resposta e recompensa** — e cada funcionalidade reforça uma das Quatro Leis da Mudança
de Comportamento. A pontuação é calculada **estritamente no backend** (API Java/Spring)
para evitar fraudes; a persistência usa **PostgreSQL**; o cliente é construído em
**Flutter** (Android e iOS a partir de uma base única).

**Convenção de status das funcionalidades:** `IMPLEMENTADO` (já existe no código atual)
· `PROPOSTO` (especificado, ainda não codificado).

---

## 2. As Quatro Leis aplicadas ao Tempo Claro

| Lei | Princípio | Tradução no aplicativo |
|-----|-----------|------------------------|
| **1ª — Evidente** | A deixa precisa sair do não-consciente; intenção de implementação e empilhamento de hábitos. | Gatilho/âncora textual, horário agendado por sub-atividade e notificações push. O avatar muda de expressão conforme a hora se aproxima. |
| **2ª — Atrativo** | É a antecipação da recompensa (dopamina) que move a ação. | Avatar evolutivo, tela pré-tarefa motivacional e feedback visual da recompensa. |
| **3ª — Fácil** | Regra dos Dois Minutos; Lei do Menor Esforço. | Meta mínima base pequena, limite de 2 hábitos ativos, foco isolado (um hábito por tela), divisão da meta em sub-atividades curtas. |
| **4ª — Gratificante** | O cérebro repete o que é recompensado de imediato; nunca quebrar a corrente. | Moedas instantâneas, ofensiva/streak com escudos, registro visual de progresso e bônus por superação. |

---

## 3. Arquitetura e modelo de dados

### Divisão de responsabilidades

A arquitetura separa rigidamente duas camadas:

- **PostgreSQL (banco de dados):** repositório de persistência pura. Armazena fatos
  imutáveis (execuções, transações), estado operacional (sessões ativas) e dados de
  configuração (hábitos, usuários). Não contém views, triggers, functions ou qualquer
  lógica de negócio. Garante apenas integridade referencial (FK), unicidade (UNIQUE) e
  consistência de domínio (CHECK).

- **API Spring Boot (backend):** única responsável por toda a inteligência da aplicação.
  Valida regras de negócio antes de escrever no banco (ex.: limite de 2 hábitos),
  calcula saldo de moedas, ofensiva, nível do avatar, inventário de escudos e estatísticas
  semanais via queries e lógica de serviço, e devolve os resultados agregados ao Flutter.

### 3.1 Tabelas (14)

| Tabela | Papel | O que a API faz com ela |
|--------|-------|-------------------------|
| `usuarios` | Conta, autenticação e preferências | Lê fuso para calcular a janela diária; API agrega XP/streak do usuário |
| `categorias_habito` | Moldes fixos Água/Estudo/Exercício | Fonte de verdade da categoria; API valida o código antes de criar hábito |
| `habitos` | Definição do hábito, metas e progressão manual | API consulta `ativo` para validar o limite de 2 antes de inserir |
| `sub_atividades` | Partes da meta diária com janela de horário | API soma `alvo_parcial` para obter a meta total do hábito |
| `habito_dias_semana` | Frequência semanal | API filtra hábitos elegíveis para o dia corrente |
| `perfil_onboarding` | Questionário Medir Dificuldade | API aplica a lógica de sugestão sobre os 4 eixos armazenados |
| `avatares_catalogo` | Catálogo de assets de avatar por nível e expressão | API seleciona o asset com `streak_minimo` ≤ ofensiva calculada |
| `biblioteca_textos` | Frases motivacionais por molde/idioma | API escolhe o texto por `categoria_id` e idioma do usuário |
| `historico_execucoes` | Fato imutável de cada execução | API valida `execution_token` (UNIQUE) antes de inserir; soma `moedas_ganhas` para XP |
| `registros_diarios` | Fechamento do dia (janela 00:00–23:59) | API varre a sequência de `status='CONCLUIDO'` para calcular ofensiva atual |
| `transacoes_moedas` | Ledger da economia (créditos e débitos) | API faz `SUM(valor)` para saldo e `COUNT` por tipo para inventário de escudos |
| `sessoes_execucao` | Sessão ativa ou pausada | API grava e lê para retomar execuções; UNIQUE parcial impede sessão duplicada |
| `sub_atividade_status` | Estado de cada parte no dia | API consulta `executada` e `moedas_creditadas` para aplicar a regra 3.8 |
| `notificacoes` | Lembretes push agendados | API grava e marca como `lida` |

### 3.2 Integridade estrutural do banco

O banco impõe apenas restrições de dados — não de negócio:

- **`UNIQUE` em `historico_execucoes.execution_token`** → impede o banco de aceitar a mesma execução duas vezes, complementando a validação da API (RF21).
- **`UNIQUE (habito_id, data_execucao)` em `registros_diarios`** → garante um único registro de fechamento por hábito por dia (3.3).
- **`UNIQUE INDEX` parcial `uq_sessao_viva_por_habito`** → impede duas sessões ativas/pausadas simultâneas para o mesmo hábito; é uma constraint de integridade de dados, não de negócio.
- **`CHECKs`** → `tipo_medida` (`TEMPO`|`QUANTIDADE`), `tipo_sucesso`, `status` diário, `nivel_aderencia` (1–5), `meta_maxima ≥ meta_base`, `dia_semana` (0–6).

---

## 4. Regras de negócio transversais

Regras únicas aplicadas aos três moldes (Água, Estudo, Exercício). O que muda entre eles
é a unidade de medida e o ícone/avatar. **Toda validação e cálculo ocorre na API.**

### 3.1 Catálogo restrito de moldes
O usuário só cria hábitos a partir de **três moldes fixos**: **Água** (quantidade, em ml),
**Estudo** (tempo) e **Exercício** (tempo ou quantidade). O formulário adapta-se ao molde.
**Implementação:** a API valida que o `categoria_id` recebido corresponde a um dos três
códigos do catálogo (`categorias_habito`) antes de gravar o hábito.

### 3.2 Limite de 2 hábitos ativos
Máximo de **2 hábitos ativos** simultâneos; a tentativa de criar um terceiro é rejeitada.
**Implementação:** antes de qualquer INSERT em `habitos`, a API consulta
`COUNT(*) FROM habitos WHERE usuario_id = ? AND ativo = TRUE` e lança uma exceção de
negócio se o resultado for ≥ 2.

### 3.3 Meta diária na janela 00:00–23:59
A meta é diária e avaliada no total das 24h no fuso do usuário. Não há punição por atraso
durante o dia; a perda de ofensiva só ocorre **após a apuração do fim do dia**.
**Implementação:** a API usa `usuarios.fuso_horario` para definir o fechamento e grava o
resultado em `registros_diarios` com `UNIQUE (habito_id, data_execucao)`.

### 3.4 Meta total + divisão em sub-atividades
A meta diária é um **total** que pode ser dividido em **N partes**, repartidas igualmente,
cada uma com janela de início/fim. Ex.: 1000 ml em 2 partes → 500 ml cada. O excedente
em qualquer parte conta para o total.
**Implementação:** a API calcula `SUM(alvo_parcial) FROM sub_atividades WHERE habito_id = ?`
para obter a meta total; cada parte tem `horario_inicio` e `horario_fim` para a intenção
de implementação (1ª Lei).

### 3.5 Apuração do streak pelo total acumulado
O streak é avaliado pelo **total acumulado do dia**, não por parte. Se o registrado nas
partes somar 100% ou mais da meta, o streak é mantido; senão, é zerado na virada do dia.
**Implementação:** a API calcula a ofensiva varrendo `registros_diarios` em busca de
sequências consecutivas de `status='CONCLUIDO'` (algoritmo gaps-and-islands em memória
ou query). O resultado é retornado na resposta da API, não armazenado.

### 3.6 Progressão manual configurável
A evolução da meta **não é automática**. O usuário define de quantos em quantos dias a meta
aumenta e qual quantidade somar a cada ciclo, até um teto máximo (Princípio Goldilocks).
**Implementação:** a API lê `habitos.dias_para_aumento`, `incremento_meta` e `meta_maxima`
para calcular a meta vigente antes de gravar `registros_diarios.meta_do_dia`.

### 3.7 Pausa e desistência com salvamento parcial
Toda execução pode ser pausada ou desistida, salvando o valor parcial, que entra no total
diário (3.5).
**Implementação:** a API grava o progresso em `sessoes_execucao.valor_parcial` e define
`expira_em = iniciada_em + 1 hora`. Ao retomar, a API lê a sessão e restaura o estado.
Após o timeout, a API marca `estado='TIMEOUT'` e registra a falha.

### 3.8 Recompensa condicionada por sub-atividade
As moedas das sub-atividades são **porções** da recompensa total. Por execução credita-se só a
porção da parte feita; o **total (100 normal / 150 extra) é apurado no fim do dia ou ao "Concluir
Hoje"** (ações equivalentes). Atingir a meta sem executar uma das partes **mantém o streak**
(regra 3.5), mas **desconta proporcionalmente** as porções das partes ausentes do total apurado
(`final = (150 ou 100) − porções não feitas`) — punição exclusivamente econômica.
**Implementação:** a API consulta `sub_atividade_status` (`executada`, `moedas_creditadas`) na
apuração final e abate as porções não creditadas antes de gravar a recompensa do dia.

---

## 5. Funcionalidades detalhadas (F01–F16)

### F01 — Cadastro e autenticação · 1ª Lei · `IMPLEMENTADO`
- **Regra:** registro com nome, e-mail único e senha; login emite **JWT**. Fuso horário e
  idioma são guardados para localizar horários e textos.
- **Gatilho:** abertura do app sem sessão válida → tela de login/registro.
- **Dados:** `POST /auth/register` grava em `usuarios` com `senha_hash`; `POST /auth/login`
  valida e devolve JWT. A API usa `usuarios.fuso_horario` como base da janela diária (3.3).

### F02 — Criação de hábito (Wizard de 3 etapas) · 1ª/3ª Lei · `IMPLEMENTADO`
- **Regra:** fluxo guiado — (1) escolha do molde/avatar; (2) configuração assistida (F16) ou
  manual; (3) metas. Coleta meta base, parâmetros de progressão, frequência semanal, número
  de partes (sub-atividades) com janelas e horário. Bloqueia se já houver 2 hábitos ativos.
- **Gatilho:** card "Começar um novo hábito?" no carrossel da Home.
- **Dados:** `POST /habits` — a API valida o limite de 2 hábitos ativos antes do INSERT,
  cria a linha em `habitos` (`categoria_id` define o molde), insere as linhas em
  `sub_atividades` e em `habito_dias_semana`.

### F03 — Gatilho/Âncora e intenção de implementação · 1ª Lei · `PROPOSTO`
- **Regra:** o usuário descreve a ação que antecede o hábito ("depois do café") e define o
  horário, formando a intenção "vou [ação] às [hora]".
- **Dados:** persistido em `habitos.gatilho_ancora` e `habitos.horario_agendado`; a API
  usa esses campos na tela do hábito e para compor a notificação (F14).

### F04 — Home / Carrossel de foco · 3ª Lei · `IMPLEMENTADO`
- **Regra:** um único hábito por vez no centro (foco isolado, sem lista). Cada card mostra
  moedas, ofensiva e escudos **daquele hábito**. Concluídos vão ao fim; prioriza vencimento
  mais próximo.
- **Concluir Hoje:** assim que a **meta diária é atingida**, o card oferece **"Concluir Hoje"**
  (mesmo com sub-atividades pendentes). Ao concluir, o avatar fica **alegre** ("Parabéns, você
  atingiu sua meta hoje"), o dia é encerrado e as tarefas restantes do dia não são mais
  executáveis (perdendo suas porções de moeda — ver §6). Enquanto não concluir, o usuário pode
  continuar as sub-atividades para perseguir o bônus extra. Encerrar antecipadamente e a virada
  do dia fazem a **mesma apuração**.
- **Gatilho:** login bem-sucedido → carregamento da Home.
- **Dados:** `GET /dashboard` — a API consulta `habitos`, agrega o saldo de moedas via
  `SUM(valor) FROM transacoes_moedas`, conta escudos disponíveis comparando débitos e
  consumos, e calcula a ofensiva atual varrendo `registros_diarios`. O vencimento do dia
  é derivado de `horario_agendado` + `fuso_horario`.

### F05 — Avatar evolutivo e estados de urgência · 2ª/4ª Lei · `IMPLEMENTADO (parcial)`
- **Regra:** o avatar reflete o estado emocional conforme o tempo até o vencimento — *Normal*
  (>2h), *Preocupado* (<2h), *Desesperado* (**da hora marcada em diante**, inclusive após 1h de
  atraso), *Concluído* (meta diária atingida — avatar alegre). O *Desesperado* **permanece até a
  virada do dia** enquanto a meta não for cumprida; **FALHA não é uma expressão de meio-dia**:
  só ocorre na apuração do fim do dia (ou timeout de sessão >1h). Quando o horário de uma
  sub-atividade passa sem execução, **aquela parte** é contabilizada como falha (perde a porção
  de moedas — ver §6), mas o usuário **ainda pode atingir a meta diária** com as demais partes.
  A **aparência evolui a cada 10 dias de ofensiva** (sobe de dezena).
- **Gatilho:** cálculo em tempo real na Home a cada render (compara horário-alvo × relógio).
- **Dados:** a **expressão** é derivada no cliente a partir do horário; o **nível** é
  calculado pela API como `(dias_seguidos / 10) * 10`. A API então consulta
  `avatares_catalogo` buscando o registro com `categoria_id` correto, maior `streak_minimo`
  ≤ ofensiva e `estado_expressao` correspondente ao estado atual.

### F06 — Tela pré-tarefa (priming motivacional) · 2ª Lei · `IMPLEMENTADO`
- **Regra:** transição curta antes da execução exibe uma frase preparatória (ritual de
  motivação).
- **Gatilho:** toque no botão Play do hábito.
- **Dados:** `GET /habits/{id}/priming` — a API consulta `biblioteca_textos` por
  `categoria_id` e idioma do usuário; usa o registro com `categoria_id` nulo como
  fallback genérico.

### F07 — Execução em Modo Tempo (Estudo/Exercício) · 3ª/4ª Lei · `IMPLEMENTADO`
- **Regra:** cronômetro regressivo iniciando na meta da sessão. Ao zerar, vibra, fica verde e
  passa a progressivo (overachievement). "Concluir" só aparece ao atingir a meta.
- **Gatilho:** saída da tela pré-tarefa (F06).
- **Dados:** ao concluir, o cliente gera um `execution_token` único e envia
  `POST /habits/{id}/executions`. A API verifica se o token já existe em
  `historico_execucoes` (UNIQUE) e registra o fato. **A recompensa total (100/150) NÃO é fechada
  por execução** — cada parte credita só a sua **porção**; o valor total é apurado no **fim do
  dia** ou ao **"Concluir Hoje"** (ver §6 e regra 3.5/3.8).

### F08 — Execução em Modo Quantidade (Água) · 3ª/4ª Lei · `IMPLEMENTADO`
- **Regra:** fração (ex.: 250/2000 ml) com botões +/− e barra circular; também aceita valor
  exato. "Concluir" habilita ao atingir 100% do alvo; excedente é registrado como extra.
- **Gatilho:** saída da pré-tarefa (F06) para hábito de categoria Água.
- **Dados:** mesma rota de F07. A API define `tipo_sucesso='COMPLETE_EXTRA'` quando
  `valor_realizado` supera 120% do alvo.

### F09 — Proteção de fuga (pausa por minimização) · 3ª Lei · `IMPLEMENTADO (parcial)`
- **Regra:** ao minimizar o app durante a execução, o cronômetro pausa e o estado é salvo. Ao
  voltar em até 1h, um modal pergunta se deseja continuar; passando de 1h, falha por timeout.
- **Gatilho:** evento de perda de foco/visibilidade da aplicação.
- **Dados:** a API grava a sessão em `sessoes_execucao` com `estado='PAUSADO'`,
  `valor_parcial` e `expira_em = iniciada_em + 1h`. Ao retornar, a API verifica se
  `expira_em > now()` para decidir entre retomada ou timeout. O timeout resulta em
  `POST /executions` com `tipo_sucesso='FAIL_TIMEOUT'`.

### F10 — Pausa e desistência com salvamento parcial · 4ª Lei · `IMPLEMENTADO`
- **Regra:** ao sair no meio, o **valor parcial é salvo** e entra no total diário (3.5). Desistir de
  **uma pré-tarefa não consome escudo nem zera a ofensiva sozinho** — apenas perde a porção daquela
  parte. O **escudo protege a meta diária**: é consumido **automaticamente na apuração do fim do
  dia** se a meta diária não foi atingida e houver escudo disponível (preservando a ofensiva).
- **Gatilho:** toque em "Desistir" durante a execução.
- **Dados:** a API calcula o inventário de escudos consultando `transacoes_moedas`
  (`COUNT DEBITO_ESCUDO` menos os escudos já consumidos). Na **apuração do fim do dia**, se a meta
  diária não foi atingida e há escudo disponível, a API consome 1 escudo, registra o
  `FAIL_BLOQUEIO` e marca `registros_diarios.protegido_por_escudo = TRUE` (a ofensiva é preservada);
  sem escudo, o dia fecha como `FALHA` e a ofensiva zera.

### F11 — Tela de estatísticas (Stats) · 4ª Lei · `IMPLEMENTADO (frontend; backend a completar)`
- **Regra:** lê o hábito focado e exibe constância semanal, total dos últimos 7 dias e
  recorde de sessão.
- **Gatilho:** navegação para a aba Stats.
- **Dados:** `GET /stats/weekly` — a API consulta `registros_diarios` dos últimos 7 dias
  para calcular dias cumpridos e total acumulado; consulta `historico_execucoes` para
  obter o `MAX(valor_realizado)` como recorde de sessão.

### F12 — Loja / Baú de escudos · 4ª Lei · `IMPLEMENTADO`
- **Regra:** o usuário troca moedas por **escudos** ao custo de **1500 moedas** cada; cada
  escudo protege a ofensiva de **uma falha na meta diária** (consumido automaticamente no fim do
  dia, não na desistência de uma pré-tarefa).
- **Gatilho:** toque na Loja e confirmação da compra.
- **Dados:** `POST /habits/{id}/shield` — a API calcula o saldo atual via
  `SUM(valor) FROM transacoes_moedas WHERE habito_id = ?`, valida se saldo ≥ 1500 e
  insere uma transação `DEBITO_ESCUDO` com `valor = -1500`. O inventário atualizado é
  recalculado pela API antes de retornar a resposta.

### F13 — Telas de Sucesso e Falha · 4ª Lei · `IMPLEMENTADO`
- **Regra:** *Sucesso* — avatar feliz, moedas creditadas e feedback ("Incrível" no bônus).
  *Falha* — "ofensiva zerada, recomece amanhã" (princípio "nunca falhar duas vezes").
- **Gatilho:** resposta da API à execução.
- **Dados:** a resposta de `POST /executions` inclui as moedas ganhas (calculadas pela API),
  o saldo atualizado, a ofensiva recalculada e o texto de `biblioteca_textos`, tudo
  composto na camada de serviço antes de serializar a resposta.

### F14 — Notificações push por horário · 1ª Lei · `PROPOSTO`
- **Regra:** lembrete no horário agendado de cada sub-atividade torna a deixa evidente.
- **Gatilho:** agendador (job Spring) disparado pelos horários de `habitos.horario_agendado`
  e `sub_atividades.horario_inicio`.
- **Dados:** a API grava registros em `notificacoes` e envia o push; o texto é buscado em
  `biblioteca_textos.texto_aviso_urgencia`.

### F15 — Widget de progresso na home screen · 1ª/4ª Lei · `PROPOSTO`
- **Regra:** widget nativo estilo Duolingo exibindo, sem abrir o app, o percentual da meta do
  dia, a ofensiva e as sub-atividades pendentes; tocar abre o hábito pendente.
- **Gatilho:** atualização periódica pelo SO e após cada execução.
- **Dados:** consome o mesmo endpoint de `GET /dashboard` (percentual calculado pela API
  com base em `registros_diarios` e `sub_atividade_status`), armazenado em cache local
  para exibição offline. Requer camada nativa de widget.

### F16 — Questionário "Medir Dificuldade" · 1ª/3ª Lei · `PROPOSTO`
- **Propósito:** substituir o preenchimento manual por um questionário que **triangula** a
  configuração ideal (Regra dos Dois Minutos + Goldilocks).
- **Quatro eixos:** disponibilidade de dias, janelas de horário, experiência prévia e
  aderência/atrito.
- **Lógica (na API):** a meta base parte de uma fração da experiência prévia, ajustada
  para baixo conforme o atrito; a frequência semanal respeita os dias informados;
  incremento e intervalo são inversamente proporcionais ao atrito; a meta máxima reflete
  a ambição realista.
- **Gatilho:** etapa 2 do Wizard (F02), card "Medir Dificuldade".
- **Dados:** respostas e sugestões gravadas em `perfil_onboarding`; as sugestões
  pré-preenchem a etapa 3 do Wizard, que grava os valores finais em `habitos`.

---

## 6. Economia, gamificação e progressão

Toda a economia é um **livro-razão** (`transacoes_moedas`): saldo, XP e inventário são
calculados pela API consultando esse ledger e as tabelas de fato. Nenhum valor agregado é
armazenado em cache no banco.

| Mecânica | Regra | Como a API implementa |
|----------|-------|-----------------------|
| Quando credita | A recompensa total **só é apurada no fim do dia ou ao "Concluir Hoje"** (ações equivalentes). Por execução, credita-se apenas a **porção** da sub-atividade. | API registra `historico_execucoes`/`CREDITO_SUBATIVIDADE` na execução e faz a apuração final na virada do dia (ou no encerramento antecipado). |
| Recompensa padrão | Meta diária atingida **com todas as sub-atividades feitas** → **100 moedas**. | API valida `registros_diarios.status='CONCLUIDO'` e que nenhuma parte foi perdida; credita o complemento até 100. |
| Bônus por superação | Meta superada em **≥20%** (≥120% do alvo) → **150 moedas**. | API define `COMPLETE_EXTRA` e credita o complemento até 150. |
| Desconto por sub-atividade ausente | Se a meta (normal ou extra) foi atingida **mas faltaram sub-atividades**, desconta-se **proporcionalmente**: `final = (150 ou 100) − porções das partes não feitas`. | API consulta `sub_atividade_status.executada` e abate as porções não creditadas do total apurado. |
| Ofensiva (streak) | +1 por dia cumprido, apurado no fim do dia pelo total acumulado. Falha não protegida zera. | API varre `registros_diarios` em busca de sequência de `status='CONCLUIDO'` e retorna a contagem. |
| Nível do avatar | A cada **10 dias consecutivos** o hábito sobe de dezena e o avatar evolui. | API calcula `nivel = (streak / 10) * 10` e busca o asset em `avatares_catalogo` com `streak_minimo` ≤ valor. |
| Escudo | Custa **1500 moedas** (`DEBITO_ESCUDO`); protege a ofensiva de uma desistência (`FAIL_BLOQUEIO`). | API valida o saldo via `SUM(valor)` antes de inserir o débito. Inventário = `COUNT DEBITO_ESCUDO` − `COUNT FAIL_BLOQUEIO`. |
| Antifraude | Todo cálculo no backend; `execution_token` garante idempotência; ledger audita a economia. | UNIQUE em `execution_token`; toda pontuação calculada e inserida pelo service layer. |
| Progressão manual | A meta sobe a cada N dias somando um incremento até o teto. Nunca automática. | API lê `dias_para_aumento`/`incremento_meta`/`meta_maxima` e calcula `meta_do_dia` antes de gravar `registros_diarios`. |

---

## 7. Máquina de estados do hábito

Os oito estados **não são armazenados em coluna** — são **derivados pela API** a partir das
tabelas de fato e sessão. Isso garante consistência entre múltiplos dispositivos e o widget
sem nenhuma lógica no banco.

| Estado | Condição de entrada | Como a API deriva |
|--------|---------------------|-------------------|
| NORMAL | Mais de 2h antes do horário; meta não cumprida. | API compara `horario_agendado` + `fuso_horario` com o instante atual. |
| PREOCUPADO | Falta menos de 2h para o horário. | Mesma comparação com threshold de 2h. |
| DESESPERADO | Da hora marcada **em diante** (inclusive após 1h de atraso); **permanece até a virada do dia** enquanto a meta não for atingida. | Comparação `horario_agendado` ≤ agora e meta diária ainda não cumprida. |
| EM_EXECUCAO | Toque em Play → execução. | API verifica `sessoes_execucao.estado = 'EM_EXECUCAO'` para o hábito. |
| PAUSADO | Minimizar o app ou tocar em Desistir. | API verifica `sessoes_execucao.estado = 'PAUSADO'` para o hábito. |
| CONCLUIDO (dia) | Total acumulado ≥ 100% da meta diária (avatar alegre). Habilita **"Concluir Hoje"**. | API lê `registros_diarios.status = 'CONCLUIDO'`/valor acumulado ≥ meta do dia. |
| SUCESSO (apurado) | Virada do dia **ou "Concluir Hoje"** com meta cumprida. | API grava `registros_diarios.status = 'CONCLUIDO'`, apura a recompensa (100/150 − porções ausentes) e recalcula ofensiva. |
| FALHA | Virada do dia sem meta e sem escudo, ou timeout >1h. Com escudo, o dia é protegido em vez de falhar. | API grava `registros_diarios.status = 'FALHA'` (ou consome escudo) ou `sessoes_execucao.estado = 'TIMEOUT'`. |

---

## 8. Requisitos não funcionais

| ID | Categoria | Requisito |
|----|-----------|-----------|
| RNF01 | Portabilidade | Multiplataforma (Android e iOS) a partir de base única em **Flutter**. |
| RNF02 | Usabilidade | Foco isolado (um hábito por tela), reduzindo a sobrecarga cognitiva. |
| RNF03 | Acessibilidade | Adequado a usuários com TDAH, com fluxo livre de distrações. |
| RNF04 | Usabilidade | Calibração de metas assistida por questionário (F16). |
| RNF05 | Desempenho | A Home carrega os hábitos em tempo aceitável após o login. |
| RNF06 | Confiabilidade | O estado da execução é persistido no servidor (`sessoes_execucao`) e recuperado após minimizar. |
| RNF07 | Segurança | Senhas com hash; acesso protegido por **JWT**. |
| RNF08 | Integridade | Pontuação calculada **exclusivamente no servidor** (camada de serviço Spring Boot). |
| RNF09 | Integridade | Execuções duplicadas bloqueadas por `execution_token` (validado pela API + UNIQUE no banco). |
| RNF10 | Manutenibilidade | Arquitetura separa **frontend Flutter**, **backend Java/Spring (REST)** e **banco PostgreSQL (persistência pura)**. |
| RNF11 | Persistência | Dados em **PostgreSQL**, modelo normalizado, sem lógica de negócio no banco. |
| RNF12 | Disponibilidade | Backend e banco implantados em nuvem. |
| RNF13 | Localização | Respeita fuso horário e idioma do usuário. |
| RNF14 | Escalabilidade | API suporta o crescimento de usuários e hábitos. |
| RNF15 | Compatibilidade offline | Execução em andamento e widget resistem à perda momentânea de conexão (cache local no cliente). |

**Metodologia:** desenvolvimento ágil (Scrum) · entregas iterativas e incrementais · testes de software e usabilidade.

---

## 9. Funcionalidades propostas (roadmap)

Itens registrados como evolução futura. As estruturas de banco correspondentes estão
**comentadas** na Seção D de `tempo_claro_schema.sql`, prontas para ativação. A lógica
de cada funcionalidade será implementada na API quando o item sair do roadmap.

- **Verificação por GPS na academia** (1ª/3ª Lei) — colunas `latitude_alvo`/`longitude_alvo`/
  `raio_metros` em `habitos`; `latitude_registro`/`longitude_registro` no histórico/registros.
  A API validará a presença por geolocalização antes de aceitar a execução.
- **Método Pomodoro no estudo** (3ª Lei) — `pomodoro_foco_min`/`pomodoro_pausa_min` em
  `habitos`; a API controlará os ciclos de foco/pausa sobre o timer atual.
- **Bloqueio de tela durante o estudo** (3ª Lei) — reduzir distração na sessão; implementado
  via camada nativa do Flutter.
- **Micro-hábitos / Regra dos Dois Minutos** (3ª Lei) — tabela `micro_habitos` (fases
  prática/emocional); a API usará as fases para sugerir o menor início possível.
- **Compartilhamento de troféus** (RF12, 4ª Lei) — tabela `trofeus`; a API gerará troféus
  com base em marcos calculados no serviço de gamificação.
- **Widget nativo na home screen** (F15) — consome `GET /dashboard`; a API agrega os dados
  de `registros_diarios` e `sub_atividade_status` e os entrega em cache local no cliente.

---

*Documento gerado como especificação funcional definitiva de apoio ao Projeto de Graduação.
As regras descritas refletem fielmente o esquema `tempo_claro_schema.sql` e a arquitetura
de responsabilidades entre banco de dados e API Spring Boot.*
