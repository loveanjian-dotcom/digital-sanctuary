import { S } from './state.js';

/* 预渲染一张径向渐变的发光贴图。
   之后每帧用 drawImage 贴出去,比实时创建渐变快一个数量级 */
function makeSprite(stops, size = 96) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([p, col]) => grad.addColorStop(p, col));
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

export const SPR = {
  core:  makeSprite([[0, 'rgba(255,245,200,1)'], [.25, 'rgba(255,220,130,.85)'], [1, 'rgba(255,180,60,0)']]),
  flame: makeSprite([[0, 'rgba(255,170,70,.9)'], [.4, 'rgba(255,110,35,.5)'], [1, 'rgba(220,70,20,0)']]),
  deep:  makeSprite([[0, 'rgba(255,90,30,.65)'], [.5, 'rgba(190,45,15,.3)'], [1, 'rgba(130,25,10,0)']]),
  smoke: makeSprite([[0, 'rgba(46,40,36,.28)'], [1, 'rgba(46,40,36,0)']]),
  glowW: makeSprite([[0, 'rgba(225,235,250,.9)'], [.5, 'rgba(200,215,240,.25)'], [1, 'rgba(200,215,240,0)']]),
  glowA: makeSprite([[0, 'rgba(255,190,110,.9)'], [.5, 'rgba(255,160,80,.25)'], [1, 'rgba(255,160,80,0)']]),
};

/* 以 (x,y) 为中心、半径 r、透明度 a 贴一张精灵 */
export function blit(sp, x, y, r, a) {
  S.cx.globalAlpha = a;
  S.cx.drawImage(sp, x - r, y - r, r * 2, r * 2);
}
