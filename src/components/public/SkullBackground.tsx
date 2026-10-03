"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { SkullBackgroundData } from "@/types";
import styles from "./SkullBackground.module.css";

export type SkullBackgroundMode = "off" | "poster" | "video";

const DESKTOP = "(min-width: 1024px) and (pointer: fine)";
const REDUCED = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const queries = [DESKTOP, REDUCED].map((q) => window.matchMedia(q));
  queries.forEach((m) => m.addEventListener("change", onChange));
  return () => queries.forEach((m) => m.removeEventListener("change", onChange));
}

function getMode(): SkullBackgroundMode {
  if (!window.matchMedia(DESKTOP).matches) return "off";
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
  return window.matchMedia(REDUCED).matches || saveData ? "poster" : "video";
}

// Mobile and touch devices get nothing (not a single byte is fetched); reduced motion / Save-Data get the poster.
export function useSkullBackgroundMode(): SkullBackgroundMode {
  return useSyncExternalStore(subscribe, getMode, () => "off");
}

export function SkullBackground({ data, mode }: { data: SkullBackgroundData; mode: SkullBackgroundMode }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onVisibility = () => {
      if (document.hidden) video.pause();
      else video.play().catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [mode, data.mp4]);

  if (mode === "off") return null;

  return (
    <div className={styles.bg} aria-hidden="true">
      {mode === "video" ? (
        <video
          key={data.mp4}
          ref={videoRef}
          className={styles.media}
          poster={data.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src={data.webm} type="video/webm" />
          <source src={data.mp4} type="video/mp4" />
        </video>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.media} src={data.poster} alt="" />
      )}
      {/* the render is grayscale; multiply tints it with the active palette */}
      <span className={styles.tint} />
    </div>
  );
}
