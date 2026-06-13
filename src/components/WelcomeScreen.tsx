import React from 'react';
import { Play, Sparkles, ShieldAlert, Award, Camera, Info, Volume2, VolumeX } from 'lucide-react';
import { GameSettings, GameStateType } from '../types';

interface WelcomeScreenProps {
  onStartGame: () => void;
  settings: GameSettings;
  setSettings: React.Dispatch<React.SetStateAction<GameSettings>>;
  highScore: number;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartGame,
  settings,
  setSettings,
  highScore,
}) => {
  return (
    <div className="absolute inset-0 z-20 overflow-y-auto bg-gradient-to-br from-indigo-900/90 via-blue-900/90 to-sky-900/90 p-4 md:p-6 backdrop-blur-md flex justify-center items-start md:items-center">
      <div className="w-full max-w-xl my-auto bg-white rounded-[2rem] p-5 md:p-7 shadow-2xl space-y-4 md:space-y-5 relative overflow-hidden float-anim border-4 border-yellow-400">
        {/* Soft layout background details */}
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-blue-100/60 rounded-full blur-xl"></div>
        <div className="absolute -bottom-12 -right-12 w-36 h-36 bg-pink-100/60 rounded-full blur-xl"></div>

        {/* Title */}
        <div className="text-center space-y-2 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-[11px] font-bold tracking-wider uppercase font-kids">
            <Sparkles className="w-3.5 h-3.5 animate-pulse text-pink-500" />
            Vibrante & Divertido • Sin Contacto
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-blue-900 leading-tight tracking-tight drop-shadow-sm font-kids">
            Cazador de Burbujas Virtual
          </h1>
          <p className="text-blue-800/80 text-xs md:text-sm max-w-md mx-auto font-medium leading-relaxed">
            ¡Mueve tus manos físicas frente a tu cámara web para reventar las burbujas mágicas flotantes y obtener la puntuación más alta!
          </p>
        </div>

        {/* High Score / Record Card */}
        <div className="flex justify-center relative z-10">
          <div className="inline-flex items-center gap-2.5 px-6 py-2 bg-gradient-to-r from-yellow-105 to-amber-100 border-4 border-yellow-400 rounded-2xl text-blue-900 shadow-md">
            <span className="text-2xl">🏆</span>
            <div className="text-left font-kids">
              <div className="text-[10px] text-amber-700/80 font-bold uppercase tracking-widest leading-none mb-0.5">Puntuación de la Sala</div>
              <div className="text-lg font-black text-blue-950 leading-none">{highScore} Puntos</div>
            </div>
          </div>
        </div>

        {/* Visual Guides of Bubbles */}
        <div className="bg-sky-50 rounded-2xl p-3 md:p-4 border-2 border-sky-100 space-y-2.5 relative z-10">
          <h3 className="text-[10px] font-bold font-kids text-blue-900/60 uppercase tracking-widest text-center">
            Tipos de Burbujas Mágicas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Normal Bubble */}
            <div className="flex items-center gap-2 p-2 bg-white rounded-xl border-2 border-sky-200 shadow-sm">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-400 to-blue-300 shadow-[0_0_8px_rgba(56,189,248,0.3)] flex-shrink-0 flex items-center justify-center text-white text-[10px] font-black border-2 border-white/80">
                +10
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-blue-900 leading-tight">Azul</p>
                <p className="text-[9px] text-blue-700 font-medium leading-none">Normal</p>
              </div>
            </div>
            {/* Golden Bubble */}
            <div className="flex items-center gap-2 p-2 bg-white rounded-xl border-2 border-yellow-200 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.4)] flex-shrink-0 flex items-center justify-center text-amber-950 text-[10px] font-black border-2 border-white/80">
                ★
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-amber-600 leading-tight">Oro</p>
                <p className="text-[9px] text-blue-700 font-medium leading-none">¡Rápida! (+50)</p>
              </div>
            </div>
            {/* Poison Bubble */}
            <div className="flex items-center gap-2 p-2 bg-white rounded-xl border-2 border-pink-200 shadow-sm">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-rose-400 shadow-[0_0_8px_rgba(244,114,182,0.3)] flex-shrink-0 flex items-center justify-center text-white font-bold text-[10px] border-2 border-white/80">
                <ShieldAlert className="w-3.5 h-3.5 text-white/95" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-pink-600 leading-tight">Roja</p>
                <p className="text-[9px] text-blue-700 font-medium leading-none">¡Peligro! (-30)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-blue-900 relative z-10">
          <div className="flex gap-2.5 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
            <Camera className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-950">1. Activa tu Cámara</p>
              <p className="text-[10px] text-blue-800 leading-normal font-medium">
                Permite el acceso. El juego procesa todo localmente y es 100% privado.
              </p>
            </div>
          </div>
          <div className="flex gap-2.5 bg-pink-50/50 p-2.5 rounded-xl border border-pink-100">
            <Info className="w-4 h-4 text-pink-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-950">2. Usa tus Dedos</p>
              <p className="text-[10px] text-blue-800 leading-normal font-medium">
                Mueve tus dedos índice y medio frente a la cámara. ¡Sin tocar la pantalla!
              </p>
            </div>
          </div>
        </div>

        {/* Configuration Toggles */}
        <div className="pt-1.5 border-t border-slate-100 grid grid-cols-2 gap-3 relative z-10">
          <div className="space-y-1 text-left">
            <label className="text-[9px] font-black text-blue-900/60 uppercase tracking-widest block font-kids">Dificultad</label>
            <div className="flex rounded-lg overflow-hidden border-2 border-slate-200 p-0.5 bg-slate-50">
              {(['easy', 'medium', 'hard'] as const).map((diff) => (
                <button
                  key={diff}
                  id={`btn-diff-${diff}`}
                  onClick={() => setSettings((s) => ({ ...s, difficulty: diff }))}
                  className={`flex-1 text-center py-1 px-0.5 text-[11px] font-bold rounded-md transition-all uppercase font-kids ${
                    settings.difficulty === diff
                      ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                      : 'text-slate-500 hover:text-blue-900 hover:bg-slate-100'
                  }`}
                >
                  {diff === 'easy' ? 'Fácil' : diff === 'medium' ? 'Normal' : 'Difícil'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1 text-left">
            <label className="text-[9px] font-black text-blue-900/60 uppercase tracking-widest block font-kids">Sonidos del juego</label>
            <button
              id="btn-sound-toggle"
              onClick={() => setSettings((s) => ({ ...s, soundEnabled: !s.soundEnabled }))}
              className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2 border-2 rounded-lg text-[11px] font-bold transition-all font-kids ${
                settings.soundEnabled
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              {settings.soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  Efectos: Sí
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  Silenciado
                </>
              )}
            </button>
          </div>
        </div>

        {/* Play Button */}
        <div className="pt-1.5 relative z-10">
          <button
            id="btn-start-play"
            onClick={onStartGame}
            className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 text-blue-950 font-black font-kids text-lg py-3 px-6 rounded-2xl hover:scale-[1.01] active:scale-[0.99] transition-all shadow-[0_6px_16px_rgba(245,158,11,0.2)] cursor-pointer"
          >
            <Play className="w-5 h-5 fill-blue-950 text-blue-950" />
            ¡COMENZAR AVENTURA!
          </button>
        </div>
      </div>
    </div>
  );
};
