"use client";

import { cn } from "@/lib/cn";
import styles from "./TweaksPanel.module.css";

export interface TweakState {
  scanline: number;
  glow: number;
  palette: "green" | "amber" | "blue" | "white";
  pincushion: boolean;
  bg: boolean;
  bgDim: number;
}

interface Props {
  open: boolean;
  tweaks: TweakState;
  onChange: (t: TweakState) => void;
}

export function TweaksPanel({ open, tweaks, onChange }: Props) {
  const update = (key: keyof TweakState, value: string | number) =>
    onChange({ ...tweaks, [key]: value });

  return (
    <div className={cn(styles.panel, open && styles.open)}>
      <div className={styles.title}>TWEAKS</div>

      <div className={styles.row}>
        <label className={styles.rowLabel}>SCANLINE INTENSITY</label>
        <input
          className={styles.slider}
          type="range" min={0} max={20}
          value={tweaks.scanline}
          onChange={(e) => update("scanline", +e.target.value)}
        />
      </div>

      <div className={styles.row}>
        <label className={styles.rowLabel}>LCD GLOW</label>
        <input
          className={styles.slider}
          type="range" min={0} max={100}
          value={tweaks.glow}
          onChange={(e) => update("glow", +e.target.value)}
        />
      </div>

      <div className={styles.row}>
        <label className={styles.rowLabel}>PINCUSHION</label>
        <button
          className={cn(styles.toggle, tweaks.pincushion && styles.on)}
          onClick={() => onChange({ ...tweaks, pincushion: !tweaks.pincushion })}
        >
          {tweaks.pincushion ? "ON" : "OFF"}
        </button>
      </div>

      <div className={styles.row}>
        <label className={styles.rowLabel}>BACKGROUND</label>
        <button
          className={cn(styles.toggle, tweaks.bg && styles.on)}
          onClick={() => onChange({ ...tweaks, bg: !tweaks.bg })}
        >
          {tweaks.bg ? "ON" : "OFF"}
        </button>
      </div>

      <div className={styles.row}>
        <label className={styles.rowLabel}>BG DIM</label>
        <input
          className={styles.slider}
          type="range" min={0} max={100}
          value={tweaks.bgDim}
          disabled={!tweaks.bg}
          onChange={(e) => update("bgDim", +e.target.value)}
        />
      </div>

      <div className={styles.row}>
        <label className={styles.rowLabel}>COLOR PALETTE</label>
        <select
          className={styles.select}
          value={tweaks.palette}
          onChange={(e) => update("palette", e.target.value)}
        >
          <option value="green">GREEN LCD (CASIO)</option>
          <option value="amber">AMBER LCD (WALKMAN)</option>
          <option value="blue">BLUE LCD</option>
          <option value="white">WHITE SCREEN</option>
        </select>
      </div>
    </div>
  );
}
