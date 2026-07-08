-- ============================================================================
-- TEMPO CLARO — ESQUEMA DE BANCO DE DADOS IDEAL E DEFINITIVO
-- PostgreSQL 13+ · Projeto de Graduação CSTSI / IFSul · 2026
-- Aluno: Rodrigo Miranda da Silva
-- ----------------------------------------------------------------------------
-- Princípios deste schema:
--   1. BANCO DE PERSISTÊNCIA PURA. O banco é responsável apenas por armazenar
--      dados e garantir integridade referencial. Toda lógica de negócio
--      (validação de limite de hábitos, cálculo de saldo, ofensiva, nível e
--      inventário) reside exclusivamente na camada de serviço da API Spring Boot.
--   2. CRIAÇÃO DO ZERO. O banco antigo é descartado; este script faz DROP +
--      CREATE e pode ser executado em uma base vazia.
--   3. NORMALIZADO. Sem colunas-cache redundantes. As tabelas guardam apenas
--      FATOS e ESTADO não-derivável.
--   4. SEM VIEWS, TRIGGERS OU FUNCTIONS. Não há lógica de negócio no banco.
--      Toda agregação e validação acontece em tempo de execução na API.
--   5. ÍNDICES MÍNIMOS. Apenas PK, FK implícitas e UNIQUE explícitos que
--      garantem integridade dos dados. Sem índices de otimização prematura.
--   6. ROADMAP SEPARADO. GPS, Pomodoro, micro-hábitos e troféus ficam no bloco
--      final comentado (Seção C), prontos para evolução futura.
--
-- Cobertura: F01–F16, regras 3.1–3.8, economia/gamificação e máquina de estados.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- SEÇÃO B — TABELAS (cobre 100% de F01–F16 e regras 3.1–3.8)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. usuarios — conta, autenticação e preferências  (F01)
--    streak, XP e saldo do usuário são calculados pela API sob demanda.
-- ----------------------------------------------------------------------------
CREATE TABLE usuarios (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nome               VARCHAR(150) NOT NULL,
    email              VARCHAR(255) NOT NULL UNIQUE,
    senha_hash         VARCHAR(255) NOT NULL,
    fuso_horario       VARCHAR(50)  NOT NULL DEFAULT 'America/Sao_Paulo',
    preferencia_idioma VARCHAR(10)  NOT NULL DEFAULT 'pt-BR',
    criado_em          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 2. categorias_habito — moldes fixos Água/Estudo/Exercício  (regra 3.1)
--    Catálogo fechado populado via seed. A API rejeita qualquer código fora
--    dos três moldes ao criar um hábito.
-- ----------------------------------------------------------------------------
CREATE TABLE categorias_habito (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo         VARCHAR(20) NOT NULL UNIQUE,
    nome           VARCHAR(100) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    cor_hex        VARCHAR(7),
    icone_url      VARCHAR(255),
    CONSTRAINT chk_categoria_codigo CHECK (codigo IN ('AGUA','ESTUDO','EXERCICIO'))
);

-- ----------------------------------------------------------------------------
-- 3. habitos — definição do hábito e metas  (F02, F03, regras 3.1, 3.6)
--    A API valida o limite de 2 hábitos ativos antes de qualquer INSERT.
--    Arquivar = preencher arquivado_em sem apagar o histórico (RF23).
-- ----------------------------------------------------------------------------
CREATE TABLE habitos (
    id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id        UUID         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    categoria_id      UUID         NOT NULL REFERENCES categorias_habito(id),
    titulo            VARCHAR(255) NOT NULL,
    gatilho_ancora    VARCHAR(255),
    horario_agendado  TIME,
    tipo_medida       VARCHAR(20)  NOT NULL,
    meta_base         INTEGER      NOT NULL,
    meta_maxima       INTEGER,
    dias_para_aumento INTEGER,
    incremento_meta   INTEGER,
    ativo             BOOLEAN      NOT NULL DEFAULT TRUE,
    arquivado_em      TIMESTAMPTZ,
    criado_em         TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT chk_habito_tipo_medida CHECK (tipo_medida IN ('TEMPO','QUANTIDADE')),
    CONSTRAINT chk_habito_meta_base   CHECK (meta_base > 0),
    CONSTRAINT chk_habito_meta_maxima CHECK (meta_maxima IS NULL OR meta_maxima >= meta_base),
    CONSTRAINT chk_habito_progressao  CHECK (
        (dias_para_aumento IS NULL AND incremento_meta IS NULL) OR
        (dias_para_aumento > 0     AND incremento_meta > 0)
    )
);

-- ----------------------------------------------------------------------------
-- 4. sub_atividades — divisão da meta diária em partes  (regra 3.4)
--    A API calcula o total do hábito somando os alvo_parcial das partes.
-- ----------------------------------------------------------------------------
CREATE TABLE sub_atividades (
    id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    habito_id      UUID    NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    ordem          INTEGER NOT NULL,
    alvo_parcial   INTEGER NOT NULL,
    horario_inicio TIME,
    horario_fim    TIME,
    CONSTRAINT uq_subativ_ordem UNIQUE (habito_id, ordem),
    CONSTRAINT chk_subativ_alvo CHECK (alvo_parcial > 0)
);

-- ----------------------------------------------------------------------------
-- 5. habito_dias_semana — frequência semanal  (F02, F16)
--    0 = Domingo ... 6 = Sábado
-- ----------------------------------------------------------------------------
CREATE TABLE habito_dias_semana (
    habito_id  UUID    NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL,
    PRIMARY KEY (habito_id, dia_semana),
    CONSTRAINT chk_dia_semana CHECK (dia_semana BETWEEN 0 AND 6)
);

-- ----------------------------------------------------------------------------
-- 6. perfil_onboarding — questionário "Medir Dificuldade"  (F16)
--    A API usa as respostas para calcular as sugestões de meta e progressão.
-- ----------------------------------------------------------------------------
CREATE TABLE perfil_onboarding (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id              UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    habito_id               UUID        REFERENCES habitos(id) ON DELETE CASCADE,
    dias_disponiveis        VARCHAR(20),
    janelas_horario         TEXT,
    experiencia_previa      INTEGER,
    nivel_aderencia         INTEGER,
    principais_atritos      TEXT,
    regra_inegociavel_geral TEXT,
    meta_base_sugerida      INTEGER,
    meta_maxima_sugerida    INTEGER,
    incremento_sugerido     INTEGER,
    dias_aumento_sugerido   INTEGER,
    data_resposta           TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_onboarding_aderencia CHECK (nivel_aderencia IS NULL OR nivel_aderencia BETWEEN 1 AND 5)
);

-- ----------------------------------------------------------------------------
-- 7. avatares_catalogo — catálogo de evolução visual  (F05)
--    A API determina qual asset exibir consultando streak_minimo <= ofensiva
--    atual e a estado_expressao correspondente ao estado do hábito.
-- ----------------------------------------------------------------------------
CREATE TABLE avatares_catalogo (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id     UUID         NOT NULL REFERENCES categorias_habito(id),
    nome             VARCHAR(100) NOT NULL,
    streak_minimo    INTEGER      NOT NULL DEFAULT 0,
    estado_expressao VARCHAR(20)  NOT NULL,
    asset_visual_url VARCHAR(255),
    ordem_evolucao   INTEGER,
    CONSTRAINT chk_avatar_expressao CHECK (estado_expressao IN
        ('NORMAL','PREOCUPADO','DESESPERADO','CONCLUIDO','SUCESSO','FALHA')),
    CONSTRAINT chk_avatar_streak    CHECK (streak_minimo >= 0),
    CONSTRAINT uq_avatar_nivel_expr UNIQUE (categoria_id, streak_minimo, estado_expressao)
);

-- ----------------------------------------------------------------------------
-- 8. biblioteca_textos — frases motivacionais por molde/idioma  (F06, F13, F14)
--    categoria_id NULL = texto genérico (fallback).
-- ----------------------------------------------------------------------------
CREATE TABLE biblioteca_textos (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id         UUID        REFERENCES categorias_habito(id) ON DELETE CASCADE,
    idioma               VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    texto_pre_tarefa     TEXT,
    texto_sucesso_padrao TEXT,
    texto_sucesso_extra  TEXT,
    texto_aviso_urgencia TEXT
);

-- ----------------------------------------------------------------------------
-- 9. historico_execucoes — FATO imutável de cada execução/falha  (F07–F10, F13)
--    execution_token garante idempotência: a API rejeita tokens já existentes.
--    moedas_ganhas é calculado pela API antes do INSERT.
-- ----------------------------------------------------------------------------
CREATE TABLE historico_execucoes (
    id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    habito_id          UUID        NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    sub_atividade_id   UUID        REFERENCES sub_atividades(id) ON DELETE SET NULL,
    execution_token    UUID        NOT NULL UNIQUE,
    data_hora_execucao TIMESTAMPTZ NOT NULL DEFAULT now(),
    valor_realizado    INTEGER     NOT NULL DEFAULT 0,
    moedas_ganhas      INTEGER     NOT NULL DEFAULT 0,
    tipo_sucesso       VARCHAR(20) NOT NULL,
    CONSTRAINT chk_tipo_sucesso CHECK (tipo_sucesso IN
        ('COMPLETE_PADRAO','COMPLETE_EXTRA','FAIL_TIMEOUT','FAIL_BLOQUEIO'))
);

-- ----------------------------------------------------------------------------
-- 10. registros_diarios — fechamento do dia / janela 00:00–23:59  (3.3, 3.5)
--     Gravado pela API ao apurar o fim do dia. A API calcula a ofensiva
--     (streak) varrendo a sequência de status='CONCLUIDO' desta tabela.
-- ----------------------------------------------------------------------------
CREATE TABLE registros_diarios (
    id                       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    habito_id                UUID        NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    data_execucao            DATE        NOT NULL,
    valor_total_dia          INTEGER     NOT NULL DEFAULT 0,
    meta_do_dia              INTEGER     NOT NULL,
    status                   VARCHAR(20) NOT NULL,
    hora_conclusao           TIMESTAMPTZ,
    protegido_por_escudo     BOOLEAN     NOT NULL DEFAULT FALSE,
    sentimento_pos_conclusao TEXT,
    CONSTRAINT uq_registro_habito_dia UNIQUE (habito_id, data_execucao),
    CONSTRAINT chk_registro_status    CHECK (status IN ('CONCLUIDO','PARCIAL','FALHA'))
);

-- ----------------------------------------------------------------------------
-- 11. transacoes_moedas — ledger (livro-razão) da economia  (F12, F13)
--     Saldo, XP e inventário de escudos são calculados pela API fazendo
--     SUM(valor) e COUNT nesta tabela. Valor com sinal: + crédito / - débito.
-- ----------------------------------------------------------------------------
CREATE TABLE transacoes_moedas (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    habito_id   UUID        NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    execucao_id UUID        REFERENCES historico_execucoes(id) ON DELETE SET NULL,
    tipo        VARCHAR(30) NOT NULL,
    valor       INTEGER     NOT NULL,
    data_hora   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_transacao_tipo CHECK (tipo IN
        ('CREDITO_META','CREDITO_BONUS','CREDITO_SUBATIVIDADE','DEBITO_ESCUDO'))
);

-- ----------------------------------------------------------------------------
-- 12. sessoes_execucao — sessão ativa/pausada persistida  (F09, regra 3.7)
--     A API grava e lê esta tabela para retomar execuções após minimizar o app.
--     A constraint UNIQUE parcial impede duas sessões vivas para o mesmo hábito;
--     é uma regra de integridade de dados (não de negócio) mantida no banco.
-- ----------------------------------------------------------------------------
CREATE TABLE sessoes_execucao (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    habito_id        UUID        NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    sub_atividade_id UUID        REFERENCES sub_atividades(id) ON DELETE SET NULL,
    iniciada_em      TIMESTAMPTZ NOT NULL DEFAULT now(),
    pausada_em       TIMESTAMPTZ,
    valor_parcial    INTEGER     NOT NULL DEFAULT 0,
    estado           VARCHAR(20) NOT NULL DEFAULT 'EM_EXECUCAO',
    expira_em        TIMESTAMPTZ,
    CONSTRAINT chk_sessao_estado CHECK (estado IN
        ('EM_EXECUCAO','PAUSADO','FINALIZADA','TIMEOUT'))
);

CREATE UNIQUE INDEX uq_sessao_viva_por_habito
    ON sessoes_execucao(habito_id) WHERE estado IN ('EM_EXECUCAO','PAUSADO');

-- ----------------------------------------------------------------------------
-- 13. sub_atividade_status — estado de cada parte no dia  (regra 3.8)
--     A API grava aqui ao executar cada parte e consulta para decidir se
--     credita as moedas da sub-atividade.
-- ----------------------------------------------------------------------------
CREATE TABLE sub_atividade_status (
    id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_atividade_id UUID    NOT NULL REFERENCES sub_atividades(id) ON DELETE CASCADE,
    data_execucao    DATE    NOT NULL,
    valor_realizado  INTEGER NOT NULL DEFAULT 0,
    executada        BOOLEAN NOT NULL DEFAULT FALSE,
    moedas_creditadas BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_subativ_status_dia UNIQUE (sub_atividade_id, data_execucao)
);

-- ----------------------------------------------------------------------------
-- 14. notificacoes — lembretes push  (F14)
-- ----------------------------------------------------------------------------
CREATE TABLE notificacoes (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id       UUID        NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    habito_id        UUID        REFERENCES habitos(id) ON DELETE CASCADE,
    sub_atividade_id UUID        REFERENCES sub_atividades(id) ON DELETE CASCADE,
    tipo             VARCHAR(20) NOT NULL,
    mensagem         TEXT,
    data_hora_envio  TIMESTAMPTZ,
    lida             BOOLEAN     NOT NULL DEFAULT FALSE,
    CONSTRAINT chk_notif_tipo CHECK (tipo IN ('LEMBRETE','URGENCIA','CONQUISTA'))
);


-- ============================================================================
-- SEÇÃO C — SEED DOS MOLDES FIXOS (regra 3.1)
-- ============================================================================
INSERT INTO categorias_habito (codigo, nome, unidade_medida, cor_hex) VALUES
    ('AGUA',      'Água',      'ml',       '#2EC4F1'),
    ('ESTUDO',    'Estudo',    'segundos', '#7C5CFC'),
    ('EXERCICIO', 'Exercício', 'segundos', '#FF8A3D');


-- ============================================================================
-- SEÇÃO D — ROADMAP (FUTURO) · NÃO faz parte do núcleo · descomente para habilitar
-- ----------------------------------------------------------------------------
-- Estruturas previstas no roadmap (seção 9 da Especificação Funcional).
-- Quando uma funcionalidade sair do roadmap, mova o bloco para a Seção B.
-- ============================================================================
--
-- -- R1. Verificação por GPS na academia (1ª/3ª Lei) --------------------------
-- ALTER TABLE habitos ADD COLUMN latitude_alvo  DECIMAL(10,8);
-- ALTER TABLE habitos ADD COLUMN longitude_alvo DECIMAL(11,8);
-- ALTER TABLE habitos ADD COLUMN raio_metros    INTEGER;
-- ALTER TABLE historico_execucoes ADD COLUMN latitude_registro  DECIMAL(10,8);
-- ALTER TABLE historico_execucoes ADD COLUMN longitude_registro DECIMAL(11,8);
-- ALTER TABLE registros_diarios   ADD COLUMN latitude_registro  DECIMAL(10,8);
-- ALTER TABLE registros_diarios   ADD COLUMN longitude_registro DECIMAL(11,8);
--
-- -- R2. Método Pomodoro no estudo (3ª Lei) ----------------------------------
-- ALTER TABLE habitos ADD COLUMN pomodoro_foco_min  INTEGER;
-- ALTER TABLE habitos ADD COLUMN pomodoro_pausa_min INTEGER;
--
-- -- R3. Micro-hábitos / Regra dos Dois Minutos (3ª Lei) ----------------------
-- CREATE TABLE micro_habitos (
--     id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
--     habito_id      UUID    NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
--     ordem_fase     INTEGER,
--     meta_pratica   TEXT,
--     meta_emocional TEXT
-- );
--
-- -- R4. Troféus / compartilhamento social (RF12, 4ª Lei) ---------------------
-- CREATE TABLE trofeus (
--     id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
--     usuario_id     UUID         NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
--     habito_id      UUID         REFERENCES habitos(id) ON DELETE SET NULL,
--     titulo         VARCHAR(150),
--     descricao      TEXT,
--     conquistado_em TIMESTAMPTZ,
--     compartilhado  BOOLEAN DEFAULT FALSE
-- );
-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================
