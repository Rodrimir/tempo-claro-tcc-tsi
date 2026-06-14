// @audit-ok: FRONTEND-index.jsx-01
import React from 'react';
import {
  Overlay,
  ModalCard,
  Title,
  Description,
  ButtonContainer,
  PrimaryButton,
  SecondaryButton
} from './styles';

const PwaPauseModal = ({ onResume, onTimeout }) => {
  return (
    <Overlay>
      <ModalCard>
        <Title>Bem-vindo de volta!</Title>
        <Description>
          Sua tarefa estava em andamento. Como você voltou rápido, nós a pausamos para você.
        </Description>
        <ButtonContainer>
          <PrimaryButton onClick={onResume}>
            ▶️ CONTINUAR TAREFA
          </PrimaryButton>
          <SecondaryButton onClick={onTimeout}>
            Assumir Timeout
          </SecondaryButton>
        </ButtonContainer>
      </ModalCard>
    </Overlay>
  );
};

export default PwaPauseModal;
