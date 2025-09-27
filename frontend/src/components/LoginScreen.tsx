import React from 'react';
import Button from './ui/Button';
import { TelegramIcon } from './icons/UIIcons';

interface LoginScreenProps {
  onLogin: () => void;
  isLoading: boolean;
  error?: string | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, isLoading, error }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center animate-fadeIn p-4">
      <h1 className="text-5xl font-press-start mb-4 text-cyan-400" style={{ textShadow: '0 0 10px #0ff' }}>
        ARCADE
      </h1>
      <h2 className="text-2xl mb-8 text-white">PLATFORM</h2>
      <p className="mb-10 text-gray-300">
        Play classic games. Earn rewards.
      </p>
      <Button onClick={onLogin} size="large" isLoading={isLoading} disabled={isLoading}>
        <TelegramIcon className="w-6 h-6 mr-3" />
        Telegram ile Devam Et
      </Button>
      {error && <p className="text-red-400 mt-4">{error}</p>}
    </div>
  );
};

export default LoginScreen;
