-- =============================================================================
-- Tempo Claro — Esquema do banco de dados
-- Versão 2.1 · 27/08/2026 · PostgreSQL 15+ (Neon)
--
-- Base: proposta de padronização com prefixos, revisada para restaurar
-- integridade referencial, recuperar a tabela de textos e corrigir o
-- modelo de calibração.
--
-- v2.1: incorpora as decisões D1–D4 (CLAUDE.md, Seção D):
--   D1 — este esquema é o modelo real e definitivo, não um dos dois modelos
--        possíveis. O ER da monografia é atualizado para refletir ele.
--   D2 — escudo automático às 23:59 será implementado (his_tipo_sucesso já
--        previa 'PROTEGIDO_AUTOMATICO' desde a v2.0).
--   D3 — dispositivos_push permanece no schema (não custa nada mantê-la
--        vazia) mas RF18/RF19/RNF16 são trabalho futuro — não implementar
--        agendador nem consumidor agora.
--   D4 — calibracoes/calibracao_respostas permanecem no schema para não
--        perder o desenho, mas o questionário em si é trabalho futuro.
--   Achado novo: hab_modalidade adicionada como campo pendente de
--        esclarecimento (existe no DTO real, propósito desconhecido).
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
    hab_modalidade          VARCHAR(50),   -- PENDENTE: campo real do DTO (HabitoRequestDTO.modalidade),
                                            -- propósito não confirmado. Ver CLAUDE.md, tarefa E0.5.0.
                                            -- Não usar em regra de negócio até esclarecido.
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
    sta_recorde_dias         INT NOT NULL DEFAULT 0,
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
    'Data LOCAL (fuso do dono) do último fechamento diário apurado. Torna o job idempotente.';
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
    'Data no fuso do usuário no momento da execução. Gravada pelo backend para que a
     agregação de 7 dias não precise converter fuso a cada consulta.';


-- -----------------------------------------------------------------------------
-- 7. CALIBRAÇÃO ("Medir Dificuldade")
-- Reestruturada: a calibração pertence ao HÁBITO e guarda o resultado calculado.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calibracoes (
    cab_id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cab_habito_id           UUID NOT NULL,
    cab_meta_sugerida       INT NOT NULL,
    cab_incremento_sugerido INT NOT NULL DEFAULT 0,
    cab_aceita              BOOLEAN NOT NULL DEFAULT FALSE,
    cab_criado_em           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cab_habito FOREIGN KEY (cab_habito_id)
        REFERENCES habitos (hab_id) ON DELETE CASCADE,
    CONSTRAINT ck_cab_meta CHECK (cab_meta_sugerida >= 1)
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
-- 9. ÍNDICES
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS ix_hab_usuario_ativo
    ON habitos (hab_usuario_id, hab_ativo);

CREATE INDEX IF NOT EXISTS ix_sub_habito
    ON sub_atividades (sub_habito_id, sub_ordem);

-- Sustenta a agregação dos últimos 7 dias (RNF05)
CREATE INDEX IF NOT EXISTS ix_his_habito_data
    ON historico_execucoes (his_habito_id, his_data_local DESC);

-- Sustenta a varredura horária do fechamento diário
CREATE INDEX IF NOT EXISTS ix_sta_reset
    ON status_habitos (sta_ultimo_reset);

CREATE INDEX IF NOT EXISTS ix_dis_usuario
    ON dispositivos_push (dis_usuario_id) WHERE dis_ativo;


-- -----------------------------------------------------------------------------
-- 10. VIEW DE DERIVAÇÃO — estado do hábito hoje
-- Existe para que o campo "status" do DTO (tarefa E1.1) tenha uma fonte única,
-- em vez de a regra ser reescrita em cada consulta.
--
-- E1.1: virou a fonte ÚNICA de HabitoResponseDTO inteiro (HabitoHojeRepository
-- lê direto daqui), não só do campo status — por isso hab_tipo_medida,
-- hab_modalidade e sta_bloqueio_usado_hoje foram adicionados ao final do
-- SELECT (a view já não tinha esses três, que o DTO sempre teve). Acrescentar
-- no FIM da lista, sem mexer na ordem das colunas existentes, é o que permite
-- o CREATE OR REPLACE VIEW continuar idempotente a cada boot sem precisar de
-- DROP VIEW antes.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW vw_habito_hoje AS
SELECT
    h.hab_id,
    h.hab_usuario_id,
    h.hab_titulo,
    h.hab_categoria,
    h.hab_meta_base,
    s.sta_execucoes_hoje,
    s.sta_valor_acumulado_hoje,
    s.sta_dias_seguidos,
    s.sta_moedas_locais,
    s.sta_bloqueios_acumulados,
    s.sta_nivel_avatar,
    s.sta_proximo_vencimento,
    COALESCE(sub.total_ocorrencias, 1) AS meta_frequencia_diaria,
    CASE
        WHEN s.sta_execucoes_hoje >= COALESCE(sub.total_ocorrencias, 1)
        THEN 'COMPLETED' ELSE 'PENDING'
    END AS status_hoje,
    h.hab_tipo_medida,
    h.hab_modalidade,
    s.sta_bloqueio_usado_hoje,
    -- @audit-ok [E2.3 — acrescentadas no fim da lista de colunas de propósito:
    -- CREATE OR REPLACE VIEW não permite remover/reordenar colunas já
    -- existentes, só adicionar no fim (mesma regra já seguida na E1.1).]
    h.hab_meta_maxima,
    h.hab_incremento,
    h.hab_dias_incremento,
    -- @audit-ok [E2.4 — idem: acrescentada no fim, mesma regra do CREATE OR
    -- REPLACE VIEW já seguida na E1.1 e na E2.3.]
    h.hab_frequencia_semanal,
    -- @audit-ok [E4.1 — idem: acrescentada no fim, mesma regra já seguida
    -- acima. Coluna existe desde sempre (hab_gatilho_ancora), só nunca tinha
    -- sido lida por nenhum consumidor de vw_habito_hoje.]
    h.hab_gatilho_ancora
FROM habitos h
JOIN status_habitos s ON s.sta_habito_id = h.hab_id
LEFT JOIN (
    SELECT sub_habito_id, COUNT(*) AS total_ocorrencias
    FROM sub_atividades GROUP BY sub_habito_id
) sub ON sub.sub_habito_id = h.hab_id
WHERE h.hab_ativo;


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
     'Seu treino de hoje ainda não foi feito.')
ON CONFLICT (bib_categoria, bib_idioma) DO NOTHING;
