import { S } from '../core/state.js';

/* =========================================================
   声音引擎 — 全部由代码实时合成,零音频文件
   雷声会写 S.flash(画面闪电)、浪涌会写 S.oceanPulse(月光变亮)
   ========================================================= */

let AC = null, master = null, NBUF = null;
let liveNodes = [];
let muted = false;

function noiseBuffer(sec = 4) {
  const len = AC.sampleRate * sec, buf = AC.createBuffer(1, len, AC.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}
function noiseSrc() {
  const s = AC.createBufferSource();
  s.buffer = NBUF; s.loop = true;
  return s;
}

/* ---------- 各种声音的合成器 ---------- */

/* 雨:白噪声 → 高通+低通,慢 LFO 制造疏密起伏 */
function makeRain(out) {
  const s = noiseSrc();
  const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 400;
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 6500;
  const g = AC.createGain(); g.gain.value = .5;
  const lfo = AC.createOscillator(), lg = AC.createGain();
  lfo.frequency.value = .07; lg.gain.value = .08;
  lfo.connect(lg); lg.connect(g.gain);
  s.connect(hp); hp.connect(lp); lp.connect(g); g.connect(out);
  s.start(); lfo.start();
  return [s, lfo];
}

/* 风:噪声 → 很低的低通,LFO 缓慢扫频 */
function makeWind(out) {
  const s = noiseSrc();
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 280; lp.Q.value = .8;
  const g = AC.createGain(); g.gain.value = .9;
  const lfo = AC.createOscillator(), lg = AC.createGain();
  lfo.frequency.value = .05; lg.gain.value = 140;
  lfo.connect(lg); lg.connect(lp.frequency);
  s.connect(lp); lp.connect(g); g.connect(out);
  s.start(); lfo.start();
  return [s, lfo];
}

/* 寒风:带通制造高频啸声 */
function makeHighWind(out) {
  const s = noiseSrc();
  const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 6;
  const g = AC.createGain(); g.gain.value = .35;
  const lfo = AC.createOscillator(), lg = AC.createGain();
  lfo.frequency.value = .11; lg.gain.value = 450;
  lfo.connect(lg); lg.connect(bp.frequency);
  s.connect(bp); bp.connect(g); g.connect(out);
  s.start(); lfo.start();
  return [s, lfo];
}

/* 雷:随机间隔的低频轰鸣,同步触发画面闪电 */
function makeThunderBed(out) {
  let stopped = false, timer;
  function boom() {
    if (stopped || !AC) return;
    const t = AC.currentTime, s = noiseSrc();
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass';
    lp.frequency.setValueAtTime(90, t);
    lp.frequency.exponentialRampToValueAtTime(45, t + 4);
    const g = AC.createGain();
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(1.1, t + .25);
    g.gain.exponentialRampToValueAtTime(.0001, t + 5.5);
    s.connect(lp); lp.connect(g); g.connect(out);
    s.start(t); s.stop(t + 6);
    S.flash = 1;
    schedule();
  }
  function schedule() { timer = setTimeout(boom, 9000 + Math.random() * 17000); }
  schedule();
  return [{ stop() { stopped = true; clearTimeout(timer); } }];
}

/* 火:低频轰 + 随机带通脉冲的噼啪声 */
function makeFire(out) {
  const s = noiseSrc();
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 170;
  const g = AC.createGain(); g.gain.value = .85;
  s.connect(lp); lp.connect(g); g.connect(out); s.start();
  let stopped = false, timer;
  function crackle() {
    if (stopped || !AC) return;
    const t = AC.currentTime, n = noiseSrc();
    const bp = AC.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = 1600 + Math.random() * 2600; bp.Q.value = 9;
    const cg = AC.createGain();
    cg.gain.setValueAtTime(.5 + Math.random() * .6, t);
    cg.gain.exponentialRampToValueAtTime(.0001, t + .05 + Math.random() * .07);
    n.connect(bp); bp.connect(cg); cg.connect(out);
    n.start(t); n.stop(t + .2);
    timer = setTimeout(crackle, 60 + Math.random() * 450);
  }
  crackle();
  return [s, { stop() { stopped = true; clearTimeout(timer); } }];
}

/* 蟋蟀:成组的高频短啁啾 */
function makeCrickets(out) {
  let stopped = false, timer;
  function chirp() {
    if (stopped || !AC) return;
    const t = AC.currentTime, n = 3 + ((Math.random() * 3) | 0);
    for (let i = 0; i < n; i++) {
      const o = AC.createOscillator(); o.type = 'sine';
      o.frequency.value = 4200 + Math.random() * 300;
      const g = AC.createGain(); const st = t + i * .06;
      g.gain.setValueAtTime(0, st);
      g.gain.linearRampToValueAtTime(.06, st + .01);
      g.gain.linearRampToValueAtTime(0, st + .045);
      o.connect(g); g.connect(out); o.start(st); o.stop(st + .06);
    }
    timer = setTimeout(chirp, 700 + Math.random() * 2400);
  }
  chirp();
  return [{ stop() { stopped = true; clearTimeout(timer); } }];
}

/* 风铃:基频 + 非整数倍泛音,长衰减 */
function makeBells(out) {
  let stopped = false, timer;
  function ring() {
    if (stopped || !AC) return;
    const t = AC.currentTime;
    const f = [830, 1245, 1660][(Math.random() * 3) | 0] * (Math.random() < .5 ? 1 : 1.5);
    const o = AC.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const o2 = AC.createOscillator(); o2.type = 'sine'; o2.frequency.value = f * 2.76;
    const g = AC.createGain(), g2 = AC.createGain();
    g.gain.setValueAtTime(.12, t); g.gain.exponentialRampToValueAtTime(.0001, t + 3.5);
    g2.gain.setValueAtTime(.03, t); g2.gain.exponentialRampToValueAtTime(.0001, t + 2);
    o.connect(g); o2.connect(g2); g.connect(out); g2.connect(out);
    o.start(t); o.stop(t + 4); o2.start(t); o2.stop(t + 2.5);
    timer = setTimeout(ring, 5000 + Math.random() * 12000);
  }
  timer = setTimeout(ring, 3000);
  return [{ stop() { stopped = true; clearTimeout(timer); } }];
}

/* 海浪:低频涌浪床 + 周期性拍岸(扫频包络),拍岸时写 S.oceanPulse */
function makeOcean(out) {
  const s = noiseSrc();
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
  const g = AC.createGain(); g.gain.value = .4;
  const lfo = AC.createOscillator(), lg = AC.createGain();
  lfo.frequency.value = .06; lg.gain.value = .16;
  lfo.connect(lg); lg.connect(g.gain);
  s.connect(lp); lp.connect(g); g.connect(out);
  s.start(); lfo.start();
  let stopped = false, timer;
  function crash() {
    if (stopped || !AC) return;
    const t = AC.currentTime, n = noiseSrc();
    const bp = AC.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.setValueAtTime(350, t);
    bp.frequency.exponentialRampToValueAtTime(900, t + 1.6);
    bp.frequency.exponentialRampToValueAtTime(250, t + 5);
    bp.Q.value = .9;
    const cg = AC.createGain();
    cg.gain.setValueAtTime(.0001, t);
    cg.gain.exponentialRampToValueAtTime(.7, t + 1.8);
    cg.gain.exponentialRampToValueAtTime(.0001, t + 6);
    n.connect(bp); bp.connect(cg); cg.connect(out);
    n.start(t); n.stop(t + 6.2);
    S.oceanPulse = 1;
    timer = setTimeout(crash, 6000 + Math.random() * 5000);
  }
  timer = setTimeout(crash, 1500);
  return [s, lfo, { stop() { stopped = true; clearTimeout(timer); } }];
}

/* ---------- 每个场景的音轨配置 ---------- */
const trackDefs = {
  rain:  [{ n: '雨', v: .7, make: makeRain }, { n: '雷', v: .5, make: makeThunderBed }, { n: '风', v: .25, make: makeWind }],
  snow:  [{ n: '风', v: .6, make: makeWind }, { n: '寒风', v: .35, make: makeHighWind }, { n: '铃', v: .15, make: makeBells }],
  fire:  [{ n: '火', v: .7, make: makeFire }, { n: '风', v: .15, make: makeWind }, { n: '蟋蟀', v: .25, make: makeCrickets }],
  ocean: [{ n: '浪', v: .75, make: makeOcean }, { n: '风', v: .3, make: makeWind }],
  stars: [{ n: '蟋蟀', v: .4, make: makeCrickets }, { n: '风', v: .35, make: makeWind }, { n: '铃', v: .12, make: makeBells }],
};

function stopAllAudio() {
  liveNodes.forEach(n => { try { n.stop(); } catch (e) { /* 已停止的节点会抛错,忽略 */ } });
  liveNodes = [];
}

/* 为指定场景构建音轨,并生成混音面板的滑杆 UI */
export function buildAudio(key) {
  if (!AC) return;
  stopAllAudio();
  const tracksEl = document.getElementById('tracks');
  tracksEl.innerHTML = '';
  trackDefs[key].forEach(def => {
    const g = AC.createGain();
    g.gain.value = 0;
    g.gain.setTargetAtTime(def.v, AC.currentTime, 2.2);  // 2 秒淡入
    g.connect(master);
    liveNodes.push(...def.make(g), g);

    const row = document.createElement('div'); row.className = 'track';
    const lab = document.createElement('label'); lab.textContent = def.n;
    const sl = document.createElement('input');
    sl.type = 'range'; sl.min = 0; sl.max = 100; sl.value = def.v * 100;
    sl.style.setProperty('--fill', def.v * 100 + '%');
    sl.addEventListener('input', () => {
      sl.style.setProperty('--fill', sl.value + '%');
      g.gain.setTargetAtTime(sl.value / 100, AC.currentTime, .15);
    });
    row.append(lab, sl); tracksEl.append(row);
  });
}

/* 必须由用户手势(点击"进入")触发,浏览器才允许出声 */
export function initAudio(sceneKey) {
  if (AC) return;
  AC = new (window.AudioContext || window.webkitAudioContext)();
  NBUF = noiseBuffer();
  master = AC.createGain(); master.gain.value = .9;
  const comp = AC.createDynamicsCompressor();
  master.connect(comp); comp.connect(AC.destination);
  buildAudio(sceneKey);
}

export function toggleMute() {
  muted = !muted;
  if (AC) master.gain.setTargetAtTime(muted ? 0 : .9, AC.currentTime, .4);
  return muted;
}
