import { cn } from "@/lib/cn";
import styles from "./Card.module.css";
import type { ReactNode } from "react";

interface CardProps {
  variant?: "default" | "admin";
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function Card({ variant = "default", className, children, onClick, style }: CardProps) {
  return (
    <div
      className={cn(variant === "admin" ? styles.admin : styles.card, className)}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, style, children }: { className?: string; style?: React.CSSProperties; children: ReactNode }) {
  return <div className={cn(styles.header, className)} style={style}>{children}</div>;
}

export function CardTitle({ className, style, children }: { className?: string; style?: React.CSSProperties; children: ReactNode }) {
  return <div className={cn(styles.title, className)} style={style}>{children}</div>;
}

export function CardSub({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(styles.sub, className)}>{children}</div>;
}

export function CardActions({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn(styles.actions, className)}>{children}</div>;
}
