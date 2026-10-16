package com.rodrigo.backend2java.habito;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.rodrigo.backend2java.habito.model.ConfigPendente;
import com.rodrigo.backend2java.habito.model.Habito;

// Aplica uma edição adiada (ConfigPendente) ao hábito: troca a configuração de execução, recria as
// sub-atividades e apaga a pendência. O histórico fica; as linhas antigas perdem só a ligação com a
// sub-atividade (ON DELETE SET NULL), como já acontecia na edição imediata.
@Component
public class AplicadorDeConfiguracao {

    private final HabitoRepository habitoRepository;
    private final SubAtividadeRepository subAtividadeRepository;
    private final ConfigPendenteRepository configPendenteRepository;
    private final GeradorDeOcorrencias geradorDeOcorrencias;

    public AplicadorDeConfiguracao(HabitoRepository habitoRepository, SubAtividadeRepository subAtividadeRepository,
            ConfigPendenteRepository configPendenteRepository, GeradorDeOcorrencias geradorDeOcorrencias) {
        this.habitoRepository = habitoRepository;
        this.subAtividadeRepository = subAtividadeRepository;
        this.configPendenteRepository = configPendenteRepository;
        this.geradorDeOcorrencias = geradorDeOcorrencias;
    }

    @Transactional
    public void aplicar(final Habito habito, final ConfigPendente pendente) {
        habito.setCategoria(pendente.getCategoria());
        habito.setTipoMedida(pendente.getTipoMedida());
        habito.setMetaBase(pendente.getMetaBase());
        habito.setMetaMaxima(pendente.getMetaMaxima());
        habito.setIncremento(pendente.getIncremento());
        habito.setDiasIncremento(pendente.getDiasIncremento());
        habito.setFrequenciaSemanal(pendente.getFrequenciaSemanal());
        habitoRepository.save(habito);

        subAtividadeRepository.deleteAllByHabitoId(habito.getId());
        geradorDeOcorrencias.gerarSubAtividades(habito.getId(), pendente.getMetaBase(), pendente.getVezesAoDia(),
                pendente.getHorarioAgendado(), pendente.ocorrenciasDecodificadas())
                .forEach(subAtividadeRepository::save);

        configPendenteRepository.delete(pendente);
    }
}
