import React, { useState, useCallback } from 'react';
import Game from './components/Game';
import UI from './components/UI';
import { GameState, GameStats } from './types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>('START');
  const [stats, setStats] = useState<GameStats>({
    score: 0,
    distance: 0,
    coins: 0,
    speed: 0.2,
  });

  const handleStart = useCallback(() => {
    setGameState('PLAYING');
  }, []);

  const handleGameOver = useCallback((finalStats: GameStats) => {
    setStats(finalStats);
    setGameState('GAMEOVER');
  }, []);

  const handleStatsUpdate = useCallback((currentStats: GameStats) => {
    setStats(currentStats);
  }, []);

  const handleRestart = useCallback(() => {
    setGameState('START');
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      <Game 
        gameState={gameState} 
        onGameOver={handleGameOver} 
        onStatsUpdate={handleStatsUpdate} 
      />
      
      <UI 
        gameState={gameState} 
        stats={stats} 
        onStart={handleStart} 
        onRestart={handleRestart} 
      />
      
      {/* Vignette effect */}
      <div className="fixed inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.5)]" />
    </div>
  );
}
