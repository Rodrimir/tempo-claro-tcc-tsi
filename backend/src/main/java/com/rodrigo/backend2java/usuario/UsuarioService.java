package com.rodrigo.backend2java.usuario;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Set;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.habito.HabitoRepository;
import com.rodrigo.backend2java.infra.util.FusosSuportados;
import com.rodrigo.backend2java.infra.util.ZonaUsuario;
import com.rodrigo.backend2java.infra.util.SenhaValidator;
import com.rodrigo.backend2java.infra.exception.ValidacaoException;
import com.rodrigo.backend2java.infra.exception.RegraDeNegocioException;
import com.rodrigo.backend2java.infra.exception.RecursoNaoEncontradoException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend2java.usuario.model.ExclusaoContaDTO;
import com.rodrigo.backend2java.usuario.model.PreferenciasIniciaisDTO;
import com.rodrigo.backend2java.usuario.model.ProfileUpdateDTO;
import com.rodrigo.backend2java.usuario.model.Usuario;
import com.rodrigo.backend2java.usuario.model.UsuarioResponseDTO;
import com.rodrigo.backend2java.verificacao.CodigoVerificacaoRepository;

@Service
public class UsuarioService {

    private static final Set<String> TEMAS_VALIDOS = Set.of("claro", "escuro", "sistema", "dinamico");

    private static final Set<String> IDIOMAS_VALIDOS = Set.of("pt-BR", "en-US");

    // A palavra exata que a tela de exclusão pede, em cada idioma.
    private static final Set<String> CONFIRMACOES_DE_EXCLUSAO = Set.of("excluir!", "delete!");

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final HabitoRepository habitoRepository;
    private final CodigoVerificacaoRepository codigoVerificacaoRepository;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
            HabitoRepository habitoRepository, CodigoVerificacaoRepository codigoVerificacaoRepository) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.habitoRepository = habitoRepository;
        this.codigoVerificacaoRepository = codigoVerificacaoRepository;
    }

    @Transactional
    public UsuarioResponseDTO buscarPerfil(final String emailContexto) {
        final var usuario = carregar(emailContexto);
        if (ZonaUsuario.promoverPendente(usuario, Instant.now())) {
            usuarioRepository.save(usuario);
        }
        return UsuarioResponseDTO.de(usuario);
    }

    @Transactional
    public void atualizarPerfil(final String emailContexto, final ProfileUpdateDTO request) {
        final var usuario = carregar(emailContexto);
        final var agora = Instant.now();
        ZonaUsuario.promoverPendente(usuario, agora);

        if (request.nome() != null) {
            if (request.nome().isBlank()) {
                throw new ValidacaoException("perfil.nomeVazio");
            }
            if (request.nome().trim().length() > 150) {
                throw new ValidacaoException("validacao.nome.tamanho");
            }
            usuario.setNome(request.nome().trim());
        }

        if (request.fuso_horario() != null && !request.fuso_horario().isBlank()) {
            agendarTrocaDeFuso(usuario, request.fuso_horario(), agora);
        }

        if (request.tema() != null && !request.tema().isBlank()) {
            if (!TEMAS_VALIDOS.contains(request.tema())) {
                throw new ValidacaoException("perfil.temaInvalido", request.tema());
            }
            usuario.setTema(request.tema());
        }

        if (request.preferencia_idioma() != null && !request.preferencia_idioma().isBlank()) {
            usuario.setPreferenciaIdioma(idiomaValido(request.preferencia_idioma()));
        }

        if (request.notificacoes_ativas() != null) {
            usuario.setNotificacoesAtivas(request.notificacoes_ativas());
        }

        if (request.som_ativo() != null) {
            usuario.setSomAtivo(request.som_ativo());
        }

        if (request.senha_atual() != null && !request.senha_atual().isBlank()
                && (request.nova_senha() == null || request.nova_senha().isBlank())) {
            throw new ValidacaoException("perfil.preenchaNovaSenha");
        }

        if (request.nova_senha() != null && !request.nova_senha().isBlank()) {
            if (request.senha_atual() == null || request.senha_atual().isBlank()) {
                throw new ValidacaoException("perfil.informeSenhaAtual");
            }
            SenhaValidator.exigirValida(request.nova_senha());
            if (!passwordEncoder.matches(request.senha_atual(), usuario.getSenhaHash())) {
                throw new RegraDeNegocioException("perfil.senhaAtualIncorreta");
            }
            if (passwordEncoder.matches(request.nova_senha(), usuario.getSenhaHash())) {
                throw new RegraDeNegocioException("perfil.senhaIgualAtual");
            }
            usuario.setSenhaHash(passwordEncoder.encode(request.nova_senha()));
        }

        usuarioRepository.save(usuario);
    }

    // Passos 1 e 2 do guia: o idioma vale na hora. O fuso também, se a conta ainda não tem hábito
    // ativo (não há dia em andamento para apurar); com hábito, segue a troca adiada do Perfil.
    @Transactional
    public UsuarioResponseDTO definirPreferenciasIniciais(final String emailContexto,
            final PreferenciasIniciaisDTO request) {
        final var usuario = carregar(emailContexto);
        final var agora = Instant.now();
        ZonaUsuario.promoverPendente(usuario, agora);
        usuario.setPreferenciaIdioma(idiomaValido(request.preferencia_idioma()));

        if (habitoRepository.findAllByUsuarioIdAndAtivoTrue(usuario.getId()).isEmpty()) {
            exigirFusoSuportado(request.fuso_horario());
            usuario.setFusoHorario(request.fuso_horario());
            usuario.setFusoPendente(null);
            usuario.setFusoVigenteEm(null);
        } else {
            agendarTrocaDeFuso(usuario, request.fuso_horario(), agora);
        }
        usuarioRepository.save(usuario);
        return UsuarioResponseDTO.de(usuario);
    }

    @Transactional
    public UsuarioResponseDTO concluirOnboarding(final String emailContexto) {
        final var usuario = carregar(emailContexto);
        if (usuario.getOnboardingConcluidoEm() == null) {
            usuario.setOnboardingConcluidoEm(OffsetDateTime.now());
            usuarioRepository.save(usuario);
        }
        return UsuarioResponseDTO.de(usuario);
    }

    // Apaga a conta e tudo o que depende dela. O ON DELETE CASCADE do schema.sql leva hábitos,
    // sub-atividades, status, histórico, calibrações e dispositivos; os códigos de verificação são
    // ligados só pelo e-mail e saem aqui.
    @Transactional
    public void excluirConta(final String emailContexto, final ExclusaoContaDTO request) {
        final var confirmacao = request == null || request.confirmacao() == null ? "" : request.confirmacao().trim();
        if (!CONFIRMACOES_DE_EXCLUSAO.contains(confirmacao)) {
            throw new ValidacaoException("conta.confirmacaoInvalida");
        }
        final var usuario = carregar(emailContexto);
        codigoVerificacaoRepository.deleteAllByEmailIgnoreCase(usuario.getEmail());
        usuarioRepository.delete(usuario);
    }

    // Troca de fuso pelo Perfil: só vale a partir da meia-noite seguinte no fuso em vigor, para
    // que o dia em andamento seja apurado inteiro no fuso em que começou. Escolher o fuso em vigor
    // cancela uma troca pendente; escolher outro substitui a anterior.
    private void agendarTrocaDeFuso(final Usuario usuario, final String novoFuso, final Instant agora) {
        exigirFusoSuportado(novoFuso);
        final var vigente = ZonaUsuario.resolver(usuario, agora);
        if (vigente.getId().equals(novoFuso)) {
            usuario.setFusoPendente(null);
            usuario.setFusoVigenteEm(null);
            return;
        }
        usuario.setFusoPendente(novoFuso);
        usuario.setFusoVigenteEm(ZonaUsuario.proximaMeiaNoite(vigente, agora));
    }

    private static void exigirFusoSuportado(final String fuso) {
        if (!FusosSuportados.contem(fuso)) {
            throw new ValidacaoException("perfil.fusoInvalido", fuso);
        }
    }

    private static String idiomaValido(final String idioma) {
        if (!IDIOMAS_VALIDOS.contains(idioma)) {
            throw new ValidacaoException("perfil.idiomaInvalido", idioma);
        }
        return idioma;
    }

    private Usuario carregar(final String emailContexto) {
        return usuarioRepository.findByEmail(emailContexto)
                .orElseThrow(() -> new RecursoNaoEncontradoException("usuario.naoEncontrado"));
    }
}
