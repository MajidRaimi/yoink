import type { ElementType, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type ContainerProps = {
  as?: ElementType;
  size?: "prose" | "wide";
  className?: string;
  children: ReactNode;
};

const widths: Readonly<Record<NonNullable<ContainerProps["size"]>, string>> = {
  prose: "max-w-3xl",
  wide: "max-w-7xl",
};

export const Container = ({ as: Tag = "div", size = "wide", className, children }: ContainerProps): React.JSX.Element => (
  <Tag className={cn("mx-auto w-full px-4 sm:px-6", widths[size], className)}>{children}</Tag>
);
