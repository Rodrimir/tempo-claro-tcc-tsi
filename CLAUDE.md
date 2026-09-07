# CLAUDE.md — Contexto do projeto Tempo Claro (TCC)

Este arquivo é lido automaticamente pelo Claude Code ao abrir uma sessão neste repositório (`Rodrimir/tempo-claro-tcc-tsi`, branch `main`). Ele não contém conclusões — contém a documentação acadêmica produzida em paralelo ao código, e uma lista de pontos que precisam ser **verificados um a um contra o código real**, sem assumir de antemão qual lado (texto ou código) está certo.

---

## D. Decisões de escopo (fechadas em 27/08/2026)

Estas quatro decisões governam o `docs/PLANO_EXECUCAO.md` e não são mais perguntas em aberto. Qualquer sessão de Claude Code — tanto na auditoria comparativa desta Seção 3 quanto na execução do plano — deve tratá-las como premissa, não como algo a reconfirmar.

| #      | Decisão                                                     | Resolução                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------ | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **D1** | Modelo de dados: 17 tabelas conceituais vs. 5 implementadas | **O esquema real (schema.sql v2.0+) substitui o ER conceitual da monografia.** Não haverá seção "dois modelos" — o ER da monografia é atualizado para refletir o banco de fato implantado. Ver `docs/PLANO_EXECUCAO.md` Etapa 0.5 e tarefa E9.3.                                                                                                                                                                 |
| **D2** | Escudo consumido automaticamente às 23:59                   | **Implementar o comportamento.** A Loja já promete esse texto; a mecânica passa a existir de fato (tarefa E4.3 do plano, condicionada a D2 — agora incondicional).                                                                                                                                                                                                                                               |
| **D3** | Push, widget e i18n                                         | **Trabalhos futuros.** RF18, RF19 e RNF16 saem do escopo do MVP e entram na monografia como trabalho futuro, com justificativa. Qualquer botão ou seletor que hoje simula essas funcionalidades na interface (chip de idioma estático, etc.) deve ser removido ou substituído por rótulo estático — nenhuma promessa visível sem entrega (tarefa E6.2, agora incondicional).                                     |
| **D4** | Questionário "Medir Dificuldade"                            | **Trabalho futuro.** Não entra no MVP. Em compensação, **o preenchimento manual da meta recebe atenção redobrada agora**: validação completa, mensagens de erro por campo, e — dado o achado do `MAPA_DO_CODIGO.md` de que `PUT /habits/{id}` só persiste 3 de 9 campos enviados — o fechamento do contrato entre o formulário e o que o backend de fato grava é prioridade dentro da Etapa 2, não um adicional. |

**Pendência aberta por causa desta rodada de decisões:** o `HabitoRequestDTO` real tem um campo `modalidade`, separado de `categoria` e `tipo_medida`, que não apareceu em nenhum documento de revisão até agora e cujo propósito não está claro pela leitura estática do código. Antes de aplicar o schema v2.1, uma sessão precisa descobrir o que esse campo representa (ver tarefa E0.5.0 do plano). Não presumir a resposta.

---

## 0. Papel do Claude nesta sessão

O Rodrigo está terminando o TCC "Tempo Claro" (IFSul, CSTSI). A monografia foi escrita em paralelo ao desenvolvimento, e há sinais de que os dois podem ter se desalinhado em alguns pontos ao longo do tempo. O trabalho aqui é de **auditoria comparativa**: pegar cada afirmação da documentação abaixo e confirmar, no código deste repositório, se ela procede, não procede, ou procede parcialmente — **um item por vez**, com evidência (arquivo + trecho) para cada veredito.

Não presumir que a documentação está desatualizada nem que o código está errado. As duas fontes podem estar certas em pontos diferentes, ou ambas desatualizadas em relação a uma terceira versão que só existe na cabeça do Rodrigo. A checagem decide.

**Não produzir relatório consolidado sem pedido.** Ir item por item pela lista da Seção 3, aguardando confirmação do Rodrigo a cada resposta antes de seguir para o próximo.

---

## 1. Estrutura do repositório (referência rápida)

```
backend/src/main/java/com/rodrigo/backend2java/
├── config/        JwtFilter, JwtService, RequestLoggingFilter, SecurityConfig
├── controller/     AuthController, HabitoController, ProfileController, StatsController
├── exception/      GlobalExceptionHandler
├── model/          Habito, HistoricoExecucao, StatusHabito, Usuario, BibliotecaTexto, dto/{request,response}
├── repository/      HabitoRepository, HistoricoExecucaoRepository, StatusHabitoRepository, UsuarioRepository, BibliotecaTextoRepository
├── service/         AuthService, GamificacaoService, HabitoService, UsuarioService, FechamentoDiarioJob
└── resources/       application.properties, application-prod.properties, application-docker.properties,
                     schema.sql, data.sql, Postman/Tempo Claro.json

frontend/src/
├── components/      common/ (CircularProgress, GiveUpModal, LoadingScreen, MonospaceTimer, PwaPauseModal, Toast — só styles.js, sem index.jsx), layout/ (BottomNav, LocalHeader)
├── contexts/         AuthContext, CurrentHabitContext, ThemeToggleContext, ToastContext
├── hooks/            useTimer
├── pages/            CreateHabit, Execution, Fail, Home, Login (+ useLogin.js), PreTask, Profile, Stats, Store, Success
├── services/         api.js, authService.js
└── utils/            storage.js
```

> Árvore validada em 27/08/2026 por leitura direta do repositório — ver `docs/MAPA_DO_CODIGO.md`. Persistência é **JdbcTemplate puro com SQL escrito à mão** (constantes de query + `RowMapper` manual em cada repository), não JPA/Hibernate. Não há `backend/src/test/` nem Jest/Vitest no frontend — zero testes automatizados no repositório atual.

O código usa marcações `// @audit-ok [FUNCIONALIDADE (N)]` no fonte, ligando trechos de front e back ao mesmo fluxo numerado. Use isso como ponto de entrada ao rastrear um fluxo.

---

## 2. Documentos acadêmicos (fonte: monografia e anexos)

Os arquivos abaixo devem estar copiados em `docs/tcc/` neste repositório (ver Seção 6) para que possam ser lidos diretamente durante a sessão.

- `docs/tcc/Monografia_v7.docx` — texto do TCC, versão corrigida pela orientadora
- `docs/tcc/Notas_Professora.pdf` — 21 anotações da orientadora sobre a monografia
- `docs/tcc/RF.md` — 23 requisitos funcionais (RF01–RF23)
- `docs/tcc/RNF.md` — 15 requisitos não funcionais (RNF01–RNF15)
- `docs/tcc/Funcionalidades.md` — 16 funcionalidades (F01–F16) com lei de Hábitos Atômicos associada
- `docs/tcc/EspecificacaoFuncional.pdf` — especificação funcional detalhada (versão antiga, possivelmente desatualizada)
- `docs/tcc/Modelagem_Banco.png` — diagrama de tabelas (sem cardinalidades)
- `docs/tcc/Caso_de_Uso.png` — diagrama de casos de uso (UC01–UC12, códigos RF próprios)
- `docs/tcc/Tabela_Sistemas_Similares.xlsx` — comparativo com Habitica, Forest, TickTick, Duolingo

## 3. Pontos a verificar — um por um, com evidência

Cada item abaixo é uma pergunta em aberto. Ao verificar, anotar: **procede / não procede / parcial**, arquivo(s) e trecho(s) que sustentam a resposta.

### Modelo de dados

- [ ] **Limite de hábitos ativos.** A monografia (RF03) e o RNF dizem 2. O que o código de fato aplica?
- [ ] **Tabela `sub_atividades`.** A monografia (RF05, RF06, Seção 3.4 da espec. funcional) descreve divisão da meta diária em partes. Existe isso no schema e no código de execução?
- [ ] **Modelo de crédito de moedas.** A monografia (Seção 6.6 e Considerações Finais) descreve um modelo de "crédito diferido" no fechamento do dia. O fluxo de execução no código credita na hora ou no fechamento?
- [ ] **Tabelas do Quadro 6 da monografia** (`sessoes_execucao`, `sub_atividade_status`, `transacoes_moedas`, `perfil_onboarding`, `categorias_habito`, `habito_dias_semana`, `avatares_catalogo`, `registros_diarios`, `notificacoes`) — quais existem de fato no `schema.sql`?
- [ ] **Tabelas do PNG de modelagem** (`status_habitos`, `micro_habitos`, `trofeus`) — quais existem de fato?
- [ ] **`moedas_locais` agregado vs. ledger.** A Seção 6.6 da monografia diz que o saldo é calculado "sem armazenamento de valores agregados redundantes". Isso é o que o código faz?

### Requisitos funcionais

- [ ] Cada RF01–RF23 da monografia: está implementado, parcialmente implementado, ou ausente no código?
- [ ] Os "moldes fixos" (Água, Estudo, Exercício) são de fato restritos no backend, ou o campo `categoria` aceita qualquer string?
- [ ] A "avaliação da meta diária na janela 00:00–23:59" (RF07) tem alguma implementação (job, cron, fechamento) no backend?
- [ ] O questionário "Medir Dificuldade" (RF20) — existe no frontend além do botão placeholder?
- [ ] Notificações push (RF18) e widget de tela inicial (RF19) — há algum código relacionado, ou são só descritos como "proposto"?

### Numeração e nomenclatura

- [ ] A monografia usa RF01–RF23. O diagrama de casos de uso usa outra numeração dentro das elipses. O código usa `@audit-ok [FUNCIONALIDADE (N)]` com uma terceira numeração. Mapear as três e ver se apontam para as mesmas funcionalidades ou não.

### Frontend

- [ ] A monografia diz TailwindCSS. O repositório tem `styles/GlobalStyles.js` e `styles/theme.js`, o que sugere outra abordagem (styled-components ou CSS-in-JS). Qual é usada de fato?
- [ ] Capacitor + PWA — confere com `capacitor.config.json` e o que está descrito na monografia sobre distribuição Android/Web?

### Backend / infraestrutura

- [ ] Banco: a monografia diz PostgreSQL no Neon. `application-prod.properties` confirma?
- [ ] Deploy: a monografia diz API no Render e frontend na Vercel. Confirma no repositório (workflows, configs)?
- [ ] JWT: validade, estrutura do token, quais rotas são públicas — bate com o que a monografia descreve na Seção 6.1?

### Testes (Capítulo 7 da monografia)

- [ ] A monografia descreve testes funcionais da API como "realizados manualmente" e testes automatizados como "plano futuro". Existe alguma suíte de testes no repositório (`src/test/`, Jest, etc.)?

---

## 4. Como conduzir a verificação

Para cada item da Seção 3:

1. Localizar o(s) arquivo(s) relevante(s) no código.
2. Citar o trecho de código que resolve a pergunta.
3. Citar o trecho correspondente do documento em `docs/tcc/`.
4. Classificar: **procede / não procede / parcial**, com uma frase de justificativa.
5. Não seguir para o próximo item antes de fechar o atual com o Rodrigo.

---

## 5. Depois de verificar cada item — como classificar

Cada resposta da Seção 3, além de **procede / não procede / parcial**, deve receber uma classificação de ação:

| Classe                                       | Critério                                                                                        | Ação recomendada                                                                                                       |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **A — Já é honesto**                         | O documento já descreve isso como "proposto" / "roadmap" / "futuro", e o código de fato não tem | Nenhuma ação. Não é divergência real                                                                                   |
| **B — Doc afirma como pronto, mas não está** | O documento descreve como implementado, mas o código não confirma                               | Decidir junto com o Rodrigo: implementar agora, ou rebaixar o texto para "proposto"? Não implementar por conta própria |
| **C — Contradição de fato**                  | Ambos existem, mas discordam em um dado concreto (ex.: limite numérico, nome de campo, fluxo)   | Sinalizar a contradição e perguntar qual lado é a verdade antes de mudar qualquer coisa                                |
| **D — Fora de escopo do semestre**           | O Regulamento do TCC (Art. 8º = 5º semestre / Art. 9º = 6º semestre) não exige isso ainda       | Nenhuma ação de código agora; sinalizar se o texto precisa deixar isso mais claro como trabalho futuro                 |

Regra de prioridade quando o Rodrigo perguntar "o que eu faço agora": **A e D não custam nada — resolver por último ou nunca. C geralmente se resolve reescrevendo uma frase no texto, não mexendo em código. Só B pode virar trabalho de implementação — e mesmo aí, perguntar primeiro se rebaixar o texto não resolve antes de sugerir escrever código sob pressão de prazo.**

Ao final de cada item da Seção 3, apresentar a classificação (A/B/C/D) e esperar a decisão do Rodrigo antes de agir ou seguir para o próximo item.

---

## 6. Setup necessário (fazer antes de começar)

1. Criar a pasta `docs/tcc/` na raiz deste repositório (fora do `backend/` e `frontend/`, para não entrar no build).
2. Copiar os arquivos listados na Seção 2 do Google Drive: pasta `TCC/01_TEXTO`, `04_REQUISITOS_E_ESPEC`, `05_PESQUISA_E_SIMILARES`, `06_NORMAS_E_ORIENTACAO`, `02_DIAGRAMAS`.
3. Colocar este arquivo como `CLAUDE.md` na raiz do repositório, ao lado de `backend/` e `frontend/`.
4. Abrir o terminal integrado do VSCode nesse repositório e rodar `claude`.
5. Confirmar que o contexto foi carregado (o Claude Code lê `CLAUDE.md` da raiz automaticamente ao iniciar).
