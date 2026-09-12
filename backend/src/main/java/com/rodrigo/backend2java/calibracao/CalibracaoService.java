package com.rodrigo.backend2java.calibracao;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.ArrayList;
import java.time.LocalTime;
import java.time.format.DateTimeParseException;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend2java.habito.AcessoHabitoService;
import com.rodrigo.backend2java.infra.exception.ValidacaoException;
import com.rodrigo.backend2java.calibracao.CatalogoCalibracao.CategoriaCalibracao;
import com.rodrigo.backend2java.calibracao.CatalogoCalibracao.OpcaoCalibracao;
import com.rodrigo.backend2java.calibracao.CatalogoCalibracao.PerguntaCalibracao;

/**
 * Calibração assistida de metas (RF20/RNF04) — o "Medir Dificuldade" do Passo 2 do
 * assistente de criação.
 *
 * <p>A ideia é responder, com perguntas curtas, o que o preenchimento manual exige
 * que a pessoa decida sozinha: por onde começar, de quanto em quanto subir, quantas
 * vezes ao dia e em que horários. As respostas somam uma pontuação, a pontuação cai
 * numa faixa, e a faixa vira a meta inicial.
 *
 * <p><b>A trava que importa mais que a pontuação.</b> Uma resposta pode declarar um
 * teto ({@code teto_resposta} no catálogo): quem disse que só tem 10 minutos por dia
 * não recebe sugestão de 30, por mais pontos que tenha somado nas outras perguntas.
 * É a 3ª lei de Clear — tornar fácil — virando regra de cálculo, e é o que evita
 * que a calibração vire mais uma fonte de meta inatingível para quem já tem
 * dificuldade de começar.
 */
@Service
public class CalibracaoService {

    private static final String PERGUNTA_DIAS = "DIAS_SEMANA";
    private static final String PERGUNTA_VEZES = "VEZES_AO_DIA";
    private static final String PERGUNTA_HORARIOS = "HORARIOS";
    private static final String PERGUNTA_RITMO = "RITMO";

    private static final String MASCARA_TODO_DIA = "1111111";
    private static final LocalTime HORARIO_PADRAO = LocalTime.of(8, 0);

    private final CatalogoCalibracao catalogo;
    private final CalibracaoRepository calibracaoRepository;
    private final CalibracaoRespostaRepository respostaRepository;
    private final AcessoHabitoService acessoHabitoService;

    public CalibracaoService(CatalogoCalibracao catalogo, CalibracaoRepository calibracaoRepository, CalibracaoRespostaRepository respostaRepository, AcessoHabitoService acessoHabitoService) {
        this.catalogo = catalogo;
        this.calibracaoRepository = calibracaoRepository;
        this.respostaRepository = respostaRepository;
        this.acessoHabitoService = acessoHabitoService;
    }

    /**
     * O questionário da categoria, já no idioma do usuário (RNF13), para o app
     * desenhar sem conhecer pergunta alguma nem precisar traduzir nada.
     */
    public QuestionarioResponseDTO obterQuestionario(final String categoria, final String emailContexto) {
        final var definicao = catalogo.categoria(categoria);
        final var idioma = idiomaDe(emailContexto);
        return QuestionarioResponseDTO.builder()
                .categoria(categoria)
                .tipo_medida(definicao.tipo_medida())
                .unidade(definicao.unidade())
                .versao_catalogo(catalogo.versao())
                .perguntas(definicao.perguntas().stream()
                        .map(pergunta -> montarPergunta(pergunta, idioma))
                        .toList())
                .build();
    }

    private String idiomaDe(final String emailContexto) {
        final var usuario = acessoHabitoService.usuarioPorEmail(emailContexto);
        final var idioma = usuario.getPreferenciaIdioma();
        return idioma == null || idioma.isBlank() ? "pt-BR" : idioma;
    }

    @Transactional
    public CalibracaoResponseDTO calibrar(final String emailContexto, final CalibracaoRequestDTO request) {
        final var usuario = acessoHabitoService.usuarioPorEmail(emailContexto);
        final var definicao = catalogo.categoria(request.categoria());

        final var respostas = request.respostas().stream()
                .collect(Collectors.toMap(
                        CalibracaoRequestDTO.RespostaDTO::pergunta_codigo,
                        CalibracaoRequestDTO.RespostaDTO::valor,
                        (primeira, segunda) -> segunda));

        final var frequenciaSemanal = lerMascaraDeDias(respostas.get(PERGUNTA_DIAS));
        final var diasMarcados = (int) frequenciaSemanal.chars().filter(c -> c == '1').count();
        final var vezesAoDia = lerVezesAoDia(respostas.get(PERGUNTA_VEZES), definicao);
        final var horarios = lerHorarios(respostas.get(PERGUNTA_HORARIOS), vezesAoDia);
        final var ritmo = lerRitmo(respostas.get(PERGUNTA_RITMO), definicao);

        final var pontuacao = pontuar(definicao, respostas, diasMarcados);
        final var metaBase = calcularMeta(definicao, respostas, pontuacao, vezesAoDia);
        final var metaMaxima = metaBase * Math.max(1, definicao.teto_multiplicador());
        final var idioma = idiomaDe(emailContexto);

        final var calibracao = calibracaoRepository.save(Calibracao.builder()
                .id(UUID.randomUUID())
                .usuarioId(usuario.getId())
                .categoria(request.categoria())
                .versaoCatalogo(catalogo.versao())
                .pontuacao(pontuacao)
                .metaSugerida(metaBase)
                .metaMaximaSugerida(metaMaxima)
                .incrementoSugerido(ritmo == null || ritmo.incremento() == null ? 0 : ritmo.incremento())
                .diasIncrementoSugerido(ritmo == null || ritmo.dias_incremento() == null ? 10 : ritmo.dias_incremento())
                .vezesAoDiaSugerida(vezesAoDia)
                .frequenciaSemanalSugerida(frequenciaSemanal)
                .aceita(false)
                .build());

        // As respostas cruas ficam guardadas pelo código da pergunta: é o que permite
        // recalcular a sugestão se os moldes do catálogo mudarem depois.
        request.respostas().forEach(resposta -> respostaRepository.save(CalibracaoResposta.builder()
                .id(UUID.randomUUID())
                .calibracaoId(calibracao.getId())
                .perguntaCodigo(resposta.pergunta_codigo())
                .resposta(resposta.valor())
                .build()));

        return CalibracaoResponseDTO.builder()
                .calibracao_id(calibracao.getId())
                .pontuacao(pontuacao)
                .sugestao(CalibracaoResponseDTO.SugestaoDTO.builder()
                        .categoria(request.categoria())
                        .tipo_medida(definicao.tipo_medida())
                        .unidade(definicao.unidade())
                        .meta_base(metaBase)
                        .meta_maxima(metaMaxima)
                        .incremento(calibracao.getIncrementoSugerido())
                        .dias_incremento(calibracao.getDiasIncrementoSugerido())
                        .meta_frequencia_diaria(vezesAoDia)
                        .frequencia_semanal(frequenciaSemanal)
                        .ocorrencias(montarOcorrencias(metaBase, vezesAoDia, horarios))
                        .build())
                .explicacao(explicar(definicao, metaBase, vezesAoDia, diasMarcados, ritmo, idioma))
                .build();
    }

    /** Marca a calibração como aceita e a liga ao hábito que nasceu dela. */
    @Transactional
    public void vincularAoHabito(final UUID calibracaoId, final UUID usuarioId, final UUID habitoId) {
        calibracaoRepository.findById(calibracaoId)
                .filter(calibracao -> usuarioId.equals(calibracao.getUsuarioId()))
                .ifPresent(calibracao -> {
                    calibracao.setHabitoId(habitoId);
                    calibracao.setAceita(true);
                    calibracaoRepository.save(calibracao);
                });
    }

    // ------------------------------------------------------------------
    // Cálculo
    // ------------------------------------------------------------------

    /**
     * A pontuação é a soma dos pesos das opções escolhidas. DIAS_SEMANA não tem
     * lista de opções, então contribui pela quantidade de dias marcados: quem se
     * compromete com a semana inteira sustenta uma meta diária maior que quem
     * marcou dois dias.
     */
    private int pontuar(final CategoriaCalibracao definicao, final Map<String, String> respostas,
            final int diasMarcados) {
        var pontos = 0;
        for (final var pergunta : definicao.perguntas()) {
            if (PERGUNTA_DIAS.equals(pergunta.codigo())) {
                pontos += Math.round(diasMarcados / 2f);
                continue;
            }
            final var opcao = opcaoEscolhida(pergunta, respostas.get(pergunta.codigo()));
            if (opcao != null && opcao.peso() != null) {
                pontos += opcao.peso();
            }
        }
        return pontos;
    }

    private int calcularMeta(final CategoriaCalibracao definicao, final Map<String, String> respostas,
            final int pontuacao, final int vezesAoDia) {
        var meta = definicao.faixas_meta().stream()
                .filter(faixa -> pontuacao <= faixa.ate())
                .findFirst()
                .map(CatalogoCalibracao.FaixaMeta::meta)
                .orElse(definicao.faixas_meta().get(definicao.faixas_meta().size() - 1).meta());

        // A trava: nenhuma sugestão passa do que a pessoa declarou aguentar.
        for (final var pergunta : definicao.perguntas()) {
            final var opcao = opcaoEscolhida(pergunta, respostas.get(pergunta.codigo()));
            if (opcao != null && opcao.teto_resposta() != null) {
                meta = Math.min(meta, opcao.teto_resposta());
            }
        }

        // A meta precisa ser repartível entre as ocorrências: HabitoService recusa
        // meta_base menor que o número de sub_atividades.
        return Math.max(meta, vezesAoDia);
    }

    private OpcaoCalibracao opcaoEscolhida(final PerguntaCalibracao pergunta, final String valor) {
        if (valor == null || pergunta.opcoes() == null) {
            return null;
        }
        return pergunta.opcoes().stream()
                .filter(opcao -> opcao.valor().equals(valor))
                .findFirst()
                .orElse(null);
    }

    // ------------------------------------------------------------------
    // Leitura das respostas
    // ------------------------------------------------------------------

    private String lerMascaraDeDias(final String valor) {
        if (valor == null || valor.isBlank()) {
            return MASCARA_TODO_DIA;
        }
        final var mascara = valor.trim();
        if (!mascara.matches("^[01]{7}$") || "0000000".equals(mascara)) {
            throw new ValidacaoException(
                    "Dias da semana inválidos: use 7 posições de 0/1, com pelo menos um dia marcado");
        }
        return mascara;
    }

    private int lerVezesAoDia(final String valor, final CategoriaCalibracao definicao) {
        final var maximo = definicao.perguntas().stream()
                .filter(pergunta -> PERGUNTA_VEZES.equals(pergunta.codigo()))
                .map(PerguntaCalibracao::maximo)
                .filter(java.util.Objects::nonNull)
                .findFirst()
                .orElse(8);

        if (valor == null || valor.isBlank()) {
            return 1;
        }
        final int vezes;
        try {
            vezes = Integer.parseInt(valor.trim());
        } catch (final NumberFormatException e) {
            throw new ValidacaoException("Número de momentos do dia inválido: " + valor);
        }
        if (vezes < 1 || vezes > maximo) {
            throw new ValidacaoException("Escolha entre 1 e " + maximo + " momentos no dia");
        }
        return vezes;
    }

    private List<LocalTime> lerHorarios(final String valor, final int vezesAoDia) {
        final var horarios = new ArrayList<LocalTime>();
        if (valor != null && !valor.isBlank()) {
            for (final var parte : valor.split(",")) {
                try {
                    horarios.add(LocalTime.parse(parte.trim()));
                } catch (final DateTimeParseException e) {
                    throw new ValidacaoException("Horário inválido: " + parte.trim());
                }
            }
        }
        // Faltou horário para alguma ocorrência: completa espaçando o dia a partir
        // das 8h, para a sugestão nunca sair com ocorrências empilhadas no mesmo
        // minuto. O usuário ajusta no Passo 3, que vem pré-preenchido e editável.
        while (horarios.size() < vezesAoDia) {
            horarios.add(HORARIO_PADRAO.plusHours(Math.min(12, horarios.size() * 4L)));
        }
        return horarios.subList(0, vezesAoDia);
    }

    private OpcaoCalibracao lerRitmo(final String valor, final CategoriaCalibracao definicao) {
        final var pergunta = definicao.perguntas().stream()
                .filter(p -> PERGUNTA_RITMO.equals(p.codigo()))
                .findFirst()
                .orElse(null);
        if (pergunta == null) {
            return null;
        }
        final var escolhida = opcaoEscolhida(pergunta, valor);
        // Sem resposta de ritmo, o meio-termo é o padrão menos arriscado.
        return escolhida != null
                ? escolhida
                : pergunta.opcoes().get(Math.min(1, pergunta.opcoes().size() - 1));
    }

    // ------------------------------------------------------------------
    // Montagem da resposta
    // ------------------------------------------------------------------

    /** Reparte a meta entre as ocorrências, com o resto na última — mesma regra de HabitoService. */
    private List<CalibracaoResponseDTO.OcorrenciaSugeridaDTO> montarOcorrencias(final int metaBase,
            final int vezesAoDia, final List<LocalTime> horarios) {
        final var alvoBase = metaBase / vezesAoDia;
        final var resto = metaBase % vezesAoDia;
        final var ocorrencias = new ArrayList<CalibracaoResponseDTO.OcorrenciaSugeridaDTO>();
        for (var ordem = 1; ordem <= vezesAoDia; ordem++) {
            ocorrencias.add(CalibracaoResponseDTO.OcorrenciaSugeridaDTO.builder()
                    .horario_inicio(horarios.get(ordem - 1))
                    .alvo(alvoBase + (ordem == vezesAoDia ? resto : 0))
                    .build());
        }
        return ocorrencias;
    }

    /**
     * A frase que explica de onde saiu a sugestão, no idioma do usuário (RNF13).
     * Montada aqui, e não no app, pelo mesmo motivo do questionário: quem conhece
     * as regras do cálculo é o servidor.
     */
    private String explicar(final CategoriaCalibracao definicao, final int metaBase, final int vezesAoDia,
            final int diasMarcados, final OpcaoCalibracao ritmo, final String idioma) {
        final var ingles = "en-US".equals(idioma);
        final var texto = new StringBuilder(ingles ? "Let's start with " : "Vamos começar com ")
                .append(metaBase).append(' ').append(definicao.unidade())
                .append(ingles ? " a day" : " por dia");

        if (vezesAoDia > 1) {
            texto.append(ingles
                    ? ", split into " + vezesAoDia + " sessions"
                    : ", divididos em " + vezesAoDia + " momentos");
        }

        if (diasMarcados == 7) {
            texto.append(ingles ? ", every day" : ", todos os dias");
        } else {
            texto.append(ingles
                    ? ", " + diasMarcados + " days a week"
                    : ", " + diasMarcados + " dias por semana");
        }

        if (ritmo != null && ritmo.incremento() != null && ritmo.incremento() > 0) {
            texto.append(ingles
                    ? ", going up " + ritmo.incremento() + " " + definicao.unidade()
                            + " every " + ritmo.dias_incremento() + " days"
                    : ", subindo " + ritmo.incremento() + " " + definicao.unidade()
                            + " a cada " + ritmo.dias_incremento() + " dias");
        }

        texto.append(ingles
                ? ". You can adjust all of this in the next step."
                : ". Você pode ajustar tudo isso no próximo passo.");
        return texto.toString();
    }

    private QuestionarioResponseDTO.PerguntaDTO montarPergunta(final PerguntaCalibracao pergunta,
            final String idioma) {
        return QuestionarioResponseDTO.PerguntaDTO.builder()
                .codigo(pergunta.codigo())
                .tipo(pergunta.tipo())
                .enunciado(pergunta.enunciado().em(idioma))
                .maximo(pergunta.maximo())
                .opcoes(pergunta.opcoes() == null
                        ? List.of()
                        : pergunta.opcoes().stream()
                                .map(opcao -> QuestionarioResponseDTO.OpcaoDTO.builder()
                                        .valor(opcao.valor())
                                        .rotulo(opcao.rotulo().em(idioma))
                                        .detalhe(opcao.detalhe() == null ? null : opcao.detalhe().em(idioma))
                                        .build())
                                .toList())
                .build();
    }
}
