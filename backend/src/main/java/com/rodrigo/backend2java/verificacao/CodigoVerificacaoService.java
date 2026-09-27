package com.rodrigo.backend2java.verificacao;
import java.util.UUID;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.rodrigo.backend2java.infra.exception.RegraDeNegocioException;
import com.rodrigo.backend2java.verificacao.model.TipoCodigo;
import com.rodrigo.backend2java.verificacao.model.CodigoVerificacao;

@Service
public class CodigoVerificacaoService {

    private static final int VALIDADE_MINUTOS = 15;
    private static final int MAX_TENTATIVAS = 5;
    private static final int THROTTLE_REENVIO_SEGUNDOS = 60;
    private static final SecureRandom ALEATORIO = new SecureRandom();

    private final CodigoVerificacaoRepository repository;
    private final PasswordEncoder passwordEncoder;

    private final String codigoFixo;

    public CodigoVerificacaoService(CodigoVerificacaoRepository repository, PasswordEncoder passwordEncoder,
            @Value("${app.verificacao.codigo-fixo:}") String codigoFixo) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.codigoFixo = codigoFixo == null ? "" : codigoFixo.trim();
    }

    @Transactional
    public String gerarCodigo(final String email, final TipoCodigo tipo) {
        final var ultimoEmitido = repository.findFirstByEmailAndTipoOrderByCriadoEmDesc(email, tipo.name());
        if (ultimoEmitido.isPresent()
                && ultimoEmitido.get().getCriadoEm().plusSeconds(THROTTLE_REENVIO_SEGUNDOS).isAfter(OffsetDateTime.now())) {
            throw new RegraDeNegocioException("Aguarde um pouco antes de pedir um novo código.");
        }

        invalidarPendentes(email, tipo);

        final var codigo = codigoFixo.isBlank()
                ? String.format("%06d", ALEATORIO.nextInt(1_000_000))
                : codigoFixo;

        repository.save(CodigoVerificacao.builder()
                .id(UUID.randomUUID())
                .email(email)
                .codigoHash(passwordEncoder.encode(codigo))
                .tipo(tipo.name())
                .expiraEm(OffsetDateTime.now().plusMinutes(VALIDADE_MINUTOS))
                .tentativas((short) 0)
                .build());

        return codigo;
    }

    public void validarCodigo(final String email, final String codigoDigitado, final TipoCodigo tipo) {
        final var pendente = repository
                .findFirstByEmailAndTipoAndUsadoEmIsNullOrderByCriadoEmDesc(email, tipo.name())
                .orElseThrow(() -> new RegraDeNegocioException("Nenhum código pendente para este e-mail. Peça um novo."));

        if (pendente.getExpiraEm().isBefore(OffsetDateTime.now())) {
            throw new RegraDeNegocioException("Código expirado. Peça um novo.");
        }
        if (pendente.getTentativas() >= MAX_TENTATIVAS) {
            throw new RegraDeNegocioException("Muitas tentativas erradas. Peça um novo código.");
        }
        if (!passwordEncoder.matches(codigoDigitado, pendente.getCodigoHash())) {
            pendente.setTentativas((short) (pendente.getTentativas() + 1));
            repository.save(pendente);
            throw new RegraDeNegocioException("Código incorreto.");
        }

        pendente.setUsadoEm(OffsetDateTime.now());
        repository.save(pendente);
    }

    private void invalidarPendentes(final String email, final TipoCodigo tipo) {
        final var pendentes = repository.findAllByEmailAndTipoAndUsadoEmIsNull(email, tipo.name());
        final var agora = OffsetDateTime.now();
        pendentes.forEach(codigo -> codigo.setUsadoEm(agora));
        repository.saveAll(pendentes);
    }
}
