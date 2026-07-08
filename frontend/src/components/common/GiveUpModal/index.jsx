import React from 'react';
import {
  Overlay,
  ModalCard,
  Title,
  Subtitle,
  ButtonContainer,
  PrimaryButton,
  DangerButton
} from './styles';

// @audit-ok [Desistência — desistir de uma pré-tarefa só perde a porção dela; o escudo protege a META DIÁRIA
// e é consumido automaticamente no fim do dia (não aqui)]
const GiveUpModal = ({ handleGiveUp, onCancel }) => {
  return (
    <Overlay>
      <ModalCard>
        <Title>Tem certeza?</Title>
        <Subtitle>Você perde a recompensa desta parte. Sua ofensiva só é avaliada no fim do dia.</Subtitle>
        <ButtonContainer>
          <PrimaryButton onClick={onCancel}>
            Voltar e Continuar
          </PrimaryButton>

          <DangerButton onClick={() => handleGiveUp('FAIL_TIMEOUT')}>
            Assumir Falha
          </DangerButton>
        </ButtonContainer>
      </ModalCard>
    </Overlay>
  );
};

export default GiveUpModal;
