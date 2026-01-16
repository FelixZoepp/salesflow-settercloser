import { useEffect, useMemo, useRef } from "react";

type Props = {
  starCount?: number;
  shootingEveryMs?: [number, number];
  enableParallax?: boolean;
};

function clamp(n: number, a: number, b: number) { 
  return Math.max(a, Math.min(b, n)); 
}

function randomBetween(a: number, b: number) { 
  return Math.floor(Math.random() * (b - a + 1)) + a; 
}

function perfNow() { 
  return (typeof performance !== "undefined" ? performance.now() : Date.now()) / 1000; 
}

export default function SkyBackground({
  starCount = 200,
  shootingEveryMs = [3000, 8000],
  enableParallax = true,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const shootingMin = shootingEveryMs[0];
  const shootingMax = shootingEveryMs[1];
  
  const reduced = useMemo(
    () => typeof window !== "undefined" &&
          window.matchMedia &&
          window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    let raf = 0;
    let running = true;
    let shootingTimeout: ReturnType<typeof setTimeout> | null = null;
    let w = 0, h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    const stars = Array.from({ length: starCount }).map(() => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.5 + Math.random() * 1.2,
      a: 0.3 + Math.random() * 0.7,
      tw: 0.5 + Math.random() * 1.5,
    }));

    type Shoot = { x: number; y: number; vx: number; vy: number; life: number; max: number };
    let shooting: Shoot[] = [];
    const parallax = { x: 0, y: 0 };

    function resize() {
      w = window.innerWidth; 
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    function spawnShooting() {
      if (reduced || !running) return;
      const delay = randomBetween(shootingMin, shootingMax);
      const startAtRight = Math.random() > 0.5;
      const x = startAtRight ? w + 50 : -50;
      const y = Math.random() * (h * 0.4);
      const speed = 900 + Math.random() * 600;
      const angle = startAtRight ? Math.PI * 0.75 : Math.PI * 0.25;
      const vx = Math.cos(angle) * (speed / 60);
      const vy = Math.sin(angle) * (speed / 60);
      shooting.push({ x, y, vx, vy, life: 0, max: 60 + Math.random() * 25 });
      shootingTimeout = setTimeout(spawnShooting, delay);
    }
    shootingTimeout = setTimeout(spawnShooting, randomBetween(shootingMin, shootingMax));

    function draw() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      // Sterne
      for (const s of stars) {
        const sx = s.x * w + parallax.x * 0.4;
        const sy = s.y * h + parallax.y * 0.4;
        if (!reduced) s.a = clamp(s.a + Math.sin(perfNow()*s.tw)*0.003, 0.15, 1);
        ctx.globalAlpha = s.a;
        ctx.beginPath();
        ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
        ctx.fillStyle = "#c7d2fe";
        ctx.fill();
      }

      // Sternschnuppen
      if (!reduced) {
        shooting = shooting.filter(s => s.life < s.max);
        for (const sh of shooting) {
          sh.x += sh.vx;
          sh.y += sh.vy;
          sh.life++;
          const len = 140;
          const nx = sh.x - sh.vx * 4;
          const ny = sh.y - sh.vy * 4;
          const grad = ctx.createLinearGradient(sh.x, sh.y, nx, ny);
          grad.addColorStop(0, "rgba(255,255,255,0.9)");
          grad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(sh.x, sh.y);
          ctx.lineTo(sh.x - (sh.vx*len/60), sh.y - (sh.vy*len/60));
          ctx.stroke();
        }
      }

      raf = requestAnimationFrame(draw);
    }

    function onMouseMove(e: MouseEvent) {
      if (reduced || !enableParallax) return;
      const tx = ((e.clientX / w) - 0.5) * 20;
      const ty = ((e.clientY / h) - 0.5) * 20;
      parallax.x += (tx - parallax.x) * 0.08;
      parallax.y += (ty - parallax.y) * 0.08;
    }

    document.addEventListener("mousemove", onMouseMove);
    const start = () => { running = true; raf = requestAnimationFrame(draw); };
    const stop = () => { running = false; cancelAnimationFrame(raf); };
    const handleVisibilityChange = () => document.hidden ? stop() : start();
    document.addEventListener("visibilitychange", handleVisibilityChange);
    start();

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      if (shootingTimeout) {
        clearTimeout(shootingTimeout);
      }
      window.removeEventListener("resize", resize);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [starCount, enableParallax, shootingMin, shootingMax, reduced]);

  return (
    <>
      <div className="hero-gradient-layer" aria-hidden />
      <canvas ref={canvasRef} className="hero-stars-layer" aria-hidden />
    </>
  );
}
