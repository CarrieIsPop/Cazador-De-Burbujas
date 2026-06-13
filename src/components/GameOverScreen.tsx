import React from 'react';
import { RotateCcw, Home, Award, Sparkles, Star } from 'lucide-react';

interface GameOverScreenProps {
  score: number;
  highScore: number;
  poppedCount: number;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({
  score,
  highScore,
  poppedCount,
  onRestart,
  onHome,
}) => {
  const isNewRecord = score >= highScore && score > 0;

  // Let's create an encouraging pediatric title based on score
  let rewardTitle = "¡Gran Cazador de Burbujas!";
  let starsCount = 1;
  if (score >= 200) {
    rewardTitle = "¡Cazador Definitivo Galáctico! 🚀";
    starsCount = 3;
  } else if (score >= 100) {
    rewardTitle = "¡Súper Campeón Burbuja! 🌟";
    starsCount = 2;
  }

  return (
    <div className="absolute inset-0 z-20 overflow-y-auto bg-gradient-to-br from-indigo-950/90 via-blue-900/95 to-slate-950/95 p-4 md:p-6 backdrop-blur-md font-kids flex justify-center items-start md:items-center">
      <div className="w-full max-w-md my-auto bg-white border-4 border-pink-400 rounded-[2rem] p-5 md:p-6 shadow-2xl text-center space-y-4 md:space-y-5 relative overflow-hidden float-anim">
        {/* Soft layout background details */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-pink-100/60 rounded-full blur-xl"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-yellow-100/60 rounded-full blur-xl"></div>

        <div className="space-y-3 relative z-10">
          <div className="flex justify-center gap-1.5 text-yellow-400 mb-2">
            {Array.from({ length: starsCount }).map((_, i) => (
              <Star key={i} className="w-8 h-8 fill-yellow-400 text-yellow-400 animate-bounce" />
            ))}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-blue-950 leading-tight">
            {isNewRecord ? '¡NUEVO RÉCORD! 🎉' : 'Fin de la Partida'}
          </h2>
          <p className="text-lg font-bold text-pink-600">
            {rewardTitle}
          </p>
        </div>

        {/* Stats card */}
        <div className="bg-sky-50/80 rounded-2xl p-5 border-2 border-sky-100 space-y-4 relative z-10 text-blue-950">
          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-bold font-sans text-sky-800">PUNTOS CONSEGUIDOS:</span>
            <span className="text-3xl font-black text-blue-950">{score}</span>
          </div>

          <div className="h-px bg-sky-200"></div>

          <div className="flex justify-between items-center px-2">
            <span className="text-xs font-bold font-sans text-sky-800">BURBUJAS REVENTADAS:</span>
            <span className="text-lg font-bold text-emerald-600">{poppedCount} ✨</span>
          </div>

          <div className="h-px bg-sky-200"></div>

          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-1.5 text-amber-600">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold font-sans">RECORDS MÁXIMO:</span>
            </div>
            <span className="text-lg font-bold text-amber-600">{highScore}</span>
          </div>
        </div>

        {/* Motivation quote */}
        <p className="text-blue-900/70 text-xs font-medium italic relative z-10">
          {isNewRecord 
            ? '¡Espectacular! Has dejado tu marca en lo más alto de la galaxia de burbujas.' 
            : '¡Estuviste increíble! Jugar te ayuda a moverte, sonreír y estar cada vez más sano.'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 relative z-10">
          <button
            id="btn-restart-game"
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-blue-950 font-black text-md py-3.5 px-6 rounded-xl transition-all cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.25)]"
          >
            <RotateCcw className="w-5 h-5" />
            ¡JUGAR OTRA VEZ!
          </button>
          
          <button
            id="btn-return-home"
            onClick={onHome}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 border-2 border-slate-200 hover:bg-slate-200 text-slate-700 font-bold text-sm py-3 px-6 rounded-xl transition-all cursor-pointer"
          >
            <Home className="w-4 h-4 text-slate-600" />
            Volver al Menú Principal
          </button>
        </div>
      </div>
    </div>
  );
};
