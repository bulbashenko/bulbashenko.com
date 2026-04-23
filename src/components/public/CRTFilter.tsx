"use client";
import { useEffect } from "react";

// neutral displacement = no movement (R=128, G=128 → 0 offset)
const NEUTRAL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3Crect width='1' height='1' fill='rgb(128,128,0)'/%3E%3C/svg%3E";

// Exact formula from the CodePen WebGL shader:
//   vec2 center = uvPosition - vec2(0.5);
//   float factor = dot(center, center) * 0.2;
//   vec2 distortedUV = uvPosition + center * (1.0 - factor) * factor;
const K = 0.07;
const SCALE = 0.03; // objectBoundingBox units; covers max displacement ≈ 0.016

export function CRTFilter() {
  useEffect(() => {
    const SIZE = 512;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = SIZE;
    const ctx = canvas.getContext("2d")!;
    const imgData = ctx.createImageData(SIZE, SIZE);

    for (let py = 0; py < SIZE; py++) {
      for (let px = 0; px < SIZE; px++) {
        const nx = px / (SIZE - 1);
        const ny = py / (SIZE - 1);
        const cx = nx - 0.5;
        const cy = ny - 0.5;
        const factor = (cx * cx + cy * cy) * K;
        const dx = cx * (1 - factor) * factor; // displacement in BBox units
        const dy = cy * (1 - factor) * factor;
        const r = Math.max(0, Math.min(255, Math.round((0.5 + dx / SCALE) * 255)));
        const g = Math.max(0, Math.min(255, Math.round((0.5 + dy / SCALE) * 255)));
        const i = (py * SIZE + px) * 4;
        imgData.data[i]     = r;
        imgData.data[i + 1] = g;
        imgData.data[i + 2] = 0;
        imgData.data[i + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    document.getElementById("crt-pin-map")?.setAttribute("href", canvas.toDataURL());
  }, []);

  return (
    <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}>
      <defs>
        <filter
          id="crt-pincushion"
          x="-3%" y="-3%" width="106%" height="106%"
          primitiveUnits="objectBoundingBox"
          colorInterpolationFilters="sRGB"
        >
          <feImage
            id="crt-pin-map"
            href={NEUTRAL}
            x="0" y="0" width="1" height="1"
            preserveAspectRatio="none"
            result="dmap"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="dmap"
            scale="0.03"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
