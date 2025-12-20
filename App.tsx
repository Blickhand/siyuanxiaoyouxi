import React, { useEffect, useState, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';

type GameState = 'MENU' | 'TRANSITION' | 'PLAYING' | 'GAMEOVER';

function App() {
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [bestScore, setBestScore] = useState(0);
  
  // Idle Timer Ref
  const lastActivityRef = useRef<number>(Date.now());
  const idleTimeoutMinutes = 30000; // 30 seconds

  useEffect(() => {
    const saved = localStorage.getItem('siyuan-best-score');
    if (saved) setBestScore(parseInt(saved, 10));
    const handleScore = (e: any) => setScore(e.detail);
    const handleStateChange = (e: any) => {
      setGameState(e.detail);
      // Reset activity on state change as well
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('score-update', handleScore);
    window.addEventListener('game-state-change', handleStateChange);

    // --- Idle Detection Logic ---
    const resetActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'mousemove'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetActivity));

    const idleInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current > idleTimeoutMinutes) {
        // If not already in MENU, return to menu
        setGameState(prev => {
          if (prev !== 'MENU') {
            window.dispatchEvent(new Event('game-return-menu'));
          }
          return prev;
        });
        resetActivity(); // Reset to prevent multiple rapid triggers
      }
    }, 1000);

    return () => {
      window.removeEventListener('score-update', handleScore);
      window.removeEventListener('game-state-change', handleStateChange);
      activityEvents.forEach(evt => window.removeEventListener(evt, resetActivity));
      clearInterval(idleInterval);
    }
  }, []);

  useEffect(() => {
    if (gameState === 'GAMEOVER' && score > bestScore) {
      setBestScore(score);
      localStorage.setItem('siyuan-best-score', score.toString());
    }
  }, [gameState, score, bestScore]);

  const handleStart = () => { 
    if (gameState === 'MENU') window.dispatchEvent(new Event('game-start')); 
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-red-950 select-none" onClick={handleStart}>
      {/* Dynamic Styles for Enhanced UI */}
      <style>{`
        @keyframes goldenPulse {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(250, 204, 21, 0.6)); transform: scale(1); }
          50% { filter: drop-shadow(0 0 35px rgba(250, 204, 21, 0.95)); transform: scale(1.02); }
        }
        @keyframes subtitleParallax {
          0% { transform: translateX(-15px); }
          100% { transform: translateX(15px); }
        }
        @keyframes firecrackerBurst {
          0% { transform: scale(0); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .animate-golden-glow {
          animation: goldenPulse 3s infinite ease-in-out;
        }
        .animate-parallax-drift {
          animation: subtitleParallax 8s infinite alternate ease-in-out;
        }
        .firecracker-spark {
          position: absolute;
          width: 8px;
          height: 8px;
          background: #facc15;
          border-radius: 50%;
          animation: firecrackerBurst 1s infinite;
        }
      `}</style>

      <div className="absolute inset-0 z-0">
        <GameCanvas />
      </div>

      {gameState === 'MENU' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-900/30 pointer-events-none">
          <div className="text-center mb-12 px-4">
            {/* Enhanced Pulsating Title */}
            <div className="relative inline-block animate-golden-glow">
              <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-2xl pr-4"
                  style={{ WebkitTextStroke: '3px #7f1d1d' }}>
                思源 RUSH
              </h1>
              {/* Extra decorative glow layer */}
              <div className="absolute inset-0 blur-2xl bg-yellow-400/10 -z-10 rounded-full scale-110"></div>
            </div>

            {/* Parallax Subtitle */}
            <div className="mt-4 overflow-hidden py-2">
              <h2 className="text-2xl md:text-4xl font-bold text-white tracking-[0.2em] drop-shadow-lg animate-parallax-drift uppercase">
                2026 丙午马年 · 万马奔腾
              </h2>
            </div>

            <div className="mt-8 bg-red-600/50 backdrop-blur-xl px-10 py-3 rounded-2xl border-2 border-yellow-400/40 inline-block shadow-2xl">
               <p className="text-yellow-400 font-mono font-black text-2xl tracking-widest">
                 BEST SCORE: {bestScore.toLocaleString()}
               </p>
            </div>
          </div>

          {/* Stylized Start Prompt with Firecracker Bursts */}
          <div className="absolute bottom-24 flex items-center justify-center">
             <div className="relative group">
                {/* Decorative Firecracker Sparks */}
                <div className="firecracker-spark" style={{ top: '-20px', left: '-30px', animationDelay: '0s' }}></div>
                <div className="firecracker-spark" style={{ top: '40px', right: '-40px', animationDelay: '0.2s', background: '#dc2626' }}></div>
                <div className="firecracker-spark" style={{ bottom: '-30px', left: '10px', animationDelay: '0.5s' }}></div>
                <div className="firecracker-spark" style={{ top: '-40px', right: '20px', animationDelay: '0.7s', background: '#dc2626' }}></div>

                <div className="bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 p-[2px] rounded-full animate-pulse">
                   <div className="bg-red-900 px-10 py-4 rounded-full shadow-[0_0_50px_rgba(234,179,8,0.4)]">
                      <span className="text-2xl font-black text-yellow-400 uppercase tracking-[0.3em] drop-shadow-sm">
                        点击屏幕 开启马年大运
                      </span>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {(gameState === 'PLAYING' || gameState === 'TRANSITION') && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
          <div className="flex justify-between items-start">
            <div className="bg-red-600/40 backdrop-blur-md rounded-xl p-4 border border-yellow-400/20">
              <h1 className="text-xl font-bold text-yellow-400 uppercase tracking-widest">丙午马年 · 贺岁跑</h1>
            </div>
            <div className="bg-red-600/40 backdrop-blur-md rounded-xl p-3 border border-yellow-400/20 min-w-[150px] text-right shadow-lg">
               <span className="text-4xl font-black text-white font-mono tracking-tighter">{score.toString().padStart(6, '0')}</span>
            </div>
          </div>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-xl">
          <div className="text-center mb-10">
            <h2 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 mb-2 drop-shadow-2xl">新春大吉</h2>
            <div className="h-1 w-32 bg-yellow-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="text-center mb-12 bg-red-900/40 p-8 rounded-3xl border border-yellow-500/20 shadow-inner">
            <p className="text-yellow-500/80 text-xl uppercase tracking-[0.4em] mb-2 font-bold">最终得分</p>
            <p className="text-7xl font-mono font-black text-white drop-shadow-lg">{score.toLocaleString()}</p>
          </div>

          <button onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new Event('game-restart')); }}
            className="group relative px-16 py-6 overflow-hidden bg-yellow-500 text-red-900 font-black text-3xl rounded-2xl shadow-[0_10px_0_rgb(161,98,7)] active:translate-y-[10px] active:shadow-none transition-all hover:brightness-110">
            <span className="relative z-10">再跑一回</span>
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
          </button>
        </div>
      )}
    </div>
  );
}
export default App;
