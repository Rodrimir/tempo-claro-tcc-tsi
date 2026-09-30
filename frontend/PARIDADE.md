# Checklist de Paridade — `mobile/` vs `frontend/`

Fonte: `README.md` da raiz, seções 7 e 8 (lidas em 2026-09-07, já corrigidas nesta mesma
sessão para refletir o estado atual do backend — ver nota ao fim do documento).

Este documento não implementa nada. É a régua que a tarefa M5.3 do
`PLANO_MIGRACAO_EXPO.md` vai usar para validar o APK contra o app web, hábito por hábito,
tela por tela.

---

## A) Os 14 fluxos ponta a ponta (§8.3)

| ☐ | Fluxo | Comportamento esperado |
|---|---|---|
| [ ] | 1. Login (`POST /auth/login`) | Valida email e senha não vazios; autentica via BCrypt + JWT no backend; grava o token; navega para `/home`. |
| [ ] | 2. Cadastro (`POST /auth/register`) | Valida nome, email, senha não vazios e `senha === confirmarSenha`; cria a conta, autentica automaticamente e navega para `/home`. |
| [ ] | 3. Verificação de token na inicialização | Ao montar, se há token salvo chama `getDashboard()` para validar; token ausente ou inválido cai em `/login` sem tela quebrada. |
| [ ] | 4. Home / Dashboard (`GET /dashboard`) | Carrossel horizontal de hábitos; avatar reativo por `diffMin` de `proximo_vencimento`; menu "⋮" no cartão com Editar e Arquivar; slide vazio no fim leva a `/create`. |
| [ ] | 5. Pré-Tarefa / Priming (`GET /habits/{id}/priming`) | Exibe nome do hábito, gatilho (se preenchido) e o texto motivacional da categoria; com `currentHabit` nulo, redireciona para `/home` sem renderizar. |
| [ ] | 6. Execução com timer (`POST /habits/{id}/executions`) | Cronômetro (tipo TEMPO) ou contador (tipo QUANTIDADE) conforme o hábito; compensa tempo em segundo plano; botão Concluir só aparece após estourar a meta; servidor recalcula bônus (RF22/RNF08); `execution_token` garante idempotência. |
| [ ] | 7. Desistência (`POST /habits/{id}/executions` tipo FAIL) | GiveUpModal oferece "Usar Escudo" só se `bloqueios_acumulados > 0`; `FAIL_BLOQUEIO` preserva `dias_seguidos`, `FAIL_TIMEOUT` zera. |
| [ ] | 8. Tela de Sucesso | Sem chamada à API; lê o resultado da execução; 50 partículas animadas; botão Voltar leva a `/home`. |
| [ ] | 9. Tela de Falha | Sem chamada à API; três apresentações por tipo (`FAIL_BLOQUEIO` âmbar/escudo, `FAIL_TIMEOUT` vermelho/relógio, `BLOCK_ACTIVE`); botão Continuar leva a `/home`. |
| [ ] | 10. Estatísticas (`GET /stats/weekly`) | Com `currentHabit` nulo, estado vazio pedindo para voltar à Home; senão, gráfico de 7 dias (barra por dia, dia parcial com cor distinta), recorde e percentual de constância semanal. |
| [ ] | 11. Loja / Compra de escudo (`POST /habits/{id}/shield`) | Compra por 1500 moedas; valida saldo; incrementa `bloqueios_acumulados`; toast de sucesso ou erro conforme saldo. |
| [ ] | 12. Perfil / Atualização (`PUT /profile`) | Atualiza nome, fuso horário e, se preenchida, a senha (valida a atual); reflete o nome novo no contexto de autenticação; toast de sucesso. |
| [ ] | 13. Criar/editar hábito (`POST /habits` ou `PUT /habits/{id}`) | Assistente de 3 passos + revisão; modo criar (novo) ou editar (a partir do menu da Home); validação campo a campo antes de avançar; limite de 2 hábitos ativos verificado só na criação. |
| [ ] | 14. Fechamento diário (job, sem origem no frontend) | Reseta execuções e o escudo diário por fuso do usuário; recalcula `proximo_vencimento` e `nivel_avatar`; aplica incremento de meta a cada N dias de ofensiva. |

---

## B) As 10 telas (§7.2)

| ☐ | Tela | Chamadas de API | Contexts consumidos | Navega para |
|---|---|---|---|---|
| [ ] | Login | `login()`, `register()` | Auth, ThemeToggle, Toast | `/home` ao autenticar |
| [ ] | Home | `getDashboard()`, `archiveHabit(id)` | CurrentHabit (**escreve**), ThemeToggle | `/create` pelo slide vazio ou pelo menu "Editar" |
| [ ] | PreTask | `getPreTaskPriming(id)` | CurrentHabit | `/execute` ou `/home` |
| [ ] | Execution | `submitExecution(id, payload)` | CurrentHabit, Toast | `/success` ou `/fail` |
| [ ] | Success | — (lê `ExecutionResultContext`) | ExecutionResult | `/home` |
| [ ] | Fail | — (lê `ExecutionResultContext`) | ExecutionResult | `/home` |
| [ ] | Stats | `getWeeklyStats(habitoId)` | CurrentHabit | não navega |
| [ ] | Store | `getDashboard()`, `buyShield(id)` | Toast | não navega |
| [ ] | Profile | `updateProfile(data)` | Auth, ThemeToggle, Toast | não navega — `logout()` leva ao `/login` pela guarda do `_layout` |
| [ ] | CreateHabit | `createHabit(data)` ou `updateHabit(id, data)` | Toast | `/home` após criar/salvar |

---

## C) Limitações que DEVEM ser preservadas (§11.1)

| ☐ | Limitação | Situação a preservar |
|---|---|---|
| [ ] | "Medir Dificuldade" | Segundo passo do assistente em CreateHabit: card estático "Calibração Automática — Em breve", não clicável. Preenchimento manual é o único caminho ativo. |
| [ ] | Seletor de idioma | Botão fixo "🇧🇷 PT" no Login e no Profile. Decorativo — não há i18n. |
| [ ] | Excluir conta | Não implementado em nenhuma camada. Não portar. |
| [ ] | `PwaPauseModal` | Removido do código web — `useTimer` já pausa/retoma sozinho via evento de visibilidade, sem prompt ao usuário. **Decisão: não portar** (M3.5). |
| [ ] | Consumo automático de escudo | O `FechamentoDiarioJob` ainda não consome escudo nem preserva `dias_seguidos` quando a meta do dia anterior não foi cumprida — só a desistência explícita (`FAIL_TIMEOUT`) zera a ofensiva hoje. |
| [ ] | Questionário de calibração | Tabelas `calibracoes`/`calibracao_respostas` reservadas no schema, sem código que as use. |
| [ ] | Ver nota abaixo | Três suposições do `PLANO_MIGRACAO_EXPO.md` sobre o estado do sistema ficaram desatualizadas — não preservar como limitação. |

> **Nota sobre a 7ª linha.** Entre a redação do `PLANO_MIGRACAO_EXPO.md` e a leitura desta
> tarefa, três dos itens que o plano cita como limitação a preservar já foram corrigidos no
> backend, dentro da mesma branch de trabalho (`PLANO_EXECUCAO.md`, tarefas E2.x/E4.2):
>
> - **"Dias da semana descartados no envio"** — não é mais verdade. `habitos` tem a coluna
>   `hab_frequencia_semanal`, o DTO tem o campo, e `CreateHabit` envia a máscara de verdade.
>   Ao portar M3.11, implemente o envio real — não descarte a seleção de propósito.
> - **"Sem tela de editar/arquivar"** — não é mais verdade. A Home tem um menu "⋮" com Editar
>   (reabre o assistente pré-preenchido) e Arquivar (soft delete com confirmação). M3.2 e
>   M3.11 devem portar esse menu como parte normal da tela, não como funcionalidade ausente.
> - **"Stats vazia" / `GET /stats/weekly` retorna `[]`** — não é mais verdade. `StatsService`
>   agrega `historico_execucoes` por dia e devolve `dias`, `recorde`,
>   `dias_com_meta_cumprida` e `constancia_semanal_percentual` reais. A M3.8 do
>   `PLANO_MIGRACAO_EXPO.md` parte da premissa antiga ("não implemente o endpoint, não
>   invente dado de exemplo") — ao chegar nessa tarefa, porte o gráfico com os dados reais
>   da API, não um estado vazio proposital.
>
> O `README.md` da raiz já foi corrigido para refletir isso (§3, §4.4, §6.4, §7.2, §7.6,
> §8.3 Fluxo 10, §11.1). Este `PARIDADE.md` reflete a versão corrigida, não o texto
> original do `PLANO_MIGRACAO_EXPO.md`.
