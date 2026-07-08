# Padrão de Comentários `@audit`

## Objetivo

Rastrear de ponta a ponta o fluxo de dados de cada funcionalidade da API — da entrada no controller até o banco e de volta — usando dois tipos de tag:

- **`@audit-ok`** — marca a *entrada* de um fluxo em uma camada (vai em cima do método ou da classe).
- **`@audit-info`** — documenta um detalhe de implementação *dentro* da camada atual (vai imediatamente antes da linha que documenta).

---

## Sintaxe

```java
// @audit-ok  [NomeFluxo(N) — descrição do que ESTA camada faz no fluxo]
// @audit-info [NomeFluxo(N) — detalhe de uma ação específica dentro desta camada]
```

---

## O número `N` — posição na cadeia de chamada

| N | Camada |
|---|--------|
| 1 | Controller |
| 2 | Service |
| 3 | Repository |
| `NM` | Model/Entity (ex: `3M` = entidade lida/gravada pelo repository) |
| `NREQ` | Request DTO consumido naquela camada (ex: `1REQ` = DTO recebido pelo controller) |
| `NRES` | Response DTO produzido naquela camada (ex: `1RES` = DTO retornado pelo controller) |

**Regra do N:** o número sobe somente quando você passa para uma nova camada. Um `@audit-info` dentro do mesmo método **mantém o N do `@audit-ok` que abriu a camada**.

---

## Exemplo completo — fluxo Login

```java
// AuthController.java
// @audit-ok [Login(1) — controller de autenticação: POST /auth/login]
@PostMapping("/login")
public ResponseEntity<AuthResponseDTO> login(@Valid @RequestBody final LoginRequestDTO request) {
    return ResponseEntity.ok(authService.autenticar(request));
}

// LoginRequestDTO.java
// @audit-ok [Login(1REQ) — model request: POST /auth/login]
public record LoginRequestDTO(String email, String password) {}

// AuthResponseDTO.java
// @audit-ok [Login(1RES) — model response: POST /auth/login]
public record AuthResponseDTO(String token, UserDTO user) {}

// AuthService.java
// @audit-ok [Login(2) — service de autenticação: POST /auth/login]
public AuthResponseDTO autenticar(LoginRequestDTO request) {
    // @audit-info [Login(2) — busca usuário pelo email; lança exceção se não encontrado]
    var usuario = usuarioRepository.findByEmail(request.email())...;
    // @audit-info [Login(2) — compara senha em texto puro com hash BCrypt]
    if (!passwordEncoder.matches(...)) { throw ...; }
    // @audit-info [Login(2) — gera JWT assinado com expiração de 24h]
    var token = jwtService.generateToken(usuario.getEmail());
}

// UsuarioRepository.java
// @audit-ok [Login(3) — repository: SELECT por email para autenticação]
public Optional<Usuario> findByEmail(String email) { ... }

// Usuario.java
//@audit-ok [Login(3M) — entidade Usuario representa a tabela usuarios no banco]
public class Usuario { ... }
```

---

## Fluxo com múltiplos caminhos no mesmo arquivo

Quando o mesmo método ou classe é reutilizado em mais de um fluxo, liste todos na mesma tag separados por ` / `:

```java
// @audit-ok [Login(3) / Cadastro(3) — repository: findByEmail usado em ambos os fluxos]
public Optional<Usuario> findByEmail(String email) { ... }
```

---

## Regras resumidas

1. **`@audit-ok` abre a camada** — um por método (ou por classe se for um DTO/model).
2. **`@audit-info` detalha dentro da camada** — quantas forem necessárias, sempre com o mesmo N.
3. **N só sobe ao mudar de camada** — controller→service: 1→2; service→repository: 2→3.
4. **Sufixos** — `M` para model, `REQ` para request DTO, `RES` para response DTO.
5. **Sem texto óbvio** — o `@audit-info` documenta o *porquê* ou o *comportamento não trivial*, não o que o nome do método já diz.