import { useEffect } from "react";
import { Button } from "./button";

export const useEscapeKey = (onEscape: () => void) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      onEscape();
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [onEscape]);
};

type ConfirmDialogProps = {
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export const ConfirmDialog = ({ title, body, confirmLabel, danger = false, onConfirm, onCancel }: ConfirmDialogProps) => {
  useEscapeKey(onCancel);
  return (
    <div
      className="absolute inset-0 z-40 flex items-center justify-center bg-glass-strong backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="rise mx-7 w-full rounded-xl border border-hairline-strong bg-glass p-4"
        role="alertdialog"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-sans text-[14px] font-medium text-foreground">{title}</h2>
        <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{body}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant={danger ? "danger" : "primary"} autoFocus onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
