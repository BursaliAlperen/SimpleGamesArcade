import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playSfx } from '../../audio';

const GRID_SIZE = 20;
const TILE_SIZE = 100 / GRID_SIZE; // Percentage

type Position = { x: number; y: number };
enum Direction { Up, Down, Left, Right }

const getRandomPosition = (): Position => ({
  x: Math.floor(Math.random() * GRID_SIZE),
  y: Math.floor(Math.random() * GRID_SIZE),
});

const SnakeGame: React.FC<{ onGameOver: (score: number) => void }> = ({ onGameOver }) => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>(getRandomPosition());
  const directionRef = useRef<Direction>(Direction.Right);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [speed, setSpeed] = useState(200);

  const moveSnake = useCallback(() => {
    if (isGameOver) return;

    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };

      switch (directionRef.current) {
        case Direction.Up: head.y -= 1; break;
        case Direction.Down: head.y += 1; break;
        case Direction.Left: head.x -= 1; break;
        case Direction.Right: head.x += 1; break;
      }
      
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        playSfx('collision');
        setIsGameOver(true);
        return prevSnake;
      }
      
      for (const segment of newSnake) {
          if (segment.x === head.x && segment.y === head.y) {
              playSfx('collision');
              setIsGameOver(true);
              return prevSnake;
          }
      }

      newSnake.unshift(head);
      
      if (head.x === food.x && head.y === food.y) {
        playSfx('snake-eat');
        setScore(s => s + 1);
        setFood(getRandomPosition());
        setSpeed(s => Math.max(50, s * 0.95));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food.x, food.y, isGameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const dir = directionRef.current;
      switch (e.key) {
        case 'ArrowUp': if (dir !== Direction.Down) directionRef.current = Direction.Up; break;
        case 'ArrowDown': if (dir !== Direction.Up) directionRef.current = Direction.Down; break;
        case 'ArrowLeft': if (dir !== Direction.Right) directionRef.current = Direction.Left; break;
        case 'ArrowRight': if (dir !== Direction.Left) directionRef.current = Direction.Right; break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  useEffect(() => {
    if (isGameOver) {
      onGameOver(score);
      return;
    }
    const gameInterval = setInterval(moveSnake, speed);
    return () => clearInterval(gameInterval);
  }, [snake, moveSnake, isGameOver, onGameOver, score, speed]);
  
  return (
    <div className="relative w-full h-full bg-gray-800 border-2 border-cyan-800">
      {snake.map((segment, index) => (
        <div
          key={index}
          className="absolute rounded-sm"
          style={{ 
            left: `${segment.x * TILE_SIZE}%`, 
            top: `${segment.y * TILE_SIZE}%`, 
            width: `${TILE_SIZE}%`, 
            height: `${TILE_SIZE}%`,
            backgroundColor: index === 0 ? '#4ade80' : '#34d399'
          }}
        />
      ))}
      <div
        className="absolute rounded-full"
        style={{
          left: `${food.x * TILE_SIZE}%`,
          top: `${food.y * TILE_SIZE}%`,
          width: `${TILE_SIZE}%`,
          height: `${TILE_SIZE}%`,
          backgroundColor: '#f87171',
          boxShadow: '0 0 10px #f87171'
        }}
      />
      <div className="absolute top-2 right-2 text-white font-press-start bg-black/50 px-2 py-1 rounded">
        SCORE: {score}
      </div>
    </div>
  );
};

export default SnakeGame;