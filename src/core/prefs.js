/* =========================================================
   偏好记忆 — 用浏览器的 localStorage 记住:
   上次的场景、每个场景的混音音量
   数据只存在用户自己的浏览器里,没有服务器
   ========================================================= */
const KEY = 'qi:prefs';

export function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
  catch { return {}; }
}

export function updatePref(fn) {
  const p = loadPrefs();
  fn(p);
  try { localStorage.setItem(KEY, JSON.stringify(p)); }
  catch { /* 隐私模式下可能失败,静默忽略 */ }
}
