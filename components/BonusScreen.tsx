import React, { useState, useEffect } from 'react';
import Button from './ui/Button';
import { BackIcon, GiftIcon, ScoreIcon } from './icons/UIIcons';
import Confetti from './ui/Confetti';

interface BonusScreenProps {
  isAvailable: boolean;
  nextBonusTime: number | null;
  onClaim: () => void;
  onBack: () => void;
  isLoading: boolean;
  claimSuccess: boolean;
}

const CountdownTimer: React.FC<{ targetTime: number }> = ({ targetTime }) => {
  const calculateTimeLeft = () => {
    const difference = targetTime - new Date().getTime();
    let timeLeft = { hours: 0, minutes: 0, seconds: 0 };

    if (difference > 0) {
      timeLeft = {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    const timer = setTimeout(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearTimeout(timer);
  });

  const format = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="text-4xl font-press-start text-yellow-400">
      {`${format(timeLeft.hours)}:${format(timeLeft.minutes)}:${format(timeLeft.seconds)}`}
    </div>
  );
};


const BonusScreen: React.FC<BonusScreenProps> = ({ isAvailable, nextBonusTime, onClaim, onBack, isLoading, claimSuccess }) => {
  const BONUS_AMOUNT = 1000;

  return (
    <div className="animate-fadeIn relative">
      {claimSuccess && <Confetti />}
      <div className="flex items-center mb-6">
        <Button onClick={onBack} size="small" variant="secondary">
          <BackIcon className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold font-press-start text-cyan-400 text-center flex-grow">Daily Bonus</h1>
      </div>

      <div className="flex flex-col items-center justify-center text-center p-8 bg-black/20 rounded-lg min-h-[300px]">
        {isAvailable || claimSuccess ? (
          <>
            <GiftIcon className="w-24 h-24 text-yellow-400 mb-4 animate-bounce" />
            <h2 className="text-2xl mb-2 text-white">Your Daily Bonus is Ready!</h2>
            <p className="text-lg mb-6 flex items-center">
              Claim <ScoreIcon className="w-5 h-5 mx-1 text-yellow-300" /> <span className="font-bold text-yellow-300">{BONUS_AMOUNT.toLocaleString()}</span> points!
            </p>
            <Button onClick={onClaim} size="large" isLoading={isLoading} disabled={isLoading || claimSuccess}>
              {claimSuccess ? 'Claimed!' : 'Claim Now'}
            </Button>
          </>
        ) : (
          <>
            <GiftIcon className="w-24 h-24 text-gray-500 mb-4" />
            <h2 className="text-2xl mb-2 text-white">Bonus Claimed!</h2>
            <p className="text-lg mb-4 text-gray-300">Come back for your next bonus in:</p>
            {nextBonusTime && <CountdownTimer targetTime={nextBonusTime} />}
          </>
        )}
      </div>
    </div>
  );
};

export default BonusScreen;
