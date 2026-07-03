import { S } from '../core/state.js';
import { n1 } from '../core/utils.js';
import { initStars, drawStars, initClouds, drawClouds, drawMoon, initTerrain, drawTerrain, initFlies, drawFlies } from './elements.js';

/* ---------- 雨(三层景深) ---------- */
let drops = [], splashes = [];
function initRain(n) {
  drops = [];
  for (let i = 0; i < n; i++) {
    const z = Math.random();
    drops.push({
      x: Math.random() * S.W, y: Math.random() * S.H, z,
      l: 8 + z * 18, v: 6 + z * 12, o: .08 + z * .32,
    });
  }
}
function drawRain(windX) {
  const cx = S.cx;
  cx.strokeStyle = 'rgba(190,205,228,1)';
  for (const d of drops) {
    cx.lineWidth = .6 + d.z * .8;
    cx.globalAlpha = d.o;
    cx.beginPath();
    cx.moveTo(d.x, d.y);
    cx.lineTo(d.x + windX * d.v * .14, d.y + d.l);
    cx.stroke();
    d.x += windX * d.v * .14; d.y += d.v;
    if (d.y > S.H * .97) {
      if (d.z > .6 && Math.random() < .3) splashes.push({ x: d.x, y: S.H * .97, r: 1, a: .28 });
      d.y = -20; d.x = Math.random() * S.W;
    }
  }
  cx.globalAlpha = 1;
  for (let i = splashes.length - 1; i >= 0; i--) {
    const s = splashes[i];
    s.r += .7; s.a -= .02;
    if (s.a <= 0) { splashes.splice(i, 1); continue; }
    cx.strokeStyle = `rgba(190,205,228,${s.a})`;
    cx.lineWidth = 1;
    cx.beginPath(); cx.ellipse(s.x, s.y, s.r, s.r * .32, 0, 0, 7); cx.stroke();
  }
}

export default {
  name: '雨 · 夜',
  init() {
    initStars(60); initClouds(7); initTerrain();
    initRain(S.reduced ? 70 : Math.round(190 * S.density)); initFlies(7);
  },
  draw(t, mx, my) {
    const cx = S.cx;
    const fa = S.flash * .5;
    const g = cx.createLinearGradient(0, 0, 0, S.H);
    g.addColorStop(0, `rgb(${9 + fa * 90 | 0},${13 + fa * 95 | 0},${24 + fa * 110 | 0})`);
    g.addColorStop(1, `rgb(${5 + fa * 60 | 0},${8 + fa * 70 | 0},${14 + fa * 80 | 0})`);
    cx.fillStyle = g; cx.fillRect(0, 0, S.W, S.H);
    drawStars(.22 + fa, t);
    drawMoon(t, mx, my, .45 + fa * .5);
    drawClouds('58,70,94');
    drawTerrain(t, mx, '#070b13', '#04070d');
    drawFlies(t);
    drawRain(1.5 + mx * 1.2 + n1(t * .6) * .8);
    /* 闪电衰减 + 随机抖动(模拟连续闪) */
    S.flash = Math.max(0, S.flash - .03);
    if (S.flash > 0 && Math.random() < .12) S.flash = Math.min(1, S.flash + .4);
  },
};
