import { S } from '../core/state.js';
import { R, n1 } from '../core/utils.js';
import { SPR, blit } from '../core/sprites.js';
import { initStars, drawStars } from './elements.js';

/* =========================================================
   星河 — 预渲染的银河带 + 流星 + 山谷里的帐篷暖光
   点击画面可以召唤一颗流星(main.js 调用 spawnMeteor)
   ========================================================= */

let mwCv = null, meteors = [], ridge2 = [];

export function buildMilkyWay() {
  if (!S.W) return;
  mwCv = document.createElement('canvas');
  mwCv.width = S.W; mwCv.height = S.H;
  const g = mwCv.getContext('2d');
  const cxm = S.W * .5, cym = S.H * .42, ang = -.5;
  g.save(); g.translate(cxm, cym); g.rotate(ang);
  /* 星云辉光 */
  for (let i = 0; i < 26; i++) {
    const x = R(-S.W * .72, S.W * .72), y = R(-S.H * .075, S.H * .075) * (1 - Math.abs(x) / (S.W * .8) * .4);
    const r = R(60, 190);
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    const hue = Math.random() < .3 ? '170,160,200' : '150,170,205';
    grad.addColorStop(0, `rgba(${hue},${R(.02, .05)})`);
    grad.addColorStop(1, `rgba(${hue},0)`);
    g.fillStyle = grad;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  /* 尘埃暗带 */
  for (let i = 0; i < 9; i++) {
    const x = R(-S.W * .6, S.W * .6), y = R(-S.H * .03, S.H * .03);
    const r = R(40, 110);
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, 'rgba(4,6,12,.24)');
    grad.addColorStop(1, 'rgba(4,6,12,0)');
    g.fillStyle = grad;
    g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
  }
  /* 1400 颗密集微星,正态分布贴近银河中线 */
  for (let i = 0; i < 1400; i++) {
    const x = R(-S.W * .75, S.W * .75);
    const y = (Math.random() + Math.random() + Math.random() - 1.5) / 1.5 * S.H * .09;
    g.globalAlpha = R(.1, .6);
    g.fillStyle = Math.random() < .12 ? '#f5e8d8' : '#dbe6f5';
    g.fillRect(x, y, Math.random() < .85 ? 1 : 1.6, Math.random() < .85 ? 1 : 1.6);
  }
  g.restore();
  ridge2 = [];
  for (let i = 0; i <= 28; i++)
    ridge2.push(.72 + Math.sin(i * 1.3) * .05 + Math.sin(i * .47 + 1) * .09 + Math.random() * .012);
}

export function spawnMeteor() {
  if (meteors.length > 3) return;
  meteors.push({
    x: R(S.W * .15, S.W * .85), y: R(S.H * .06, S.H * .3),
    vx: R(6, 10) * (Math.random() < .5 ? 1 : -1), vy: R(2.5, 4.5),
    life: 1, trail: R(.7, 1),
  });
}

export default {
  name: '星 · 河',
  init() {
    initStars(230, .72);
    meteors = [];
    if (!mwCv) buildMilkyWay();
  },
  onResize() { buildMilkyWay(); },
  draw(t, mx, my) {
    const cx = S.cx;
    let g = cx.createLinearGradient(0, 0, 0, S.H);
    g.addColorStop(0, '#04060e'); g.addColorStop(.6, '#0a1020'); g.addColorStop(1, '#0d1526');
    cx.fillStyle = g; cx.fillRect(0, 0, S.W, S.H);

    /* 银河(缓慢呼吸 + 视差) */
    cx.save();
    cx.globalAlpha = .75 + .15 * n1(t * .3);
    cx.translate(mx * 8, my * 5);
    cx.drawImage(mwCv, 0, 0, S.W, S.H);
    cx.restore();

    drawStars(.9, t);

    /* 流星 */
    if (Math.random() < .0022 && !S.reduced) spawnMeteor();
    for (let i = meteors.length - 1; i >= 0; i--) {
      const m = meteors[i];
      m.x += m.vx; m.y += m.vy; m.life -= .016;
      if (m.life <= 0 || m.x < -60 || m.x > S.W + 60) { meteors.splice(i, 1); continue; }
      const tl = 48 * m.trail;
      const grad = cx.createLinearGradient(m.x, m.y, m.x - m.vx * tl / 6, m.y - m.vy * tl / 6);
      grad.addColorStop(0, `rgba(240,246,255,${.9 * m.life})`);
      grad.addColorStop(1, 'rgba(240,246,255,0)');
      cx.strokeStyle = grad; cx.lineWidth = 1.6;
      cx.beginPath();
      cx.moveTo(m.x, m.y);
      cx.lineTo(m.x - m.vx * tl / 6, m.y - m.vy * tl / 6);
      cx.stroke();
      cx.save(); cx.globalCompositeOperation = 'lighter';
      blit(SPR.glowW, m.x, m.y, 7, .7 * m.life);
      cx.restore();
    }

    /* 山谷剪影 */
    cx.fillStyle = '#050910';
    cx.beginPath(); cx.moveTo(0, S.H);
    ridge2.forEach((r, i) => cx.lineTo(i / (ridge2.length - 1) * S.W, r * S.H));
    cx.lineTo(S.W, S.H); cx.closePath(); cx.fill();

    /* 帐篷:山谷里唯一的暖光 */
    const tx = S.W * .3, ty = S.H * .9;
    const warm = .75 + .2 * n1(t * 2.2);
    cx.save(); cx.globalCompositeOperation = 'lighter';
    blit(SPR.glowA, tx, ty - 8, 60, .3 * warm);
    cx.restore();
    cx.fillStyle = '#0a0d13';
    cx.beginPath();
    cx.moveTo(tx - 34, ty); cx.lineTo(tx, ty - 30); cx.lineTo(tx + 34, ty);
    cx.closePath(); cx.fill();
    const dg = cx.createLinearGradient(tx, ty - 22, tx, ty);
    dg.addColorStop(0, `rgba(255,190,110,${.75 * warm})`);
    dg.addColorStop(1, `rgba(255,150,70,${.5 * warm})`);
    cx.fillStyle = dg;
    cx.beginPath();
    cx.moveTo(tx - 9, ty); cx.lineTo(tx, ty - 21); cx.lineTo(tx + 9, ty);
    cx.closePath(); cx.fill();
  },
};
