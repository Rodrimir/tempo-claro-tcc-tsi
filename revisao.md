Diretrizes de Documentação e Análise de Código

Objetivo: Rastrear uma funcionalidade de ponta a ponta, validando o código e gerando uma documentação padronizada para o README.

Regra 1: Mapeamento Universal

    Descreva a jornada da funcionalidade por cada arquivo (Front e Back).

    Especifique: métodos acessados, models embarcadas, campos utilizados e ramificações.

    Obrigatório: O mapeamento deve cobrir todas as variações (caminho feliz, falhas, erros de validação), e não apenas o sucesso.

Regra 2: Sistema de Tags e Estrutura
Avalie o estado do código em cada arquivo percorrido e utilize as seguintes tags:

    @note (Obrigatório): Usa a estrutura numérica rígida para mapear o fluxo (1. [Camada] arquivo.ext ➔ 1.1. Função: nome).

    @todo: Marca fluxos, lógicas ou métodos incompletos.

    @remind: Marca código morto, inativo ou funções que não estão sendo chamadas.

    @audit-issue: Aponta bugs, erros lógicos ou incoerências encontradas no percurso.

    @audit-info: Detalhes técnicos complexos (usar no cabeçalho do código apenas se estritamente necessário).

Regra 3: Tratamento de Inputs Específicos

    Se o prompt fornecer dados específicos (ex: nome: teste, email: teste@gmail), a documentação no README não deve usar esses dados. A documentação (@note) deve permanecer genérica, cobrindo a funcionalidade como um todo.

    O resultado daquele input específico deve ser explicado diretamente no chat da IA para o usuário, de forma separada do bloco do README.

Regra 4: Saída Esperada (Output)

    A IA deve entregar o mapeamento pronto no formato de documentação para o arquivo README.md, organizando as tags e os blocos de @note exatamente como estipulado.
