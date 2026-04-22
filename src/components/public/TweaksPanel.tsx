"use client";

interface TweakState {
  scanline: number;
  glow: number;
  palette: "green" | "amber" | "blue" | "white";
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
    <div className={`tweaks-panel${open ? " on" : ""}`}>
      <div className="tw-title">TWEAKS</div>

      <div className="tw-row">
        <label className="tw-label">SCANLINE INTENSITY</label>
        <input
          className="tw-slider"
          type="range" min={0} max={20}
          value={tweaks.scanline}
          onChange={(e) => update("scanline", +e.target.value)}
        />
      </div>

      <div className="tw-row">
        <label className="tw-label">LCD GLOW</label>
        <input
          className="tw-slider"
          type="range" min={0} max={100}
          value={tweaks.glow}
          onChange={(e) => update("glow", +e.target.value)}
        />
      </div>

      <div className="tw-row">
        <label className="tw-label">COLOR PALETTE</label>
        <select
          className="tw-select"
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
