package com.rodrigo.backend2java.execucao;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend2java.habito.Habito;
import com.rodrigo.backend2java.habito.SubAtividade;
import com.rodrigo.backend2java.habito.SubAtividadeRepository;
import com.rodrigo.backend2java.habito.FrequenciaSemanal;

/**
 * Apura um dia de um hábito: decide se a meta foi cumprida, credita as moedas,
 * move a ofensiva e o nível do avatar, e zera os contadores diários.
 *
 * <p><b>Por que o crédito é diferido.</b> RF11 credita "pela meta cumprida", que é
 * um evento do DIA — não da execução. Antes desta classe, {@code GamificacaoService}
 * creditava 100 ou 150 moedas a cada execução, então um hábito de 3x/dia rendia 300
 * a 450 moedas por dia em vez de 100 a 150. A §8.1 da monografia já registrava o
 * crédito diferido como a solução adotada; faltava existir.
 *
 * <p><b>A regra do rateio (RF11/RF12).</b> O dia tem um pote único: 100 moedas, ou
 * 150 se o total realizado chegou a 120% da meta. Cada ocorrência vale uma cota
 * igual desse pote, e a cota é creditada na proporção do que foi feito nela. Daí
 * saem os três casos que a especificação pede:
 * <ul>
 *   <li>três ocorrências completas → 100 (ou 150 com 120%);</li>
 *   <li>meta batida pulando uma de três → 67: a ofensiva é mantida, mas as moedas
 *       da parte ausente não são creditadas;</li>
 *   <li>dia a 60% → 60: fez menos, ganha menos.</li>
 * </ul>
 */
@Service
public class FechamentoService {

    private static final Logger log = LoggerFactory.getLogger(FechamentoService.class);

    private static final int POTE_PADRAO = 100;
    private static final int POTE_EXTRA = 150;
    private static final double LIMIAR_EXTRA = 1.20;

    /** RF14: o avatar evolui a cada dez dias consecutivos, não a cada dia. */
    private static final int DIAS_POR_NIVEL = 10;

    /**
     * Teto de serviço, não do banco (o CHECK só exige {@code >= 1}): a arte do
     * avatar tem cinco variações. Subir o teto não pede migração.
     */
    private static final int NIVEL_MAXIMO = 5;

    private final StatusHabitoRepository statusHabitoRepository;
    private final HistoricoExecucaoRepository historicoRepository;
    private final SubAtividadeRepository subAtividadeRepository;

    public FechamentoService(StatusHabitoRepository statusHabitoRepository, HistoricoExecucaoRepository historicoRepository, SubAtividadeRepository subAtividadeRepository) {
        this.statusHabitoRepository = statusHabitoRepository;
        this.historicoRepository = historicoRepository;
        this.subAtividadeRepository = subAtividadeRepository;
    }

    /** O que aconteceu num fechamento — usado pelo log do job e pelos testes. */
    public record ResultadoFechamento(LocalDate dia, boolean diaProgramado, boolean metaCumprida,
            int totalRealizado, int moedasCreditadas, int diasSeguidos, boolean escudoConsumido) {
    }

    /**
     * Apura {@code dia} (uma data local do fuso do dono) e deixa o status pronto
     * para o dia seguinte. Idempotência é responsabilidade do chamador, via
     * {@code sta_ultimo_reset}.
     */
    @Transactional
    public ResultadoFechamento fecharDia(final Habito habito, final StatusHabito status, final LocalDate dia) {
        // Dia fora da máscara semanal não é dia de falha: o hábito não era para
        // acontecer. Não avalia meta, não credita, não zera a ofensiva — só
        // limpa os contadores e segue. Sem isto, um hábito de segunda a sexta
        // perderia a ofensiva todo sábado assim que a zeragem por meta não
        // cumprida (RF13) passou a existir.
        if (!FrequenciaSemanal.ehDiaProgramado(habito.getFrequenciaSemanal(), dia)) {
            limparContadoresDoDia(status, dia);
            statusHabitoRepository.save(status);
            return new ResultadoFechamento(dia, false, false, 0, 0, status.getDiasSeguidos(), false);
        }

        final var subAtividades = subAtividadeRepository.findAllByHabitoIdOrderByOrdem(habito.getId());
        final var realizadoPorSub = realizadoPorSubAtividade(habito.getId(), dia);

        final var totalRealizado = totalRealizadoNoDia(habito.getId(), dia);

        final var metaDoDia = metaDoDia(habito);
        final var percentualDoDia = (double) totalRealizado / metaDoDia;

        // RF07/RF13: a meta é avaliada pelo TOTAL acumulado da janela do dia, não
        // pela contagem de ocorrências concluídas. É o que permite bater a meta
        // bebendo os 2100 ml em duas das três ocorrências (RF12).
        final var metaCumprida = totalRealizado >= metaDoDia;

        final var pote = percentualDoDia >= LIMIAR_EXTRA ? POTE_EXTRA : POTE_PADRAO;
        final var moedas = calcularMoedas(pote, subAtividades, realizadoPorSub, totalRealizado, metaDoDia);

        var escudoConsumido = false;
        if (metaCumprida) {
            status.setDiasSeguidos(status.getDiasSeguidos() + 1);
        } else if (Boolean.TRUE.equals(status.getBloqueioUsadoHoje())) {
            // O usuário já gastou um escudo à mão neste dia (FAIL_BLOQUEIO, no
            // modal de desistência). O dia já está protegido — não consome outro.
            escudoConsumido = true;
        } else if (status.getBloqueiosAcumulados() > 0) {
            status.setBloqueiosAcumulados(status.getBloqueiosAcumulados() - 1);
            registrarEscudoAutomatico(habito.getId(), dia, totalRealizado);
            escudoConsumido = true;
        } else {
            status.setDiasSeguidos(0);
        }

        if (moedas > 0) {
            status.setMoedasLocais(status.getMoedasLocais() + moedas);
        }
        status.setNivelAvatar(Math.min(NIVEL_MAXIMO, 1 + status.getDiasSeguidos() / DIAS_POR_NIVEL));
        limparContadoresDoDia(status, dia);
        statusHabitoRepository.save(status);

        log.info("Fechamento do hábito {} em {}: {}/{} ({}%), {} moeda(s), ofensiva {}{}.",
                habito.getId(), dia, totalRealizado, metaDoDia, Math.round(percentualDoDia * 100),
                moedas, status.getDiasSeguidos(), escudoConsumido ? " (escudo)" : "");

        return new ResultadoFechamento(dia, true, metaCumprida, totalRealizado, moedas,
                status.getDiasSeguidos(), escudoConsumido);
    }

    /**
     * Quanto o dia rende, se ele fechasse agora. Só leitura — é o que a resposta
     * da execução devolve para a tela de sucesso poder dizer "a receber" sem
     * reproduzir a fórmula no cliente (RF22/RNF08).
     */
    public int preverMoedasDoDia(final Habito habito, final LocalDate dia) {
        final var subAtividades = subAtividadeRepository.findAllByHabitoIdOrderByOrdem(habito.getId());
        final var realizadoPorSub = realizadoPorSubAtividade(habito.getId(), dia);
        // O total vem da MESMA fonte que fecharDia usa. Somar só o que está
        // atribuído a ocorrências daria zero num dia em que o hábito foi editado
        // (a edição recria as sub_atividades e a FK vira NULL), e a tela de
        // sucesso anunciaria "0 a receber" para um dia que vai creditar.
        final var total = totalRealizadoNoDia(habito.getId(), dia);
        final var metaDoDia = metaDoDia(habito);
        final var pote = (double) total / metaDoDia >= LIMIAR_EXTRA ? POTE_EXTRA : POTE_PADRAO;
        return calcularMoedas(pote, subAtividades, realizadoPorSub, total, metaDoDia);
    }

    /** Soma das conclusões do dia — a única definição de "quanto foi feito". */
    private int totalRealizadoNoDia(final UUID habitoId, final LocalDate dia) {
        return historicoRepository.agregarPorDia(habitoId, dia, dia).stream()
                .mapToInt(agregado -> agregado.getSomaValor() == null ? 0 : agregado.getSomaValor())
                .sum();
    }

    private Map<UUID, Integer> realizadoPorSubAtividade(final UUID habitoId, final LocalDate dia) {
        return historicoRepository.agregarPorSubAtividadeNoDia(habitoId, dia).stream()
                .filter(linha -> linha.getSubAtividadeId() != null)
                .collect(Collectors.toMap(
                        HistoricoExecucaoRepository.AgregadoPorSubAtividade::getSubAtividadeId,
                        linha -> linha.getSomaValor() == null ? 0 : linha.getSomaValor(),
                        Integer::sum));
    }

    private int metaDoDia(final Habito habito) {
        return Math.max(1, habito.getMetaBase() == null ? 1 : habito.getMetaBase());
    }

    /**
     * Soma das cotas: cada ocorrência vale {@code pote / N} e entrega essa cota na
     * proporção do que foi feito nela, sem passar de 100% (fazer 300% de uma
     * ocorrência não compra a cota das outras — quem premia o excedente é o pote
     * de 150, que olha o dia inteiro).
     */
    private int calcularMoedas(final int pote, final List<SubAtividade> subAtividades,
            final Map<UUID, Integer> realizadoPorSub, final int totalRealizado, final int metaDoDia) {
        if (totalRealizado <= 0) {
            return 0;
        }

        // Hábito sem sub_atividade, ou dia cujas execuções não ficaram atribuídas a
        // nenhuma ocorrência (linha antiga, ou hábito reconfigurado depois — a FK é
        // ON DELETE SET NULL): cai para a proporção do dia inteiro, que é a mesma
        // conta com N = 1.
        if (subAtividades.isEmpty() || realizadoPorSub.isEmpty()) {
            return (int) Math.round(pote * Math.min(1.0, (double) totalRealizado / metaDoDia));
        }

        final var cota = (double) pote / subAtividades.size();
        var credito = 0.0;
        for (final var subAtividade : subAtividades) {
            final var alvo = subAtividade.getAlvo() == null || subAtividade.getAlvo() <= 0
                    ? 1
                    : subAtividade.getAlvo();
            final var realizado = realizadoPorSub.getOrDefault(subAtividade.getId(), 0);
            credito += cota * Math.min(1.0, (double) realizado / alvo);
        }
        return (int) Math.round(credito);
    }

    private void registrarEscudoAutomatico(final UUID habitoId, final LocalDate dia, final int totalRealizado) {
        historicoRepository.save(HistoricoExecucao.builder()
                .id(UUID.randomUUID())
                .habitoId(habitoId)
                .executionToken(UUID.randomUUID())
                .dataHoraExecucao(OffsetDateTime.now())
                .dataLocal(dia)
                .valorRealizado(totalRealizado)
                .moedasGanhas(0)
                .tipoSucesso("PROTEGIDO_AUTOMATICO")
                .build());
    }

    private void limparContadoresDoDia(final StatusHabito status, final LocalDate dia) {
        status.setExecucoesHoje(0);
        status.setValorAcumuladoHoje(0);
        status.setBloqueioUsadoHoje(false);
        status.setUltimoReset(dia);
    }
}
