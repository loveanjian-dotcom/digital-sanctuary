import { S } from '../core/state.js';
import { getRenderer } from '../gl/renderer.js';
import { OCEAN_FRAG } from '../gl/ocean.frag.js';
import ocean2d from './ocean2d.js';

/* =========================================================
   月 · 海(WebGL 版)
   波浪、月光、星云全部由 GPU 逐像素实时计算。
   任何一步失败(老设备不支持 WebGL / shader 编译失败)
   都自动回退到 2D 版本,保证永远不白屏。
   ========================================================= */

let prog = null;
let glOK = true;

export default {
  name: '月 · 海',
  gl: true,
  init() {
    if (!glOK) return ocean2d.init();
    try {
      const r = getRenderer();
      if (!prog) prog = r.program(OCEAN_FRAG);
    } catch (e) {
      console.warn('WebGL 初始化失败,月海回退到 2D:', e.message);
      glOK = false;
      this.gl = false;
      return ocean2d.init();
    }
  },
  draw(t, mx, my) {
    if (!glOK) return ocean2d.draw(t, mx, my);
    getRenderer().render(prog, {
      uTime: t,
      uPar: [mx, my],
      uPulse: S.oceanPulse,
      uQ: S.density < .7 ? 0 : 1,
    });
    S.oceanPulse = Math.max(0, S.oceanPulse - .004);
  },
};
