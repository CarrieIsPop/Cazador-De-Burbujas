import React from 'react';
import { Heart, Trophy, Target, Award, Zap, Activity } from 'lucide-react';
import { GameSettings } from '../types';

interface ScoreBoardProps {
  score: number;
  highScore: number;
  lives: number;
  poppedCount: number;
  missedCount: number;
  difficulty: GameSettings['difficulty'];
  fps: number;
  isModelLoaded: boolean;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  score,
  highScore,
  lives,
  poppedCount,
  missedCount,
  difficulty,
  fps,
  isModelLoaded,
}) => {
  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center pointer-events-none select-none font-kids">
      {/* Lives & Score Progress */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 w-full sm:w-auto">
        {/* Lives Counter Card - Pink Aesthetic */}
        <div className="flex items-center gap-3.5 bg-white rounded-3xl px-6 py-2.5 shadow-xl border-4 border-pink-400 pointer-events-auto">
          <div className="bg-pink-100 p-2 rounded-full">
            <Heart className="w-5 h-5 text-pink-500 fill-pink-500 animate-pulse" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-pink-600 font-bold text-[10px] uppercase tracking-wider">VIDAS</span>
            <div className="flex gap-1.5 mt-0.5">
              {[1, 2, 3].map((heartNum) => (
                <div
                  key={heartNum}
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    heartNum <= lives
                      ? 'bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)] scale-110'
                      : 'bg-slate-200 scale-90 opacity-40'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Score Display Card - Yellow Aesthetic */}
        <div className="bg-white rounded-3xl px-6 py-2 border-4 border-yellow-400 shadow-xl flex items-center gap-4 pointer-events-auto relative overflow-hidden">
          <div className="bg-yellow-100 p-2 rounded-full">
            <span className="text-xl">🫧</span>
          </div>
          <div className="flex gap-5 items-center">
            <div className="flex flex-col leading-none">
              <span className="text-blue-800 text-[10px] font-bold uppercase tracking-wider mb-1">Puntos</span>
              <span className="text-blue-900 text-3xl font-black leading-none drop-shadow-sm">
                {score.toLocaleString('es-ES', { minimumIntegerDigits: 3 })}
              </span>
            </div>
            
            <div className="h-8 w-1 bg-yellow-200 rounded-full"></div>

            <div className="flex flex-col leading-none">
              <span className="text-amber-600 text-[10px] font-bold uppercase tracking-wider mb-1">Máximo</span>
              <span className="text-amber-700 text-xl font-black leading-none">
                {highScore}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Game statistics & system logs (Coded cleanly and vibrantly) */}
      <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 pointer-events-auto self-end md:self-auto">
        {/* Game Stats Badge - Aqua Style */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-sky-400 to-blue-500 text-white rounded-2xl px-4 py-1.5 border-2 border-white shadow-md font-sans text-xs">
          <Target className="w-4 h-4 text-white" />
          <span className="font-kids font-semibold">
            ¡Pop!: <strong className="text-yellow-200 font-extrabold">{poppedCount}</strong> • Hechas: <span className="text-pink-100">{missedCount}</span>
          </span>
        </div>

        {/* Level indicator */}
        <div className="bg-indigo-600 text-white rounded-2xl px-4 py-1.5 border-2 border-indigo-400 shadow-md">
          <span className="font-kids font-bold text-xs uppercase tracking-wide">
            {difficulty === 'easy' ? 'Nivel 1 🫧' : difficulty === 'medium' ? 'Nivel 2 🫧' : 'Nivel Súper 🫧'}
          </span>
        </div>

        {/* Detector state indicator - clean layout */}
        <div className="flex items-center gap-2 bg-slate-900/90 text-white px-3 py-1.5 rounded-2xl border-2 border-slate-700 shadow-md text-xs">
          <div className={`w-2 h-2 rounded-full ${isModelLoaded ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-bounce'}`}></div>
          <span className="text-[10px] font-mono font-bold">
            {isModelLoaded ? `${fps} FPS` : 'I.A. Carga'}
          </span>
        </div>
      </div>
    </div>
  );
};
