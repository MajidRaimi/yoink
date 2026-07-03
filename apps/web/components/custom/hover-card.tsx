"use client";

import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type HoverCardProps = {
  children: React.ReactNode;
  className?: string;
};

export const HoverCard = ({ children, className }: HoverCardProps) => (
  <motion.div
    whileHover={{ y: -3 }}
    transition={{ type: "spring", stiffness: 400, damping: 28 }}
    className={cn(
      "h-full rounded-2xl border border-hairline bg-surface transition-colors duration-300 hover:border-hairline-strong hover:bg-surface-2",
      className,
    )}
  >
    {children}
  </motion.div>
);
