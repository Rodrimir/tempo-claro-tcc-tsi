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
    execution_token UUID UNIQUE,
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
    bloqueio_usado_hoje BOOLEAN,
    ultimo_reset DATE
);

-- Marca o último dia (no fuso do usuário) em que o FechamentoDiarioJob já zerou
-- os contadores diários deste hábito. Sem essa coluna não há como saber se a
-- virada de dia já foi apurada, e o reset rodaria repetidamente ou nunca.
-- ADD COLUMN IF NOT EXISTS mantém o script idempotente: o schema.sql roda a cada
-- boot (spring.sql.init.mode=always) e precisa atualizar bancos já existentes,
-- já que o projeto não usa Flyway/Liquibase.
ALTER TABLE status_habitos ADD COLUMN IF NOT EXISTS ultimo_reset DATE;
