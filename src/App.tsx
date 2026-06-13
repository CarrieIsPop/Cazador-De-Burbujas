import { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { ScoreBoard } from './components/ScoreBoard';
import { GameCanvas } from './components/GameCanvas';
import { GameOverScreen } from './components/GameOverScreen';
import { PauseMenu } from './components/PauseMenu';
import { GameSettings, GameStateType } from './types';
import { playStartSound, playGameOverSound } from './utils/audio';
import { Volume2, VolumeX, Sparkles, Activity, AlertCircle, RefreshCw, Smartphone, Pause } from 'lucide-react';

export default function App() {
  // Game states
  const [gameState, setGameState] = useState<GameStateType>('welcome');
  const [isPaused, setIsPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [poppedCount, setPoppedCount] = useState(0);
  const [missedCount, setMissedCount] = useState(0);

  // Diagnostics and configurations
  const [fps, setFps] = useState(0);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [settings, setSettings] = useState<GameSettings>({
    difficulty: 'medium',
    soundEnabled: true,
    cameraMirrored: true,
  });

  // Countdown clock internal timer
  const [countdownNum, setCountdownNum] = useState(3);

  // Load highscore from local storage initially
  useEffect(() => {
    try {
      const savedHighScore = localStorage.getItem('virtual_bubble_hunter_highscore');
      if (savedHighScore) {
        setHighScore(parseInt(savedHighScore, 10));
      }
    } catch (err) {
      console.warn('Error reading highscore from localStorage:', err);
    }
  }, []);

  // Update localStorage when highscore updates
  const handleSetHighScore = (updateFn: number | ((prev: number) => number)) => {
    setHighScore((prev) => {
      const next = typeof updateFn === 'function' ? updateFn(prev) : updateFn;
      try {
        localStorage.setItem('virtual_bubble_hunter_highscore', next.toString());
      } catch (err) {
        console.warn('Error saving highscore:', err);
      }
      return next;
    });
  };

  // Sound effect triggers on active state transitions
  const handleStartGame = () => {
    if (settings.soundEnabled) {
      playStartSound();
    }
    setScore(0);
    setLives(3);
    setPoppedCount(0);
    setMissedCount(0);
    setCountdownNum(3);
    setIsPaused(false);
    setGameState('countdown');
  };

  // Countdown timer cycle effect
  useEffect(() => {
    if (gameState !== 'countdown') return;

    const interval = setInterval(() => {
      setCountdownNum((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setGameState('playing');
          return 3;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState]);

  // Game over state triggers
  const handleGameOver = () => {
    if (settings.soundEnabled) {
      playGameOverSound();
    }
    setIsPaused(false);
    setGameState('gameover');
  };

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-200">
      {/* BACKGROUND GRAPHIC ACCENTS (Non-interactive cosmetic details for visual feedback) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950"></div>

      {/* Main interactive area wrapper */}
      <section className="absolute inset-0 z-10 w-full h-full">
        {/* Render canvas when active or calibrating */}
        {(gameState === 'playing' || gameState === 'countdown') && (
          <GameCanvas
            gameState={gameState}
            isPaused={isPaused}
            score={score}
            setScore={setScore}
            setHighScore={handleSetHighScore}
            lives={lives}
            setLives={setLives}
            poppedCount={poppedCount}
            setPoppedCount={setPoppedCount}
            missedCount={missedCount}
            setMissedCount={setMissedCount}
            setFps={setFps}
            isModelLoaded={isModelLoaded}
            setIsModelLoaded={setIsModelLoaded}
            settings={settings}
            onGameOver={handleGameOver}
          />
        )}

        {/* Floating navigation overlay - HUD options */}
        {gameState === 'playing' && (
          <div className="absolute bottom-4 left-4 z-10 flex gap-2 pointer-events-auto">
            <button
              id="btn-hud-sound-toggle"
              onClick={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
              className="bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 p-3 rounded-2xl text-slate-300 hover:text-white transition-all shadow-md flex items-center justify-center cursor-pointer"
              title={settings.soundEnabled ? 'Silenciar sonidos' : 'Habilitar sonidos'}
            >
              {settings.soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
            </button>
            
            <button
              id="btn-hud-reset"
              onClick={() => setIsPaused(true)}
              className="bg-slate-900/80 hover:bg-amber-950/40 border border-slate-700/60 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:text-yellow-300 hover:border-yellow-500/30 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" />
              Menú / Pausa
            </button>
          </div>
        )}

        {/* Heads Up Display HUD ScoreBoard */}
        {gameState === 'playing' && (
          <ScoreBoard
            score={score}
            highScore={highScore}
            lives={lives}
            poppedCount={poppedCount}
            missedCount={missedCount}
            difficulty={settings.difficulty}
            fps={fps}
            isModelLoaded={isModelLoaded}
          />
        )}

        {/* Fullscreen screens selection block */}
        {gameState === 'welcome' && (
          <WelcomeScreen
            onStartGame={handleStartGame}
            settings={settings}
            setSettings={setSettings}
            highScore={highScore}
          />
        )}

        {/* 3-2-1 Preparation Countdown Screen */}
        {gameState === 'countdown' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
            <div className="text-center space-y-4">
              <p className="text-xs font-semibold font-mono tracking-widest text-cyan-400 uppercase animate-pulse">
                ¡Prepárate e interactúa en el aire!
              </p>
              
              <div id="countdown-timer-visual" className="text-8xl md:text-9xl font-extrabold font-display text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-teal-300 to-indigo-500 select-none animate-ping">
                {countdownNum}
              </div>

              <p className="text-sm text-slate-400 max-w-xs mx-auto">
                Ponte a una distancia cómoda donde tu cámara capture tu torso y manos completas.
              </p>
            </div>
          </div>
        )}

        {/* Game Over Modal Screen */}
        {gameState === 'gameover' && (
          <GameOverScreen
            score={score}
            highScore={highScore}
            poppedCount={poppedCount}
            onRestart={handleStartGame}
            onHome={() => setGameState('welcome')}
          />
        )}

        {/* Pause Menu Overlay Screen */}
        {gameState === 'playing' && isPaused && (
          <PauseMenu
            onKeepPlaying={() => setIsPaused(false)}
            onRestart={() => {
              setIsPaused(false);
              handleStartGame();
            }}
            onHome={() => {
              setIsPaused(false);
              setGameState('welcome');
            }}
            soundEnabled={settings.soundEnabled}
            onToggleSound={() => setSettings(s => ({ ...s, soundEnabled: !s.soundEnabled }))}
          />
        )}
      </section>
    </main>
  );
}
