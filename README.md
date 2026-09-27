# Tempo Claro

> Rastreador de hábitos gamificado — Trabalho de Conclusão de Curso
> Tecnologia em Sistemas para Internet · IFSul Campus Pelotas · 2026/1

---

## Índice

| §                                           | Seção                        | Conteúdo                                           |
| ------------------------------------------- | ---------------------------- | -------------------------------------------------- |
| [1](#1-informações-acadêmicas)              | Informações Acadêmicas       | Autoria, curso, instituição                        |
| [2](#2-arquitetura-e-infraestrutura)        | Arquitetura e Infraestrutura | Camadas, stack e hospedagem                        |
| [3](#3-mapa-de-diretórios)                  | Mapa de Diretórios           | Cada pasta e cada arquivo do repositório           |
| [4](#4-banco-de-dados)                      | Banco de Dados               | Cada tabela, cada campo e por onde passa no código |
| [5](#5-execução-local)                      | Execução Local               | Pré-requisitos e comandos para subir o projeto     |
| [6](#6-api--contratos-completos)            | API — Contratos              | Requisição e resposta de cada endpoint             |
| [7](#7-frontend--estrutura-e-componentes)   | Frontend                     | Páginas, contexts, hooks e utilitários             |
| [8](#8-fluxos-ponta-a-ponta)                | Fluxos Ponta a Ponta         | Como front e back se conectam, passo a passo       |
| [9](#9-padrão-de-rastreabilidade--audit-ok) | Rastreabilidade              | A convenção `@audit-ok`                            |
| [10](#10-testando-a-api-com-o-postman)      | Postman                      | Guia da coleção de testes manuais                  |
| [11](#11-limitações-conhecidas)             | Limitações Conhecidas        | O que ainda não está implementado                  |
| [12](#12-sumário-de-bookmarks-do-fluxo-de-funcionalidades) | Sumário de Bookmarks | Índice de `@audit-issue`/`@audit-info`/`@audit-ok` por funcionalidade |

---

## 1. Informações Acadêmicas

| Campo           | Valor                                                        |
| --------------- | ------------------------------------------------------------ |
| **Instituição** | Instituto Federal Sul-rio-grandense (IFSul) — Campus Pelotas |
| **Curso**       | Tecnologia em Sistemas para Internet (TSI)                   |
| **Semestre**    | 2026/1                                                       |
| **Autor**       | Rodrigo Miranda da Silva                                     |
| **GitHub**      | [`Rodrimir`](https://github.com/Rodrimir)                    |
| **Repositório** | `tempo-claro-tcc-tsi`                                        |

Projeto individual: todo o código de backend, frontend e infraestrutura foi escrito por um único
desenvolvedor.

---

## 2. Arquitetura e Infraestrutura

_A documentar conforme a revisão desta funcionalidade avança._

---

## 3. Mapa de Diretórios

_A documentar conforme a revisão desta funcionalidade avança._

---

## 4. Banco de Dados

Cada tabela só aparece aqui quando alguma funcionalidade já revisada em [§8](#8-fluxos-ponta-a-ponta) a toca. A coluna "Tocada por" aponta para o item numerado do fluxo correspondente.

### `usuarios`

| Campo                   | Tipo         | Restrição                              | Tocada por |
| ------------------------ | ------------ | ---------------------------------------- | ---------- |
| `usu_id`                 | UUID (PK)    | `DEFAULT gen_random_uuid()`              | Cadastro (9.2) |
| `usu_nome`               | VARCHAR(150) | `NOT NULL`                                | Cadastro (9.2) |
| `usu_email`              | VARCHAR(255) | `UNIQUE NOT NULL`, `CHECK (LIKE '%@%')`   | Cadastro (9.1, 9.2) |
| `usu_senha_hash`         | VARCHAR(255) | `NOT NULL`                                | Cadastro (9.2) |
| `usu_fuso_horario`       | VARCHAR(64)  | `NOT NULL DEFAULT 'America/Sao_Paulo'`    | Cadastro (9.2, valor fixo, não escolhido pelo usuário) |
| `usu_preferencia_idioma` | VARCHAR(10)  | `NOT NULL DEFAULT 'pt-BR'`                | Cadastro (9.2) |
| `usu_tema`               | VARCHAR(10)  | `NOT NULL`, `CHECK IN (...)`              | Cadastro (9.2, recebe o default da coluna) |
| `usu_criado_em`          | TIMESTAMPTZ  | `NOT NULL DEFAULT CURRENT_TIMESTAMP`      | Cadastro (9.2) |
| `usu_atualizado_em`      | TIMESTAMPTZ  | `NOT NULL DEFAULT CURRENT_TIMESTAMP`      | Cadastro (9.2, via `@PrePersist`) |
| `usu_email_verificado`   | BOOLEAN      | `NOT NULL DEFAULT FALSE`                  | Cadastro (9.2, nasce `false`) |

### `codigos_verificacao`

| Campo             | Tipo         | Restrição                                                          | Tocada por |
| ------------------ | ------------ | --------------------------------------------------------------------- | ---------- |
| `cod_id`           | UUID (PK)    | `DEFAULT gen_random_uuid()`                                            | Cadastro (10.1) |
| `cod_email`        | VARCHAR(255) | `NOT NULL`                                                              | Cadastro (10.1) |
| `cod_codigo_hash`  | VARCHAR(255) | `NOT NULL`                                                              | Cadastro (10.1) |
| `cod_tipo`         | VARCHAR(30)  | `NOT NULL`, `CHECK IN ('VERIFICACAO_EMAIL', 'RECUPERACAO_SENHA')`       | Cadastro (10.1, grava `VERIFICACAO_EMAIL`) |
| `cod_expira_em`    | TIMESTAMPTZ  | `NOT NULL`                                                              | Cadastro (10.1, 15 minutos após a geração) |
| `cod_tentativas`   | SMALLINT     | `NOT NULL DEFAULT 0`                                                    | Cadastro (10.1, nasce em 0) |
| `cod_criado_em`    | TIMESTAMPTZ  | `NOT NULL DEFAULT CURRENT_TIMESTAMP`                                    | Cadastro (10.1) |

`cod_usado_em` não é gravado pelo cadastro: só recebe valor quando o código é confirmado, o que pertence à funcionalidade de Verificação de E-mail.

---

## 5. Execução Local

_A documentar conforme a revisão desta funcionalidade avança._

---

## 6. API — Contratos Completos

### `POST /api/auth/register`

Autenticação: nenhuma, a rota é `permitAll` (ver item 6.1 do fluxo em [§8](#8-fluxos-ponta-a-ponta)).

**Corpo da requisição**

| Campo                | Tipo   | Obrigatório | Observação |
| --------------------- | ------ | ------------- | ---------- |
| `nome`                | string | sim           | até 150 caracteres (`@Size`, item 5, e `.max()` no cliente, item 2) |
| `email`                | string | sim           | precisa conter `@`, até 255 caracteres; a checagem de duplicidade é sensível a maiúsculas/minúsculas de propósito (ver item 9.1) |
| `password`             | string | sim           | entre 8 e 25 caracteres, ao menos 1 letra maiúscula e 1 caractere especial (item 8) |
| `preferencia_idioma`   | string | não           | aceita `"pt-BR"` ou `"en-US"`; qualquer outro valor, ou a ausência do campo, vira `"pt-BR"` |

**Respostas**

| Status | Quando ocorre                                                                                                | Corpo |
| ------ | --------------------------------------------------------------------------------------------------------------- | ----- |
| 201    | Cadastro aceito                                                                                                   | `{ success: true, message: "Cadastro recebido! ..." }` |
| 400    | Campo obrigatório ausente/vazio/fora do tamanho, e-mail fora do formato, senha fora dos critérios, corpo malformado, ou uma corrida de e-mail duplicado que escapou da checagem prévia | `{ success: false, message: "..." }` |
| 422    | E-mail já cadastrado, ou o envio do e-mail de verificação falhou (Resend fora do ar, domínio não verificado, limite diário excedido) | `{ success: false, message: "..." }` |
| 500    | Falha não prevista (ex.: banco indisponível)                                                                       | `{ success: false, message: "Erro interno no servidor." }` |

O sucesso não devolve token: a sessão só se abre depois que o e-mail é confirmado, na funcionalidade de Verificação de E-mail. Mapeamento completo em [§8 → Cadastro](#8-fluxos-ponta-a-ponta).

---

## 7. Frontend — Estrutura e Componentes

### Tela de autenticação (`src/pages/Login`)

Um único componente (`Login/index.jsx`) atende as duas abas "Entrar" e "Criar Conta": a aba ativa troca o schema de validação (`validation.js`) e os campos visíveis do mesmo formulário `react-hook-form`. Passo a passo da aba de cadastro em [§8 → Cadastro, itens 1 e 2](#8-fluxos-ponta-a-ponta).

### Contexto de autenticação (`src/contexts/AuthContext.jsx`)

Expõe `register`, `login`, `confirmarEmail`, `redefinirSenha` e `logout` para o restante do app. Só `register` não chama `persistSession`: o cadastro nunca autentica sozinho (ver [§8 → Cadastro, item 3](#8-fluxos-ponta-a-ponta)).

### Camada HTTP (`src/services/api.js`)

Instância única do axios com `baseURL` fixa e dois interceptors: um de requisição (injeta o token salvo, quando existe) e um de resposta (trata 401/403 globalmente, exceto para `/auth/login` e `/auth/register`).

---

## 8. Fluxos Ponta a Ponta

Convenção de caminhos: nesta seção, caminhos sem prefixo são relativos a `frontend/`; caminhos de
pacote Java sem prefixo são relativos a `backend/src/main/java/com/rodrigo/backend2java/`.

### Cadastro

Criação de uma conta nova pela aba "Criar Conta" da tela de login, do preenchimento do
formulário até a entrega do e-mail de verificação. A confirmação do código de 6 dígitos que esse
fluxo dispara pertence à funcionalidade de Verificação de E-mail, fora deste mapeamento.

#### 1. [Frontend / Tela] `src/pages/Login/index.jsx`

`@note` 1.1. Componente `Login`: um único formulário `react-hook-form` atende as abas "Entrar" e
"Criar Conta". A aba ativa (`isLoginTab`) decide o schema de validação (`registerSchema` quando é
cadastro) e quais campos existem: `nome` e `confirmarSenha` só são renderizados nesta aba.

`@note` 1.2. Função `onSubmit`, ramo cadastro (`isLoginTab === false`): chama `registerConta`
(item 3), exibe um toast de sucesso e navega para a verificação de e-mail (item 15).

`@note` 1.3. Função `onSubmit`, ramo `catch`: qualquer falha do cadastro toca um som de erro e
mostra um toast com a mensagem traduzida (item 14); a tela permanece na aba de cadastro para nova
tentativa, sem perder os valores já digitados.

`@audit-info` o botão físico de voltar do Android é interceptado para todo o componente
(`BackHandler.addEventListener('hardwareBackPress', () => true)`), inclusive na aba de cadastro:
não existe caminho para sair desta tela pelo botão de voltar do aparelho.

#### 2. [Frontend / Validação] `src/pages/Login/validation.js`

`@note` 2.1. Função `criarRegisterSchema`: declara as regras de `nome`, `email`, `senha` e
`confirmarSenha` usadas pelo `yupResolver` antes de qualquer chamada de rede. Ramificações
cobertas: nome vazio ou maior que 150 caracteres; e-mail vazio ou fora do formato `algo@algo`;
senha vazia, curta (menos de 8 caracteres), longa (mais de 25), sem letra maiúscula ou sem
caractere especial; confirmação vazia ou diferente da senha digitada. Como a validação não usa
`abortEarly`, mais de um campo pode mostrar erro ao mesmo tempo.

`@audit-issue` [outcome: fixed] `nome` tinha só `.required()`, sem limite máximo de tamanho: nada
neste arquivo impedia um nome maior que o `usu_nome VARCHAR(150)` do banco (ver item 9.2), o que
estourava como `DataIntegrityViolationException` (item 13.4) em vez de um erro de formulário.
Corrigido com `TAMANHO_MAXIMO_NOME = 150` e `.max(...)` no schema, espelhando o `@Size`
adicionado em `RegisterRequestDTO.java` (item 5).

#### 3. [Frontend / Estado Global] `src/contexts/AuthContext.jsx`

`@note` 3.1. Função `register`: traduz os campos do formulário (`nome`, `email`, `senha`,
`idioma`) para o payload que a API espera (`password`, `preferencia_idioma`) e delega a chamada
HTTP ao item 4. Diferente de `login`, `confirmarEmail` e `redefinirSenha`, não chama
`persistSession`: o cadastro isolado nunca grava token nem autentica o usuário.

#### 4. [Frontend / HTTP] `src/services/api.js`

`@note` 4.1. Função `register`: `POST /auth/register` com o payload montado no item 3.1.

`@note` 4.2. Interceptor de resposta: em qualquer 401/403 de rotas que não sejam `/auth/login` ou
`/auth/register`, dispara o tratamento de sessão expirada. Como a rota de cadastro é `permitAll`
no backend (item 6.1), esse interceptor nunca chega a agir sobre uma resposta de registro.

#### 5. [Backend / Rota] `autenticacao/AuthController.java`

`@note` 5.1. Método `register`: valida `RegisterRequestDTO` (`@Valid`) e devolve HTTP 201 com
`MessageResponseDTO`. Qualquer violação de `@NotBlank`/`@Email`/`@Size` do DTO nunca chega ao
corpo do método: é interceptada antes pelo `MethodArgumentNotValidException` (item 13.1).

`@audit-issue` [outcome: fixed] `RegisterRequestDTO` não tinha `@Size` em nenhum campo: `nome`
podia estourar `usu_nome VARCHAR(150)` (item 9.2) direto no banco. Adicionado `@Size(max = 150)`
em `nome` e `@Size(max = 255)` em `email`, espelhando o schema.sql.

`@audit-info` [outcome: fixed elsewhere] `password` de propósito não ganhou `@Size` aqui: as
outras regras de força de senha (mínimo, maiúscula, caractere especial) já não vivem como
anotação de bean validation neste DTO, e sim em `SenhaValidator.motivoInvalida` (item 8.1),
reaplicado também por `redefinirSenha` (recuperação de senha). O teto de tamanho entrou lá, pelo
mesmo motivo — ver item 8.

#### 6. [Backend / Segurança] `infra/security/SecurityConfig.java`

`@note` 6.1. `filterChain`: `POST /api/auth/register` está em `permitAll()`, a rota não exige
token.

`@note` 6.2. `passwordEncoder`: bean `BCryptPasswordEncoder`, usado no item 7.1(c) para gerar o
hash gravado no banco e no item 10.1 para o hash do código de verificação.

#### 7. [Backend / Regra de Negócio] `autenticacao/AuthService.java`

`@note` 7.1. Método `cadastrar`, quatro passos em sequência:
  - (a) confere duplicidade de e-mail;
  - (b) revalida a força da senha no servidor;
  - (c) monta e salva a entidade `Usuario`;
  - (d) gera e dispara o código de verificação de e-mail.

Ramificação (a): e-mail já cadastrado → lança `RegraDeNegocioException` (item 13.2), nenhuma
escrita acontece. Ramificação (b): senha fora dos critérios do servidor → lança
`ValidacaoException` (item 13.3); este passo só é redundante com o item 2.1 quando o cliente é o
app oficial — é a única barreira para qualquer outro consumidor da API (ver §10, coleção Postman).

`@audit-issue` [outcome: fixed] `cadastrar` não era `@Transactional`. Salvar o usuário (c) e
gerar/enviar o código (d) eram operações separadas: se (d) falhasse antes de disparar o código, o
usuário já ficava persistido e órfão — existia em `usuarios`, nunca recebia código, e o e-mail
ficava bloqueado para uma nova tentativa de cadastro pela checagem do item 9.1. Corrigido com
`@Transactional` no método, cobrindo (a) a (d) numa única transação. Como
`ResendEmailService.enviarCodigo` (item 11.1) também deixou de ser `@Async` e agora propaga
`RegraDeNegocioException` quando o envio falha, essa exceção participa da mesma transação: uma
falha real no envio desfaz o `save` do usuário e a geração do código também, então não existe
mais o cenário de usuário órfão.

#### 8. [Backend / Validação] `infra/util/SenhaValidator.java`

`@note` 8.1. Método `motivoInvalida`: as mesmas regras do item 2.1 (tamanho mínimo e máximo,
maiúscula, caractere especial), reaplicadas no servidor. Também é chamado por `redefinirSenha`
(recuperação de senha, fora deste mapeamento), então o teto de tamanho vale para os dois fluxos.

`@audit-info` [outcome: fixed] não havia limite máximo de tamanho aqui nem no DTO do item 5. O
hash gerado no item 6.2 usa BCrypt, que ignora silenciosamente qualquer byte de senha além do
72º: uma senha muito longa passava por toda a validação, mas tinha sua cauda descartada na hora
de autenticar depois. Corrigido com `TAMANHO_MAXIMO = 25` (escolha do autor, bem abaixo do corte
do BCrypt), e não no DTO — para ficar no mesmo lugar das outras regras de força de senha.

#### 9. [Backend / Persistência] `usuario/model/Usuario.java` + `usuario/UsuarioRepository.java`

`@note` 9.1. Método `existsByEmail`: checagem de duplicidade usada no item 7.1(a). É sensível a
maiúsculas/minúsculas — nada normaliza o e-mail para caixa baixa antes de comparar ou salvar, então
duas variações de maiúscula do mesmo endereço são tratadas como contas diferentes. Levantado como
possível inconsistência e confirmado pelo autor como comportamento intencional: e-mail é
case-sensitive de propósito, sem normalização.

`@note` 9.2. Método `save` (via `JpaRepository`, chamado no item 7.1c): grava a linha do novo
usuário.

`@audit-ok` - Tabela: usuarios | Campos: usu_id, usu_nome, usu_email, usu_senha_hash,
usu_fuso_horario, usu_preferencia_idioma, usu_tema, usu_criado_em, usu_atualizado_em,
usu_email_verificado | Avaliação: os campos gravados batem com as colunas do schema.sql.
`usu_fuso_horario` e `usu_tema` recebem defaults fixos que o cadastro não deixa o usuário escolher,
e `usu_email_verificado` nasce `false`, coerente com o disparo do código no item 10.1. A restrição
`UNIQUE` de `usu_email` é o único freio contra uma corrida entre dois cadastros simultâneos com o
mesmo e-mail: quando ela dispara, cai em `DataIntegrityViolationException` (item 13.4), não em
`RegraDeNegocioException`, então a mensagem "E-mail já está em uso" do item 7.1(a) não aparece
nesse caso — aparece o texto genérico de restrição de banco.

`@audit-issue` [outcome: fixed] a coluna `usu_atualizado_em` existia no schema.sql mas não tinha
campo correspondente na entidade `Usuario`: só `atualizarPerfil` (query nativa, edição de perfil)
a escrevia, então em toda escrita via JPA — cadastro (7.1c), verificação de e-mail e redefinição
de senha — ela ficava congelada no `DEFAULT CURRENT_TIMESTAMP` da criação, indistinguível de
`usu_criado_em`. Corrigido com o campo `atualizadoEm` mapeado e os callbacks
`@PrePersist`/`@PreUpdate` (`marcarAtualizacao`), que mantêm a coluna correta em qualquer escrita
JPA sem cada serviço ter de setá-la à mão.

#### 10. [Backend / Verificação] `verificacao/CodigoVerificacaoService.java` + `CodigoVerificacaoRepository.java`

`@note` 10.1. Método `gerarCodigo` (chamado no item 7.1d): invalida qualquer código pendente do
mesmo tipo para aquele e-mail, sorteia um código de 6 dígitos (ou usa o valor fixo de
`app.verificacao.codigo-fixo`, quando configurado) e grava o hash com expiração de 15 minutos.
Ramificação: se já existe um código do mesmo tipo emitido há menos de 60 segundos, lança
`RegraDeNegocioException` (throttle); na prática, inatingível a partir de um cadastro novo, porque
um e-mail que ainda não existe em `usuarios` nunca teve código de verificação emitido antes.

`@audit-issue` [outcome: fixed] `application-prod.properties` tinha
`app.verificacao.codigo-fixo=${CODIGO_VERIFICACAO_FIXO:123456}` — ou seja, em produção, **todo**
código emitido (cadastro e recuperação de senha) virava o valor fixo `123456` sempre que a
variável `CODIGO_VERIFICACAO_FIXO` não estivesse setada no Render. Era um contorno para o SMTP não
entregar em produção (ver item 11), mas na prática qualquer pessoa que soubesse o e-mail de um
usuário podia assumir a conta pelo fluxo de "esqueci minha senha" sem nunca ter acesso à caixa de
entrada dele. Corrigido ao remover essa linha (o default do código Java já é vazio, o que faz o
sorteio aleatório valer) — mas só surte efeito se `CODIGO_VERIFICACAO_FIXO` também for apagada do
painel de variáveis de ambiente do Render, já que uma variável de ambiente real sempre tem
prioridade sobre o default do arquivo `.properties`.

`@audit-ok` - Tabela: codigos_verificacao | Campos: cod_id, cod_email, cod_codigo_hash, cod_tipo,
cod_expira_em, cod_tentativas, cod_criado_em | Avaliação: consistente com o schema.sql; o código em
si nunca é persistido em texto puro, só o hash, pelo mesmo `PasswordEncoder` das senhas, e
`cod_tipo` grava o nome do enum `TipoCodigo`, que bate com o `CHECK` da coluna.

#### 11. [Backend / Integração Externa] `verificacao/EmailService.java` (interface) + `verificacao/ResendEmailService.java`

`@note` 11.1. Método `enviarCodigo` (chamado no item 7.1d, implementação ativa fora do profile de
teste): síncrono — o retorno HTTP do cadastro (item 12) só acontece depois que a chamada ao
Resend retorna. Uma falha na chamada (rede, credencial, domínio não verificado, limite excedido)
lança `RegraDeNegocioException`, que participa da mesma transação do item 7.1 (ver o
`@audit-issue` de lá).

`@audit-issue` [outcome: fixed] a implementação original (`SmtpEmailService`, removida) usava
`JavaMailSender`/SMTP direto (Gmail). O plano gratuito do Render bloqueia saída nas portas SMTP
25/465/587 desde 26/09/2025: a conexão nunca se estabelecia em produção, então nenhum código de
verificação ou recuperação chegava a um usuário real — e a falha era invisível (`@Async`, sem
tratamento de erro próprio). Isso motivou o contorno do código fixo (item 10.1), que virou seu
próprio problema de segurança. Corrigido substituindo por `ResendEmailService`, que fala com a
API HTTP do Resend (`POST https://api.resend.com/emails`, porta 443, que o Render não bloqueia)
via `RestClient`. Requer `app.resend.api-key` e `app.resend.from` configurados (variáveis
`RESEND_API_KEY`/`RESEND_FROM_EMAIL`); `app.resend.from` precisa ser um endereço de um domínio
verificado na conta do Resend — o domínio de teste `onboarding@resend.dev` só entrega para o
e-mail do dono da conta, não para usuários reais.

`@audit-issue` [outcome: fixed] a falha de envio era invisível de dois jeitos: nem o usuário nem
o chamador da API ficavam sabendo, porque `enviarCodigo` era `@Async` e não devolvia nada. Uma
falha do Resend (chave inválida, domínio não verificado, limite diário excedido) só aparecia no
log do servidor (`SimpleAsyncUncaughtExceptionHandler` padrão do Spring), enquanto o cadastro já
tinha respondido 201. Corrigido tornando `enviarCodigo` síncrono e lançando
`RegraDeNegocioException` (HTTP 422, item 13.2) quando o envio falha — o usuário agora recebe um
erro real em vez de sucesso falso, e a falha desfaz a transação do item 7 (usuário + código não
ficam persistidos se o e-mail não saiu). Custo aceito: a resposta do cadastro agora espera a
chamada de rede ao Resend terminar.

#### 12. [Backend / Contrato de Resposta] `AuthController.java` (5.1) + `infra/exception/MessageResponseDTO.java`

`@note` 12.1. Caminho feliz: HTTP 201 Created, corpo `{ success: true, message: "Cadastro
recebido! ..." }`.

#### 13. [Backend / Tratamento de Erros] `infra/exception/GlobalExceptionHandler.java`

`@note` 13.1. `MethodArgumentNotValidException` → HTTP 400; cobre `nome`/`email`/`password`
vazios (bean validation do DTO, item 5.1) quando quem chama a API não faz a validação
client-side do item 2.1.

`@note` 13.2. `RegraDeNegocioException` → HTTP 422; cobre e-mail duplicado (item 7.1a) e o
throttle de reenvio de código (item 10.1).

`@note` 13.3. `ValidacaoException` → HTTP 400; cobre senha fora dos critérios do servidor (item
8.1).

`@note` 13.4. `DataIntegrityViolationException` → HTTP 400; cobre qualquer restrição de banco
violada que passou pelas validações de aplicação, como a corrida de e-mail duplicado (item 9.2) ou
um nome maior que `usu_nome VARCHAR(150)` (item 2.1).

`@audit-issue` [outcome: fixed] `mensagemAmigavelParaRestricao` não tinha um caso para a corrida
de e-mail duplicado: caía na mensagem genérica "Os dados enviados violam uma restrição do banco
de dados.", em vez de repetir a mensagem específica que o mesmo cadastro já dá quando detecta o
mesmo problema antes de tentar salvar (item 7.1a). Corrigido com um `if (causaRaiz.contains
("usu_email"))` no início do método. O caso de nome longo demais não precisou de um branch aqui:
o `@Size(max=150)` do item 5 já barra isso antes de violar a restrição de banco.

`@note` 13.5. `Exception` genérico → HTTP 500, mensagem fixa "Erro interno no servidor.": qualquer
falha não prevista nos itens acima (por exemplo, o próprio banco fora do ar) cai aqui.

`@note` 13.6. `HttpMessageNotReadableException` → HTTP 400; cobre corpo da requisição malformado
(JSON inválido ou campo com tipo errado) antes mesmo da validação de bean do item 13.1 rodar.

#### 14. [Frontend / Retorno ao Usuário] `Login/index.jsx` (1.3) + `src/utils/erros.js`

`@note` 14.1. Função `getApiErrorMessage`: prioriza a mensagem vinda do backend
(`err.response.data.message`, os textos dos itens 13.1 a 13.6); só cai para uma mensagem genérica
por status HTTP quando o backend não manda `message`, ou para "sem resposta do servidor" quando
não houve resposta alguma (sem conexão, timeout de 60 segundos).

#### 15. [Frontend / Navegação] handoff para `app/verify-email.jsx` (`VerifyEmail`)

`@note` 15.1. Depois do toast de sucesso, `router.replace({ pathname: '/verify-email', params: {
email } })` leva o usuário para a tela de verificação. O cadastro termina aqui: a validação do
código de 6 dígitos, o reenvio e a expiração pertencem à funcionalidade de Verificação de E-mail.

#### 16. [Frontend / Componente Compartilhado] `src/components/common/PasswordInput/index.jsx`

`@note` 16.1. Componente usado pelos campos `senha` (login e cadastro, item 1) e `confirmarSenha`
(cadastro, item 1): expõe as props de conteúdo do teclado (`textContentType`, `autoComplete`) para
o gerenciador de senhas nativo, com valores de senha existente como default e `{...resto}` por
último, para os call sites poderem sobrescrever.

`@audit-issue` [outcome: fixed] o default antigo usava `textContentType="oneTimeCode"` (o content
type de código de SMS/OTP do iOS, não de senha), com `autoComplete="off"` e
`importantForAutofill="no"` — desligando de propósito o gerenciador de senhas nativo. Isso
impedia o iOS/Android de sugerir "Senha Forte" ao criar a conta em `Login/index.jsx` (item 1) e de
oferecer salvar a credencial ao final do cadastro. Corrigido: o componente agora tem default
`textContentType="password"`/`autoComplete="password"`, e os call sites do cadastro (`senha`
quando `!isLoginTab`, e sempre em `confirmarSenha`) passam `textContentType="newPassword"` /
`autoComplete="new-password"`.

---

## 9. Padrão de Rastreabilidade — `@audit-ok`

A cada revisão, a jornada de uma funcionalidade é remapeada arquivo por arquivo (frontend e
backend) em [§8](#8-fluxos-ponta-a-ponta) e anotada com um conjunto fixo de marcações. As
marcações não vivem como comentário dentro do código-fonte: elas existem só nesta documentação,
presas ao arquivo e à função onde a observação foi feita.

| Tag            | Uso |
| --------------- | --- |
| `@note`        | Obrigatória em toda entrada do mapeamento. Segue a estrutura numérica rígida `N. [Camada] arquivo.ext ➔ N.M. Função: nome`, descrevendo o que aquele ponto do fluxo faz. |
| `@todo`        | Marca fluxo, lógica ou método incompleto: existe no código, mas não cobre todo o requisito. |
| `@remind`      | Marca código morto: inativo, não referenciado, ou função que nenhum caminho de execução chama. |
| `@audit-issue` | Aponta um bug, erro lógico ou incoerência encontrada durante o percurso. |
| `@audit-info`  | Detalhe técnico complexo que não é um bug, mas muda o comportamento de um jeito não óbvio (ex.: um limite de biblioteca, o efeito colateral de uma anotação de framework). |
| `@audit-ok`    | Obrigatória sempre que o fluxo toca o banco de dados. Formato fixo: `@audit-ok - Tabela: [nome] \| Campos: [campo_A, campo_B] \| Avaliação: [análise da consistência do esquema]`. |

Cada funcionalidade documentada em [§8](#8-fluxos-ponta-a-ponta) usa exatamente essas seis tags. O
[sumário de bookmarks](#12-sumário-de-bookmarks-do-fluxo-de-funcionalidades) reúne, por
funcionalidade, só as ocorrências de `@todo`, `@remind`, `@audit-issue`, `@audit-info` e
`@audit-ok`, como um índice rápido para quem não vai ler o fluxo inteiro.

---

## 10. Testando a API com o Postman

_A documentar conforme a revisão desta funcionalidade avança._

---

## 11. Limitações Conhecidas

_A documentar conforme a revisão desta funcionalidade avança._

---

## 12. Sumário de bookmarks do fluxo de funcionalidades

Índice rápido das marcações que não são `@note` (ver convenção em [§9](#9-padrão-de-rastreabilidade--audit-ok)), por funcionalidade. Cada linha aponta para o item numerado do fluxo completo em [§8](#8-fluxos-ponta-a-ponta).

### Cadastro

Nenhuma ocorrência de `@todo` ou `@remind` neste fluxo.

| Tag | Local | Resumo |
| --- | ----- | ------ |
| `@audit-info`  | 1.1 `Login/index.jsx`                                    | Botão físico de voltar do Android fica bloqueado em toda a tela de login/cadastro. |
| `@audit-issue` | **[fixed]** 2.1 `Login/validation.js` → `criarRegisterSchema` | Campo `nome` sem limite de tamanho, nem cliente nem servidor. Corrigido com `.max(TAMANHO_MAXIMO_NOME)`. |
| `@audit-issue` | **[fixed]** 5.1 `RegisterRequestDTO.java`                | Nenhum campo tinha `@Size`. Corrigido: `@Size(max=150)` em `nome`, `@Size(max=255)` em `email`. |
| `@audit-info`  | 5.1 `RegisterRequestDTO.java`                            | `password` não ganhou `@Size` aqui de propósito: o teto foi para `SenhaValidator` (8.1), junto das outras regras de força de senha. |
| `@audit-issue` | **[fixed]** 7.1 `AuthService.java` → `cadastrar`         | Faltava `@Transactional` entre salvar o usuário e gerar o código: uma falha no meio deixava um usuário órfão sem código de verificação. Corrigido. |
| `@audit-info`  | **[fixed]** 8.1 `SenhaValidator.java` → `motivoInvalida`  | Sem limite máximo de senha; BCrypt trunca silenciosamente em 72 bytes. Corrigido com `TAMANHO_MAXIMO = 25` (escolha do autor), reaplicado em cadastro e redefinição de senha. |
| `@audit-issue` | **[kept as-is]** 9.1 `UsuarioRepository.java` → `existsByEmail` | Checagem de e-mail duplicado é sensível a maiúsculas/minúsculas. Confirmado pelo autor: comportamento intencional, e-mail é case-sensitive de propósito. |
| `@audit-ok`    | 9.2 `UsuarioRepository.java` → `save`                     | Tabela `usuarios`: ver avaliação completa em [§8, item 9](#8-fluxos-ponta-a-ponta). |
| `@audit-issue` | **[fixed]** 9.2 `Usuario.java`                            | `usu_atualizado_em` existia no schema mas não na entidade: escritas via JPA deixavam a coluna congelada na data de criação. Corrigido com o campo `atualizadoEm` e callbacks `@PrePersist`/`@PreUpdate`. |
| `@audit-ok`    | 10.1 `CodigoVerificacaoService.java` → `gerarCodigo`      | Tabela `codigos_verificacao`: ver avaliação completa em [§8, item 10](#8-fluxos-ponta-a-ponta). |
| `@audit-issue` | **[fixed]** 10.1 `application-prod.properties`            | **Segurança.** Em produção, todo código de verificação/recuperação virava o valor fixo `123456` (contorno pro SMTP não entregar) — qualquer um que soubesse o e-mail de um usuário tomava a conta pelo "esqueci minha senha", sem acessar a caixa de entrada dele. Corrigido no arquivo; falta apagar `CODIGO_VERIFICACAO_FIXO` no painel do Render também. |
| `@audit-issue` | **[fixed]** 11.1 `SmtpEmailService.java` (removido) → `ResendEmailService.java` | SMTP direto (Gmail) nunca entregava em produção: o Render free bloqueia as portas 25/465/587 desde 26/09/2025. Corrigido trocando para a API HTTP do Resend (porta 443, não bloqueada). Requer `RESEND_API_KEY`/`RESEND_FROM_EMAIL` com domínio verificado no Resend. |
| `@audit-issue` | **[fixed]** 11.1 `ResendEmailService.java` → `enviarCodigo` | Era `@Async`: falha do Resend não chegava à resposta HTTP nem ao usuário. Corrigido: método agora é síncrono e lança `RegraDeNegocioException` (422) quando o envio falha, que desfaz a transação do cadastro (item 7) junto. |
| `@audit-issue` | **[fixed]** 13.4 `GlobalExceptionHandler.java` → `mensagemAmigavelParaRestricao` | Sem caso para a corrida de e-mail duplicado. Corrigido com `causaRaiz.contains("usu_email")`. |
| `@audit-issue` | **[fixed]** 16.1 `PasswordInput/index.jsx`               | `textContentType="oneTimeCode"` (content type de OTP, não de senha) com autofill desligado nos campos de senha do cadastro. Corrigido para `password`/`newPassword` conforme o contexto. |

---

## Licença e uso

Trabalho acadêmico desenvolvido para avaliação no curso de Tecnologia em Sistemas para Internet do
IFSul — Campus Pelotas. O código está disponível para consulta e fins educacionais.
