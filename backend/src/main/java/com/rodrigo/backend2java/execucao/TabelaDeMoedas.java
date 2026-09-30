package com.rodrigo.backend2java.execucao;

public final class TabelaDeMoedas {

    private static final double LIMIAR_150 = 1.50;
    private static final double LIMIAR_120 = 1.20;
    private static final double LIMIAR_100 = 1.00;

    private static final int MOEDAS_150 = 200;
    private static final int MOEDAS_120 = 150;
    private static final int MOEDAS_100 = 100;

    private TabelaDeMoedas() {
    }

    public static int devidoPeloPercentual(final double percentualDaMeta) {
        if (percentualDaMeta >= LIMIAR_150) {
            return MOEDAS_150;
        }
        if (percentualDaMeta >= LIMIAR_120) {
            return MOEDAS_120;
        }
        if (percentualDaMeta >= LIMIAR_100) {
            return MOEDAS_100;
        }
        return 0;
    }
}
