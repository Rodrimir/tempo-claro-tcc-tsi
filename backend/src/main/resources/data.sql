-- ============================================================================
-- Tempo Claro — Seed de dados (idempotente; pode ser executado várias vezes)
-- Ordem: categorias -> avatares -> biblioteca de textos
-- Observação: com spring.sql.init.mode=never este arquivo NÃO roda no boot;
--             aplique manualmente (psql) ou troque o modo para "always".
-- ============================================================================

-- 1) Moldes fixos (regra 3.1) -------------------------------------------------
INSERT INTO categorias_habito (codigo, nome, unidade_medida, cor_hex)
VALUES
    ('AGUA',      'Água',      'ml',       '#2EC4F1'),
    ('ESTUDO',    'Estudo',    'segundos', '#7C5CFC'),
    ('EXERCICIO', 'Exercício', 'segundos', '#FF8A3D')
ON CONFLICT (codigo) DO NOTHING;

-- 2) Catálogo de avatares (F05) ----------------------------------------------
-- Para cada molde: 4 níveis de evolução (ofensiva 0/10/20/30) x 6 expressões.
-- A API seleciona o maior streak_minimo <= ofensiva atual e a expressão do
-- estado de urgência (derivado no cliente pelo horário).
INSERT INTO avatares_catalogo
    (categoria_id, nome, streak_minimo, estado_expressao, asset_visual_url, ordem_evolucao)
SELECT c.id,
       c.nome || ' Nível ' || t.tier,
       t.tier,
       e.estado,
       '/assets/avatares/' || lower(c.codigo) || '/' || lower(e.estado)
           || '_' || lpad(t.tier::text, 2, '0') || '.png',
       t.tier / 10
FROM categorias_habito c
CROSS JOIN (VALUES (0), (10), (20), (30)) AS t(tier)
CROSS JOIN (VALUES ('NORMAL'), ('PREOCUPADO'), ('DESESPERADO'),
                   ('CONCLUIDO'), ('SUCESSO'), ('FALHA')) AS e(estado)
ON CONFLICT (categoria_id, streak_minimo, estado_expressao) DO NOTHING;

-- 3) Biblioteca de textos (F06 priming / F13 feedback) -----------------------
-- Um conjunto por molde + um genérico (categoria_id NULL) usado como fallback.
INSERT INTO biblioteca_textos
    (categoria_id, idioma, texto_pre_tarefa, texto_sucesso_padrao, texto_sucesso_extra, texto_aviso_urgencia)
SELECT (SELECT id FROM categorias_habito WHERE codigo = 'AGUA'), 'pt-BR',
       'Hora de se hidratar. Um gole agora é um presente para o seu corpo.',
       'Meta batida! Seu corpo agradece cada gota.',
       'Incrível! Você foi muito além da meta. Hidratação nível máximo!',
       'Seu corpo está pedindo água. Que tal um gole agora?'
WHERE NOT EXISTS (
    SELECT 1 FROM biblioteca_textos
    WHERE categoria_id IS NOT DISTINCT FROM (SELECT id FROM categorias_habito WHERE codigo = 'AGUA')
      AND idioma = 'pt-BR');

INSERT INTO biblioteca_textos
    (categoria_id, idioma, texto_pre_tarefa, texto_sucesso_padrao, texto_sucesso_extra, texto_aviso_urgencia)
SELECT (SELECT id FROM categorias_habito WHERE codigo = 'ESTUDO'), 'pt-BR',
       'Respire fundo. Os próximos minutos são só seus e do seu foco.',
       'Sessão concluída! Conhecimento se constrói um tijolo por vez.',
       'Impressionante! Você estudou muito além do combinado.',
       'Seu momento de estudo está chegando. Prepare o ambiente.'
WHERE NOT EXISTS (
    SELECT 1 FROM biblioteca_textos
    WHERE categoria_id IS NOT DISTINCT FROM (SELECT id FROM categorias_habito WHERE codigo = 'ESTUDO')
      AND idioma = 'pt-BR');

INSERT INTO biblioteca_textos
    (categoria_id, idioma, texto_pre_tarefa, texto_sucesso_padrao, texto_sucesso_extra, texto_aviso_urgencia)
SELECT (SELECT id FROM categorias_habito WHERE codigo = 'EXERCICIO'), 'pt-BR',
       'Seu corpo foi feito para se mover. Vamos com tudo!',
       'Treino concluído! Mais forte hoje do que ontem.',
       'Você superou seus limites! Que energia incrível!',
       'Está quase na hora do treino. Vista a roupa e bora!'
WHERE NOT EXISTS (
    SELECT 1 FROM biblioteca_textos
    WHERE categoria_id IS NOT DISTINCT FROM (SELECT id FROM categorias_habito WHERE codigo = 'EXERCICIO')
      AND idioma = 'pt-BR');

INSERT INTO biblioteca_textos
    (categoria_id, idioma, texto_pre_tarefa, texto_sucesso_padrao, texto_sucesso_extra, texto_aviso_urgencia)
SELECT NULL, 'pt-BR',
       'Concentre-se e respire fundo. Você consegue!',
       'Excelente trabalho! Continue assim.',
       'Incrível! Você superou a sua meta!',
       'Amanhã é um novo começo. Nunca falhe duas vezes.'
WHERE NOT EXISTS (
    SELECT 1 FROM biblioteca_textos
    WHERE categoria_id IS NULL AND idioma = 'pt-BR');
