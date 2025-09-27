
import React from 'react';
import { User } from '../types';
import { ScoreIcon, ToncoinIcon } from './icons/UIIcons';

interface HeaderProps {
  user: User;
}

const Header: React.FC<HeaderProps> = ({ user }) => {
  return (
    <header className="bg-black/30 p-4 border-b border-cyan-400/20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-white">{user.username}</h2>
        </div>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1 bg-gray-700/50 px-3 py-1 rounded-full">
            <ScoreIcon className="w-4 h-4 text-yellow-400" />
            <span className="font-bold text-yellow-300">{user.score.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-1 bg-gray-700/50 px-3 py-1 rounded-full">
            <ToncoinIcon className="w-4 h-4" />
            <span className="font-bold text-cyan-300">{user.coins.toFixed(6)}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
