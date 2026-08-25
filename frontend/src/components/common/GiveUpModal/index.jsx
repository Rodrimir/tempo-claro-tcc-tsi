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

// @audit-ok [Desistência (4) — tipos aceitos pelo backend em GamificacaoService.processarExecucao]
// Antes eram enviados 'BLOCK_ACTIVE' e 'FAIL_VOLUNTARY', que não constam entre os
// tipos válidos: caíam no else e lançavam IllegalArgumentException, então nenhuma
// desistência chegava a ser registrada.
const TIPO_ESCUDO = 'FAIL_BLOQUEIO';
const TIPO_FALHA = 'FAIL_TIMEOUT';

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
            <ShieldButton onClick={() => handleGiveUp(TIPO_ESCUDO)}>
              🛡️ Usar Escudo ({bloqueiosAcumulados})
            </ShieldButton>
          )}

          <DangerButton onClick={() => handleGiveUp(TIPO_FALHA)}>
            Assumir Falha
          </DangerButton>
        </ButtonContainer>
      </ModalCard>
    </Overlay>
  );
};

export default GiveUpModal;
