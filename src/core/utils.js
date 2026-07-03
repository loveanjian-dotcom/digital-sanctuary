/* 区间随机数 */
export const R = (a, b) => a + Math.random() * (b - a);

/* 多层正弦叠加的平滑噪声(约 -1..1)
   用于火焰摇曳、光照呼吸、树的摆动 —— 比单一 sin 自然得多 */
export function n1(t) {
  return (Math.sin(t * 1.7) + Math.sin(t * 2.93 + 1.3) * 0.62 +
          Math.sin(t * 4.71 + 2.1) * 0.38 + Math.sin(t * 0.53 + 4)) / 2.6;
}
export function n2(t) {
  return (Math.sin(t * 1.13 + 0.7) + Math.sin(t * 3.71 + 2.9) * 0.55 +
          Math.sin(t * 0.31 + 1)) / 2.1;
}
