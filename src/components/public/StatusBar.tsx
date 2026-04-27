"use client";

import { useEffect, useState } from "react";
import styles from "./StatusBar.module.css";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const pad = (x: number) => String(x).padStart(2, "0");

export function StatusBar() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    function tick() {
      const n = new Date();
      setTime(`${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`);
      setDate(`${DAYS[n.getDay()]} ${pad(n.getDate())} ${MONTHS[n.getMonth()]} ${n.getFullYear()}`);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className={styles.statusbar}>
      <span className={styles.logo}>BULBASHENKO.COM</span>
      <div className={styles.right}>
        <span className={styles.date}>{date}</span>
        <span className={styles.clock}>{time}</span>
      </div>
    </div>
  );
}
