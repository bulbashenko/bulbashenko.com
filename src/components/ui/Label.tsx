import { cn } from "@/lib/cn";
import styles from "./Label.module.css";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export function Label({ className, ...props }: LabelProps) {
  return <label className={cn(styles.label, className)} {...props} />;
}
