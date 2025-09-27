import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playSfx } from '../../audio';

// --- Constants ---
const GAME_WIDTH = 100; // Corresponds to vw
const GAME_HEIGHT = 100; // Corresponds to vh for the container aspect ratio

const DINO_WIDTH = 5;
const DINO_HEIGHT = 7;
const DINO_INITIAL_Y = 5; // Y position of the dino's bottom edge from the ground

const GRAVITY = 0.05;
const JUMP_STRENGTH = 1.2;

const INITIAL_GAME_SPEED = 0.5;
const SPEED_INCREASE_INTERVAL = 500; // Increase speed every 500 score points
const SPEED_INCREASE_AMOUNT = 0.05;

const OBSTACLE_WIDTH = 3;
const OBSTACLE_HEIGHT = 6;
const OBSTACLE_MIN_GAP = 35;
const OBSTACLE_MAX_GAP = 70;

// --- Types ---
interface Obstacle {
  x: number;
  id: number;
}

const DinoGame: React.FC<{ onGameOver: (score: number) => void }> = ({ onGameOver }) => {
  const [dinoY, setDinoY] = useState(DINO_INITIAL_Y);
  const [dinoVelocityY, setDinoVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  
  const [obstacles, setObstacles] = useState<Obstacle[]>([{ x: GAME_WIDTH + 10, id: Date.now() }]);
  const [score, setScore] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);

  const gameSpeedRef = useRef(INITIAL_GAME_SPEED);
  const lastObstacleXRef = useRef(GAME_WIDTH);
  // FIX: Initialize useRef with null to provide an explicit initial value.
  const gameFrameRef = useRef<number | null>(null);

  // --- Game Loop ---
  const gameLoop = useCallback(() => {
    if (isGameOver) return;

    // --- Dino Physics ---
    let newVelocityY = dinoVelocityY - GRAVITY;
    let newDinoY = dinoY + newVelocityY;

    if (newDinoY <= DINO_INITIAL_Y) {
      newDinoY = DINO_INITIAL_Y;
      newVelocityY = 0;
      if (isJumping && score > 0) {
        playSfx('dino-land');
      }
      setIsJumping(false);
    }
    
    setDinoY(newDinoY);
    setDinoVelocityY(newVelocityY);
    
    // --- Obstacle Logic ---
    let collisionDetected = false;
    setObstacles(prevObstacles => {
      const newObstacles = prevObstacles
        .map(obs => ({ ...obs, x: obs.x - gameSpeedRef.current }))
        .filter(obs => obs.x > -OBSTACLE_WIDTH);

      // --- Collision Check ---
      const dinoLeft = GAME_WIDTH / 4;
      const dinoRight = dinoLeft + DINO_WIDTH;
      const dinoBottom = newDinoY;
      const dinoTop = dinoBottom + DINO_HEIGHT;

      for (const obs of newObstacles) {
        const obsLeft = obs.x;
        const obsRight = obs.x + OBSTACLE_WIDTH;
        const obsBottom = DINO_INITIAL_Y;
        const obsTop = obsBottom + OBSTACLE_HEIGHT;

        if (dinoRight > obsLeft && dinoLeft < obsRight && dinoTop > obsBottom && dinoBottom < obsTop) {
          collisionDetected = true;
          break;
        }
      }

      // --- Add New Obstacles ---
      const lastObstacle = newObstacles[newObstacles.length - 1];
      const lastX = lastObstacle ? lastObstacle.x : 0;
      
      if (GAME_WIDTH - lastX > OBSTACLE_MIN_GAP) {
          const gap = Math.random() * (OBSTACLE_MAX_GAP - OBSTACLE_MIN_GAP) + OBSTACLE_MIN_GAP;
          if (GAME_WIDTH - lastX > gap) {
              newObstacles.push({ x: GAME_WIDTH, id: Date.now() });
          }
      }

      return newObstacles;
    });

    if (collisionDetected) {
      playSfx('collision');
      setIsGameOver(true);
      onGameOver(Math.floor(score));
      return;
    }
    
    // --- Score & Speed ---
    setScore(s => s + 0.1);
    if (score > 0 && Math.floor(score) % SPEED_INCREASE_INTERVAL === 0) {
        gameSpeedRef.current += SPEED_INCREASE_AMOUNT;
    }

    gameFrameRef.current = requestAnimationFrame(gameLoop);
  }, [dinoY, dinoVelocityY, isGameOver, onGameOver, score, isJumping]);

  // --- Input Handling ---
  const handleJump = useCallback(() => {
    if (!isJumping && !isGameOver) {
      playSfx('dino-jump');
      setIsJumping(true);
      setDinoVelocityY(JUMP_STRENGTH);
    }
  }, [isJumping, isGameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJump();
      }
    };
    
    const handleTouchStart = (e: TouchEvent) => {
        e.preventDefault();
        handleJump();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [handleJump]);
  
  // --- Start & Stop Game Loop ---
  useEffect(() => {
    if (!isGameOver) {
      gameFrameRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if(gameFrameRef.current) {
        cancelAnimationFrame(gameFrameRef.current);
      }
    };
  }, [gameLoop, isGameOver]);

  return (
    <div 
        className="relative w-full h-full bg-gray-800 border-2 border-cyan-800 overflow-hidden"
        onClick={handleJump}
    >
        {/* Ground */}
        <div 
            className="absolute bottom-0 left-0 w-full bg-gray-600"
            style={{ height: `${DINO_INITIAL_Y}%`}}
        />

        {/* Dino */}
        <div 
            className="absolute bg-green-400"
            style={{
                left: `${GAME_WIDTH / 4}%`,
                bottom: `${dinoY}%`,
                width: `${DINO_WIDTH}%`,
                height: `${DINO_HEIGHT}%`,
                borderRadius: '4px 4px 0 0'
            }}
        />
        
        {/* Obstacles */}
        {obstacles.map(obs => (
            <div
                key={obs.id}
                className="absolute bg-yellow-600"
                style={{
                    left: `${obs.x}%`,
                    bottom: `${DINO_INITIAL_Y}%`,
                    width: `${OBSTACLE_WIDTH}%`,
                    height: `${OBSTACLE_HEIGHT}%`,
                }}
            />
        ))}

        {/* Score */}
        <div className="absolute top-2 right-2 text-white font-press-start bg-black/50 px-2 py-1 rounded">
            SCORE: {Math.floor(score)}
        </div>
        
        {/* Start Message */}
        {score === 0 && !isJumping && (
            <div className="absolute inset-0 flex items-center justify-center text-white text-lg font-bold animate-pulse">
                Press Space or Tap to Jump
            </div>
        )}
    </div>
  );
};

export default DinoGame;