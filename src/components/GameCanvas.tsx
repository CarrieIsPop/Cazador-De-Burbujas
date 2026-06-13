import React, { useRef, useEffect, useState } from 'react';
import { Camera, CameraOff, AlertTriangle, RefreshCw, Hand, Info, MousePointer } from 'lucide-react';
import { Bubble, HandPointer, Particle, GameSettings, GameStateType } from '../types';
import { playPopSound } from '../utils/audio';

interface GameCanvasProps {
  gameState: GameStateType;
  isPaused?: boolean;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  setHighScore: React.Dispatch<React.SetStateAction<number>>;
  lives: number;
  setLives: React.Dispatch<React.SetStateAction<number>>;
  poppedCount: number;
  setPoppedCount: React.Dispatch<React.SetStateAction<number>>;
  missedCount: number;
  setMissedCount: React.Dispatch<React.SetStateAction<number>>;
  setFps: React.Dispatch<React.SetStateAction<number>>;
  isModelLoaded: boolean;
  setIsModelLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  settings: GameSettings;
  onGameOver: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  gameState,
  isPaused = false,
  score,
  setScore,
  setHighScore,
  lives,
  setLives,
  poppedCount,
  setPoppedCount,
  missedCount,
  setMissedCount,
  setFps,
  isModelLoaded,
  setIsModelLoaded,
  settings,
  onGameOver,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fallbacks
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [useMouseFallback, setUseMouseFallback] = useState(false);
  const [activeHandsCount, setActiveHandsCount] = useState(0);

  // Physics & Entity Refs (stored in refs for absolute 60fps consistency and leak prevention in requestAnimationFrame)
  const bubblesRef = useRef<Bubble[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const pointersRef = useRef<HandPointer[]>([]);
  const animationFrameIdRef = useRef<number | null>(null);
  const nextBubbleIdRef = useRef(1);

  // Mouse fallback position
  const mousePointerRef = useRef<{ x: number; y: number; active: boolean }>({ x: 0, y: 0, active: false });

  // Spawn settings based on difficulty
  const prevDifficultyRef = useRef(settings.difficulty);
  const getSpawnRate = () => {
    if (settings.difficulty === 'easy') return 120; // frames between spawns (~2s)
    if (settings.difficulty === 'medium') return 80; // ~1.3s
    return 50; // ~0.8s
  };
  const getSpeedMultiplier = () => {
    if (settings.difficulty === 'easy') return 0.0025;
    if (settings.difficulty === 'medium') return 0.004;
    return 0.006;
  };

  const spawnTimerRef = useRef(0);

  // Initialize MediaPipe Hands & Camera stream
  useEffect(() => {
    if (gameState !== 'playing') {
      // Clear game loops if not playing
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      return;
    }

    setCameraError(null);
    setIsInitializing(true);
    setIsModelLoaded(false);

    let stream: MediaStream | null = null;
    let cameraInstance: any = null;
    let handsInstance: any = null;

    // Standard fallback setup if MediaPipe is not loaded from head CDN
    const Hands = (window as any).Hands;
    const CameraClass = (window as any).Camera;

    const startCamera = async () => {
      try {
        if (useMouseFallback) {
          setIsInitializing(false);
          setIsModelLoaded(true);
          startLoop();
          return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Tu navegador o dispositivo no soporta el acceso a la cámara.');
        }

        // Check if browser scripts exist
        if (!Hands || !CameraClass) {
          console.warn('MediaPipe scripts are not fully loaded in window. Falling back to mouse controls.');
          setUseMouseFallback(true);
          setIsInitializing(false);
          setIsModelLoaded(true);
          startLoop();
          return;
        }

        // Try getting user permission & camera stream ideal resolution for waiting room setups (fast processing)
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          // Wait for metadata to load to ensure dimensions are loaded
          videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().catch(e => console.error('Video play error:', e));
            }
          };
        }

        // Initialize MediaPipe Hands
        handsInstance = new Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        handsInstance.setOptions({
          maxNumHands: 2,
          modelComplexity: 1, // Full model for maximum precision following fingers perfectly
          minDetectionConfidence: 0.55,
          minTrackingConfidence: 0.55,
        });

        // Set up tracking output callback
        handsInstance.onResults((results: any) => {
          setIsModelLoaded(loaded => {
            if (!loaded) return true;
            return loaded;
          });
          setIsInitializing(init => {
            if (init) return false;
            return init;
          });

          const currentPointers: HandPointer[] = [];
          let detectedHands = 0;

          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // Will be counted dynamically based on hands with extended fingers
            detectedHands = 0;

            const w = canvasRef.current?.width || 640;
            const h = canvasRef.current?.height || 480;

            results.multiHandLandmarks.forEach((landmarks: any[], handIdx: number) => {
              const classification = results.multiHandedness[handIdx];
              const isLeft = classification.label === 'Left'; // This is mirroring classification label
              const label = isLeft ? 'Left' : 'Right';

              // Point 8 (Index Finger Tip), Point 12 (Middle Finger Tip)
              const indexTip = landmarks[8];
              const wrist = landmarks[0];
              const indexPIP = landmarks[6];
              const middlePIP = landmarks[10];

              const isIndexExtended = wrist && indexTip && indexPIP && (() => {
                const distTip = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
                const distJoint = Math.hypot(indexPIP.x - wrist.x, indexPIP.y - wrist.y);
                return distTip > distJoint * 1.08;
              })();
              const middleTip = landmarks[12];

              const isMiddleExtended = wrist && middleTip && middlePIP && (() => {
                const distTip = Math.hypot(middleTip.x - wrist.x, middleTip.y - wrist.y);
                const distJoint = Math.hypot(middlePIP.x - wrist.x, middlePIP.y - wrist.y);
                return distTip > distJoint * 1.08;
              })();

              let handHasPointer = false;

              if (indexTip && isIndexExtended) {
                handHasPointer = true;
                // Find existing pointer to preserve its previous pixel coordinates for smooth lerping
                const existing = pointersRef.current.find(
                  p => p.label === label && p.landmarkType === 'index'
                );
                currentPointers.push({
                  x: indexTip.x,
                  y: indexTip.y,
                  px: existing && existing.px !== 0 ? existing.px : (1 - indexTip.x) * w,
                  py: existing && existing.py !== 0 ? existing.py : indexTip.y * h,
                  label,
                  landmarkType: 'index',
                });
              }

              if (middleTip && isMiddleExtended) {
                handHasPointer = true;
                const existing = pointersRef.current.find(
                  p => p.label === label && p.landmarkType === 'middle'
                );
                currentPointers.push({
                  x: middleTip.x,
                  y: middleTip.y,
                  px: existing && existing.px !== 0 ? existing.px : (1 - middleTip.x) * w,
                  py: existing && existing.py !== 0 ? existing.py : middleTip.y * h,
                  label,
                  landmarkType: 'middle',
                });
              }
              if (handHasPointer) {
                detectedHands++;
              }
            });
          }

          setActiveHandsCount(prev => {
            // Only trigger state updates if hand presence changes
            const wasZero = prev === 0;
            const isZero = detectedHands === 0;
            if (wasZero !== isZero) {
              return detectedHands;
            }
            return prev;
          });
          pointersRef.current = currentPointers;
        });

        let isProcessingFrame = false;
        let lastFrameTime = 0;

        // Use MediaPipe's own requestVideoFrame callback helper (Camera utilities) to capture frames
        if (videoRef.current) {
          cameraInstance = new CameraClass(videoRef.current, {
            onFrame: async () => {
              const now = performance.now();
              // Capture and decode directly on GPU. Throttled lightly (min 16ms) to keep maximum fluid graphics loop space
              if (videoRef.current && !isProcessingFrame && (now - lastFrameTime >= 16)) {
                isProcessingFrame = true;
                lastFrameTime = now;
                try {
                  // Direct native element send allows MediaPipe to use WebGL hardware texture uploads (completely offloading CPU)
                  await handsInstance.send({ image: videoRef.current });
                } catch (err) {
                  console.error('MediaPipe send frame error:', err);
                } finally {
                  isProcessingFrame = false;
                }
              }
            },
            width: 640, // Standard high-quality aspect ratio for beautiful pointer accuracy
            height: 480
          });

          await cameraInstance.start();
        }

        // Start our game draw/physics update loop
        startLoop();

      } catch (err: any) {
        console.error('Error starting game camera: ', err);
        let msg = 'No se pudo acceder a la cámara.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Acceso denegado a la cámara. Por favor autoriza los permisos de cámara en tu navegador para interactuar con tus manosfísicas.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'No se encontró ninguna cámara disponible. Activando modo ratón de forma automática.';
          setUseMouseFallback(true);
        } else {
          msg = err.message || msg;
        }
        setCameraError(msg);
        setIsInitializing(false);

        // Fallback to mouse control automatically so the user is never stuck
        setUseMouseFallback(true);
        setIsModelLoaded(true);
        startLoop();
      }
    };

    startCamera();

    // Clean up
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (cameraInstance) {
        cameraInstance.stop().catch((e: any) => console.log('Camera stop error:', e));
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (handsInstance) {
        handsInstance.close().catch((e: any) => console.log('Hands close error:', e));
      }
    };
  }, [gameState, useMouseFallback]);

  // Main high-performance game loop using requestAnimationFrame
  const startLoop = () => {
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsTimer = 0;

    const gameLoop = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      // Update FPS meter
      frameCount++;
      fpsTimer += delta;
      if (fpsTimer >= 1000) {
        setFps(Math.round((frameCount * 1000) / fpsTimer));
        frameCount = 0;
        fpsTimer = 0;
      }

      // Update entity physics & positions
      updatePhysics();

      // Render updated entities on Canvas
      drawGame();

      // Keep loop alive
      animationFrameIdRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameIdRef.current = requestAnimationFrame(gameLoop);
  };

  // Physics, spawning, and circular hit detection algorithm
  const updatePhysics = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    // Convert normalized tracking coordinates (0-1) to pixel positions on current canvas size using high-performance visual lerping.
    // Since video stream is mirrored, we translate the horizontal tracking 'x' coordinate to its mirrored space physical pixel (1 - x).
    pointersRef.current.forEach(ptr => {
      const targetPx = (1 - ptr.x) * w;
      const targetPy = ptr.y * h;

      if (ptr.px === 0) {
        ptr.px = targetPx;
      } else {
        // High-frequency responsive lerp (0.28 coefficient ensures extremely responsive, lag-free glide catch-up)
        ptr.px += (targetPx - ptr.px) * 0.28;
      }

      if (ptr.py === 0) {
        ptr.py = targetPy;
      } else {
        ptr.py += (targetPy - ptr.py) * 0.28;
      }
    });

    // Handle mouse cursor input if fallback or helper is active
    const activePointers: { x: number; y: number }[] = [];
    if (useMouseFallback && mousePointerRef.current.active) {
      activePointers.push({
        x: mousePointerRef.current.x,
        y: mousePointerRef.current.y
      });
    }

    // Include fingertip controllers for verification
    pointersRef.current.forEach(p => {
      activePointers.push({ x: p.px, y: p.py });
    });

    // 1. Spawning system (relative to framerate with difficulty settings)
    if (isPaused) return;

    spawnTimerRef.current++;
    if (spawnTimerRef.current >= getSpawnRate()) {
      spawnTimerRef.current = 0;
      spawnBubble(w);
    }

    // 2. Update Bubbles
    const bubbles = bubblesRef.current;
    const speedMult = getSpeedMultiplier();

    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      
      // Gravity falling update
      b.y += b.speedY;
      
      // Calculate active pixel position of bubble
      const bx = b.x * w;
      const by = b.y * h;
      const brad = b.radius * w; // Scale bubble radius responsive to canvas width

      // Check boundary: is it out of bottom screen limits?
      if (b.y > 1.1) {
        // If it was a positive bubble, child missed it. If it was poison, they successfully dodged it!
        if (b.type !== 'poison') {
          setMissedCount(m => m + 1);
          setLives(curr => {
            const nextLives = curr - 1;
            if (nextLives <= 0) {
              setTimeout(() => {
                onGameOver();
              }, 50);
            }
            return nextLives;
          });
        }
        bubbles.splice(i, 1);
        continue;
      }

      // 3. CORE COLLISION DETECTION: Distance formula between circular hitboxes (geometric Euclidean space)
      let hasCollided = false;
      for (const ptr of activePointers) {
        const dx = ptr.x - bx;
        const dy = ptr.y - by;
        // Euclidean distance = Math.sqrt(dx^2 + dy^2)
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Success: collision detected!
        if (distance <= brad) {
          hasCollided = true;
          break;
        }
      }

      if (hasCollided) {
        // Handle bubble popped event
        triggerBubblePop(b, bx, by, brad);
        // Remove from active physics array
        bubbles.splice(i, 1);
      }
    }

    // 4. Update explosion particles
    const particles = particlesRef.current;
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.12; // soft cartoonish bounce-down gravity
      p.life -= 0.02; // slow fade

      if (p.life <= 0) {
        particles.splice(i, 1);
      }
    }
  };

  // Helper to spawn a bubble with responsive properties
  const spawnBubble = (canvasWidth: number) => {
    const rInt = Math.random();
    let type: Bubble['type'] = 'normal';
    let color = 'hsla(186, 94%, 50%, 0.65)'; // Bright cyan
    let speedY = (0.002 + Math.random() * 0.003); // random descent speed
    let scoreValue = 10;
    let radius = 0.025 + Math.random() * 0.025; // responsive size (2.5% to 5% of layout width)

    if (rInt > 0.85) {
      // Poison bubble (Crimson red)
      type = 'poison';
      color = 'hsla(355, 84%, 55%, 0.7)';
      speedY = (0.0015 + Math.random() * 0.002); // falls slower so kids have time to react/dodge
      scoreValue = -30;
      radius = 0.035; // slightly larger so it occupies space to challenge maneuvering
    } else if (rInt > 0.75) {
      // Golden bubble (Fast, sparkly)
      type = 'golden';
      color = 'hsla(45, 100%, 60%, 0.8)';
      speedY = (0.005 + Math.random() * 0.004); // high velocity
      scoreValue = 50;
      radius = 0.02; // tiny high target
    } else if (rInt > 0.70) {
      // Special clearing bubble (Emerald green)
      type = 'bubble';
      color = 'hsla(120, 80%, 50%, 0.75)';
      speedY = (0.003 + Math.random() * 0.002);
      scoreValue = 25;
      radius = 0.04;
    }

    // Scale speedY dynamically relative to difficulty multiplier
    const difficultyMultiplier = settings.difficulty === 'easy' ? 0.8 : settings.difficulty === 'hard' ? 1.4 : 1.0;
    speedY *= difficultyMultiplier;

    bubblesRef.current.push({
      id: nextBubbleIdRef.current.toString(),
      x: 0.08 + Math.random() * 0.84, // keep from bleeding too much outer vertical rail
      y: -0.1,
      radius,
      speedY,
      color,
      type,
      popped: false,
      scoreValue,
    });
    nextBubbleIdRef.current++;
  };

  // Trigger popping feedback, add particles and play procedural audio
  const triggerBubblePop = (b: Bubble, bx: number, by: number, brad: number) => {
    // 1. Play synthesized sound
    if (settings.soundEnabled) {
      playPopSound(b.type === 'bubble' ? 'powerup' : b.type);
    }

    // 2. Adjust core statistics in React state
    setScore(current => {
      const nextScore = Math.max(0, current + b.scoreValue);
      setHighScore(h => Math.max(h, nextScore));
      return nextScore;
    });

    if (b.type === 'poison') {
      setLives(curr => {
        const nextLives = curr - 1;
        if (nextLives <= 0) {
          // End game
          setTimeout(() => {
            onGameOver();
          }, 100);
        }
        return nextLives;
      });
    } else {
      setPoppedCount(count => count + 1);
    }

    // If popped green bubble, pop all poison bubbles currently on screen for satisfaction!
    if (b.type === 'bubble') {
      const activeBubbles = bubblesRef.current;
      for (let idx = activeBubbles.length - 1; idx >= 0; idx--) {
        const activeB = activeBubbles[idx];
        if (activeB.type === 'poison') {
          // Poof normal color
          triggerParticles(activeB.x * canvasRef.current!.width, activeB.y * canvasRef.current!.height, activeB.color, 8);
          activeBubbles.splice(idx, 1);
        }
      }
    }

    // 3. Create dispersion particles (Advanced visual design requirement)
    triggerParticles(bx, by, b.color, b.type === 'golden' ? 22 : 12);
  };

  const triggerParticles = (x: number, y: number, color: string, count: number) => {
    for (let c = 0; c < count; c++) {
      const angle = Math.random() * Math.PI * 2;
      const force = 1 + Math.random() * 5.5;
      particlesRef.current.push({
        id: Math.random().toString(),
        x,
        y,
        vx: Math.cos(angle) * force,
        vy: Math.sin(angle) * force - 1.5, // initial upward push
        color,
        radius: 2 + Math.random() * 4,
        life: 1.0,
        maxLife: 1.0,
      });
    }
  };

  // Custom high-contrast drawing of entities on the HTML5 Canvas
  const drawGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Fast clear
    ctx.clearRect(0, 0, w, h);

    // 1. Draw webcamera feed (mirrored) as live background inside canvas
    if (videoRef.current && videoRef.current.readyState >= 2 && !useMouseFallback) {
      ctx.save();
      // Mirror horizontal coordinates
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
      
      // Draw camera with opacity reduced for soothing contrast with glowing neon bubbles
      ctx.globalAlpha = 0.38;
      ctx.drawImage(videoRef.current, 0, 0, w, h);
      ctx.restore();
    } else if (useMouseFallback) {
      // Colorful soft fallback background for Mouse mode
      ctx.save();
      const grad = ctx.createRadialGradient(w / 2, h / 2, w / 8, w / 2, h / 2, w);
      grad.addColorStop(0, '#111827'); // dark charcoal
      grad.addColorStop(1, '#090d16');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      
      // Gentle decorative static particles as starfields
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.font = '10px font-mono';
      ctx.fillText("MODO RATÓN ACTIVADO - Mueve el cursor por el lienzo", 20, 30);
      ctx.restore();
    }

    // 2. Render Bubbles (Beautiful glass 3D illusion layout)
    bubblesRef.current.forEach(b => {
      const bx = b.x * w;
      const by = b.y * h;
      const brad = b.radius * w;

      ctx.save();

      // Draw a soft outer glowing ring (much faster than shadowBlur)
      ctx.fillStyle = b.type === 'poison' ? 'rgba(239, 68, 68, 0.08)' : b.type === 'golden' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(6, 182, 212, 0.08)';
      ctx.beginPath();
      ctx.arc(bx, by, brad * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // 3D glass gradient bubble fill
      const grad = ctx.createRadialGradient(
        bx - brad * 0.28, 
        by - brad * 0.28, 
        brad * 0.05, 
        bx, 
        by, 
        brad
      );

      if (b.type === 'poison') {
        grad.addColorStop(0, 'rgba(254, 226, 226, 0.8)'); // pink highlight
        grad.addColorStop(0.3, 'rgba(239, 68, 68, 0.6)'); // bright red
        grad.addColorStop(1, 'rgba(127, 29, 29, 0.85)'); // dark red
      } else if (b.type === 'golden') {
        grad.addColorStop(0, 'rgba(255, 253, 244, 0.9)'); // shiny white yellow
        grad.addColorStop(0.2, 'rgba(251, 191, 36, 0.7)'); // gold
        grad.addColorStop(1, 'rgba(180, 83, 9, 0.9)'); // amber border
      } else if (b.type === 'bubble') {
        // Emerald special bubble
        grad.addColorStop(0, 'rgba(240, 253, 244, 0.85)');
        grad.addColorStop(0.35, 'rgba(34, 197, 94, 0.6)');
        grad.addColorStop(1, 'rgba(20, 83, 45, 0.85)');
      } else {
        // Normal Cyan Bubble
        grad.addColorStop(0, 'rgba(236, 254, 255, 0.85)'); // light neon white
        grad.addColorStop(0.3, 'rgba(6, 182, 212, 0.5)'); // light blue
        grad.addColorStop(1, 'rgba(15, 23, 42, 0.7)'); // dark borders for transparent blend
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(bx, by, brad, 0, Math.PI * 2);
      ctx.fill();

      // Outer glassy glare border
      ctx.strokeStyle = b.type === 'poison' ? 'rgba(252, 165, 165, 0.8)' : b.type === 'golden' ? 'rgba(253, 224, 71, 0.8)' : 'rgba(165, 243, 252, 0.65)';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Glass shine ellipse
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      // rotate slightly for beauty
      ctx.ellipse(bx - brad * 0.35, by - brad * 0.35, brad * 0.25, brad * 0.12, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw secondary details (e.g. poison warning hazard or golden stars)
      if (b.type === 'poison') {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = `bold ${Math.max(10, Math.round(brad * 0.6))}px font-sans`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', bx, by);
      } else if (b.type === 'golden') {
        ctx.fillStyle = 'rgba(255, 255, 120, 0.9)';
        ctx.font = `bold ${Math.max(8, Math.round(brad * 0.6))}px font-sans`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', bx, by);
      } else if (b.type === 'bubble') {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bx, by, brad * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    });

    // 3. Render Particles
    particlesRef.current.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 4. Render Hand tracking pointers (Index and Middle fingers)
    // Draw real-time indicators for fingertips
    pointersRef.current.forEach((ptr, idx) => {
      ctx.save();
      const color = ptr.label === 'Left' ? 'rgba(168, 85, 247, 0.8)' : 'rgba(6, 182, 212, 0.8)'; // purple or cyan
      const isIndex = ptr.landmarkType === 'index';

      // Soft glow ring (GPU friendly - replacing expensive CPU shadowBlur)
      ctx.fillStyle = color.replace('0.8', '0.15');
      ctx.beginPath();
      ctx.arc(ptr.px, ptr.py, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = color;

      // Outer rings
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ptr.px, ptr.py, 16 + Math.sin(Date.now() / 150) * 4, 0, Math.PI * 2);
      ctx.stroke();

      // Solid central focal circle
      ctx.beginPath();
      ctx.arc(ptr.px, ptr.py, 8, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle particles drawing along
      if (Math.random() > 0.4) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(ptr.px + (Math.random() - 0.5) * 14, ptr.py + (Math.random() - 0.5) * 14, 2.5, 2.5);
      }

      ctx.restore();
    });

    // Draw mouse fallback pointer if fallback is in use
    if (useMouseFallback && mousePointerRef.current.active) {
      ctx.save();
      
      // Soft glow ring
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.beginPath();
      ctx.arc(mousePointerRef.current.x, mousePointerRef.current.y, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1.5;

      // Draw active fairy pointer
      ctx.beginPath();
      ctx.arc(mousePointerRef.current.x, mousePointerRef.current.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cute label
      ctx.fillStyle = 'white';
      ctx.font = '9px font-mono';
      ctx.textAlign = 'center';
      ctx.fillText('VARITA', mousePointerRef.current.x, mousePointerRef.current.y - 18);
      ctx.restore();
    }
  };

  // Keep responsive canvas bounds updated
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      // Keep canvas resolution in sync with screen layout
      canvas.width = rect.width;
      canvas.height = rect.height;
    };

    handleResize();

    const observer = new ResizeObserver(() => {
      handleResize();
    });
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Sync state difficulty adjustments
  useEffect(() => {
    if (prevDifficultyRef.current !== settings.difficulty) {
      // Clear current bubbles to transition difficulty smoothly
      bubblesRef.current = [];
      prevDifficultyRef.current = settings.difficulty;
    }
  }, [settings.difficulty]);

  // Capture Mouse movements on the container for fallback
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    mousePointerRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      active: true
    };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (e.touches && e.touches[0]) {
      const touch = e.touches[0];
      const rect = canvas.getBoundingClientRect();
      mousePointerRef.current = {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        active: true
      };
    }
  };

  const handleMouseLeave = () => {
    mousePointerRef.current.active = false;
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onMouseLeave={handleMouseLeave}
      onTouchEnd={handleMouseLeave}
      className="absolute inset-0 bg-slate-950 overflow-hidden select-none cursor-none"
    >
      {/* Hidden camera preview feed (mirrored internally by CSS) */}
      <video
        ref={videoRef}
        className="hidden"
        playsInline
        muted
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Main interaction canvas overlay */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
      />

      {/* Loading & setup calibration overlays */}
      {isInitializing && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md p-6 text-center">
          <div className="space-y-6 max-w-sm">
            <div className="relative flex justify-center">
              <RefreshCw className="w-14 h-14 text-cyan-400 animate-spin" />
              <Hand className="w-6 h-6 text-cyan-300 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold font-display text-white">Iniciando Cámara de Visión</h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Estamos configurando la inteligencia artificial de seguimiento gestual MediaPipe. Esto mantendrá tus datos 100% privados.
              </p>
            </div>

            <div className="pt-2">
              <button
                id="btn-force-mouse"
                onClick={() => setUseMouseFallback(true)}
                className="inline-flex items-center gap-2 bg-slate-800 text-cyan-300 border border-slate-700/80 px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-700 hover:text-white transition-all cursor-pointer"
              >
                <MousePointer className="w-3.5 h-3.5" />
                No tengo cámara / Usar ratón
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera fallback alert warning overlay */}
      {cameraError && !useMouseFallback && (
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-md z-30 bg-slate-900 border border-amber-500/30 p-4 rounded-2xl shadow-2xl flex gap-3 text-left">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-widest">Advertencia de Cámara</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              {cameraError}
            </p>
            <div className="flex gap-2">
              <button
                id="btn-fallback-mouse-mode"
                onClick={() => {
                  setUseMouseFallback(true);
                  setCameraError(null);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Continuar con ratón
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick floating reminder if hands are not tracked but camera works */}
      {isModelLoaded && !useMouseFallback && activeHandsCount === 0 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 bg-slate-900/85 border border-slate-700/60 px-4 py-2.5 rounded-full flex items-center gap-2.5 text-xs text-slate-300 shadow-xl pointer-events-none float-anim">
          <Hand className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>¡Muestra tus manos en pantalla para empezar a cazar! 🖐️</span>
        </div>
      )}
    </div>
  );
};
