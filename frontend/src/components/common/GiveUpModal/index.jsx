import { Modal } from 'react-native';
import { useI18n } from '../../../contexts/LanguageContext';
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

const GiveUpModal = ({ bloqueiosAcumulados, handleGiveUp, onCancel }) => {
  const { t } = useI18n();
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <Overlay>
        <ModalCard>
          <Title>{t('desistir.temCerteza')}</Title>
          <Subtitle>{t('desistir.afetaConsistencia')}</Subtitle>
          <ButtonContainer>
            <PrimaryButton onPress={onCancel}>
              <PrimaryButtonText>{t('desistir.voltarContinuar')}</PrimaryButtonText>
            </PrimaryButton>

            {bloqueiosAcumulados > 0 && (
              <ShieldButton onPress={() => handleGiveUp(TIPO_ESCUDO)}>
                <ShieldButtonText>{t('desistir.usarEscudo', { n: bloqueiosAcumulados })}</ShieldButtonText>
              </ShieldButton>
            )}

            <DangerButton onPress={() => handleGiveUp(TIPO_FALHA)}>
              <DangerButtonText>{t('desistir.assumirFalha')}</DangerButtonText>
            </DangerButton>
          </ButtonContainer>
        </ModalCard>
      </Overlay>
    </Modal>
  );
};

export default GiveUpModal;
