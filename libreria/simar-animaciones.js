// Probador de animaciones sobre la copia de la landing de SiMAR.
// 1) Recrea las transiciones de la landing (scroll, cifras, entrada del hero, carrusel) y ofrece alternativas.
// 2) Pone un <canvas> de puntos detrás de cada sección, con animación elegible por sección o global.
// 3) Un panel con pestañas: fondos por sección, estilos de transición y diseño del carrusel del hero.
(() => {
  const rnd = (a, b) => a + Math.random() * (b - a);
  const LIGHT = { a: '#1B5FC9', b: '#20B2C4' }, DARK = { a: '#7FE0D6', b: '#8CC3D1' };
  const mouse = { x: -1e4, y: -1e4 };
  const store = { get(k, d) { try { return JSON.parse(localStorage.getItem('simar-dz-' + k)) ?? d; } catch { return d; } },
                  set(k, v) { try { localStorage.setItem('simar-dz-' + k, JSON.stringify(v)); } catch {} } };

  /* ───────────── Transiciones (las originales y alternativas) ───────────── */
  const hero = document.getElementById('top');
  const cfg = { rv: 'subir', rvDur: 'normal', stagger: false, num: 'contar', entra: 'original', car: 'fundido', seg: 6, hero: 'original' };
  const style = document.createElement('style');
  document.head.append(style);

  // Cómo arranca un bloque .reveal antes de aparecer (el original sube 32 px)
  const RV = {
    fundido: 'transform:none!important',
    zoom: 'transform:scale(.92)!important',
    lateral: 'transform:translateX(-48px)!important',
    desenfoque: 'transform:translateY(16px)!important;filter:blur(12px)',
    inclinar: 'transform:perspective(900px) rotateX(16deg) translateY(28px)!important;transform-origin:50% 100%',
  };
  const WAVE_MASK = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M9 0C1 12 15 22 7 34S14 58 7 70 13 90 9 100H100V0Z"/></svg>')}")`;
  const LAYOUT_CSS = `
    @media (min-width:1024px){
      #top[data-hero=grande] > .grid,#top[data-hero=ola] > .grid,#top[data-hero=apiladas] > .grid{grid-template-columns:.92fr 1.08fr}
      #top[data-hero=grande] figure,#top[data-hero=ola] figure{height:760px!important;margin-right:min(-96px,calc((1340px - 100vw) / 2 - 96px))}
      #top[data-hero=grande] figure{border-radius:48px 0 0 48px!important}
      #top[data-hero=apiladas] figure{height:640px!important;margin-right:40px}
    }
    #top[data-hero=ola] figure{border-radius:0!important;-webkit-mask:${WAVE_MASK} 0 0/100% 100%;mask:${WAVE_MASK} 0 0/100% 100%;box-shadow:none!important}
    #top[data-hero=fondo] > .grid,#top[data-hero=fondo] .dz-figwrap{position:static!important}
    #top[data-hero=fondo] figure{position:absolute!important;inset:0;height:auto!important;border-radius:0!important;box-shadow:none!important;margin:0!important}
    #top[data-hero=fondo] figure::after{content:"";position:absolute;inset:0;z-index:25;pointer-events:none;
      background:linear-gradient(90deg,#E9E4D9 0%,rgba(233,228,217,.93) 36%,rgba(233,228,217,.45) 60%,rgba(233,228,217,0) 82%)}
    @media (max-width:1023px){#top[data-hero=fondo] figure::after{background:linear-gradient(180deg,rgba(233,228,217,.96),rgba(233,228,217,.86) 60%,rgba(233,228,217,.25))}}
    #top[data-hero=fondo] > .grid > div:first-child{position:relative;z-index:30}
    #top[data-hero=fondo] figure [role=group]{left:auto!important;right:32px;transform:none!important}
    #top[data-hero=fondo] > canvas{z-index:26!important}`;
  const CAROUSEL_CSS = `
    #top figure[data-tr=deslizar] img{opacity:1!important;transform:translateX(100%);transition:transform 1.1s cubic-bezier(.65,0,.35,1)!important}
    #top figure[data-tr=deslizar] img.dz-prev{transform:translateX(-25%)}
    #top figure[data-tr=deslizar] img.dz-on{transform:none}
    #top figure[data-tr=cortina] img{opacity:1!important;clip-path:inset(0 0 0 100%);transition:clip-path 1.3s cubic-bezier(.65,0,.35,1)!important}
    #top figure[data-tr=cortina] img.dz-prev,#top figure[data-tr=cortina] img.dz-on{clip-path:inset(0)}
    #top figure[data-tr=zoom] img.dz-on{animation:dz-ken var(--dz-seg) linear both}
    #top figure[data-tr=zoom] img.dz-prev{transform:scale(1.14)}
    @keyframes dz-ken{from{transform:scale(1.02)}to{transform:scale(1.14)}}
    #top figure[data-tr=desenfoque] img{transition:opacity 1.4s,filter 1.4s!important}
    #top figure[data-tr=desenfoque] img:not(.dz-on){filter:blur(18px) saturate(1.4)}
    #top figure[data-tr=corte] img{transition:none!important}`;

  function applyCss() {
    let s = '.reveal{transition-property:opacity,transform,filter!important}';
    if (cfg.rv === 'ninguna') s += '.reveal{transition:none!important;opacity:1!important;transform:none!important}';
    else if (RV[cfg.rv]) s += `.reveal:not(.reveal--visible){${RV[cfg.rv]}}`;
    const dur = { rapida: '.45s', lenta: '1.4s' }[cfg.rvDur];
    if (dur) s += `.reveal{transition-duration:${dur}!important}`;
    if (cfg.entra === 'ninguna') s += '.simar-entra,.simar-dibuja,.simar-mancha{animation:none!important;stroke-dashoffset:0!important}';
    if (cfg.entra === 'lenta') s += '.simar-entra,.simar-mancha{animation-duration:1.9s!important}.simar-dibuja{animation-duration:4.5s!important}';
    if (cfg.entra === 'zoom') s += '#top .simar-entra{animation:dz-zoom 1.1s cubic-bezier(.2,.8,.2,1) backwards!important}@keyframes dz-zoom{from{opacity:0;transform:scale(.88)}}';
    if (cfg.entra === 'lado') s += '#top .simar-entra{animation:dz-lado 1s cubic-bezier(.2,.8,.2,1) backwards!important}@keyframes dz-lado{from{opacity:0;transform:translateX(-60px)}}';
    style.textContent = s + LAYOUT_CSS + CAROUSEL_CSS;
  }

  // Igual que useScrollReveal: aparece al entrar en pantalla, con su data-delay (o escalonado)
  let revealObs;
  function reveals() {
    revealObs?.disconnect();
    const els = [...document.querySelectorAll('.reveal')];
    els.forEach(el => { el.classList.remove('reveal--visible'); el.style.transitionDelay = ''; });
    if (cfg.rv === 'ninguna') { els.forEach(el => el.classList.add('reveal--visible')); return; }
    void document.body.offsetWidth;
    revealObs = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      let d = +(el.dataset.delay || 0);
      if (cfg.stagger) d += [...el.parentElement.children].filter(c => c.classList.contains('reveal')).indexOf(el) * 120;
      el.style.transitionDelay = d + 'ms';
      el.classList.add('reveal--visible');
      revealObs.unobserve(el);
    }), { threshold: 0.15, rootMargin: '0px 0px -80px 0px' });
    els.forEach(el => revealObs.observe(el));
  }
  function replayEntrance() {
    document.querySelectorAll('.simar-entra,.simar-dibuja,.simar-mancha').forEach(el => { el.style.animation = 'none'; void el.offsetWidth; el.style.animation = ''; });
  }

  // Cifras (NumeroAnimado): contar, dígitos que ruedan, aparecer o nada
  let countObs;
  function counters() {
    countObs?.disconnect();
    const nums = [...document.querySelectorAll('.sr-only + [aria-hidden="true"].tabular-nums')];
    const info = el => {
      const txt = el.previousElementSibling.textContent.trim();
      return { final: parseFloat(txt.replace(/,/g, '')) || 0, dec: (txt.split('.')[1] || '').length };
    };
    const fmt = (n, dec) => n.toLocaleString('es-MX', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    nums.forEach(el => { const { final, dec } = info(el); el.style.display = 'inline-block'; el.textContent = fmt(cfg.num === 'contar' ? 0 : final, dec); el.style.opacity = cfg.num === 'aparecer' ? 0 : ''; });
    if (cfg.num === 'ninguna') return;
    countObs = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      countObs.unobserve(e.target);
      const el = e.target, { final, dec } = info(el), txt = fmt(final, dec), t0 = performance.now();
      if (cfg.num === 'aparecer') {
        el.style.opacity = '';
        el.animate([{ opacity: 0, transform: 'translateY(14px) scale(.85)' }, { opacity: 1, transform: 'none' }], { duration: 800, easing: 'cubic-bezier(.2,.8,.2,1)' });
        return;
      }
      requestAnimationFrame(function step(t) {
        const p = Math.min(1, (t - t0) / 1400);
        if (cfg.num === 'contar') el.textContent = fmt(final * (1 - (1 - p) ** 3), dec);
        else { // rodar: los dígitos cambian al azar y se van fijando de izquierda a derecha
          const fixed = Math.floor(p * txt.length);
          el.textContent = [...txt].map((ch, k) => (k < fixed || !/\d/.test(ch) ? ch : Math.floor(Math.random() * 10))).join('');
        }
        if (p < 1) requestAnimationFrame(step); else el.textContent = txt;
      });
    }), { threshold: 0.4 });
    nums.forEach(el => countObs.observe(el));
  }

  // Carrusel del hero: tipo de cambio y duración elegibles; píldoras y pausa funcionan
  const car = (() => {
    const fig = hero.querySelector('figure');
    if (!fig) return { refresh() {}, stack() {} };
    if (!fig.parentElement.classList.contains('grid')) fig.parentElement.classList.add('dz-figwrap');
    const imgs = [...fig.querySelectorAll('img')], group = fig.querySelector('[role="group"]');
    const dots = [...group.querySelectorAll('button[aria-label^="Ver fotograf"]')];
    const pause = [...group.querySelectorAll('button')].find(b => !dots.includes(b));
    let i = 0, prev = -1, paused = false, timer;
    imgs.forEach((im, k) => { if (im.classList.contains('opacity-100') && +im.style.zIndex >= +(imgs[i].style.zIndex || 0)) i = k; });
    // Tarjetas de atrás para el diseño "apiladas": muestran las siguientes fotos
    const cards = [0, 1].map(() => {
      const d = document.createElement('div');
      d.style.cssText = 'position:absolute;border-radius:40px;background:center/cover;box-shadow:0 30px 60px -36px rgba(11,34,54,.6);pointer-events:none;display:none;transition:transform .9s cubic-bezier(.2,.8,.2,1)';
      fig.before(d);
      return d;
    });
    fig.style.zIndex = 3;
    function stack() {
      const on = hero.dataset.hero === 'apiladas';
      cards.forEach((d, k) => {
        d.style.display = on ? '' : 'none';
        if (!on) return;
        Object.assign(d.style, {
          left: fig.offsetLeft + 'px', top: fig.offsetTop + 'px', width: fig.offsetWidth + 'px', height: fig.offsetHeight + 'px',
          transform: `rotate(${(k + 1) * 3.5}deg) translate(${(k + 1) * 26}px, ${(k + 1) * 6}px)`, opacity: 1 - k * 0.3, zIndex: 2 - k,
          backgroundImage: `url("${imgs[(i + k + 1) % imgs.length].getAttribute('src')}")`,
        });
      });
    }
    function show(n) {
      if (n !== i) prev = i;
      i = (n + imgs.length) % imgs.length;
      fig.dataset.tr = cfg.car;
      fig.style.setProperty('--dz-seg', cfg.seg + 1 + 's');
      imgs.forEach((im, k) => {
        const on = k === i, pv = k === prev;
        im.classList.toggle('dz-on', on); im.classList.toggle('dz-prev', pv);
        im.classList.toggle('opacity-100', on || pv); im.classList.toggle('opacity-0', !(on || pv));
        im.style.zIndex = on ? 3 : pv ? 2 : 1;
      });
      dots.forEach((d, k) => {
        const pill = d.firstElementChild, on = k === i;
        pill.classList.toggle('w-10', on); pill.classList.toggle('w-2.5', !on);
        pill.innerHTML = on ? `<span class="absolute inset-0 rounded-full bg-simar-texto simar-avance" style="--simar-avance-dur:${cfg.seg}s;animation-play-state:${paused ? 'paused' : 'running'}"></span>` : '';
        if (on) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current');
      });
      group.setAttribute('aria-label', `Fotografía ${i + 1} de ${imgs.length}`);
      stack();
      clearTimeout(timer);
      if (!paused) timer = setTimeout(() => show(i + 1), cfg.seg * 1000);
    }
    dots.forEach((d, k) => d.addEventListener('click', () => show(k)));
    pause?.addEventListener('click', () => { paused = !paused; show(i); });
    new ResizeObserver(stack).observe(fig);
    return { refresh: () => show(i), stack };
  })();

  /* ───────────── Animaciones de puntos ───────────── */
  function fish(ctx, p, len) {
    const sp = Math.hypot(p.vx, p.vy) || 1;
    ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx / sp * len, p.y - p.vy / sp * len); ctx.stroke();
  }
  // Reglas de cardumen: seguir a los vecinos, no chocar, huir del cursor, no salirse
  function school(P, L, o) {
    const { W, H, mx, my, sp: k } = L;
    for (const p of P) {
      let ax = 0, ay = 0, cx = 0, cy = 0, sx = 0, sy = 0, n = 0;
      for (const q of P) {
        if (q === p || (o.team && q.t !== p.t)) continue;
        const dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy;
        if (d2 > 3600) continue;
        n++; ax += q.vx; ay += q.vy; cx += dx; cy += dy;
        if (d2 < 220) { sx -= dx; sy -= dy; }
      }
      if (n) { p.vx += (ax / n - p.vx) * 0.05 + cx / n * 0.004; p.vy += (ay / n - p.vy) * 0.05 + cy / n * 0.004; }
      p.vx += sx * 0.03; p.vy += sy * 0.03;
      const ex = p.x - mx, ey = p.y - my, ed = Math.hypot(ex, ey) || 1;
      if (o.follow) { if (mx > -1e3 && ed > 90) { p.vx -= ex / ed * 0.08; p.vy -= ey / ed * 0.08; } }
      else if (ed < 140) { p.vx += ex / ed * 0.6; p.vy += ey / ed * 0.6; }
      if (o.orbit) { const [ox, oy] = o.orbit, dx = p.x - ox, dy = p.y - oy, d = Math.hypot(dx, dy) || 1; p.vx += (-dy / d) * 0.12 - dx / d * (d - o.r) * 0.002; p.vy += (dx / d) * 0.12 - dy / d * (d - o.r) * 0.002; }
      if (o.pull) { p.vx += o.pull[0]; p.vy += o.pull[1]; }
      if (!o.open) { if (p.x < 60) p.vx += 0.15; if (p.x > W - 60) p.vx -= 0.15; }
      if (p.y < 60) p.vy += 0.15; if (p.y > H - 60) p.vy -= 0.15;
      const s = Math.hypot(p.vx, p.vy) || 1, lim = Math.min(o.max, Math.max(o.min, s)) / s;
      p.vx *= lim; p.vy *= lim; p.x += p.vx * k; p.y += p.vy * k;
    }
  }
  const drawFish = (P, L, w, len, alpha, two = true) => {
    const { ctx } = L; ctx.lineCap = 'round'; ctx.lineWidth = w; ctx.globalAlpha = alpha;
    P.forEach((p, i) => { ctx.strokeStyle = (two ? i % 3 : p.t) ? L.c.a : L.c.b; fish(ctx, p, len); });
  };
  const many = (L, per, min = 10) => Math.max(min, Math.round(L.W * L.H / per * L.dn));
  const newFish = (L, n, x0 = 0, x1 = 1) => Array.from({ length: n }, (_, i) => ({ x: rnd(L.W * x0, L.W * x1), y: rnd(0, L.H), vx: rnd(-1, 1), vy: rnd(-1, 1), t: i % 2 }));

  const SCENES = {
    ninguna: { name: 'Ninguna', group: '', init: () => [], draw() {} },

    cardumen: { name: 'Cardumen', group: 'Peces', desc: 'Banco de peces-punto que nada por la sección y huye del cursor.',
      init: L => newFish(L, Math.min(220, many(L, 5500, 40))),
      draw: (P, L) => { school(P, L, { min: 1.4, max: 3.2 }); drawFish(P, L, 3.5, 8, 0.7); } },
    tenue: { name: 'Cardumen tenue', group: 'Peces', desc: 'Pocos peces chicos, lentos y transparentes. Casi no distrae.',
      init: L => newFish(L, Math.min(90, many(L, 14000, 20)), 0.3, 1),
      draw: (P, L) => { school(P, L, { min: 0.7, max: 1.6 }); drawFish(P, L, 2.2, 6, 0.35, false); } },
    paso: { name: 'Cardumen de paso', group: 'Peces', desc: 'Cada 8–14 s un cardumen cruza de izquierda a derecha y se va.',
      init(L) { const P = newFish(L, Math.min(130, many(L, 8000, 30))); P.wait = 40; P.on = false; return P; },
      draw(P, L) {
        if (!P.on) {
          if ((P.wait -= L.sp) > 0) return;
          const y0 = rnd(L.H * 0.25, L.H * 0.75);
          for (const p of P) Object.assign(p, { x: rnd(-260, -20), y: y0 + rnd(-60, 60), vx: 2, vy: rnd(-0.3, 0.3) });
          P.on = true;
        }
        school(P, L, { pull: [0.05, 0], min: 1.6, max: 2.6, open: true });
        if (P.every(p => p.x > L.W + 20)) { P.on = false; P.wait = 60 * rnd(8, 14); }
        drawFish(P, L, 3, 7, 0.6);
      } },
    remolino: { name: 'Remolino', group: 'Peces', desc: 'El cardumen gira en círculo (como una "bola de carnada") que se desplaza lento.',
      init: L => newFish(L, Math.min(180, many(L, 6000, 40)), 0.5, 1),
      draw(P, L, t) {
        const ox = L.W * (0.7 + Math.sin(t * 0.0001) * 0.12), oy = L.H * (0.5 + Math.cos(t * 0.00013) * 0.15);
        school(P, L, { orbit: [ox, oy], r: Math.min(L.W, L.H) * 0.2, min: 1.4, max: 2.8 }); drawFish(P, L, 3, 7, 0.6);
      } },
    sigue: { name: 'Cardumen curioso', group: 'Peces', desc: 'En vez de huir, el cardumen sigue al cursor a cierta distancia.',
      init: L => newFish(L, Math.min(140, many(L, 8000, 30))),
      draw: (P, L) => { school(P, L, { follow: true, min: 1, max: 2.6 }); drawFish(P, L, 3, 7, 0.6); } },
    dos: { name: 'Dos cardúmenes', group: 'Peces', desc: 'Dos bancos de distinto color que nadan cada uno por su lado.',
      init: L => newFish(L, Math.min(200, many(L, 6000, 40))),
      draw: (P, L) => { school(P, L, { team: true, min: 1.3, max: 3 }); drawFish(P, L, 3, 7, 0.65, false); } },

    burbujas: { name: 'Burbujas', group: 'Agua', desc: 'Burbujas diminutas que suben meciéndose; el cursor las aparta.',
      init: L => Array.from({ length: many(L, 22000) }, () => ({ x: rnd(0, L.W), y: rnd(0, L.H), r: rnd(1, 3.2), s: rnd(0.2, 0.6), ph: rnd(0, 6.28) })),
      draw(P, L, t) {
        const { ctx } = L; ctx.strokeStyle = L.c.b; ctx.lineWidth = 1.2;
        for (const p of P) {
          p.y -= p.s * L.sp; p.x += Math.sin(t * 0.001 + p.ph) * 0.3;
          const dx = p.x - L.mx, dy = p.y - L.my, d = Math.hypot(dx, dy) || 1;
          if (d < 90) { p.x += dx / d * 1.5; p.y += dy / d * 1.5; }
          if (p.y < -10) { p.y = L.H + 10; p.x = rnd(0, L.W); }
          ctx.globalAlpha = 0.25 + (p.y / L.H) * 0.25; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.stroke();
        }
      } },
    plancton: { name: 'Plancton', group: 'Agua', desc: 'Puntos a la deriva con la corriente; brillan cerca del cursor.',
      init: L => Array.from({ length: many(L, 9000) }, () => ({ x: rnd(0, L.W), y: rnd(0, L.H), r: rnd(0.8, 2), ph: rnd(0, 6.28) })),
      draw(P, L, t) {
        const { ctx } = L;
        for (const p of P) {
          p.x += (0.25 + Math.sin(t * 0.0004 + p.ph) * 0.15) * L.sp; p.y += Math.cos(t * 0.0005 + p.ph) * 0.2 * L.sp;
          if (p.x > L.W + 5) { p.x = -5; p.y = rnd(0, L.H); }
          const near = Math.max(0, 1 - Math.hypot(p.x - L.mx, p.y - L.my) / 130);
          ctx.fillStyle = near > 0.2 ? L.c.b : L.c.a; ctx.globalAlpha = 0.3 + near * 0.6;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (1 + near), 0, 6.28); ctx.fill();
        }
      } },
    nieve: { name: 'Nieve marina', group: 'Agua', desc: 'Partículas que caen muy despacio, como la "nieve" del fondo del mar.',
      init: L => Array.from({ length: many(L, 12000) }, () => ({ x: rnd(0, L.W), y: rnd(0, L.H), r: rnd(0.6, 1.8), s: rnd(0.1, 0.35), ph: rnd(0, 6.28) })),
      draw(P, L, t) {
        const { ctx } = L; ctx.fillStyle = L.c.a;
        for (const p of P) {
          p.y += p.s * L.sp; p.x += Math.sin(t * 0.0007 + p.ph) * 0.2;
          if (p.y > L.H + 5) { p.y = -5; p.x = rnd(0, L.W); }
          ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28); ctx.fill();
        }
      } },
    corriente: { name: 'Corriente suave', group: 'Agua', desc: 'Hilos finos que siguen corrientes lentas con estela corta.',
      init: L => Array.from({ length: many(L, 5000) }, () => ({ x: rnd(0, L.W), y: rnd(0, L.H), h: [] })),
      draw(P, L, t) {
        const { ctx } = L; ctx.strokeStyle = L.c.a; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; ctx.globalAlpha = 0.3;
        for (const p of P) {
          let a = Math.sin(p.x * 0.003 + t * 0.00012) * 0.6 + Math.cos(p.y * 0.005 - t * 0.0001) * 0.4;
          const d = Math.hypot(p.x - L.mx, p.y - L.my); if (d < 140) a += (1 - d / 140) * 2;
          p.h.push(p.x, p.y); if (p.h.length > 24) p.h.splice(0, 2);
          p.x += Math.cos(a) * 0.8 * L.sp; p.y += Math.sin(a) * 0.8 * L.sp;
          if (p.x > L.W + 10 || p.x < -10 || p.y < -10 || p.y > L.H + 10) { p.x = rnd(-10, L.W * 0.2); p.y = rnd(0, L.H); p.h = []; }
          ctx.beginPath(); for (let i = 0; i < p.h.length; i += 2) ctx.lineTo(p.h[i], p.h[i + 1]); ctx.stroke();
        }
      } },

    destellos: { name: 'Destellos', group: 'Luz', desc: 'Puntos que se encienden y apagan despacio, como el sol sobre el agua.',
      init: L => Array.from({ length: many(L, 7000) }, () => ({ x: rnd(0, L.W), y: rnd(0, L.H), ph: rnd(0, 6.28), f: rnd(0.4, 1.2), r: rnd(1, 2.4) })),
      draw(P, L, t) {
        const { ctx } = L; ctx.fillStyle = L.c.b;
        for (const p of P) {
          const a = Math.max(0, Math.sin(t * 0.0012 * p.f * L.sp + p.ph)) ** 3;
          if (a < 0.02) continue;
          ctx.globalAlpha = a * 0.7; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.6 + a * 0.6), 0, 6.28); ctx.fill();
        }
      } },
    sonar: { name: 'Sonar', group: 'Luz', desc: 'Cada pocos segundos sale una onda de puntos desde el cursor o desde un lado, y se desvanece.',
      init: L => { const P = []; P.next = 0; return P; },
      draw(P, L, t) {
        if (t > P.next) {
          P.push({ x: L.mx > -1e3 ? L.mx : L.W * 0.8, y: L.mx > -1e3 ? L.my : L.H * 0.4, t0: t });
          P.next = t + 3500 / L.sp;
        }
        const { ctx } = L; ctx.fillStyle = L.c.b;
        for (let i = P.length - 1; i >= 0; i--) {
          const w = P[i], age = (t - w.t0) * 0.001 * L.sp;
          if (age > 4) { P.splice(i, 1); continue; }
          const R = age * 120, n = Math.max(12, Math.round(R * 6.28 / 12));
          ctx.globalAlpha = (1 - age / 4) * 0.55 * Math.min(1, L.dn);
          for (let j = 0; j < n; j++) { const a = j / n * 6.28; ctx.beginPath(); ctx.arc(w.x + Math.cos(a) * R, w.y + Math.sin(a) * R * 0.8, 1.6, 0, 6.28); ctx.fill(); }
        }
      } },
    rejilla: { name: 'Rejilla que respira', group: 'Luz', desc: 'Trama de puntos que se ilumina en ondas diagonales lentas; crece bajo el cursor.',
      init(L) { const P = [], g = Math.round(28 / Math.sqrt(L.dn)); for (let y = g / 2; y < L.H; y += g) for (let x = g / 2; x < L.W; x += g) P.push({ x, y }); return P; },
      draw(P, L, t) {
        const { ctx } = L; ctx.fillStyle = L.c.a;
        for (const p of P) {
          const w = (Math.sin((p.x + p.y) * 0.01 - t * 0.0012 * L.sp) + 1) / 2, f = Math.max(0, 1 - Math.hypot(p.x - L.mx, p.y - L.my) / 150);
          ctx.globalAlpha = 0.12 + w * 0.25 + f * 0.4; ctx.beginPath(); ctx.arc(p.x, p.y, 1 + w * 0.8 + f * 2.5, 0, 6.28); ctx.fill();
        }
      } },
    ola: { name: 'Ola de puntos', group: 'Luz', desc: 'Mar de puntos en perspectiva que ondula en la parte baja de la sección.',
      init() { const P = []; for (let r = 0; r < 20; r++) for (let c = 0; c < 70; c++) P.push({ x: c / 69 * 3 - 1.5, v: 1 - r / 19 }); return P; },
      draw(P, L, t) {
        t *= 0.001 * L.sp; const top = L.H * 0.65, { ctx } = L;
        for (const p of P) {
          const z = 1 + p.v * 3, f = (1 / z - 0.25) / 0.75, sx = L.W / 2 + p.x / z * L.W * 0.6, sy = top + (L.H - top) * f;
          const lift = Math.exp(-((sx - L.mx) ** 2 + (sy - L.my) ** 2) / 6000), w = Math.sin(p.x * 3 + t * 0.8) * 0.5 + Math.sin(p.v * 9 - t * 1.1) * 0.5;
          ctx.globalAlpha = (1 - p.v * 0.75) * 0.7 * Math.min(1, L.dn); ctx.fillStyle = p.v < 0.3 ? L.c.a : L.c.b;
          ctx.beginPath(); ctx.arc(sx, sy - (w + lift * 1.6) * 16 / z, 2.6 / z, 0, 6.28); ctx.fill();
        }
      } },
    vortice: { name: 'Vórtice', group: 'Agua', desc: 'Puntos que giran en espiral lenta hacia un centro, como un remolino de agua.',
      init: L => Array.from({ length: many(L, 5000) }, () => ({ a: rnd(0, 6.28), r: rnd(0.05, 1) })),
      draw(P, L) {
        const cx = L.W * 0.75, cy = L.H * 0.5, R = Math.max(L.W, L.H) * 0.6, { ctx } = L; ctx.fillStyle = L.c.a;
        for (const p of P) {
          p.a += 0.004 / (p.r + 0.15) * L.sp; p.r -= 0.0006 * L.sp;
          if (p.r < 0.03) { p.r = 1; p.a = rnd(0, 6.28); }
          ctx.globalAlpha = Math.min(1, p.r * 3) * 0.4;
          ctx.beginPath(); ctx.arc(cx + Math.cos(p.a) * p.r * R, cy + Math.sin(p.a) * p.r * R * 0.6, 1 + (1 - p.r) * 1.2, 0, 6.28); ctx.fill();
        }
      } },
    ondas: { name: 'Gotas y ondas', group: 'Agua', desc: 'Caen gotas al azar y abren ondas en la superficie; al mover el cursor también salen.',
      init: () => { const P = []; P.next = 0; return P; },
      draw(P, L, t) {
        if (t > P.next) { P.push({ x: rnd(0, L.W), y: rnd(0, L.H), t0: t }); P.next = t + rnd(700, 1800) / (L.sp * L.dn); }
        if (L.mx > 0 && L.mx < L.W && L.my > 0 && L.my < L.H && !(t - (P.lm || 0) < 350)) {
          if (P.px !== undefined && Math.hypot(L.mx - P.px, L.my - P.py) > 30) { P.push({ x: L.mx, y: L.my, t0: t }); P.lm = t; }
          P.px = L.mx; P.py = L.my;
        }
        const { ctx } = L; ctx.strokeStyle = L.c.b; ctx.lineWidth = 1.4;
        for (let i = P.length - 1; i >= 0; i--) {
          const w = P[i], age = (t - w.t0) / 2600 * L.sp;
          if (age > 1) { P.splice(i, 1); continue; }
          for (let k = 0; k < 2; k++) {
            const a = age - k * 0.15; if (a <= 0) continue;
            ctx.globalAlpha = (1 - a) * 0.5; ctx.beginPath(); ctx.ellipse(w.x, w.y, a * 90, a * 45, 0, 0, 6.28); ctx.stroke();
          }
        }
      } },
    lineas: { name: 'Líneas de marea', group: 'Agua', desc: 'Filas de puntos que ondulan en horizontal, como curvas de nivel del fondo marino.',
      init(L) {
        const P = [], rows = Math.max(5, Math.round(L.H / 70 * L.dn)), g = 10;
        for (let r = 0; r < rows; r++) for (let x = 0; x < L.W + g; x += g) P.push({ x, r, y0: (r + 0.5) * L.H / rows });
        return P;
      },
      draw(P, L, t) {
        const { ctx } = L; ctx.fillStyle = L.c.a; t *= 0.001 * L.sp;
        for (const p of P) {
          const y = p.y0 + Math.sin(p.x * 0.006 + t + p.r * 0.9) * 14 + Math.sin(p.x * 0.013 - t * 0.7 + p.r) * 6;
          const f = Math.max(0, 1 - Math.hypot(p.x - L.mx, y - L.my) / 120);
          ctx.globalAlpha = 0.2 + f * 0.5; ctx.beginPath(); ctx.arc(p.x, y - f * 10, 1.3 + f * 1.5, 0, 6.28); ctx.fill();
        }
      } },
    biolum: { name: 'Bioluminiscencia', group: 'Luz', desc: 'El cursor deja una estela de puntos que brillan y se apagan, como plancton luminoso. Sin cursor no hay nada.',
      init: () => [],
      draw(P, L) {
        const inside = L.mx > -30 && L.mx < L.W + 30 && L.my > -30 && L.my < L.H + 30;
        if (inside && (P.lx === undefined || Math.hypot(L.mx - P.lx, L.my - P.ly) > 4)) {
          for (let k = 0; k < 3 * L.dn; k++) P.push({ x: L.mx + rnd(-14, 14), y: L.my + rnd(-14, 14), vx: rnd(-0.3, 0.3), vy: rnd(-0.5, 0.1), life: 1 });
          P.lx = L.mx; P.ly = L.my;
        }
        const { ctx } = L; ctx.fillStyle = L.c.b;
        for (let i = P.length - 1; i >= 0; i--) {
          const p = P[i]; p.life -= 0.012 * L.sp;
          if (p.life <= 0) { P.splice(i, 1); continue; }
          p.x += p.vx; p.y += p.vy;
          ctx.globalAlpha = p.life * 0.8; ctx.beginPath(); ctx.arc(p.x, p.y, 1 + p.life * 2, 0, 6.28); ctx.fill();
        }
      } },
    constelacion: { name: 'Constelación', group: 'Luz', desc: 'Puntos que flotan lentos y se unen con líneas finas al acercarse entre sí y al cursor.',
      init: L => Array.from({ length: Math.min(110, many(L, 12000)) }, () => ({ x: rnd(0, L.W), y: rnd(0, L.H), vx: rnd(-0.25, 0.25), vy: rnd(-0.25, 0.25) })),
      draw(P, L) {
        const { ctx } = L; ctx.fillStyle = ctx.strokeStyle = L.c.a; ctx.lineWidth = 1;
        for (const p of P) { p.x += p.vx * L.sp; p.y += p.vy * L.sp; if (p.x < 0 || p.x > L.W) p.vx *= -1; if (p.y < 0 || p.y > L.H) p.vy *= -1; }
        const all = P.concat([{ x: L.mx, y: L.my }]);
        for (let i = 0; i < P.length; i++) for (let j = i + 1; j < all.length; j++) {
          const d = Math.hypot(P[i].x - all[j].x, P[i].y - all[j].y), R = j === P.length ? 160 : 120;
          if (d < R) { ctx.globalAlpha = (1 - d / R) * 0.35; ctx.beginPath(); ctx.moveTo(P[i].x, P[i].y); ctx.lineTo(all[j].x, all[j].y); ctx.stroke(); }
        }
        ctx.globalAlpha = 0.6;
        for (const p of P) { ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, 6.28); ctx.fill(); }
      } },
    rayos: { name: 'Rayos de sol', group: 'Luz', desc: 'Haces de luz suaves que entran desde arriba y se mecen, como bajo la superficie del mar.',
      init: L => Array.from({ length: Math.round(5 * L.dn) + 2 }, () => ({ x: rnd(0, 1), w: rnd(0.04, 0.12), ph: rnd(0, 6.28), s: rnd(0.3, 0.8) })),
      draw(P, L, t) {
        const { ctx } = L;
        for (const r of P) {
          const sway = Math.sin(t * 0.0003 * r.s * L.sp + r.ph), x = (r.x + sway * 0.05) * L.W, w = r.w * L.W;
          const g = ctx.createLinearGradient(0, 0, 0, L.H); g.addColorStop(0, L.c.b); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.globalAlpha = 0.07 + (Math.sin(t * 0.0005 * L.sp + r.ph) + 1) * 0.04;
          ctx.beginPath(); ctx.moveTo(x - w * 0.3, 0); ctx.lineTo(x + w * 0.3, 0); ctx.lineTo(x + w + sway * 60, L.H); ctx.lineTo(x - w + sway * 60, L.H); ctx.fill();
        }
      } },
  };

  /* ───────────── Secciones y capas ───────────── */
  const NAMES = { top: 'Inicio (hero)', proyecto: 'El proyecto', 'don-francisco': 'Don Francisco', conciencia: 'Conciencia Azul',
                  equivalencias: 'Equivalencias', impacto: 'Impacto', mapa: 'Mapa de puertos' };
  const sections = [...document.querySelectorAll('header#top, main section, body > div section, section, footer')]
    .filter((s, i, a) => a.indexOf(s) === i && !s.closest('[data-dz]') && s.offsetHeight > 60);
  const layers = sections.map((sec, i) => {
    const id = sec.id || (sec.tagName === 'FOOTER' ? 'pie' : 'sec' + i);
    const dark = /bg-simar-abismo/.test(sec.className) || getComputedStyle(sec).backgroundColor === 'rgb(11, 34, 54)';
    const cv = document.createElement('canvas');
    cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:-1';
    sec.style.isolation = 'isolate'; if (getComputedStyle(sec).position === 'static') sec.style.position = 'relative';
    sec.prepend(cv);
    const L = { id, name: NAMES[id] || (id === 'pie' ? 'Pie de página' : (sec.querySelector('h2,h3')?.textContent.trim().slice(0, 32) || 'Sección ' + (i + 1))), sec, cv, ctx: cv.getContext('2d'), c: dark ? DARK : LIGHT,
                visible: false, W: 0, H: 0, mx: -1e4, my: -1e4, sp: 1, dn: 1, key: 'ninguna', P: [] };
    new IntersectionObserver(([e]) => { L.visible = e.isIntersecting; }).observe(sec);
    new ResizeObserver(() => { size(L); L.P = SCENES[L.key].init(L); }).observe(sec);
    return L;
  });
  function size(L) {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    L.W = L.sec.clientWidth; L.H = L.sec.clientHeight;
    L.cv.width = L.W * dpr; L.cv.height = L.H * dpr; L.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function setScene(L, key) { L.key = SCENES[key] ? key : 'ninguna'; L.ctx.clearRect(0, 0, L.W, L.H); if (L.W) L.P = SCENES[L.key].init(L); }

  let speed = 1, density = 1;
  function frame(t) {
    for (const L of layers) {
      if (!L.visible || !L.W || L.key === 'ninguna') continue;
      L.ctx.clearRect(0, 0, L.W, L.H);
      const r = L.cv.getBoundingClientRect();
      L.mx = mouse.x - r.left; L.my = mouse.y - r.top; L.sp = speed;
      L.ctx.globalAlpha = 1;
      SCENES[L.key].draw(L.P, L, t);
    }
    requestAnimationFrame(frame);
  }
  addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  document.documentElement.addEventListener('pointerleave', () => { mouse.x = mouse.y = -1e4; });

  /* ───────────── Panel "Personalizar" ───────────── */
  const C = { bg: '#fff', fg: '#0B2236', mut: '#4A5A6A', bd: '#D6CEBD', pa: '#E9E4D9', ma: '#1B5FC9' };
  const groups = {};
  for (const [k, s] of Object.entries(SCENES)) (groups[s.group] ||= []).push(`<option value="${k}">${s.name}</option>`);
  const sceneOpts = Object.entries(groups).map(([g, o]) => (g ? `<optgroup label="${g}">${o.join('')}</optgroup>` : o.join(''))).join('');
  const sel = `min-height:42px;width:100%;border-radius:10px;border:1px solid ${C.bd};background:${C.pa};color:${C.fg};font:500 14px system-ui,sans-serif;padding:0 8px`;
  const btn = `${sel};background:${C.bg};cursor:pointer;font-weight:600`;
  const hint = t => `<span style="color:${C.mut};font-size:13px;line-height:1.4">${t}</span>`;
  const field = (label, id, o, h = '') => `<label style="display:grid;gap:6px"><span style="font-weight:600">${label}</span><select id="${id}" style="${sel}">${
    Object.entries(o).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select>${h ? hint(h) : ''}</label>`;
  const HERO_DESC = {
    original: 'Tal como está hoy.',
    grande: 'La foto crece y llega hasta el borde derecho de la pantalla. El texto y el logo se quedan igual de grandes.',
    ola: 'Como "más grande", pero el borde izquierdo de la foto tiene la forma de la ola del logo.',
    fondo: 'Las fotos ocupan todo el hero de fondo y se desvanecen hacia el texto, que queda sobre papel para leerse bien.',
    apiladas: 'La foto actual al frente y las dos siguientes asomando detrás, inclinadas, como tarjetas.',
  };

  const panel = document.createElement('aside');
  panel.dataset.dz = '';
  panel.style.cssText = `position:fixed;top:16px;right:16px;bottom:16px;z-index:9999;width:min(390px,calc(100vw - 32px));background:${C.bg};color:${C.fg};border:1px solid ${C.bd};border-radius:20px;box-shadow:0 16px 40px -16px rgba(11,34,54,.45);font:500 15px system-ui,sans-serif;display:flex;flex-direction:column;transition:transform .35s cubic-bezier(.2,.8,.2,1)`;
  panel.innerHTML = `
    <div style="display:flex;align-items:center;gap:8px;padding:14px 16px 10px">
      <strong style="font-size:17px;margin-right:auto">Personalizar</strong>
      <button id="dz-close" aria-label="Ocultar panel" style="width:36px;height:36px;border-radius:50%;border:1px solid ${C.bd};background:${C.bg};cursor:pointer;font-size:18px">×</button>
    </div>
    <div id="dz-tabs" role="tablist" style="display:flex;gap:6px;padding:0 16px 12px;border-bottom:1px solid ${C.bd}">
      <button data-tab="fondos">Fondos</button><button data-tab="trans">Transiciones</button><button data-tab="hero">Hero y fotos</button>
    </div>
    <div style="overflow:auto;padding:14px 16px">
      <div data-body="fondos" style="display:grid;gap:14px">
        <label style="display:grid;gap:6px"><span style="font-weight:600">Aplicar a todas las secciones</span>
          <select id="dz-all" style="${sel}"><option value="">— elegir —</option>${sceneOpts}</select></label>
        <div id="dz-desc" style="color:${C.mut};font-size:14px;line-height:1.45"></div>
        <label style="display:grid;gap:4px">Intensidad (cantidad) <input id="dz-dn" type="range" min="0.3" max="2" step="0.1"></label>
        <label style="display:grid;gap:4px">Velocidad <input id="dz-sp" type="range" min="0.3" max="2" step="0.1"></label>
        <div><div style="font-weight:700;margin-bottom:8px">Por sección</div><div id="dz-rows" style="display:grid;gap:10px"></div></div>
      </div>
      <div data-body="trans" style="display:grid;gap:14px">
        ${field('Bloques al hacer scroll', 'dz-rv', { subir: 'Subir (original)', fundido: 'Sólo fundido', zoom: 'Acercar', lateral: 'Desde el lado', desenfoque: 'Desenfoque', inclinar: 'Inclinación 3D', ninguna: 'Sin animación' }, 'Cómo aparecen tarjetas y textos al bajar por la página.')}
        ${field('Duración', 'dz-rvdur', { normal: 'Normal (original)', rapida: 'Rápida', lenta: 'Lenta' })}
        <label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="dz-stg"> Escalonar: las tarjetas de un grupo aparecen una tras otra</label>
        ${field('Cifras', 'dz-num', { contar: 'Contar desde 0 (original)', rodar: 'Dígitos que ruedan', aparecer: 'Aparecer con zoom', ninguna: 'Sin animación' })}
        ${field('Entrada del hero', 'dz-entra', { original: 'Original', lenta: 'Más lenta', zoom: 'Acercar', lado: 'Desde el lado', ninguna: 'Sin entrada' }, 'Título, texto, botones, curvas y foto al abrir la página.')}
        <button id="dz-replay" style="${btn}">Ver de nuevo desde arriba</button>
      </div>
      <div data-body="hero" style="display:grid;gap:14px">
        ${field('Diseño del carrusel', 'dz-hero', { original: 'Original', grande: 'Más grande, hasta el borde', ola: 'Ventana con forma de ola', fondo: 'Fotos de fondo completo', apiladas: 'Tarjetas apiladas' })}
        <div id="dz-herodesc" style="color:${C.mut};font-size:14px;line-height:1.45"></div>
        ${field('Cambio de foto', 'dz-car', { fundido: 'Fundido (original)', deslizar: 'Deslizar', cortina: 'Cortina', zoom: 'Zoom lento (Ken Burns)', desenfoque: 'Desenfoque', corte: 'Corte directo' })}
        ${field('Tiempo por foto', 'dz-seg', { 4: '4 segundos', 6: '6 segundos (original)', 9: '9 segundos' })}
        <button id="dz-top" style="${btn}">Ir al hero</button>
      </div>
      <button id="dz-reset" style="${btn};margin-top:16px">Restablecer todo</button>
    </div>`;
  const tab = document.createElement('button');
  tab.dataset.dz = ''; tab.textContent = 'Personalizar';
  tab.style.cssText = `position:fixed;right:16px;bottom:16px;z-index:9998;min-height:48px;padding:0 20px;border-radius:24px;border:0;background:${C.ma};color:#fff;font:700 16px system-ui,sans-serif;cursor:pointer;box-shadow:0 10px 24px -10px rgba(11,34,54,.5)`;
  document.body.append(panel, tab);
  const $ = s => panel.querySelector(s);
  const openPanel = on => { panel.style.transform = on ? '' : 'translateX(calc(100% + 32px))'; store.set('open', on); };
  $('#dz-close').onclick = () => openPanel(false);
  tab.onclick = () => openPanel(true);

  function showTab(name) {
    panel.querySelectorAll('[data-tab]').forEach(b => {
      const on = b.dataset.tab === name;
      b.style.cssText = `flex:1;min-height:40px;border-radius:12px;border:0;cursor:pointer;font:600 14px system-ui,sans-serif;background:${on ? C.ma : C.pa};color:${on ? '#fff' : C.fg}`;
      b.setAttribute('aria-selected', on);
    });
    panel.querySelectorAll('[data-body]').forEach(d => { d.style.display = d.dataset.body === name ? 'grid' : 'none'; });
    store.set('tab', name);
  }
  panel.querySelectorAll('[data-tab]').forEach(b => { b.onclick = () => showTab(b.dataset.tab); });

  const state = store.get('state2', null) || {};
  Object.assign(cfg, state.cfg || {});
  function save() {
    store.set('state2', { cfg, speed, density, scenes: Object.fromEntries(layers.map(L => [L.id, L.key])), hidden: layers.filter(L => L.sec.style.display === 'none').map(L => L.id) });
  }

  // Fondos por sección
  const rows = $('#dz-rows');
  for (const L of layers) {
    const row = document.createElement('div');
    row.style.cssText = `display:grid;grid-template-columns:1fr auto;gap:6px 10px;align-items:center;padding-bottom:10px;border-bottom:1px solid ${C.bd}`;
    row.innerHTML = `<span style="font-weight:600">${L.name}</span>
      <label style="display:flex;gap:6px;align-items:center;font-size:14px;color:${C.mut}"><input type="checkbox" checked> Mostrar</label>
      <select style="${sel};grid-column:1/-1">${sceneOpts}</select>`;
    L.check = row.querySelector('input'); L.select = row.querySelector('select');
    L.select.onchange = () => { setScene(L, L.select.value); $('#dz-desc').textContent = SCENES[L.select.value].desc || ''; save(); };
    L.check.onchange = () => {
      L.sec.style.display = L.check.checked ? '' : 'none';
      document.querySelectorAll(`a[href="#${L.id}"]`).forEach(a => { a.style.display = L.check.checked ? '' : 'none'; });
      save();
    };
    rows.append(row);
  }
  $('#dz-all').onchange = e => {
    const k = e.target.value; if (!k) return;
    layers.forEach(L => { L.select.value = k; setScene(L, k); });
    $('#dz-desc').textContent = SCENES[k].desc || ''; e.target.value = ''; save();
  };
  $('#dz-dn').oninput = e => { density = +e.target.value; layers.forEach(L => { L.dn = density; if (L.W) L.P = SCENES[L.key].init(L); }); save(); };
  $('#dz-sp').oninput = e => { speed = +e.target.value; save(); };

  // Transiciones y hero
  const bind = (id, key, after) => { const el = $(id); el.value = cfg[key]; el.onchange = () => { cfg[key] = el.type === 'checkbox' ? el.checked : el.value; applyCss(); after?.(); save(); }; };
  bind('#dz-rv', 'rv', reveals);
  bind('#dz-rvdur', 'rvDur', reveals);
  bind('#dz-num', 'num', counters);
  bind('#dz-entra', 'entra', replayEntrance);
  bind('#dz-car', 'car', car.refresh);
  bind('#dz-seg', 'seg', () => { cfg.seg = +cfg.seg; car.refresh(); });
  bind('#dz-hero', 'hero', () => { hero.dataset.hero = cfg.hero; $('#dz-herodesc').textContent = HERO_DESC[cfg.hero]; requestAnimationFrame(car.stack); });
  $('#dz-stg').checked = cfg.stagger;
  $('#dz-stg').onchange = e => { cfg.stagger = e.target.checked; reveals(); save(); };
  $('#dz-replay').onclick = () => { scrollTo({ top: 0 }); setTimeout(() => { replayEntrance(); reveals(); counters(); }, 60); };
  $('#dz-top').onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
  $('#dz-reset').onclick = () => { store.set('state2', null); location.reload(); };

  // Estado inicial: cardumen en el hero y todo como la landing original (o lo último elegido)
  speed = state.speed ?? 1; density = state.density ?? 1;
  $('#dz-sp').value = speed; $('#dz-dn').value = density;
  for (const L of layers) {
    L.dn = density;
    const k = state.scenes?.[L.id] ?? (L.id === 'top' ? 'cardumen' : 'ninguna');
    L.select.value = SCENES[k] ? k : 'ninguna'; setScene(L, L.select.value);
    if (state.hidden?.includes(L.id)) { L.check.checked = false; L.check.onchange(); }
  }
  hero.dataset.hero = cfg.hero;
  $('#dz-herodesc').textContent = HERO_DESC[cfg.hero];
  applyCss(); reveals(); counters(); car.refresh();
  showTab(store.get('tab', 'fondos'));
  openPanel(store.get('open', innerWidth > 900));
  requestAnimationFrame(frame);
})();
