# Tempo Claro — Plano de Execução

**Origem:** `TempoClaro_Revisao_Geral.md` (26/08/2026)
**Repositório:** `Rodrimir/tempo-claro-tcc-tsi` · branch `main`
**Stack:** React + Vite + Tailwind (front, APK via Capacitor) · Java + Spring Boot + JWT (back) · PostgreSQL/Neon

---

## Como usar este documento

Coloque este arquivo na raiz do repositório. Cada tarefa tem um bloco **`▶ Prompt`** pronto para colar no Claude Code. Trabalhe **uma tarefa por vez** e só marque o checkbox depois que o critério de aceite passar.

**Regra de ouro para o Claude Code:** antes de cada etapa, dê este contexto uma vez por sessão:

```
Leia PLANO_EXECUCAO.md. Vamos executar a tarefa [ID].
Não altere nada fora do escopo da tarefa. Antes de editar,
me mostre quais arquivos você vai tocar e por quê.
Ao terminar, rode o critério de aceite e me diga se passou.
```

### Convenções

| Item               | Padrão                                                                                                                       |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Branch por etapa   | `etapa-1-correcoes-criticas`, `etapa-2-...`                                                                                  |
| Commit             | `fix(E1.2): protege rota /execute contra acesso direto`                                                                      |
| Migração de schema | **Sempre** `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` no `schema.sql` — o projeto não usa Flyway e o script roda a cada boot |
| Nunca              | Refatorar arquitetura, renomear pastas ou trocar bibliotecas fora de uma tarefa que peça isso                                |

### Esforço

`XS` até 30 min · `S` até 2 h · `M` meio dia · `L` 1–2 dias · `XL` mais que isso

---

## Decisões — fechadas em 27/08/2026

Registradas por extenso no topo do `CLAUDE.md` (Seção D). Resumo:

| #      | Decisão                          | Resolução                                                                             | Efeito no plano                                                                                                                                    |
| ------ | -------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1** | Modelo de dados                  | O esquema real (schema.sql v2.1) substitui o ER conceitual. Sem seção "dois modelos". | **E9.3** simplificada — só gera o DDL final e o ER correspondente, sem seção comparativa                                                           |
| **D2** | Escudo automático às 23:59       | **Implementar.**                                                                      | **E4.3** deixa de ser condicional — entra na Etapa 4 normalmente. **E1.7** ainda corrige o texto agora, porque a mecânica só existe depois da E4.3 |
| **D3** | Push, widget, i18n               | **Trabalhos futuros.**                                                                | **E6.2** deixa de ser condicional — executa na Etapa 6. **E9.1** registra RF18/RF19/RNF16 como trabalho futuro justificado                         |
| **D4** | Questionário "Medir Dificuldade" | **Trabalho futuro.** Reforçar o preenchimento manual agora.                           | **Etapa 5 inteira sai do caminho de execução** — não entrar nela. **E2.6** ganha escopo maior (ver nota abaixo)                                    |

**Pendência aberta por causa das decisões:** o `HabitoRequestDTO` real (confirmado em `docs/MAPA_DO_CODIGO.md`) tem um campo `modalidade` que nenhum documento de revisão havia identificado. Adicionei a tarefa **E0.5.0** para investigar antes de aplicar o schema.

**Nota sobre E2.6:** como o questionário não vai existir, o formulário manual é a única porta de entrada para configurar um hábito. A tarefa foi reescrita para tratar isso com o peso que agora tem.

---

## Mapa das etapas

| Etapa   | Nome                                                                    | Tarefas | Esforço | Depende de |
| ------- | ----------------------------------------------------------------------- | ------- | ------- | ---------- |
| **0**   | Preparação e baseline                                                   | 4       | S       | —          |
| **0.5** | **Recriação do banco (schema v2.1)**                                    | 6       | M       | E0         |
| **1**   | Correções críticas (P0)                                                 | 8       | M       | E0.5       |
| **2**   | Fechar o que já está anunciado (P1)                                     | 9       | L       | E1         |
| **3**   | Estados vazios e limpeza                                                | 5       | M       | E2         |
| **4**   | Escopo novo essencial                                                   | 4       | L       | E3         |
| **5**   | ~~Questionário de calibração~~ — **NÃO EXECUTAR** (D4: trabalho futuro) | 3       | —       | —          |
| **6**   | Acessibilidade e decisões de escopo                                     | 3       | M       | E3         |
| **7**   | Testes automatizados                                                    | 4       | M       | E4         |
| **8**   | Build, deploy e validação                                               | 4       | M       | E7         |
| **9**   | Sincronizar documentação do TCC                                         | 4       | M       | E8         |

**Caminho mínimo para uma banca segura:** E0 → E0.5 → E1 → E2 → E3 → E8 → E9.
As etapas 4 a 7 melhoram o produto e a nota, mas não são pré-requisito da defesa.

---

# ETAPA 0 — Preparação e baseline

> Objetivo: o Claude Code precisa conhecer o terreno antes de mexer. Nenhuma linha de produção muda aqui.

### ☐ E0.1 — Inventário real do repositório `XS`

**Por quê:** o `funcionalidades.md` descreve o comportamento, não a localização dos arquivos. Sem esse mapa, cada tarefa começa com uma busca cega.

**▶ Prompt**

```
Faça um inventário do repositório e escreva em docs/MAPA_DO_CODIGO.md:

1. Árvore de pastas do frontend e do backend (2 níveis)
2. Tabela: cada tela do app → arquivo do componente → rota
3. Tabela: cada endpoint da API → controller → service → repository
4. Lista dos DTOs com todos os seus campos
5. Conteúdo atual do schema.sql, tabela por tabela, com colunas e tipos

Não altere nenhum arquivo de código. Só leia e documente.
```

**Aceite:** `docs/MAPA_DO_CODIGO.md` existe e lista as 10 telas, os 11 endpoints e as 5 tabelas.

---

### ☐ E0.2 — Baseline de build `XS`

**▶ Prompt**

```
Verifique se o projeto sobe do zero, e registre o resultado em docs/BASELINE.md:

Backend: ./gradlew clean build -x test e ./gradlew bootRun
Frontend: npm ci && npm run build && npm run dev
Capacitor: npx cap sync android

Para cada comando, registre: passou/falhou, tempo, e os warnings.
Se algo falhar, NÃO corrija ainda — só documente o erro completo.
```

**Aceite:** os três builds passam, ou os erros estão documentados com stack trace.

---

### ☐ E0.3 — Atualizar o `CLAUDE.md` do projeto `XS`

**▶ Prompt**

```
Reescreva o CLAUDE.md da raiz com:

- Stack e comandos de build/run (do BASELINE.md)
- As 4 decisões (D1..D4) e suas respostas
- Regras invioláveis do projeto:
  * Toda pontuação e classificação de superação é calculada no SERVIDOR
  * Migração de schema só via ALTER TABLE ... ADD COLUMN IF NOT EXISTS no schema.sql
  * Nenhum campo enviado pelo front pode ser descartado em silêncio pelo DTO
  * Nenhuma requisição pode falhar sem retorno visível ao usuário
  * Limite de hábitos ativos = 2 (constante única, sem número mágico duplicado)
- Referência: PLANO_EXECUCAO.md é a fonte da ordem de trabalho
```

**Aceite:** `CLAUDE.md` contém as 5 regras invioláveis e as 4 decisões respondidas.

---

### ☐ E0.4 — Congelar o estado atual `XS`

**▶ Prompt**

```
Crie a tag git "baseline-pre-plano" no commit atual e confirme.
Depois crie e faça checkout da branch etapa-1-correcoes-criticas.
```

**Aceite:** `git tag` lista `baseline-pre-plano`; branch nova ativa.

---

# ETAPA 0.5 — Recriação do banco (schema v2.1)

> **Por que esta etapa existe e por que ela vem agora.** O esquema v2.1 (arquivo `schema.sql`) adota a convenção de prefixos, acrescenta as colunas que as Etapas 2 e 4 precisariam criar uma a uma, e restaura a integridade referencial. Fazer isso **antes** da Etapa 1 evita renomear coluna com o projeto já em movimento — o projeto não usa Flyway, então cada `ALTER` acumulado depois vira risco.
>
> **Pré-condição:** confirmar que o banco do Neon tem apenas dado de teste. Se tiver, recriar é mais rápido e mais seguro que migrar.

### ☐ E0.5.0 — Investigar o campo `modalidade` `XS` ⭐

**Por quê:** `HabitoRequestDTO` e `Habito` têm um campo `modalidade`, separado de `categoria` e `tipo_medida`, confirmado em `docs/MAPA_DO_CODIGO.md`. Nenhum documento de revisão o identificou antes. O schema v2.1 já reservou `hab_modalidade` como coluna nullable, mas **não decida o que fazer com ela sem saber o que ela guarda.**

**▶ Prompt**

```
Investigue o campo "modalidade" antes de mexermos no schema:

1. No frontend, busque toda referência a "modalidade" — no formulário de
   criação de hábito, em qualquer estado, payload ou constante
2. Liste os valores possíveis que o campo assume na interface hoje
   (ex.: está sempre vazio? tem um seletor com opções fixas? é enviado
   como cópia de outro campo?)
3. No backend, confirme se HabitoService ou algum outro ponto LÊ esse
   campo para alguma decisão de negócio, ou se ele só é persistido e
   nunca mais usado
4. Não altere nenhum arquivo. Devolva um resumo: o que a UI envia,
   o que o backend faz com isso, e sua hipótese sobre a intenção original
   do campo (por exemplo: distinguir "guiado" de "livre", ou ser um
   resquício de versão anterior do formulário)
```

**Aceite:** você recebe um resumo claro do comportamento real de `modalidade` e decide, com essa informação, se ele vira campo de negócio de verdade, sinônimo a remover, ou é descartado. Só depois disso a E0.5.2 aplica o schema.

---

### ☐ E0.5.1 — Confirmar que o banco pode ser recriado `XS`

**▶ Prompt**

```
Conecte no banco atual e me diga, por tabela: quantidade de linhas,
e-mails cadastrados e data da primeira e da última execução registrada.
Não altere nada. Quero decidir entre recriar e migrar.
```

**Aceite:** você confirma por escrito que não há dado real a preservar. Se houver, pare e me chame — o caminho passa a ser `ALTER TABLE ... RENAME COLUMN`, não recriação.

---@@@@

### ☐ E0.5.2 — Aplicar o schema v2.1 `S`

**▶ Prompt**

```
1. Substitua o schema.sql do projeto pelo arquivo schema.sql v2.1 que vou colar
2. Faça DROP das tabelas antigas na ordem inversa das dependências
3. Suba a aplicação e confirme que o schema.sql executou sem erro
4. Valide no banco: 8 tabelas, 1 view (vw_habito_hoje), todas as FKs presentes,
   e os 3 registros da biblioteca_textos carregados
5. Rode o script uma segunda vez e confirme que é idempotente

Não toque nas entidades Java ainda — isso é a próxima tarefa.
```

**Aceite:** `\d+` mostra as 8 tabelas com FK; `SELECT * FROM biblioteca_textos` traz 3 linhas; segundo boot não gera erro.

---@@@

### ☐ E0.5.3 — Adequar repositórios, models e DTOs `M` ⭐

**Atenção:** é a tarefa de maior risco de toda a Etapa 0.5. Todos os nomes de coluna mudaram.

**Correção importante de premissa:** o projeto **não usa JPA/Hibernate**. É `JdbcTemplate` puro — cada repository declara as queries como `String` constantes (`FIND_BY_ID`, `INSERT_HABITO`, etc.) e mapeia o `ResultSet` manualmente com um `RowMapper` lambda. Não existe `@Entity`, `@Table` nem `@Column` no projeto. A tarefa é **reescrever as strings SQL e os RowMappers**, não anotar classes.

**▶ Prompt**

```
Adeque a camada de persistência ao schema v2.1. O projeto usa JdbcTemplate
puro (sem JPA) — cada repository tem queries como constantes String e um
RowMapper lambda manual. Ajuste isso, não crie anotações @Entity.

1. Em cada repository existente (HabitoRepository, StatusHabitoRepository,
   HistoricoExecucaoRepository, UsuarioRepository, BibliotecaTextoRepository),
   reescreva as strings de INSERT/UPDATE/SELECT com os nomes de coluna
   prefixados (hab_titulo, usu_email, etc.) e ajuste o RowMapper de cada uma
   para ler pelos nomes novos
2. Mantenha os nomes dos campos das classes de model (Habito.java, Usuario.java...)
   e dos DTOs sem prefixo — o prefixo é só convenção de coluna de banco
3. Crie os repositories novos no mesmo padrão manual (query como constante
   String + RowMapper lambda): SubAtividadeRepository, CalibracaoRepository,
   CalibracaoRespostaRepository, DispositivoPushRepository
4. Crie os models correspondentes (SubAtividade, Calibracao, CalibracaoResposta,
   DispositivoPush), no mesmo estilo Lombok @Builder dos models existentes
5. Restaure BibliotecaTextoRepository com as queries usando os nomes bib_*
6. Os DTOs de API (HabitoRequestDTO, HabitoResponseDTO etc.) NÃO mudam de
   nome de campo nesta tarefa — o contrato com o front permanece igual
7. HabitoRepository.UPDATE_HABITO hoje só atualiza titulo, meta_base e ativo,
   embora HabitoRequestDTO tenha 9 campos — deixe registrado num comentário
   que essa divergência será fechada na E2.9, não a resolva aqui

Ao final, liste todos os arquivos alterados e rode o build.
```

**Aceite:** `./gradlew build` passa; a aplicação sobe; `GET /api/dashboard` responde com o mesmo formato de JSON de antes (mesmos nomes de campo do DTO).

---@@@

### ☐ E0.5.4 — Normalizar o fuso horário para identificador IANA `S` ⭐

**O problema:** o seletor do Perfil guarda rótulos como `Brasília (BRT)`. `BRT` não é identificador IANA e `ZoneId.of("BRT")` lança exceção. Como o fuso governa a virada do dia, isso derruba o fechamento diário para qualquer valor salvo.

**▶ Prompt**

```
1. O front passa a enviar identificador IANA como valor da opção,
   mantendo o rótulo amigável só na exibição:
      America/Sao_Paulo  → "Brasília (BRT)"
      America/New_York   → "Nova York (EST)"
      Europe/London      → "Londres (GMT)"
2. O backend valida com ZoneId.of() antes de salvar e devolve 400
   para identificador inválido
3. Crie um método utilitário único, ZonaUsuario.resolver(usuario), que
   devolve ZoneId e faz fallback para America/Sao_Paulo quando nulo ou inválido.
   NENHUM outro ponto do código pode chamar ZoneId.of diretamente
4. Ofereça no seletor a lista completa de fusos do Brasil, não só três
```

**Aceite:** salvar `Europe/London` persiste a string IANA; enviar `BRT` retorna 400.

---@@@@@

### ☐ E0.5.5 — Criar sub-atividade na criação do hábito `S`

**Por quê:** no schema v2.1 não existe mais `meta_frequencia_diaria` — **a contagem de linhas em `sub_atividades` é a meta de frequência diária**. Um hábito sem sub-atividade fica invisível para a view `vw_habito_hoje`.

**▶ Prompt**

```
1. Ao criar um hábito, gere sempre pelo menos 1 sub_atividade
   (ordem 1, horário informado ou 23:59, sub_alvo = hab_meta_base)
2. Quando "Vezes ao Dia" for N, gere N linhas repartindo hab_meta_base
   igualmente, jogando o resto na última ocorrência
3. Valide no service: a soma dos sub_alvo tem de igualar hab_meta_base
4. Ao editar o hábito, recalcule as sub-atividades de forma consistente

Escreva um teste que crie um hábito de 2100 ml em 3 vezes e confirme
três linhas de 700.
```

**Aceite:** todo hábito criado tem ao menos uma sub-atividade; a soma dos alvos fecha com a meta.

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@2

# ETAPA 1 — Correções críticas (P0)

> Objetivo: acabar com o que engana o usuário e com o que corrompe dado. Quatro destas somam menos de uma hora e resolvem nove sintomas visíveis.

### ☐ E1.1 — Expor `status` no `HabitoResponseDTO` `XS` ⭐

**O problema:** o front consulta `habito.status === 'COMPLETED'` em 8 pontos de 3 arquivos. O DTO tem 16 campos e nenhum se chama `status`. A comparação sempre dá falso.

**O que isso destrava de uma vez:** cartão verde "Concluído Hoje", selo `TAREFA FEITA`, botão central vira ✓, avatar feliz, reordenação do carrossel (concluídos para o fim) e o filtro da loja.

**▶ Prompt**

```
No backend, adicione o campo "status" ao HabitoResponseDTO.

A regra JÁ ESTÁ no banco: a view vw_habito_hoje (schema v2.1) devolve
status_hoje = COMPLETED/PENDING e meta_frequencia_diaria derivada da
contagem de sub_atividades. Consuma a view — não reescreva a regra em Java.

Inclua no DTO: status, meta_frequencia_diaria e execucoes_hoje,
para o front poder exibir o progresso "2 de 3".
Não crie coluna nova.

Depois verifique no frontend os 8 pontos que comparam status === 'COMPLETED'
e confirme que todos passam a funcionar. Liste-os para mim.
```

**Aceite:** com o hábito concluído no dia, `GET /api/dashboard` devolve `"status":"COMPLETED"` para o hábito, o cartão fica verde e o botão central vira ✓.

> Correção de rota: o endpoint real de listagem é `GET /api/dashboard` (`HabitoController.getDashboard`), não `GET /habits` — confirmado em `docs/MAPA_DO_CODIGO.md`. Não existe um `GET /api/habits` de listagem no projeto.

---@@@@@@@@@@@

### ☐ E1.2 — Proteger a rota `/execute` (fim do "Modo Anônimo") `S` ⭐

**O problema:** recarregar a página durante uma execução monta um cronômetro falso de 25:00 rotulado "Modo Anônimo" e, ao concluir, **grava uma execução no `habito_id = 1`**. Recarregar a página é ação banal — é o bug de maior probabilidade real do sistema.

**▶ Prompt**

```
Corrija o acesso à rota /execute:

1. Persista o id do hábito em execução no sessionStorage ao montar a tela
2. Ao montar: se não houver hábito no contexto, tente recuperar do sessionStorage
3. Se ainda assim não houver, redirecione para /home (mesmo guard que /pretask já usa)
4. Remova completamente o fallback "Modo Anônimo" e o cronômetro padrão de 25:00
5. Remova qualquer literal de habito id 1 usado como padrão

Depois verifique se sobrou algum outro ponto no código com id de hábito hardcoded.
```

**Aceite:** abrir `/execute` direto pela URL redireciona para `/home`; recarregar durante a execução retoma o hábito correto com o tempo compensado; nenhuma execução é gravada no hábito 1.

---@@@@@@

### ☐ E1.3 — Alinhar o limite de hábitos em 2 `XS`

**O problema:** a regra real é 2 (`HabitoService.LIMITE_HABITOS_ATIVOS`), o slide de criação da home aparece até 5, e a mensagem de erro cita 5. O usuário percorre três passos do assistente para receber um erro com o número errado.

**▶ Prompt**

```
Unifique o limite de hábitos ativos em 2:

1. Backend: exponha o limite no DTO de resposta ou num endpoint de configuração,
   para o front não repetir o número
2. Home: o slide "Começar um novo hábito?" só aparece se o total de hábitos ativos
   for menor que o limite
3. Assistente: mensagem de erro passa a usar o limite vindo do servidor,
   não um literal
4. Elimine todo número mágico 5 relacionado a esse limite

Me mostre os arquivos alterados e confirme que não sobrou nenhum "5" hardcoded.
```

**Aceite:** com 2 hábitos ativos o slide de criação some do carrossel; a mensagem de erro (se ainda alcançável) cita 2.

---@@@@@@

### ☐ E1.4 — Corrigir o falso sucesso na troca de senha `XS`

**O problema:** preencher **só** "Senha Atual" no Perfil envia um pedido sem nenhuma das duas senhas — e o usuário recebe "Perfil atualizado com sucesso!" acreditando ter trocado a senha.

**▶ Prompt**

```
Na tela de Perfil:

1. Se "Senha Atual" estiver preenchida e "Nova Senha" vazia, bloqueie o envio
   com erro: "Preencha a nova senha para concluir a alteração."
2. Se "Nova Senha" estiver preenchida e "Senha Atual" vazia, bloqueie com:
   "Informe a senha atual para alterar a senha."
3. Adicione o campo "Confirmar Nova Senha" e valide a coincidência
4. Valide comprimento mínimo de 8 caracteres na nova senha
5. A mensagem de sucesso deve distinguir "Perfil atualizado" de "Senha alterada"

Valide também no backend o comprimento mínimo — não confie só no cliente.
```

**Aceite:** os três cenários de preenchimento parcial produzem erro específico; nenhum retorna sucesso sem alteração.

---@@@@@@@@

@@

### ☐ E1.5 — Devolver o fuso horário ao cliente `S`

**O problema:** o fuso é salvo corretamente mas nunca é lido de volta — a resposta de autenticação só traz nome e e-mail. O seletor sempre exibe "Brasília (BRT)" e, ao salvar qualquer outra alteração, **sobrescreve o fuso salvo**. Isso tem efeito real: o fuso determina quando vira o dia no fechamento diário.

**▶ Prompt**

```
1. Crie o endpoint GET /me que devolve id, nome, email, fuso_horario e
   preferencia_idioma do usuário autenticado
2. Inclua fuso_horario também na resposta de POST /auth/login
3. No frontend, a tela de Perfil passa a carregar os dados de GET /me ao montar,
   não do que ficou guardado no login
4. Confirme que salvar o perfil sem tocar no seletor preserva o fuso salvo
```

**Aceite:** salvar fuso "Londres (GMT)", sair, entrar de novo → o Perfil abre exibindo Londres. Salvar só o nome não altera o fuso.

---@@@@@@@@@@@@@22@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@222---@@@@@@@@@@@@@22@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@222
---@@@@@@@@@@@@@22@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@222
---@@@@@@@@@@@@@22@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@222
---@@@@@@@@@@@@@22@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@222
---@@@@@@@@@@@@@22@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@222

### ☐ E1.6 — Mover o cálculo do bônus para o servidor `S` ⭐

**O problema:** quem decide se a conclusão é `COMPLETE_PADRAO` (100 moedas) ou `COMPLETE_EXTRA` (150) é o navegador — ele envia o tipo já resolvido. Isso viola RF22 e RNF08, que afirmam cálculo _exclusivamente_ no servidor. Um cliente modificado pede 150 sempre.

**▶ Prompt**

```
No endpoint POST /habits/{id}/executions:

1. O servidor passa a IGNORAR o campo tipo_sucesso enviado pelo cliente
2. O servidor recalcula: se valor_realizado >= meta_base * 1.2 então COMPLETE_EXTRA
   (150 moedas), senão COMPLETE_PADRAO (100 moedas)
3. As constantes 100, 150 e 1.2 ficam num único ponto de configuração do backend
4. O front continua enviando apenas execution_token e valor_realizado
5. A tela de sucesso passa a usar exclusivamente o que o servidor devolveu,
   sem valores padrão de 100/150 no cliente

Remova do frontend qualquer lógica que decida o tipo de conclusão.
```

**Aceite:** enviar `tipo_sucesso: "COMPLETE_EXTRA"` com `valor_realizado` igual à meta credita 100, não 150.

---

### ☐ E1.7 — Corrigir o texto da loja `XS`

**O problema:** o cartão afirma que o escudo "será gasto automaticamente às 23:59h caso você falhe na tarefa". Não existe consumo automático em nenhuma parte do sistema.

**▶ Prompt**

```
Na tela da Loja, substitua o texto do cartão de compra por:

"Custa 1500 moedas deste hábito. Use o escudo ao desistir de uma tarefa
para não perder sua ofensiva. Limite de um escudo por dia por hábito."

Ajuste também o título "Loja Local" para "Loja do Hábito" e o subtítulo
para deixar claro que as moedas são do hábito selecionado, não da conta.
```

> **D2 decidida: implementar.** Este texto volta a valer assim que a E4.3 for concluída — mas corrija agora mesmo assim, porque até lá o comportamento não existe e o texto estaria mentindo.

**Aceite:** nenhum texto do app promete comportamento inexistente.

---@@@@@@@@@@@@@@2

### ☐ E1.8 — Acabar com as falhas silenciosas `S`

**O problema:** a Tela Inicial e a de Dados não avisam quando a requisição falha — registram no console e seguem. Na home, uma falha de rede produz exatamente a mesma tela de quem não tem nenhum hábito. E a expiração de sessão apaga o token e recarrega o login sem uma palavra.

**▶ Prompt**

```
1. Home e Dados: em caso de erro na requisição, exiba um toast de erro e um estado
   de falha com botão "Tentar novamente" — nunca o estado vazio
2. Interceptor de 401: antes de limpar a sessão e redirecionar, exiba
   "Sua sessão expirou. Entre novamente." e aguarde 2s
3. Distinga na Home três estados: carregando, erro, e vazio-de-verdade
4. Toasts passam a ser dispensáveis por toque e a usar a animação de saída
   que já existe no código e nunca foi aplicada
```

**Aceite:** com a API desligada, a Home mostra erro com botão de retry — não o slide de criação.

---@@@@@@@@@@@@@@@@@@@@@22

**Fechamento da Etapa 1**

**▶ Prompt**

```
Rode o build completo (backend e frontend), faça npx cap sync android,
gere o APK de debug e liste o que mudou nesta etapa.
Depois faça commit e merge da branch etapa-1-correcoes-criticas em main.
```

---

# ETAPA 2 — Fechar o que já está anunciado (P1)

> Objetivo: tudo aqui é funcionalidade que o app já mostra na tela e não entrega. Nada é escopo novo.

### ☐ E2.1 — Preencher `proximo_vencimento` `M` ⭐

**O problema:** o campo nunca recebe valor — é gravado vazio na criação e nenhum código jamais o atribui. Como a expressão do avatar e os três balões de urgência dependem dele, **todos os hábitos ficam permanentemente na expressão neutra**.

**▶ Prompt**

```
Implemente o cálculo de status_habitos.proximo_vencimento:

1. Na criação do hábito: proximo_vencimento = próxima ocorrência de
   habitos.horario_agendado no fuso do usuário (hoje se ainda não passou,
   senão amanhã). Se horario_agendado for nulo, use 23:59 do dia corrente.
2. Após cada execução concluída: recalcule para a próxima ocorrência
3. No FechamentoDiarioJob: recalcule para todos os hábitos ativos do usuário
   cujo dia virou
4. Inclua proximo_vencimento no HabitoResponseDTO

Verifique depois que as 4 expressões do avatar (normal, preocupado,
desesperado, falha) e os 3 balões de urgência passam a aparecer.
```

**Aceite:** criar um hábito com horário para daqui a 1 h faz o avatar entrar em "preocupado" e exibir "A hora está chegando!".

---@@@@@@@@@@@@@@@@@@@@@@@@@@@

### ☐ E2.2 — Implementar `GET /api/stats/weekly` de verdade `M` ⭐

**O problema:** `StatsController.getWeeklyStats` é um stub literal — devolve `new ArrayList<>()` direto no controller, sem service nem repository (confirmado em `docs/MAPA_DO_CODIGO.md`). O gráfico "Desempenho (Últimos 7 dias)" renderiza sem nenhuma barra e "Recorde da Semana" mostra sempre 0. **O dado já está gravado** em `historico_execucoes` — falta só a consulta de agregação.

> Correção de rota e classe: o endpoint real é `GET /api/stats/weekly`, **sem `{id}` na URL** — hoje ele não recebe o hábito de forma alguma. E o repositório chama-se `HistoricoExecucaoRepository` (singular), não `HistoricoExecucoesRepository`.

**▶ Prompt**

```
Implemente de verdade GET /api/stats/weekly. Adicione um query param
obrigatório habitoId (o endpoint hoje não recebe hábito nenhum):
GET /api/stats/weekly?habitoId={uuid}

1. Crie StatsService, injetando HistoricoExecucaoRepository. StatsController
   deixa de calcular sozinho e passa a delegar
2. No HistoricoExecucaoRepository, adicione a consulta que agrega por
   data_local os últimos 7 dias do hábito: soma de valor_realizado e
   quantidade de execuções por dia
3. Devolva os 7 dias sempre — dias sem execução vêm com valor 0,
   para o gráfico não ficar com buracos
4. Inclua na resposta: recorde do período e percentual de constância semanal
   (dias com meta cumprida / 7)
5. No frontend, a tela Stats passa a enviar o habitoId do hábito atual
   (CurrentHabitContext) e consumir os três: gráfico, recorde e constância

A constância semanal está no RF17 e hoje não existe nem na interface — adicione o indicador.
```

**Aceite:** após 3 execuções em dias diferentes, o gráfico mostra 3 barras e o recorde traz o maior valor.

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

### ☐ E2.3 — Aceitar a progressão automática de meta `M`

**O problema:** "Aumento a cada 10 dias" e "Meta Máxima (Teto)" são preenchidos, viajam na requisição e o Spring os descarta em silêncio — não existem no `HabitoRequestDTO`.

**▶ Prompt**

```
As colunas hab_meta_maxima, hab_incremento e hab_dias_incremento JÁ EXISTEM
no schema v2.1, com CHECK garantindo meta_maxima >= meta_base. Falta ligar:

1. Inclua metaMaxima, incremento e diasIncremento em HabitoRequestDTO
   e HabitoResponseDTO

2. No FechamentoDiarioJob: a cada hab_dias_incremento dias consecutivos de
   ofensiva, hab_meta_base += hab_incremento, respeitando o teto.
   Ao aumentar a meta, RECALCULE os sub_alvo das sub-atividades

3. Frontend: o campo "Aumento a cada N dias" passa a enviar "incremento",
   e o rótulo passa a refletir hab_dias_incremento em vez de fixar 10

4. Trate a violação do CHECK do banco como erro 400 legível, não como 500
```

**Aceite:** `SELECT meta_maxima, incremento FROM habitos` traz os valores digitados na tela.

---@@@@@@@@@@@@@@@@

### ☐ E2.4 — Aceitar a frequência semanal `M`

**O problema:** os 7 botões de dia funcionam na tela e o valor é descartado pelo servidor. **O hábito é sempre diário.** Além disso os rótulos `D S T Q Q S S` repetem três letras.

**▶ Prompt**

```
A coluna hab_frequencia_semanal CHAR(7) já existe no schema v2.1, com CHECK
que exige o formato ^[01]{7}$ e proíbe "0000000" (zero dias). Falta ligar:

1. Confirme a convenção: posição 1 = domingo, posição 7 = sábado
2. Inclua frequenciaSemanal nos DTOs de request e response
3. FechamentoDiarioJob: em dias não selecionados, NÃO zere a ofensiva
   e não conte como falha
4. Frontend: envie a máscara; troque os rótulos de 1 letra por 3
   (DOM SEG TER QUA QUI SEX SAB); bloqueie o envio com zero dias selecionados
5. Home: em dia não programado, o cartão indica "Folga programada"
   e o botão de execução fica opcional
```

**Aceite:** criar hábito só para segunda e quarta; na terça a ofensiva não zera.

---

### ☐ E2.5 — Salvar o valor parcial na desistência `S`

**O problema:** o RF10 promete salvar o valor parcial realizado. A desistência não grava nada.

**▶ Prompt**

```
No POST de desistência, grave uma linha em historico_execucoes com
valor_realizado = valor parcial, moedas_ganhas = 0 e tipo_sucesso = "DESISTENCIA"
(ou "PROTEGIDO_ESCUDO" quando o escudo foi usado).

Essa linha deve entrar no gráfico dos 7 dias como barra parcial,
visualmente distinta das execuções concluídas.
```

**Aceite:** desistir aos 12 min de 25 grava 12 no histórico e a barra aparece no gráfico.

---@@@@@@@@@@2

### ☐ E2.6 — Nome próprio do hábito e validação completa do assistente manual `M` ⭐

**Escopo ampliado por decisão D4.** Como o questionário "Medir Dificuldade" virou trabalho futuro, **o preenchimento manual é a única porta de entrada** para configurar um hábito — não sobra um segundo caminho mais simples para o usuário. O padrão de qualidade desta tela sobe.

**O problema:** não existe campo para o nome — o título é o nome do molde, então dois hábitos de água se chamam ambos "Gotinha". Tocar em "Criar Hábito" com **todos os campos vazios** cria o hábito com meta 1, porque o navegador converte vazio em 1 antes de enviar. E o passo 2 hoje oferece uma escolha entre "Medir Dificuldade" (decorativa) e "Preencher Manualmente" — com o questionário fora do MVP, a escolha deixa de fazer sentido.

**▶ Prompt**

```
1. Passo 2 do assistente: como o questionário "Medir Dificuldade" é trabalho
   futuro, remova a bifurcação e vá direto ao preenchimento manual — não
   apresente uma opção que não funciona. Se quiser manter o conceito visível
   para a banca, troque por um texto estático "Calibração automática:
   em breve" sem ser clicável, mas o caminho ativo é sempre o manual

2. Passo 3: adicione o campo "Nome do hábito", pré-preenchido com o nome do
   molde e editável, máximo 60 caracteres

3. Validação local ANTES de enviar, campo a campo, com mensagem específica:
   - nome não vazio
   - meta_base >= 1 (número, não string vazia convertida)
   - ao menos 1 dia da semana marcado (hab_frequencia_semanal não pode ser
     "0000000" — o schema já rejeita isso via CHECK, mas o erro tem que
     aparecer no campo, não como falha genérica de rede)
   - horário preenchido em toda ocorrência quando vezes_ao_dia > 1
   - se meta_maxima for preenchida, ela precisa ser >= meta_base
     (o schema já tem ck_hab_teto — replique a mensagem no front)

4. Pare de converter campo vazio em 1 — campo vazio deve bloquear o envio
   com a mensagem de erro no próprio campo, não silenciosamente virar 1

5. Adicione um resumo de revisão antes do envio final: "Você vai criar
   [nome] com meta de [X], nos dias [Y], executando [Z] vez(es) ao dia"
   — como não há questionário para confirmar a configuração, esse resumo
   é o único ponto de checagem que o usuário tem antes de confirmar

6. Backend: valide os mesmos limites e devolva 400 com mensagem legível
   por campo, não uma mensagem genérica de validação
```

**Aceite:** enviar o formulário vazio mostra erro por campo e não cria nada; o passo 2 não oferece mais uma opção que não faz nada; o resumo de revisão aparece antes da confirmação.

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@22

### ☐ E2.7 — Passo do contador proporcional à meta `S`

**O problema:** o passo é fixo em 50. Para "2000 ml de água" são 40 toques; para um hábito de "10 flexões" o primeiro toque já leva a 500% da meta.

**▶ Prompt**

```
Na tela de execução por quantidade:

1. Calcule o passo como max(1, arredondamento de meta/10) — para 2000 ml o passo
   vira 200, para 10 flexões vira 1
2. Rotule os botões com o valor real (-200 / +200), não com 50 fixo
3. Adicione entrada manual: tocar no número central abre um campo para digitar
4. Mantenha o comportamento atual: sem teto superior, nunca abaixo de zero
```

**Aceite:** hábito de 2000 ml mostra botões `-200`/`+200`; hábito de 10 mostra `-1`/`+1`.

---@@@@@@@@@@@2

### ☐ E2.8 — Horário por sub-atividade `M`

**O problema:** contradição de design visível na tela — "Vezes ao Dia: 3" com uma **única** "Hora de Execução". A coluna `intervalo_minutos` existe no DTO e nunca é preenchida.

**▶ Prompt**

```
A tabela sub_atividades e a geração das linhas já vieram em E0.5.5.
Aqui é a interface e o consumo:

1. Quando "Vezes ao Dia" for maior que 1, o passo 3 exibe um campo de horário
   de início por ocorrência (sub_horario_inicio) e, opcionalmente, o fim
2. Exiba o sub_alvo calculado de cada ocorrência, em tempo real,
   conforme o usuário muda a meta ou a quantidade de vezes
3. Home e execução mostram o progresso "2 de 3 hoje" e o alvo da ocorrência atual
4. proximo_vencimento passa a apontar para a PRÓXIMA ocorrência pendente do dia,
   não para o fim do dia
```

**Aceite:** hábito de 2100 ml em 3 vezes mostra três alvos de 700 ml com horários distintos.

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

### ☐ E2.9 — Verificação de contrato front ↔ back `S` ⭐

**Por quê:** esta é a tarefa que impede o problema de voltar. Três campos foram descartados em silêncio porque nada verificava a correspondência.

**▶ Prompt**

```
1. Configure o Jackson para FALHAR em propriedade desconhecida
   (FAIL_ON_UNKNOWN_PROPERTIES = true) nos DTOs de request
2. Faça uma varredura: para cada formulário do frontend, liste os campos enviados
   e confronte com os campos do DTO correspondente
3. Escreva o resultado em docs/CONTRATO_API.md como tabela:
   tela | campo enviado | campo no DTO | coluna no banco | ok/divergente
4. Corrija toda divergência encontrada

Preste atenção especial em gatilho_ancora e intervalo_minutos: estão no DTO
e o frontend nunca os envia.
```

**Aceite:** `docs/CONTRATO_API.md` existe e não tem nenhuma linha "divergente".

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@2

# ETAPA 3 — Estados vazios e limpeza

### ☐ E3.1 — Estados vazios em todas as telas `S`

**▶ Prompt**

```
Crie estados vazios dedicados:

- Home sem hábitos: mensagem de boas-vindas explicando o conceito de foco único,
  distinta do slide de criação que aparece para quem já tem hábitos
- Loja sem hábitos: "Crie um hábito para começar a ganhar moedas"
- Gráfico de Dados sem dados: "Ainda não há execuções registradas.
  Complete uma tarefa para ver seu desempenho aqui."
- Inventário de escudos vazio: texto explicativo

Nenhuma tela pode exibir um cartão ou gráfico em branco sem explicação.
```

---@@@@@@@@@@@@@@@2

### ☐ E3.2 — Cabeçalho: deixar clara a economia por hábito `S`

**O problema:** os três indicadores são do **hábito selecionado**, não da conta — e nada na tela diz isso. Pior: deslizar até o slide de criação zera os três, o que parece bug de saldo.

**▶ Prompt**

```
1. Adicione rótulo textual sob cada ícone do cabeçalho: Moedas, Ofensiva, Escudos
2. Acrescente o nome do hábito ativo no cabeçalho, para deixar claro
   que os números são dele
3. No slide de criação, em vez de zerar os três, oculte o bloco de indicadores
   ou exiba "—" com a legenda "selecione um hábito"
```

---@@@@@@@@@@@2

### ☐ E3.3 — Remover código morto `S`

**▶ Prompt**

```
Remova (não comente — remova) os elementos órfãos confirmados:

- GoogleButton e Divider na tela de Login (definidos, importados, nunca renderizados)
- StartButton da Home (definido nos estilos, nunca renderizado)
- Modal de compra de escudo no Perfil: 14 componentes de estilo e 8 importações
  de uma janela que nunca é exibida, resquício de antes da Loja existir
- Modal de retomada da execução, se E1.2 tornou a retomada automática confiável
- Parâmetro :period da rota de Dados, se não for implementar o seletor

Rode o build depois e confirme que nada quebrou.
```

---@@@@@@@@@@@@@@@@@@@2

### ☐ E3.4 — Tema escuro real `M`

**O problema:** a classe do tema é alternada no documento mas **não tem nenhuma regra de estilo associada**, e a escolha não persiste — recarregar volta para a preferência do sistema.

**▶ Prompt**

```
1. Defina as variáveis de cor do tema escuro no Tailwind/CSS e aplique-as
   em todas as 10 telas
2. Persista a escolha em localStorage e na coluna usu_tema, que já existe
   no schema v2.1 com CHECK em ('claro','escuro','sistema') — respeite
   os três estados, sendo 'sistema' o padrão
3. Carregue a preferência antes da primeira renderização, para não haver flash
4. Torne o alternador acionável por teclado
5. Confirme o contraste mínimo de 4,5:1 nos dois temas
```

---@@@@@@@@@@@@@@@2

### ☐ E3.5 — Layout do passo 1 do assistente `XS`

**O problema:** o carrossel de moldes corta os cartões laterais — na captura, "Livrinho" aparece pela metade.

**▶ Prompt**

```
Ajuste o carrossel de moldes do passo 1: padding lateral e scroll-snap
para que o cartão selecionado fique centralizado e os vizinhos apareçam
parcialmente de forma intencional, não cortados na borda da tela.
Torne os cartões navegáveis por teclado (tab + enter).
```

---@@@@@@@@@@@@@@@@@@@@@@@22

# ETAPA 4 — Escopo novo essencial

### ☐ E4.1 — Gatilho / âncora do hábito `S` ⭐

**Por quê esta primeiro:** a coluna `habitos.gatilho_ancora` já existe e está sempre vazia. É o pilar "Torne-o Evidente" do Clear — o conceito central do seu referencial teórico — e não aparece em lugar nenhum do app. Custo baixo, ganho acadêmico alto.

**▶ Prompt**

```
1. Passo 3 do assistente: campo "Gatilho" com placeholder
   "Depois do café da manhã", máximo 120 caracteres, opcional
2. Frontend passa a enviar gatilho_ancora (o DTO já o declara)
3. Exiba o gatilho: no cartão da Home abaixo do título,
   e na tela de preparação acima da frase motivacional
4. Na pré-tarefa, exiba também o NOME do hábito — hoje ela mostra
   só a frase motivacional, sem dizer o que vai ser executado
```

---@@@@@@@@@@@@@@@@@@@22

### ☐ E4.2 — Interface de editar e arquivar hábito `M`

**O problema:** os endpoints existem e não têm nenhuma interface. RF23 está documentado e inacessível.

**▶ Prompt**

```
1. Menu de contexto no cartão do carrossel: Editar / Arquivar
2. Tela de edição reaproveitando o passo 3 do assistente,
   pré-preenchida com os valores atuais
3. Arquivar: confirmação explicando que o histórico é preservado
   e que a vaga entre os 2 hábitos ativos é liberada
4. Confirme que arquivar faz UPDATE ativo = false e não DELETE
```

---@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@22

### ☐ E4.3 — Consumo automático do escudo `M`

**D2 decidida: implementar.** O `FechamentoDiarioJob` real já existe (`@Scheduled(fixedRate = 3_600_000L)`, com `resolverFuso` e `StatusHabitoRepository.resetarDiario`) — esta tarefa estende esse job, não cria um novo.

**▶ Prompt**

```
No FechamentoDiarioJob (service/FechamentoDiarioJob.java), ao apurar a
virada do dia de um hábito, ANTES de zerar os contadores diários:

1. Se a meta do dia anterior não foi cumprida E há escudo disponível
   (sta_bloqueios_acumulados > 0) E o escudo ainda não foi usado no dia
   (sta_bloqueio_usado_hoje = false), consuma 1 escudo automaticamente
   e preserve sta_dias_seguidos em vez de zerá-lo
2. Registre a proteção em historico_execucoes com
   his_tipo_sucesso = 'PROTEGIDO_AUTOMATICO' (já previsto no CHECK do schema v2.1)
3. Restaure o texto original da Loja sobre o consumo automático (revertendo
   o ajuste feito na E1.7)
4. Notifique o usuário no próximo acesso: "Um escudo protegeu sua ofensiva ontem"
```

---@@@@@@@@@@@@@@@@@@@@@@@@@22

### ☐ E4.4 — Avatar evolutivo por nível `M`

**O problema:** F05 e RF14 descrevem evolução de nível a cada 10 dias. Não há coluna de nível, não há regra e não há arte. Além disso **só a categoria água tem ilustrações próprias — e apenas para 2 dos 5 estados**; os demais usam emoji.

**▶ Prompt**

```
1. A coluna sta_nivel_avatar já existe (DEFAULT 1, CHECK >= 1)
2. Regra no FechamentoDiarioJob: sta_nivel_avatar = 1 + (sta_dias_seguidos / 10),
   com teto a definir
3. Exponha nivel_avatar no DTO
4. Frontend: monte a matriz categoria x nivel x expressao e liste para mim
   exatamente quais artes faltam antes de eu produzi-las
5. Enquanto a arte não existir, use o fallback atual sem quebrar o layout
```

> Esta tarefa depende de você produzir as ilustrações. Peça a lista do item 4 antes de decidir se cabe no prazo.

---

# ETAPA 5 — Questionário de calibração

> **D4 decidida: trabalho futuro. NÃO EXECUTAR esta etapa no MVP.** As três tarefas ficam registradas para o caso de o escopo ser retomado depois da defesa, mas não entram no caminho de execução atual — pule direto para a Etapa 6. Documentar RF20 como trabalho futuro é responsabilidade da E9.1, não desta etapa. Hoje o botão "Medir Dificuldade" só emite um toast "Em breve" — **não existe questionário algum no código**, e um dos dois caminhos do passo 2 é decorativo.

### ☐ E5.1 — Modelar o questionário `M`

**▶ Prompt**

```
As tabelas calibracoes e calibracao_respostas já existem no schema v2.1.
A calibração pertence ao HÁBITO e guarda o resultado calculado
(cab_meta_sugerida, cab_incremento_sugerido, cab_aceita).

1. Defina os códigos estáveis de pergunta (DIAS_DISPONIVEIS,
   MINUTOS_DISPONIVEIS, EXPERIENCIA_PREVIA, ADERENCIA_ESTIMADA)
   e documente-os — cal_pergunta_codigo guarda o código, nunca o enunciado
2. Defina 4 a 6 perguntas por categoria (água, estudo, exercício)
3. Documente o algoritmo de cálculo em docs/ALGORITMO_CALIBRACAO.md
   ANTES de implementar — quero revisar a regra
```

### ☐ E5.2 — Backend do questionário `M`

### ☐ E5.3 — Fluxo no passo 2 do assistente `M`

**▶ Prompt (E5.3)**

```
Substitua o toast "Em breve" pelo fluxo real: uma pergunta por tela,
barra de progresso, e ao final a tela "Sugerimos X min por dia, aumentando
Y a cada 10 dias" com os botões "Aceitar" e "Ajustar manualmente".
Aceitar leva ao passo 3 pré-preenchido e editável.
```

---

# ETAPA 6 — Acessibilidade e decisões de escopo

### ☐ E6.1 — Acessibilidade técnica (RNF17) `M`

**Por quê importa no seu TCC:** o trabalho é sobre acessibilidade cognitiva. Ter um RNF de acessibilidade técnica declarado e não atendido é pior que qualquer outra lacuna — a banca vai reparar.

**▶ Prompt**

```
Auditoria e correção de acessibilidade nas 10 telas:

1. Todo controle com nome acessível — o botão circular de criar hábito
   hoje é anunciado apenas como "botão"
2. Os três indicadores do cabeçalho são ícones sem texto: adicione rótulos
3. Cartões de molde e alternador de tema navegáveis por teclado
4. Contraste mínimo 4,5:1 nos dois temas
5. Foco visível em todos os elementos interativos
6. Rode um Lighthouse de acessibilidade e registre a pontuação
   antes e depois em docs/ACESSIBILIDADE.md
```

### ☐ E6.2 — Remover promessas não cumpridas `S`

**▶ Prompt**

```
Remova da interface as funcionalidades que saíram para trabalhos futuros:
- O chip "🇧🇷 PT" do Login e do Perfil (parece seletor, é estático)
- O botão "Medir Dificuldade" do passo 2 (se D4 = trabalho futuro),
  transformando o passo 2 em transição direta para o passo 3

Uma promessa visível não cumprida é pior que a ausência da opção.
```

### ☐ E6.3 — Revisão de textos da interface `S`

**▶ Prompt**

```
Varra todos os textos do app e confirme que nenhum descreve comportamento
inexistente. Liste em docs/TEXTOS_UI.md cada mensagem, sua tela e o
comportamento real que ela descreve. São 14 toasts catalogados —
confirme que a mensagem inalcançável e a de número errado foram resolvidas.
```

---

# ETAPA 7 — Testes automatizados (RNF21)

### ☐ E7.0 — Injetar `Clock` (pré-requisito de todo o resto) `S` ⭐

**Por quê antes:** enquanto o service chamar `LocalDate.now()` ou `Instant.now()` direto, **nenhum teste de fuso é possível** — não há como colocar o sistema às 02:00 UTC de uma terça. Esta tarefa é o que torna a E7.1 exequível.

**▶ Prompt**

```
1. Registre um bean Clock (Clock.systemUTC()) na configuração
2. Injete Clock em todo service e job que lida com tempo:
   FechamentoDiarioJob, ExecucaoService, EscudoService, HabitoService
3. Substitua TODA chamada a Instant.now(), LocalDate.now() e LocalDateTime.now()
   por versões que recebem o Clock
4. Nos testes, use Clock.fixed(instante, ZoneOffset.UTC)

Ao terminar, rode uma busca e confirme que não sobrou nenhum .now() sem Clock
fora de classes de configuração.
```

**Aceite:** busca por `now()` no pacote de service não retorna chamada sem `Clock`.

---

### ☐ E7.1 — Testes de regra de negócio, com foco em fuso `M` ⭐

**Estratégia.** A pergunta difícil aqui é como garantir que ofensiva e liberação de escudo processem no fuso certo. A resposta tem três camadas, da mais barata para a mais cara:

**Camada 1 — extrair a decisão para uma função pura.** O job hoje mistura "descobrir se o dia virou" com "aplicar os efeitos". Separe: `deveApurar(ultimoReset, agoraUtc, fusoUsuario) → boolean`. Sem banco, sem Spring, testável em milissegundos e em dezenas de combinações. É onde mora o bug de fuso, e é a única camada que precisa de teste exaustivo.

**Camada 2 — service com `Clock` fixo e Postgres real** (Testcontainers, não H2 — H2 trata `TIMESTAMPTZ` diferente e você testaria a coisa errada).

**Camada 3 — o job inteiro, com três usuários em três fusos**, rodado nos 24 instantes horários de um mesmo dia UTC.

**▶ Prompt**

```
Escreva os testes das regras críticas. Use @ParameterizedTest com @CsvSource
para as matrizes de fuso.

A) Função pura deveApurar(ultimoReset, agoraUtc, fuso):
   - America/Sao_Paulo, 2026-03-10T02:00Z → local ainda é 09/03 23:00 → NÃO apura
   - America/Sao_Paulo, 2026-03-10T03:00Z → local virou 10/03 00:00 → apura
   - Mesmo instante para America/Sao_Paulo e Europe/London: um apura, o outro não
   - ultimoReset igual à data local de hoje → NÃO apura (idempotência)
   - ultimoReset nulo (hábito recém-criado) → apura uma vez
   - Fuso com horário de verão: Europe/London no último domingo de março
     (dia de 23 h) e de outubro (dia de 25 h) — a apuração ocorre uma única vez
   - Fuso nulo ou inválido → cai no fallback America/Sao_Paulo, sem exceção

B) FechamentoDiarioJob com Clock fixo, três usuários em três fusos:
   - Rodar o job nos 24 instantes horários do dia: cada hábito é apurado
     EXATAMENTE uma vez, e no instante correto para o seu dono
   - Rodar duas vezes no mesmo instante não duplica efeito
   - Dia não programado em hab_frequencia_semanal: ofensiva não zera
     e não conta como falha

C) Ofensiva:
   - Execução às 23:50 local e outra às 00:10 local contam como DOIS dias
   - Meta cumprida → dias_seguidos + 1 e sta_recorde_dias atualizado
   - Meta não cumprida sem escudo → zera
   - Meta não cumprida com escudo → preserva

D) Escudo:
   - Recusa sem saldo; recusa segundo uso no mesmo dia LOCAL do usuário
   - Liberação: usar escudo às 23:00 local não impede novo uso às 01:00
     do dia seguinte local

E) Moedas e idempotência:
   - Meta exata = 100; superação >= 20% = 150
   - tipo_sucesso enviado pelo cliente é ignorado (regressão de E1.6)
   - Mesmo execution_token duas vezes credita uma vez só

F) Limite de 2 hábitos ativos.

Use Testcontainers com PostgreSQL, não H2.
Meta: cobertura mínima de 70% nas classes de service.
```

> **A armadilha do item D.** Se a liberação do escudo depender de o job ter rodado, existe uma janela de até uma hora em que o usuário virou o dia e ainda não pode usar escudo. **Faça a leitura ser derivada** — comparar `sta_ultimo_reset` com a data local de agora no momento da consulta — e deixe o job como rede de segurança para os contadores. Assim o comportamento correto não depende do relógio do agendador.

> **Sobre `sta_ultimo_reset`.** É a única coluna do banco que não está em UTC: guarda a data local do dono. Todo teste precisa afirmar isso explicitamente, porque o erro típico é compará-la com `CURRENT_DATE` do servidor — que passa em desenvolvimento no Brasil e quebra em produção com o servidor em UTC.

### ☐ E7.2 — Testes de integração dos endpoints `M`

### ☐ E7.3 — Log do fechamento diário (RNF22) `S`

**▶ Prompt (E7.3)**

```
Adicione log estruturado no FechamentoDiarioJob: início do ciclo,
quantidade de hábitos avaliados, quantos tiveram o dia apurado,
quantos tiveram ofensiva zerada, quantos foram protegidos por escudo,
e duração total. Um log por ciclo, em nível INFO.
```

---

# ETAPA 8 — Build, deploy e validação

### ☐ E8.1 — Roteiro de teste manual `M`

**▶ Prompt**

```
Escreva docs/ROTEIRO_DE_TESTE.md com um caminho de validação manual que
percorra as 49 funcionalidades da matriz de revisão, marcando cada uma
como passou/falhou. Organize por bloco (Conta, Criação, Execução,
Gamificação, Dados, Plataforma).

Inclua explicitamente os cenários que já falharam antes:
- Recarregar a página durante uma execução
- Salvar o perfil sem tocar no fuso
- Preencher só "Senha Atual"
- Criar hábito com formulário vazio
- Deslizar até o slide de criação
- Usar o app com a API desligada
```

### ☐ E8.2 — Executar o roteiro no APK `M`

### ☐ E8.3 — Deploy de Vercel, Render e Neon `S`

### ☐ E8.4 — Gerar o APK de release assinado `S`

**▶ Prompt (E8.4)**

```
Gere o APK de release assinado, documente o processo em docs/BUILD_APK.md
e confirme a instalação num dispositivo real. Registre versão, tamanho
e checksum.
```

---

# ETAPA 9 — Sincronizar a documentação do TCC

> Esta etapa é o que impede a banca de encontrar uma contradição. Faça-a **depois** do código estar congelado, não antes.

### ☐ E9.1 — Atualizar RF e RNF `M`

**Já decidido (não é pergunta em aberto):** RF18 (push), RF19 (widget), RF20 (questionário) e RNF16 (i18n) vão para "Trabalhos Futuros" — são as decisões D3 e D4. O Claude Code não deve reabrir essa escolha ao executar esta tarefa, só redigir a justificativa.

**▶ Prompt**

```
Com base no código FINAL, atualize a lista de RF (34 requisitos) e
RNF (22 requisitos) do TempoClaro_Revisao_Geral.md, marcando o status real
de cada um. Requisitos não implementados vão para uma seção
"Trabalhos Futuros" com justificativa de escopo, não somem da lista.

RF18, RF19, RF20 e RNF16 JÁ ESTÃO decididos como trabalho futuro (decisões
D3 e D4 do CLAUDE.md) — escreva a justificativa de cada um, não pergunte
se deveriam entrar no MVP.

Gere docs/RASTREABILIDADE.md ligando: RF → funcionalidade → tela →
tabela/coluna → classe do backend → teste que a cobre.
```

### ☐ E9.2 — Atualizar a matriz de funcionalidades `S`

**▶ Prompt**

```
Atualize a matriz das 49 funcionalidades com o status final e a contagem
por bloco. Toda linha que mudou de status deve indicar a tarefa
do plano que a resolveu.
```

### ☐ E9.3 — Gerar o DDL e o ER finais `M`

**▶ Prompt**

```
Gere o script DDL final do banco implantado, com todas as colunas
adicionadas ao longo do plano, e o diagrama ER correspondente.

Se D1 = manter os dois modelos, escreva também a seção que explica
a diferença entre o projeto conceitual (17 tabelas) e a implementação
do MVP (5 tabelas + colunas adicionadas), com a justificativa da redução.
```

### ☐ E9.4 — Atualizar o `funcionalidades.md` `S`

**▶ Prompt**

```
Reescreva funcionalidades.md refletindo o estado final: nenhum elemento
deve continuar marcado como MORTO ou AUSENTE sem estar listado
em Trabalhos Futuros. A Parte 3 (divergências) deve encolher —
os Grupos A, B, C, D, E e F precisam ser reavaliados um a um.
```

---

## Painel de acompanhamento

| Etapa                  | Tarefas                                                | Concluídas | Status                   |
| ---------------------- | ------------------------------------------------------ | ---------- | ------------------------ |
| 0 — Preparação         | 4                                                      | ☐          |                          |
| 0.5 — Banco v2.1       | 6                                                      | ☐          |                          |
| 1 — Correções críticas | 8                                                      | ☐          |                          |
| 2 — Fechar anunciado   | 9                                                      | ☐          |                          |
| 3 — Estados e limpeza  | 5                                                      | ☐          |                          |
| 4 — Escopo novo        | 4                                                      | ☐          |                          |
| 5 — Questionário       | 3                                                      | —          | **fora do caminho — D4** |
| 6 — Acessibilidade     | 3                                                      | ☐          |                          |
| 7 — Testes             | 4                                                      | ☐          |                          |
| 8 — Build e validação  | 4                                                      | ☐          |                          |
| 9 — Documentação       | 4                                                      | ☐          |                          |
| **Total**              | **54** (51 no caminho de execução — Etapa 5 não entra) |            |                          |

### Impacto esperado na matriz

| Momento      | ✅ FEITA | ⚠️ PARCIAL | ❌ NÃO FEITA |
| ------------ | -------- | ---------- | ------------ |
| Hoje         | 18       | 12         | 19           |
| Após Etapa 1 | 24       | 8          | 17           |
| Após Etapa 2 | 33       | 4          | 12           |
| Após Etapa 4 | 39       | 2          | 8            |

As 8 restantes ao fim são push, widget, i18n, seletor de período, avatar por nível e afins — todas defensáveis como trabalhos futuros, desde que declaradas.

---

## Cinco tarefas de maior retorno

Se o tempo apertar, estas cinco resolvem mais que todo o resto somado:

| Tarefa                             | Efeito                                                          |
| ---------------------------------- | --------------------------------------------------------------- |
| **E1.1** — campo `status` no DTO   | Destrava 6 comportamentos visíveis com uma linha                |
| **E1.2** — proteger `/execute`     | Elimina o bug de maior probabilidade real e a corrupção de dado |
| **E2.1** — `proximo_vencimento`    | Destrava avatares, 3 balões de urgência e a ordenação           |
| **E2.2** — `/stats/weekly`         | Preenche a tela que a banca vai abrir primeiro                  |
| **E2.9** — verificação de contrato | Impede que a classe inteira de problemas volte                  |
