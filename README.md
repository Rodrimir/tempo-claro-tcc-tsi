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
| [8](#8-fluxos-ponta-a-ponta)                | Fluxos Ponta a Ponta         | Como front e back se conectam, passo a passo. Hoje: Cadastro |
| [9](#9-padrão-de-rastreabilidade--audit-ok) | Rastreabilidade              | A convenção `@audit-ok`                            |
| [10](#10-testando-a-api-com-o-postman)      | Postman                      | Guia da coleção de testes manuais                  |
| [11](#11-limitações-conhecidas)             | Limitações Conhecidas        | Os 20 defeitos registrados e as pendências de operação                  |
| [12](#12-sumário-de-bookmarks-do-fluxo-de-funcionalidades) | Sumário de Bookmarks | Índice de `@audit-issue`/`@audit-info`/`@audit-ok` por funcionalidade |
| [13](#13-artefatos-do-tcc)                  | Artefatos do TCC             | O que é cada documento da pasta `tcc/` e qual é o atual |

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

O Tempo Claro é um aplicativo Android nativo que conversa com uma API REST. As duas metades são
independentes: o aplicativo não conhece o banco de dados e a API não conhece a interface. Essa
separação é a tradução, em arquitetura, do requisito não funcional RNF08.

### Camadas

| Camada | O que é | Onde |
| --- | --- | --- |
| Apresentação | Expo SDK 54 com React Native. Navegação pelo Expo Router, que deriva as rotas da árvore de arquivos. Estilos em `styled-components`. | `frontend/app`, `frontend/src/pages` |
| Estado do cliente | Sete contextos React, um por preocupação: sessão, hábito corrente, resultado da execução, idioma, som, tema e avisos. Token em `expo-secure-store`, perfil em `AsyncStorage`. | `frontend/src/contexts` |
| Transporte | Cliente Axios único, com interceptor que anexa o token e trata expiração de sessão. | `frontend/src/services/api.js` |
| Controle | Cinco controladores Spring que recebem a requisição, validam o corpo e devolvem o DTO de resposta. Nenhuma regra de negócio aqui. | `backend/.../*Controller.java` |
| Regra de negócio | Serviços por domínio. Todo cálculo de meta, ofensiva, moedas, nível e estatística acontece aqui, nunca no banco nem no cliente. | `backend/.../*Service.java` |
| Persistência | Spring Data JPA sobre PostgreSQL. O banco guarda fatos e estado e garante integridade referencial; não tem gatilho, visão nem função armazenada. | `backend/.../*Repository.java` |

### Pilha de tecnologias

| Onde | Tecnologia | Papel |
| --- | --- | --- |
| Backend | Java 21, Spring Boot 3 | Aplicação e injeção de dependência |
| Backend | Spring Security + JWT (HS512) | Autenticação sem estado; validade do token configurável em `jwt.expiration` |
| Backend | Spring Data JPA, Hibernate | Mapeamento objeto-relacional |
| Backend | Lombok | Redução de código repetitivo nos DTOs e entidades |
| Backend | Maven, via `./mvnw` | Compilação e testes |
| Banco | PostgreSQL 16 | Dez tabelas, nove relacionamentos em cascata, sete índices |
| Frontend | React Native, Expo SDK 54 | Aplicação Android |
| Frontend | Expo Router | Navegação baseada em arquivos |
| Frontend | styled-components | Estilo com tema claro e escuro |
| Frontend | Axios | Camada HTTP |
| Externo | Resend, API HTTP | Envio do código de verificação e de recuperação de senha |

### Hospedagem

| Serviço | Papel | Como se reconhece no repositório |
| --- | --- | --- |
| Render | Hospeda o backend em contêiner | `application-prod.properties` lê `${PORT:8084}`, que é o padrão do Render |
| Neon | PostgreSQL gerenciado | O mesmo arquivo aponta a URL do Neon |
| EAS Build | Gera o APK do aplicativo | `frontend/eas.json` |

O envio de e-mail passa pela API HTTP do Resend, e não por SMTP, por uma razão de infraestrutura: o
plano gratuito do Render bloqueia as portas 25, 465 e 587, de modo que SMTP direto nunca entrega em
produção. A porta 443 não é bloqueada. O detalhamento da publicação está em
[`docs/DEPLOY_PRODUCAO.md`](docs/DEPLOY_PRODUCAO.md).

---

## 3. Mapa de Diretórios

```
tempo-claro-tcc-tsi/
├── backend/                      API Spring Boot
│   └── src/
│       ├── main/java/.../backend2java/
│       │   ├── autenticacao/     Cadastro, login, emissão de token      (10 classes)
│       │   ├── verificacao/      Código de 6 dígitos e envio de e-mail   (6 classes)
│       │   ├── usuario/          Entidade do usuário e perfil            (6 classes)
│       │   ├── habito/           Criação, edição, exclusão e painel     (13 classes)
│       │   ├── execucao/         Execução, desistência, escudo e moedas (10 classes)
│       │   ├── calibracao/       Questionário e cálculo da sugestão     (10 classes)
│       │   ├── biblioteca/       Frases motivacionais por categoria      (2 classes)
│       │   ├── stats/            Ofensiva, recordes e constância         (4 classes)
│       │   └── infra/            Segurança, exceções e utilitários      (13 classes)
│       ├── main/resources/
│       │   ├── schema.sql        As dez tabelas, índices e restrições
│       │   ├── calibracao/       Catálogo de perguntas do questionário
│       │   └── Postman/          Coleção de testes manuais, 29 requisições
│       └── test/java/            144 provas automatizadas
├── frontend/                     Aplicativo Expo
│   ├── app/                      18 rotas do Expo Router, arquivos finos
│   └── src/
│       ├── pages/                14 telas, cada uma com index, estilos e domínio
│       ├── components/           10 componentes compartilhados
│       ├── contexts/             7 contextos de estado global
│       ├── hooks/                Ganchos reutilizáveis
│       ├── i18n/                 Catálogos pt-BR e en-US
│       ├── model/                Enumerações de estado
│       ├── services/             Cliente HTTP
│       ├── styles/               Temas claro e escuro
│       └── utils/                Armazenamento, formatação e erros
├── tcc/                          Documentos do trabalho, ver §13
├── docs/                         Material de apoio, fora do versionamento
├── README.md                     Este arquivo
├── RELATORIO_AUDITORIA.md        Auditoria de código de 27/09/2026
└── revisao.md                    Metodologia de documentação e análise
```

---

## 4. Banco de Dados

Dez tabelas em PostgreSQL. O banco guarda fatos e estado e garante integridade referencial; não há
gatilho, visão nem função armazenada, de modo que toda regra de negócio fica na camada de serviço,
onde pode ser testada sem banco. O esquema está em `backend/src/main/resources/schema.sql` e roda
na subida da aplicação.

### Inventário

| Tabela | Finalidade | Depende de |
| --- | --- | --- |
| `usuarios` | Conta: nome, e-mail, senha com hash, e as preferências de idioma, fuso e tema | — |
| `codigos_verificacao` | Códigos de seis dígitos da confirmação de e-mail e da recuperação de senha, com hash e prazo | — |
| `biblioteca_textos` | Frases motivacionais por categoria de hábito e por idioma | — |
| `habitos` | O hábito: título, categoria, tipo de medida, meta, progressão e dias da semana cobrados | `usuarios` |
| `sub_atividades` | Ocorrências diárias do hábito, com ordem, parcela da meta e horário | `habitos` |
| `status_habitos` | Estado corrente: moedas, ofensiva, escudos e nível do avatar. Separada de `habitos` porque muda a cada execução | `habitos` |
| `historico_execucoes` | Registro imutável de cada execução, desistência ou apuração automática, com o token de unicidade | `habitos`, `sub_atividades` |
| `calibracoes` | Sessão do questionário, com a meta sugerida e se foi aceita | `usuarios`, `habitos` |
| `calibracao_respostas` | Cada resposta dada dentro de uma sessão de calibração | `calibracoes` |
| `dispositivos_push` | Token do aparelho para notificação, previsto como trabalho futuro | `usuarios` |

Chave primária do tipo UUID em todas, para que um identificador vazado não revele a quantidade de
registros nem permita adivinhar o vizinho. Nove relacionamentos com remoção em cascata e sete
índices sobre as colunas das consultas de maior frequência.

### Detalhamento por tabela

O detalhamento campo a campo, com a coluna "Tocada por", só existe para as tabelas que algum fluxo
já mapeado em [§8](#8-fluxos-ponta-a-ponta) percorre. As demais aparecem apenas no inventário
acima, até que o fluxo correspondente seja documentado.

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

### Pré-requisitos

| Ferramenta | Versão | Para quê |
| --- | --- | --- |
| JDK | 21 | Compilar e rodar o backend |
| PostgreSQL | 16 ou superior | Banco local |
| Node.js | 20 ou superior | Ferramentas do Expo |
| Android Studio ou um aparelho com Expo Go | — | Executar o aplicativo |

### Backend

O Spring lê `backend/config/application.properties` automaticamente, com precedência sobre o
arquivo do classpath. É nesse arquivo local, que não é versionado, que ficam a senha do banco, o
segredo do JWT e a chave do Resend.

```sh
createdb backend_db                      # uma vez
cd backend
./mvnw spring-boot:run                   # sobe em http://localhost:8084
```

O `schema.sql` roda na subida da aplicação e cria as dez tabelas se ainda não existirem.

### Frontend

```sh
cd frontend
npm install
npx expo start                           # abre o menu do Metro
```

O endereço da API fica em `frontend/src/services/api.js`. Para testar em um aparelho físico na
mesma rede, trocar `localhost` pelo IP da máquina na rede local, porque `localhost`, dentro do
aparelho, aponta para o próprio aparelho.

### Rodando os 144 testes do backend

A suíte precisa de um PostgreSQL próprio na porta 5433, com a base `backend_db_teste`. O
`compose.yaml` sobe isso em Docker, mas um cluster temporário local também serve e dispensa o
Docker:

```sh
export PGDATA=/tmp/pgdata-tempo-claro
initdb -D $PGDATA -U postgres --auth=trust -E UTF8
pg_ctl -D $PGDATA -l /tmp/pg.log \
  -o "-p 5433 -c unix_socket_directories='' -c listen_addresses=localhost" start
psql -h 127.0.0.1 -p 5433 -U postgres -c "CREATE DATABASE backend_db_teste;"

cd backend && ./mvnw test                # 144 testes

pg_ctl -D $PGDATA stop -m fast           # ao terminar
```

Dois detalhes que custam tempo se passarem despercebidos. O `unix_socket_directories=''` é
obrigatório quando o caminho do `PGDATA` é longo, porque o PostgreSQL recusa criar o soquete Unix
acima de 107 bytes e isso derruba a subida mesmo com TCP configurado. E o serviço de e-mail é
substituído, nos testes, por uma implementação falsa que expõe o último código emitido; sem ela não
há como cadastrar pela API, porque `AuthService.cadastrar` é transacional e desfaz o cadastro
quando o envio do e-mail falha.

Os relatórios saem em `backend/target/surefire-reports/`.

### Gerando o APK

O build é feito pelo EAS, serviço de compilação do Expo, com a configuração em
`frontend/eas.json`:

```sh
cd frontend
npx eas build --platform android --profile preview
```

O APK aponta para o endereço de API que estiver em `api.js` no momento do build. Para um APK que
converse com a máquina local, usar o IP da rede, e não `localhost`.

---

## 6. API — Contratos Completos

Vinte rotas e um job agendado. Todas as rotas vivem sob `/api`. Seis são públicas, declaradas uma a
uma em `SecurityConfig`; as demais exigem o token no cabeçalho `Authorization: Bearer <token>`.

### Visão geral

| ID | Método e caminho | Autenticação | O que faz |
| --- | --- | --- | --- |
| EP01 | `POST /api/auth/register` | pública | Cadastro de conta |
| EP02 | `POST /api/auth/login` | pública | Autenticação e emissão do token |
| EP03 | `POST /api/auth/verify-email` | pública | Confirmação do código de seis dígitos |
| EP04 | `POST /api/auth/resend-code` | pública | Reenvio do código de verificação |
| EP05 | `POST /api/auth/forgot-password` | pública | Pedido de código de recuperação |
| EP06 | `POST /api/auth/reset-password` | pública | Redefinição da senha com o código |
| EP07 | `GET /api/me` | token | Dados do usuário autenticado |
| EP08 | `PUT /api/profile` | token | Atualização de perfil e troca de senha |
| EP09 | `GET /api/dashboard` | token | Hábitos ativos com o status do dia |
| EP10 | `POST /api/habits` | token | Criação de hábito |
| EP11 | `PUT /api/habits/{id}` | token | Edição de hábito |
| EP12 | `DELETE /api/habits/{id}` | token | Exclusão do hábito |
| EP13 | `GET /api/habits/{id}/priming` | token | Frase motivacional da categoria |
| EP14 | `POST /api/habits/{id}/executions` | token | Registro de execução, desistência ou escudo |
| EP15 | `POST /api/habits/{id}/shield` | token | Compra de escudo |
| EP16 | `GET /api/stats/monthly` | token | Estatísticas dos últimos trinta dias |
| EP17 | `GET /api/stats/weekly` | token | Apelido da rota mensal, devolve o mesmo conteúdo. Ver DEF-06 |
| EP18 | `GET /api/calibration/questions` | token | Perguntas da categoria, no idioma do usuário |
| EP19 | `POST /api/calibration` | token | Cálculo da sugestão de meta |
| EP20 | `FechamentoDiarioJob` | job | Apuração horária dos dias encerrados, não é rota HTTP |

### Respostas comuns a todas as rotas protegidas

| Status | Quando ocorre |
| --- | --- |
| 403 | Token ausente, expirado ou com assinatura alterada. A convenção HTTP pediria 401; a divergência é deliberada e está registrada como DEF-20 |
| 404 | Recurso inexistente, ou de outro usuário. A API não distingue os dois casos, de propósito, para não confirmar a existência de um identificador a quem está sondando |
| 500 | Falha não prevista |

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

### `POST /api/auth/login`

Pública. Corpo: `email` e `password`, ambos obrigatórios.

| Status | Quando ocorre | Corpo |
| --- | --- | --- |
| 200 | Credenciais corretas e e-mail já confirmado | `{ token, usuario: { ... } }` |
| 401 | Senha incorreta ou e-mail inexistente | `{ success: false, message: "..." }` |
| 403 | E-mail ainda não confirmado. `Usuario.isEnabled()` devolve `emailVerificado`, e o Spring Security recusa login de conta desabilitada | `{ success: false, message: "..." }` |

### `POST /api/auth/verify-email`

Pública. Corpo: `email` e `codigo`. Confirma a conta e já devolve o token, abrindo a sessão sem
exigir um login em seguida.

| Status | Quando ocorre |
| --- | --- |
| 200 | Código correto e dentro do prazo. Devolve token e usuário |
| 400 | Código ausente ou malformado |
| 422 | Código incorreto ou expirado |

### `POST /api/auth/resend-code`

Pública. Corpo: `email`. Gera um código novo e invalida o anterior. Responde 200 mesmo para e-mail
inexistente, para não revelar quais endereços estão cadastrados.

### `POST /api/auth/forgot-password`

Pública. Corpo: `email`. Mesma política: 200 sempre, independentemente de o e-mail existir.

### `POST /api/auth/reset-password`

Pública. Corpo: `email`, `codigo` e `nova_senha`. A nova senha passa pelo mesmo `SenhaValidator` do
cadastro. Devolve token em caso de sucesso, de modo que a redefinição já abre sessão.

| Status | Quando ocorre |
| --- | --- |
| 200 | Código válido e senha dentro dos critérios |
| 400 | Senha fora dos critérios de força |
| 422 | Código incorreto ou expirado |

### `GET /api/me`

Token. Sem corpo. Devolve nome, e-mail, idioma, tema e fuso horário do usuário do token, e de
nenhum outro.

### `PUT /api/profile`

Token. Todos os campos são opcionais, e só os enviados são alterados.

| Campo | Tipo | Observação |
| --- | --- | --- |
| `nome` | string | — |
| `fuso_horario` | string | Precisa ser um identificador de fuso válido |
| `tema` | string | Restrito pela checagem da coluna `usu_tema` |
| `preferencia_idioma` | string | `"pt-BR"` ou `"en-US"`; valor fora da lista é recusado aqui, diferente do cadastro, onde cai no padrão |
| `senha_atual` | string | Exigido quando `nova_senha` vem preenchido |
| `nova_senha` | string | Passa pelo `SenhaValidator` |

| Status | Quando ocorre |
| --- | --- |
| 200 | Alterações gravadas |
| 400 | Valor inválido, ou `nova_senha` sem `senha_atual` |
| 422 | `senha_atual` incorreta |

Não há campo de e-mail: o DTO não o aceita, de modo que a troca de endereço não é oferecida nem
possível. Também não existe rota de exclusão de conta.

### `GET /api/dashboard`

Token. Devolve os hábitos ativos do usuário com o status calculado para o dia, o saldo de moedas, a
ofensiva e o limite de hábitos ativos. Hábitos excluídos não aparecem.

### `POST /api/habits`

Token. É o contrato mais extenso da API.

| Campo | Tipo | Obrigatório | Observação |
| --- | --- | --- | --- |
| `titulo` | string | sim | até 60 caracteres |
| `categoria` | string | sim | `AGUA`, `ESTUDO` ou `EXERCICIO` |
| `tipo_medida` | string | sim | `TEMPO` ou `QUANTIDADE`, determinado pela categoria |
| `meta_base` | inteiro | sim | mínimo 1 |
| `meta_frequencia_diaria` | inteiro | não | vezes ao dia, com mínimo e máximo |
| `ocorrencias` | lista | não | horários das sub-atividades; só é usada quando o tamanho da lista bate com `meta_frequencia_diaria`, ver DEF-10 |
| `frequencia_semanal` | string | não | dias cobrados, validado por padrão de texto |
| `meta_maxima`, `incremento`, `dias_incremento` | inteiro | não | progressão automática da meta |
| `gatilho_ancora` | string | não | aceito pela API, sem campo na interface, ver DEF-17 |
| `calibracao_id` | UUID | não | vincula uma sessão de calibração; falha em silêncio se não existir, ver DEF-15 |

| Status | Quando ocorre |
| --- | --- |
| 201 | Hábito criado |
| 400 | Campo inválido, ou lista de ocorrências incoerente |
| 422 | Já existem dois hábitos ativos |

### `PUT /api/habits/{id}`

Token. Mesmo corpo da criação. Recria as sub-atividades conforme a nova configuração, preservando o
histórico de execuções.

### `DELETE /api/habits/{id}`

Token. Marca o hábito como inativo e grava o instante da exclusão. Nenhuma linha é removida do
banco: o histórico de execuções permanece, por integridade referencial e porque as estatísticas
dependem dele. Não há caminho, pela interface, para trazer o hábito de volta. A vaga no limite de
dois ativos é liberada.

### `GET /api/habits/{id}/priming`

Token. Devolve uma frase da `biblioteca_textos`, na categoria do hábito e no idioma do perfil.

### `POST /api/habits/{id}/executions`

Token. Registra o desfecho de uma ocorrência.

| Campo | Tipo | Obrigatório | Observação |
| --- | --- | --- | --- |
| `execution_token` | UUID | sim | garante unicidade: reenviar o mesmo token é recusado |
| `tipo` | string | não | conclusão, desistência ou uso de escudo |
| `valor_realizado` | inteiro | sim | não pode ser negativo; sem teto superior |

| Status | Quando ocorre |
| --- | --- |
| 200 | Execução registrada. A resposta traz o valor acumulado, as moedas creditadas e se houve bônus |
| 400 | Tipo inválido ou valor negativo |
| 422 | Token já usado, ou hábito sem ocorrência pendente |

### `POST /api/habits/{id}/shield`

Token. Debita 1500 moedas do saldo do hábito e credita um escudo. Responde 422 quando o saldo é
insuficiente.

### `GET /api/stats/monthly` e `GET /api/stats/weekly`

Token. As duas apontam para o mesmo método e devolvem a mesma janela de trinta dias: ofensiva
atual, desempenho diário, os três maiores recordes e a constância. A existência da segunda rota é
um apelido histórico, registrado como DEF-06.

### `GET /api/calibration/questions`

Token. Parâmetro `categoria` na consulta. Devolve as perguntas do catálogo no idioma do perfil.

### `POST /api/calibration`

Token. Corpo: `categoria` e a lista `respostas`. Devolve a meta sugerida e o identificador da
sessão, que pode ser passado depois em `calibracao_id` na criação do hábito.

### `FechamentoDiarioJob`

Não é rota. Roda de hora em hora e apura os dias já encerrados no fuso de cada usuário: decide se a
meta foi cumprida, aplica ou zera a ofensiva, consome escudo quando há, e aplica a progressão
automática da meta.

---

## 7. Frontend — Estrutura e Componentes

Quatorze telas, dezoito rotas, dez componentes compartilhados e sete contextos. A pasta `app`
contém só as rotas, que são arquivos finos cuja única função é apontar para a página em
`src/pages`; essa separação é imposição do Expo Router, que deriva a navegação da árvore de
arquivos, e tem o efeito desejável de manter a lógica de tela fora da definição de rota.

### Telas

| Tela | Rota | O que faz |
| --- | --- | --- |
| `Login` | `login.jsx` | Duas abas no mesmo formulário: entrar e criar conta |
| `VerifyEmail` | `verify-email.jsx` | Campo do código de seis dígitos, com reenvio |
| `ForgotPassword` | `forgot-password.jsx` | Dois passos: pedido do código e definição da nova senha |
| `Calibration` | `calibration.jsx` | Questionário, uma pergunta por vez, com indicador de progresso |
| `CreateHabit` | `(tabs)/create.jsx` | Assistente de quatro passos: molde, modo de configuração, meta e revisão |
| `Home` | `(tabs)/home.jsx` | Carrossel com um hábito em foco, progresso do dia e ações do hábito |
| `Stats` | `(tabs)/stats.jsx` | Ofensiva, desempenho de trinta dias, recordes e constância |
| `Store` | `(tabs)/store.jsx` | Custo do escudo, saldo por hábito e inventário |
| `Profile` | `(tabs)/profile.jsx` | Nome, idioma, tema e fuso horário |
| `ChangePassword` | `change-password.jsx` | Troca de senha, com confirmação |
| `PreTask` | `pretask.jsx` | Frase motivacional antes de iniciar |
| `Execution` | `execute.jsx` | Cronômetro ou contador, conforme o tipo de medida |
| `Success` | `success.jsx` | Resultado positivo, com recompensa visual |
| `Fail` | `fail.jsx` | Resultado negativo, em linguagem não punitiva |

As demais rotas são `index.jsx`, que decide entre acesso e tela inicial; `+not-found.jsx`; e os
`_layout.jsx` que montam a navegação.

### Contextos

| Contexto | Responsabilidade |
| --- | --- |
| `AuthContext` | Sessão: token, perfil, entrada, saída e revalidação na reabertura do aplicativo |
| `CurrentHabitContext` | Qual hábito está em foco entre as telas de execução |
| `ExecutionResultContext` | Carrega o resultado da execução até as telas de sucesso e falha |
| `LanguageContext` | Idioma corrente e troca em tempo de execução |
| `ThemeToggleContext` | Tema claro e escuro |
| `SoundContext` | Efeitos sonoros, preferência guardada só no aparelho |
| `ToastContext` | Avisos curtos, inclusive o de sessão expirada |

### Camadas de apoio

| Pasta | Conteúdo |
| --- | --- |
| `src/services` | Cliente Axios único. O interceptor anexa o token e, ao receber 401 ou 403 fora das rotas de login e cadastro, avisa o usuário, aguarda dois segundos, limpa as credenciais e redireciona |
| `src/i18n` | Catálogos `pt.js` e `en.js`. O de inglês tem seis chaves a mais, ver DEF-01 |
| `src/model` | Enumerações de estado de hábito e de ocorrência |
| `src/utils` | Armazenamento seguro do token, formatação de data e tradução de erro da API para texto de usuário |
| `src/hooks` | Ganchos reutilizáveis de temporização e de ciclo de vida |
| `src/styles` | Definição dos dois temas |

As três entradas detalhadas a seguir são as percorridas pelo fluxo de Cadastro, em
[§8](#8-fluxos-ponta-a-ponta).

### Tela de autenticação (`src/pages/Login`)

Um único componente (`Login/index.jsx`) atende as duas abas "Entrar" e "Criar Conta": a aba ativa troca o schema de validação (`validation.js`) e os campos visíveis do mesmo formulário `react-hook-form`. Passo a passo da aba de cadastro em [§8 → Cadastro, itens 1 e 2](#8-fluxos-ponta-a-ponta).

### Contexto de autenticação (`src/contexts/AuthContext.jsx`)

Expõe `register`, `login`, `confirmarEmail`, `redefinirSenha` e `logout` para o restante do app. Só `register` não chama `persistSession`: o cadastro nunca autentica sozinho (ver [§8 → Cadastro, item 3](#8-fluxos-ponta-a-ponta)).

### Camada HTTP (`src/services/api.js`)

Instância única do axios com `baseURL` fixa e dois interceptors: um de requisição (injeta o token salvo, quando existe) e um de resposta (trata 401/403 globalmente, exceto para `/auth/login` e `/auth/register`).

---

## 8. Fluxos Ponta a Ponta

> **Escopo desta seção.** O mapeamento ponta a ponta é feito uma funcionalidade por vez, pelo
> método descrito em [`revisao.md`](revisao.md): percorrer o caminho inteiro, do toque na tela à
> linha no banco, e deixar no código-fonte as anotações `@note`, `@audit-ok`, `@audit-issue`,
> `@audit-info`, `@todo` e `@remind` que sustentam o texto. Hoje existem 53 anotações, em dezesseis
> arquivos, todas do caminho de cadastro. Por isso esta seção e a [§12](#12-sumário-de-bookmarks-do-fluxo-de-funcionalidades)
> cobrem só o Cadastro. Aguardam mapeamento: Autenticação, Verificação de e-mail, Recuperação de
> senha, Criação de hábito, Calibração, Execução da tarefa, Gamificação, Estatísticas e Perfil. As
> demais seções deste documento não dependem desse método e já cobrem o sistema inteiro.


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

A coleção está em `backend/src/main/resources/Postman/Tempo Claro.json`, com 29 requisições em sete
pastas. Ela documenta o comportamento esperado de cada rota, inclusive os casos de recusa, e cada
descrição aponta o requisito que a requisição exercita.

### Como usar

1. No Postman, **Import** e selecionar o arquivo da coleção.
2. Criar uma variável de ambiente `base_url` com `http://localhost:8084/api`.
3. Rodar `01 - Autenticação → Register`, confirmar o e-mail com o código, e depois `Login`. A
   resposta do login traz o token; guardá-lo na variável `token`, que as demais requisições usam no
   cabeçalho de autorização.

### As sete pastas

| Pasta | Requisições | O que cobre |
| --- | --- | --- |
| 01 - Autenticação | 3 | Cadastro, login e leitura do perfil pelo token |
| 02 - Calibração | 5 | Questionário das três categorias, cálculo da sugestão e categoria inexistente |
| 03 - Hábitos | 6 | Criação com e sem calibração, painel, edição, exclusão e o limite de dois ativos |
| 04 - Execução | 8 | Frase pré-tarefa, conclusão, superação, desistência com e sem escudo, token repetido, tipo inválido e compra de escudo |
| 05 - Estatísticas | 2 | Estatísticas do mês e o apelido da rota, que devolve o mesmo conteúdo |
| 06 - Perfil | 2 | Atualização de nome e fuso, e troca de senha |
| 07 - Segurança | 3 | Requisição sem token, senha errada e tentativa de acessar hábito de outro usuário |

A ordem importa: as pastas 03 a 06 dependem de uma sessão aberta na pasta 01, e a pasta 04 depende
de um hábito criado na pasta 03.

---

## 11. Limitações Conhecidas

Duas listas. A primeira são os defeitos levantados pela campanha de testes de 06 de outubro de
2026, registrados na aba Defeitos de
[`tcc/Tabela De Testes Tempo Claro Rodrigo Miranda.xlsx`](tcc/), que é o registro canônico. Nenhum
deles foi corrigido durante a campanha, por decisão metodológica: corrigir durante a execução
invalidaria o resultado registrado. A segunda são as pendências de operação, que não são defeitos
de código.

### Defeitos de severidade alta

| ID | Defeito | Requisito | Efeito |
| --- | --- | --- | --- |
| DEF-01 | Seis chaves de tradução ausentes em `pt.js` | RNF10 | As chaves de erro genérico existem em `en.js` e não em `pt.js`. Uma falha de rede sem corpo de mensagem exibe ao usuário o nome técnico da chave, no idioma padrão do aplicativo |
| DEF-02 | Hábito excluído continua operável pela API | RF08, RNF05 | `AcessoHabitoService.carregar` verifica a propriedade do hábito e não o campo `hab_ativo`, de modo que um hábito excluído aceita execução, edição e compra de escudo por chamada direta |
| DEF-03 | Notificações locais não aparecem no Android 13 ou superior | sem requisito | O manifesto não declara `POST_NOTIFICATIONS`, obrigatória desde o Android 13, não há criação de canal e o toque no aviso não reabre o aplicativo |
| DEF-04 | Tráfego não criptografado habilitado sem necessidade | RNF05 | `usesCleartextTraffic=true` está no `app.json` embora a única URL de API usada já seja HTTPS, o que amplia a superfície de ataque em rede local |

### Defeitos funcionais

| ID | Defeito | Requisito |
| --- | --- | --- |
| DEF-05 | Constância pode passar de cem por cento: o numerador conta qualquer dia com meta cumprida e o denominador conta só os dias programados | sem requisito |
| DEF-06 | A rota semanal devolve os mesmos trinta dias da mensal, porque as duas apontam para o mesmo método e a janela é fixa | sem requisito |
| DEF-07 | Progressão de meta é perdida quando a rotina de fechamento apura vários dias de uma vez, porque a condição é avaliada depois do laço | sem requisito |
| DEF-08 | Horários sugeridos pela calibração colidem acima de quatro ocorrências diárias, por causa do teto de doze horas | sem requisito |
| DEF-09 | Calibração pode ser duplicada por duplo toque, por não usar token de idempotência | RNF07 |
| DEF-10 | Ocorrências individuais são descartadas em silêncio quando a lista tem tamanho diferente do número de vezes ao dia | sem requisito |
| DEF-11 | O cronômetro trava sem botão de retomada se a rede cair no momento exato de concluir a tarefa | RNF04, RNF11 |
| DEF-12 | Reuso da mesma senha não é bloqueado na troca de senha | RNF05 |
| DEF-14 | Critério de bônus e crédito de moedas usam bases diferentes de comparação | RNF06 |
| DEF-15 | Vínculo da calibração ao hábito falha em silêncio quando o identificador não existe ou é de outro usuário | sem requisito |
| DEF-16 | Corrida no limite de dois hábitos ativos: duas requisições simultâneas podem criar um terceiro | sem requisito |
| DEF-18 | Cobertura de acessibilidade incompleta: 42 rótulos, 3 papéis e nenhuma dica ou estado declarado | RNF02 |
| DEF-19 | A liberação da execução usa o fuso do aparelho, e não o fuso gravado no perfil | RNF10 |

### Defeitos de severidade baixa

| ID | Defeito | Requisito |
| --- | --- | --- |
| DEF-13 | Perfil não encontrado devolve 400 em vez de 404, fugindo do padrão do resto do projeto | sem requisito |
| DEF-17 | O gatilho-âncora é aceito pela API e devolvido na resposta, mas nenhuma tela oferece campo para preenchê-lo | sem requisito |
| DEF-20 | Rotas protegidas devolvem 403 onde a convenção HTTP pede 401. É divergência de contrato deliberada, não falha de segurança | RNF05 |

### Pendências de operação

| Pendência | O que falta |
| --- | --- |
| Código de verificação fixo no painel do Render | A variável `CODIGO_VERIFICACAO_FIXO` já saiu do código e do `application-prod.properties`, mas se ainda estiver definida no painel do Render ela tem precedência sobre o padrão do arquivo. Conferir e apagar lá |
| Domínio do Resend | Confirmar no painel do Resend, em Domains, se `send.monzai.com.br` está verificado. Estando, definir `RESEND_FROM_EMAIL` no Render com um endereço desse domínio, no lugar do domínio de teste |

### O que o sistema não faz

Encerrar sessão no servidor, renovar token, revogar token e distinguir perfis de acesso não existem
no código. A sessão termina pela expiração do token, e o cliente apenas descarta as credenciais
locais. Notificações push, widget na tela inicial e versão web estão previstos como trabalho futuro
e não têm implementação.

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
| `@audit-issue` | **[fixed]** 10.1 `application-prod.properties`            | **Segurança.** Em produção, todo código de verificação/recuperação virava o valor fixo `123456` (contorno pro SMTP não entregar) — qualquer um que soubesse o e-mail de um usuário tomava a conta pelo "esqueci minha senha", sem acessar a caixa de entrada dele. Corrigido: a variável saiu do `application-prod.properties` e do código. Resta conferir o painel do Render, porque uma variável de ambiente definida lá tem precedência sobre o padrão do arquivo. Ver [§11](#11-limitações-conhecidas). |
| `@audit-issue` | **[fixed]** 11.1 `SmtpEmailService.java` (removido) → `ResendEmailService.java` | SMTP direto (Gmail) nunca entregava em produção: o Render free bloqueia as portas 25/465/587 desde 26/09/2025. Corrigido trocando para a API HTTP do Resend (porta 443, não bloqueada). Requer `RESEND_API_KEY`/`RESEND_FROM_EMAIL` com domínio verificado no Resend. |
| `@audit-issue` | **[fixed]** 11.1 `ResendEmailService.java` → `enviarCodigo` | Era `@Async`: falha do Resend não chegava à resposta HTTP nem ao usuário. Corrigido: método agora é síncrono e lança `RegraDeNegocioException` (422) quando o envio falha, que desfaz a transação do cadastro (item 7) junto. |
| `@audit-issue` | **[fixed]** 13.4 `GlobalExceptionHandler.java` → `mensagemAmigavelParaRestricao` | Sem caso para a corrida de e-mail duplicado. Corrigido com `causaRaiz.contains("usu_email")`. |
| `@audit-issue` | **[fixed]** 16.1 `PasswordInput/index.jsx`               | `textContentType="oneTimeCode"` (content type de OTP, não de senha) com autofill desligado nos campos de senha do cadastro. Corrigido para `password`/`newPassword` conforme o contexto. |

---

## 13. Artefatos do TCC

A pasta `tcc/` reúne os documentos do trabalho de conclusão. Esta seção existe para responder, sem
abrir arquivo nenhum, qual é o documento atual de cada assunto.

| Arquivo | O que é | Versionado |
| --- | --- | --- |
| `TempoClaro_Monografia.docx` | A monografia. **É a fonte de verdade**: em qualquer divergência entre documentos do projeto, vale o corpo do texto dela, não os índices, que são campos automáticos e podem estar desatualizados | não, binário |
| `atualizacao-monografia.md` | O que precisa mudar na monografia, capítulo por capítulo, já na formatação do documento. Contém apenas o que muda | sim |
| `atualizacao-monografia.docx` | O mesmo conteúdo em Word, com as legendas de quadro em Título 5 e os títulos de seção em Título 1 a 3, para copiar e colar na monografia preservando os estilos | sim |
| `capitulo-7-testes.md` | Texto do Capítulo 7, Testes e Validação, com os Quadros 10 a 13 | sim |
| `apendice-b-casos-de-uso.md` | Texto do Apêndice B, com a síntese dos 27 casos de uso e a correlação com os requisitos, nos Quadros 16 a 18 | sim |
| `validacao-requisitos-iso.md` | Validação dos requisitos contra a ISO/IEC 25010, a ISO/IEC/IEEE 29148 e a ISO 9001, com o de-para entre a numeração antiga e a vigente | sim |
| `Tabela De Testes Tempo Claro Rodrigo Miranda.xlsx` | Planilha da campanha de testes: 281 casos em 17 abas, com rastreabilidade, cobertura e os 20 defeitos | não, binário |
| `figura-07-casos-de-uso.png` | **A Figura 7 da monografia**, o diagrama de casos de uso na versão final | sim |
| `figura-07-casos-de-uso-gerado.*` | Versão do mesmo diagrama produzida por programa, em 300 pontos por polegada. Serve de conferência: foi com ela que se verificou que nenhuma linha cruza outra e que nenhum caso de uso inclui mais de um outro | o `.png` não |
| `gerar-diagrama-casos-de-uso.py` | Gera a versão de conferência e roda o verificador de cruzamentos | sim |

### Como regerar o diagrama de conferência

```sh
cd tcc
python3 gerar-diagrama-casos-de-uso.py                       # escreve .svg e .drawio
rsvg-convert -d 300 -p 300 figura-07-casos-de-uso-gerado.svg \
             -o figura-07-casos-de-uso-gerado.png
```

A saída precisa imprimir `VERIFICAÇÃO: nenhum cruzamento` e `casos de uso com mais de um include:
nenhum`. Essas duas condições são exigência da modelagem: a primeira é legibilidade, a segunda vem
da semântica de inclusão em UML, já que dois `«include»` obrigatórios no mesmo caso de uso não têm
ordem definida.

### Números que valem como referência rápida

| O quê | Quanto |
| --- | --- |
| Requisitos funcionais | 21, de RF01 a RF21 |
| Requisitos não funcionais | 11, de RNF01 a RNF11, classificados pela ISO/IEC 25010 |
| Casos de uso | 27, de UC01 a UC27, um ator |
| Quadros da monografia | 18 |
| Figuras da monografia | 24 |
| Casos de teste | 281, dos quais 222 executados: 200 aprovados e 22 reprovados |
| Defeitos registrados | 20: 4 de severidade alta, 13 funcionais e 3 baixas |
| Testes automatizados do backend | 144 |

---

## Licença e uso

Trabalho acadêmico desenvolvido para avaliação no curso de Tecnologia em Sistemas para Internet do
IFSul — Campus Pelotas. O código está disponível para consulta e fins educacionais.
