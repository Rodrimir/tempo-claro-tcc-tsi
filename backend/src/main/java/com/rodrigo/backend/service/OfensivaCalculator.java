package com.rodrigo.backend.service;

import java.util.Map;
import java.util.List;
import java.util.HashMap;
import java.time.LocalDate;
import com.rodrigo.backend.model.RegistroDiario;

// @audit-ok [Dashboard(2) / Execução(2) — regra central da ofensiva: respeita escudo e o dia corrente em andamento (regras 3.3, 3.5, F10)]

public final class OfensivaCalculator {

    private OfensivaCalculator() {
    }

    // @audit-info [Ofensiva — varre dias consecutivos a partir de hoje:
    //   • CONCLUIDO soma +1 e segue;
    //   • dia protegido por escudo mantém a corrente sem somar (a desistência foi blindada — F10/3.5);
    //   • o dia corrente ainda não apurado não quebra a sequência (a perda só ocorre na virada — 3.3);
    //   • qualquer FALHA não protegida no passado encerra a contagem.]
    public static int calcular(final List<RegistroDiario> registros, final LocalDate hoje) {
        final Map<LocalDate, RegistroDiario> porData = new HashMap<>();
        for (final RegistroDiario r : registros) {
            porData.put(r.getDataExecucao(), r);
        }

        int streak = 0;
        LocalDate cursor = hoje;
        while (true) {
            final RegistroDiario r = porData.get(cursor);
            if (r != null && "CONCLUIDO".equals(r.getStatus())) {
                streak++;
                cursor = cursor.minusDays(1);
            } else if (r != null && Boolean.TRUE.equals(r.getProtegidoPorEscudo())) {
                cursor = cursor.minusDays(1);
            } else if (cursor.isEqual(hoje)) {
                cursor = cursor.minusDays(1);
            } else {
                break;
            }
        }
        return streak;
    }
}
