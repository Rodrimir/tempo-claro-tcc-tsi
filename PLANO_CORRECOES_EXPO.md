# Tempo Claro — Plano de Correções do App Expo

**Origem:** revisão do `mobile/` após a migração M0-M6.1 (`PLANO_MIGRACAO_EXPO.md`) e o primeiro teste em aparelho físico (09/09/2026)
**Branch:** `Expo-migration` — a mesma, continuando
**Alvo:** app Expo 100% funcional, pronto para a verificação de paridade (M5.3/M5.4, que continuam pendentes)

---

## Por que este plano existe

A migração foi verificada quase toda por **compilação** (`Metro Bundled, 0 erros`). Isso prova que o
código carrega — não que ele funciona. O primeiro teste real em aparelho derrubou o app na tela de
Perfil em segundos, com um bug que o bundler nunca teria pego.

Esta revisão foi feita de outro jeito: comparando `mobile/` contra `frontend/` linha a linha nos
pontos de risco, e **testando os contratos da API de verdade** contra o backend local (Docker +
Spring Boot no ar). O que está aqui foi confirmado, não suspeitado — exceto onde digo o contrário.

### O que já foi verificado e está CORRETO

Vale registrar para não se gastar tempo re-testando:

| Verificação | Resultado |
|---|---|
| `POST /auth/login` e `/auth/register` | ✅ funcionam do aparelho contra o backend local |
| `POST /habits/{id}/executions` (conclusão, sem `tipo`) | ✅ 200, credita moedas |
| Idempotência do `execution_token` | ✅ token repetido → 400 "Execução duplicada" |
| Desistência (`FAIL_TIMEOUT`) | ✅ 200, zera ofensiva |
| `POST /habits/{id}/shield` sem saldo | ✅ 400 "Saldo insuficiente" |
| `PUT /profile` + `GET /me` (snake_case, tema, fuso) | ✅ persiste corretamente |
| Multi-ocorrência (3x/dia, alvos 300/300/300) | ✅ 201, divide a meta certo |
| `LocalTime` na resposta (`"08:00:00"`) | ✅ `horaCurta()` corta certo para o modo edição |
| Rules of Hooks em todo o `mobile/src` | ✅ nenhuma violação |
| `console.log` esquecidos | ✅ nenhum |
| `backend/` e `frontend/` intocados | ✅ zero alterações |

---

# ETAPA C0 — Bloqueadores (o app está visivelmente quebrado sem isto)

### ☐ C0.1 — Recarregar dados ao focar a tela `M` ⭐⭐

**Por quê:** este é o mais grave, e afeta o ciclo central do produto. No `frontend/` web, o
React Router **desmonta e remonta** a página a cada navegação, então `useEffect(..., [])` refazia o
`GET /dashboard` toda vez. Em React Navigation (as abas do expo-router), a tela **fica montada** depois
da primeira visita — o `useEffect` nunca roda de novo. Não existe nenhum `useFocusEffect` em todo o
`mobile/src` (confirmado por varredura).

Consequência prática, toda vez:

- criar um hábito → `router.replace('/home')` → **o hábito novo não aparece no carrossel**
  (isto é exatamente o Aceite da M3.11, que portanto está falhando)
- concluir uma execução → Success → Home → **moedas, ofensiva e "X de Y hoje" continuam os antigos**
- arquivar um hábito pela Home → a lista recarrega (essa chama `loadData()` na mão) mas a Loja não
- comprar um escudo na Loja → a Home continua mostrando a contagem antiga de escudos

O `LocalHeader` lê `currentHabit` do context, que a Home popula — então o cabeçalho fica errado junto.

**▶ Prompt**

```
Em mobile/, faça as telas de aba recarregarem seus dados ao ganharem foco:

1. Home (src/pages/Home/index.jsx): trocar o useEffect que chama loadData()
   por useFocusEffect(useCallback(() => { loadData(); }, [loadData]))
   — importar useFocusEffect de 'expo-router'
2. Store (src/pages/Store/index.jsx): mesmo tratamento para loadHabits()
3. Stats (src/pages/Stats/index.jsx): mesmo tratamento para loadStats()
   — cuidado: loadStats já depende de `habit`; manter essa dependência

NÃO usar useFocusEffect no Profile: getMe() no mount basta, e refazer a cada
foco atrapalharia um formulário meio preenchido (o usuário pode sair pra Loja
e voltar). Justificar essa exceção no CLAUDE.md.

Atenção ao loop infinito: useFocusEffect exige que o callback seja estável
(useCallback). loadData/loadHabits/loadStats já são useCallback — confirmar
que as dependências deles não mudam a cada render antes de ligar.
```

**Aceite:** criar um hábito faz ele aparecer no carrossel da Home sem fechar o app; concluir uma
execução atualiza moedas e ofensiva na Home ao voltar; comprar escudo na Loja reflete na Home.

---

Concluído (código; comportamento a confirmar em aparelho na C2)

---

### ☐ C0.2 — Estado obsoleto do CreateHabit `S` ⭐⭐

**Por quê:** mesma raiz da C0.1 (a aba não desmonta), mas o sintoma é diferente e pior, porque
envolve `useState` com inicializador — que roda **uma única vez por montagem**:

```js
const [editHabit] = useState(() => (modo === 'editar' ? currentHabit : null));
const [step, setStep] = useState(isEditMode ? 3 : 1);
const [formData, setFormData] = useState(() => formDataInicial(editHabit, moldeInicial));
```

Sequência que quebra: usuário edita um hábito (`/create?modo=editar`) → volta → toca no slide "+"
para criar um novo → **a tela ainda está em modo de edição**, com o formulário preenchido com o
hábito anterior e o título dizendo "Editar Hábito". Salvar ali faz `PUT` no hábito velho em vez de
`POST` de um novo.

Mesmo sem passar por edição: criar um hábito e voltar para criar outro mostra o formulário
com os dados do anterior ainda preenchidos.

**▶ Prompt**

```
Em mobile/src/pages/CreateHabit/index.jsx, fazer a tela reinicializar a cada
entrada. Duas alternativas — escolher UMA e justificar no CLAUDE.md:

(a) useFocusEffect que reseta step/molde/formData/errors/editHabit a partir
    do `modo` atual dos params. Mais explícito, mas são 5 estados para
    ressincronizar sem esquecer nenhum.

(b) DESCARTADA — tirar `create` do grupo (tabs) resolveria a classe inteira
    do problema, mas a tela perderia a barra inferior. Verificado em
    frontend/src/routes/index.jsx: /create está DENTRO do MainLayout, ou
    seja, mostra a BottomNav no web. Mover quebraria paridade visual.
    Fica registrado só para não ser reconsiderado depois sem esse dado.

Verificar também se `modo=editar` fica preso nos params depois de uma
edição — se ficar, limpar ao sair da tela.
```

**Aceite:** editar um hábito, voltar e tocar em "+" abre o assistente limpo no Passo 1 dizendo
"Novo Hábito"; criar dois hábitos seguidos não reaproveita nada do formulário anterior.

---

Concluído (código; comportamento a confirmar em aparelho na C2)

---

### ☐ C0.3 — Campo de horário aceita formato que a API rejeita `S` ⭐

**Por quê:** **regressão introduzida pela migração**, não herdada. O `frontend/` usa
`<input type="time">`, que o navegador garante entregar como `"HH:MM"` ou vazio. Na M3.11 troquei
por um `TextInput` de texto livre (não havia lib de picker na lista de dependências do plano), e
não validei o formato.

Confirmado contra o backend local:

| Valor digitado | Resultado |
|---|---|
| `""` (vazio) | ✅ 201 — backend aceita e usa o default 23:59 |
| `"08:00"` | ✅ 201 |
| `"8:00"` | ❌ **400** `"Corpo da requisição inválido ou malformado."` |
| `"25:99"` | ❌ **400** — mesma mensagem |

A mensagem é genérica: não diz qual campo está errado. O usuário digita "8:00", leva um erro
incompreensível e não tem como adivinhar que faltou um zero. Pior no caso de mais de 1x/dia, onde
`validarFormulario` **exige** o horário de cada ocorrência — o usuário é obrigado a digitar.

**▶ Prompt**

```
Em mobile/src/pages/CreateHabit/index.jsx, garantir que só sai "HH:MM" válido:

1. Em validarFormulario, validar formato com regex ^([01]\d|2[0-3]):[0-5]\d$
   para formData.horario (quando preenchido) e para cada
   ocorrencias[i].horario_inicio / horario_fim (quando preenchidos).
   Mensagem no padrão das outras: "Use o formato HH:MM (ex.: 08:00)."
2. Máscara ao digitar: inserir ":" automaticamente após 2 dígitos e aceitar
   só dígitos, para o caminho feliz não depender do usuário lembrar.
3. keyboardType="number-pad" nesses campos.

NÃO trocar por uma lib de date picker sem falar comigo antes — isso é
dependência nova, fora do que o plano de migração autorizou.
```

**Aceite:** digitar "8:00" mostra erro no próprio campo antes de enviar; "08:00" salva normalmente;
o caso de 3x/dia com os três horários preenchidos cria o hábito com os alvos divididos corretamente.

---

Concluído (código; comportamento a confirmar em aparelho na C2)

---

### ☐ C0.4 — Commitar e verificar o fix do crash do Perfil `XS`

**Por quê:** o crash que você encontrou no aparelho (`Cyclic dependency, node was:"novaSenha"`,
FATAL EXCEPTION, app fechou) foi corrigido, mas **o fix está sem commit** e **nunca foi visto
funcionando em aparelho** — o celular foi desconectado antes de eu reinstalar o APK reconstruído.

Causa: em `Profile/validation.js` eu escrevi `senhaAtual.when('novaSenha')` **e**
`novaSenha.when('senhaAtual')`. O Yup monta um grafo de dependências entre campos e um ciclo A→B→A
não tem ordem de resolução possível — ele lança na montagem da tela. Trocado por `.test()` com
`this.parent`, que lê o valor irmão sem declarar dependência.

O fix já foi verificado **em isolamento** (script Node contra o Yup instalado, 6 casos):

```
OK | só nome (sem senha)        -> passou
OK | senhaAtual sem novaSenha   -> bloqueou: Preencha a nova senha para concluir a alteração.
OK | novaSenha sem senhaAtual   -> bloqueou: Informe a senha atual para alterar a senha.
OK | nova senha curta           -> bloqueou: A nova senha deve ter pelo menos 8 caracteres.
OK | confirmação não bate       -> bloqueou: A confirmação não corresponde à nova senha.
OK | troca válida               -> passou
```

Falta só ver a tela abrindo no aparelho.

**▶ Prompt**

```
1. Commitar mobile/src/pages/Profile/validation.js (fix da dependência
   circular do Yup)
2. Reinstalar o APK já construído e abrir a aba Perfil
3. Testar: salvar só o nome; tentar trocar senha preenchendo só um campo;
   trocar senha corretamente
```

**Aceite:** a aba Perfil abre sem fechar o app, e as 4 regras de validação de senha aparecem como
erro inline no campo certo.

---

Concluído parcialmente — fix commitado (59b7e23b) e verificado em isolamento (6 casos no Yup).
Falta abrir a tela em aparelho; entra no lote da C2.

---

# ETAPA C1 — Acabamento (não bloqueiam, mas contam na banca)

### ☐ C1.1 — Toast sob a barra de status `XS`

**Por quê:** a M4.2 aplicou safe area em todas as telas, mas passou o Toast:
`components/common/Toast/styles.js` tem `position: absolute; top: 24px` fixo. Num aparelho com
notch/recorte, o toast aparece parcialmente sob a barra de status.

**▶ Prompt**

```
ToastContainer deve somar useSafeAreaInsets().top ao top de 24px, igual ao
que LocalHeader/Login/PreTask já fazem desde a M4.2. O ToastProvider fica
dentro do SafeAreaProvider, então o hook está disponível.
```

**Aceite:** toast aparece inteiro abaixo da barra de status no aparelho com recorte.

---

Concluído (código; comportamento a confirmar em aparelho na C2)

---

### ☐ C1.2 — Decidir sobre os 5 comentários restantes `XS`

**Por quê:** sua regra foi "nunca deixe comentários no código". Sobraram 5, todos
`// eslint-disable-next-line react-hooks/exhaustive-deps`:

```
contexts/ThemeToggleContext.jsx:44   pages/Execution/index.jsx:114
pages/Profile/index.jsx:80           pages/Success/index.jsx:56
hooks/useTimer.js:108
```

Não são comentários explicativos — são **diretivas funcionais** que suprimem um warning do linter.
Removê-los reintroduz os warnings sem mudar comportamento. O `frontend/` tem os mesmos.
**Decisão sua**, não minha.

**Aceite:** decisão registrada (manter ou remover), aplicada uniformemente.

---

Concluído — decisão: MANTER. Registrada em `mobile/CLAUDE.md` com a distinção entre
diretiva funcional e comentário explicativo.

---

### ☐ C1.3 — `--warning-light` não existe (achado no `frontend/`, não no `mobile/`) `XS`

**Por quê:** `frontend/src/components/layout/LocalHeader/styles.js` usa `var(--warning-light)`, que
**não é definida em lugar nenhum** — nem em `theme.js`, nem em `GlobalStyles.js`. O fundo do
indicador de moedas é transparente no app web hoje, não o amarelo pastel pretendido. Portei
fielmente (`theme.warningLight`, também `undefined`), preservando o defeito conforme a regra de
paridade.

**Isto é escopo do `PLANO_EXECUCAO.md`, não deste plano** — corrigir aqui significa corrigir nas
duas bases ou dessincronizá-las. Fica registrado para não se perder.

---

# ETAPA C2 — Retomar a verificação de paridade

Com C0 fechada, voltam a fazer sentido as duas tarefas que ficaram pendentes na migração:

### ☐ C2.1 — M5.3: os 14 fluxos no aparelho `M` ⭐

Usar `mobile/PARIDADE.md` (tabela A). Os cuidados que só aparecem no aparelho continuam valendo:
segundo plano no meio do cronômetro, bloquear a tela e voltar, desistir com e sem escudo, virada
do dia.

**Ponto de atenção novo:** o `useTimer` foi reescrito com deadline absoluto + `AppState` (M3.4) e
**nunca foi exercitado em runtime** — nem o caso de o Android matar o processo em segundo plano.
É o componente mais complexo da migração e o menos verificado. Testar com atenção redobrada.

### ☐ C2.2 — M5.4: comparação lado a lado `S`

20 capturas (10 telas × 2 apps). O `android.package` do Expo tem sufixo `.expo` justamente para os
dois conviverem no aparelho.

---

## Como testar com o backend local

O APK atual foi construído apontando para `http://192.168.1.106:8082/api` (backend local), porque
a API de produção no Render está fora do ar (timeout de 60s, confirmado). Para reconstruir:

```bash
# 1. banco + backend
docker start postgres_db
cd backend && ./gradlew bootRun          # porta 8082

# 2. conferir o IP da máquina (muda de rede para rede!)
ip -4 addr show | grep "inet " | grep -v 127.0.0.1

# 3. se o IP mudou, atualizar a exceção de cleartext:
#    mobile/android/app/src/main/res/xml/network_security_config.xml

# 4. reconstruir SEMPRE com --rerun-tasks
cd mobile/android
EXPO_PUBLIC_API_URL="http://<IP>:8082/api" ./gradlew assembleRelease --rerun-tasks

# 5. conferir que a URL entrou mesmo no bundle antes de instalar
strings app/build/outputs/apk/release/app-release.apk | grep -c "<IP>:8082"

adb install -r app/build/outputs/apk/release/app-release.apk
```

**Por que `--rerun-tasks` não é opcional:** o Gradle não trata variável de ambiente como entrada de
cache. Sem essa flag ele marca a tarefa de empacotar o JS como *up-to-date* e **mantém o bundle
antigo**, com a URL antiga embutida — foi exatamente o que aconteceu no primeiro teste e custou um
ciclo inteiro de depuração. O passo 5 existe para nunca mais confiar nisso sem conferir.

**Antes do APK final da banca:** reverter `android.package` para `com.rodrigo.tempoclaro` (sem
`.expo`), remover o `network_security_config.xml` e voltar a apontar para o Render.

---

## Painel

| Etapa | Tarefas | Esforço | O que destrava |
|---|---|---|---|
| **C0** | 4 | M | App utilizável de ponta a ponta |
| **C1** | 3 | XS | Acabamento e decisões pendentes |
| **C2** | 2 | M | Paridade comprovada (M5.3/M5.4 da migração) |

**Ordem:** C0.4 primeiro (é só commitar + verificar, e destrava a tela de Perfil para os testes),
depois C0.1 (a mais grave), C0.2, C0.3. C1 e C2 em seguida.

**A lição que atravessa este plano:** compilar não é funcionar. As três correções da C0 são bugs
que **nenhuma verificação de bundle pegaria** — precisam de tela aberta e dedo na tela. A C2 só é
honesta se for feita assim.
