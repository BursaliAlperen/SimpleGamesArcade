import React, { useState, useEffect, useCallback } from 'react';
import { playSfx } from '../../audio';

const GRID_SIZE = 4;

type Tile = number;
type Grid = Tile[][];

const createEmptyGrid = (): Grid => Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));

const getRandomEmptyCell = (grid: Grid): { x: number; y: number } | null => {
  const emptyCells: { x: number; y: number }[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x] === 0) {
        emptyCells.push({ x, y });
      }
    }
  }
  if (emptyCells.length === 0) return null;
  return emptyCells[Math.floor(Math.random() * emptyCells.length)];
};

const addRandomTile = (grid: Grid): Grid => {
  const newGrid = grid.map(row => [...row]);
  const cell = getRandomEmptyCell(newGrid);
  if (cell) {
    newGrid[cell.y][cell.x] = Math.random() < 0.9 ? 2 : 4;
  }
  return newGrid;
};

const move = (grid: Grid, direction: 'up' | 'down' | 'left' | 'right'): { newGrid: Grid; scoreGained: number; moved: boolean } => {
    let newGrid = JSON.parse(JSON.stringify(grid));
    let scoreGained = 0;
    let moved = false;

    const rotateGrid = (g: Grid): Grid => {
        const rotated = createEmptyGrid();
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                rotated[x][GRID_SIZE - 1 - y] = g[y][x];
            }
        }
        return rotated;
    };

    let rotations = 0;
    if (direction === 'up') rotations = 1;
    if (direction === 'right') rotations = 2;
    if (direction === 'down') rotations = 3;

    for(let i=0; i < rotations; i++){
        newGrid = rotateGrid(newGrid);
    }

    for (let y = 0; y < GRID_SIZE; y++) {
        const originalRow = JSON.stringify(newGrid[y]);
        let row = newGrid[y].filter(tile => tile !== 0);
        let newRow: Tile[] = [];
        for (let i = 0; i < row.length; i++) {
            if (i + 1 < row.length && row[i] === row[i + 1]) {
                const newValue = row[i] * 2;
                newRow.push(newValue);
                scoreGained += newValue;
                i++;
            } else {
                newRow.push(row[i]);
            }
        }
        while (newRow.length < GRID_SIZE) {
            newRow.push(0);
        }
        
        if (JSON.stringify(newRow) !== originalRow) {
            moved = true;
        }

        newGrid[y] = newRow;
    }
    
    for(let i=0; i < (4 - rotations) % 4; i++){
        newGrid = rotateGrid(newGrid);
    }
    
    return { newGrid, scoreGained, moved };
};


const isGameOver = (grid: Grid): boolean => {
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (grid[y][x] === 0) return false;
        }
    }
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            const current = grid[y][x];
            if (y < GRID_SIZE - 1 && grid[y + 1][x] === current) return false;
            if (x < GRID_SIZE - 1 && grid[y][x + 1] === current) return false;
        }
    }
    return true;
};

const Game2048: React.FC<{ onGameOver: (score: number) => void }> = ({ onGameOver }) => {
    const [grid, setGrid] = useState<Grid>(addRandomTile(addRandomTile(createEmptyGrid())));
    const [score, setScore] = useState(0);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        let direction: 'up' | 'down' | 'left' | 'right' | null = null;
        switch (e.key) {
            case 'ArrowUp': direction = 'up'; e.preventDefault(); break;
            case 'ArrowDown': direction = 'down'; e.preventDefault(); break;
            case 'ArrowLeft': direction = 'left'; e.preventDefault(); break;
            case 'ArrowRight': direction = 'right'; e.preventDefault(); break;
            default: return;
        }

        const { newGrid, scoreGained, moved } = move(grid, direction);

        if (moved) {
            if (scoreGained > 0) {
                playSfx('tile-merge');
            }
            const gridWithNewTile = addRandomTile(newGrid);
            setGrid(gridWithNewTile);
            const newScore = score + scoreGained;
            setScore(newScore);

            if (isGameOver(gridWithNewTile)) {
                onGameOver(newScore);
            }
        } else if (isGameOver(grid)) {
             onGameOver(score);
        }
    }, [grid, onGameOver, score]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
    
    const getTileColor = (value: number) => {
        switch (value) {
            case 2: return 'bg-gray-200 text-gray-800';
            case 4: return 'bg-gray-300 text-gray-800';
            case 8: return 'bg-orange-300 text-white';
            case 16: return 'bg-orange-400 text-white';
            case 32: return 'bg-red-400 text-white';
            case 64: return 'bg-red-500 text-white';
            case 128: return 'bg-yellow-400 text-white';
            case 256: return 'bg-yellow-500 text-white';
            case 512: return 'bg-yellow-600 text-white';
            case 1024: return 'bg-indigo-400 text-white';
            case 2048: return 'bg-indigo-600 text-white';
            default: return 'bg-gray-700';
        }
    };
    
    return (
        <div className="relative w-full h-full bg-gray-800 border-2 border-cyan-800 p-2 rounded-lg flex flex-col">
            <div className="flex justify-between items-center mb-2 px-2">
                <h3 className="text-xl font-bold text-white">2048</h3>
                <div className="bg-black/50 px-4 py-2 rounded text-white font-press-start">
                    SCORE: {score}
                </div>
            </div>
            <div className="bg-gray-900/50 rounded-md p-2 flex-grow grid grid-cols-4 grid-rows-4 gap-2">
                {grid.map((row, y) => 
                    row.map((tile, x) => (
                        <div key={`${y}-${x}`} className={`w-full h-full rounded-md flex items-center justify-center font-bold text-xl md:text-3xl transition-all duration-100 ${getTileColor(tile)}`}>
                            {tile > 0 ? tile : ''}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Game2048;
