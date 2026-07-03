import { S } from '../core/state.js';
import { R } from '../core/utils.js';
import { initStars, drawStars, initClouds, drawClouds, drawMoon, initTerrain, drawTerrain } from './elements.js';

let flakes = [];
function initSnow(n) {
  flakes = [];
  for (let i = 0; i < n; i++) flakes.push({
    x: Math.random() * S.W, y: Math.random() * S.H, r: R(.8, 3),
    v: R(.4, 1.4), p: R(0, 7), sw: R(.3, 1.2), o: R(.3, .9),
  });
}
function drawSnow(t, mx) {
  const cx = S.cx;
  cx.fillStyle = '#e8eef8';
  for (const f of flakes) {
    cx.globalAlpha = f.o;
    cx.beginPath(); cx.arc(f.x, f.y, f.r, 0, 7); cx.fill();
    f.y += f.v;
    f.x += Math.sin(t * f.sw + f.p) * .5 + mx * .8;
    /* 鼠标轻推附近的雪花 */
    const dx = f.x - S.mouse.sx, dy = f.y - S.mouse.sy, dd = dx * dx + dy * dy;
    if (dd < 5200) { f.x += dx * .012; f.y += dy * .012; }
    if (f.y > S.H + 6) { f.y = -8; f.x = Math.random() * S.W; }
    if (f.x > S.W + 8) f.x = -8;
    if (f.x < -8) f.x = S.W + 8;
  }
  cx.globalAlpha = 1;
}

export default {
  name: '雪 · 夜',
  init() {
    initStars(110); initClouds(5); initTerrain();
    initSnow(S.reduced ? 60 : 160);
  },
  draw(t, mx, my) {
    const cx = S.cx;
    const g = cx.createLinearGradient(0, 0, 0, S.H);
    g.addColorStop(0, '#0b1220'); g.addColorStop(.7, '#131c2e'); g.addColorStop(1, '#1a2438');
    cx.fillStyle = g; cx.fillRect(0, 0, S.W, S.H);
    drawStars(.7, t);
    drawMoon(t, mx, my, .85);
    drawClouds('118,133,163');
    /* 雪地 */
    const sg = cx.createLinearGradient(0, S.H * .8, 0, S.H);
    sg.addColorStop(0, '#232f47'); sg.addColorStop(1, '#31405c');
    cx.fillStyle = sg;
    cx.beginPath(); cx.moveTo(0, S.H * .86);
    cx.quadraticCurveTo(S.W * .3, S.H * .8, S.W * .55, S.H * .85);
    cx.quadraticCurveTo(S.W * .8, S.H * .9, S.W, S.H * .84);
    cx.lineTo(S.W, S.H); cx.lineTo(0, S.H); cx.closePath(); cx.fill();
    drawTerrain(t, mx, '#101a2c', '#0a1322');
    drawSnow(t, mx);
  },
};
