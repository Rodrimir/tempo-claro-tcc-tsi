-- Seed da biblioteca_textos.
--
-- Sem este arquivo a tabela ficava vazia, e GamificacaoService.obterPriming caía
-- sempre no texto fixo "Concentre-se e respire fundo. Você consegue!" — ou seja,
-- as três categorias mostravam a mesma frase e as colunas texto_sucesso_padrao,
-- texto_sucesso_extra e texto_aviso_urgencia nunca eram lidas por código nenhum.
--
-- Roda a cada boot junto do schema.sql (spring.sql.init.mode=always), por isso o
-- ON CONFLICT: a inserção precisa ser idempotente.
--
-- A UNIQUE em (categoria, idioma) é o que permite o ON CONFLICT funcionar e
-- também impede duplicatas, já que BibliotecaTextoRepository busca exatamente
-- por esse par e assume um único resultado.
CREATE UNIQUE INDEX IF NOT EXISTS ux_biblioteca_categoria_idioma
    ON biblioteca_textos (categoria, idioma);

INSERT INTO biblioteca_textos (
    id, categoria, idioma, texto_pre_tarefa,
    texto_sucesso_padrao, texto_sucesso_extra, texto_aviso_urgencia
) VALUES
(
    '3f7c1a20-8b4e-4c2d-9e11-5a6d7b8c9d01',
    'AGUA',
    'pt-BR',
    'Seu corpo é 70% água. Este copo é o intervalo entre o cansaço e a clareza.',
    'Hidratação registrada. Seu corpo agradece.',
    'Você foi além da meta. É assim que a constância vira hábito.',
    'Seu prazo de hidratação está acabando. Um copo agora salva o dia.'
),
(
    '3f7c1a20-8b4e-4c2d-9e11-5a6d7b8c9d02',
    'ESTUDAR',
    'pt-BR',
    'Não precisa entender tudo hoje. Precisa apenas começar e não parar antes do fim.',
    'Sessão concluída. O conhecimento se acumula em silêncio.',
    'Você estudou além do combinado. Esse é o tipo de esforço que compõe.',
    'O tempo de estudo está se esgotando. Comece agora, mesmo que pouco.'
),
(
    '3f7c1a20-8b4e-4c2d-9e11-5a6d7b8c9d03',
    'EXERCICIO',
    'pt-BR',
    'O corpo reclama nos primeiros cinco minutos. Depois disso, ele coopera.',
    'Treino concluído. Amanhã começa um pouco mais fácil.',
    'Você superou a meta. O corpo se adapta a quem insiste.',
    'Seu prazo de treino está terminando. Mesmo o mínimo conta mais que zero.'
)
ON CONFLICT (categoria, idioma) DO NOTHING;
