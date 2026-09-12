-- =============================================================================
-- Tempo Claro — Esquema do banco de dados
-- Versão 3.0 · PostgreSQL 15+ (Neon)
--
-- Base: proposta de padronização com prefixos, revisada para restaurar
-- integridade referencial, recuperar a tabela de textos e corrigir o
-- modelo de calibração.
--
-- v3.0: alinhamento com a monografia (plano "Backend Tempo Claro").
--   — vw_habito_hoje REMOVIDA. A §4.5 da monografia determina que o banco
--     guarde apenas fatos e estado, "sem conter regras de negócio, gatilhos
--     (triggers), visões (views) ou funções". A derivação de status_hoje e de
--     meta_frequencia_diaria voltou para HabitoService.
--   — hab_modalidade REMOVIDA: não tinha origem em nenhum RF/F/UC e nenhuma
--     regra ramificava sobre ela.
--   — sta_recorde_dias REMOVIDA: sem campo Java, sem leitura, sem requisito.
--     F18 é o recorde de VALOR do período, calculado em StatsService.
--   — calibracoes reestruturada: a calibração (RF20) acontece ANTES de o
--     hábito existir, então pertence ao USUÁRIO + categoria e só depois é
--     vinculada ao hábito que nasceu dela.
--   — sta_valor_acumulado_hoje passa a ser escrita e lida: é a base da
--     avaliação da meta (RF07) e do crédito diferido de moedas (RF11/RF12).
--   — his_sub_atividade_id passa a ser preenchida: é o que permite creditar
--     por sub-atividade executada (RF12).
--
-- v2.1 (histórico): dispositivos_push permanece no schema, mas RF18/RF19 são
--   trabalho futuro pela própria §8.1 da monografia — sem agendador nem
--   consumidor. 'PROTEGIDO_AUTOMATICO' já estava previsto em his_tipo_sucesso
--   e agora é de fato gravado pelo escudo automático do fechamento.
--
-- Execução: spring.sql.init.mode=always — o script roda a cada boot.
-- Todo comando é idempotente (IF NOT EXISTS / ON CONFLICT DO NOTHING).
--
-- CONVENÇÃO DE FUSO HORÁRIO
--   Todo instante é TIMESTAMPTZ e trafega em UTC.
--   ÚNICA EXCEÇÃO: sta_ultimo_reset é DATE e representa a data LOCAL do
--   usuário (usu_fuso_horario). Nunca compare essa coluna com CURRENT_DATE
--   do servidor — converta antes para o fuso do dono do hábito.
--   usu_fuso_horario guarda identificador IANA ("America/Sao_Paulo"),
--   nunca sigla ("BRT" não é resolvível pelo java.time).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. USUÁRIOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    usu_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usu_nome                VARCHAR(150) NOT NULL,
    usu_email               VARCHAR(255) UNIQUE NOT NULL,
    usu_senha_hash          VARCHAR(255) NOT NULL,
    usu_fuso_horario        VARCHAR(64)  NOT NULL DEFAULT 'America/Sao_Paulo',
    usu_preferencia_idioma  VARCHAR(10)  NOT NULL DEFAULT 'pt-BR',
    usu_tema                VARCHAR(10)  NOT NULL DEFAULT 'sistema',
    usu_criado_em           TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    usu_atualizado_em       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT ck_usu_tema  CHECK (usu_tema IN ('claro', 'escuro', 'sistema')),
    CONSTRAINT ck_usu_email CHECK (usu_email LIKE '%@%')
);

COMMENT ON COLUMN usuarios.usu_fuso_horario IS
    'Identificador IANA (America/Sao_Paulo). Governa a virada do dia no fechamento diário.';


-- -----------------------------------------------------------------------------
-- 2. BIBLIOTECA DE TEXTOS
-- Restaurada: alimenta /pretask, /success e /fail. A coluna de aviso de
-- urgência passa a ser usada quando sta_proximo_vencimento for preenchido.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS biblioteca_textos (
    bib_id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bib_categoria             VARCHAR(50) NOT NULL,
    bib_idioma                VARCHAR(10) NOT NULL DEFAULT 'pt-BR',
    bib_texto_pre_tarefa      TEXT NOT NULL,
    bib_texto_sucesso_padrao  TEXT NOT NULL,
    bib_texto_sucesso_extra   TEXT NOT NULL,
    bib_texto_aviso_urgencia  TEXT,

    CONSTRAINT uq_bib_categoria_idioma UNIQUE (bib_categoria, bib_idioma),
    CONSTRAINT ck_bib_categoria CHECK (bib_categoria IN ('AGUA', 'ESTUDO', 'EXERCICIO'))
);


-- -----------------------------------------------------------------------------
-- 3. HÁBITOS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS habitos (
    hab_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hab_usuario_id          UUID NOT NULL,
    hab_titulo              VARCHAR(60)  NOT NULL,
    hab_categoria           VARCHAR(50)  NOT NULL,
    hab_tipo_medida         VARCHAR(20)  NOT NULL,
    hab_gatilho_ancora      VARCHAR(120),
    hab_meta_base           INT NOT NULL DEFAULT 1,
    hab_meta_maxima         INT,
    hab_incremento          INT NOT NULL DEFAULT 0,
    hab_dias_incremento     INT NOT NULL DEFAULT 10,
    hab_frequencia_semanal  CHAR(7) NOT NULL DEFAULT '1111111',
    hab_ativo               BOOLEAN NOT NULL DEFAULT TRUE,
    hab_criado_em           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hab_arquivado_em        TIMESTAMPTZ,

    CONSTRAINT fk_hab_usuario FOREIGN KEY (hab_usuario_id)
        REFERENCES usuarios (usu_id) ON DELETE CASCADE,

    CONSTRAINT ck_hab_tipo_medida CHECK (hab_tipo_medida IN ('TEMPO', 'QUANTIDADE')),
    CONSTRAINT ck_hab_categoria   CHECK (hab_categoria IN ('AGUA', 'ESTUDO', 'EXERCICIO')),
    CONSTRAINT ck_hab_meta_base   CHECK (hab_meta_base >= 1),
    CONSTRAINT ck_hab_incremento  CHECK (hab_incremento >= 0),
    CONSTRAINT ck_hab_dias_incr   CHECK (hab_dias_incremento >= 1),
    CONSTRAINT ck_hab_teto        CHECK (hab_meta_maxima IS NULL OR hab_meta_maxima >= hab_meta_base),
    CONSTRAINT ck_hab_freq        CHECK (hab_frequencia_semanal ~ '^[01]{7}$'
                                         AND hab_frequencia_semanal <> '0000000')
);

COMMENT ON COLUMN habitos.hab_frequencia_semanal IS
    'Máscara de 7 posições, domingo a sábado. "1111100" = domingo a quinta.';
COMMENT ON COLUMN habitos.hab_incremento IS
    'Quanto somar a hab_meta_base a cada hab_dias_incremento dias de ofensiva. 0 desliga a progressão.';


-- -----------------------------------------------------------------------------
-- 4. SUB-ATIVIDADES
-- Cada ocorrência diária do hábito. Um hábito de 1x/dia tem 1 linha.
-- A contagem de linhas É a meta de frequência diária — não há coluna duplicada.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sub_atividades (
    sub_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sub_habito_id       UUID NOT NULL,
    sub_ordem           SMALLINT NOT NULL,
    sub_horario_inicio  TIME NOT NULL,
    sub_horario_fim     TIME,
    sub_alvo            INT NOT NULL,

    CONSTRAINT fk_sub_habito FOREIGN KEY (sub_habito_id)
        REFERENCES habitos (hab_id) ON DELETE CASCADE,

    CONSTRAINT uq_sub_habito_ordem UNIQUE (sub_habito_id, sub_ordem),
    CONSTRAINT ck_sub_ordem        CHECK (sub_ordem BETWEEN 1 AND 12),
    CONSTRAINT ck_sub_alvo         CHECK (sub_alvo >= 1),
    CONSTRAINT ck_sub_janela       CHECK (sub_horario_fim IS NULL OR sub_horario_fim > sub_horario_inicio)
);

COMMENT ON COLUMN sub_atividades.sub_alvo IS
    'Alvo desta ocorrência. A soma dos sub_alvo do hábito deve igualar hab_meta_base.';


-- -----------------------------------------------------------------------------
-- 5. STATUS DO HÁBITO — a economia isolada vive aqui
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS status_habitos (
    sta_habito_id            UUID PRIMARY KEY,
    sta_moedas_locais        INT NOT NULL DEFAULT 0,
    sta_bloqueios_acumulados INT NOT NULL DEFAULT 0,
    sta_dias_seguidos        INT NOT NULL DEFAULT 0,
    sta_execucoes_hoje       INT NOT NULL DEFAULT 0,
    sta_valor_acumulado_hoje INT NOT NULL DEFAULT 0,
    sta_nivel_avatar         INT NOT NULL DEFAULT 1,
    sta_proximo_vencimento   TIMESTAMPTZ,
    sta_bloqueio_usado_hoje  BOOLEAN NOT NULL DEFAULT FALSE,
    sta_ultimo_reset         DATE,

    CONSTRAINT fk_sta_habito FOREIGN KEY (sta_habito_id)
        REFERENCES habitos (hab_id) ON DELETE CASCADE,

    CONSTRAINT ck_sta_moedas    CHECK (sta_moedas_locais >= 0),
    CONSTRAINT ck_sta_bloqueios CHECK (sta_bloqueios_acumulados >= 0),
    CONSTRAINT ck_sta_dias      CHECK (sta_dias_seguidos >= 0),
    CONSTRAINT ck_sta_nivel     CHECK (sta_nivel_avatar >= 1)
);

COMMENT ON COLUMN status_habitos.sta_ultimo_reset IS
    'Data LOCAL (fuso do dono) do último dia JÁ APURADO pelo fechamento. Torna o job
     idempotente e permite apurar dias pulados: tudo entre esta data e ontem ainda
     precisa ser fechado.';
COMMENT ON COLUMN status_habitos.sta_valor_acumulado_hoje IS
    'Soma do realizado no dia. Base da avaliação da meta na janela 00:00-23:59 local.';


-- -----------------------------------------------------------------------------
-- 6. HISTÓRICO DE EXECUÇÕES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historico_execucoes (
    his_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    his_habito_id       UUID NOT NULL,
    his_sub_atividade_id UUID,
    his_execution_token UUID UNIQUE NOT NULL,
    his_valor_realizado INT NOT NULL DEFAULT 0,
    his_tipo_sucesso    VARCHAR(30) NOT NULL,
    his_moedas_ganhas   INT NOT NULL DEFAULT 0,
    his_data_hora       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    his_data_local      DATE NOT NULL,

    CONSTRAINT fk_his_habito FOREIGN KEY (his_habito_id)
        REFERENCES habitos (hab_id) ON DELETE CASCADE,
    CONSTRAINT fk_his_sub FOREIGN KEY (his_sub_atividade_id)
        REFERENCES sub_atividades (sub_id) ON DELETE SET NULL,

    CONSTRAINT ck_his_tipo CHECK (his_tipo_sucesso IN (
        'COMPLETE_PADRAO',
        'COMPLETE_EXTRA',
        'DESISTENCIA',
        'PROTEGIDO_ESCUDO',
        'PROTEGIDO_AUTOMATICO'
    )),
    CONSTRAINT ck_his_valor  CHECK (his_valor_realizado >= 0),
    CONSTRAINT ck_his_moedas CHECK (his_moedas_ganhas >= 0)
);

COMMENT ON COLUMN historico_execucoes.his_data_local IS
    'Data no fuso do usuário (usu_fuso_horario) no momento da execução — NUNCA a data
     da JVM. Gravada pelo backend para que a agregação mensal não precise converter
     fuso a cada consulta.';
COMMENT ON COLUMN historico_execucoes.his_sub_atividade_id IS
    'Ocorrência que esta execução cobriu. Base do rateio de moedas por sub-atividade
     executada no fechamento do dia (RF12).';


-- -----------------------------------------------------------------------------
-- 7. CALIBRAÇÃO ("Medir Dificuldade") — RF20 / RNF04
-- A calibração acontece no Passo 2 do assistente, ANTES de o hábito existir:
-- pertence ao USUÁRIO + categoria. cab_habito_id só é preenchido se/quando a
-- sugestão vira um hábito de verdade (cab_aceita = TRUE).
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calibracoes (
    cab_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cab_usuario_id          UUID NOT NULL,
    cab_categoria           VARCHAR(50) NOT NULL,
    cab_habito_id           UUID,
    cab_versao_catalogo     INT NOT NULL DEFAULT 1,
    cab_pontuacao           INT NOT NULL DEFAULT 0,
    cab_meta_sugerida       INT NOT NULL,
    cab_meta_maxima_sugerida INT,
    cab_incremento_sugerido INT NOT NULL DEFAULT 0,
    cab_dias_incremento_sugerido INT NOT NULL DEFAULT 10,
    cab_vezes_ao_dia_sugerida    INT NOT NULL DEFAULT 1,
    cab_frequencia_semanal_sugerida CHAR(7) NOT NULL DEFAULT '1111111',
    cab_aceita              BOOLEAN NOT NULL DEFAULT FALSE,
    cab_criado_em           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cab_usuario FOREIGN KEY (cab_usuario_id)
        REFERENCES usuarios (usu_id) ON DELETE CASCADE,
    CONSTRAINT fk_cab_habito FOREIGN KEY (cab_habito_id)
        REFERENCES habitos (hab_id) ON DELETE CASCADE,
    CONSTRAINT ck_cab_meta      CHECK (cab_meta_sugerida >= 1),
    CONSTRAINT ck_cab_categoria CHECK (cab_categoria IN ('AGUA', 'ESTUDO', 'EXERCICIO')),
    CONSTRAINT ck_cab_vezes     CHECK (cab_vezes_ao_dia_sugerida BETWEEN 1 AND 12),
    CONSTRAINT ck_cab_freq      CHECK (cab_frequencia_semanal_sugerida ~ '^[01]{7}$'
                                       AND cab_frequencia_semanal_sugerida <> '0000000')
);

CREATE TABLE IF NOT EXISTS calibracao_respostas (
    cal_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cal_calibracao_id    UUID NOT NULL,
    cal_pergunta_codigo  VARCHAR(40) NOT NULL,
    cal_resposta         VARCHAR(120) NOT NULL,

    CONSTRAINT fk_cal_calibracao FOREIGN KEY (cal_calibracao_id)
        REFERENCES calibracoes (cab_id) ON DELETE CASCADE,
    CONSTRAINT uq_cal_pergunta UNIQUE (cal_calibracao_id, cal_pergunta_codigo)
);

COMMENT ON COLUMN calibracao_respostas.cal_pergunta_codigo IS
    'Código estável da pergunta (DIAS_DISPONIVEIS, EXPERIENCIA_PREVIA...), não o
     enunciado. Permite recalcular a sugestão se o algoritmo mudar.';


-- -----------------------------------------------------------------------------
-- 8. DISPOSITIVOS PUSH
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dispositivos_push (
    dis_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dis_usuario_id        UUID NOT NULL,
    dis_token_dispositivo VARCHAR(255) UNIQUE NOT NULL,
    dis_plataforma        VARCHAR(20) NOT NULL DEFAULT 'ANDROID',
    dis_ativo             BOOLEAN NOT NULL DEFAULT TRUE,
    dis_criado_em         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dis_ultimo_uso        TIMESTAMPTZ,

    CONSTRAINT fk_dis_usuario FOREIGN KEY (dis_usuario_id)
        REFERENCES usuarios (usu_id) ON DELETE CASCADE,
    CONSTRAINT ck_dis_plataforma CHECK (dis_plataforma IN ('ANDROID', 'WEB'))
);


-- -----------------------------------------------------------------------------
-- 9. MIGRAÇÕES IDEMPOTENTES
--
-- CREATE TABLE IF NOT EXISTS não altera tabela que já existe: um banco criado
-- por uma versão anterior deste script continuaria com as colunas antigas, e
-- o Hibernate (ddl-auto=validate) recusaria subir. Estes comandos são o que
-- leva um banco v2.1 para a v3.0 — e são inofensivos num banco novo, onde as
-- colunas já nascem no formato certo.
-- -----------------------------------------------------------------------------

-- v3.0: a §4.5 da monografia proíbe views no banco.
DROP VIEW IF EXISTS vw_habito_hoje;

-- v3.0: colunas sem lastro em requisito.
ALTER TABLE habitos        DROP COLUMN IF EXISTS hab_modalidade;
ALTER TABLE status_habitos DROP COLUMN IF EXISTS sta_recorde_dias;

-- v3.0: calibração deixa de pertencer ao hábito e passa a pertencer ao usuário.
ALTER TABLE calibracoes ALTER COLUMN cab_habito_id DROP NOT NULL;
ALTER TABLE calibracoes ADD COLUMN IF NOT EXISTS cab_usuario_id UUID
    REFERENCES usuarios (usu_id) ON DELETE CASCADE;
ALTER TABLE calibracoes ADD COLUMN IF NOT EXISTS cab_categoria VARCHAR(50);
ALTER TABLE calibracoes ADD COLUMN IF NOT EXISTS cab_versao_catalogo INT NOT NULL DEFAULT 1;
ALTER TABLE calibracoes ADD COLUMN IF NOT EXISTS cab_pontuacao INT NOT NULL DEFAULT 0;
ALTER TABLE calibracoes ADD COLUMN IF NOT EXISTS cab_meta_maxima_sugerida INT;
ALTER TABLE calibracoes ADD COLUMN IF NOT EXISTS cab_dias_incremento_sugerido INT NOT NULL DEFAULT 10;
ALTER TABLE calibracoes ADD COLUMN IF NOT EXISTS cab_vezes_ao_dia_sugerida INT NOT NULL DEFAULT 1;
ALTER TABLE calibracoes ADD COLUMN IF NOT EXISTS cab_frequencia_semanal_sugerida CHAR(7) NOT NULL DEFAULT '1111111';
-- cab_usuario_id e cab_categoria nascem NOT NULL num banco novo, mas ficam
-- nuláveis num banco migrado: ADD COLUMN ... NOT NULL sem DEFAULT falha se a
-- tabela tiver linhas, e abortar o script no boot seria pior que a diferença.
-- ddl-auto=validate confere existência e tipo, não nulabilidade.

-- Os COMMENT das colunas de calibracoes vêm só agora, e não junto do CREATE
-- TABLE: num banco criado por uma versão anterior o CREATE é um no-op, e as
-- colunas só passam a existir nos ALTER acima.
COMMENT ON COLUMN calibracoes.cab_versao_catalogo IS
    'Versão do catálogo de perguntas (resources/calibracao/catalogo-vN.json) usada
     nesta calibração. Permite reinterpretar respostas antigas quando os moldes mudam.';
COMMENT ON COLUMN calibracoes.cab_pontuacao IS
    'Soma dos pesos das respostas — o "ranking" que define a faixa de meta sugerida.';



-- -----------------------------------------------------------------------------
-- 10. ÍNDICES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS ix_hab_usuario_ativo
    ON habitos (hab_usuario_id, hab_ativo);

CREATE INDEX IF NOT EXISTS ix_sub_habito
    ON sub_atividades (sub_habito_id, sub_ordem);

-- Sustenta a agregação mensal das estatísticas (RNF05)
CREATE INDEX IF NOT EXISTS ix_his_habito_data
    ON historico_execucoes (his_habito_id, his_data_local DESC);

-- Sustenta a varredura horária do fechamento diário
CREATE INDEX IF NOT EXISTS ix_sta_reset
    ON status_habitos (sta_ultimo_reset);

CREATE INDEX IF NOT EXISTS ix_dis_usuario
    ON dispositivos_push (dis_usuario_id) WHERE dis_ativo;

-- Sustenta a busca da calibração pendente do usuário por categoria (RF20)
CREATE INDEX IF NOT EXISTS ix_cab_usuario
    ON calibracoes (cab_usuario_id, cab_criado_em DESC);

-- -----------------------------------------------------------------------------
-- 11. CARGA INICIAL — a aplicação depende destes textos
-- -----------------------------------------------------------------------------
INSERT INTO biblioteca_textos
    (bib_categoria, bib_idioma, bib_texto_pre_tarefa,
     bib_texto_sucesso_padrao, bib_texto_sucesso_extra, bib_texto_aviso_urgencia)
VALUES
    ('AGUA', 'pt-BR',
     'Seu corpo agradece cada gole. Vamos começar?',
     'Hidratação em dia. Seu corpo sente a diferença.',
     'Você foi além da meta. Excelente.',
     'A hora da sua hidratação está chegando.'),
    ('ESTUDO', 'pt-BR',
     'Um bloco de foco de cada vez. É assim que se constrói.',
     'Mais um bloco concluído. O conhecimento se acumula.',
     'Você estudou além do combinado. Impressionante.',
     'Seu bloco de estudo está prestes a vencer.'),
    ('EXERCICIO', 'pt-BR',
     'O primeiro minuto é o mais difícil. Depois dele, é só seguir.',
     'Treino concluído. Disciplina construída.',
     'Você superou a meta de hoje. Continue assim.',
     'Seu treino de hoje ainda não foi feito.'),

    -- RNF13: a tabela é indexada por (categoria, idioma) justamente para isto.
    -- Sem estas linhas, um usuário em inglês receberia o texto padrão fixo do
    -- serviço, e a tradução pararia na borda da interface.
    ('AGUA', 'en-US',
     'Your body thanks you for every sip. Shall we start?',
     'Hydration on track. Your body can tell the difference.',
     'You went past your goal. Excellent.',
     'Your hydration time is coming up.'),
    ('ESTUDO', 'en-US',
     'One block of focus at a time. That is how it gets built.',
     'Another block done. Knowledge adds up.',
     'You studied beyond what you planned. Impressive.',
     'Your study block is about to expire.'),
    ('EXERCICIO', 'en-US',
     'The first minute is the hardest. After that, you just keep going.',
     'Workout done. Discipline built.',
     'You beat today''s goal. Keep it up.',
     'You have not done today''s workout yet.')
ON CONFLICT (bib_categoria, bib_idioma) DO NOTHING;
