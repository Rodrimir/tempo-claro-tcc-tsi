package com.rodrigo.backend2java.verificacao;
import java.util.UUID;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CodigoVerificacaoRepository extends JpaRepository<CodigoVerificacao, UUID> {

    Optional<CodigoVerificacao> findFirstByEmailAndTipoAndUsadoEmIsNullOrderByCriadoEmDesc(String email, String tipo);

    List<CodigoVerificacao> findAllByEmailAndTipoAndUsadoEmIsNull(String email, String tipo);

    Optional<CodigoVerificacao> findFirstByEmailAndTipoOrderByCriadoEmDesc(String email, String tipo);
}
