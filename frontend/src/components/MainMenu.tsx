import React from 'react';
import { Screen } from '../types';
import Button from './ui/Button';
import { GamepadIcon, BankIcon, GiftIcon } from './icons/UIIcons';

interface MainMenuProps {
  onNavigate: (screen: Screen) => void;
  isBonusAvailable: boolean;
}

const MainMenu: React.FC<MainMenuProps> = ({ onNavigate, isBonusAvailable }) => {
  return (
    <div className="flex flex-col items-center space-y-6 animate-fadeIn">
      <h1 className="text-3xl font-bold font-press-start text-cyan-400">Ana Menü</h1>
      <div className="w-full">
        <Button onClick={() => onNavigate(Screen.GameMenu)} fullWidth>
          <GamepadIcon className="w-6 h-6 mr-3" />
          Games
        </Button>
      </div>
      <div className="w-full relative">
        <Button 
          onClick={() => onNavigate(Screen.Bonus)} 
          fullWidth 
          className={isBonusAvailable ? 'animate-pulse border-2 border-yellow-400 shadow-yellow-400/50' : ''}
        >
          <GiftIcon className="w-6 h-6 mr-3" />
          Daily Bonus
        </Button>
        {isBonusAvailable && (
          <span className="absolute -top-2 -right-2 flex h-6 w-6">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-yellow-500 items-center justify-center text-xs font-bold text-black">!</span>
          </span>
        )}
      </div>
      <div className="w-full">
        <Button onClick={() => onNavigate(Screen.Bank)} fullWidth>
          <BankIcon className="w-6 h-6 mr-3" />
          Bank
        </Button>
      </div>
    </div>
  );
};

export default MainMenu;
