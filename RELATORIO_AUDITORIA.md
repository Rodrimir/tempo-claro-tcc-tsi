# Relatório de Auditoria: Tempo Claro

## 1. Escopo e método

Este relatório foi produzido por leitura direta do código do backend (Spring Boot, `backend/src/main/java`) e do frontend (Expo Router, `frontend/src` e `frontend/app`), comparando o comportamento observado com a documentação funcional fornecida pelo autor. Nenhum código foi alterado nem comentado durante esta auditoria: o objetivo é só o diagnóstico.

Nem todo o projeto foi lido linha a linha. As seções 2 a 4 documentam o que foi confirmado por leitura. A seção 5 lista o que não foi auditado, para não passar a falsa impressão de cobertura total.

## 2. Documentação funcional por módulo (confirmada por leitura)

### 2.1 Conta e Autenticação

Cadastro em `POST /api/auth/register` (`AuthController.java`, `AuthService.cadastrar`). Senha validada em `SenhaValidator.java`: mínimo 8 e máximo 25 caracteres, exige 1 maiúscula e 1 caractere especial, não exige minúscula nem dígito. Hash BCrypt (`SecurityConfig.passwordEncoder`). Login em `AuthService.autenticar`, token JWT HS512 via `TokenService.geraToken`, validade configurável (`jwt.expiration`, default 86400000 ms). Conta não verificada devolve 403 no login porque `Usuario.isEnabled()` retorna `emailVerificado` (`AuthenticationManager` do Spring Security recusa login de `UserDetails` desabilitado). Sessão: token em `expo-secure-store`, perfil em `AsyncStorage` (`utils/storage.js`); reabertura do app valida consultando `/dashboard` (`AuthContext.jsx`). Expiração: interceptor de `api.js` detecta 401/403 fora de `/auth/login` e `/auth/register`, dispara toast "sessão expirou", aguarda 2s, limpa credenciais e redireciona a `/login`. Não há logout no servidor, refresh token, revogação ou papéis/perfis administrativos: confirmado, nenhuma dessas construções existe no código.

### 2.2 Verificação de E-mail e Recuperação de Senha

OTP de 6 dígitos, hash BCrypt, validade 15 minutos, máximo 5 tentativas erradas, throttle de 60s entre reenvios (`CodigoVerificacaoService.java`). Verificar e-mail devolve token autenticado direto (`AuthService.verificarEmail`). Recuperação em 2 passos com login automático ao final (`AuthService.redefinirSenha`). `esqueciSenha` sempre devolve 200, mesmo que o e-mail não exista (`ifPresent` silencioso), protegendo contra enumeração. Redefinir a senha marca `emailVerificado=true` também. A força da nova senha é validada antes de consumir o código OTP (`SenhaValidator.motivoInvalida` chamado antes de `validarCodigo`). Troca de senha logada (`UsuarioService.atualizarPerfil`) exige a senha atual. Comunicação assíncrona/bilíngue: **não é mais SMTP Gmail**, foi migrada nesta sessão para a API HTTP do Resend (ver seção 4).

### 2.3 Hábitos

Categorias fixas `AGUA`, `ESTUDO`, `EXERCICIO` (CHECK no banco, `schema.sql`); quarta categoria "reservado" é só cosmética no frontend. Tipos `TEMPO`/`QUANTIDADE`. Limite de 2 hábitos ativos (`HabitoService.LIMITE_HABITOS_ATIVOS`). Assistente de 4 passos no frontend (`CreateHabit/steps/*`). Atributos batem com o schema: título até 60 (`hab_titulo VARCHAR(60)`), meta base, meta máxima, incremento, dias de incremento, frequência semanal (máscara de 7 posições), ocorrências. Máximo 12 ocorrências/dia (`HabitoService.MAX_VEZES_AO_DIA`). Meta diária é rateada entre ocorrências com o resto na última (`HabitoService.gerarSubAtividades`, linhas 269-274). Horário obrigatório com mais de 1 ocorrência, opcional com 1 (default 23:59). Edição recria todas as ocorrências (`atualizarHabito`: `deleteAllByHabitoId` + `gerarSubAtividades`). Exclusão é soft delete (`habitoRepository.archive`). Dashboard evita N+1 com 3 buscas em lote (`listarDashboard`: status, ocorrências e histórico do dia, todos por lista de IDs).

### 2.4 Calibração Assistida

Catálogo JSON versionado, carregado e validado no boot via `@PostConstruct` em `CatalogoCalibracao.java`; falha de schema (categoria sem `faixas_meta` ou sem pergunta obrigatória) derruba o boot (`IllegalStateException`). Perguntas obrigatórias: `DIAS_SEMANA`, `VEZES_AO_DIA`, `HORARIOS`, `RITMO`. Pontuação soma pesos das opções escolhidas (`CalibracaoService.pontuar`); dias da semana pontuam à parte (`Math.round(diasMarcados/2f)`). Faixas de meta batem com o catálogo. Tetos rígidos via `teto_resposta` por opção (`calcularMeta`, linha 167-169), aplicados como `Math.min` após a faixa. Meta máxima é meta base vezes `teto_multiplicador` da categoria. Ritmo de incremento vem de `incremento`/`dias_incremento` na opção de resposta escolhida. Explicação bilíngue gerada em `explicar()`. Aceite grava `cab_aceita=true` e vincula `cab_habito_id` (`vincularAoHabito`).

### 2.5 Execução da Tarefa

Priming busca texto por categoria/idioma em `biblioteca_textos`, com fallback fixo em `GamificacaoService`. Liberação por antecedência: `MINUTOS_ANTECEDENCIA_LIBERACAO` em `utils/ocorrencias.js` (frontend), não confirmado no backend (a liberação parece ser só de UI). Cronômetro usa `useTimer` com deadline absoluto e persistência em `AsyncStorage` (`utils/storage.js`, `saveExecutionState`/`isWithinTolerance`, tolerância de 1h hardcoded em `isWithinTolerance`, linha 21: `diff < 3600000`). Modo bônus: cronômetro continua contando após zerar (`isOverachieving`/`overachieveTime` em `useTimer`, não lido em detalhe nesta passada). Quantidade usa anel de progresso com `+/-` e `useHoldToIncrement` (segurar acelera). Botão de concluir aparece só com meta atingida, com fade de 500ms (`estiloConcluir`, `withTiming(…, {duration:500})`, `ExecutionScreen/index.jsx` linha 150-152). Botão físico "Voltar" pausa o cronômetro e abre `GiveUpModal` (linha 138-145). Idempotência via `execution_token` (`GamificacaoService.processarExecucao`, `existsByExecutionToken` lança `RegraDeNegocioException` "Execução duplicada", que o controller devolve como 422).

### 2.6 Gamificação

Moedas por patamar: 100%→100, 120%→150, 150%→200 (`TabelaDeMoedas.java`). Pagamento é a diferença entre o patamar atingido agora e o já creditado hoje (`GamificacaoService.processarExecucao`, linha 120-126), teto implícito de 200/dia porque `devidoPeloPercentual` nunca passa de 200. Moedas e escudos são por hábito (`status_habitos.sta_moedas_locais`), sem saldo global: confirmado, nenhuma tabela de carteira agregada existe. Ofensiva (+1/dia) e zeramento em `FechamentoService.fecharDia`. Nível sobe 1 a cada 10 dias de ofensiva (`DIAS_POR_NIVEL=10`), sem teto no valor (comentário do schema confirma: teto de 5 é só de arte). 3 escudos grátis na criação (`ESCUDOS_INICIAIS` em `HabitoService`), compra por 400 moedas (`GamificacaoService.CUSTO_ESCUDO`), sem limite de acumulação. Uso manual 1x/dia (`bloqueio_usado_hoje`), consumo automático no fechamento se houver saldo (`FechamentoService.fecharDia`, linha 50-55). Histórico com os 5 tipos de sucesso batendo com o CHECK do banco.

### 2.7 Fechamento Diário Automático

`FechamentoDiarioJob.apurarDiasFechados`, `@Scheduled(fixedRate=3_600_000, initialDelay=60_000)`: de hora em hora, 60s após o boot. Usa o fuso do usuário (`ZonaUsuario.resolver`), nunca o dia corrente (`while (dia.isBefore(hoje))`), até 60 dias por passada (`MAX_DIAS_POR_PASSADA`). Dias de folga não zeram ofensiva nem consomem escudo (`FechamentoService.fecharDia`, primeiro `if`, retorna cedo). Idempotente via `sta_ultimo_reset`. Falha em um hábito não derruba a varredura (`try/catch` por hábito dentro do loop, `apurarDiasFechados` linha 56-67). Zera contadores diários (`limparContadoresDoDia`). Progressão automática de meta em `aplicarProgressaoDeMeta`, recriando ocorrências e preservando horários (linhas 131-138).

### 2.8 Loja

Compra de escudos por hábito (`GamificacaoService.comprarEscudo`). Seletor no frontend mostra saldo do hábito focado ou o consolidado (`Store/index.jsx`, `moedasExibidas`). Inventário lateral (`Drawer`) soma escudos e moedas por hábito ativo/não arquivado. Fundo reage ao tema (`FUNDO_LOJA_DIA`/`NOITE`).

### 2.9 Estatísticas

Janela fixa de 30 dias por hábito, incluindo dias ociosos (`StatsService.DIAS_JANELA`). `/monthly` e `/weekly` batem no mesmo `getStats` (`StatsController.java`, linha 22): **ver bug B6**. Top 3 recordes por valor realizado, desempatando por data mais recente. Constância calculada sobre dias programados: **ver bug B5**, o denominador é correto mas o numerador não filtra por dia programado.

### 2.10 Perfil

Nome, idioma, tema, fuso horário editáveis (`UsuarioService.atualizarPerfil`). Não permite trocar e-mail (não há campo no DTO) nem excluir conta (nenhum endpoint de delete de usuário). Troca de senha exige senha atual; reuso da senha anterior **não é bloqueado**, ver bug B12. Sons salvos só localmente (nenhuma chamada de API relacionada a som encontrada).

### 2.11 Notificações Locais

`expo-notifications`, agenda 2 por ocorrência (antes e na hora), janela de 2 dias (`DIAS_JANELA=2` em `notificacoes.js`), reconstrução completa a cada `reagendarTodas` (chamada, por inferência, ao focar a Home). Não agenda passado nem ocorrências já resolvidas hoje (linha 78-80). `dispositivos_push`: nenhuma entidade/repositório Java a referencia, confirmado órfã.

### 2.12 e 2.13 UI/UX e Navegação

Não auditadas em detalhe nesta passada (ver seção 5). Confirmado apenas: `usesCleartextTraffic=true` em `app.json`/manifest Android (ver bug B4); back handler físico interceptado tanto no login quanto na execução (`Login/index.jsx`, `Execution/index.jsx`).

## 3. Divergências entre a especificação e o código

| Especificação | Código |
| --- | --- |
| "Troca Logada exige a senha atual e proíbe reutilização da senha anterior" | Exige a senha atual, sim. Não compara nova senha com a atual: reenviar a mesma senha é aceito (bug B12). |
| "/weekly e /monthly executam o mesmo método" | Confirmado, mas isso é apresentado na especificação como fato observado, não como bug esperado do sistema: a rota semanal está incorreta (bug B6). |
| "Comunicação: e-mails via SMTP Gmail" | Já não é mais verdade: migrado para Resend nesta sessão (seção 4). |

## 4. Já corrigido nesta sessão de trabalho

Estes itens **não** devem ser tratados como bugs em aberto; foram corrigidos e verificados (compilação e, quando indicado, suíte de testes) antes deste relatório.

1. OTP fixo (`123456`) em produção: removido de `application-prod.properties`. Falta apagar a variável de ambiente `CODIGO_VERIFICACAO_FIXO` no painel do Render, se ela ainda estiver definida lá.
2. Envio de e-mail trocado de SMTP direto (bloqueado pelo Render free em produção) para a API HTTP do Resend: `SmtpEmailService` removida, `ResendEmailService` criada (`RestClient`).
3. `ResendEmailService.enviarCodigo` deixou de ser `@Async` silencioso: agora é síncrono e lança `RegraDeNegocioException` (HTTP 422) se o envio falhar.
4. `AuthService.cadastrar` agora é `@Transactional`: falha no envio do código desfaz o cadastro do usuário também.
5. `RegisterRequestDTO`: `@Size(max=150)` em `nome`, `@Size(max=255)` em `email`. Espelhado no `yup` do frontend.
6. `SenhaValidator.TAMANHO_MAXIMO=25`: teto de tamanho de senha (evita truncamento silencioso do BCrypt em 72 bytes), espelhado no frontend e em `redefinirSenha`.
7. `PasswordInput` (frontend): trocado `textContentType="oneTimeCode"` (que desligava o gerenciador de senha nativo) para `password`/`newPassword` conforme o contexto.
8. `GlobalExceptionHandler.mensagemAmigavelParaRestricao`: adicionado caso para violação de unicidade de `usu_email` (corrida de cadastro simultâneo).
9. `Usuario.atualizadoEm` (coluna `usu_atualizado_em`, existia no schema mas não na entidade): mapeada, com `@PrePersist`/`@PreUpdate` atualizando o valor.
10. Confirmado com o autor: a checagem de e-mail duplicado é case-sensitive **de propósito** (não é bug, não normalizar).

Pendência externa, fora do controle do código: o domínio `send.monzai.com.br` tem DNS corretamente configurado (DKIM, SPF e MX verificados via `dig`), mas o painel do Resend ainda não confirmou o domínio (retornando 403 "domain is not verified" em testes). Enquanto isso, o remetente configurado localmente é o de teste `onboarding@resend.dev`, que só entrega para o e-mail do próprio dono da conta Resend.

## 5. Bugs confirmados por severidade

### Crítico

Nenhum bug crítico permanece em aberto: o único item crítico da auditoria original (OTP fixo em produção) já foi corrigido, seção 4.

### Grave

**B1. Seis chaves de tradução faltando em `pt.js`.** Confirmado por comparação programática das árvores de chaves de `frontend/src/i18n/pt.js` (315 chaves) e `en.js` (321 chaves). Faltam exatamente: `comum.erroSemResposta`, `comum.erroValidacao`, `comum.erroCredencial`, `comum.erroNaoEncontrado`, `comum.erroRegraDeNegocio`, `comum.erroServidor`. São exatamente as chaves usadas por `traduzirPorStatus` em `frontend/src/utils/erros.js`. Como `traduzir()` (`frontend/src/i18n/index.js`, linha 15) devolve a própria chave quando não a encontra, um usuário no idioma padrão do app (pt-BR) vê literalmente o texto `comum.erroServidor` na tela sempre que uma chamada de API falha sem `message` no corpo (erro de rede, timeout, 500 sem handler específico).

**B2. Hábito arquivado continua totalmente operável via API.** `AcessoHabitoService.carregar` (`backend/src/main/java/com/rodrigo/backend2java/habito/AcessoHabitoService.java`, linhas 24-30) verifica só se o hábito pertence ao usuário autenticado; não filtra por `hab_ativo`. Como todos os endpoints de hábito individual passam por esse método (`atualizarHabito`, `deletarHabito`, `processarExecucao`, `comprarEscudo`, `obterPriming`, `obterEstatisticas`), um hábito arquivado (soft-deleted) continua aceitando edição, execução, compra de escudo e consulta de estatísticas via chamada direta à API, mesmo que a UI não ofereça esses botões para hábitos arquivados. Reprodução: arquivar um hábito e então chamar `POST /api/habits/{id}/executions` com o mesmo token; a chamada é aceita normalmente.

**B3. Notificações push locais provavelmente não funcionam no Android 13+.** Em `frontend/src/services/notificacoes.js` não há `Notifications.setNotificationChannelAsync` (canal obrigatório desde o Android 8 para que a notificação apareça com a cor/prioridade configuradas); em todo o projeto não há `addNotificationResponseReceivedListener` nem `useLastNotificationResponse` (tocar na notificação não reabre nem navega dentro do app); o `AndroidManifest.xml` gerado não declara `android.permission.POST_NOTIFICATIONS` (permissões presentes: `FOREGROUND_SERVICE`, `INTERNET`, `VIBRATE`, `RECORD_AUDIO`, `SYSTEM_ALERT_WINDOW`, `MODIFY_AUDIO_SETTINGS`, `READ/WRITE_EXTERNAL_STORAGE`; `POST_NOTIFICATIONS` ausente). Sem essa permissão, o Android 13+ nunca exibe a notificação, mesmo que `solicitarPermissao()` seja chamada.

**B4. `usesCleartextTraffic=true` habilitado sem necessidade.** Configurado em `app.json` (plugin `expo-build-properties`) e presente no `AndroidManifest.xml` gerado. A única URL de API usada (`.env`: `EXPO_PUBLIC_API_URL=https://tempo-claro-tcc-tsi.onrender.com/api`) já é HTTPS, então a permissão de tráfego não criptografado é desnecessária e amplia a superfície de ataque (MITM em rede local).

### Funcional

**B5. Constância pode passar de 100%.** `StatsService.java`, linhas 71-73 e 97-98: `diasComMetaCumprida` conta qualquer dia com meta cumprida no período de 30 dias, sem checar se o dia era programado; o denominador (`diasProgramados`) só conta dias programados. Se o usuário tiver frequência semanal seg-sex (22 dias programados em 30) e ainda assim cumprir a meta em um sábado ou domingo (execução manual fora do previsto), o percentual pode passar de 100% (ex.: 25 dias cumpridos sobre 22 programados = 114%).

**B6. `/api/stats/weekly` devolve os mesmos 30 dias de `/monthly`.** `StatsController.java`, linha 22: `@GetMapping({"/monthly", "/weekly"})` mapeia as duas rotas para o mesmo método, e `StatsService.DIAS_JANELA=30` é fixo, sem parâmetro de janela. A rota semanal não existe de fato como funcionalidade distinta.

**B7. Progressão automática de meta pode ser perdida quando o job apura vários dias na mesma passada.** `FechamentoDiarioJob.aplicarProgressaoDeMeta` (linhas 112-115) testa `diasSeguidos % diasIncremento != 0` uma única vez, depois que o loop de `apurarHabito` já processou todos os dias pendentes. Se o job rodar com o app fechado por alguns dias e `diasSeguidos` pular de 8 para 11 numa só passada com `diasIncremento=10`, a condição de módulo (`11 % 10 = 1`) nunca bate exatamente no 10, e a progressão daquele ciclo não acontece.

**B8. Horários de calibração colidem com mais de 4 ocorrências por dia.** `CalibracaoService.lerHorarios` (linha 232-234): `HORARIO_PADRAO.plusHours(Math.min(12, horarios.size()*4L))` tem teto de 12 horas. Para `vezesAoDia > 4`, os horários gerados automaticamente se repetem (08:00, 12:00, 16:00, 20:00, 20:00, 20:00...) em vez de continuar em intervalos de 4h como a especificação descreve.

**B9. Calibração pode ser duplicada com duplo clique.** `CalibracaoService.calibrar` (linhas 66-127) não usa nenhum token de idempotência nem checa se já existe uma calibração recente e não vinculada para o mesmo usuário/categoria antes de inserir. Um duplo toque rápido no botão de submissão do frontend, sem `disabled` durante o request (não confirmado se o frontend do passo de calibração desabilita o botão; não lido nesta passada), pode gerar duas linhas em `calibracoes` e respostas duplicadas.

**B10. Ocorrências individuais enviadas pelo cliente são descartadas silenciosamente se a contagem não bater.** `HabitoService.gerarSubAtividades` (linha 255): `usaOcorrenciasIndividuais = ocorrencias != null && ocorrencias.size() == vezesAoDia`. Se o cliente enviar uma lista de ocorrências com tamanho diferente de `meta_frequencia_diaria` (por exemplo, por um bug de sincronização no formulário do assistente), o método cai no modo de horário único sem avisar, perdendo os horários individuais que o usuário configurou.

**B11. Timer de execução trava indefinidamente se a rede cair no momento de concluir.** `frontend/src/pages/Execution/index.jsx`, função `handleComplete` (linhas 154-171): chama `pause()` antes do `await submitExecution(...)`; se a chamada falhar (rede indisponível), o bloco `catch` só mostra um toast de erro e **não chama `resume()`**. Compare com `handleGiveUp` (linhas 173-191), cujo `catch` chama `resume()` explicitamente. O usuário fica com o cronômetro pausado na tela, sem nenhum botão para retomá-lo, tendo que sair da tela e depender da recuperação de estado ao reabrir (`ExecutionScreen`, que só reidrata se achar `executingHabitId` salvo).

**B12. Reuso da mesma senha não é bloqueado, ao contrário do que a especificação afirma.** `UsuarioService.atualizarPerfil` (`backend/src/main/java/com/rodrigo/backend2java/usuario/UsuarioService.java`, linhas 72-89): valida a senha atual e a força da nova senha, mas nunca compara a nova com o hash atual antes de trocar. Enviar a mesma senha como "nova senha" é aceito normalmente.

**B13. Perfil não encontrado devolve 400 em vez de 404.** `UsuarioService.java`, linhas 30 e 45: `throw new RuntimeException("Usuário não encontrado")`. Como não existe um `@ExceptionHandler` específico para `RuntimeException` genérica além do catch-all (`GlobalExceptionHandler.handleRuntimeException`, que devolve 400), essas duas ocorrências fogem do padrão do resto do projeto, que usa `RecursoNaoEncontradoException` (404) para esse caso.

**B14. Critério de bônus e crédito de moedas usam bases diferentes.** Em `GamificacaoService.processarExecucao`: o bônus (`COMPLETE_EXTRA`, linha 114) é decidido por `valorRealizado >= alvoDaOcorrencia * 1.2`, comparando o valor desta execução com o alvo *daquela ocorrência específica*. O crédito de moedas (linha 120) usa `status.getValorAcumuladoHoje() / habito.getMetaBase()`, comparando o acumulado do *dia inteiro* com a meta base do hábito. Em hábitos com mais de uma ocorrência por dia, é possível a execução ser marcada como bônus sem que o percentual do dia atinja 120% (ou vice-versa).

**B15. Vínculo de calibração ao hábito falha em silêncio.** `CalibracaoService.vincularAoHabito` (linhas 130-138): usa `.filter(...).ifPresent(...)`. Se `calibracao_id` não existir ou pertencer a outro usuário, nada acontece, nenhuma exceção é lançada, e `HabitoService.criarHabito` (que chama esse método na mesma transação, linha 108-110) segue normalmente: o hábito é criado sem o vínculo esperado, sem qualquer sinal de erro para quem chamou.

**B16. Corrida no limite de 2 hábitos ativos.** `HabitoService.criarHabito` (linhas 60-64): a checagem `habitosAtivos.size() >= LIMITE_HABITOS_ATIVOS` lê e decide sem lock nem constraint de banco correspondente. Duas requisições de criação disparadas simultaneamente pelo mesmo usuário podem passar pela checagem antes de qualquer uma commitar, resultando em mais de 2 hábitos ativos.

### Pontas soltas e código morto

**B17.** Coluna `hab_gatilho_ancora` existe no banco, é aceita no DTO e devolvida na resposta (`HabitoResponseDTO.gatilho_ancora`), mas nenhuma tela do frontend lida nesta auditoria expõe um campo de formulário para preenchê-la.

**B18.** Coluna `bib_texto_aviso_urgencia` (tabela `biblioteca_textos`) nunca é lida por nenhum serviço Java encontrado (`GamificacaoService` só lê `texto_pre_tarefa`, `texto_sucesso_padrao`, `texto_sucesso_extra`).

**B19.** Tabela `dispositivos_push` não tem entidade nem repositório Java correspondente: confirmado órfã. Push remoto não implementado.

**B20.** `HabitoService.gerarSubAtividades` (sobrecarga de 4 argumentos, linhas 233-236) delega para a versão de 5 argumentos passando `null`; grep no projeto não encontrou nenhuma chamada de produção usando a versão de 4 argumentos (aparenta ser usada só por teste).

**B21.** `FechamentoDiarioJob.apurarHabito`: se `usuarioRepository.findById(id)` não encontrar o dono (usuário deletado ou inconsistência de dados), `usuario` fica `null` e o código segue adiante silenciosamente; `ZonaUsuario.resolver(null)` cai no fuso padrão (`America/Sao_Paulo`) sem log de aviso.

## 6. Itens da especificação não confirmados nesta auditoria

Estes itens apareciam no relatório de auditoria original fornecido pelo usuário. Foram investigados até onde o tempo permitiu, e a leitura do código **não confirma** a descrição original; ficam registrados como "não reproduzido", não como "corrigido":

- **"Submeter um código OTP errado derruba a sessão inteira."** O interceptor de erro em `frontend/src/services/api.js` só dispara o fluxo de sessão expirada para 401/403 fora de `/auth/login` e `/auth/register`. Um código incorreto em `CodigoVerificacaoService.validarCodigo` lança `RegraDeNegocioException`, mapeada para HTTP 422, não 401/403. Pela leitura do código, esse caminho não deveria derrubar sessão nenhuma. Não foi possível confirmar o cenário original descrito sem mais contexto (talvez outra tela, não identificada nesta passada).

- **"Falha de tipagem na loja faz UI exibir 'Custa null moedas'."** `Store/index.jsx` só renderiza o painel de compra depois que `loading` vira `false`, o que só acontece depois que `loadHabits` (que também popula `custoEscudo`) resolve. `custo_escudo` sempre vem preenchido em `DashboardResponseDTO` (`GamificacaoService.CUSTO_ESCUDO`, valor fixo 400). Não foi encontrado, nesta leitura, um caminho que deixe `custoEscudo` nulo no momento da renderização do botão de compra.

- **"Na calibração, a pergunta de estratégia é processada mas descartada."** `CalibracaoService.calibrar` salva todas as respostas recebidas (`request.respostas().forEach(... respostaRepository.save ...)`, linha 103-108) e o método `pontuar`/`calcularMeta` processam genericamente qualquer pergunta do catálogo (peso e teto), não só as 4 obrigatórias. Não foi lido o arquivo `resources/calibracao/catalogo-v1.json` para confirmar se existe de fato uma pergunta de código "ESTRATEGIA" e se ela tem peso/teto associado; sem essa leitura, não é possível confirmar ou descartar o achado.

## 7. Áreas não auditadas (fora do orçamento desta análise)

Backend: `RequestLoggingFilter`, `JwtConfig`, `CustomJwtAuthenticationConverter`, `SecurityConfig` em detalhe, todos os `*Repository` (queries JPQL/nativas), `resources/calibracao/catalogo-v1.json`, suíte de testes (16 classes) não executada nesta passada.

Frontend: `hooks/useTimer.js` (lido só indiretamente via uso em `Execution`), `hooks/useHoldToIncrement.js`, `pages/Home/*`, `pages/Calibration/*`, `pages/CreateHabit/*` (todos os `steps/*`), `pages/Profile/*`, `pages/ChangePassword/*`, `pages/ForgotPassword/*`, `pages/Success/*`, `pages/Fail/*`, `pages/PreTask/*`, `contexts/CurrentHabitContext.jsx`, `contexts/ExecutionResultContext.jsx`, `contexts/SoundContext.jsx`, `contexts/ThemeToggleContext.jsx`, `utils/ocorrencias.js`, `utils/validacao.js`, todos os componentes de `components/common` e `components/layout` além dos já citados.

Recomenda-se tratar este relatório como um primeiro corte, priorizando os itens graves (B1 a B4) e depois validando os pontos da seção 6 com mais tempo de leitura.
