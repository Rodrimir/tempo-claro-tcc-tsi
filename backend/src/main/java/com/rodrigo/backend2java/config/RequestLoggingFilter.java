package com.rodrigo.backend2java.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.List;

/**
 * Filtro que imprime cada requisição no console de forma estruturada:
 * método + path, headers, body e status da resposta.
 *
 * Fica na borda externa da cadeia de filtros ({@code HIGHEST_PRECEDENCE}) para
 * capturar o status final, mesmo depois do tratamento de exceções.
 *
 * Para desligar (ex.: produção) defina em application.properties:
 * {@code app.request-logging.enabled=false}
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@ConditionalOnProperty(name = "app.request-logging.enabled", havingValue = "true", matchIfMissing = true)
public class RequestLoggingFilter extends OncePerRequestFilter {

    /** Body maior que isso é truncado para não inundar o console. */
    private static final int MAX_BODY_LENGTH = 10_000;

    /** Headers cujo valor é sensível — mostramos só o começo. */
    private static final List<String> SENSITIVE_HEADERS = List.of("authorization", "cookie", "set-cookie");

    // Cores ANSI
    private static final String RESET = "[0m";
    private static final String BOLD = "[1m";
    private static final String DIM = "[2m";
    private static final String CYAN = "[36m";
    private static final String GRAY = "[90m";
    private static final String GREEN = "[32m";
    private static final String YELLOW = "[33m";
    private static final String RED = "[31m";
    private static final String BLUE = "[34m";

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request, MAX_BODY_LENGTH);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        long start = System.currentTimeMillis();
        try {
            filterChain.doFilter(wrappedRequest, wrappedResponse);
        } finally {
            long durationMs = System.currentTimeMillis() - start;
            log(wrappedRequest, wrappedResponse, durationMs);
            // Sem isto o corpo cacheado nunca chega ao cliente
            wrappedResponse.copyBodyToResponse();
        }
    }

    private void log(ContentCachingRequestWrapper request,
                     ContentCachingResponseWrapper response,
                     long durationMs) {

        String method = request.getMethod();
        String path = request.getRequestURI();
        String query = request.getQueryString();
        if (StringUtils.hasText(query)) {
            path = path + "-" + query;
        }
        int status = response.getStatus();

        StringBuilder sb = new StringBuilder("\n");
        sb.append(GRAY).append("┌──────────────────────────────────────────────────────────────").append(RESET).append("\n");

        // Linha principal: método + path
        sb.append(GRAY).append("│ ").append(RESET)
          .append(methodColor(method)).append(BOLD).append(method).append(RESET)
          .append(" ").append(CYAN).append(path).append(RESET).append("\n");

        // Status + duração
        sb.append(GRAY).append("│ ").append(RESET)
          .append(DIM).append("status: ").append(RESET)
          .append(statusColor(status)).append(BOLD).append(status).append(" ").append(reasonPhrase(status)).append(RESET)
          .append(GRAY).append("  •  ").append(RESET)
          .append(DIM).append(durationMs).append("ms").append(RESET).append("\n");

        // Headers
        sb.append(GRAY).append("├─ ").append(BLUE).append("headers").append(RESET).append("\n");
        List<String> headerNames = Collections.list(request.getHeaderNames());
        if (headerNames.isEmpty()) {
            sb.append(GRAY).append("│   ").append(DIM).append("(nenhum)").append(RESET).append("\n");
        } else {
            for (String name : headerNames) {
                String value = String.join(", ", Collections.list(request.getHeaders(name)));
                if (SENSITIVE_HEADERS.contains(name.toLowerCase())) {
                    value = maskSensitive(value);
                }
                sb.append(GRAY).append("│   ").append(RESET)
                  .append(YELLOW).append(name).append(RESET)
                  .append(GRAY).append(": ").append(RESET)
                  .append(value).append("\n");
            }
        }

        // Body
        sb.append(GRAY).append("├─ ").append(BLUE).append("body").append(RESET).append("\n");
        String body = readBody(request);
        if (!StringUtils.hasText(body)) {
            sb.append(GRAY).append("│   ").append(DIM).append("(vazio)").append(RESET).append("\n");
        } else {
            String pretty = prettyJson(body, request.getContentType());
            for (String line : pretty.split("\n")) {
                sb.append(GRAY).append("│   ").append(RESET).append(line).append("\n");
            }
        }

        sb.append(GRAY).append("└──────────────────────────────────────────────────────────────").append(RESET);

        System.out.println(sb);
    }

    private String readBody(ContentCachingRequestWrapper request) {
        byte[] content = request.getContentAsByteArray();
        if (content.length == 0) {
            return "";
        }
        String body = new String(content, StandardCharsets.UTF_8);
        if (body.length() > MAX_BODY_LENGTH) {
            return body.substring(0, MAX_BODY_LENGTH) + "\n... (truncado, " + body.length() + " chars)";
        }
        return body;
    }

    /**
     * Formata JSON com indentação de forma leve, sem dependências externas.
     * Se não parecer JSON, devolve o texto cru.
     */
    private String prettyJson(String body, String contentType) {
        boolean looksJson = (contentType != null && contentType.contains("json"))
                || body.startsWith("{") || body.startsWith("[");
        if (!looksJson) {
            return body;
        }

        StringBuilder out = new StringBuilder();
        int indent = 0;
        boolean inString = false;
        boolean escaped = false;

        for (int i = 0; i < body.length(); i++) {
            char c = body.charAt(i);

            if (inString) {
                out.append(c);
                if (escaped) {
                    escaped = false;
                } else if (c == '\\') {
                    escaped = true;
                } else if (c == '"') {
                    inString = false;
                }
                continue;
            }

            switch (c) {
                case '"' -> {
                    inString = true;
                    out.append(c);
                }
                case '{', '[' -> {
                    out.append(c);
                    int j = i + 1;
                    while (j < body.length() && Character.isWhitespace(body.charAt(j))) {
                        j++;
                    }
                    // objeto/array vazio: mantém na mesma linha ({} ou [])
                    if (j < body.length() && (body.charAt(j) == '}' || body.charAt(j) == ']')) {
                        out.append(body.charAt(j));
                        i = j;
                    } else {
                        indent++;
                        out.append('\n').append("  ".repeat(indent));
                    }
                }
                case '}', ']' -> {
                    indent = Math.max(0, indent - 1);
                    out.append('\n').append("  ".repeat(indent)).append(c);
                }
                case ',' -> out.append(c).append('\n').append("  ".repeat(indent));
                case ':' -> out.append(": ");
                case ' ', '\n', '\r', '\t' -> {
                    // ignora espaços já existentes fora de strings
                }
                default -> out.append(c);
            }
        }
        return out.toString();
    }

    private String maskSensitive(String value) {
        if (!StringUtils.hasText(value)) {
            return value;
        }
        if (value.length() <= 20) {
            return value.charAt(0) + "•••";
        }
        return value.substring(0, 20) + "••• (" + value.length() + " chars)";
    }

    private String methodColor(String method) {
        return switch (method) {
            case "GET" -> GREEN;
            case "POST" -> YELLOW;
            case "PUT", "PATCH" -> BLUE;
            case "DELETE" -> RED;
            default -> CYAN;
        };
    }

    private String statusColor(int status) {
        if (status >= 500) return RED;
        if (status >= 400) return YELLOW;
        if (status >= 300) return CYAN;
        if (status >= 200) return GREEN;
        return GRAY;
    }

    private String reasonPhrase(int status) {
        HttpStatus resolved = HttpStatus.resolve(status);
        return resolved != null ? resolved.getReasonPhrase() : "";
    }
}
