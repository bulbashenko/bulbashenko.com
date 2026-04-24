"use client";

import { useEffect, useRef } from "react";

const COLS = 70, ROWS = 92;
const CW = 6, CH = 8;
const TW = COLS * CW;
const TH = ROWS * CH;

const HEAVY = "@#%&8BXxOo0Ii!;:()[]{}|=+*^~<>,.";
const LIGHT  = ".,;:!|Ii";

const H_Q = 36, V_Q = 10;
const N_BKT = H_Q * V_Q;

// ── WORKER ─────────────────────────────────────────────────────
// Worker only does ray-march math → sends Float32Array of brightness.
// Main thread interpolates per-cell (smooth) → renders tile at 30fps.
const WORKER_SRC = `
'use strict';

const COLS=70,ROWS=92;
const CAM_Z=3.4,FOV=1.18,MAX_STEPS=26,MAX_DIST=12,SURF_DIST=0.014;
const SCALE=0.76,CAM_Y_OFFSET=0.28;

const HUE_NOISE=new Float32Array(COLS*ROWS);
const CHAR_SEED=new Float32Array(COLS*ROWS);
for(let i=0;i<COLS*ROWS;i++){HUE_NOISE[i]=Math.random();CHAR_SEED[i]=Math.random();}

const len3=(x,y,z)=>Math.sqrt(x*x+y*y+z*z);
const smin=(a,b,k)=>{const h=Math.max(0,Math.min(1,.5+.5*(b-a)/k));return a*h+b*(1-h)-k*h*(1-h);};
const smax=(a,b,k)=>{const h=Math.max(0,Math.min(1,.5+.5*(a-b)/k));return a*h+b*(1-h)+k*h*(1-h);};
function sdE(x,y,z,rx,ry,rz){const k0=len3(x/rx,y/ry,z/rz),k1=len3(x/(rx*rx),y/(ry*ry),z/(rz*rz));return k0*(k0-1)/(k1+1e-4);}
function sdC(px,py,pz,ax,ay,az,bx,by,bz,r){const abx=bx-ax,aby=by-ay,abz=bz-az,apx=px-ax,apy=py-ay,apz=pz-az;const t=Math.max(0,Math.min(1,(apx*abx+apy*aby+apz*abz)/(abx*abx+aby*aby+abz*abz)));return len3(apx-abx*t,apy-aby*t,apz-abz*t)-r;}
function sdS(x,y,z,r){return len3(x,y,z)-r;}

function davidSDF(px,py,pz){
  let d=sdE(px,py,pz,0.525,0.730,0.505);
  d=smin(d,sdE(px,py-0.35,pz+0.09,0.41,0.30,0.44),0.14);
  d=smin(d,sdE(px,py-0.08,pz-0.22,0.40,0.38,0.28),0.10);
  d=smin(d,sdC(px,py,pz,0,0.16,-0.455,0,-0.09,-0.535,0.074),0.045);
  d=smin(d,sdS(px,py+0.115,pz+0.565,0.080),0.036);
  d=smin(d,sdE(px+0.098,py+0.125,pz+0.540,0.060,0.046,0.054),0.028);
  d=smin(d,sdE(px-0.098,py+0.125,pz+0.540,0.060,0.046,0.054),0.028);
  d=smin(d,sdE(px,py+0.165,pz+0.548,0.105,0.036,0.056),0.024);
  d=smin(d,sdC(px,py,pz,-0.325,0.225,-0.445,-0.062,0.285,-0.505,0.055),0.030);
  d=smin(d,sdC(px,py,pz,0.325,0.225,-0.445,0.062,0.285,-0.505,0.055),0.030);
  d=smin(d,sdE(px,py-0.215,pz+0.478,0.075,0.048,0.062),0.026);
  d=smin(d,sdE(px+0.390,py+0.055,pz+0.340,0.130,0.100,0.100),0.065);
  d=smin(d,sdE(px-0.390,py+0.055,pz+0.340,0.130,0.100,0.100),0.065);
  d=smin(d,sdE(px,py+0.640,pz+0.260,0.162,0.122,0.142),0.056);
  d=smin(d,sdE(px,py+0.445,pz+0.155,0.415,0.205,0.305),0.056);
  d=smin(d,sdE(px,py+0.345,pz+0.484,0.132,0.050,0.082),0.022);
  d=smin(d,sdE(px+0.068,py+0.325,pz+0.492,0.054,0.038,0.060),0.019);
  d=smin(d,sdE(px-0.068,py+0.325,pz+0.492,0.054,0.038,0.060),0.019);
  d=smin(d,sdE(px,py+0.440,pz+0.475,0.118,0.042,0.070),0.017);
  d=smin(d,sdS(px+0.122,py+0.382,pz+0.462,0.028),0.020);
  d=smin(d,sdS(px-0.122,py+0.382,pz+0.462,0.028),0.020);
  const eyeL=sdE(px+0.198,py-0.178,pz+0.452,0.118,0.084,0.108);
  const eyeR=sdE(px-0.198,py-0.178,pz+0.452,0.118,0.084,0.108);
  d=smax(d,-eyeL+0.008,0.020);d=smax(d,-eyeR+0.008,0.020);
  d=smin(d,sdE(px+0.548,py+0.042,pz+0.055,0.050,0.128,0.062),0.042);
  d=smin(d,sdE(px-0.548,py+0.042,pz+0.055,0.050,0.128,0.062),0.042);
  if(py>0.285||(Math.abs(px)>0.365&&py>-0.12)||(pz<-0.08&&py>-0.08)){
    const w1=Math.sin(px*7.5+0.8)*Math.sin(py*6.5+1.2)*Math.sin(pz*8.0+0.6);
    const w2=0.55*Math.sin(px*15.0+2.1)*Math.sin(py*13.5+0.5)*Math.sin(pz*14.5+1.7);
    const w3=0.28*Math.sin(px*25.0+1.3)*Math.sin(py*22.0+2.8)*Math.sin(pz*23.0+0.9);
    d+=0.034*(w1+w2+w3);
  }
  d=smin(d,sdC(px,py,pz,0,-0.695,0.01,0,-1.260,0.02,0.192),0.080);
  d=smin(d,sdC(px,py,pz,0.125,-0.595,-0.14,0.230,-1.115,-0.09,0.056),0.042);
  d=smin(d,sdC(px,py,pz,-0.125,-0.595,-0.14,-0.230,-1.115,-0.09,0.056),0.042);
  d=smin(d,sdE(px,py+1.345,pz+0.075,0.840,0.435,0.655),0.100);
  d=smin(d,sdC(px,py,pz,0.085,-1.090,-0.215,0.660,-1.195,-0.175,0.060),0.058);
  d=smin(d,sdC(px,py,pz,-0.085,-1.090,-0.215,-0.660,-1.195,-0.175,0.060),0.058);
  return d;
}

function davidNormal(px,py,pz){
  const e=0.007;
  const k0=davidSDF(px+e,py-e,pz-e),k1=davidSDF(px-e,py-e,pz+e);
  const k2=davidSDF(px-e,py+e,pz-e),k3=davidSDF(px+e,py+e,pz+e);
  const nx=k0-k1-k2+k3,ny=-k0-k1+k2+k3,nz=-k0+k1-k2+k3;
  const l=len3(nx,ny,nz)||1;
  return [nx/l,ny/l,nz/l];
}

const valBuf=new Float32Array(COLS*ROWS);
let rotAngle=0;

function march(){
  const rotC=Math.cos(rotAngle),rotS=Math.sin(rotAngle);
  const asp=COLS/ROWS;
  for(let row=0;row<ROWS;row++){
    for(let col=0;col<COLS;col++){
      const u=(col/COLS-0.5)*asp*FOV;
      const v=-(row/ROWS-0.5)*FOV;
      const rl=Math.sqrt(u*u+v*v+1);
      const rdx=u/rl,rdy=v/rl,rdz=-1/rl;
      let t=0.1,hit=false,hx=0,hy=0,hz=0;
      for(let s=0;s<MAX_STEPS;s++){
        const wx=rdx*t,wy=rdy*t-CAM_Y_OFFSET,wz=CAM_Z+rdz*t;
        const rx=(wx*rotC+wz*rotS)*SCALE;
        const ry=wy*SCALE;
        const rz=(-wx*rotS+wz*rotC)*SCALE;
        const d=davidSDF(rx,ry,rz)*SCALE;
        if(d<SURF_DIST){hit=true;hx=rx;hy=ry;hz=rz;break;}
        t+=d;if(t>MAX_DIST)break;
      }
      const i=row*COLS+col;
      if(hit){
        const [nx,ny,nz]=davidNormal(hx,hy,hz);
        const L1=Math.max(0,0.32*nx+0.58*ny+0.75*nz);
        const L2=Math.max(0,-0.85*nx+0.05*ny+0.22*nz);
        const L3=Math.max(0,0.00*nx+0.95*ny-0.15*nz);
        valBuf[i]=Math.min(1,0.14+L1*0.58+L2*0.15+L3*0.10);
      } else { valBuf[i]=0; }
    }
  }
}

self.postMessage({type:'init',hueBuf:HUE_NOISE,charBuf:CHAR_SEED});

setInterval(()=>{
  rotAngle+=0.7;
  march();
  const copy=new Float32Array(valBuf);
  self.postMessage({type:'frame',valBuf:copy,ts:Date.now()},[copy.buffer]);
},33);
`;

// ── REACT COMPONENT ────────────────────────────────────────────
export function DavidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const canvas = canvasRef.current;
    if (!canvas || typeof Worker === "undefined") return;

    const ctx = canvas.getContext("2d")!;
    let W = (canvas.width  = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    let vigCache: CanvasGradient | null = null;

    const onResize = () => {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = window.innerHeight;
      vigCache = null;
    };
    window.addEventListener("resize", onResize);

    let hueBuf:  Float32Array | null = null;
    let charBuf: Float32Array | null = null;
    let prevBuf: Float32Array | null = null;
    let currBuf: Float32Array | null = null;
    let frameTs  = 0;
    let frameDur = 33;

    let paletteHue = 0.30;
    let paletteHueTs = 0;

    function readPaletteHue(): number {
      const now = Date.now();
      if (now - paletteHueTs < 1000) return paletteHue;
      paletteHueTs = now;
      try {
        const hex = getComputedStyle(document.documentElement)
          .getPropertyValue("--g1").trim();
        if (hex.length < 7) return paletteHue;
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
        if (d < 0.01) { paletteHue = 0; return paletteHue; }
        let h = 0;
        if      (max === r) h = (g - b) / d + (g < b ? 6 : 0);
        else if (max === g) h = (b - r) / d + 2;
        else                h = (r - g) / d + 4;
        paletteHue = h / 6;
      } catch { /* keep previous */ }
      return paletteHue;
    }

    const tile = new OffscreenCanvas(TW, TH);
    const tc   = tile.getContext("2d")!;
    tc.font         = `${CW}px "Courier New",monospace`;
    tc.textBaseline = "top";

    const bktX: number[][] = Array.from({ length: N_BKT }, () => []);
    const bktY: number[][] = Array.from({ length: N_BKT }, () => []);
    const bktC: string[][] = Array.from({ length: N_BKT }, () => []);

    function drawTile(timeAcc: number) {
      if (!currBuf || !hueBuf || !charBuf) return;

      // Per-cell brightness lerp: the key to smooth rotation at any speed
      const alpha = prevBuf
        ? Math.min(1, (performance.now() - frameTs) / frameDur)
        : 1;

      const ph = readPaletteHue();

      for (let i = 0; i < N_BKT; i++) {
        bktX[i].length = 0;
        bktY[i].length = 0;
        bktC[i].length = 0;
      }

      for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
          const i   = row * COLS + col;
          const vP  = prevBuf ? prevBuf[i] : currBuf[i];
          const v   = vP + (currBuf[i] - vP) * alpha;
          if (v < 0.02) continue;

          const vg2      = Math.pow(Math.min(1, v), 1.15);
          const drift    = (hueBuf[i] - 0.5) * 0.135;
          const warmCool = (vg2 - 0.5)       * 0.110;
          const hue = ((ph + drift + warmCool + timeAcc * 0.010) % 1 + 1) % 1;
          const hi  = Math.min(H_Q - 1, (hue * H_Q) | 0);
          const vi  = Math.min(V_Q - 1, (vg2 * V_Q) | 0);
          const bi  = hi * V_Q + vi;

          const cs = charBuf[i];
          let ch: string;
          if      (vg2 > 0.82) ch = HEAVY[ (cs * 8)  | 0];
          else if (vg2 > 0.55) ch = HEAVY[8  + ((cs * 10) | 0)];
          else if (vg2 > 0.30) ch = HEAVY[16 + ((cs * 8)  | 0)];
          else                 ch = LIGHT[ (cs * LIGHT.length) | 0];

          bktX[bi].push(col * CW);
          bktY[bi].push(row * CH);
          bktC[bi].push(ch);
        }
      }

      tc.clearRect(0, 0, TW, TH);
      for (let hi = 0; hi < H_Q; hi++) {
        for (let vi = 0; vi < V_Q; vi++) {
          const bi = hi * V_Q + vi;
          const xs = bktX[bi];
          if (!xs.length) continue;
          tc.fillStyle = `hsl(${(hi * 360 / H_Q) | 0},70%,${28 + vi * 6}%)`;
          const ys = bktY[bi], cs = bktC[bi];
          for (let j = 0; j < xs.length; j++) tc.fillText(cs[j], xs[j], ys[j]);
        }
      }
    }

    let offX = 0, offY = 0;
    const SPD_X = 32, SPD_Y = 20;
    let prevTs = 0, rafId = 0, timeAcc = 0, frameCount = 0;

    function loop(ts: number) {
      rafId = requestAnimationFrame(loop);
      const dt = Math.min(0.05, (ts - prevTs) / 1e3);
      prevTs = ts;
      timeAcc  += dt;
      frameCount++;

      // Render tile at 30fps — interpolation fills 60fps display smoothly
      if (frameCount % 2 === 0) drawTile(timeAcc);

      offX = (offX + dt * SPD_X) % TW;
      offY = (offY + dt * SPD_Y) % TH;

      ctx.clearRect(0, 0, W, H);

      const c0 = Math.floor(-offX / TW) - 1;
      const r0 = Math.floor(-offY / TH) - 1;
      const c1 = Math.ceil((W - offX) / TW) + 1;
      const r1 = Math.ceil((H - offY) / TH) + 1;
      for (let r = r0; r < r1; r++)
        for (let c = c0; c < c1; c++)
          ctx.drawImage(tile, c * TW + offX, r * TH + offY);

      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, 0, W, H);

      if (!vigCache) {
        vigCache = ctx.createRadialGradient(W/2, H/2, W*0.05, W/2, H/2, W*0.72);
        vigCache.addColorStop(0, "transparent");
        vigCache.addColorStop(1, "rgba(2,1,4,0.65)");
      }
      ctx.fillStyle = vigCache;
      ctx.fillRect(0, 0, W, H);
    }

    let startTimeout: ReturnType<typeof setTimeout>;
    let worker: Worker | null = null;
    let workerUrl = "";

    startTimeout = setTimeout(() => {
      rafId = requestAnimationFrame((ts) => { prevTs = ts; loop(ts); });

      const blob = new Blob([WORKER_SRC], { type: "application/javascript" });
      workerUrl  = URL.createObjectURL(blob);
      worker     = new Worker(workerUrl);

      worker.onmessage = ({ data }) => {
        if (data.type === "init") {
          hueBuf  = data.hueBuf  as Float32Array;
          charBuf = data.charBuf as Float32Array;
        } else if (data.type === "frame") {
          const now = performance.now();
          if (currBuf) {
            frameDur = Math.max(16, now - frameTs);
            prevBuf  = currBuf;
          }
          currBuf = data.valBuf as Float32Array;
          frameTs = now;
        }
      };
    }, 400);

    return () => {
      clearTimeout(startTimeout);
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      worker?.terminate();
      if (workerUrl) URL.revokeObjectURL(workerUrl);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position:      "fixed",
        inset:         0,
        width:         "100%",
        height:        "100%",
        zIndex:        0,
        pointerEvents: "none",
        display:       "block",
      }}
    />
  );
}
