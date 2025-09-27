import React from 'react';
import { Game } from '../../types';
import SnakeGame from './SnakeGame';
import DinoGame from './DinoGame';
import Game2048 from './Game2048';

export const GAMES: Game[] = [
  {
    id: 'snake',
    name: 'Snake',
    description: 'Classic snake game. Eat food to grow.',
    component: SnakeGame,
    icon: <span>🐍</span>,
    targetScore: 20,
  },
  {
    id: 'dino',
    name: 'Dino Run',
    description: 'Jump over obstacles and run as far as you can.',
    component: DinoGame,
    icon: <span>🦖</span>,
    targetScore: 1000,
  },
  {
    id: '2048',
    name: '2048',
    description: 'Combine tiles to get to the 2048 tile.',
    component: Game2048,
    icon: <span>🔢</span>,
    targetScore: 2048,
  },
];
