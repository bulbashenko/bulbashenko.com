"use client";

import type { ReactNode } from "react";
import styles from "./WindowFrame.module.css";

interface Props {
  title: string;
  onTweaks: () => void;
  children: ReactNode;
}

export function WindowFrame({ title, onTweaks, children }: Props) {
  return (
    <div className={styles.win}>
      <div className={styles.winbar}>
        <span className={styles.title}>{title}</span>
        <div className={styles.btns}>
          <button className={styles.btn} title="Tweaks" onClick={onTweaks}>≡</button>
        </div>
      </div>
      <div className={styles.content} data-wincontent="true">
        {children}
      </div>
    </div>
  );
}
