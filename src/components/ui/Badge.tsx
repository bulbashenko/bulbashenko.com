import { cn } from "@/lib/cn";
import styles from "./Badge.module.css";

interface BadgeProps {
  variant?: "default" | "published";
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export function Badge({ variant = "default", className, style, children }: BadgeProps) {
  return (
    <span className={cn(styles.badge, variant === "published" && styles.published, className)} style={style}>
      {children}
    </span>
  );
}
