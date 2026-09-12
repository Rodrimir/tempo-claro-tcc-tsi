package com.rodrigo.backend2java.habito;
import java.util.UUID;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

// @audit-ok [Schema v2.1 — tabela habitos agora usa prefixo hab_*.
//
// GAP CONHECIDO (E0.5.3, revisado na E2.9): dois campos do model Habito.java
// não têm mais coluna correspondente na tabela habitos do schema v2.1:
//   - horarioAgendado  — o schema move o horário para sub_atividades
//     (sub_horario_inicio/sub_horario_fim), uma linha por ocorrência do dia.
//   - metaFrequenciaDiaria — no schema v2.1 deixa de ser uma coluna e passa a
//     ser derivada por COUNT(sub_atividades) (ver vw_habito_hoje). Continua
//     existindo no model com @Builder.Default = 1, mas esse RowMapper não a
//     lê mais do banco — todo hábito volta do banco com o valor padrão 1.
// (Um terceiro campo, intervaloMinutos, também não tinha coluna — mas
// diferente destes dois, nunca teve um substituto real em nenhuma tabela.
// A E2.9 removeu esse campo do model e dos DTOs inteiramente, em vez de
// mantê-lo como uma promessa que nada cumpre — ver docs/CONTRATO_API.md.)
// horarioAgendado/metaFrequenciaDiaria continuam declarados de propósito
// (contrato com o front não muda) — não são mais persistidos por este
// repository desde que sub_atividades (E0.5.5) virou a fonte de dado real.
// GamificacaoService.processarExecucao usa habito.getMetaFrequenciaDiaria()
// para decidir quando fechar a ofensiva do dia — com essa mudança, todo
// hábito passa a fechar a ofensiva na 1ª execução do dia, não importa quantas
// vezes o front pediu. Repare nisso ao testar a Etapa 1 adiante.]
public interface HabitoRepository extends JpaRepository<Habito, UUID> {

    // @audit-ok [Dashboard — retorna apenas hábitos com ativo=true do usuário]
    List<Habito> findAllByUsuarioIdAndAtivoTrue(UUID usuarioId);

    // @audit-ok [Fechamento Diário (1) — todos os hábitos ativos, de todos os usuários]
    List<Habito> findAllByAtivoTrue();

    // hab_arquivado_em é novo no schema v2.1 — carimba quando o soft delete
    // aconteceu, além de manter hab_ativo = false.
    // @audit-ok [Deletar Hábito — soft delete: seta ativo=false preservando
    // histórico, e agora também carimba hab_arquivado_em]
    @Modifying(clearAutomatically = true)
    @Transactional
    @Query(value = "UPDATE habitos SET hab_ativo = false, hab_arquivado_em = CURRENT_TIMESTAMP WHERE hab_id = ?1",
           nativeQuery = true)
    void archive(UUID id);
}
