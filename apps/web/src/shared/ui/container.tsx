import type { ElementType, ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

export type ContainerProps = {
  as?: ElementType;
  size?: "prose" | "default" | "wide";
  className?: string;
  children: ReactNode;
};

const widths: Readonly<Record<NonNullable<ContainerProps["size"]>, string>> = {
  prose: "max-w-3xl",
  default: "max-w-6xl",
  wide: "max-w-7xl",
};

export const Container = ({ as: Tag = "div", size = "default", className, children }: ContainerProps): React.JSX.Element => (
  <Tag className={cn("mx-auto w-full px-4 sm:px-6", widths[size], className)}>{children}</Tag>
);
