-- 1. Usuários
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    fuso_horario VARCHAR(100) DEFAULT 'America/Sao_Paulo',
    preferencia_idioma VARCHAR(10) DEFAULT 'pt-BR',
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Biblioteca de Textos
CREATE TABLE biblioteca_textos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria VARCHAR(50), 
    idioma VARCHAR(10) DEFAULT 'pt-BR',
    texto_pre_tarefa TEXT,
    texto_sucesso_padrao TEXT,
    texto_sucesso_extra TEXT,
    texto_aviso_urgencia TEXT
);

-- 3. Hábitos
CREATE TABLE habitos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(100) NOT NULL,
    categoria VARCHAR(50), 
    gatilho_ancora VARCHAR(100),
    tipo_medida VARCHAR(20) CHECK (tipo_medida IN ('TEMPO', 'QUANTIDADE')), 
    modalidade VARCHAR(20) CHECK (modalidade IN ('DIARIA', 'INTERVALADA')), 
    horario_agendado TIME, 
    meta_base INT NOT NULL CHECK (meta_base > 0), 
    meta_frequencia_diaria INT DEFAULT 1, 
    intervalo_minutos INT,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Status do Hábito
CREATE TABLE status_habitos (
    habito_id UUID PRIMARY KEY REFERENCES habitos(id) ON DELETE CASCADE,
    moedas_locais INT DEFAULT 0 CHECK (moedas_locais >= 0),
    bloqueios_acumulados INT DEFAULT 0 CHECK (bloqueios_acumulados >= 0),
    dias_seguidos INT DEFAULT 0 CHECK (dias_seguidos >= 0), 
    execucoes_hoje INT DEFAULT 0, 
    proximo_vencimento TIMESTAMP WITH TIME ZONE,
    bloqueio_usado_hoje BOOLEAN DEFAULT false 
);

-- 5. Histórico (Auditoria)
CREATE TABLE historico_execucoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habito_id UUID REFERENCES habitos(id) ON DELETE CASCADE,
    execution_token UUID UNIQUE NOT NULL,
    data_hora_execucao TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    valor_realizado INT NOT NULL CHECK (valor_realizado >= 0),
    moedas_ganhas INT DEFAULT 0 CHECK (moedas_ganhas >= 0),
    tipo_sucesso VARCHAR(30) NOT NULL 
    CHECK (tipo_sucesso IN ('COMPLETE_PADRAO', 'COMPLETE_EXTRA', 'FAIL_VOLUNTARY', 'FAIL_TIMEOUT', 'BLOCK_ACTIVE'))
);