package com.rodrigo.backend2java.verificacao;
import java.util.UUID;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.rodrigo.backend2java.infra.exception.RegraDeNegocioException;

/**
 * Ponto único de geração e validação de código de 6 dígitos — usado por
 * verificação de e-mail (C) e recuperação de senha (B). PLANO_REESTRUTURACAO.md.
 *
 * <p>Guarda só o hash (BCrypt, mesmo encoder da senha), nunca o código em
 * claro — um vazamento do banco não pode devolver código válido pra ninguém.
 */
@Service
public class CodigoVerificacaoService {

    private static final int VALIDADE_MINUTOS = 15;
    private static final int MAX_TENTATIVAS = 5;
    private static final int THROTTLE_REENVIO_SEGUNDOS = 60;
    private static final SecureRandom ALEATORIO = new SecureRandom();

    private final CodigoVerificacaoRepository repository;
    private final PasswordEncoder passwordEncoder;

    /**
     * PROVISÓRIO. Quando preenchido, todo código emitido é este valor fixo em vez
     * de um sorteio do {@link SecureRandom}.
     *
     * <p>Existe porque o plano gratuito do Render bloqueia as portas de saída de
     * SMTP (25, 465 e 587) desde 26/09/2025: o e-mail simplesmente não sai em
     * produção, e sem código ninguém conclui cadastro nem recupera senha.
     *
     * <p><b>Isto é uma porta dos fundos, não uma funcionalidade.</b> Com valor
     * definido, qualquer pessoa que saiba o código assume QUALQUER conta pelo
     * fluxo de recuperação de senha — basta o e-mail da vítima. Só deve ficar
     * ligado enquanto o envio de e-mail não existir de fato; some sozinho ao
     * apagar a propriedade (ou definir CODIGO_VERIFICACAO_FIXO vazio no Render),
     * sem precisar editar esta classe.
     */
    private final String codigoFixo;

    public CodigoVerificacaoService(CodigoVerificacaoRepository repository, PasswordEncoder passwordEncoder,
            @Value("${app.verificacao.codigo-fixo:}") String codigoFixo) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.codigoFixo = codigoFixo == null ? "" : codigoFixo.trim();
    }

    /**
     * Gera um código novo, invalida qualquer pendente do mesmo (email, tipo) e
     * devolve o código EM CLARO — a única vez que ele existe fora do hash, e só
     * na memória de quem chamou (pra mandar por e-mail). Nunca é persistido.
     *
     * @throws RegraDeNegocioException se o (email, tipo) já recebeu um código
     *         há menos de {@value #THROTTLE_REENVIO_SEGUNDOS}s (PLANO_REESTRUTURACAO.md,
     *         B.2: "respeitando 60s entre envios") — sem isto, resend-code e
     *         forgot-password aceitariam chamadas em rajada, cada uma disparando
     *         um e-mail de verdade.
     */
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

    /**
     * @throws RegraDeNegocioException quando não há código pendente, expirou,
     *         estourou tentativas ou o dígito não bate — sempre 422, o app
     *         mostra a mensagem direto (não precisa distinguir os casos).
     *
     * <p>Sem {@code @Transactional} de propósito: no caminho de código errado,
     * o método salva o incremento de tentativas e DEPOIS lança
     * RegraDeNegocioException (RuntimeException). Um {@code @Transactional}
     * aqui faria o rollback automático desfazer exatamente esse save — o
     * bloqueio por força bruta nunca contaria tentativa nenhuma. Cada
     * {@code repository.save} já é atômico por si (chamada única do Spring
     * Data); não há duas escritas que precisem ser tudo-ou-nada aqui.
     */
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

    /**
     * Pedir um código novo invalida o anterior — sem isto, dois códigos
     * ficariam pendentes ao mesmo tempo e um "código antigo ainda funciona"
     * seria uma janela de ataque desnecessária.
     */
    private void invalidarPendentes(final String email, final TipoCodigo tipo) {
        final var pendentes = repository.findAllByEmailAndTipoAndUsadoEmIsNull(email, tipo.name());
        final var agora = OffsetDateTime.now();
        pendentes.forEach(codigo -> codigo.setUsadoEm(agora));
        repository.saveAll(pendentes);
    }
}
