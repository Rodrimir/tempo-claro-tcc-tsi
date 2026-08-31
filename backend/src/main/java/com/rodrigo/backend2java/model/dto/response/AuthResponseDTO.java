package com.rodrigo.backend2java.model.dto.response;
import lombok.Builder;
// @audit-ok [Login(1RES) model DTO —  POST /auth/register]
// @audit-ok [Cadastro(1RES) model DTO —  POST /auth/register]
@Builder
public record AuthResponseDTO(
        String token,
        UserDTO user)
{
    @Builder
    public record UserDTO(
            String name,
            String email,
            // @audit-ok [E1.5 (item 2) — fuso_horario também na resposta de
            // login/cadastro, já que os dois montam este mesmo UserDTO. Não
            // substitui GET /api/me (que é a fonte de verdade que o Perfil
            // consulta), mas evita a tela mostrar um fuso desatualizado no
            // instante entre o login e o primeiro GET /me.]
            String fuso_horario,
            // @audit-ok [E3.4 (item 2/3) — mesmo raciocínio do fuso_horario:
            // sem isso, um usuário que loga num aparelho novo (sem nada em
            // localStorage) só veria o tema salvo depois do primeiro GET /me,
            // com risco de troca de tema visível no meio da sessão em vez de
            // já entrar certo. ThemeToggleContext lê este campo do usuário
            // autenticado e sincroniza automaticamente.]
            String tema) {
    }
}
