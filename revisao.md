Diretrizes de Documentação e Análise de Código

Objetivo: Rastrear uma funcionalidade de ponta a ponta, validando o código e gerando uma documentação padronizada para o README.

Regra 1: Mapeamento Universal

    Descreva a jornada da funcionalidade por cada arquivo (Front e Back).

    Especifique: métodos acessados, models embarcadas, campos utilizados e ramificações.

    Obrigatório: O mapeamento deve cobrir todas as variações (caminho feliz, falhas, erros de validação), e não apenas o sucesso.

Regra 2: Sistema de Tags e Estrutura
Avalie o estado do código em cada arquivo percorrido e utilize as seguintes tags:
(nunca encoste nada na notação para o bookmark como por rexemplo @note:, não pode encostar o : senão perde o sentido da das notações)
@note (Obrigatório): Usa a estrutura numérica rígida para mapear o fluxo (1. [Camada] arquivo.ext ➔ 1.1. Função: nome).

    @todo: Marca fluxos, lógicas ou métodos incompletos.

    @remind : Marca código morto, inativo ou funções que não estão sendo chamadas.

    @audit-issue : Aponta bugs, erros lógicos ou incoerências encontradas no percurso.

    @audit-info : Detalhes técnicos complexos (usar no cabeçalho do código apenas se estritamente necessário).

Regra 3: Tratamento de Inputs Específicos

    Se o prompt fornecer dados específicos (ex: nome: teste, email: teste@gmail), a documentação no README não deve usar esses dados. A documentação (@note) deve permanecer genérica, cobrindo a funcionalidade como um todo.

    O resultado daquele input específico deve ser explicado diretamente no chat da IA para o usuário, de forma separada do bloco do README.

Regra 4: Saída Esperada (Output)

    A IA deve entregar o mapeamento pronto no formato de documentação para o arquivo README.md, organizando as tags e os blocos de @note exatamente como estipulado.

Regra 5: Auditoria de Banco de Dados e Tag @audit-ok

    Sempre que o mapeamento chegar a uma função que interaja diretamente com o banco de dados (inserção, atualização, busca ou deleção), você deve listar explicitamente quais tabelas e campos estão sendo manipulados.

    Ação Obrigatória da IA: Utilize a tag @audit-ok de forma padronizada. Ao aplicar esta notação, você (a IA) deve cruzar as informações do código com o esquema conhecido do banco de dados, avaliando ativamente se há erros de tipagem, problemas de relacionamento ou qualquer inconsistência lógica que envolva a funcionalidade mapeada.

    Estrutura da Tag:
    A anotação no código/documentação deve seguir este formato exato:
    @audit-ok - Tabela: [Nome da Tabela] | Campos: [campo_A, campo_B] | Avaliação: [Sua análise sobre a consistência do esquema e dos dados para esta ação].

Regra 6: Formato de Inserção das Notations no Código

    Toda notation (@note, @todo, @remind, @audit-issue, @audit-info, @audit-ok) deve ser inserida diretamente no código-fonte do arquivo mapeado, não só na documentação do README.

    As notations são sempre comentário de linha (//), nunca comentário de bloco (/* */).

    Mesmo quando o conteúdo da notation ocupa várias linhas, cada linha continua sendo um // separado (nunca abrir um /* no meio para economizar caractere).

    A notation sempre abre a primeira linha do comentário, neste formato exato:
    // @notation - resto
    (a tag logo depois do //, um espaço, hífen, espaço, e então o texto da observação).

Pendências

    Verificar se o domínio send.monzai.com.br já validou no Resend, para fazer o que falta:
    testar POST https://api.resend.com/emails com from: verificacao@send.monzai.com.br (ou
    checar o painel Domains do Resend por "Verified"). Se validou:
    1. Trocar app.resend.from em backend/config/application.properties (local, git-ignorado)
       de onboarding@resend.dev para verificacao@send.monzai.com.br.
    2. Lembrar o usuário de configurar no painel do Render: RESEND_API_KEY e
       RESEND_FROM_EMAIL=verificacao@send.monzai.com.br, e apagar CODIGO_VERIFICACAO_FIXO de
       lá se ainda estiver definida (o código fixo de verificação era um risco de segurança,
       já removido do application-prod.properties, mas uma env var real no Render tem
       prioridade sobre o default do arquivo).
