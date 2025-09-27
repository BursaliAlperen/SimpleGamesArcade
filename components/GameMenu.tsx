import React, { useState } from 'react';
import { Game } from '../types';
import Card from './ui/Card';
import Button from './ui/Button';
import { BackIcon, PlayIcon } from './icons/UIIcons';
import { playSfx } from '../../audio';

interface GameMenuProps {
  games: Game[];
  onSelectGame: (gameId: string) => void;
  onBack: () => void;
}

const GameMenu: React.FC<GameMenuProps> = ({ games, onSelectGame, onBack }) => {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  const handleStartGame = (gameId: string) => {
    playSfx('start');
    onSelectGame(gameId);
  };
  
  // Renders the detail view for a selected game
  if (selectedGame) {
    return (
      <div className="animate-fadeIn flex flex-col text-center">
        <div className="flex items-center mb-6">
          <Button onClick={() => setSelectedGame(null)} size="small" variant="secondary">
              <BackIcon className="w-5 h-5"/>
          </Button>
          <h1 className="text-3xl font-bold font-press-start text-cyan-400 text-center flex-grow -ml-8">{selectedGame.name}</h1>
        </div>
        <div className="text-7xl my-4">{selectedGame.icon}</div>
        <h2 className="text-xl font-bold mb-2">Instructions</h2>
        <p className="text-gray-300 mb-8 min-h-[72px]">{selectedGame.instructions}</p>
        <Button onClick={() => handleStartGame(selectedGame.id)} size="large">
            <PlayIcon className="w-6 h-6 mr-3"/>
            Play Game
        </Button>
      </div>
    );
  }

  // Renders the grid of all available games
  return (
    <div className="animate-fadeIn">
      <div className="flex items-center mb-6">
        <Button onClick={onBack} size="small" variant="secondary">
            <BackIcon className="w-5 h-5"/>
        </Button>
        <h1 className="text-3xl font-bold font-press-start text-cyan-400 text-center flex-grow -ml-8">Oyunlar</h1>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {games.map((game) => (
          <Card 
            key={game.id} 
            onClick={() => {
              playSfx('click');
              setSelectedGame(game);
            }}
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