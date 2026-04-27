import { cn } from "@/lib/cn";
import styles from "./Tag.module.css";

interface TagProps {
  variant?: "default" | "stack" | "stackAdmin";
  className?: string;
  children: React.ReactNode;
  onRemove?: () => void;
}

export function Tag({ variant = "default", className, children, onRemove }: TagProps) {
  const cls =
    variant === "stack" ? styles.stack :
    variant === "stackAdmin" ? styles.stackAdmin :
    styles.tag;

  return (
    <span className={cn(cls, className)}>
      {children}
      {onRemove && <button type="button" onClick={onRemove}>×</button>}
    </span>
  );
}
