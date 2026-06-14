# Trabalho de Conclusão de Curso (TCC) - Sistema Tempo Claro

## 1. Informações Acadêmicas e Institucionais
**Instituição:** Instituto Federal Sul-rio-grandense (IFSul) - Campus Pelotas
**Curso:** Tecnologia em Sistemas para Internet (TSI)
**Semestre:** 2026/1
**Aluno(a):** Rodrigo Miranda da Silva
**Orientador(a):** 
**GitHub do Aluno:** https://github.com/Rodrimir
**Site:**  www.monzai.com.br

**Status do Projeto:** Primeira versão do sistema, atualmente em fase de testes fechados, porém operando integralmente em ambiente de Produção (Nuvem).

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

## 4. Módulo Back-end (API RESTful)

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

### 4.2. Teste da API e Documentação de Requisições (Postman)
URL de Produção: `https://tempo-claro-tcc-tsi.onrender.com/api/v1`

**Registro de Usuário**
- **Método:** POST
- **Endpoint:** `/auth/register`
- **Corpo da Requisição (JSON):**
```json
{
  "nome": "Usuário Teste da Banca",
  "email": "banca.tsi@ifsul.edu.br",
  "password": "SenhaSegura123!"
}
```

**Autenticação (Login)**
- **Método:** POST
- **Endpoint:** `/auth/login`
- **Corpo da Requisição (JSON):**
```json
{
  "email": "banca.tsi@ifsul.edu.br",
  "password": "SenhaSegura123!"
}
```
- **Resposta Esperada:** Retorna o `Bearer Token` JWT necessário para todas as requisições subsequentes.

### 4.3. Rastreabilidade de Código (Índice de Auditoria Back-end)
Para fins de auditoria acadêmica, as lógicas vitais do sistema estão mapeadas através da tag `// audit-ok: [ID]` no código-fonte Java.

| ID do Marcador | Arquivo | Descrição Arquitetural / Regra de Negócio |
| :--- | :--- | :--- |
| `BACK-CTRL-00` | `AuthController.java` | Declaração do mapeamento REST aberto (permitAll) para entrada de novos usuários no sistema. |
| `BACK-CTRL-01` | `AuthController.java` | Exposição do endpoint de autenticação que invoca a camada de serviço e retorna o Token JWT. |
| `BACK-CTRL-02` | `AuthController.java` | Exposição do endpoint de registro para inserção segura via DTO (Data Transfer Object). |
| `BACK-SRV-01` | `AuthService.java` | Validação de login contra o banco de dados e conferência criptográfica (BCrypt) da senha. |
| `BACK-SRV-02` | `AuthService.java` | Geração do token JWT encapsulando os dados essenciais da sessão pós-validação de credenciais. |
| `BACK-SRV-03` | `AuthService.java` | Fluxo de inserção de novo usuário: verificação de duplicidade, criptografia e persistência inicial. |
| `BACK-CFG-01` | `SecurityConfig.java` | Configuração da corrente de filtros do Spring Security, garantindo transações Stateless e proteção base. |
| `BACK-CFG-02` | `SecurityConfig.java` | Instanciação obrigatória do BCryptPasswordEncoder, elevando a segurança dos hashes. |
| `BACK-CFG-03` | `SecurityConfig.java` | Mapeamento permissivo de Cross-Origin Resource Sharing (CORS) para permitir a comunicação com a Vercel. |

---

## 5. Módulo Front-end (Aplicação SPA)

A arquitetura do front-end foi desenhada como uma Single Page Application (SPA), baseada em componentes reativos, hooks de estado e interceptadores de requisições.

### 5.1. Rastreabilidade de Código (Índice de Auditoria Front-end)
Semelhante ao back-end, o front-end possui marcadores arquiteturais para avaliação.

| ID do Marcador | Arquivo | Descrição Arquitetural / Regra de Negócio |
| :--- | :--- | :--- |
| `FRONT-API-01` | `services/api.js` | Configuração da instância global do Axios contendo a URI estática do Render (Produção). |
| `FRONT-API-02` | `services/api.js` | Configuração do interceptador de requisições HTTP, injetando o Bearer Token do LocalStorage em cada chamada autenticada. |

---

## 6. Pré-requisitos e Execução Local

### Pré-requisitos do Ambiente
Para compilar e executar o projeto em sua máquina local, certifique-se de ter instalado:
- **Java Development Kit (JDK) 17**
- **Node.js (versão 20 ou superior)**
- **NPM** (gerenciador de pacotes do Node)
- **Android Studio** (para compilação do APK Mobile)

### Passo a Passo para Inicialização

**1. Executando o Back-end (API Spring Boot)**
Abra o terminal na raiz do projeto e navegue até a pasta ackend/:
\\\ash
cd backend
# No Windows:
.\gradlew bootRun
# No Linux/Mac:
./gradlew bootRun
\\\`r
A API estará disponível em http://localhost:8080.

**2. Executando o Front-end (React/Vite)**
Abra um novo terminal, navegue até a pasta rontend/ e instale as dependências:
\\\ash
cd frontend
npm install
npm run dev
\\\`r
A interface Web estará disponível em http://localhost:5173.

**3. Compilando o Aplicativo Mobile (Android APK)**
Com o Front-end construído, sincronize o código Web com o projeto Nativo usando o Capacitor:
\\\ash
cd frontend
npm run build
npx cap sync android
\\\`r
Após a sincronização, abra a pasta rontend/android/ diretamente no **Android Studio**. No menu superior da IDE, acesse: Build > Build Bundle(s) / APK(s) > Build APK(s) para gerar o instalador do aplicativo para celulares Android.

