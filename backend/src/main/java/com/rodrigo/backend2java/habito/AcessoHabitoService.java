package com.rodrigo.backend2java.habito;

import java.util.UUID;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.usuario.model.Usuario;
import com.rodrigo.backend2java.usuario.UsuarioRepository;
import com.rodrigo.backend2java.infra.exception.RecursoNaoEncontradoException;
import com.rodrigo.backend2java.habito.model.Habito;

@Service
public class AcessoHabitoService {

    private final HabitoRepository habitoRepository;
    private final UsuarioRepository usuarioRepository;

    public AcessoHabitoService(HabitoRepository habitoRepository, UsuarioRepository usuarioRepository) {
        this.habitoRepository = habitoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    public record HabitoComDono(Habito habito, Usuario dono) {
    }

    public HabitoComDono carregar(final UUID habitoId, final String emailContexto) {
        final var dono = usuarioPorEmail(emailContexto);
        final var habito = habitoRepository.findById(habitoId)
                .filter(h -> h.getUsuarioId().equals(dono.getId()))
                .filter(h -> Boolean.TRUE.equals(h.getAtivo()))
                .orElseThrow(() -> new RecursoNaoEncontradoException("habito.naoEncontrado"));
        return new HabitoComDono(habito, dono);
    }

    public Usuario usuarioPorEmail(final String emailContexto) {
        return usuarioRepository.findByEmail(emailContexto)
                .orElseThrow(() -> new RecursoNaoEncontradoException("usuario.naoEncontrado"));
    }

    // Trava a linha do usuário até o fim da transação de quem chamou, para serializar operações
    // que decidem a partir de uma contagem (limite de hábitos ativos, calibração repetida).
    public Usuario travarUsuarioPorEmail(final String emailContexto) {
        return usuarioRepository.travarPorEmail(emailContexto)
                .orElseThrow(() -> new RecursoNaoEncontradoException("usuario.naoEncontrado"));
    }
}
