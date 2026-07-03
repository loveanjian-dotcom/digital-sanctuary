import { S } from '../core/state.js';
import { R, n1 } from '../core/utils.js';
import { SPR, blit } from '../core/sprites.js';
import { initStars, drawStars, initClouds, drawClouds, drawMoon } from './elements.js';

/* =========================================================
   月海 — 月光在水面碎成一条光路
   离地平线越远(越近岸),碎光散得越开、闪得越碎
   浪涌拍岸的声音(S.oceanPulse)会让月光路变亮、泡沫线上推
   ========================================================= */

let swells = [], glints = [];

export default {
  name: '月 · 海',
  init() {
    initStars(90, .5); initClouds(4);
    swells = [];
    for (let i = 0; i < 5; i++) swells.push({ y: Math.random(), v: R(.0004, .0009), a: R(.05, .12) });
    glints = [];
    for (let i = 0; i < 70; i++) glints.push({
      d: Math.random(),   // 0=地平线 1=岸边
      p: R(0, 7), s: R(.5, 2), o: R(.2, .8), w: R(.3, 1),
    });
  },
  draw(t, mx, my) {
    const cx = S.cx;
    const horizon = S.H * .52;
    /* 天空 */
    let g = cx.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, '#060b16'); g.addColorStop(1, '#101c30');
    cx.fillStyle = g; cx.fillRect(0, 0, S.W, horizon + 1);
    drawStars(.75, t);
    const moon = drawMoon(t, mx, my, .95, .62, .22);
    drawClouds('90,105,135');

    /* 海面 */
    g = cx.createLinearGradient(0, horizon, 0, S.H);
    g.addColorStop(0, '#0d1626'); g.addColorStop(.5, '#0a111d'); g.addColorStop(1, '#070b13');
    cx.fillStyle = g; cx.fillRect(0, horizon, S.W, S.H - horizon);
    /* 地平线微光 */
    g = cx.createLinearGradient(0, horizon - 2, 0, horizon + 26);
    g.addColorStop(0, 'rgba(150,175,210,.25)'); g.addColorStop(1, 'rgba(150,175,210,0)');
    cx.fillStyle = g; cx.fillRect(0, horizon - 2, S.W, 28);

    S.oceanPulse = Math.max(0, S.oceanPulse - .004);

    /* 月光路 */
    cx.save(); cx.globalCompositeOperation = 'lighter';
    for (const gl of glints) {
      const y = horizon + gl.d * (S.H - horizon) * .96;
      const spread = (6 + gl.d * 90) * (1 + S.oceanPulse * .25);
      const x = moon.x + n1(t * gl.s + gl.p) * spread + Math.sin(t * .7 + gl.p * 2) * spread * .3;
      const tw = Math.max(0, .35 + .65 * Math.sin(t * (1 + gl.s) + gl.p * 3));
      const len = (2 + gl.d * 16) * gl.w;
      const a = gl.o * tw * (.9 - gl.d * .35) * (1 + S.oceanPulse * .4);
      cx.globalAlpha = Math.min(1, a);
      cx.fillStyle = '#cfe0f5';
      cx.beginPath();
      cx.ellipse(x, y, len, Math.max(.6, len * .14), 0, 0, 7);
      cx.fill();
    }
    blit(SPR.glowW, moon.x, horizon + 10, 110, .16);
    cx.restore();

    /* 涌浪:横向微光带缓缓推近 */
    for (const s of swells) {
      s.y += s.v;
      if (s.y > 1) s.y = 0;
      const wy = horizon + s.y * (S.H - horizon);
      const persp = .3 + s.y * .7;
      g = cx.createLinearGradient(0, wy - 8 * persp, 0, wy + 8 * persp);
      g.addColorStop(0, 'rgba(160,185,220,0)');
      g.addColorStop(.5, `rgba(160,185,220,${s.a * persp})`);
      g.addColorStop(1, 'rgba(160,185,220,0)');
      cx.fillStyle = g;
      cx.beginPath();
      cx.moveTo(0, wy);
      for (let x = 0; x <= S.W; x += 40)
        cx.lineTo(x, wy + Math.sin(x * .008 + t * .8 + s.y * 20) * 5 * persp);
      cx.lineTo(S.W, wy + 16 * persp); cx.lineTo(0, wy + 16 * persp);
      cx.closePath(); cx.fill();
    }

    /* 岸边泡沫线 */
    const foamY = S.H * .965 + Math.sin(t * .45) * 7 + S.oceanPulse * (-9);
    cx.strokeStyle = `rgba(210,225,245,${.22 + S.oceanPulse * .3})`;
    cx.lineWidth = 1.6;
    cx.beginPath();
    for (let x = 0; x <= S.W; x += 22)
      cx.lineTo(x, foamY + Math.sin(x * .02 + t * .9) * 4 + Math.sin(x * .006 - t * .5) * 7);
    cx.stroke();
    g = cx.createLinearGradient(0, foamY, 0, S.H);
    g.addColorStop(0, `rgba(190,210,235,${.07 + S.oceanPulse * .1})`);
    g.addColorStop(1, 'rgba(190,210,235,0)');
    cx.fillStyle = g; cx.fillRect(0, foamY, S.W, S.H - foamY);
  },
};
