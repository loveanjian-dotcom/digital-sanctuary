import { S } from '../core/state.js';
import { R, n1 } from '../core/utils.js';
import { SPR, blit } from '../core/sprites.js';

/* ---------- 星星 ---------- */
let stars = [];
export function initStars(n, maxY = .62) {
  stars = [];
  for (let i = 0; i < n; i++) stars.push({
    x: Math.random(), y: Math.random() * maxY,
    r: R(.4, 1.5), p: R(0, 7), s: R(.15, .6),
  });
}
export function drawStars(alpha, t) {
  const cx = S.cx;
  cx.save();
  cx.fillStyle = '#dce6f5';
  for (const s of stars) {
    cx.globalAlpha = alpha * (.5 + .5 * Math.sin(t * s.s + s.p));
    cx.beginPath(); cx.arc(s.x * S.W, s.y * S.H, s.r, 0, 7); cx.fill();
  }
  cx.restore();
}

/* ---------- 云 ---------- */
let clouds = [];
export function initClouds(n) {
  clouds = [];
  for (let i = 0; i < n; i++) clouds.push({
    x: Math.random() * 1.4 - .2, y: R(.05, .4), w: R(.28, .55), h: R(.05, .11),
    v: R(.0000135, .000032), a: R(.12, .26),
  });
}
export function drawClouds(tint) {
  const cx = S.cx;
  for (const c of clouds) {
    c.x += c.v * 16;
    if (c.x > 1.25) c.x = -.45;
    const gx = c.x * S.W, gy = c.y * S.H, gw = c.w * S.W, gh = c.h * S.H;
    const g = cx.createRadialGradient(gx, gy, 0, gx, gy, gw);
    g.addColorStop(0, `rgba(${tint},${c.a})`);
    g.addColorStop(1, `rgba(${tint},0)`);
    cx.fillStyle = g;
    cx.save(); cx.translate(gx, gy); cx.scale(1, gh / gw); cx.translate(-gx, -gy);
    cx.beginPath(); cx.arc(gx, gy, gw, 0, 7); cx.fill(); cx.restore();
  }
}

/* ---------- 月亮(呼吸光晕 + 月海纹理) ---------- */
export function drawMoon(t, mx, my, base, px = .72, py = .2) {
  const cx = S.cx;
  const bx = S.W * px + mx * 14, by = S.H * py + my * 8;
  const breath = 1 + .05 * n1(t * .4);
  blit(SPR.glowW, bx, by, S.W * .2 * breath, .5 * base);
  blit(SPR.glowW, bx, by, 70, .75 * base);
  cx.globalAlpha = base;
  const g = cx.createRadialGradient(bx - 8, by - 8, 4, bx, by, 30);
  g.addColorStop(0, '#f4f7fc');
  g.addColorStop(.75, '#dde7f4');
  g.addColorStop(1, '#c9d6e8');
  cx.fillStyle = g;
  cx.beginPath(); cx.arc(bx, by, 29, 0, 7); cx.fill();
  cx.globalAlpha = base * .12;
  cx.fillStyle = '#9fb0c8';
  cx.beginPath(); cx.arc(bx - 9, by + 3, 7, 0, 7); cx.fill();
  cx.beginPath(); cx.arc(bx + 7, by - 9, 5, 0, 7); cx.fill();
  cx.beginPath(); cx.arc(bx + 4, by + 11, 4, 0, 7); cx.fill();
  cx.globalAlpha = 1;
  return { x: bx, y: by };
}

/* ---------- 山脊与树的剪影 ---------- */
let ridge = [], trees = [];
export function initTerrain() {
  ridge = [];
  for (let i = 0; i <= 24; i++)
    ridge.push(.68 + Math.sin(i * 1.7) * .05 + Math.sin(i * .6 + 2) * .07 + Math.random() * .015);
  trees = [];
  for (let i = 0; i < 26; i++)
    trees.push({ x: Math.random(), h: R(.06, .16), w: R(.012, .03), sway: R(0, 7) });
}
export function drawTerrain(t, mx, col1, col2) {
  const cx = S.cx;
  cx.fillStyle = col1;
  cx.beginPath(); cx.moveTo(0, S.H);
  ridge.forEach((r, i) => cx.lineTo(i / (ridge.length - 1) * S.W, r * S.H));
  cx.lineTo(S.W, S.H); cx.closePath(); cx.fill();
  cx.fillStyle = col2;
  for (const tr of trees) {
    const baseY = S.H * .995;
    const sway = n1(t * .5 + tr.sway) * 3 + mx * 5;
    const tx = tr.x * S.W, th = tr.h * S.H, tw = tr.w * S.W;
    cx.beginPath();
    cx.moveTo(tx - tw, baseY);
    cx.quadraticCurveTo(tx + sway * .3, baseY - th * .5, tx + sway, baseY - th);
    cx.quadraticCurveTo(tx + sway * .3 + tw * .2, baseY - th * .5, tx + tw, baseY);
    cx.closePath(); cx.fill();
  }
}

/* ---------- 萤火虫 ---------- */
let flies = [];
export function initFlies(n) {
  flies = [];
  for (let i = 0; i < n; i++) flies.push({
    x: Math.random() * S.W, y: R(S.H * .55, S.H * .92),
    p: R(0, 7), s: R(.3, .8), a: R(.2, .55),
  });
}
export function drawFlies(t) {
  const cx = S.cx;
  for (const f of flies) {
    f.x += Math.sin(t * f.s + f.p) * .4;
    f.y += Math.cos(t * f.s * .7 + f.p) * .3;
    const glow = .4 + .6 * Math.sin(t * 1.2 + f.p * 3);
    if (glow <= 0) continue;
    const g = cx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 9);
    g.addColorStop(0, `rgba(212,232,168,${f.a * glow})`);
    g.addColorStop(1, 'rgba(212,232,168,0)');
    cx.fillStyle = g;
    cx.beginPath(); cx.arc(f.x, f.y, 9, 0, 7); cx.fill();
  }
}
