CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS usuarios (
    id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    nome               VARCHAR(150) NOT NULL,
    email              VARCHAR(255) NOT NULL UNIQUE,
    senha_hash         VARCHAR(255) NOT NULL,
    fuso_horario       VARCHAR(50)  NOT NULL DEFAULT 'America/Sao_Paulo',
    preferencia_idioma VARCHAR(10)  NOT NULL DEFAULT 'pt-BR',
    criado_em          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categorias_habito (
    id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo         VARCHAR(20) NOT NULL UNIQUE,
    nome           VARCHAR(100) NOT NULL,
    unidade_medida VARCHAR(20) NOT NULL,
    cor_hex        VARCHAR(7),
    icone_url      VARCHAR(255),
    CONSTRAINT chk_categoria_codigo CHECK (codigo IN ('AGUA','ESTUDO','EXERCICIO'))
);

CREATE TABLE IF NOT EXISTS habitos (
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

CREATE TABLE IF NOT EXISTS sub_atividades (
    id             UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    habito_id      UUID    NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    ordem          INTEGER NOT NULL,
    alvo_parcial   INTEGER NOT NULL,
    horario_inicio TIME,
    horario_fim    TIME,
    CONSTRAINT uq_subativ_ordem UNIQUE (habito_id, ordem),
    CONSTRAINT chk_subativ_alvo CHECK (alvo_parcial > 0)
);

CREATE TABLE IF NOT EXISTS habito_dias_semana (
    habito_id  UUID    NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL,
    PRIMARY KEY (habito_id, dia_semana),
    CONSTRAINT chk_dia_semana CHECK (dia_semana BETWEEN 0 AND 6)
);

CREATE TABLE IF NOT EXISTS perfil_onboarding (
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

CREATE TABLE IF NOT EXISTS avatares_catalogo (
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

CREATE TABLE IF NOT EXISTS biblioteca_textos (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id         UUID        REFERENCES categorias_habito(id) ON DELETE CASCADE,
    idioma               VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    texto_pre_tarefa     TEXT,
    texto_sucesso_padrao TEXT,
    texto_sucesso_extra  TEXT,
    texto_aviso_urgencia TEXT
);

CREATE TABLE IF NOT EXISTS historico_execucoes (
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

CREATE TABLE IF NOT EXISTS registros_diarios (
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

CREATE TABLE IF NOT EXISTS transacoes_moedas (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    habito_id   UUID        NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
    execucao_id UUID        REFERENCES historico_execucoes(id) ON DELETE SET NULL,
    tipo        VARCHAR(30) NOT NULL,
    valor       INTEGER     NOT NULL,
    data_hora   TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_transacao_tipo CHECK (tipo IN
        ('CREDITO_META','CREDITO_BONUS','CREDITO_SUBATIVIDADE','DEBITO_ESCUDO'))
);

CREATE TABLE IF NOT EXISTS sessoes_execucao (
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

CREATE UNIQUE INDEX IF NOT EXISTS uq_sessao_viva_por_habito
    ON sessoes_execucao(habito_id) WHERE estado IN ('EM_EXECUCAO','PAUSADO');

CREATE TABLE IF NOT EXISTS sub_atividade_status (
    id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_atividade_id UUID    NOT NULL REFERENCES sub_atividades(id) ON DELETE CASCADE,
    data_execucao    DATE    NOT NULL,
    valor_realizado  INTEGER NOT NULL DEFAULT 0,
    executada        BOOLEAN NOT NULL DEFAULT FALSE,
    moedas_creditadas BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_subativ_status_dia UNIQUE (sub_atividade_id, data_execucao)
);

CREATE TABLE IF NOT EXISTS notificacoes (
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
