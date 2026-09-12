package com.rodrigo.backend2java.infra.jwt;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

/**
 * Chaves de assinatura e verificação do JWT (RNF07).
 *
 * <p>v3.0: {@code jwt.secret} não tem mais default embutido. O valor que estava
 * aqui era o único usado em todos os ambientes — nenhum {@code .properties} definia
 * a propriedade —, ou seja, os tokens de produção eram assinados com uma chave
 * versionada no repositório público. Agora o perfil default traz uma chave de
 * desenvolvimento declarada como tal, e o perfil prod exige {@code JWT_SECRET} do
 * ambiente: sem ela, a aplicação não sobe.
 */
@Configuration
public class JwtConfig {

    /** HS512 assina com HMAC-SHA-512: a chave precisa ter pelo menos 512 bits. */
    private static final int TAMANHO_MINIMO_BYTES = 64;

    @Value("${jwt.secret}")
    private String secret;

    private SecretKeySpec secretKey() {
        final var bytes = secret == null ? new byte[0] : secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < TAMANHO_MINIMO_BYTES) {
            // Falha na subida, não na primeira tentativa de login: um segredo curto
            // faz o Nimbus recusar a chave só quando alguém tenta autenticar.
            throw new IllegalStateException(
                    "jwt.secret precisa ter pelo menos " + TAMANHO_MINIMO_BYTES
                            + " bytes para HS512 (recebidos: " + bytes.length + ").");
        }
        return new SecretKeySpec(bytes, "HmacSHA512");
    }

    @Bean
    public JwtEncoder jwtEncoder() {
        return new NimbusJwtEncoder(new ImmutableSecret<>(secretKey()));
    }

    @Bean
    public JwtDecoder jwtDecoder() {
        return NimbusJwtDecoder.withSecretKey(secretKey())
                .macAlgorithm(MacAlgorithm.HS512)
                .build();
    }
}
