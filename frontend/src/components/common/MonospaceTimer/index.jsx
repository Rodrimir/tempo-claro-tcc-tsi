import React from 'react';
import {
  TimerContainer,
  TimeDisplay,
  BonusWrapper,
  BonusBadge
} from './styles';

const MonospaceTimer = ({ isOverachieving, overachieveTime, timeLeft }) => {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <TimerContainer>
      <TimeDisplay $isOverachieving={isOverachieving}>
        {isOverachieving ? formatTime(overachieveTime) : formatTime(timeLeft)}
      </TimeDisplay>
      <BonusWrapper>
        {isOverachieving && (
          <BonusBadge>
            <span>⭐ Bônus Ativado</span>
          </BonusBadge>
        )}
      </BonusWrapper>
    </TimerContainer>
  );
};

export default MonospaceTimer;
