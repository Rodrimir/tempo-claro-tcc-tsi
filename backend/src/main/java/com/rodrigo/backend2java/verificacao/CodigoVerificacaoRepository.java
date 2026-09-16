package com.rodrigo.backend2java.verificacao;
import java.util.UUID;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CodigoVerificacaoRepository extends JpaRepository<CodigoVerificacao, UUID> {

    // Só o mais recente, ainda não usado, do tipo pedido — é contra ele que
    // TentarValidar compara o código digitado.
    Optional<CodigoVerificacao> findFirstByEmailAndTipoAndUsadoEmIsNullOrderByCriadoEmDesc(String email, String tipo);

    // Todos os pendentes (não usados) do (email, tipo) — usado só para
    // invalidar em lote quando um código novo é emitido (ver
    // CodigoVerificacaoService.invalidarAnteriores).
    List<CodigoVerificacao> findAllByEmailAndTipoAndUsadoEmIsNull(String email, String tipo);

    // Sem filtro de usadoEm — diferente do método acima, este enxerga o último
    // código emitido mesmo já invalidado/usado. É contra ELE que gerarCodigo
    // mede os 60s do throttle (PLANO_REESTRUTURACAO.md, B.2); filtrar só os
    // pendentes deixaria o throttle valer zero logo após o primeiro reenvio,
    // porque gerarCodigo invalida o pendente antigo antes de inserir o novo.
    Optional<CodigoVerificacao> findFirstByEmailAndTipoOrderByCriadoEmDesc(String email, String tipo);
}
