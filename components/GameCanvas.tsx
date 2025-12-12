import React, { useEffect, useRef } from 'react';
import { GameScene } from '../game/GameScene';

export const GameCanvas: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameSceneRef = useRef<GameScene | null>(null);

  useEffect(() => {
    if (containerRef.current && !gameSceneRef.current) {
      gameSceneRef.current = new GameScene(containerRef.current);
    }

    return () => {
      if (gameSceneRef.current) {
        gameSceneRef.current.dispose();
        gameSceneRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full relative"
      // Prevent default touch actions to allow custom swipes
      style={{ touchAction: 'none' }}
    />
  );
};