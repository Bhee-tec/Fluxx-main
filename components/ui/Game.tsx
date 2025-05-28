'use client';
import { useState, useEffect, useCallback } from 'react';
import GameData from '@/components/ui/GameData';
import Header from '@/components/ui/Header';

const COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-orange-500'] as const;
type Color = typeof COLORS[number];

type NotificationType = 'points' | 'error' | 'info';

interface GameNotification {
  id: number;
  message: string;
  x: number;
  y: number;
  type: NotificationType;
}

interface GameProps {
  userId: string;
  initialScore: number;
  initialMoves: number;
  initialMoveResetAt?: Date | null;
}

export default function Game({ userId, initialScore, initialMoves, initialMoveResetAt }: GameProps) {
  const [tiles, setTiles] = useState<Color[]>([]);
  const [score, setScore] = useState<number>(initialScore);
  const [moves, setMoves] = useState<number>(initialMoves);
  const [moveResetAt, setMoveResetAt] = useState<Date | null>(initialMoveResetAt || null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<GameNotification[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const createBoard = useCallback(() => {
    let newTiles: Color[];
    do {
      newTiles = Array.from({ length: 64 }, () => COLORS[Math.floor(Math.random() * COLORS.length)]);
    } while (findMatches(newTiles).size > 0 || !hasPossibleMoves(newTiles));
    
    setTiles(newTiles);
  }, []);

  const updateGameState = async (pointsEarned: number, movesUsed: number) => {
    try {
      const response = await fetch('/api/gameUpdate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          pointsEarned,
          movesUsed
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update game');
      }

      const data = await response.json();
      setMoves(data.remainingMoves);
      setScore(data.newScore);
      setMoveResetAt(data.nextReset ? new Date(data.nextReset) : null);
    } catch (error) {
      console.error('Game state sync failed:', error);
      setScore(prev => prev - pointsEarned);
      setMoves(prev => prev + movesUsed);
    }
  };

  useEffect(() => {
    createBoard();

    // Check for move reset on component mount
    if (moves === 0 && moveResetAt) {
      const checkReset = async () => {
        await updateGameState(0, 0);
      };
      checkReset();
    }
  }, [createBoard]);

  useEffect(() => {
    if (!moveResetAt) return;

    const timeUntilReset = moveResetAt.getTime() - Date.now();
    if (timeUntilReset <= 0) {
      setMoves(30);
      setMoveResetAt(null);
      return;
    }

    const timeout = setTimeout(() => {
      setMoves(30);
      setMoveResetAt(null);
    }, timeUntilReset);

    return () => clearTimeout(timeout);
  }, [moveResetAt]);

  const handleTileClick = (index: number) => {
    if (isProcessing || moves <= 0) {
      const tileElement = document.getElementById(`tile-${index}`);
      if (tileElement) {
        const rect = tileElement.getBoundingClientRect();
        const message = moveResetAt 
          ? `Moves reset in ${formatTime(moveResetAt)} ⏳`
          : 'No moves left! ⏳';
        
        setNotifications(prev => [
          ...prev,
          {
            id: Date.now(),
            message,
            x: rect.left + rect.width/2,
            y: rect.top + rect.height/2,
            type: 'info'
          }
        ]);
      }
      return;
    }

    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else {
      if (checkValidSwap(selectedIndex, index)) {
        swapTiles(selectedIndex, index);
      }
      setSelectedIndex(null);
    }
  };

  const checkValidSwap = (index1: number, index2: number) => {
    const row1 = Math.floor(index1 / 8);
    const col1 = index1 % 8;
    const row2 = Math.floor(index2 / 8);
    const col2 = index2 % 8;
    return (
      (Math.abs(row1 - row2) === 1 && col1 === col2) || 
      (Math.abs(col1 - col2) === 1 && row1 === row2)
    );
  };

  const swapTiles = async (index1: number, index2: number) => {
    setIsProcessing(true);
    const tile1 = document.getElementById(`tile-${index1}`);
    const tile2 = document.getElementById(`tile-${index2}`);
    
    // Animate swap
    if (tile1 && tile2) {
      const rect1 = tile1.getBoundingClientRect();
      const rect2 = tile2.getBoundingClientRect();
      const deltaX = rect2.left - rect1.left;
      const deltaY = rect2.top - rect1.top;

      tile1.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      tile2.style.transform = `translate(${-deltaX}px, ${-deltaY}px)`;
      tile1.style.transition = tile2.style.transition = 'transform 0.3s ease-in-out';
      
      await new Promise(resolve => setTimeout(resolve, 300));
      tile1.style.transform = tile2.style.transform = '';
      tile1.style.transition = tile2.style.transition = '';
    }

    const newTiles = [...tiles];
    [newTiles[index1], newTiles[index2]] = [newTiles[index2], newTiles[index1]];
    setTiles(newTiles);

    await new Promise(resolve => setTimeout(resolve, 50));
    
    const matches = findMatches(newTiles);
    if (matches.size > 0) {
      const totalPoints = await handleMatches(matches);
      await updateGameState(totalPoints, 1);
    } else {
      [newTiles[index1], newTiles[index2]] = [newTiles[index2], newTiles[index1]];
      setTiles([...newTiles]);

      const tileElement = document.getElementById(`tile-${index1}`);
      if (tileElement) {
        const rect = tileElement.getBoundingClientRect();
        setNotifications(prev => [
          ...prev,
          {
            id: Date.now(),
            message: 'Wrong Move! 😅',
            x: rect.left + rect.width/2,
            y: rect.top + rect.height/2,
            type: 'error'
          }
        ]);
      }
    }
    
    setIsProcessing(false);
  };

  const findMatches = (tileArray: Color[]) => {
    const matched = new Set<number>();
    
    // Horizontal matches
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 6; col++) {
        const index = row * 8 + col;
        if (
          tileArray[index] &&
          tileArray[index] === tileArray[index + 1] &&
          tileArray[index] === tileArray[index + 2]
        ) {
          matched.add(index);
          matched.add(index + 1);
          matched.add(index + 2);
        }
      }
    }

    // Vertical matches
    for (let col = 0; col < 8; col++) {
      for (let row = 0; row < 6; row++) {
        const index = row * 8 + col;
        if (
          tileArray[index] &&
          tileArray[index] === tileArray[index + 8] &&
          tileArray[index] === tileArray[index + 16]
        ) {
          matched.add(index);
          matched.add(index + 8);
          matched.add(index + 16);
        }
      }
    }
    return matched;
  };

  const handleMatches = async (matched: Set<number>): Promise<number> => {
    const pointsEarned = matched.size * 5;
    setScore(s => s + pointsEarned);

    const firstIndex = Array.from(matched)[0];
    const tileElement = document.getElementById(`tile-${firstIndex}`);
    if (tileElement) {
      const rect = tileElement.getBoundingClientRect();
      setNotifications(prev => [
        ...prev,
        {
          id: Date.now(),
          message: `+${pointsEarned} Points! 🎉`,
          x: rect.left + rect.width/2,
          y: rect.top + rect.height/2,
          type: 'points'
        }
      ]);
    }

    const newTiles = tiles.map((color, index) =>
      matched.has(index) ? COLORS[Math.floor(Math.random() * COLORS.length)] : color
    );
    setTiles(newTiles);

    await new Promise(resolve => setTimeout(resolve, 300));
    const newMatches = findMatches(newTiles);
    let additionalPoints = 0;
    if (newMatches.size > 0) {
      additionalPoints = await handleMatches(newMatches);
    }

    return pointsEarned + additionalPoints;
  };

  const hasPossibleMoves = (tileArray: Color[]) => {
    for (let i = 0; i < tileArray.length; i++) {
      if (i % 8 < 7 && testSwap(i, i + 1, tileArray)) return true;
      if (i < 56 && testSwap(i, i + 8, tileArray)) return true;
    }
    return false;
  };

  const testSwap = (a: number, b: number, arr: Color[]) => {
    const temp = [...arr];
    [temp[a], temp[b]] = [temp[b], temp[a]];
    return findMatches(temp).size > 0;
  };

  const formatTime = (resetAt: Date) => {
    const diff = resetAt.getTime() - Date.now();
    if (diff <= 0) return '00:00';
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.slice(1));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [notifications]);

  return (
    <div className="max-w-md mx-auto mt-6 mb-6 relative">
      <Header score={score} />
      <GameData 
        score={score} 
        currentMoves={moves} 
        totalMoves={30}
        resetTime={moveResetAt ? formatTime(moveResetAt) : ''}
      />
      
      <div className="grid grid-cols-8 gap-1 bg-white p-2 rounded-xl shadow-xl touch-pan-y">
        {tiles.map((color, index) => (
          <button
            key={index}
            id={`tile-${index}`}
            onClick={() => handleTileClick(index)}
            className={`aspect-square rounded-lg transition-all duration-300 ${color}
              ${selectedIndex === index ? 'ring-4 ring-white scale-110' : ''}
              ${isProcessing || moves <= 0 ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          />
        ))}
      </div>

      {notifications.map(({ id, message, x, y, type }) => (
        <div
          key={id}
          className={`fixed font-bold text-lg animate-float pointer-events-none
            ${type === 'points' ? 'text-yellow-400' : ''}
            ${type === 'error' ? 'text-red-500' : ''}
            ${type === 'info' ? 'text-blue-400' : ''}`}
          style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
        >
          {message}
          <div className={`absolute inset-0 blur-sm rounded-full -z-10 
            ${type === 'points' ? 'bg-yellow-400/20' : ''}
            ${type === 'error' ? 'bg-red-500/20' : ''}
            ${type === 'info' ? 'bg-blue-400/20' : ''}`} />
        </div>
      ))}

      <style jsx global>{`
        @keyframes float {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-50px); }
        }
        .animate-float {
          animation: float 1s ease-out forwards;
        }
        html {
          touch-action: manipulation;
          overflow: hidden;
        }
        body {
          overscroll-behavior: none;
          -webkit-overflow-scrolling: touch;
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
}