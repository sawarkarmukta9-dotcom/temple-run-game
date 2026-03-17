import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, GameStats } from '../types';
import { Trophy, Coins, Play, RotateCcw, ArrowLeft, ArrowRight, ArrowUp, ArrowDown } from 'lucide-react';

interface UIProps {
  gameState: GameState;
  stats: GameStats;
  onStart: () => void;
  onRestart: () => void;
}

const UI: React.FC<UIProps> = ({ gameState, stats, onStart, onRestart }) => {
  return (
    <div className="fixed inset-0 pointer-events-none flex flex-col items-center justify-center font-sans text-white">
      {/* HUD */}
      {gameState === 'PLAYING' && (
        <div className="absolute top-8 left-8 right-8 flex justify-between items-start pointer-events-none">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
              <Trophy className="w-5 h-5 text-yellow-400" />
              <span className="text-2xl font-bold tracking-tighter">{stats.score}</span>
            </div>
            <div className="text-xs uppercase tracking-widest opacity-60 ml-1">Current Score</div>
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10">
              <span className="text-2xl font-bold tracking-tighter">{stats.coins}</span>
              <Coins className="w-5 h-5 text-yellow-400" />
            </div>
            <div className="text-xs uppercase tracking-widest opacity-60 mr-1">Coins Collected</div>
          </div>
        </div>
      )}

      {/* Start Screen */}
      <AnimatePresence>
        {gameState === 'START' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="pointer-events-auto flex flex-col items-center gap-8 bg-black/60 backdrop-blur-xl p-12 rounded-[40px] border border-white/10 shadow-2xl"
          >
            <div className="flex flex-col items-center gap-2">
              <h1 className="text-6xl font-black tracking-tighter uppercase italic">Temple Runner</h1>
              <p className="text-white/60 uppercase tracking-[0.3em] text-sm">Infinite 3D Adventure</p>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex gap-2">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs">A</kbd>
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs">D</kbd>
                </div>
                <span className="text-[10px] uppercase tracking-widest opacity-40">Move Lanes</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex gap-2">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs">Space</kbd>
                </div>
                <span className="text-[10px] uppercase tracking-widest opacity-40">Jump</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex gap-2">
                  <kbd className="px-2 py-1 bg-white/10 rounded text-xs">S</kbd>
                </div>
                <span className="text-[10px] uppercase tracking-widest opacity-40">Slide</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex gap-2">
                  <ArrowLeft className="w-3 h-3 opacity-40" />
                  <ArrowUp className="w-3 h-3 opacity-40" />
                  <ArrowDown className="w-3 h-3 opacity-40" />
                  <ArrowRight className="w-3 h-3 opacity-40" />
                </div>
                <span className="text-[10px] uppercase tracking-widest opacity-40">Arrows Work Too</span>
              </div>
            </div>

            <button
              onClick={onStart}
              className="group relative flex items-center gap-3 bg-white text-black px-10 py-5 rounded-full font-bold text-xl hover:scale-105 transition-transform active:scale-95"
            >
              <Play className="w-6 h-6 fill-current" />
              START RUNNING
              <div className="absolute -inset-1 bg-white/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Over Screen */}
      <AnimatePresence>
        {gameState === 'GAMEOVER' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="pointer-events-auto flex flex-col items-center gap-8 bg-black/80 backdrop-blur-2xl p-12 rounded-[40px] border border-red-500/20 shadow-2xl"
          >
            <div className="flex flex-col items-center gap-2">
              <h2 className="text-5xl font-black tracking-tighter uppercase text-red-500 italic">Game Over</h2>
              <p className="text-white/40 uppercase tracking-widest text-xs">You hit an obstacle!</p>
            </div>

            <div className="flex gap-12 py-4">
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black tracking-tighter">{stats.score}</span>
                <span className="text-[10px] uppercase tracking-widest opacity-40">Final Score</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black tracking-tighter">{stats.coins}</span>
                <span className="text-[10px] uppercase tracking-widest opacity-40">Coins</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-4xl font-black tracking-tighter">{Math.floor(stats.distance)}m</span>
                <span className="text-[10px] uppercase tracking-widest opacity-40">Distance</span>
              </div>
            </div>

            <button
              onClick={onRestart}
              className="group relative flex items-center gap-3 bg-red-600 text-white px-10 py-5 rounded-full font-bold text-xl hover:scale-105 transition-transform active:scale-95"
            >
              <RotateCcw className="w-6 h-6" />
              TRY AGAIN
              <div className="absolute -inset-1 bg-red-600/40 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Controls Overlay (Visible only on small screens) */}
      {gameState === 'PLAYING' && (
        <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-4 md:hidden opacity-40">
           <div className="flex flex-col items-center gap-2">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center"><ArrowLeft className="w-6 h-6" /></div>
                <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center"><ArrowRight className="w-6 h-6" /></div>
              </div>
              <div className="text-[8px] uppercase tracking-widest">Swipe or Keys</div>
           </div>
        </div>
      )}
    </div>
  );
};

export default UI;
