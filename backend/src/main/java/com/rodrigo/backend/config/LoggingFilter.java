package com.rodrigo.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.Collections;
import java.util.stream.Collectors;

import org.springframework.core.Ordered;

// @audit-ok [Logging — filtro de maior precedência que registra request/response de cada chamada para auditoria e depuração]

@Slf4j
@Component
public class LoggingFilter extends OncePerRequestFilter implements Ordered {

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request, 10240);
        ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);

        long startTime = System.currentTimeMillis();

        try {
            filterChain.doFilter(requestWrapper, responseWrapper);
        } finally {
            long duration = System.currentTimeMillis() - startTime;
            logRequestAndResponse(requestWrapper, responseWrapper, duration);
            // @audit-info [Logging — copia o corpo de volta ao stream original; sem isto o cliente recebe resposta vazia]
            responseWrapper.copyBodyToResponse();
        }
    }

    private void logRequestAndResponse(ContentCachingRequestWrapper request, ContentCachingResponseWrapper response, long duration) {
        String reqBody = getBodyString(request.getContentAsByteArray(), request.getCharacterEncoding());
        String resBody = getBodyString(response.getContentAsByteArray(), response.getCharacterEncoding());

        String reqHeaders = Collections.list(request.getHeaderNames()).stream()
                .map(name -> name + ":" + request.getHeader(name))
                .collect(Collectors.joining(", "));

        String resHeaders = response.getHeaderNames().stream()
                .map(name -> name + ":" + response.getHeader(name))
                .collect(Collectors.joining(", "));

        log.info("""
                
                =========================== REQUEST BEGIN ==========================================
                URI         : {} {}
                Headers     : {}
                Request     : {}
                -------------------------- RESPONSE ------------------------------------------------
                Status      : {}
                Duration    : {} ms
                Headers     : {}
                Response    : {}
                ========================== REQUEST END =============================================
                """,
                request.getMethod(), request.getRequestURI(),
                reqHeaders,
                reqBody.isEmpty() ? "[Empty Body]" : reqBody,
                response.getStatus(),
                duration,
                resHeaders,
                resBody.isEmpty() ? "[Empty Body]" : resBody
        );
    }

    private String getBodyString(byte[] contentAsByteArray, String characterEncoding) {
        if (contentAsByteArray.length == 0) {
            return "";
        }
        try {
            return new String(contentAsByteArray, characterEncoding != null ? characterEncoding : "UTF-8");
        } catch (UnsupportedEncodingException e) {
            return "[Unsupported Encoding]";
        }
    }
}
