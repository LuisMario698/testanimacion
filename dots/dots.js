// Fondos de puntos para un <canvas>, sin dependencias, pensados para la landing de SiMAR.
// Se animan UNA vez al entrar en pantalla y se quedan quietos (nada en bucle); después sólo se
// redibujan cuando el cursor pasa cerca. Con "reducir movimiento" aparecen ya terminados.
//
// Uso: const stop = startDots(canvas, { variant: 'batimetria', color: '--simar-marea' });  ...  stop();
// `color` y `accent` aceptan un color o el nombre de una variable CSS (se lee en el canvas).
export const VARIANTS = ['batimetria', 'ola', 'rejilla', 'cifras'];

const ease = x => 1 - (1 - x) ** 3; // desacelera al final, sin rebote
const clamp01 = x => Math.max(0, Math.min(1, x));
const dot = (ctx, x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); };

const SCENES = {
  // Curvas de profundidad hechas de puntos; aparecen del centro hacia afuera, como un sonar
  batimetria: {
    dur: 2600, glow: true,
    init(W, H) {
      const cx = W > 900 ? W * 0.72 : W * 0.5, cy = H * 0.45, step = Math.max(W, H) * 0.06, P = [];
      for (let i = 1; i <= 10; i++) {
        const n = Math.round(2 * Math.PI * i * step / 9);
        for (let j = 0; j < n; j++) {
          const a = j / n * 2 * Math.PI, r = i * step * (1 + 0.12 * Math.sin(3 * a + i * 0.7) + 0.06 * Math.sin(5 * a - i));
          P.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r * 0.8, r: 1.5, d: i / 10 });
        }
      }
      return P;
    },
    draw(ctx, P, W, H, k) {
      const front = ease(k) * 1.15;
      for (const p of P) {
        const a = clamp01((front - p.d) / 0.12);
        if (!a) continue;
        ctx.globalAlpha = a * (0.9 - p.d * 0.5);
        dot(ctx, p.x, p.y, p.r);
      }
      ctx.globalAlpha = 1;
    },
  },

  // Mar de puntos en perspectiva que se levanta en una ola suave y se queda así; el cursor la alza
  ola: {
    dur: 2800,
    init() {
      const P = [];
      for (let r = 0; r < 26; r++) for (let c = 0; c < 64; c++) P.push({ x: c / 63 * 2.8 - 1.4, v: 1 - r / 25 });
      return P;
    },
    draw(ctx, P, W, H, k, m) {
      const e = ease(k), ph = e * 1.6;
      for (const p of P) {
        const z = 1 + p.v * 3, f = (1 / z - 0.25) / 0.75, sx = W / 2 + p.x / z * W * 0.6, sy = H * (0.15 + 0.8 * f);
        const lift = k === 1 ? Math.exp(-((sx - m.x) ** 2 + (sy - m.y) ** 2) / 5000) : 0;
        const w = Math.sin(p.x * 3 + ph) * 0.5 + Math.sin(p.v * 10 - ph * 1.3) * 0.5;
        ctx.globalAlpha = (1 - p.v * 0.7) * clamp01(k * 2);
        dot(ctx, sx, sy - (w * e + lift * 1.5) * H * 0.1 / z, 2.4 / z);
      }
      ctx.globalAlpha = 1;
    },
  },

  // Trama de puntos (como impresión en papel) que aparece en diagonal; crece hacia una esquina
  rejilla: {
    dur: 1800, glow: true,
    init(W, H) {
      const P = [], g = 22;
      for (let y = g / 2; y < H; y += g) for (let x = g / 2; x < W; x += g)
        P.push({ x, y, r: 0.5 + 1.8 * (x / W * 0.4 + y / H * 0.6), d: (x + y) / (W + H) });
      return P;
    },
    draw(ctx, P, W, H, k) {
      const front = ease(k) * 1.2;
      for (const p of P) {
        const a = clamp01((front - p.d) / 0.2);
        if (!a) continue;
        ctx.globalAlpha = 0.55 * a;
        dot(ctx, p.x, p.y, p.r * a);
      }
      ctx.globalAlpha = 1;
    },
  },

  // Cada punto es una cantidad (p. ej. 10 kg de residuos): caen y se apilan en un bloque
  cifras: {
    dur: 3200,
    init(W, H, count) {
      const g = W < 600 ? 9 : 12, cols = Math.max(10, Math.floor(Math.min(W * 0.85, 960) / g)), rows = Math.ceil(count / cols);
      const x0 = (W - (cols - 1) * g) / 2, y0 = H * 0.55 + (rows - 1) * g / 2;
      return Array.from({ length: count }, (_, i) => ({
        x: x0 + (i % cols) * g, y: y0 - Math.floor(i / cols) * g, s: -20 - Math.random() * H * 0.6, d: i / count * 0.6, r: g / 4,
      }));
    },
    draw(ctx, P, W, H, k) {
      for (const p of P) {
        const q = clamp01((k - p.d) / 0.4);
        if (!q) continue;
        ctx.globalAlpha = Math.min(1, q * 3);
        dot(ctx, p.x, p.s + (p.y - p.s) * ease(q), p.r);
      }
      ctx.globalAlpha = 1;
    },
  },
};

// Resalta con el color de acento los puntos cercanos al cursor
function glow(ctx, P, m, color) {
  if (m.x < -1e3) return;
  ctx.fillStyle = color;
  for (const p of P) {
    const f = 1 - Math.hypot(p.x - m.x, p.y - m.y) / 110;
    if (f > 0) { ctx.globalAlpha = f; dot(ctx, p.x, p.y, p.r + f * 2.2); }
  }
  ctx.globalAlpha = 1;
}

export function startDots(canvas, { variant = 'batimetria', color = '--simar-marea', accent = '--simar-golfo', count = 600, interactive = true } = {}) {
  const ctx = canvas.getContext('2d'), scene = SCENES[variant] || SCENES.batimetria;
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = v => (v.startsWith('--') ? getComputedStyle(canvas).getPropertyValue(v).trim() : v);
  const mouse = { x: -1e4, y: -1e4 };
  let W = 0, H = 0, S = [], k = still ? 1 : 0, t0 = 0, raf = 0, fill = '', hi = '';

  const draw = () => {
    raf = 0;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = fill;
    scene.draw(ctx, S, W, H, k, mouse);
    if (k === 1 && interactive && scene.glow) glow(ctx, S, mouse, hi);
  };
  const intro = t => {
    t0 ||= t;
    k = Math.min(1, (t - t0) / scene.dur);
    draw();
    if (k < 1) raf = requestAnimationFrame(intro);
  };
  const redraw = () => { if (k === 1 && !raf) raf = requestAnimationFrame(draw); };
  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth; H = canvas.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fill = css(color) || '#1B5FC9'; hi = css(accent) || fill;
    S = scene.init(W, H, count);
    if (!raf) draw();
  };
  // El canvas va detrás del contenido (pointer-events: none), así que el cursor se escucha en la ventana
  const move = e => {
    const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    if (x < -120 || y < -120 || x > W + 120 || y > H + 120) {
      if (mouse.x === -1e4) return; // lejos y ya estaba lejos: nada que redibujar
      mouse.x = mouse.y = -1e4;
    } else { mouse.x = x; mouse.y = y; }
    redraw();
  };
  const leave = e => {
    if (e.type !== 'pointerleave' && e.pointerType === 'mouse') return;
    mouse.x = mouse.y = -1e4;
    redraw();
  };
  // La animación de entrada empieza cuando el canvas se ve, no al cargar la página
  const io = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    if (k < 1) { cancelAnimationFrame(raf); raf = requestAnimationFrame(intro); }
  }, { threshold: 0.25 });
  const ro = new ResizeObserver(resize);

  if (interactive) {
    addEventListener('pointermove', move);
    addEventListener('pointerup', leave);
    document.documentElement.addEventListener('pointerleave', leave);
  }
  ro.observe(canvas);
  io.observe(canvas);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect(); io.disconnect();
    removeEventListener('pointermove', move);
    removeEventListener('pointerup', leave);
    document.documentElement.removeEventListener('pointerleave', leave);
  };
}
