package com.rodrigo.backend2java.habito;

import java.util.UUID;
import org.springframework.stereotype.Service;
import com.rodrigo.backend2java.usuario.Usuario;
import com.rodrigo.backend2java.usuario.UsuarioRepository;
import com.rodrigo.backend2java.infra.exception.RecursoNaoEncontradoException;

/**
 * Porta de entrada única para "este hábito é mesmo do usuário do token?".
 *
 * <p>Antes disto, só {@code StatsService} fazia essa checagem: os endpoints
 * {@code PUT}/{@code DELETE /habits/{id}}, {@code /priming}, {@code /executions} e
 * {@code /shield} recebiam o UUID cru pelo path e nunca olhavam o
 * {@code SecurityContext} — qualquer usuário autenticado que conhecesse o UUID de
 * um hábito alheio podia executá-lo, comprar escudo, editá-lo ou arquivá-lo. RF22
 * e RNF08 exigem o contrário.
 *
 * <p>Devolve o dono junto com o hábito porque quase todo chamador precisa do fuso
 * horário dele em seguida (RNF13) — separar em duas chamadas custaria um SELECT a
 * mais em cada execução.
 */
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

    /**
     * Hábito de {@code habitoId}, desde que pertença ao usuário de
     * {@code emailContexto}. Hábito inexistente e hábito de outra pessoa dão a
     * mesma resposta de propósito: 404 não confirma a existência do UUID para
     * quem está sondando.
     */
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
