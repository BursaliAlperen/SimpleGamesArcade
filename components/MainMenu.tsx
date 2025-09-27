
import React from 'react';
import { Screen } from '../types';
import Button from './ui/Button';
import { GamepadIcon, BankIcon } from './icons/UIIcons';

interface MainMenuProps {
  onNavigate: (screen: Screen) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center space-y-6 animate-fadeIn">
      <h1 className="text-3xl font-bold font-press-start text-cyan-400">Ana Menü</h1>
      <div className="w-full">
        <Button onClick={() => onNavigate(Screen.GameMenu)} fullWidth>
          <GamepadIcon className="w-6 h-6 mr-3" />
          Games
        </Button>
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
