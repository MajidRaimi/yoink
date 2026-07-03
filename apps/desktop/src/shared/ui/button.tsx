import type { ComponentPropsWithRef } from "react";
import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "danger";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand font-medium text-on-brand transition-opacity hover:opacity-85",
  secondary: "border border-hairline-strong bg-surface text-foreground transition-colors hover:border-brand",
  danger: "border border-[#f87171]/30 bg-surface text-[#f87171] transition-colors hover:border-[#f87171]/60",
};

type ButtonProps = ComponentPropsWithRef<"button"> & { variant?: ButtonVariant };

export const Button = ({ variant = "primary", type = "button", className, ...props }: ButtonProps) => (
  <button
    type={type}
    className={cn(
      "rounded-full px-4 py-1.5 text-[13px] disabled:pointer-events-none disabled:opacity-50",
      variantClasses[variant],
      className,
    )}
    {...props}
  />
);

type IconButtonProps = ComponentPropsWithRef<"button"> & { label: string };

export const IconButton = ({ label, type = "button", className, ...props }: IconButtonProps) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    className={cn(
      "rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-foreground",
      className,
    )}
    {...props}
  />
);
