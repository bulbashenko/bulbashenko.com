import { cn } from "@/lib/cn";
import styles from "./Button.module.css";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger";
  size?: "sm" | "md";
}

export function Button({
  variant = "default",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        styles.btn,
        variant === "primary" && styles.primary,
        variant === "danger" && styles.danger,
        size === "sm" && styles.sm,
        className
      )}
      {...props}
    />
  );
}
