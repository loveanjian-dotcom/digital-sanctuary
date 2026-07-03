import { S } from '../core/state.js';

/* =========================================================
   WebGL 渲染器(极简)
   原理:画一个覆盖全屏的三角形,片元着色器(fragment shader)
   对屏幕上每个像素并行计算颜色 —— 光照、波浪、天空全在里面。
   这个模块是通用的:未来的炉火、雨夜 shader 场景都复用它。
   ========================================================= */

let R = null;

const VS = 'attribute vec2 aP;void main(){gl_Position=vec4(aP,0.0,1.0);}';

/* 窗口尺寸变化时由 main.js 调用;渲染器还没创建时什么都不做 */
export function glResize() { if (R) R.resize(); }

export function getRenderer() {
  if (R) return R;
  const canvas = document.getElementById('glworld');
  const gl = canvas.getContext('webgl', {
    alpha: false, antialias: false, depth: false, stencil: false,
    powerPreference: 'high-performance',
  });
  if (!gl) throw new Error('WebGL 不可用');

  function compile(type, src) {
    const sh = gl.createShader(type);
    gl.shaderSource(sh, src); gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(sh));
    return sh;
  }
  const vsh = compile(gl.VERTEX_SHADER, VS);

  /* 一个大三角形盖住整个屏幕(比两个三角形拼矩形更高效) */
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  R = {
    canvas,
    resize() {
      /* 渲染分辨率:手机限制在 1.25 倍,桌面 1.6 倍 —— 控制发热与帧率 */
      const dpr = Math.min(devicePixelRatio || 1, S.W < 800 ? 1.25 : 1.6);
      canvas.width = Math.round(S.W * dpr);
      canvas.height = Math.round(S.H * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    program(fragSrc) {
      const prog = gl.createProgram();
      gl.attachShader(prog, vsh);
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSrc));
      gl.bindAttribLocation(prog, 0, 'aP');
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(prog));
      return { prog, locs: {} };  // locs 缓存 uniform 位置,避免每帧查询
    },
    render(p, uniforms) {
      gl.useProgram(p.prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      const loc = name => (name in p.locs)
        ? p.locs[name]
        : (p.locs[name] = gl.getUniformLocation(p.prog, name));
      gl.uniform2f(loc('uRes'), canvas.width, canvas.height);
      for (const k in uniforms) {
        const v = uniforms[k];
        if (typeof v === 'number') gl.uniform1f(loc(k), v);
        else if (v.length === 2) gl.uniform2f(loc(k), v[0], v[1]);
        else if (v.length === 3) gl.uniform3f(loc(k), v[0], v[1], v[2]);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
  R.resize();
  return R;
}
