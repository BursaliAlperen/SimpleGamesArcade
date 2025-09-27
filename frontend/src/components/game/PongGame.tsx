import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playSfx } from '../../audio';

// --- Constants ---
const GAME_WIDTH = 100;
const GAME_HEIGHT = 100;

const PADDLE_WIDTH = 2;
const PADDLE_HEIGHT = 20;
const PADDLE_SPEED = 1.2;
const AI_PADDLE_SPEED_FACTOR = 0.05;

const BALL_SIZE = 2;
const INITIAL_BALL_SPEED_X = 0.6;
const INITIAL_BALL_SPEED_Y = 0.4;
const BALL_SPEED_INCREASE = 1.05;

const WINNING_SCORE = 10;

// --- Component ---
const PongGame: React.FC<{ onGameOver: (score: number) => void }> = ({ onGameOver }) => {
  const [ball, setBall] = useState({ x: 50, y: 50, dx: INITIAL_BALL_SPEED_X, dy: INITIAL_BALL_SPEED_Y });
  const [playerY, setPlayerY] = useState(50 - PADDLE_HEIGHT / 2);
  const [aiY, setAiY] = useState(50 - PADDLE_HEIGHT / 2);
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [isGameOver, setIsGameOver] = useState(false);

  const gameLoopRef = useRef<number | null>(null);
  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const resetBall = (direction: 'left' | 'right') => {
    setBall({
      x: 50,
      y: 50,
      dx: direction === 'left' ? -INITIAL_BALL_SPEED_X : INITIAL_BALL_SPEED_X,
      dy: (Math.random() > 0.5 ? 1 : -1) * INITIAL_BALL_SPEED_Y
    });
  };

  const gameLoop = useCallback(() => {
    if (isGameOver) return;
    
    // --- Paddle Movement ---
    // Player
    setPlayerY(prevY => {
        let newY = prevY;
        if (keysPressed.current['ArrowUp']) newY -= PADDLE_SPEED;
        if (keysPressed.current['ArrowDown']) newY += PADDLE_SPEED;
        return Math.max(0, Math.min(newY, GAME_HEIGHT - PADDLE_HEIGHT));
    });
    // AI
    setAiY(prevY => {
        const aiCenter = prevY + PADDLE_HEIGHT / 2;
        const idealMove = (ball.y - aiCenter) * AI_PADDLE_SPEED_FACTOR;
        const newY = prevY + idealMove * (PADDLE_SPEED / 2);
        return Math.max(0, Math.min(newY, GAME_HEIGHT - PADDLE_HEIGHT));
    });

    // --- Ball Movement ---
    setBall(prevBall => {
      let { x, y, dx, dy } = prevBall;
      x += dx;
      y += dy;

      // Wall collision (top/bottom)
      if (y <= 0 || y >= GAME_HEIGHT - BALL_SIZE) {
        dy = -dy;
        playSfx('click');
      }

      // Paddle collision
      const playerPaddleTop = playerY;
      const playerPaddleBottom = playerY + PADDLE_HEIGHT;
      const aiPaddleTop = aiY;
      const aiPaddleBottom = aiY + PADDLE_HEIGHT;
      
      // Player paddle
      if (dx < 0 && x <= PADDLE_WIDTH && y + BALL_SIZE > playerPaddleTop && y < playerPaddleBottom) {
          dx = -dx * BALL_SPEED_INCREASE;
          playSfx('tile-merge');
      }
      // AI paddle
      if (dx > 0 && x >= GAME_WIDTH - PADDLE_WIDTH - BALL_SIZE && y + BALL_SIZE > aiPaddleTop && y < aiPaddleBottom) {
          dx = -dx * BALL_SPEED_INCREASE;
          playSfx('tile-merge');
      }
      
      // Score detection
      if (x < 0) { // AI scores
        setScores(s => ({ ...s, ai: s.ai + 1 }));
        resetBall('right');
        playSfx('lose');
      }
      if (x > GAME_WIDTH) { // Player scores
        setScores(s => ({ ...s, player: s.player + 1 }));
        resetBall('left');
        playSfx('snake-eat');
      }

      return { x, y, dx, dy };
    });

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [ball.y, isGameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.key] = false; };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    resetBall(Math.random() > 0.5 ? 'left' : 'right');

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (scores.player >= WINNING_SCORE || scores.ai >= WINNING_SCORE) {
      setIsGameOver(true);
      onGameOver(scores.player);
    }
  }, [scores, onGameOver]);

  useEffect(() => {
    if (!isGameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameLoop, isGameOver]);

  return (
    <div className="relative w-full h-full bg-gray-900 border-2 border-cyan-800 text-white overflow-hidden">
      {/* Center Line */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 h-full w-1 border-l-4 border-dashed border-gray-600" />
      
      {/* Scores */}
      <div className="absolute top-4 left-1/4 text-5xl font-press-start text-cyan-400/50">{scores.player}</div>
      <div className="absolute top-4 right-1/4 text-5xl font-press-start text-cyan-400/50">{scores.ai}</div>
      
      {/* Paddles */}
      <div className="absolute bg-cyan-400" style={{ left: 0, top: `${playerY}%`, width: `${PADDLE_WIDTH}%`, height: `${PADDLE_HEIGHT}%` }} />
      <div className="absolute bg-cyan-400" style={{ right: 0, top: `${aiY}%`, width: `${PADDLE_WIDTH}%`, height: `${PADDLE_HEIGHT}%` }} />
      
      {/* Ball */}
      <div className="absolute bg-yellow-400 rounded-full" style={{ left: `${ball.x}%`, top: `${ball.y}%`, width: `${BALL_SIZE}%`, height: `${BALL_SIZE}%` }} />
    </div>
  );
};

export default PongGame;
