"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const VIEWPORT = { once: true, margin: "0px 0px -80px 0px" } as const;

const CONTAINER_TAGS = { div: motion.div, ol: motion.ol, ul: motion.ul } as const;
const ITEM_TAGS = { div: motion.div, li: motion.li } as const;

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

type FadeUpProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
};

export const FadeUp = ({ children, className, delay = 0 }: FadeUpProps) => {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial={reduce ? false : { opacity: 0, y: 24 }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
};

type StaggerProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
  as?: keyof typeof CONTAINER_TAGS;
};

export const Stagger = ({
  children,
  className,
  stagger = 0.09,
  delayChildren = 0.04,
  as = "div",
}: StaggerProps) => {
  const reduce = useReducedMotion();
  const Container = CONTAINER_TAGS[as];

  return (
    <Container
      className={cn(className)}
      initial={reduce ? false : "hidden"}
      whileInView={reduce ? undefined : "visible"}
      viewport={VIEWPORT}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren } } }}
    >
      {children}
    </Container>
  );
};

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
  as?: keyof typeof ITEM_TAGS;
  "aria-hidden"?: boolean;
};

export const StaggerItem = ({
  children,
  className,
  as = "div",
  "aria-hidden": ariaHidden,
}: StaggerItemProps) => {
  const reduce = useReducedMotion();
  const Item = ITEM_TAGS[as];

  return (
    <Item
      aria-hidden={ariaHidden}
      className={cn(className)}
      initial={reduce ? false : undefined}
      variants={reduce ? undefined : itemVariants}
    >
      {children}
    </Item>
  );
};
