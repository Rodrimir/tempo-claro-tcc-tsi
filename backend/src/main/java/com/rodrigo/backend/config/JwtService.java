package com.rodrigo.backend.config;

import java.util.Date;
import io.jsonwebtoken.Jwts;
import javax.crypto.SecretKey;
import io.jsonwebtoken.Claims;
import java.util.function.Function;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;

@Service
public class JwtService {

    @Value("${jwt.secret:404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970}")
    private String secretKey;

    @Value("${jwt.expiration:86400000}")
    private long jwtExpiration;

    // @audit-info [Verificação de Token — deriva a SecretKey HMAC-SHA256: assina o token na emissão (Login/Cadastro) e verifica a assinatura na validação (passo 8)]
    private SecretKey getSigningKey() {
        byte[] keyBytes = secretKey.getBytes();
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // @audit-ok [Login(4) — token de autenticação: POST /auth/login]
    // @audit-ok [Cadastro(5) — token de autenticação: POST /auth/register]
    // @audit-info [Login(4) / Cadastro(5) — o cliente guarda este JWT e o reenvia em "Authorization: Bearer <token>" a cada requisição (passo 6); o backend o revalida no passo 7]
    public String generateToken(String email) {
        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    // @audit-ok [Verificação de Token (8) — extrai o subject (email) das claims do token]
    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    // @audit-info [Verificação de Token (8) — faz o parse e verifica a assinatura HMAC-SHA256; lança JwtException se o token foi adulterado ou expirou]
    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    // @audit-info [Verificação de Token (9) — token válido quando o email confere e ainda não expirou]
    public boolean isTokenValid(String token, String userEmail) {
        final String email = extractEmail(token);
        return (email.equals(userEmail)) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }
}
