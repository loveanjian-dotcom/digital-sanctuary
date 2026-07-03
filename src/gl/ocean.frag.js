/* =========================================================
   月 · 海 — 片元着色器
   GPU 对每个像素每帧执行一次这段程序。
   没有任何贴图和视频:波浪是分形噪声高度场,
   月光路是波面法线对月亮的镜面反射,雾、星、云全是数学。

   可调参数速查(迭代时找这些数字):
   - MOON 向量        → 月亮方位(x 左右 / y 高度)
   - waveH 里的 0.55  → 波浪流动速度
   - amp 的 0.55      → 浪高
   - pow(sd,900.)     → 月光路的锐利程度(越大越细窄)
   - exp(-dist*0.006) → 雾浓度
   ========================================================= */
export const OCEAN_FRAG = `
precision highp float;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uPar;    /* 视差(鼠标/陀螺仪) -0.5..0.5 */
uniform float uPulse;  /* 浪涌拍岸的音频脉冲 0..1 */
uniform float uQ;      /* 画质 0 低 / 1 高 */

const vec3 MOON = normalize(vec3(-0.34, 0.30, 0.89));

float hash21(vec2 p){
  p = fract(p*vec2(234.34, 435.345));
  p += dot(p, p+34.23);
  return fract(p.x*p.y);
}
float vnoise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  float a=hash21(i), b=hash21(i+vec2(1,0)), c=hash21(i+vec2(0,1)), d=hash21(i+vec2(1,1));
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

/* ---- 海面高度场:两组反向流动的分形噪声叠加 ---- */
float waveH(vec2 p, float oct){
  float t=uTime*0.55;
  float h=0.0, a=1.0, f=0.16;
  for(int i=0;i<5;i++){
    if(float(i)>=oct) break;
    h += a*vnoise(p*f + vec2(t*1.1, t*0.4));
    h += a*0.65*vnoise(vec2(p.y,p.x)*f*1.7 - vec2(t*0.7, t*1.2));
    a*=0.42; f*=2.15; t*=1.12;
  }
  return h;
}

/* ---- 天空:渐变 + 星 + 月(圆盘/辉光)+ 薄云 ---- */
vec3 sky(vec3 rd, float withStars){
  float up=clamp(rd.y,0.0,1.0);
  vec3 col = mix(vec3(0.085,0.115,0.185), vec3(0.012,0.022,0.05), pow(up,0.55));
  /* 星:网格哈希撒点 + 各自的闪烁相位 */
  if(withStars>0.5 && rd.y>0.02){
    vec2 sp=vec2(atan(rd.x,rd.z)*2.2, rd.y*3.4);
    vec2 g=sp*26.0;
    vec2 id=floor(g);
    vec2 f=fract(g)-0.5;
    vec2 off=(vec2(hash21(id),hash21(id+7.7))-0.5)*0.8;
    float d=length(f-off);
    float tw=0.55+0.45*sin(uTime*(0.6+hash21(id*1.3)*1.8)+hash21(id)*6.283);
    float s=smoothstep(0.07,0.0,d)*step(0.82,hash21(id*2.17))*tw;
    col += vec3(0.85,0.9,1.0)*s*0.5*smoothstep(0.02,0.15,rd.y);
  }
  /* 月:实心圆盘 + 窄辉光 + 宽辉光 */
  float mdot=dot(rd,MOON);
  float ang=acos(clamp(mdot,-1.0,1.0));
  float disc=smoothstep(0.032,0.028,ang);
  float halo=pow(max(mdot,0.0),260.0)*0.9 + pow(max(mdot,0.0),18.0)*0.16;
  col += vec3(0.92,0.96,1.05)*disc;
  col += vec3(0.55,0.66,0.85)*halo;
  /* 薄云:两层噪声,被月光照亮(低画质跳过) */
  if(uQ>0.5 && rd.y>0.01){
    vec2 cuv=rd.xz/(rd.y+0.12);
    float cl=vnoise(cuv*0.7+vec2(uTime*0.008,0.0));
    cl+=0.5*vnoise(cuv*1.6-vec2(uTime*0.012,0.0));
    cl=smoothstep(0.75,1.25,cl);
    float lit=pow(max(mdot,0.0),6.0);
    col=mix(col, vec3(0.10,0.13,0.20)+vec3(0.35,0.38,0.45)*lit,
            cl*0.55*smoothstep(0.0,0.12,rd.y));
  }
  return col;
}

void main(){
  vec2 uv=(gl_FragCoord.xy*2.0-uRes)/uRes.y;

  /* 相机:视差驱动的轻微转头 */
  float yaw=uPar.x*0.22, pitch=-0.035+uPar.y*0.10;
  vec3 rd=normalize(vec3(uv.x, uv.y, 1.35));
  float cp=cos(pitch), sp2=sin(pitch);
  rd=vec3(rd.x, rd.y*cp-rd.z*sp2, rd.y*sp2+rd.z*cp);
  float cy=cos(yaw), sy=sin(yaw);
  rd=vec3(rd.x*cy+rd.z*sy, rd.y, -rd.x*sy+rd.z*cy);

  vec3 col;
  if(rd.y>=0.0015){
    /* ---------- 天空 ---------- */
    col=sky(rd,1.0);
  }else{
    /* ---------- 海面:视线与水平面求交 ---------- */
    float camH=2.1;
    float dist=min(camH/(-rd.y), 900.0);
    vec2 p=rd.xz*dist;
    float oct=uQ>0.5?5.0:3.0;
    float amp=0.55+uPulse*0.22;          /* 浪涌拍岸时浪更"起" */

    /* 法线:中心差分;采样间距随距离加大(天然抗闪烁) */
    float e=0.35+dist*0.012;
    float hC=waveH(p,oct);
    float hX=waveH(p+vec2(e,0.0),oct);
    float hZ=waveH(p+vec2(0.0,e),oct);
    vec3 n=normalize(vec3((hC-hX)*amp, e*0.9, (hC-hZ)*amp));
    /* 远处海面趋于平静 */
    n=normalize(mix(n, vec3(0.0,1.0,0.0), clamp(dist*0.004,0.0,0.92)));

    /* 菲涅尔:视角越平,反射越强(真实水面的核心特征) */
    vec3 refl=reflect(rd,n);
    refl.y=abs(refl.y);
    vec3 skyR=sky(refl,0.0);
    float fres=0.04+0.96*pow(1.0-max(dot(-rd,n),0.0),5.0);

    vec3 deep=vec3(0.012,0.022,0.045);            /* 深水本色 */
    float crest=smoothstep(1.15,1.75,hC);
    vec3 water=deep+vec3(0.020,0.045,0.075)*crest; /* 浪峰的一点透光 */
    col=mix(water, skyR, fres);

    /* 月光镜面:锐高光(碎银)+ 宽高光(柔光带)→ 月光路 */
    float sd=max(dot(refl,MOON),0.0);
    float glint=1.0+uPulse*0.8;
    col+=vec3(0.75,0.82,0.95)*(pow(sd,900.0)*1.4+pow(sd,90.0)*0.22)*glint;

    /* 距离雾:海面融进地平线 */
    vec3 hz=sky(normalize(vec3(rd.x,0.003,rd.z)),0.0);
    col=mix(col,hz,1.0-exp(-dist*0.006));
  }

  /* 地平线的一线微光 */
  col+=vec3(0.10,0.13,0.19)*exp(-abs(rd.y)*90.0)*0.5;

  /* 色调映射:压高光、微提对比,消除"数字感" */
  col=col/(1.0+col*0.6);
  col=pow(col,vec3(0.92));

  gl_FragColor=vec4(col,1.0);
}
`;
