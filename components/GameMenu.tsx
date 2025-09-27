
import React from 'react';
import { Game } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import { BackIcon } from './icons/UIIcons';
import { playSfx } from '../../audio';

interface GameMenuProps {
  games: Game[];
  onSelectGame: (gameId: string) => void;
  onBack: () => void;
}

const GameMenu: React.FC<GameMenuProps> = ({ games, onSelectGame, onBack }) => {
  const handleSelect = (gameId: string) => {
    playSfx('start');
    onSelectGame(gameId);
  };

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center mb-6">
        <Button onClick={onBack} size="small" variant="secondary">
            <BackIcon className="w-5 h-5"/>
        </Button>
        <h1 className="text-3xl font-bold font-press-start text-cyan-400 text-center flex-grow">Oyunlar</h1>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {games.map((game) => (
          <Card 
            key={game.id} 
            onClick={() => handleSelect(game.id)}
            className="flex flex-col items-center justify-center p-4 text-center aspect-square"
          >
            <div className="text-5xl mb-2">{game.icon}</div>
            <h3 className="font-bold text-lg">{game.name}</h3>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GameMenu;
