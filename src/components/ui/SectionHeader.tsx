import { cn } from "@/lib/cn";
import styles from "./SectionHeader.module.css";

interface SectionHeaderProps {
  variant?: "public" | "admin";
  className?: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

export function SectionHeader({
  variant = "public",
  className,
  children,
  style,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(variant === "admin" ? styles.admin : styles.header, className)}
      style={style}
    >
      {children}
    </div>
  );
}
