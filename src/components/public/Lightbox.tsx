"use client";

import { useEffect } from "react";

export interface LightboxItem {
  src: string;
  caption?: string | null;
}

interface Props {
  item: LightboxItem | null;
  onClose: () => void;
}

export function Lightbox({ item, onClose }: Props) {
  useEffect(() => {
    if (!item) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [item, onClose]);

  function download() {
    if (!item) return;
    const a = document.createElement("a");
    a.href = item.src;
    a.download = item.src.split("/").pop() || "image";
    a.target = "_blank";
    a.click();
  }

  return (
    <div
      className={`lightbox${item ? " on" : ""}`}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="lb-toolbar">
        <button className="lb-close" onClick={onClose}>✕ CLOSE</button>
        {item && (
          <button className="lb-download" onClick={download}>↓ DOWNLOAD</button>
        )}
      </div>
      {item && (
        <>
          <img src={item.src} alt={item.caption || ""} />
          {item.caption && <div className="lb-caption">{item.caption}</div>}
        </>
      )}
    </div>
  );
}
