# Tempo Claro — TCC · TSI · IFSul Pelotas

## 1. Informações Acadêmicas

| Campo | Valor |
|---|---|
| **Instituição** | Instituto Federal Sul-rio-grandense (IFSul) — Campus Pelotas |
| **Curso** | Tecnologia em Sistemas para Internet (TSI) |
| **Semestre** | 2026/1 |
| **Aluno** | Rodrigo Miranda da Silva |
| **GitHub** | https://github.com/Rodrimir |
| **Site de Referência** | www.monzai.com.br |
| **Status** | Primeira versão em produção — testes fechados |

---

## 2. Arquitetura e Infraestrutura

O sistema é composto por três camadas independentes:

| Camada | Tecnologia | Hospedagem |
|---|---|---|
| **Frontend** | React + Vite + CapacitorJS (Android) | Vercel |
| **Backend** | Java 17 + Spring Boot 3 + Docker | Render |
| **Banco de Dados** | PostgreSQL | Neon Postgres (AWS) |

**URL de Produção da API:** `https://tempo-claro-tcc-tsi.onrender.com/api`

---

## 3. Mapa de Diretórios

```
/
├── backend/
│   ├── src/main/java/com/rodrigo/backend2java/
│   │   ├── config/
│   │   │   ├── JwtFilter.java          # Filtro JWT por requisição
│   │   │   ├── JwtService.java         # Geração e validação de tokens
│   │   │   └── SecurityConfig.java     # Cadeia de segurança Spring Security
│   │   ├── controller/
│   │   │   ├── AuthController.java     # POST /auth/login  POST /auth/register
│   │   │   ├── HabitoController.java   # CRUD /habits  GET /dashboard
│   │   │   ├── ProfileController.java  # PUT /profile
│   │   │   └── StatsController.java    # GET /stats/weekly
│   │   ├── exception/
│   │   │   └── GlobalExceptionHandler.java
│   │   ├── model/
│   │   │   ├── Habito.java
│   │   │   ├── HistoricoExecucao.java
│   │   │   ├── StatusHabito.java
│   │   │   ├── Usuario.java
│   │   │   ├── dto/request/
│   │   │   │   ├── ExecutionRequestDTO.java
│   │   │   │   ├── HabitoRequestDTO.java
│   │   │   │   ├── LoginRequestDTO.java
│   │   │   │   ├── ProfileUpdateDTO.java
│   │   │   │   └── RegisterRequestDTO.java
│   │   │   └── dto/response/
│   │   │       ├── AuthResponseDTO.java
│   │   │       ├── ExecutionResponseDTO.java
│   │   │       ├── HabitoResponseDTO.java
│   │   │       ├── MessageResponseDTO.java
│   │   │       └── PrimingResponseDTO.java
│   │   ├── repository/
│   │   │   ├── BibliotecaTextoRepository.java
│   │   │   ├── HabitoRepository.java
│   │   │   ├── HistoricoExecucaoRepository.java
│   │   │   ├── StatusHabitoRepository.java
│   │   │   └── UsuarioRepository.java
│   │   └── service/
│   │       ├── AuthService.java        # Login e cadastro
│   │       ├── GamificacaoService.java # Priming, execução, escudo
│   │       ├── HabitoService.java      # CRUD de hábitos
│   │       └── UsuarioService.java     # Atualização de perfil
│   ├── src/main/resources/
│   │   ├── application.properties      # Configuração local (H2 em memória)
│   │   ├── application-prod.properties # Configuração de produção (PostgreSQL)
│   │   └── schema.sql                  # DDL das tabelas
│   ├── compose.yaml                    # Docker Compose (postgres + app + pgadmin)
│   ├── Dockerfile
│   └── build.gradle
│
└── frontend/
    ├── src/
    │   ├── assets/                     # Imagens (gotinha, sol, lua)
    │   ├── components/
    │   │   ├── common/
    │   │   │   ├── CircularProgress/   # Barra circular para hábitos de quantidade
    │   │   │   ├── GiveUpModal/        # Modal de desistência
    │   │   │   ├── LoadingScreen/      # Tela de carregamento
    │   │   │   ├── MonospaceTimer/     # Contador de tempo na execução
    │   │   │   ├── PwaPauseModal/      # Modal quando app é pausado em 2º plano
    │   │   │   └── Toast/              # Notificações em sobreposição
    │   │   └── layout/
    │   │       ├── BottomNav/          # Barra de navegação inferior
    │   │       └── LocalHeader/        # Cabeçalho de telas internas
    │   ├── contexts/
    │   │   ├── AuthContext.jsx         # Estado global de autenticação
    │   │   ├── CurrentHabitContext.jsx # Hábito selecionado no carrossel
    │   │   ├── ThemeToggleContext.jsx  # Tema claro/escuro
    │   │   └── ToastContext.jsx        # Fila de notificações toast
    │   ├── hooks/
    │   │   └── useTimer.js             # Hook do cronômetro regressivo
    │   ├── layouts/
    │   │   └── MainLayout/             # Layout com BottomNav para rotas protegidas
    │   ├── pages/
    │   │   ├── CreateHabit/            # Wizard de 3 etapas para criar hábito
    │   │   ├── Execution/              # Tela de execução (timer ou quantidade)
    │   │   ├── Fail/                   # Tela de falha/desistência
    │   │   ├── Home/                   # Dashboard com carrossel de hábitos
    │   │   ├── Login/                  # Login e cadastro
    │   │   ├── PreTask/                # Texto motivacional pré-execução
    │   │   ├── Profile/                # Dados do usuário e configurações
    │   │   ├── Stats/                  # Gráfico e métricas semanais
    │   │   ├── Store/                  # Compra de escudos protetores
    │   │   └── Success/                # Tela de conclusão bem-sucedida
    │   ├── routes/
    │   │   └── index.jsx               # Rotas e ProtectedRoute
    │   ├── services/
    │   │   ├── api.js                  # Instância Axios + interceptores + endpoints
    │   │   └── authService.js          # Validações de formulário de login/cadastro
    │   ├── styles/
    │   │   ├── GlobalStyles.js
    │   │   └── theme.js
    │   ├── utils/
    │   │   └── storage.js              # Encrypt/decrypt LocalStorage (CryptoJS AES)
    │   ├── App.jsx                     # ThemeProvider root
    │   └── main.jsx                    # Entry point com todos os Providers
    ├── capacitor.config.json
    └── package.json
```

---

## 4. Banco de Dados — DDL Completo

```sql
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    fuso_horario VARCHAR(50),
    preferencia_idioma VARCHAR(50),
    criado_em TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS habitos (
    id UUID PRIMARY KEY,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    categoria VARCHAR(100),           -- AGUA | ESTUDAR | EXERCICIO
    gatilho_ancora VARCHAR(255),
    tipo_medida VARCHAR(50),          -- TEMPO | QUANTIDADE
    modalidade VARCHAR(50),           -- DIARIA
    horario_agendado TIME,
    meta_base INT,                    -- segundos (TEMPO) ou unidades (QUANTIDADE)
    meta_frequencia_diaria INT,
    intervalo_minutos INT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS biblioteca_textos (
    id UUID PRIMARY KEY,
    categoria VARCHAR(100),
    idioma VARCHAR(50),
    texto_pre_tarefa TEXT,
    texto_sucesso_padrao TEXT,
    texto_sucesso_extra TEXT,
    texto_aviso_urgencia TEXT
);

CREATE TABLE IF NOT EXISTS historico_execucoes (
    id UUID PRIMARY KEY,
    habito_id UUID NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    execution_token UUID UNIQUE,      -- idempotência de submissão dupla
    data_hora_execucao TIMESTAMP WITH TIME ZONE,
    valor_realizado INT,
    moedas_ganhas INT,
    tipo_sucesso VARCHAR(100)         -- COMPLETE_PADRAO | COMPLETE_EXTRA | FAIL_TIMEOUT | FAIL_BLOQUEIO
);

CREATE TABLE IF NOT EXISTS status_habitos (
    habito_id UUID PRIMARY KEY REFERENCES habitos(id) ON DELETE CASCADE,
    moedas_locais INT,
    bloqueios_acumulados INT,
    dias_seguidos INT,
    execucoes_hoje INT,
    proximo_vencimento TIMESTAMP WITH TIME ZONE,
    bloqueio_usado_hoje BOOLEAN
);
```

---


## 5. Pré-requisitos e Execução Local

**Ferramentas necessárias:**
- JDK 17+
- Node.js 20+ e NPM
- Android Studio (apenas para APK)

**1. Backend (Spring Boot + H2 em memória):**
```bash
cd backend
# Windows:
.\gradlew bootRun
# Linux/Mac:
./gradlew bootRun
```
API disponível em `http://localhost:8082`
Console H2 em `http://localhost:8082/h2-console`

**2. Frontend (React + Vite):**
```bash
cd frontend
npm install
npm run dev
```
App disponível em `http://localhost:5173`

**3. APK Android:**
```bash
cd frontend
npm run build
npx cap sync android
```
Após a sincronização, abrir `frontend/android/` no Android Studio e gerar o APK via `Build > Build APK(s)`.


## 5.1. Backend — Contratos Completos da API

Todas as rotas exceto `/auth/**` exigem:

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

### 5.2. Autenticação

#### POST /auth/register — Cadastro de novo usuário

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "nome": "Rodrigo Miranda",
  "email": "rodrigo@ifsul.edu.br",
  "password": "SenhaSegura123!"
}
```

**Response 201 Created:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJyb2RyaWdvQGlmc3VsLmVkdS5iciIsImlhdCI6...",
  "user": {
    "name": "Rodrigo Miranda",
    "email": "rodrigo@ifsul.edu.br"
  }
}
```

**Response 401 Unauthorized (e-mail já cadastrado):**
```json
{ "success": false, "message": "E-mail já está em uso" }
```

---

#### POST /auth/login — Login

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "rodrigo@ifsul.edu.br",
  "password": "SenhaSegura123!"
}
```

**Response 200 OK:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": {
    "name": "Rodrigo Miranda",
    "email": "rodrigo@ifsul.edu.br"
  }
}
```

**Response 401 Unauthorized (credenciais inválidas):**
```json
{ "success": false, "message": "Erro credenciais invalidas!" }
```

---

### 5.3. Hábitos

#### GET /dashboard — Lista todos os hábitos ativos do usuário

**Request:**
```http
GET /api/dashboard
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Response 200 OK:**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "titulo": "Beber Água",
    "categoria": "AGUA",
    "tipo_medida": "QUANTIDADE",
    "modalidade": "DIARIA",
    "horario_agendado": "08:00:00",
    "meta_base": 250,
    "meta_frequencia_diaria": 1,
    "intervalo_minutos": null,
    "ativo": true,
    "moedas_locais": 1200,
    "bloqueios_acumulados": 1,
    "dias_seguidos": 7,
    "execucoes_hoje": 0,
    "proximo_vencimento": "2026-06-22T23:59:00Z",
    "bloqueio_usado_hoje": false
  }
]
```

**Campos do status que determinam o comportamento no frontend:**

| Campo | Tipo | Uso no frontend |
|---|---|---|
| `status` (derivado) | string | "COMPLETED" quando `execucoes_hoje >= meta_frequencia_diaria` |
| `proximo_vencimento` | OffsetDateTime | Calcula `diffMin` para expressão do avatar |
| `dias_seguidos` | int | Exibido na tela Stats e no nível do avatar |
| `moedas_locais` | int | Exibido na Loja |
| `bloqueios_acumulados` | int | Exibido no GiveUpModal e na Loja |

---

#### POST /habits — Criar novo hábito

**Request:**
```http
POST /api/habits
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "titulo": "Gotinha",
  "categoria": "AGUA",
  "tipo_medida": "QUANTIDADE",
  "modalidade": "DIARIA",
  "meta_base": 250,
  "aumento_dezena": 50,
  "meta_maxima": 500,
  "frequencia_semanal": [1, 2, 3, 4, 5],
  "meta_frequencia_diaria": 1,
  "horario_agendado": "08:00:00"
}
```

**Response 201 Created:** objeto `HabitoResponseDTO` completo (mesmo formato do dashboard).

**Response 400 Bad Request (limite atingido):**
```json
{ "success": false, "message": "Limite de 5 hábitos ativos atingido" }
```

---

#### PUT /habits/{id} — Atualizar hábito

**Request:**
```http
PUT /api/habits/3fa85f64-5717-4562-b3fc-2c963f66afa6
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "titulo": "Gotinha Atualizada",
  "meta_base": 300,
  "tipo_medida": "QUANTIDADE",
  "modalidade": "DIARIA"
}
```

**Response 200 OK:**
```json
{ "success": true }
```

---

#### DELETE /habits/{id} — Arquivar hábito (soft delete)

**Request:**
```http
DELETE /api/habits/3fa85f64-5717-4562-b3fc-2c963f66afa6
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Response 200 OK:**
```json
{ "success": true }
```

---

### 5.4. Gamificação

#### GET /habits/{id}/priming — Texto motivacional pré-tarefa

**Request:**
```http
GET /api/habits/3fa85f64-5717-4562-b3fc-2c963f66afa6/priming
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Response 200 OK:**
```json
{
  "texto": "Cada copo de água é um passo em direção à saúde plena."
}
```

---

#### POST /habits/{id}/executions — Registrar execução de hábito

**Request (conclusão padrão — timer):**
```http
POST /api/habits/3fa85f64-5717-4562-b3fc-2c963f66afa6/executions
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "execution_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tipo": "COMPLETE_PADRAO",
  "valor_realizado": 1500
}
```

**Request (conclusão extra — ultrapassou 20% da meta):**
```json
{
  "execution_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tipo": "COMPLETE_EXTRA",
  "valor_realizado": 1900
}
```

**Request (desistência voluntária):**
```json
{
  "execution_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tipo": "FAIL_BLOQUEIO",
  "valor_realizado": 720
}
```

**Request (timeout por abandono):**
```json
{
  "execution_token": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "tipo": "FAIL_TIMEOUT",
  "valor_realizado": 0
}
```

**Valores aceitos em `tipo`:**

| Valor | Moedas | Efeito em `dias_seguidos` |
|---|---|---|
| `COMPLETE_PADRAO` | +100 | +1 (somente quando meta diária é atingida exatamente) |
| `COMPLETE_EXTRA` | +150 | +1 (somente quando meta diária é atingida exatamente) |
| `FAIL_TIMEOUT` | 0 | reset para 0 |
| `FAIL_BLOQUEIO` | 0 | reset para 0 |

**Response 200 OK:**
```json
{
  "moedas_ganhas": 100,
  "moedas_totais": 1300,
  "dias_seguidos": 8,
  "novo_nivel": 8,
  "texto_feedback": "Execução registrada!"
}
```

---

#### POST /habits/{id}/shield — Comprar escudo protetor

**Request:**
```http
POST /api/habits/3fa85f64-5717-4562-b3fc-2c963f66afa6/shield
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Response 200 OK:**
```json
{ "success": true, "message": "Escudo comprado!" }
```

**Response 400 Bad Request (saldo insuficiente):**
```json
{ "success": false, "message": "Saldo insuficiente" }
```

---

### 5.5. Perfil e Estatísticas

#### PUT /profile — Atualizar dados do perfil

**Request (apenas nome e fuso):**
```http
PUT /api/profile
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "nome": "Rodrigo Atualizado",
  "fusoHorario": "America/Sao_Paulo"
}
```

**Request (incluindo troca de senha):**
```json
{
  "nome": "Rodrigo",
  "fusoHorario": "America/Sao_Paulo",
  "senhaAtual": "SenhaAntiga123!",
  "novaSenha": "SenhaNova456!"
}
```

**Response 200 OK:**
```json
{ "success": true }
```

---

#### GET /stats/weekly — Estatísticas semanais

**Request:**
```http
GET /api/stats/weekly
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9...
```

**Response 200 OK:**
```json
[]
```
> Agregação de dados históricos pendente para versão 2.0. O endpoint existe e retorna array vazio.

---

## 6. Frontend — Componentes e Funções Interativas

### 6.1. Contexts (Estado Global)

| Context | Estado Exposto | Funções Expostas |
|---|---|---|
| `AuthContext` | `isAuthenticated`, `loading` | `login(data)`, `register(data)`, `logout()` |
| `CurrentHabitContext` | `currentHabit` | `setCurrentHabit(habit)` |
| `ThemeToggleContext` | `isDark` | `toggleTheme()` |
| `ToastContext` | — | `addToast(message, type, duration)` |

### 6.2. Hooks

#### `useTimer(initialSeconds, habitId, executionToken, isTimer)`

| Retorno | Tipo | Descrição |
|---|---|---|
| `timeLeft` | number | Segundos restantes |
| `overachieveTime` | number | Segundos após zerar a meta |
| `isOverachieving` | boolean | Se o timer passou do zero |
| `isRunning` | boolean | Se o timer está ativo |
| `elapsed` | number | Total de segundos executados |
| `pause()` | function | Para o timer e salva estado no localStorage |
| `resume()` | function | Retoma do localStorage compensando o tempo passado |
| `start()` | function | Inicia o timer |
| `stop()` | function | Para e limpa o estado |
| `clearTimerState()` | function | Remove estado salvo do localStorage |

### 6.3. Serviços (`services/api.js`)

| Função | Método HTTP | Endpoint |
|---|---|---|
| `login(data)` | POST | `/auth/login` |
| `register(data)` | POST | `/auth/register` |
| `getDashboard()` | GET | `/dashboard` |
| `createHabit(data)` | POST | `/habits` |
| `updateHabit(id, data)` | PUT | `/habits/{id}` |
| `archiveHabit(id)` | DELETE | `/habits/{id}` |
| `getPreTaskPriming(id)` | GET | `/habits/{id}/priming` |
| `submitExecution(id, payload)` | POST | `/habits/{id}/executions` |
| `buyShield(id)` | POST | `/habits/{id}/shield` |
| `updateProfile(data)` | PUT | `/profile` |
| `getWeeklyStats()` | GET | `/stats/weekly` |

### 6.4. Utilitários (`utils/storage.js`)

| Função | Descrição |
|---|---|
| `setAuthToken(token)` | Encripta o JWT com AES (CryptoJS) e salva em `localStorage['tempoClaro_token']` |
| `getAuthToken()` | Lê e decripta o JWT do localStorage |
| `clearAuthToken()` | Remove o JWT do localStorage |
| `saveExecutionState(habitId, token, elapsed, startedAt)` | Salva estado do timer encriptado em `localStorage['tempoClaro_exec_{habitId}']` |
| `loadExecutionState(habitId)` | Lê e decripta o estado do timer |
| `clearExecutionState(habitId)` | Remove o estado do timer do localStorage |
| `isWithinTolerance(lastTimestamp)` | Retorna `true` se o timestamp é menor que 1 hora atrás |

---

## 7. Fluxos de Dados Detalhados

> Cada passo corresponde a uma marcação `// @audit-ok [FUNCIONALIDADE (N)]` no código-fonte.

---

### FLUXO 1 — Login (`POST /auth/login`)

```
Login.jsx (1)
  → handleSubmit (2)
    → useLogin.executeAuth(isLoginTab=true, formData) (3)
      → authService.validateLogin(data) — valida email e senha não vazios (4)
      → AuthContext.login(data) (5)
        → monta payload: { email, password: data.senha } (6)
        → api.js: POST /auth/login (7)
          → [Backend] JwtFilter — endpoint /auth/** é público, passa direto (8)
          → [Backend] AuthController.login() (9)
          → [Backend] AuthService.autenticar() (10)
            → UsuarioRepository.findByEmail() (11)
            → BCrypt.matches(password, senhaHash) (12)
            → JwtService.generateToken(email) (13)
          → Response: { token, user: { name, email } } (14)
        → storage.setAuthToken(token) — AES encrypt → localStorage (15)
        → setIsAuthenticated(true) (16)
  → navigate('/home') (17)
```

**Payload enviado para a API:**
```json
{ "email": "rodrigo@ifsul.edu.br", "password": "SenhaSegura123!" }
```

**Resposta recebida:**
```json
{ "token": "eyJhbGci...", "user": { "name": "Rodrigo Miranda", "email": "rodrigo@ifsul.edu.br" } }
```

**localStorage após login:**
```
tempoClaro_token → "U2FsdGVkX1+abc123..." (AES ciphertext do JWT)
```

---

### FLUXO 2 — Cadastro (`POST /auth/register`)

```
Login.jsx — aba "Criar Conta" (1)
  → handleSubmit (2)
    → useLogin.executeAuth(isLoginTab=false, formData) (3)
      → authService.validateRegister(data) (4)
        → valida nome, email, senha não vazios
        → valida senha === confirmarSenha
      → AuthContext.register(data) (5)
        → monta payload: { nome, email, password: data.senha } (6)
        → api.js: POST /auth/register (7)
          → [Backend] JwtFilter — público, passa direto (8)
          → [Backend] AuthController.register() (9)
          → [Backend] AuthService.cadastrar() (10)
            → UsuarioRepository.existsByEmail() — verifica duplicidade (11)
            → BCrypt.encode(password) — hash da senha (12)
            → UsuarioRepository.save(novoUsuario) (13)
            → JwtService.generateToken(email) (14)
          → Response: { token, user } (15)
        → storage.setAuthToken(token) (16)
        → setIsAuthenticated(true) (17)
  → navigate('/home') (18)
```

---

### FLUXO 3 — Verificação de Token na Inicialização

```
main.jsx — monta AuthProvider (1)
  → AuthContext.useEffect() → verifyAuth() (2)
    → storage.getAuthToken() — AES decrypt do localStorage (3)
    → Se sem token: setIsAuthenticated(false) → setLoading(false) (4)
    → Se com token: api.getDashboard() para validar (5)
      → api.js — interceptor adiciona Authorization: Bearer token (6)
      → [Backend] JwtFilter.doFilterInternal() (7)
        → extrai JWT do header Authorization
        → JwtService.extractEmail(jwt) (8)
        → UsuarioRepository.existsByEmail() + JwtService.isTokenValid() (9)
        → SecurityContextHolder.setAuthentication() (10)
      → [Backend] HabitoController.getDashboard() — retorna 200 (11)
    → setIsAuthenticated(true) (12)
    → Se 401: interceptor de response → clearAuthToken() → redirect /login (13)
```

---

### FLUXO 4 — Home / Dashboard (`GET /dashboard`)

```
HomeScreen monta (1)
  → useEffect → loadData() (2)
    → api.getDashboard() (3)
      → interceptor adiciona Bearer token (4)
      → GET /api/dashboard (5)
        → [Backend] JwtFilter valida token (6)
        → [Backend] HabitoController.getDashboard() → email do SecurityContext (7)
        → [Backend] HabitoService.listarDashboard(email) (8)
          → HabitoRepository.findAllByUsuarioId() — WHERE ativo = true (9)
          → para cada hábito: StatusHabitoRepository.findById() (10)
          → mapeia para HabitoResponseDTO[] (11)
        → Response: array de HabitoResponseDTO (12)
    → sort: COMPLETED vai para o final, ordena por proximo_vencimento (13)
    → setLocalHabits(data) (14)
  → carrossel renderiza HabitSlide por hábito (15)
  → getAvatarExpression(habit) — calcula diffMin para expressão do avatar (16)
  → handleScroll → setActiveIndex → setCurrentHabit(localHabits[i]) (17)
```

**Expressões do avatar por `diffMin`:**

| Condição | Expressão | Avatar |
|---|---|---|
| `status === 'COMPLETED'` | feliz | imagem gotinha feliz / emoji ✨ |
| `diffMin > 120` | normal | imagem gotinha normal / emoji 🌱 |
| `0 < diffMin <= 120` | preocupado | emoji 😰 |
| `-60 <= diffMin <= 0` | desesperado | emoji 😱 |
| `diffMin < -60` | falha | emoji ☠️ |

---

### FLUXO 5 — Pré-Tarefa / Priming (`GET /habits/{id}/priming`)

```
BottomNav — botão Play pressionado (1)
  → handlePlay() (2)
    → se !activeHabit: addToast('Nenhum hábito selecionado', 'error') (3)
    → se isCompleted: addToast('Tarefa já concluída!', 'success') (4)
    → senão: navigate('/pretask') (5)
PreTask monta (6)
  → useEffect — se !currentHabit: navigate('/home') (7)
  → api.getPreTaskPriming(currentHabit.id) (8)
    → GET /api/habits/{id}/priming com Bearer token (9)
      → [Backend] HabitoController.getPriming(id) (10)
      → [Backend] GamificacaoService.obterPriming(id) (11)
        → HabitoRepository.findById() (12)
        → BibliotecaTextoRepository.findByCategoriaAndIdioma() (13)
        → fallback: "Concentre-se e respire fundo. Você consegue!" (14)
      → Response: { texto: "..." } (15)
  → setText(`"${res.data.texto}"`) (16)
  → botão ESTOU PRONTO → navigate('/execute') (17)
```

---

### FLUXO 6 — Execução com Timer (`POST /habits/{id}/executions`)

```
ExecutionScreen monta (1)
  → useEffect: executionToken = crypto.randomUUID() (2)
  → useTimer(meta_base, habitId, executionToken, isTimer=true) (3)
    → setInterval 1s → decrementa timeLeft (4)
    → document.visibilitychange oculto: pause() (5)
      → clearInterval (6)
      → storage.saveExecutionState(habitId, token, {timeLeft, isOverachieving, overachieveTime}, Date.now()) (7)
    → document.visibilitychange visível: resume() (8)
      → storage.loadExecutionState(habitId) (9)
      → isWithinTolerance(startedAt) — máx 1 hora de pausa (10)
      → compensa timeDiff, ajusta timeLeft (11)
  → timeLeft === 0: setIsOverachieving(true) + vibrate (12)
  → botão CONCLUIR visível quando isOverachieving (13)
  → handleComplete() (14)
    → pause() — salva estado final (15)
    → calcula isExtra: overachieveTime >= meta_base * 0.2 (16)
    → api.submitExecution(id, payload) (17)
      → POST /api/habits/{id}/executions com Bearer token (18)
        → [Backend] HabitoController.executeHabit() (19)
        → [Backend] GamificacaoService.processarExecucao() (20)
          → HistoricoExecucaoRepository.existsByExecutionToken() — idempotência (21)
          → calcula moedas (100 ou 150) (22)
          → atualiza execucoesHoje e diasSeguidos (23)
          → StatusHabitoRepository.update(status) (24)
          → HistoricoExecucaoRepository.save(historico) (25)
        → Response: { moedas_ganhas, moedas_totais, dias_seguidos, texto_feedback } (26)
    → storage.clearExecutionState(habitId) (27)
    → navigate('/success', { state: { bonus: isExtra, feedback: res.data } }) (28)
```

---

### FLUXO 7 — Desistência (`POST /habits/{id}/executions` tipo FAIL)

```
ExecutionScreen — botão "Desistir" (1)
  → pause() → showGiveUpModal = true (2)
  → GiveUpModal renderiza opções baseado em bloqueios_acumulados (3)
  → usuário seleciona tipo (FAIL_TIMEOUT ou FAIL_BLOQUEIO) (4)
  → handleGiveUp(type) (5)
    → pause() (6)
    → payload: { execution_token, tipo, valor_realizado: meta_base - timeLeft } (7)
    → api.submitExecution(id, payload) (8)
      → POST /api/habits/{id}/executions (9)
        → [Backend] GamificacaoService.processarExecucao() (10)
          → diasSeguidos = 0 (reset da ofensiva) (11)
          → StatusHabitoRepository.update(status) (12)
          → HistoricoExecucaoRepository.save(historico) (13)
        → Response: { moedas_ganhas: 0, texto_feedback: "Ofensiva zerada..." } (14)
    → storage.clearExecutionState(habitId) (15)
    → navigate('/fail', { state: { type, feedback: res.data } }) (16)
```

---

### FLUXO 8 — Tela de Sucesso (sem chamada à API)

```
Success monta (1)
  → location.state.bonus → booleano de bônus (2)
  → location.state.feedback → { moedas_ganhas, dias_seguidos, texto_feedback } (3)
  → renderiza partículas com useMemo (50 partículas geradas) (4)
  → exibe: emoji, título, subtítulo, card de recompensas (5)
  → botão VOLTAR → navigate('/home') (6)
```

---

### FLUXO 9 — Tela de Falha (sem chamada à API)

```
Fail monta (1)
  → location.state.type → 'FAIL_TIMEOUT' | 'FAIL_BLOQUEIO' | 'BLOCK_ACTIVE' (2)
  → location.state.feedback → { texto_feedback, moedas_ganhas } (3)
  → seleciona ícone, título, subtítulo e cor de fundo por tipo (4)
  → botão CONTINUAR → navigate('/home') (5)
```

---

### FLUXO 10 — Estatísticas (`GET /stats/weekly`)

```
Stats monta (1)
  → currentHabit do CurrentHabitContext (2)
  → se !currentHabit: renderiza EmptyState (3)
  → setLoading(true) → api.getWeeklyStats() (4)
    → GET /api/stats/weekly com Bearer token (5)
      → [Backend] StatsController.getWeeklyStats() → retorna [] (6)
  → response.data vazio: setData([]) (7)
  → calcula maxRecord = Math.max(...data.map(d => d.valor)) (8)
  → recharts BarChart renderiza gráfico (9)
  → StatCards: dias_seguidos e recorde da semana do habit (10)
```

---

### FLUXO 11 — Loja / Compra de Escudo (`POST /habits/{id}/shield`)

```
Store monta (1)
  → loadHabits() → api.getDashboard() (2)
    → GET /dashboard — mesmo fluxo do dashboard (3)
  → activeHabits = habits.filter(h => h.status !== 'ARCHIVED' && !== 'COMPLETED') (4)
  → Select renderiza hábitos com moedas_locais (5)
  → usuário seleciona hábito → setSelectedHabitId(id) (6)
  → botão Comprar → handleBuyShield() (7)
    → valida selectedHabitId (8)
    → api.buyShield(selectedHabitId) (9)
      → POST /api/habits/{id}/shield com Bearer token (10)
        → [Backend] HabitoController.buyShield(id) (11)
        → [Backend] GamificacaoService.comprarEscudo(id) (12)
          → StatusHabitoRepository.findById() (13)
          → valida moedas_locais >= 1500 (14)
          → moedas_locais -= 1500 (15)
          → bloqueios_acumulados += 1 (16)
          → StatusHabitoRepository.update(status) (17)
        → Response: { success: true, message: "Escudo comprado!" } (18)
    → addToast('Escudo comprado!', 'success') (19)
    → setSelectedHabitId('') → loadHabits() (20)
```

---

### FLUXO 12 — Perfil / Atualização (`PUT /profile`)

```
Profile monta (1)
  → formData inicial: { nome: 'Usuário', senhaAtual: '', novaSenha: '', fusoHorario: ... } (2)
  → handleUpdate(e) chamado no submit (3)
    → monta payload: { nome, fusoHorario, ...senhas se novaSenha preenchida } (4)
    → api.updateProfile(payload) (5)
      → PUT /api/profile com Bearer token (6)
        → [Backend] ProfileController.updateProfile() → email do SecurityContext (7)
        → [Backend] UsuarioService.atualizarPerfil() (8)
          → UsuarioRepository.findByEmail() (9)
          → atualiza nome e fusoHorario se fornecidos (10)
          → se novaSenha: valida senha_atual com BCrypt.matches() (11)
          → BCrypt.encode(novaSenha) → setSenhaHash() (12)
          → UsuarioRepository.update(usuario) (13)
        → Response: { success: true } (14)
    → addToast('Perfil atualizado!', 'success') (15)
    → limpa campos de senha (16)
```

---

### FLUXO 13 — Criar Hábito (`POST /habits`)

```
CreateHabit monta — step = 1 (1)
  → Etapa 1: usuário clica em molde (AGUA / ESTUDAR / EXERCICIO) (2)
    → setMolde(m) → NextButton → setStep(2) (3)
  → Etapa 2: escolha do modo de configuração (4)
    → "Medir Dificuldade": addToast('Em breve!') (5)
    → "Preencher Manualmente": setStep(3) (6)
  → Etapa 3: formulário preenchido (7)
    → meta_base, aumento_dezena, meta_maxima, frequencia_semanal, vezes_dia, horario (8)
    → handleSave() (9)
      → setIsSubmitting(true) (10)
      → monta payload completo (11)
      → api.createHabit(payload) (12)
        → POST /api/habits com Bearer token (13)
          → [Backend] HabitoController.createHabit() → email do SecurityContext (14)
          → [Backend] HabitoService.criarHabito(email, request) (15)
            → UsuarioRepository.findByEmail() (16)
            → HabitoRepository.findAllByUsuarioId() — valida limite de 5 (17)
            → HabitoRepository.save(habito) (18)
            → StatusHabitoRepository.save(status inicial) (19)
          → Response: HabitoResponseDTO completo (20)
      → addToast('Hábito criado!', 'success') (21)
      → navigate('/home') (22)
```

---

## 8. Padrão de Rastreabilidade — `@audit-ok`

Cada funcionalidade possui marcações `// @audit-ok` no código-fonte nas posições exatas onde cada etapa dos fluxos acima é implementada. O formato segue:

- `// @audit-ok [FUNCIONALIDADE]` — marca a função/método que implementa a funcionalidade
- `// @audit-ok [FUNCIONALIDADE (N)]` — marca o passo N dentro do fluxo de dados daquela funcionalidade

**Exemplo de rastreio:** O passo 17 do Fluxo 6 (Execução) — envio do POST — está marcado como `// @audit-ok [Execução Timer (17)]` em `Execution/index.jsx` e como `// @audit-ok [Execução Timer (19)]` em `HabitoController.java`, ligando diretamente o front ao back.

---

## 9. Testando a API com o Postman

O projeto inclui uma coleção Postman pronta que cobre **todos os endpoints** do backend, com scripts que salvam o token e o `habit_id` automaticamente entre as requisições.

**Arquivo:** [backend/src/main/resources/Postman/Tempo Claro.json](backend/src/main/resources/Postman/Tempo%20Claro.json)

### 9.1. Importar a coleção no Postman

1. Abra o **Postman** (desktop ou web).
2. Clique em **Import** (canto superior esquerdo).
3. Arraste o arquivo `Tempo Claro.json` para a janela **ou** clique em **files** e selecione:
   `backend/src/main/resources/Postman/Tempo Claro.json`
4. Confirme em **Import**. A coleção **"Tempo Claro — API Completa"** aparecerá na barra lateral.

### 9.2. Configurar o ambiente (variáveis)

A coleção usa variáveis (`{{base_url}}`, `{{token}}`, `{{habit_id}}`, `{{execution_token}}`). O `base_url` já vem com um valor padrão na coleção, mas o recomendado é criar um **Environment**:

1. No menu lateral, vá em **Environments** → **+** (novo ambiente).
2. Nomeie como `Local` e adicione:

   | Variável | Valor inicial |
   |---|---|
   | `base_url` | `http://localhost:8082` |
   | `token` | *(deixe vazio — preenchido automaticamente)* |

3. Selecione o ambiente **Local** no seletor do canto superior direito.

> **Porta local:** o backend sobe em `http://localhost:8082` (`server.port=8082`).
> **Produção:** troque `base_url` por `https://tempo-claro-tcc-tsi.onrender.com`.
> O caminho base da API é `/api` (a coleção **não** usa `/v1`).

### 9.3. Fluxo de teste sugerido

O token JWT é salvo automaticamente em `{{token}}` pelos scripts de **Register** e **Login**, e todas as demais requisições já enviam `Authorization: Bearer {{token}}`. Rode nesta ordem:

1. **01 - Auth** → `Register (Cadastro)` — cria a conta e salva o token. *(Retorna 201.)*
2. **01 - Auth** → `Login` — se já tiver conta, salva o token.
3. **03 - Hábitos (CRUD)** → `Create Habit` — cria um hábito e salva o `{{habit_id}}`. *(Retorna 201.)*
4. **02 - Dashboard** → `Get Dashboard` — lista os hábitos (também repõe o `{{habit_id}}`).
5. **05 - Priming** → `Get Priming Text` — texto motivacional do hábito.
6. **04 - Execuções** → `Execute Habit — Sucesso / Extra / Falha` — o `execution_token` (UUID) é gerado automaticamente a cada envio.
7. **07 - Perfil** → `Update Profile` — atualiza nome, fuso ou senha.
8. **08 - Estatísticas** → `Get Weekly Stats` — retorna `[]` (stub).
9. **06 - Escudo** → `Buy Shield` — exige **1500 moedas** no hábito (em conta nova retorna `400 Saldo insuficiente`, o que é esperado).
10. **03 - Hábitos (CRUD)** → `Delete Habit` — desativa o hábito (rode **por último**).
11. **09 - Cenários de Erro** — testes negativos (token ausente/inválido, senha errada, e-mail duplicado, ID inexistente).

### 9.4. Cobertura da coleção

| Pasta | Método | Endpoint |
|---|---|---|
| 01 - Auth | POST | `/api/auth/register` · `/api/auth/login` |
| 02 - Dashboard | GET | `/api/dashboard` |
| 03 - Hábitos | POST / PUT / DELETE | `/api/habits` · `/api/habits/{id}` |
| 04 - Execuções | POST | `/api/habits/{id}/executions` |
| 05 - Priming | GET | `/api/habits/{id}/priming` |
| 06 - Escudo | POST | `/api/habits/{id}/shield` |
| 07 - Perfil | PUT | `/api/profile` |
| 08 - Estatísticas | GET | `/api/stats/weekly` |
| 09 - Cenários de Erro | vários | respostas 4xx esperadas |

> **Valores aceitos em `tipo`** (execução): `COMPLETE_PADRAO` (+100 moedas), `COMPLETE_EXTRA` (+150 moedas), `FAIL_TIMEOUT` e `FAIL_BLOQUEIO` (zeram a ofensiva). Qualquer outro valor retorna `400`.
>
> **Dica:** use **Run collection** (botão ▶ na coleção) para executar toda a suíte de uma vez e ver os testes passando na aba *Test Results*.

---