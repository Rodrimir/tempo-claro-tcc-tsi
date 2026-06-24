INSERT INTO categorias_habito (codigo, nome, unidade_medida, cor_hex) 
VALUES 
    ('AGUA',      'Água',      'ml',       '#2EC4F1'),
    ('ESTUDO',    'Estudo',    'segundos', '#7C5CFC'),
    ('EXERCICIO', 'Exercício', 'segundos', '#FF8A3D')
ON CONFLICT (codigo) DO NOTHING;
