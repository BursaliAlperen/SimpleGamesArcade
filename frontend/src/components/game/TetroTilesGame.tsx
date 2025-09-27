import React, { useState, useEffect, useCallback, useRef } from 'react';
import { playSfx } from '../../audio';

// --- Constants ---
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;

const TETROMINOES: { [key: string]: { shape: number[][]; color: string } } = {
  'I': { shape: [[1, 1, 1, 1]], color: 'bg-cyan-500' },
  'J': { shape: [[1, 0, 0], [1, 1, 1]], color: 'bg-blue-600' },
  'L': { shape: [[0, 0, 1], [1, 1, 1]], color: 'bg-orange-500' },
  'O': { shape: [[1, 1], [1, 1]], color: 'bg-yellow-400' },
  'S': { shape: [[0, 1, 1], [1, 1, 0]], color: 'bg-green-500' },
  'T': { shape: [[0, 1, 0], [1, 1, 1]], color: 'bg-purple-600' },
  'Z': { shape: [[1, 1, 0], [0, 1, 1]], color: 'bg-red-600' },
};

const PIECES = 'IJLOSTZ';

const createEmptyGrid = (): (string | null)[][] => Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null));

// --- Component ---
const TetroTilesGame: React.FC<{ onGameOver: (score: number) => void }> = ({ onGameOver }) => {
  const [grid, setGrid] = useState< (string | null)[][] >(createEmptyGrid());
  const [currentPiece, setCurrentPiece] = useState(getRandomPiece());
  const [nextPiece, setNextPiece] = useState(getRandomPiece());
  const [score, setScore] = useState(0);
  const [linesCleared, setLinesCleared] = useState(0);
  const [level, setLevel] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const dropTimeRef = useRef<number>(1000);
  const lastDropTimeRef = useRef<number>(0);

  function getRandomPiece() {
    const type = PIECES[Math.floor(Math.random() * PIECES.length)];
    const piece = TETROMINOES[type];
    return {
      shape: piece.shape,
      color: piece.color,
      pos: { x: Math.floor(GRID_WIDTH / 2) - Math.floor(piece.shape[0].length / 2), y: 0 },
    };
  }

  const isValidMove = (piece: any, newPos: { x: number; y: number }): boolean => {
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const newX = newPos.x + x;
          const newY = newPos.y + y;
          if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT || (newY >= 0 && grid[newY][newX])) {
            return false;
          }
        }
      }
    }
    return true;
  };

  const rotatePiece = () => {
    const clonedPiece = JSON.parse(JSON.stringify(currentPiece));
    const { shape } = clonedPiece;
    const newShape = shape[0].map((_: any, colIndex: number) => shape.map((row: any[]) => row[colIndex]).reverse());
    clonedPiece.shape = newShape;

    if (isValidMove(clonedPiece, clonedPiece.pos)) {
      setCurrentPiece(clonedPiece);
      playSfx('click');
    }
  };
  
  const movePiece = (dir: -1 | 1) => {
    const newPos = { x: currentPiece.pos.x + dir, y: currentPiece.pos.y };
    if (isValidMove(currentPiece, newPos)) {
      setCurrentPiece(prev => ({ ...prev, pos: newPos }));
    }
  };

  const dropPiece = useCallback(() => {
    const newPos = { x: currentPiece.pos.x, y: currentPiece.pos.y + 1 };
    if (isValidMove(currentPiece, newPos)) {
      setCurrentPiece(prev => ({ ...prev, pos: newPos }));
    } else {
      // Lock piece and check for game over
      if (currentPiece.pos.y < 1) {
        setIsGameOver(true);
        onGameOver(score);
        return;
      }
      // Lock the piece
      const newGrid = grid.map(row => [...row]);
      currentPiece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
          if (value) {
            newGrid[currentPiece.pos.y + y][currentPiece.pos.x + x] = currentPiece.color;
          }
        });
      });
      
      // Clear lines
      let linesRemoved = 0;
      const gridAfterClear = newGrid.filter(row => !row.every(cell => cell !== null));
      linesRemoved = GRID_HEIGHT - gridAfterClear.length;
      while (gridAfterClear.length < GRID_HEIGHT) {
        gridAfterClear.unshift(Array(GRID_WIDTH).fill(null));
      }

      if (linesRemoved > 0) {
        playSfx('win');
        setLinesCleared(prev => prev + linesRemoved);
        const linePoints = [0, 100, 300, 500, 800];
        setScore(prev => prev + linePoints[linesRemoved] * (level + 1));
      } else {
          playSfx('dino-land');
      }

      setGrid(gridAfterClear);
      setCurrentPiece(nextPiece);
      setNextPiece(getRandomPiece());
    }
  }, [currentPiece, grid, nextPiece, onGameOver, score, level]);


  const gameLoop = useCallback((time: number) => {
    if (isGameOver) return;
    const deltaTime = time - lastDropTimeRef.current;
    if (deltaTime > dropTimeRef.current) {
        dropPiece();
        lastDropTimeRef.current = time;
    }
    requestAnimationFrame(gameLoop);
  }, [isGameOver, dropPiece]);
  
  useEffect(() => {
    const newLevel = Math.floor(linesCleared / 10);
    if (newLevel > level) {
      setLevel(newLevel);
      dropTimeRef.current = 1000 / (newLevel + 1) + 200;
    }
  }, [linesCleared, level]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver) return;
      e.preventDefault();
      switch (e.key) {
        case 'ArrowLeft': movePiece(-1); break;
        case 'ArrowRight': movePiece(1); break;
        case 'ArrowDown': dropPiece(); break;
        case 'ArrowUp': rotatePiece(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPiece, isGameOver, dropPiece]);

  useEffect(() => {
    requestAnimationFrame(gameLoop);
  }, [gameLoop]);

  const displayGrid = grid.map(row => [...row]);
  currentPiece.shape.forEach((row, y) => {
    row.forEach((value, x) => {
      if (value) {
        const gridY = currentPiece.pos.y + y;
        const gridX = currentPiece.pos.x + x;
        if (gridY >= 0 && gridY < GRID_HEIGHT && gridX >= 0 && gridX < GRID_WIDTH) {
          displayGrid[gridY][gridX] = currentPiece.color;
        }
      }
    });
  });

  return (
    <div className="flex justify-center items-start w-full h-full bg-gray-800 border-2 border-cyan-800 p-2 gap-2">
      <div className="grid grid-cols-10 gap-px bg-gray-900/50" style={{ width: '70%', aspectRatio: '10/20' }}>
        {displayGrid.map((row, y) =>
          row.map((color, x) => (
            <div key={`${y}-${x}`} className={`aspect-square ${color || 'bg-gray-800/50'}`} />
          ))
        )}
      </div>
      <div className="w-[30%] flex flex-col gap-2">
        <div className="bg-black/50 p-2 rounded text-white text-center">
            <h4 className="font-bold text-sm">SCORE</h4>
            <p className="font-press-start text-lg">{score}</p>
        </div>
        <div className="bg-black/50 p-2 rounded text-white text-center">
            <h4 className="font-bold text-sm">LEVEL</h4>
            <p className="font-press-start text-lg">{level}</p>
        </div>
        <div className="bg-black/50 p-2 rounded text-white">
            <h4 className="font-bold text-sm text-center mb-1">NEXT</h4>
            <div className="grid grid-cols-4 gap-px mx-auto">
              {nextPiece.shape.map((row, y) =>
                row.map((value, x) => (
                  <div key={`${y}-${x}`} className={`aspect-square ${value ? nextPiece.color : 'bg-transparent'}`} />
                ))
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TetroTilesGame;
