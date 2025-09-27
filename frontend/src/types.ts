import React from 'react';

export interface User {
  telegramId: string;
  username: string;
  score: number;
  coins: number;
}

export interface Game {
  id: string;
  name: string;
  description: string;
  instructions: string;
  component: React.ComponentType<{ onGameOver: (score: number) => void }>;
  icon: React.ReactNode;
  targetScore: number;
}

export enum Screen {
  Login,
  MainMenu,
  GameMenu,
  Bank,
  Playing,
  Bonus,
}
