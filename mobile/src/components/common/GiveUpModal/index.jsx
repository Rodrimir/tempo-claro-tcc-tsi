import { Modal } from 'react-native';
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
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <Overlay>
        <ModalCard>
          <Title>Tem certeza?</Title>
          <Subtitle>Isso afetará sua consistência diária.</Subtitle>
          <ButtonContainer>
            <PrimaryButton onPress={onCancel}>
              <PrimaryButtonText>Voltar e Continuar</PrimaryButtonText>
            </PrimaryButton>

            {bloqueiosAcumulados > 0 && (
              <ShieldButton onPress={() => handleGiveUp(TIPO_ESCUDO)}>
                <ShieldButtonText>🛡️ Usar Escudo ({bloqueiosAcumulados})</ShieldButtonText>
              </ShieldButton>
            )}

            <DangerButton onPress={() => handleGiveUp(TIPO_FALHA)}>
              <DangerButtonText>Assumir Falha</DangerButtonText>
            </DangerButton>
          </ButtonContainer>
        </ModalCard>
      </Overlay>
    </Modal>
  );
};

export default GiveUpModal;
