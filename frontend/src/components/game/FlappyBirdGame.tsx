import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playSfx } from '../../audio';

// --- Constants ---
// All values are percentages of the container's dimensions for responsiveness
const GAME_HEIGHT = 100;
const GAME_WIDTH = 100;

const BIRD_HEIGHT = 6;
const BIRD_WIDTH = 7;
const BIRD_INITIAL_X = 15;
const BIRD_INITIAL_Y = 50;

const GRAVITY = 0.2;
const JUMP_STRENGTH = 4;
const ROTATION_FACTOR = 5;

const PIPE_WIDTH = 12;
const PIPE_GAP = 30; // Vertical gap between pipes
const PIPE_SPACING = 55; // Horizontal distance between pipes
const GAME_SPEED = 0.7;

// --- Interfaces ---
interface Pipe {
  id: number;
  x: number; // Left position of the pipe
  gapY: number; // Vertical center of the gap
}

// --- Component ---
const FlappyBirdGame: React.FC<{ onGameOver: (score: number) => void }> = ({ onGameOver }) => {
  const [birdY, setBirdY] = useState(BIRD_INITIAL_Y);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [score, setScore] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);

  const gameLoopRef = useRef<number | null>(null);

  const resetGame = () => {
    setBirdY(BIRD_INITIAL_Y);
    setBirdVelocity(0);
    setScore(0);
    setPipes([
        { id: Date.now(), x: GAME_WIDTH, gapY: Math.random() * (GAME_HEIGHT - PIPE_GAP - 20) + 10 },
        { id: Date.now() + 1, x: GAME_WIDTH + PIPE_SPACING, gapY: Math.random() * (GAME_HEIGHT - PIPE_GAP - 20) + 10 },
    ]);
  };

  const flap = useCallback(() => {
    if (isGameOver) return;
    if (!isStarted) {
      setIsStarted(true);
    }
    setBirdVelocity(-JUMP_STRENGTH);
    playSfx('dino-jump');
  }, [isStarted, isGameOver]);
  
  const gameLoop = useCallback(() => {
    // Bird physics
    const newVelocity = birdVelocity + GRAVITY;
    const newBirdY = birdY + newVelocity;
    setBirdVelocity(newVelocity);
    setBirdY(newBirdY);

    // Pipe movement and generation
    let scoreIncremented = false;
    const newPipes = pipes.map(pipe => {
        const newX = pipe.x - GAME_SPEED;
        // Check for scoring
        if (!scoreIncremented && pipe.x > BIRD_INITIAL_X && newX <= BIRD_INITIAL_X) {
            setScore(s => s + 1);
            playSfx('tile-merge');
            scoreIncremented = true;
        }
        return { ...pipe, x: newX };
    }).filter(pipe => pipe.x > -PIPE_WIDTH);
    
    // Add new pipe
    const lastPipe = newPipes[newPipes.length - 1];
    if (lastPipe && GAME_WIDTH - lastPipe.x > PIPE_SPACING) {
        newPipes.push({
            id: Date.now(),
            x: GAME_WIDTH,
            gapY: Math.random() * (GAME_HEIGHT - PIPE_GAP - 20) + 10
        });
    }
    setPipes(newPipes);

    // Collision detection
    // 1. Ground and ceiling
    if (newBirdY > GAME_HEIGHT - BIRD_HEIGHT || newBirdY < 0) {
      playSfx('collision');
      setIsGameOver(true);
      return;
    }

    // 2. Pipes
    const birdRight = BIRD_INITIAL_X + BIRD_WIDTH;
    for (const pipe of pipes) {
        const pipeRight = pipe.x + PIPE_WIDTH;
        const gapTop = pipe.gapY;
        const gapBottom = pipe.gapY + PIPE_GAP;

        // Check if bird is horizontally aligned with the pipe
        if (birdRight > pipe.x && BIRD_INITIAL_X < pipeRight) {
            // Check if bird is hitting the top or bottom pipe
            if (newBirdY < gapTop || newBirdY + BIRD_HEIGHT > gapBottom) {
                playSfx('collision');
                setIsGameOver(true);
                return;
            }
        }
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [birdY, birdVelocity, pipes]);
  
  useEffect(() => {
    resetGame();
  }, []);

  useEffect(() => {
    if (isStarted && !isGameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    if (isGameOver) {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      onGameOver(score);
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [isStarted, isGameOver, gameLoop, onGameOver, score]);

  useEffect(() => {
    window.addEventListener('keydown', flap);
    window.addEventListener('touchstart', flap);
    window.addEventListener('mousedown', flap);
    return () => {
      window.removeEventListener('keydown', flap);
      window.removeEventListener('touchstart', flap);
      window.removeEventListener('mousedown', flap);
    };
  }, [flap]);

  const birdRotation = Math.min(Math.max(-30, birdVelocity * ROTATION_FACTOR), 90);

  return (
    <div className="relative w-full h-full bg-cyan-200 overflow-hidden">
      {/* Background elements */}
      <div className="absolute bottom-0 w-full h-1/5 bg-green-500 border-t-4 border-green-600 z-20"/>
      <div className="absolute bottom-[20%] w-full h-10 bg-green-400 z-10"/>

      {/* Bird */}
      <div 
        className="absolute w-7 h-6 bg-yellow-400 rounded-full border-2 border-black z-30"
        style={{ 
            top: `${birdY}%`, 
            left: `${BIRD_INITIAL_X}%`,
            width: `${BIRD_WIDTH}%`,
            height: `${BIRD_HEIGHT}%`,
            transform: `rotate(${birdRotation}deg)`,
            transition: 'transform 100ms linear'
        }}
      />

      {/* Pipes */}
      {pipes.map(pipe => (
        <React.Fragment key={pipe.id}>
          {/* Top Pipe */}
          <div className="absolute bg-green-600 border-4 border-green-800" style={{
            left: `${pipe.x}%`,
            top: 0,
            width: `${PIPE_WIDTH}%`,
            height: `${pipe.gapY}%`,
          }} />
          {/* Bottom Pipe */}
          <div className="absolute bg-green-600 border-4 border-green-800" style={{
            left: `${pipe.x}%`,
            top: `${pipe.gapY + PIPE_GAP}%`,
            width: `${PIPE_WIDTH}%`,
            height: `${GAME_HEIGHT}%`,
          }} />
        </React.Fragment>
      ))}
      
      {/* Score */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-5xl font-press-start text-white z-40" style={{ textShadow: '2px 2px 4px #000' }}>
        {score}
      </div>

      {/* Start Message */}
      {!isStarted && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
            <p className="text-2xl font-bold text-white animate-pulse" style={{ textShadow: '2px 2px 4px #000' }}>Tap to Start</p>
        </div>
      )}
    </div>
  );
};

export default FlappyBirdGame;
