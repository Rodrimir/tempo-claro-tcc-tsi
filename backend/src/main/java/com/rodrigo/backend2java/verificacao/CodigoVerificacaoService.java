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

    // @note - 10.1 (Cadastro) gerarCodigo, chamado por AuthService.cadastrar (item 7.1d): invalida
    // qualquer código pendente do mesmo tipo para aquele e-mail, sorteia um código de 6 dígitos
    // (ou usa app.verificacao.codigo-fixo, previsto só para teste) e grava o hash com expiração de
    // 15 minutos. Ver README §8 > Cadastro > item 10.
    @Transactional
    public String gerarCodigo(final String email, final TipoCodigo tipo) {
        // @note - 10.1 (Cadastro) ramificação de throttle: se já existe um código do mesmo tipo
        // emitido há menos de 60s, lança RegraDeNegocioException (item 13.2). Na prática
        // inatingível a partir de um cadastro novo, porque um e-mail que ainda não existe em
        // usuarios nunca teve código de verificação emitido antes.
        final var ultimoEmitido = repository.findFirstByEmailAndTipoOrderByCriadoEmDesc(email, tipo.name());
        if (ultimoEmitido.isPresent()
                && ultimoEmitido.get().getCriadoEm().plusSeconds(THROTTLE_REENVIO_SEGUNDOS).isAfter(OffsetDateTime.now())) {
            throw new RegraDeNegocioException("Aguarde um pouco antes de pedir um novo código.");
        }

        invalidarPendentes(email, tipo);

        final var codigo = codigoFixo.isBlank()
                ? String.format("%06d", ALEATORIO.nextInt(1_000_000))
                : codigoFixo;

        // @audit-ok - Tabela: codigos_verificacao | Campos: cod_id, cod_email, cod_codigo_hash,
        // cod_tipo, cod_expira_em, cod_tentativas, cod_criado_em | Avaliação: consistente com o
        // schema.sql; o código em si nunca é persistido em texto puro, só o hash (mesmo
        // PasswordEncoder das senhas, ver SecurityConfig.java item 6.2), e cod_tipo grava o nome
        // do enum TipoCodigo, que bate com o CHECK da coluna.
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
