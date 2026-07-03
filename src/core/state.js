/* =========================================================
   共享状态
   所有模块都从这里读写"全局"数据,避免互相直接依赖。
   S.flash      — 雷声触发的闪电亮度(音频模块写,雨夜场景读)
   S.oceanPulse — 浪涌拍岸的脉冲(音频模块写,月海场景读)
   S.fireBoost  — 点击让炉火变旺(主循环写,壁炉场景读)
   ========================================================= */
export const S = {
  cx: null,   // Canvas 2D 上下文,由 main.js 初始化
  W: 0,
  H: 0,
  mouse: { x: 0, y: 0, sx: 0, sy: 0 },  // sx/sy 是平滑跟随值
  flash: 0,
  oceanPulse: 0,
  fireBoost: 0,
  reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
};
