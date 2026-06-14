# Trabalho de ConclusÃ£o de Curso (TCC) - Sistema Tempo Claro

## 1. InformaÃ§Ãµes AcadÃªmicas e Institucionais
**InstituiÃ§Ã£o:** Instituto Federal Sul-rio-grandense (IFSul) - Campus Pelotas
**Curso:** Tecnologia em Sistemas para Internet (TSI)
**Semestre:** 2026/1
**Aluno(a):** Rodrigo Miranda da Silva
**Orientador(a):** 
**GitHub do Aluno:** https://github.com/Rodrimir
**Site Institucional / ReferÃªncia:** www.monzai.com.br

**Status do Projeto:** Primeira versÃ£o do sistema, em fase de testes fechados, operando integralmente em ambiente de ProduÃ§Ã£o (Nuvem).

---

## 2. Arquitetura e Infraestrutura de Hospedagem (Nuvem)
O sistema foi projetado sob uma arquitetura de microsserviÃ§os dividida em trÃªs camadas principais:
1. **Frontend (AplicaÃ§Ã£o Web e Mobile):** Desenvolvido em ReactJS com Vite, encapsulado nativamente via CapacitorJS para Android. Hospedado via deploy contÃ­nuo na plataforma **Vercel**.
2. **Backend (API RESTful):** Desenvolvido em Java 17 com Spring Boot 3 e empacotado via Docker. Hospedado como Web Service na plataforma **Render**.
3. **Banco de Dados (Relacional):** Modelado em PostgreSQL. Hospedado em arquitetura Serverless na plataforma **Neon Postgres** (AWS).

---

## 3. Mapeamento de DiretÃ³rios do Projeto
```text
/
â”œâ”€â”€ backend/                  # MÃ³dulo de API (Java/Spring Boot)
â”‚   â”œâ”€â”€ src/main/java/        # CÃ³digo-fonte da aplicaÃ§Ã£o
â”‚   â”‚   â””â”€â”€ com/rodrigo/backend2java/
â”‚   â”‚       â”œâ”€â”€ config/       # ConfiguraÃ§Ãµes de SeguranÃ§a e JWT
â”‚   â”‚       â”œâ”€â”€ controller/   # Endpoints REST expostos
â”‚   â”‚       â”œâ”€â”€ dto/          # Objetos de TransferÃªncia de Dados
â”‚   â”‚       â”œâ”€â”€ model/        # Entidades do Banco de Dados
â”‚   â”‚       â”œâ”€â”€ repository/   # Interfaces de persistÃªncia JPA
â”‚   â”‚       â””â”€â”€ service/      # Regras de NegÃ³cio
â”‚   â”œâ”€â”€ src/main/resources/   # Propriedades e scripts SQL (schema.sql)
â”‚   â”œâ”€â”€ Dockerfile            # InstruÃ§Ãµes de containerizaÃ§Ã£o para o Render
â”‚   â””â”€â”€ build.gradle          # Gerenciador de dependÃªncias Gradle
â”‚
â”œâ”€â”€ frontend/                 # MÃ³dulo de Interface (React/Vite)
â”‚   â”œâ”€â”€ android/              # Projeto nativo gerado pelo CapacitorJS (APK)
â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”œâ”€â”€ components/       # Componentes React reutilizÃ¡veis
â”‚   â”‚   â”œâ”€â”€ contexts/         # Gerenciamento de estado global (Context API)
â”‚   â”‚   â”œâ”€â”€ pages/            # Telas da aplicaÃ§Ã£o
â”‚   â”‚   â”œâ”€â”€ services/         # IntegraÃ§Ã£o HTTP com o Backend via Axios
â”‚   â”‚   â””â”€â”€ utils/            # FunÃ§Ãµes utilitÃ¡rias e gerenciamento de LocalStorage
â”‚   â””â”€â”€ package.json          # Gerenciador de dependÃªncias Node (NPM)
```

---

## 4. MÃ³dulo Back-end (API RESTful e Modelagem)

### 4.1. Linguagem de DefiniÃ§Ã£o de Dados (DDL - Schema)
A estrutura do banco de dados relacional (PostgreSQL) foi elaborada para suportar a gamificaÃ§Ã£o e o rastreamento de hÃ¡bitos. O schema inicial inclui:

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
    categoria VARCHAR(100),
    gatilho_ancora VARCHAR(255),
    tipo_medida VARCHAR(50),
    modalidade VARCHAR(50),
    horario_agendado TIME,
    meta_base INT,
    meta_frequencia_diaria INT,
    intervalo_minutos INT,
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS historico_execucoes (
    id UUID PRIMARY KEY,
    habito_id UUID NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    execution_token UUID,
    data_hora_execucao TIMESTAMP WITH TIME ZONE,
    valor_realizado INT,
    moedas_ganhas INT,
    tipo_sucesso VARCHAR(100)
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

### 4.2. DocumentaÃ§Ã£o Exaustiva da API (Endpoints e Contratos)
**URL de ProduÃ§Ã£o Base:** `https://tempo-claro-tcc-tsi.onrender.com/api/v1`

Todas as requisiÃ§Ãµes (exceto os mÃ©todos de AutenticaÃ§Ã£o) exigem o cabeÃ§alho `Authorization: Bearer <token>`.

#### 4.2.1. AutenticaÃ§Ã£o (Tabela: `usuarios`)
**1. Registrar Novo UsuÃ¡rio**
- **MÃ©todo:** `POST /auth/register`
- **Request (JSON):**
  ```json
  {
    "nome": "Rodrigo Miranda",
    "email": "rodrigo@ifsul.edu.br",
    "password": "SenhaSegura123!"
  }
  ```
- **Response (201 Created):** Retorna `{ "token": "eyJhb...", "user": { "name": "Rodrigo Miranda", "email": "..." } }`

**2. Login**
- **MÃ©todo:** `POST /auth/login`
- **Request (JSON):**
  ```json
  {
    "email": "rodrigo@ifsul.edu.br",
    "password": "SenhaSegura123!"
  }
  ```
- **Response (200 OK):** Retorna o Token JWT.

#### 4.2.2. GestÃ£o de HÃ¡bitos (Tabelas: `habitos`, `status_habitos`)
**3. Criar HÃ¡bito**
- **MÃ©todo:** `POST /habits`
- **Request (JSON):**
  ```json
  {
    "titulo": "Beber Ãgua",
    "categoria": "SAUDE",
    "gatilho_ancora": "Depois de acordar",
    "tipo_medida": "UNIDADES",
    "modalidade": "SIM_NAO",
    "meta_base": 1,
    "meta_frequencia_diaria": 1
  }
  ```
- **Response (200 OK):** Retorna o objeto completo do hÃ¡bito com o respectivo ID.

**4. Atualizar HÃ¡bito**
- **MÃ©todo:** `PUT /habits/{id}`
- **Request (JSON):** Mesma estrutura do POST, com os campos atualizados.
- **Response (200 OK):** `{ "success": true }`

**5. Excluir HÃ¡bito (Soft/Hard Delete)**
- **MÃ©todo:** `DELETE /habits/{id}`
- **Response (200 OK):** `{ "success": true }`

**6. Obter Dashboard de HÃ¡bitos**
- **MÃ©todo:** `GET /dashboard`
- **Response (200 OK):**
  ```json
  {
    "habitos": [
      {
        "id": "uuid",
        "titulo": "Beber Ãgua",
        "status": {
          "moedasLocais": 50,
          "diasSeguidos": 3,
          "execucoesHoje": 0
        }
      }
    ],
    "moedasGlobais": 50
  }
  ```

#### 4.2.3. ExecuÃ§Ã£o e GamificaÃ§Ã£o (Tabelas: `historico_execucoes`)
**7. Resgatar Texto de Priming Cognitivo**
- **MÃ©todo:** `GET /habits/{id}/priming`
- **Response (200 OK):** `{ "executionToken": "uuid-temp", "textoMotivacional": "Cada copo de Ã¡gua Ã© um passo..." }`

**8. Confirmar ExecuÃ§Ã£o do HÃ¡bito**
- **MÃ©todo:** `POST /habits/{id}/executions`
- **Request (JSON):**
  ```json
  {
    "executionToken": "uuid-temp-gerado-no-priming",
    "valorRealizado": 1
  }
  ```
- **Response (200 OK):** `{ "success": true, "moedasGanhas": 10, "tipoSucesso": "NORMAL" }`

**9. Comprar Escudo (Shield)**
- **MÃ©todo:** `POST /habits/{id}/shield`
- **Response (200 OK):** `{ "success": true, "moedasRestantes": 0, "bloqueiosAtuais": 1 }`

#### 4.2.4. Perfil e EstatÃ­sticas globais
**10. Atualizar Perfil**
- **MÃ©todo:** `PUT /profile`
- **Request (JSON):** `{ "nome": "Rodrigo Atualizado" }`
- **Response (200 OK):** `{ "success": true }`

**11. Obter EstatÃ­sticas Semanais**
- **MÃ©todo:** `GET /stats/weekly`
- **Response (200 OK):** `[]` *(AgregaÃ§Ã£o estendida para versÃ£o 2.0)*

---

## 5. Rastreabilidade de CÃ³digo (PadrÃ£o de Auditoria SistÃªmica)

Em conformidade com padrÃµes de engenharia de software rigorosos (nÃ­vel stricto sensu), estabelecemos uma polÃ­tica de rastreabilidade bidirecional. 

**Exatos 81 arquivos-fonte** do projeto (33 componentes backend e 48 componentes frontend) receberam no topo da sua hierarquia a tag de auditoria sistÃªmica no formato:
`// @audit-ok: [MÃ“DULO]-[NOME_DO_ARQUIVO]-01`

**Como interpretar a Rastreabilidade:**
- Se ocorrer um erro no fluxo da aplicaÃ§Ã£o Web na tela de `Login.jsx`, o rastreio apontarÃ¡ para a marcaÃ§Ã£o `FRONTEND-Login.jsx-01`. 
- Ao analisar essa requisiÃ§Ã£o, o payload direciona-se fisicamente para o componente mapeado com `BACKEND-AuthController.java-01`.
- Essa correlaÃ§Ã£o unÃ­voca garante que cada arquivo no repositÃ³rio possua um "RG" rastreÃ¡vel, facilitando debug, auditorias de seguranÃ§a (Pentest) e avaliaÃ§Ãµes acadÃªmicas da banca sem a necessidade de gerar tabelas documentais imensas que desatualizam com o tempo.

---

## 6. PrÃ©-requisitos e ExecuÃ§Ã£o Local

### PrÃ©-requisitos do Ambiente
Para compilar e executar o projeto em sua mÃ¡quina local, certifique-se de ter instalado:
- **Java Development Kit (JDK) 17**
- **Node.js (versÃ£o 20 ou superior)** e **NPM**
- **Android Studio** (apenas para compilaÃ§Ã£o do APK Mobile)

### Passo a Passo para InicializaÃ§Ã£o

**1. Executando o Back-end (API Spring Boot)**
Abra o terminal na raiz do projeto e navegue atÃ© a pasta `backend/`:
```bash
cd backend
# No Windows:
.\gradlew bootRun
# No Linux/Mac:
./gradlew bootRun
```
A API estarÃ¡ exposta em `http://localhost:8080`.

**2. Executando o Front-end (React/Vite)**
Abra um novo terminal, navegue atÃ© a pasta `frontend/` e instale as dependÃªncias:
```bash
cd frontend
npm install
npm run dev
```
A interface Web estarÃ¡ disponÃ­vel em `http://localhost:5173`.

**3. Compilando o Aplicativo Mobile (Android APK)**
Com o Front-end construÃ­do, sincronize o cÃ³digo Web com o projeto Nativo usando o Capacitor:
```bash
cd frontend
npm run build
npx cap sync android
```
ApÃ³s a sincronizaÃ§Ã£o, abra a pasta `frontend/android/` diretamente no **Android Studio**. No menu superior da IDE, acesse: `Build > Build Bundle(s) / APK(s) > Build APK(s)` para gerar o instalador do aplicativo (`.apk`) para celulares Android nativos.
