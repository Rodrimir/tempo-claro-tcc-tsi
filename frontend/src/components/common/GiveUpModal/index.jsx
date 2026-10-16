import { useI18n } from '@/contexts/LanguageContext';
import Dialogo, { BotaoDoDialogo, TextoDoBotao, TextoDoDialogo } from '@/components/common/Dialogo';

const TIPO_ESCUDO = 'FAIL_BLOQUEIO';
const TIPO_FALHA = 'FAIL_TIMEOUT';

// Parar a execução, sem tom punitivo: continuar é a ação principal, e parar fica num botão neutro.
// O que já foi feito fica registrado como parcial (RF13), e dá para voltar ao hábito no mesmo dia.
const GiveUpModal = ({ bloqueiosAcumulados, handleGiveUp, onCancel, enviando = false }) => {
  const { t } = useI18n();
  return (
    <Dialogo
      visible
      onClose={enviando ? undefined : onCancel}
      titulo={t('desistir.temCerteza')}
      accessibilityLabel={t('desistir.voltarContinuar')}
      acoes={
        <>
          <BotaoDoDialogo
            accessibilityRole="button"
            onPress={() => handleGiveUp(TIPO_FALHA)}
            disabled={enviando}
            accessibilityState={{ disabled: enviando, busy: enviando }}
          >
            <TextoDoBotao>{t('desistir.assumirFalha')}</TextoDoBotao>
          </BotaoDoDialogo>
          <BotaoDoDialogo
            $tipo="primario"
            accessibilityRole="button"
            onPress={onCancel}
            disabled={enviando}
            accessibilityState={{ disabled: enviando }}
          >
            <TextoDoBotao $tipo="primario">{t('desistir.voltarContinuar')}</TextoDoBotao>
          </BotaoDoDialogo>
        </>
      }
    >
      <TextoDoDialogo>{t('desistir.afetaConsistencia')}</TextoDoDialogo>
      {bloqueiosAcumulados > 0 && (
        <BotaoDoDialogo
          style={{ marginTop: 16 }}
          accessibilityRole="button"
          onPress={() => handleGiveUp(TIPO_ESCUDO)}
          disabled={enviando}
          accessibilityState={{ disabled: enviando, busy: enviando }}
        >
          <TextoDoBotao>{t('desistir.usarEscudo', { n: bloqueiosAcumulados })}</TextoDoBotao>
        </BotaoDoDialogo>
      )}
    </Dialogo>
  );
};

export default GiveUpModal;
