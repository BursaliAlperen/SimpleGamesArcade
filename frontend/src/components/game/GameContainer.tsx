import React, { useEffect } from 'react';
import { Game } from '../../types';
import Button from '../ui/Button';
import Confetti from '../ui/Confetti';
import { ToncoinIcon } from '../icons/UIIcons';
import { playSfx } from '../../audio';

interface GameContainerProps {
  game: Game;
  onGameOver: (score: number) => void;
  onExit: () => void;
  lastGameScore: { score: number; coins: number } | null;
}

const GameContainer: React.FC<GameContainerProps> = ({ game, onGameOver, onExit, lastGameScore }) => {
  const GameComponent = game.component;
  const isWin = lastGameScore ? lastGameScore.score >= game.targetScore : false;

  useEffect(() => {
    if (lastGameScore) {
      playSfx(isWin ? 'win' : 'lose');
    }
  }, [lastGameScore, isWin]);

  const GameOverScreen: React.FC = () => (
    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center text-center p-4 z-10 animate-fadeIn">
      {isWin && <Confetti />}
      <h1 className="text-5xl md:text-6xl font-press-start mb-6" style={{ color: isWin ? '#4ade80' : '#f87171', textShadow: isWin ? '0 0 20px #4ade80' : '0 0 15px #f87171' }}>
        {isWin ? 'YOU WIN!' : 'GAME OVER'}
      </h1>

      <div className="bg-black/40 rounded-lg p-6 mb-8 w-full max-w-xs">
          <div className="mb-4">
              <p className="text-lg text-gray-400 uppercase tracking-widest">Skor</p>
              <p className="text-5xl font-bold text-yellow-400" style={{ textShadow: '0 0 10px #facc15' }}>
                  {lastGameScore?.score.toLocaleString()}
              </p>
          </div>
          <div>
              <p className="text-lg text-gray-400 uppercase tracking-widest">Kazanç</p>
              <div className="flex items-center justify-center text-3xl font-bold text-cyan-400" style={{ textShadow: '0 0 10px #22d3ee' }}>
                  <ToncoinIcon className="w-8 h-8 mr-2" />
                  <span>{lastGameScore?.coins.toFixed(6)}</span>
              </div>
          </div>
      </div>
      
      <Button onClick={onExit} size="large">Menüye Dön</Button>
    </div>
  );

  return (
    <div className="relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold font-press-start text-cyan-400">{game.name}</h2>
        <Button onClick={onExit} size="small" variant="secondary">Çıkış</Button>
      </div>
      <div className="relative aspect-square bg-black rounded-lg">
        {lastGameScore ? <GameOverScreen /> : <GameComponent onGameOver={onGameOver} />}
      </div>
    </div>
  );
};

export default GameContainer;
