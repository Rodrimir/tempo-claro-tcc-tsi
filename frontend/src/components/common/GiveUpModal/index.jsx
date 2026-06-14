// @audit-ok: FRONTEND-index.jsx-01
import React from 'react';
import {
  Overlay,
  ModalCard,
  Title,
  Subtitle,
  ButtonContainer,
  PrimaryButton,
  ShieldButton,
  DangerButton
} from './styles';

const GiveUpModal = ({ bloqueiosAcumulados, handleGiveUp, onCancel }) => {
  return (
    <Overlay>
      <ModalCard>
        <Title>Tem certeza?</Title>
        <Subtitle>Isso afetará sua consistência diária.</Subtitle>
        <ButtonContainer>
          <PrimaryButton onClick={onCancel}>
            Voltar e Continuar
          </PrimaryButton>
          
          {bloqueiosAcumulados > 0 && (
            <ShieldButton onClick={() => handleGiveUp('BLOCK_ACTIVE')}>
              🛡️ Usar Escudo ({bloqueiosAcumulados})
            </ShieldButton>
          )}
          
          <DangerButton onClick={() => handleGiveUp('FAIL_VOLUNTARY')}>
            Assumir Falha
          </DangerButton>
        </ButtonContainer>
      </ModalCard>
    </Overlay>
  );
};

export default GiveUpModal;
