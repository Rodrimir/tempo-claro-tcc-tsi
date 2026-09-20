package com.rodrigo.backend2java.habito;

import java.util.UUID;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.usuario.Usuario;
import com.rodrigo.backend2java.usuario.UsuarioRepository;
import com.rodrigo.backend2java.infra.exception.RecursoNaoEncontradoException;

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
                .orElseThrow(() -> new RecursoNaoEncontradoException("Hábito não encontrado"));
        return new HabitoComDono(habito, dono);
    }

    public Usuario usuarioPorEmail(final String emailContexto) {
        return usuarioRepository.findByEmail(emailContexto)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário não encontrado"));
    }
}
