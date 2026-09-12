package com.rodrigo.backend2java.calibracao;

import java.util.List;
import java.util.Map;
import java.io.IOException;
import jakarta.annotation.PostConstruct;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import com.rodrigo.backend2java.infra.exception.ValidacaoException;

/**
 * O questionário de calibração (RF20/RNF04) lido de
 * {@code resources/calibracao/catalogo-v1.json}.
 *
 * <p><b>Por que fica num arquivo.</b> Trocar perguntas, rótulos, pesos ou faixas de
 * meta é ajuste de conteúdo, não de regra — e é exatamente o que vai mudar mais
 * vezes conforme os moldes forem sendo afinados. Deixar isso em JSON significa
 * editar um arquivo e reiniciar, sem tocar em Java. Só se mexe em código para
 * inventar um <i>tipo</i> de resposta novo.
 *
 * <p>Carregado uma vez na subida e validado ali mesmo: um catálogo quebrado derruba
 * o boot com uma mensagem clara, em vez de virar 500 na primeira calibração.
 */
@Component
public class CatalogoCalibracao {

    private static final Logger log = LoggerFactory.getLogger(CatalogoCalibracao.class);

    private static final String CAMINHO = "calibracao/catalogo-v1.json";

    /** Sem estas quatro, o cálculo não tem como montar uma sugestão completa. */
    private static final List<String> PERGUNTAS_OBRIGATORIAS =
            List.of("DIAS_SEMANA", "VEZES_AO_DIA", "HORARIOS", "RITMO");

    private Catalogo catalogo;

    @PostConstruct
    void carregar() throws IOException {
        final var mapper = new ObjectMapper();
        try (var entrada = new ClassPathResource(CAMINHO).getInputStream()) {
            catalogo = mapper.readValue(entrada, Catalogo.class);
        }
        validar();
        log.info("Catálogo de calibração v{} carregado: {} categoria(s).",
                catalogo.versao(), catalogo.categorias().size());
    }

    public int versao() {
        return catalogo.versao();
    }

    public CategoriaCalibracao categoria(final String categoria) {
        final var encontrada = catalogo.categorias().get(categoria);
        if (encontrada == null) {
            throw new ValidacaoException("Categoria sem calibração disponível: " + categoria);
        }
        return encontrada;
    }

    public java.util.Set<String> categoriasDisponiveis() {
        return catalogo.categorias().keySet();
    }

    private void validar() {
        if (catalogo == null || catalogo.categorias() == null || catalogo.categorias().isEmpty()) {
            throw new IllegalStateException("Catálogo de calibração vazio: " + CAMINHO);
        }
        catalogo.categorias().forEach((nome, categoria) -> {
            if (categoria.faixas_meta() == null || categoria.faixas_meta().isEmpty()) {
                throw new IllegalStateException("Categoria " + nome + " sem faixas_meta no catálogo.");
            }
            final var codigos = categoria.perguntas().stream().map(PerguntaCalibracao::codigo).toList();
            PERGUNTAS_OBRIGATORIAS.stream()
                    .filter(obrigatoria -> !codigos.contains(obrigatoria))
                    .findFirst()
                    .ifPresent(faltando -> {
                        throw new IllegalStateException(
                                "Categoria " + nome + " não declara a pergunta obrigatória " + faltando + ".");
                    });
        });
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Catalogo(
            int versao,
            Map<String, CategoriaCalibracao> categorias) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CategoriaCalibracao(
            String unidade,
            String tipo_medida,
            /** meta_maxima sugerida = meta * este fator. */
            int teto_multiplicador,
            List<FaixaMeta> faixas_meta,
            List<PerguntaCalibracao> perguntas) {
    }

    /** Pontuação até {@code ate} (inclusive) sugere {@code meta}. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record FaixaMeta(int ate, int meta) {
    }

    /**
     * Texto do catálogo em cada idioma. Resolver aqui, e não no aplicativo, é o que
     * mantém a promessa do catálogo: trocar uma pergunta ou traduzir um rótulo é
     * editar o JSON, sem publicar versão nova do app (RNF13).
     */
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record TextoLocalizado(
            @com.fasterxml.jackson.annotation.JsonProperty("pt-BR") String ptBR,
            @com.fasterxml.jackson.annotation.JsonProperty("en-US") String enUS) {

        /** Idioma sem tradução cai no português, nunca em nulo. */
        public String em(final String idioma) {
            if ("en-US".equals(idioma) && enUS != null && !enUS.isBlank()) {
                return enUS;
            }
            return ptBR;
        }
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record PerguntaCalibracao(
            String codigo,
            String tipo,
            TextoLocalizado enunciado,
            /** Só em VEZES_AO_DIA: quantas ocorrências a categoria admite. */
            Integer maximo,
            List<OpcaoCalibracao> opcoes) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record OpcaoCalibracao(
            String valor,
            TextoLocalizado rotulo,
            /** Só em RITMO: a linha que explica o efeito. */
            TextoLocalizado detalhe,
            Integer peso,
            /**
             * Teto que esta resposta impõe à meta sugerida. É a 3ª lei de Clear
             * virando regra de cálculo: quem declara aguentar 10 minutos não recebe
             * uma sugestão de 30, por mais pontos que tenha somado nas outras.
             */
            Integer teto_resposta,
            Integer incremento,
            Integer dias_incremento) {
    }
}
