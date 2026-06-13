import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Pause } from 'lucide-react';

interface PauseMenuProps {
  onKeepPlaying: () => void;
  onRestart: () => void;
  onHome: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({
  onKeepPlaying,
  onRestart,
  onHome,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <div className="absolute inset-0 z-40 overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm font-kids flex justify-center items-center">
      <div className="w-full max-w-sm bg-white border-4 border-yellow-400 rounded-[2rem] p-6 shadow-2xl text-center space-y-5 relative overflow-hidden float-anim">
        {/* Soft layout background details */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-blue-105/60 rounded-full blur-xl"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-pink-105/60 rounded-full blur-xl"></div>

        <div className="space-y-2 relative z-10">
          <div className="flex justify-center mb-1">
            <div className="bg-yellow-100 p-3 rounded-full text-yellow-600 border-2 border-yellow-300">
              <Pause className="w-7 h-7 fill-yellow-600 text-yellow-600" />
            </div>
          </div>
          <h2 className="text-3xl font-black text-blue-950 font-kids leading-none">Juego en Pausa</h2>
          <p className="text-xs font-bold text-sky-600 uppercase tracking-wide">
            ¿Qué deseas hacer en esta partida?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 relative z-10 font-kids">
          <button
            id="btn-pause-resume"
            onClick={onKeepPlaying}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-300 hover:to-teal-400 text-white font-black text-sm py-3.5 px-6 rounded-xl transition-all cursor-pointer shadow-[0_4px_12px_rgba(16,185,129,0.25)]"
          >
            <Play className="w-4 h-4 fill-white text-white" />
            ¡CONTINUAR JUGANDO!
          </button>

          <button
            id="btn-pause-restart"
            onClick={onRestart}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-blue-950 font-black text-sm py-3.5 px-6 rounded-xl transition-all cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.25)]"
          >
            <RotateCcw className="w-4 h-4 text-blue-950" />
            ¡REINICIAR DESDE CERO!
          </button>
          
          <button
            id="btn-pause-home"
            onClick={onHome}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 border-2 border-slate-200 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-5 rounded-xl transition-all cursor-pointer"
          >
            <Home className="w-3.5 h-3.5 text-slate-600" />
            Volver al Menú Principal
          </button>
        </div>

        {/* Quick Option sound toggle within paused overlay */}
        <div className="pt-3 border-t border-slate-100 relative z-10 flex justify-center">
          <button
            id="btn-pause-sound-toggle"
            onClick={onToggleSound}
            className={`flex items-center gap-1.5 py-1.5 px-4 border-2 rounded-lg text-[10px] font-bold transition-all font-kids ${
              soundEnabled
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                Sonidos: Sí 🔊
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                Sonidos: No 🔇
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
