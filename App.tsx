import React, { useEffect, useState, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas';

type GameState = 'MENU' | 'TRANSITION' | 'PLAYING' | 'GAMEOVER';

function App() {
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<GameState>('MENU');
  const [bestScore, setBestScore] = useState(0);
  
  // 挂机计时器：30秒无操作自动返回
  const lastActivityRef = useRef<number>(Date.now());
  const idleTimeout = 30000; 

  useEffect(() => {
    const saved = localStorage.getItem('siyuan-best-score');
    if (saved) setBestScore(parseInt(saved, 10));
    
    const handleScore = (e: any) => setScore(e.detail);
    const handleStateChange = (e: any) => {
      setGameState(e.detail);
      lastActivityRef.current = Date.now();
    };

    window.addEventListener('score-update', handleScore);
    window.addEventListener('game-state-change', handleStateChange);

    const resetActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'mousemove'];
    activityEvents.forEach(evt => window.addEventListener(evt, resetActivity));

    const idleInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivityRef.current > idleTimeout) {
        if (gameState !== 'MENU') {
          window.dispatchEvent(new Event('game-return-menu'));
        }
        resetActivity();
      }
    }, 1000);

    return () => {
      window.removeEventListener('score-update', handleScore);
      window.removeEventListener('game-state-change', handleStateChange);
      activityEvents.forEach(evt => window.removeEventListener(evt, resetActivity));
      clearInterval(idleInterval);
    }
  }, [gameState]);

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
    <div className="relative w-full h-screen overflow-hidden bg-red-950 select-none font-sans" onClick={handleStart}>
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
        .animate-golden-glow { animation: goldenPulse 3s infinite ease-in-out; }
        .animate-parallax-drift { animation: subtitleParallax 8s infinite alternate ease-in-out; }
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

      {/* 主菜单界面 */}
      {gameState === 'MENU' && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-red-900/30 pointer-events-none">
          <div className="text-center mb-12 px-4">
            <div className="relative inline-block animate-golden-glow">
              <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-2xl pr-4"
                  style={{ WebkitTextStroke: '3px #7f1d1d' }}>
                思源 RUSH
              </h1>
              <div className="absolute inset-0 blur-2xl bg-yellow-400/10 -z-10 rounded-full scale-110"></div>
            </div>

            <div className="mt-4 overflow-hidden py-2">
              <h2 className="text-2xl md:text-4xl font-bold text-white tracking-[0.2em] drop-shadow-lg animate-parallax-drift">
                2026 丙午马年 · 万马奔腾
              </h2>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="bg-red-600/50 backdrop-blur-xl px-10 py-3 rounded-2xl border-2 border-yellow-400/40 shadow-2xl">
                 <p className="text-yellow-400 font-bold text-2xl tracking-widest">
                   历史最高分: {bestScore.toLocaleString()}
                 </p>
              </div>
              
              {/* 操作说明 */}
              <div className="flex gap-4 text-white/80 text-sm md:text-base font-medium">
                <span className="bg-black/20 px-3 py-1 rounded-full border border-white/10">方向键或滑动：移动</span>
                <span className="bg-black/20 px-3 py-1 rounded-full border border-white/10">上：跳跃</span>
                <span className="bg-black/20 px-3 py-1 rounded-full border border-white/10">下：滑行</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-24 flex items-center justify-center">
             <div className="relative group">
                <div className="firecracker-spark" style={{ top: '-20px', left: '-30px', animationDelay: '0s' }}></div>
                <div className="firecracker-spark" style={{ top: '40px', right: '-40px', animationDelay: '0.2s', background: '#dc2626' }}></div>
                <div className="firecracker-spark" style={{ bottom: '-30px', left: '10px', animationDelay: '0.5s' }}></div>
                <div className="firecracker-spark" style={{ top: '-40px', right: '20px', animationDelay: '0.7s', background: '#dc2626' }}></div>

                <div className="bg-gradient-to-r from-red-600 via-yellow-500 to-red-600 p-[2px] rounded-full animate-pulse">
                   <div className="bg-red-900 px-10 py-4 rounded-full shadow-[0_0_50px_rgba(234,179,8,0.4)]">
                      <span className="text-2xl font-black text-yellow-400 tracking-[0.3em] drop-shadow-sm">
                        点击屏幕 开启马年大运
                      </span>
                   </div>
                </div>
             </div>
          </div>

          {/* 右下角装饰文字 */}
          <div className="absolute bottom-8 right-8 writing-mode-vertical text-yellow-500/30 text-4xl font-serif italic pointer-events-none">
            马到成功 · 恭贺新禧
          </div>
        </div>
      )}

      {/* 游戏进行中界面 */}
      {(gameState === 'PLAYING' || gameState === 'TRANSITION') && (
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
          <div className="flex justify-between items-start">
            <div className="bg-red-600/40 backdrop-blur-md rounded-xl p-4 border border-yellow-400/20">
              <h1 className="text-xl font-bold text-yellow-400 tracking-widest">丙午马年 · 贺岁跑</h1>
            </div>
            <div className="bg-red-600/40 backdrop-blur-md rounded-xl p-3 border border-yellow-400/20 min-w-[150px] text-right shadow-lg">
               <span className="text-sm text-yellow-300 block mb-1 font-bold">当前得分</span>
               <span className="text-4xl font-black text-white font-mono tracking-tighter">{score.toString().padStart(6, '0')}</span>
            </div>
          </div>
          
          {/* 实时操作指引（淡入淡出） */}
          <div className="w-full text-center mb-12 opacity-40">
             <p className="text-white text-sm tracking-[0.5em] font-light">滑动：移动 / 跳跃 / 滑行</p>
          </div>
        </div>
      )}

      {/* 游戏结束界面 */}
      {gameState === 'GAMEOVER' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-xl">
          <div className="text-center mb-10">
            <h2 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 mb-2 drop-shadow-2xl">新春大吉</h2>
            <div className="h-1 w-32 bg-yellow-500 mx-auto rounded-full"></div>
            <p className="text-yellow-500 mt-4 text-lg font-medium tracking-[0.2em]">愿你在新的一年里，龙马精神，步步高升！</p>
          </div>
          
          <div className="text-center mb-12 bg-red-900/40 p-8 rounded-3xl border border-yellow-500/20 shadow-inner min-w-[340px]">
            <div className="mb-6">
              <p className="text-yellow-500/80 text-xl tracking-[0.4em] mb-2 font-bold uppercase">最终得分</p>
              <p className="text-7xl font-mono font-black text-white drop-shadow-lg">{score.toLocaleString()}</p>
            </div>
            
            <div className="pt-4 border-t border-yellow-500/20 flex flex-col items-center">
              <p className="text-yellow-600/80 text-sm tracking-[0.3em] mb-1 font-bold">历史最高纪录</p>
              <p className="text-3xl font-mono font-bold text-yellow-400">{bestScore.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex gap-6">
            <button onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new Event('game-restart')); }}
              className="group relative px-12 py-6 overflow-hidden bg-yellow-500 text-red-900 font-black text-2xl rounded-2xl shadow-[0_10px_0_rgb(161,98,7)] active:translate-y-[10px] active:shadow-none transition-all hover:brightness-110">
              <span className="relative z-10">再跑一回</span>
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12"></div>
            </button>
            
            <button onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new Event('game-return-menu')); }}
              className="px-8 py-6 bg-red-800 text-yellow-400 font-bold text-xl rounded-2xl border border-yellow-500/40 hover:bg-red-700 transition-colors">
              返回菜单
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
