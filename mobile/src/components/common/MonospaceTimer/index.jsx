import { TimerContainer, TimeDisplay, BonusWrapper, BonusBadge, BonusText } from './styles';

const MonospaceTimer = ({ isOverachieving, overachieveTime, timeLeft }) => {
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <TimerContainer>
      <TimeDisplay $isOverachieving={isOverachieving} style={{ fontVariant: ['tabular-nums'] }}>
        {isOverachieving ? formatTime(overachieveTime) : formatTime(timeLeft)}
      </TimeDisplay>
      <BonusWrapper>
        {isOverachieving && (
          <BonusBadge>
            <BonusText>⭐ Bônus Ativado</BonusText>
          </BonusBadge>
        )}
      </BonusWrapper>
    </TimerContainer>
  );
};

export default MonospaceTimer;
