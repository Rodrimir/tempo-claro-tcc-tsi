import { Modal } from 'react-native';
import { useI18n } from '@/contexts/LanguageContext';
import {
  Overlay,
  ModalCard,
  Title,
  Subtitle,
  ButtonContainer,
  PrimaryButton,
  PrimaryButtonText,
  ShieldButton,
  ShieldButtonText,
  DangerButton,
  DangerButtonText,
} from './styles';

const TIPO_ESCUDO = 'FAIL_BLOQUEIO';
const TIPO_FALHA = 'FAIL_TIMEOUT';

const GiveUpModal = ({ bloqueiosAcumulados, handleGiveUp, onCancel, enviando = false }) => {
  const { t } = useI18n();
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <Overlay>
        <ModalCard>
          <Title accessibilityRole="header">{t('desistir.temCerteza')}</Title>
          <Subtitle>{t('desistir.afetaConsistencia')}</Subtitle>
          <ButtonContainer>
            <PrimaryButton
              onPress={onCancel}
              disabled={enviando}
              accessibilityRole="button"
              accessibilityState={{ disabled: enviando }}
            >
              <PrimaryButtonText>{t('desistir.voltarContinuar')}</PrimaryButtonText>
            </PrimaryButton>

            {bloqueiosAcumulados > 0 && (
              <ShieldButton
                onPress={() => handleGiveUp(TIPO_ESCUDO)}
                disabled={enviando}
                accessibilityRole="button"
                accessibilityState={{ disabled: enviando, busy: enviando }}
              >
                <ShieldButtonText>{t('desistir.usarEscudo', { n: bloqueiosAcumulados })}</ShieldButtonText>
              </ShieldButton>
            )}

            <DangerButton
              onPress={() => handleGiveUp(TIPO_FALHA)}
              disabled={enviando}
              accessibilityRole="button"
              accessibilityState={{ disabled: enviando, busy: enviando }}
            >
              <DangerButtonText>{t('desistir.assumirFalha')}</DangerButtonText>
            </DangerButton>
          </ButtonContainer>
        </ModalCard>
      </Overlay>
    </Modal>
  );
};

export default GiveUpModal;
