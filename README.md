# Trabalho de Conclusão de Curso (TCC) - Sistema Tempo Claro

## 1. Informações Acadêmicas e Institucionais
**Instituição:** Instituto Federal Sul-rio-grandense (IFSul) - Campus Pelotas
**Curso:** Tecnologia em Sistemas para Internet (TSI)
**Semestre:** 2026/1
**Aluno(a):** Rodrigo Miranda da Silva
**Orientador(a):** 
**GitHub do Aluno:** https://github.com/Rodrimir
**Site Institucional / Referência:** www.monzai.com.br

**Status do Projeto:** Primeira versão do sistema, em fase de testes fechados, operando integralmente em ambiente de Produção (Nuvem).

---

## 2. Arquitetura e Infraestrutura de Hospedagem (Nuvem)
O sistema foi projetado sob uma arquitetura de microsserviços dividida em três camadas principais:
1. **Frontend (Aplicação Web e Mobile):** Desenvolvido em ReactJS com Vite, encapsulado nativamente via CapacitorJS para Android. Hospedado via deploy contínuo na plataforma **Vercel**.
2. **Backend (API RESTful):** Desenvolvido em Java 17 com Spring Boot 3 e empacotado via Docker. Hospedado como Web Service na plataforma **Render**.
3. **Banco de Dados (Relacional):** Modelado em PostgreSQL. Hospedado em arquitetura Serverless na plataforma **Neon Postgres** (AWS).

---

## 3. Mapeamento de Diretórios do Projeto
```text
/
├── backend/                  # Módulo de API (Java/Spring Boot)
│   ├── src/main/java/        # Código-fonte da aplicação
│   │   └── com/rodrigo/backend2java/
│   │       ├── config/       # Configurações de Segurança e JWT
│   │       ├── controller/   # Endpoints REST expostos
│   │       ├── dto/          # Objetos de Transferência de Dados
│   │       ├── model/        # Entidades do Banco de Dados
│   │       ├── repository/   # Interfaces de persistência JPA
│   │       └── service/      # Regras de Negócio
│   ├── src/main/resources/   # Propriedades e scripts SQL (schema.sql)
│   ├── Dockerfile            # Instruções de containerização para o Render
│   └── build.gradle          # Gerenciador de dependências Gradle
│
├── frontend/                 # Módulo de Interface (React/Vite)
│   ├── android/              # Projeto nativo gerado pelo CapacitorJS (APK)
│   ├── src/
│   │   ├── components/       # Componentes React reutilizáveis
│   │   ├── contexts/         # Gerenciamento de estado global (Context API)
│   │   ├── pages/            # Telas da aplicação
│   │   ├── services/         # Integração HTTP com o Backend via Axios
│   │   └── utils/            # Funções utilitárias e gerenciamento de LocalStorage
│   └── package.json          # Gerenciador de dependências Node (NPM)
```

---

## 4. Módulo Back-end (API RESTful e Modelagem)

### 4.1. Linguagem de Definição de Dados (DDL - Schema)
A estrutura do banco de dados relacional (PostgreSQL) foi elaborada para suportar a gamificação e o rastreamento de hábitos. O schema inicial inclui:

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

### 4.2. Documentação Exaustiva da API (Endpoints e Contratos)
**URL de Produção Base:** `https://tempo-claro-tcc-tsi.onrender.com/api/v1`

Todas as requisições (exceto os métodos de Autenticação) exigem o cabeçalho `Authorization: Bearer <token>`.

#### 4.2.1. Autenticação (Tabela: `usuarios`)
**1. Registrar Novo Usuário**
- **Método:** `POST /auth/register`
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
- **Método:** `POST /auth/login`
- **Request (JSON):**
  ```json
  {
    "email": "rodrigo@ifsul.edu.br",
    "password": "SenhaSegura123!"
  }
  ```
- **Response (200 OK):** Retorna o Token JWT.

#### 4.2.2. Gestão de Hábitos (Tabelas: `habitos`, `status_habitos`)
**3. Criar Hábito**
- **Método:** `POST /habits`
- **Request (JSON):**
  ```json
  {
    "titulo": "Beber Água",
    "categoria": "SAUDE",
    "gatilho_ancora": "Depois de acordar",
    "tipo_medida": "UNIDADES",
    "modalidade": "SIM_NAO",
    "meta_base": 1,
    "meta_frequencia_diaria": 1
  }
  ```
- **Response (200 OK):** Retorna o objeto completo do hábito com o respectivo ID.

**4. Atualizar Hábito**
- **Método:** `PUT /habits/{id}`
- **Request (JSON):** Mesma estrutura do POST, com os campos atualizados.
- **Response (200 OK):** `{ "success": true }`

**5. Excluir Hábito (Soft/Hard Delete)**
- **Método:** `DELETE /habits/{id}`
- **Response (200 OK):** `{ "success": true }`

**6. Obter Dashboard de Hábitos**
- **Método:** `GET /dashboard`
- **Response (200 OK):**
  ```json
  {
    "habitos": [
      {
        "id": "uuid",
        "titulo": "Beber Água",
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

#### 4.2.3. Execução e Gamificação (Tabelas: `historico_execucoes`)
**7. Resgatar Texto de Priming Cognitivo**
- **Método:** `GET /habits/{id}/priming`
- **Response (200 OK):** `{ "executionToken": "uuid-temp", "textoMotivacional": "Cada copo de água é um passo..." }`

**8. Confirmar Execução do Hábito**
- **Método:** `POST /habits/{id}/executions`
- **Request (JSON):**
  ```json
  {
    "executionToken": "uuid-temp-gerado-no-priming",
    "valorRealizado": 1
  }
  ```
- **Response (200 OK):** `{ "success": true, "moedasGanhas": 10, "tipoSucesso": "NORMAL" }`

**9. Comprar Escudo (Shield)**
- **Método:** `POST /habits/{id}/shield`
- **Response (200 OK):** `{ "success": true, "moedasRestantes": 0, "bloqueiosAtuais": 1 }`

#### 4.2.4. Perfil e Estatísticas globais
**10. Atualizar Perfil**
- **Método:** `PUT /profile`
- **Request (JSON):** `{ "nome": "Rodrigo Atualizado" }`
- **Response (200 OK):** `{ "success": true }`

**11. Obter Estatísticas Semanais**
- **Método:** `GET /stats/weekly`
- **Response (200 OK):** `[]` *(Agregação estendida para versão 2.0)*

---

## 5. Rastreabilidade de Código (Padrão de Auditoria Sistêmica)

Em conformidade com padrões de engenharia de software rigorosos (nível stricto sensu), estabelecemos uma política de rastreabilidade bidirecional. 

**Exatos 81 arquivos-fonte** do projeto (33 componentes backend e 48 componentes frontend) receberam no topo da sua hierarquia a tag de auditoria sistêmica no formato:
`// @audit-ok: [MÓDULO]-[NOME_DO_ARQUIVO]-01`

**Como interpretar a Rastreabilidade:**
- Se ocorrer um erro no fluxo da aplicação Web na tela de `Login.jsx`, o rastreio apontará para a marcação `FRONTEND-Login.jsx-01`. 
- Ao analisar essa requisição, o payload direciona-se fisicamente para o componente mapeado com `BACKEND-AuthController.java-01`.
- Essa correlação unívoca garante que cada arquivo no repositório possua um "RG" rastreável, facilitando debug, auditorias de segurança (Pentest) e avaliações acadêmicas da banca sem a necessidade de gerar tabelas documentais imensas que desatualizam com o tempo.

---

## 6. Pré-requisitos e Execução Local

### Pré-requisitos do Ambiente
Para compilar e executar o projeto em sua máquina local, certifique-se de ter instalado:
- **Java Development Kit (JDK) 17**
- **Node.js (versão 20 ou superior)** e **NPM**
- **Android Studio** (apenas para compilação do APK Mobile)

### Passo a Passo para Inicialização

**1. Executando o Back-end (API Spring Boot)**
Abra o terminal na raiz do projeto e navegue até a pasta `backend/`:
```bash
cd backend
# No Windows:
.\gradlew bootRun
# No Linux/Mac:
./gradlew bootRun
```
A API estará exposta em `http://localhost:8080`.

**2. Executando o Front-end (React/Vite)**
Abra um novo terminal, navegue até a pasta `frontend/` e instale as dependências:
```bash
cd frontend
npm install
npm run dev
```
A interface Web estará disponível em `http://localhost:5173`.

**3. Compilando o Aplicativo Mobile (Android APK)**
Com o Front-end construído, sincronize o código Web com o projeto Nativo usando o Capacitor:
```bash
cd frontend
npm run build
npx cap sync android
```
Após a sincronização, abra a pasta `frontend/android/` diretamente no **Android Studio**. No menu superior da IDE, acesse: `Build > Build Bundle(s) / APK(s) > Build APK(s)` para gerar o instalador do aplicativo (`.apk`) para celulares Android nativos.
