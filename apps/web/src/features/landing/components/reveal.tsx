import type { ReactNode } from "react";
import styles from "@/features/landing/components/reveal.module.css";
import { cn } from "@/shared/lib/cn";

export type RevealProps = {
  children: ReactNode;
  className?: string;
};

export const Reveal = ({ children, className }: RevealProps): React.JSX.Element => (
  <div className={cn(styles.reveal, className)}>{children}</div>
);
