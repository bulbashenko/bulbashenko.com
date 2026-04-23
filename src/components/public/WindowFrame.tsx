"use client";

import type { ReactNode } from "react";

interface Props {
  title: string;
  onTweaks: () => void;
  children: ReactNode;
}

export function WindowFrame({ title, onTweaks, children }: Props) {
  return (
    <div className="win">
      <div className="winbar">
        <span className="win-title">{title}</span>
        <div className="win-btns">
          <button className="win-btn" title="Tweaks" onClick={onTweaks}>≡</button>
        </div>
      </div>
      {children}
    </div>
  );
}
