"use client";

import { useEffect } from "react";

interface Props {
  src: string | null;
  onClose: () => void;
}

export function Lightbox({ src, onClose }: Props) {
  useEffect(() => {
    if (!src) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [src, onClose]);

  return (
    <div
      className={`lightbox${src ? " on" : ""}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <button className="lb-close" onClick={onClose}>✕ CLOSE</button>
      {src && <img src={src} alt="" />}
    </div>
  );
}
