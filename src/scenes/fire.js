import { S } from '../core/state.js';
import { R, n1, n2 } from '../core/utils.js';
import { SPR, blit } from '../core/sprites.js';

/* =========================================================
   炉火 — 粒子精灵方案
   每个粒子的生命周期:白黄核心 → 橙焰 → 暗红 → 化烟
   横向摇曳由多层噪声驱动,避免钟摆式的机械感
   ========================================================= */

let fparts = [], embers = [], smoke = [];

function spawnFlame(fx, fy, boost) {
  const spread = 52;
  const x = fx + R(-spread, spread);
  const centered = 1 - Math.abs(x - fx) / spread;   // 越靠中心火越旺
  fparts.push({
    x, y: fy + R(-6, 8),
    vy: -(R(.8, 1.9) + centered * 1.1) * boost,
    vx: R(-.22, .22),
    r: R(9, 20) + centered * 13,
    life: 0,
    speed: R(.008, .014),
    p: R(0, 7), amp: R(.3, 1),
    c: centered,
  });
}

export default {
  name: '炉 · 火',
  init() { fparts = []; embers = []; smoke = []; },
  draw(t) {
    const cx = S.cx;
    const fx = S.W / 2, fy = S.H * .78;
    S.fireBoost = Math.max(0, S.fireBoost - .006);
    const boost = 1 + S.fireBoost * .4;
    /* 光照:噪声呼吸 + 快速微闪 */
    const flick = (.82 + .13 * n1(t * 3.1) + .05 * n2(t * 11)) * boost;

    /* 房间底色 */
    let g = cx.createLinearGradient(0, 0, 0, S.H);
    g.addColorStop(0, '#080504'); g.addColorStop(1, '#120a05');
    cx.fillStyle = g; cx.fillRect(0, 0, S.W, S.H);

    /* 大范围火光 */
    cx.save(); cx.globalCompositeOperation = 'lighter';
    blit(SPR.glowA, fx, fy - 30, S.W * .55, .30 * flick);
    blit(SPR.glowA, fx, fy - 10, S.W * .24, .34 * flick);
    cx.restore();

    /* 地面反光 */
    g = cx.createLinearGradient(0, fy, 0, S.H);
    g.addColorStop(0, `rgba(255,145,60,${.13 * flick})`);
    g.addColorStop(1, 'rgba(255,145,60,0)');
    cx.fillStyle = g; cx.fillRect(0, fy, S.W, S.H - fy);

    /* 柴堆:深色圆木 + 受火面的炽热边缘 */
    function log(x, y, len, th, rot, heat) {
      cx.save(); cx.translate(x, y); cx.rotate(rot);
      const lg = cx.createLinearGradient(0, -th / 2, 0, th / 2);
      lg.addColorStop(0, '#241309'); lg.addColorStop(1, '#0d0703');
      cx.fillStyle = lg;
      cx.beginPath();
      cx.roundRect(-len / 2, -th / 2, len, th, th / 2);
      cx.fill();
      cx.globalCompositeOperation = 'lighter';
      const hg = cx.createLinearGradient(-len / 2, 0, len / 2, 0);
      hg.addColorStop(0, 'rgba(255,90,20,0)');
      hg.addColorStop(.5, `rgba(255,120,40,${heat * flick})`);
      hg.addColorStop(1, 'rgba(255,90,20,0)');
      cx.fillStyle = hg;
      cx.beginPath();
      cx.roundRect(-len / 2, -th / 2, len, th * .45, th / 4);
      cx.fill();
      cx.restore();
    }
    log(fx - 16, fy + 16, 150, 20, .10, .35);
    log(fx + 14, fy + 20, 140, 18, -.14, .3);
    log(fx, fy + 7, 120, 16, .03, .55);

    /* 余烬床 */
    cx.save(); cx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) {
      const ex = fx + Math.sin(i * 2.1) * 40, ey = fy + 10 + Math.cos(i * 1.7) * 6;
      const pulse = .35 + .3 * Math.sin(t * 1.8 + i * 2.4) + .1 * n2(t * 5 + i);
      blit(SPR.deep, ex, ey, 13 + i % 3 * 4, Math.max(0, pulse) * flick);
    }
    cx.restore();

    /* 火焰粒子 */
    const rate = S.reduced ? 2 : 4;
    for (let i = 0; i < rate * boost; i++) spawnFlame(fx, fy, boost);
    cx.save(); cx.globalCompositeOperation = 'lighter';
    for (let i = fparts.length - 1; i >= 0; i--) {
      const p = fparts[i];
      p.life += p.speed;
      if (p.life >= 1) { fparts.splice(i, 1); continue; }
      const l = p.life;
      p.x += p.vx + n1(t * 2.6 + p.p) * .5 * l * p.amp + Math.sin(t * 4 + p.p) * .3 * l;
      p.y += p.vy * (1 + l * .7);
      const r = p.r * (1 - l * .55);
      if (l < .22)  blit(SPR.core,  p.x, p.y, r,       (1 - l / .22) * .75 * (.6 + p.c * .4));
      if (l < .6)   blit(SPR.flame, p.x, p.y, r * 1.5, (1 - l / .6) * .6);
      if (l >= .25) blit(SPR.deep,  p.x, p.y, r * 1.9, (1 - l) * .45);
      if (l > .78 && Math.random() < .05 && smoke.length < 40)
        smoke.push({ x: p.x, y: p.y, r: r * 1.4, a: .14, vy: -.4, p: R(0, 7) });
    }
    /* 火星:亮点 + 微拖尾 */
    if (Math.random() < .5 * boost) embers.push({
      x: fx + R(-38, 38), y: fy - R(0, 36),
      vx: R(-.3, .3), vy: R(-2.2, -.9), a: R(.6, 1), r: R(.7, 1.8), p: R(0, 7),
    });
    for (let i = embers.length - 1; i >= 0; i--) {
      const e = embers[i];
      e.x += e.vx + n2(t * 3 + e.p) * .6;
      e.y += e.vy; e.vy *= .995; e.a -= .005;
      if (e.a <= 0) { embers.splice(i, 1); continue; }
      cx.globalAlpha = e.a;
      cx.fillStyle = `rgba(255,${150 + ((Math.sin(e.p) * .5 + .5) * 70) | 0},60,1)`;
      cx.beginPath(); cx.arc(e.x, e.y, e.r, 0, 7); cx.fill();
      cx.globalAlpha = e.a * .3;
      cx.beginPath(); cx.arc(e.x - e.vx * 2, e.y - e.vy * 2, e.r * .7, 0, 7); cx.fill();
    }
    cx.restore();

    /* 烟(普通混合,很淡) */
    for (let i = smoke.length - 1; i >= 0; i--) {
      const s = smoke[i];
      s.y += s.vy; s.x += n1(t + s.p) * .5; s.r += .25; s.a -= .0012;
      if (s.a <= 0) { smoke.splice(i, 1); continue; }
      blit(SPR.smoke, s.x, s.y, s.r, s.a / .28);
    }
    cx.globalAlpha = 1;
  },
};
