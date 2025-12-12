import React, { useEffect, useState } from 'react';
import { GameCanvas } from './components/GameCanvas';

type GameState = 'MENU' | 'TRANSITION' | 'PLAYING' | 'GAMEOVER';

function App() {
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>('MENU');

  useEffect(() => {
    const handleScore = (e: Event) => {
      const customEvent = e as CustomEvent;
      setScore(customEvent.detail);
    };

    const handleStateChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      setGameState(customEvent.detail);
    };

    window.addEventListener('score-update', handleScore);
    window.addEventListener('game-state-change', handleStateChange);
    return () => {
      window.removeEventListener('score-update', handleScore);
      window.removeEventListener('game-state-change', handleStateChange);
    }
  }, []);

  const handleStart = () => {
    if (gameState === 'MENU') {
      window.dispatchEvent(new Event('game-start'));
    }
  };

  const handleRestart = () => {
    window.dispatchEvent(new Event('game-restart'));
  };

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-slate-900 select-none"
      onClick={handleStart} // Click anywhere to start if in Menu
    >
      
      {/* 3D Game Layer */}
      <div className="absolute inset-0 z-0">
        <GameCanvas />
      </div>

      {/* --- MENU STATE UI --- */}
      {gameState === 'MENU' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/20 pointer-events-none">
          {/* Main Title with Bouncing Animation */}
          <div className="text-center mb-12 animate-bounce">
            <h1 
              className="text-5xl md:text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-2xl"
              style={{ WebkitTextStroke: '2px #dc2626' }}
            >
              思源 RUSH
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-2 tracking-widest drop-shadow-md">
              冬日狂想
            </h2>
          </div>

          {/* Tap to Start - Flashing */}
          <div className="absolute bottom-20 animate-pulse">
             <div className="bg-red-600/80 px-8 py-3 rounded-full backdrop-blur-sm border-2 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.5)]">
               <span className="text-xl font-bold text-white uppercase tracking-widest">
                 Tap Screen to Start
               </span>
             </div>
          </div>
        </div>
      )}

      {/* --- PLAYING STATE UI --- */}
      {(gameState === 'PLAYING' || gameState === 'TRANSITION') && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
          
          {/* Header / Score */}
          <div className="flex justify-between items-start">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-white">
              <h1 className="text-xl font-bold font-sans tracking-wider uppercase text-yellow-400 drop-shadow-md">
                Si Yuan Runner
              </h1>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/20 min-w-[120px] text-right transform scale-110 origin-top-right">
               <span className="text-3xl font-black text-white font-mono drop-shadow-lg">
                 {score.toString().padStart(6, '0')}
               </span>
            </div>
          </div>

          {/* Controls Hint */}
          <div className="flex flex-col items-center gap-2 opacity-50 transition-opacity duration-1000">
             <div className="bg-black/50 p-4 rounded-full backdrop-blur-sm text-white text-center">
                <div className="flex gap-4 text-xs text-gray-300 font-bold uppercase tracking-wide">
                  <span>← Left</span>
                  <span>↑ Jump</span>
                  <span>↓ Roll</span>
                  <span>Right →</span>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- GAMEOVER STATE UI --- */}
      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
          <h2 className="text-6xl font-black text-white mb-2 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)]">
            GAME OVER
          </h2>
          <div className="text-center mb-8">
            <p className="text-gray-300 text-lg uppercase tracking-widest">Final Score</p>
            <p className="text-5xl font-mono font-bold text-yellow-400 drop-shadow-lg">{score}</p>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); handleRestart(); }}
            className="group relative px-8 py-4 bg-red-600 hover:bg-red-500 text-white font-bold text-xl rounded-xl transition-all shadow-[0_10px_0_rgb(153,27,27)] active:shadow-none active:translate-y-[10px]"
          >
            TRY AGAIN
          </button>
        </div>
      )}

    </div>
  );
}

export default App;