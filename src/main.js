import './style.css';
import { S } from './core/state.js';
import { initAudio, buildAudio, toggleMute } from './audio/engine.js';
import rain from './scenes/rain.js';
import snow from './scenes/snow.js';
import fire from './scenes/fire.js';
import ocean from './scenes/ocean.js';
import stars, { spawnMeteor } from './scenes/stars.js';

/* =========================================================
   主入口:画布尺寸、主循环、场景切换、UI 绑定
   ========================================================= */

const scenes = { rain, snow, fire, ocean, stars };
let sceneKey = 'rain';
let sceneT = 0;
let fade = 1, fadeTarget = 1;
const ripples = [];

/* ---------- 画布 ---------- */
const cv = document.getElementById('world');
S.cx = cv.getContext('2d');

let grainCv = null;
function buildGrain() {
  grainCv = document.createElement('canvas');
  grainCv.width = grainCv.height = 160;
  const g = grainCv.getContext('2d');
  const img = g.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.random() * 255 | 0;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 18;
  }
  g.putImageData(img, 0, 0);
}
function drawGrain() {
  const cx = S.cx;
  cx.save();
  cx.globalAlpha = .55;
  cx.translate((Math.random() * 160) | 0, (Math.random() * 160) | 0);
  cx.fillStyle = cx.createPattern(grainCv, 'repeat');
  cx.fillRect(-160, -160, S.W + 320, S.H + 320);
  cx.restore();
}

function resize() {
  const DPR = Math.min(devicePixelRatio || 1, 2);
  S.W = innerWidth; S.H = innerHeight;
  cv.width = S.W * DPR; cv.height = S.H * DPR;
  S.cx.setTransform(DPR, 0, 0, DPR, 0, 0);
  buildGrain();
  scenes[sceneKey].onResize?.();
}
addEventListener('resize', resize);

/* ---------- 输入 ---------- */
addEventListener('pointermove', e => {
  S.mouse.x = e.clientX; S.mouse.y = e.clientY;
  wake();
});
addEventListener('pointerdown', e => {
  ripples.push({ x: e.clientX, y: e.clientY, r: 0, a: .4 });
  if (sceneKey === 'fire') S.fireBoost = 1;
  if (sceneKey === 'stars') spawnMeteor();
  wake();
});

/* 几秒不动就隐藏 UI,只留环境 */
let idleTimer;
function wake() {
  document.body.classList.remove('idle');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => document.body.classList.add('idle'), 6000);
}

/* ---------- 场景切换(黑场淡入淡出) ---------- */
function switchScene(key) {
  if (key === sceneKey && fadeTarget === 1) return;
  fadeTarget = 0;
  document.querySelectorAll('.scene-btn').forEach(b =>
    b.classList.toggle('on', b.dataset.scene === key));
  setTimeout(() => {
    sceneKey = key; sceneT = 0;
    scenes[key].init();
    document.getElementById('scene-name').textContent = scenes[key].name;
    buildAudio(key);
    fadeTarget = 1;
  }, 1300);
}

/* ---------- 涟漪 ---------- */
function drawRipples() {
  const cx = S.cx;
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.r += 1.4; r.a -= .007;
    if (r.a <= 0) { ripples.splice(i, 1); continue; }
    cx.strokeStyle = `rgba(220,230,245,${r.a})`;
    cx.lineWidth = 1;
    cx.beginPath(); cx.arc(r.x, r.y, r.r, 0, 7); cx.stroke();
  }
}

/* ---------- 主循环 ---------- */
let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, .05); last = now;
  sceneT += dt;
  fade += (fadeTarget - fade) * dt * 1.6;
  /* 鼠标平滑跟随,所有视差用平滑值,消除生硬感 */
  S.mouse.sx += (S.mouse.x - S.mouse.sx) * dt * 3;
  S.mouse.sy += (S.mouse.y - S.mouse.sy) * dt * 3;
  const mx = S.mouse.sx / S.W - .5, my = S.mouse.sy / S.H - .5;

  scenes[sceneKey].draw(sceneT, mx, my);
  drawRipples();

  const cx = S.cx;
  if (fade < .995) {
    cx.fillStyle = `rgba(3,5,9,${1 - fade})`;
    cx.fillRect(0, 0, S.W, S.H);
  }
  /* 柔和暗角 */
  const v = cx.createRadialGradient(S.W / 2, S.H * .46, Math.min(S.W, S.H) * .5, S.W / 2, S.H * .5, Math.max(S.W, S.H) * .85);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.36)');
  cx.fillStyle = v; cx.fillRect(0, 0, S.W, S.H);
  /* 胶片颗粒 */
  if (!S.reduced) drawGrain();

  requestAnimationFrame(loop);
}

/* ---------- UI 绑定 ---------- */
document.querySelectorAll('.scene-btn').forEach(b => {
  b.addEventListener('click', () => switchScene(b.dataset.scene));
});
const mixer = document.getElementById('mixer');
document.getElementById('mixBtn').addEventListener('click', e => {
  mixer.classList.toggle('open');
  e.currentTarget.classList.toggle('on', mixer.classList.contains('open'));
});
const muteBtn = document.getElementById('muteBtn');
muteBtn.addEventListener('click', () => {
  const muted = toggleMute();
  document.getElementById('volOn').style.display = muted ? 'none' : '';
  document.getElementById('volOff').style.display = muted ? '' : 'none';
  muteBtn.classList.toggle('on', !muted);
});
document.getElementById('enter').addEventListener('click', () => {
  document.getElementById('veil').classList.add('gone');
  document.body.classList.add('awake');
  initAudio(sceneKey);   // 音频必须由用户手势触发
  document.getElementById('scene-name').textContent = scenes[sceneKey].name;
  document.querySelector('.scene-btn[data-scene=rain]').classList.add('on');
  const hint = document.getElementById('hint');
  hint.classList.add('show');
  setTimeout(() => hint.classList.remove('show'), 6000);
  wake();
});

/* ---------- 启动 ---------- */
S.mouse.x = S.mouse.sx = innerWidth / 2;
S.mouse.y = S.mouse.sy = innerHeight / 2;
resize();
scenes[sceneKey].init();
requestAnimationFrame(loop);
